-- =============================================================================
-- DARADIK — SECURITY HARDENING MIGRATION (P0 + P1)
--
-- Migrasi BARU (tidak mengubah riwayat supabase_reports_migration.sql yang mungkin
-- sudah diterapkan di produksi). Idempotent: aman dijalankan ulang.
--
-- Prasyarat arsitektur (lihat SECURITY_AUDIT_REPORT.md):
--   * Seluruh akses publik (kirim laporan, lacak, balas, bukti) berjalan MELALUI
--     backend DARADIK (server/) yang memegang SUPABASE_SERVICE_ROLE_KEY. Role anon /
--     authenticated TIDAK lagi memiliki akses tabel maupun RPC laporan publik.
--   * Petugas Dinas memakai JWT Supabase Auth; hak akses ditentukan oleh tabel
--     public.officer_profiles (sumber otoritatif) di dalam fungsi RPC.
--   * Token pelacakan 160-bit dibuat di backend; database hanya menyimpan hash SHA-256.
--   * Teks sensitif dienkripsi AES-256-GCM oleh backend (envelope 'dv1.…'); database
--     MENOLAK plaintext pada kolom terenkripsi.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. KOLOM TOKEN AKSES + TABEL PENDUKUNG KEAMANAN
-- -----------------------------------------------------------------------------
ALTER TABLE public.anonymous_reports
  ADD COLUMN IF NOT EXISTS access_token_hash BYTEA,
  ADD COLUMN IF NOT EXISTS access_token_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_token_revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_token_rotations INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.anonymous_reports.access_token_hash IS
  'SHA-256 dari token pelacakan 160-bit. Token mentah TIDAK pernah disimpan.';
COMMENT ON COLUMN public.anonymous_reports.ticket_code IS
  'Nomor tiket TAMPILAN (non-rahasia). Autentikasi memakai access_token_hash.';

CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  bucket       TEXT        NOT NULL,
  key_hash     TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  hits         INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, key_hash)
);

CREATE TABLE IF NOT EXISTS public.security_used_nonces (
  nonce      TEXT        PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_security_used_nonces_expires
  ON public.security_used_nonces (expires_at);

-- -----------------------------------------------------------------------------
-- 2. HAPUS FUNGSI PUBLIK LAMA YANG TIDAK AMAN (semua overload)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'submit_public_report',
        'submit_public_report_encrypted',
        'get_public_report_tracking',
        'submit_reporter_additional_info',
        'submit_reporter_additional_info_encrypted',
        'officer_get_reports_queue',
        'officer_get_report_detail_bundle'
      )
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. HELPER INTERNAL (schema private — tidak diekspos PostgREST)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.constant_time_equals(a BYTEA, b BYTEA)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_diff INT;
  v_len  INT;
  i      INT;
BEGIN
  IF a IS NULL OR b IS NULL THEN
    RETURN FALSE;
  END IF;
  v_len := GREATEST(length(a), length(b));
  v_diff := length(a) # length(b);
  FOR i IN 0 .. v_len - 1 LOOP
    v_diff := v_diff | (
      (CASE WHEN i < length(a) THEN get_byte(a, i) ELSE 0 END)
      #
      (CASE WHEN i < length(b) THEN get_byte(b, i) ELSE 0 END)
    );
  END LOOP;
  RETURN v_diff = 0;
END;
$$;

-- Mengembalikan id laporan HANYA jika nomor tiket + hash token cocok, belum dicabut.
-- Selalu menjalankan perbandingan (waktu seragam) dan tidak membedakan sebab gagal.
CREATE OR REPLACE FUNCTION private.verify_report_token(p_ticket_code TEXT, p_token_hash BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_ticket TEXT := upper(btrim(coalesce(p_ticket_code, '')));
  v_dummy  BYTEA := '\x0000000000000000000000000000000000000000000000000000000000000000'::bytea;
  v_row    RECORD;
  v_ok     BOOLEAN;
BEGIN
  IF v_ticket !~ '^CHK-[0-9]{4}-[0-9A-F]{8}-[A-Z]{3}$'
     OR p_token_hash IS NULL
     OR length(p_token_hash) <> 32 THEN
    PERFORM private.constant_time_equals(v_dummy, v_dummy);
    RETURN NULL;
  END IF;

  SELECT ar.id, ar.access_token_hash, ar.access_token_revoked_at
  INTO v_row
  FROM public.anonymous_reports ar
  WHERE ar.ticket_code = v_ticket;

  IF NOT FOUND OR v_row.access_token_hash IS NULL THEN
    PERFORM private.constant_time_equals(v_dummy, p_token_hash);
    RETURN NULL;
  END IF;

  v_ok := private.constant_time_equals(v_row.access_token_hash, p_token_hash);
  IF NOT v_ok OR v_row.access_token_revoked_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_row.id;
END;
$$;

-- Menyaring metadata lampiran: hanya kunci yang dikenal, tanpa 'url', path divalidasi ketat.
CREATE OR REPLACE FUNCTION private.sanitize_attachments(p_att JSONB, p_max INT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_out JSONB;
BEGIN
  IF p_att IS NULL OR jsonb_typeof(p_att) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;
  IF jsonb_array_length(p_att) > p_max THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Jumlah lampiran melebihi batas maksimum.';
  END IF;

  SELECT coalesce(jsonb_agg(
           jsonb_build_object(
             'name',          left(coalesce(t.elem ->> 'name', 'Berkas Lampiran'), 120),
             'sizeFormatted', left(coalesce(t.elem ->> 'sizeFormatted', '-'), 20),
             'storagePath',   nullif(btrim(coalesce(t.elem ->> 'storagePath', '')), ''),
             'mimeType',      left(coalesce(t.elem ->> 'mimeType', ''), 60),
             'uploadedAt',    left(coalesce(t.elem ->> 'uploadedAt', ''), 40)
           ) ORDER BY t.ord), '[]'::jsonb)
  INTO v_out
  FROM jsonb_array_elements(p_att) WITH ORDINALITY AS t(elem, ord)
  WHERE jsonb_typeof(t.elem) = 'object';

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_out) e
    WHERE (
      (e ->> 'storagePath') IS NULL
      AND coalesce(e ->> 'sizeFormatted', '') <> 'Referensi Data'
    ) OR (
      (e ->> 'storagePath') IS NOT NULL
      AND (e ->> 'storagePath') !~ '^(initial|followup)/[0-9a-f]{36}\.(jpg|png|webp|pdf)$'
    )
  ) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Jalur berkas lampiran tidak valid.';
  END IF;

  RETURN v_out;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. RPC LAYANAN (HANYA service_role / backend)
-- -----------------------------------------------------------------------------

-- 4A. Kirim laporan baru (payload sudah dienkripsi backend; token hanya hash)
CREATE OR REPLACE FUNCTION public.svc_submit_report(
  p_id TEXT,
  p_token_hash BYTEA,
  p_school_id TEXT,
  p_school_name TEXT,
  p_school_npsn TEXT,
  p_kabupaten TEXT,
  p_kecamatan TEXT,
  p_category TEXT,
  p_requester_role TEXT,
  p_notes_encrypted TEXT,
  p_attachments JSONB,
  p_ocr_text_encrypted TEXT,
  p_ocr_bosp_fact_encrypted TEXT,
  p_encryption_algorithm TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_envelope CONSTANT TEXT := '^dv1\.[A-Za-z0-9_-]{1,16}\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$';
  v_now TIMESTAMPTZ := clock_timestamp();
  v_year TEXT := EXTRACT(YEAR FROM clock_timestamp() AT TIME ZONE 'Asia/Jakarta')::TEXT;
  v_school RECORD;
  v_npsn TEXT := btrim(coalesce(p_school_npsn, ''));
  v_name TEXT;
  v_school_id TEXT;
  v_kab TEXT;
  v_kec TEXT;
  v_reg TEXT;
  v_ticket TEXT;
  v_att JSONB;
  v_attempts INT := 0;
BEGIN
  IF p_id IS NULL OR p_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Identitas laporan tidak valid.';
  END IF;
  IF p_token_hash IS NULL OR length(p_token_hash) <> 32 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Token akses tidak valid.';
  END IF;
  IF v_npsn !~ '^[0-9]{6,12}$' OR btrim(coalesce(p_school_name, '')) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Sekolah tujuan laporan tidak valid.';
  END IF;
  IF btrim(coalesce(p_category, '')) = '' OR char_length(p_category) > 300 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Kategori laporan tidak valid.';
  END IF;
  IF btrim(coalesce(p_requester_role, '')) = '' OR char_length(p_requester_role) > 120 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Pihak yang meminta tidak valid.';
  END IF;
  IF p_notes_encrypted IS NULL OR p_notes_encrypted !~ c_envelope OR char_length(p_notes_encrypted) > 30000 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Isi laporan harus dikirim dalam format terenkripsi.';
  END IF;
  IF p_ocr_text_encrypted IS NOT NULL
     AND (p_ocr_text_encrypted !~ c_envelope OR char_length(p_ocr_text_encrypted) > 30000) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Teks OCR harus dikirim dalam format terenkripsi.';
  END IF;
  IF p_ocr_bosp_fact_encrypted IS NOT NULL
     AND (p_ocr_bosp_fact_encrypted !~ c_envelope OR char_length(p_ocr_bosp_fact_encrypted) > 30000) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Catatan OCR harus dikirim dalam format terenkripsi.';
  END IF;

  v_att := private.sanitize_attachments(p_attachments, 5);

  SELECT s.id, s.name, s.kabupaten, s.kecamatan
  INTO v_school
  FROM public.schools_all s
  WHERE s.npsn = v_npsn
  LIMIT 1;

  IF FOUND THEN
    v_school_id := v_school.id;
    v_name := v_school.name;
    v_kab := v_school.kabupaten;
    v_kec := v_school.kecamatan;
  ELSE
    v_school_id := left(coalesce(nullif(btrim(p_school_id), ''), v_npsn), 120);
    v_name := left(btrim(p_school_name), 200);
    v_kab := left(coalesce(nullif(btrim(p_kabupaten), ''), 'Data belum tersedia'), 120);
    v_kec := left(coalesce(nullif(btrim(p_kecamatan), ''), 'Data belum tersedia'), 120);
  END IF;

  v_reg := upper(regexp_replace(v_kab, '^(KAB\.|KABUPATEN|KOTA)\s*', '', 'i'));
  v_reg := upper(regexp_replace(v_reg, '[^A-Z]', '', 'g'));
  v_reg := rpad(substring(coalesce(nullif(v_reg, ''), 'NAS') FROM 1 FOR 3), 3, 'X');

  LOOP
    v_attempts := v_attempts + 1;
    v_ticket := 'CHK-' || v_year || '-' ||
                upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8)) || '-' || v_reg;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.anonymous_reports WHERE ticket_code = v_ticket);
    IF v_attempts > 25 THEN
      RAISE EXCEPTION 'INTERNAL: Gagal menerbitkan nomor tiket unik.';
    END IF;
  END LOOP;

  INSERT INTO public.anonymous_reports (
    id, ticket_code, school_id, school_name, school_npsn, kabupaten, kecamatan,
    category, requester_role, notes_encrypted, encryption_algorithm, status,
    waiting_additional_info, attachment_count, attachments_json,
    ocr_text, ocr_bosp_fact,
    access_token_hash, access_token_issued_at,
    created_at, updated_at, version
  ) VALUES (
    p_id, v_ticket, v_school_id, v_name, v_npsn, v_kab, v_kec,
    btrim(p_category), btrim(p_requester_role), p_notes_encrypted,
    left(coalesce(nullif(btrim(p_encryption_algorithm), ''), 'AES-256-GCM/dv1'), 60), 'QUEUED',
    FALSE, jsonb_array_length(v_att), v_att,
    p_ocr_text_encrypted, p_ocr_bosp_fact_encrypted,
    p_token_hash, v_now,
    v_now, v_now, 1
  );

  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
  ) VALUES
    (p_id, NULL, 'SUBMITTED', 'Sistem DARADIK',
     'Laporan berhasil dikirim dan diterima oleh sistem DARADIK.', FALSE, v_now),
    (p_id, 'SUBMITTED', 'QUEUED', 'Sistem Antrean Dinas Pendidikan',
     'Laporan masuk ke antrean Dinas Pendidikan dan menunggu pemeriksaan petugas.', FALSE,
     v_now + INTERVAL '1 millisecond');

  RETURN jsonb_build_object(
    'ticket_code', v_ticket,
    'school_name', v_name,
    'school_npsn', v_npsn,
    'category', btrim(p_category),
    'status', 'QUEUED',
    'created_at', v_now
  );
END;
$$;

-- 4B. Verifikasi akses (id laporan hanya untuk backend; tidak pernah diteruskan ke publik)
CREATE OR REPLACE FUNCTION public.svc_verify_report_access(p_ticket_code TEXT, p_token_hash BYTEA)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id TEXT := private.verify_report_token(p_ticket_code, p_token_hash);
  v_row RECORD;
BEGIN
  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT ar.id, ar.ticket_code, ar.status, ar.waiting_additional_info
  INTO v_row
  FROM public.anonymous_reports ar
  WHERE ar.id = v_id;
  RETURN jsonb_build_object(
    'id', v_row.id,
    'ticket_code', v_row.ticket_code,
    'status', v_row.status,
    'waiting_additional_info', v_row.waiting_additional_info
  );
END;
$$;

-- 4C. Pelacakan publik: hanya data yang boleh dilihat pelapor (tanpa catatan internal,
--     tanpa nama petugas, tanpa OCR, tanpa alasan internal melewati pemeriksaan).
CREATE OR REPLACE FUNCTION public.svc_get_report_tracking(p_ticket_code TEXT, p_token_hash BYTEA)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id TEXT := private.verify_report_token(p_ticket_code, p_token_hash);
  v_report public.anonymous_reports%ROWTYPE;
  v_history JSONB;
  v_messages JSONB;
BEGIN
  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_report FROM public.anonymous_reports WHERE id = v_id;

  SELECT coalesce(jsonb_agg(
           jsonb_build_object(
             'id', h.id,
             'previous_status', h.previous_status,
             'new_status', h.new_status,
             'actor_label', CASE
               WHEN h.changed_by_name ILIKE 'Sistem%' THEN h.changed_by_name
               WHEN h.changed_by_name ILIKE 'Pelapor%' THEN 'Pelapor Anonim'
               ELSE 'Petugas Dinas Pendidikan'
             END,
             'note', h.note,
             'created_at', h.created_at
           ) ORDER BY h.created_at ASC), '[]'::jsonb)
  INTO v_history
  FROM public.report_status_history h
  WHERE h.report_id = v_report.id AND h.is_internal = FALSE;

  SELECT coalesce(jsonb_agg(
           jsonb_build_object(
             'id', m.id,
             'sender_type', m.sender_type,
             'message', m.message,
             'attachments_json', m.attachments_json,
             'created_at', m.created_at
           ) ORDER BY m.created_at ASC), '[]'::jsonb)
  INTO v_messages
  FROM public.report_messages m
  WHERE m.report_id = v_report.id;

  RETURN jsonb_build_object(
    'report', jsonb_build_object(
      'id', v_report.id,
      'ticket_code', v_report.ticket_code,
      'school_name', v_report.school_name,
      'school_npsn', v_report.school_npsn,
      'kabupaten', v_report.kabupaten,
      'kecamatan', v_report.kecamatan,
      'category', v_report.category,
      'requester_role', v_report.requester_role,
      'notes_encrypted', v_report.notes_encrypted,
      'status', v_report.status,
      'waiting_additional_info', v_report.waiting_additional_info,
      'is_forwarded', v_report.is_forwarded,
      'forwarded_to', v_report.forwarded_to,
      'rejection_reason', v_report.rejection_reason,
      'resolution_outcome', v_report.resolution_outcome,
      'public_resolution_note', v_report.public_resolution_note,
      'field_inspection_conducted', v_report.field_inspection_conducted,
      'attachment_count', v_report.attachment_count,
      'attachments_json', v_report.attachments_json,
      'created_at', v_report.created_at,
      'updated_at', v_report.updated_at,
      'opened_at', v_report.opened_at,
      'resolved_at', v_report.resolved_at
    ),
    'history', v_history,
    'messages', v_messages
  );
END;
$$;

-- 4D. Balasan / bukti tambahan dari pelapor (pesan sudah terenkripsi)
CREATE OR REPLACE FUNCTION public.svc_add_reporter_message(
  p_ticket_code TEXT,
  p_token_hash BYTEA,
  p_message_encrypted TEXT,
  p_attachments JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_envelope CONSTANT TEXT := '^dv1\.[A-Za-z0-9_-]{1,16}\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$';
  v_id TEXT := private.verify_report_token(p_ticket_code, p_token_hash);
  v_now TIMESTAMPTZ := clock_timestamp();
  v_att JSONB;
  v_report public.anonymous_reports%ROWTYPE;
  v_merged JSONB;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Laporan tidak ditemukan atau kode akses tidak valid.';
  END IF;
  IF p_message_encrypted IS NULL OR p_message_encrypted !~ c_envelope
     OR char_length(p_message_encrypted) > 30000 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Pesan harus dikirim dalam format terenkripsi.';
  END IF;

  v_att := private.sanitize_attachments(p_attachments, 3);

  SELECT * INTO v_report FROM public.anonymous_reports WHERE id = v_id FOR UPDATE;

  IF v_report.status IN ('COMPLETED', 'TIDAK_DAPAT_DITINDAKLANJUTI') THEN
    RAISE EXCEPTION 'INVALID_STATE: Pemeriksaan laporan ini telah selesai sehingga tidak dapat menerima balasan baru.';
  END IF;
  IF v_report.status <> 'PEMERIKSAAN_LANJUTAN' AND v_report.waiting_additional_info = FALSE THEN
    RAISE EXCEPTION 'INVALID_STATE: Pengiriman informasi tambahan hanya dibuka saat petugas memintanya pada tahap Pemeriksaan Lanjutan.';
  END IF;
  IF (SELECT count(*) FROM public.report_messages
      WHERE report_id = v_id AND sender_type = 'REPORTER') >= 100 THEN
    RAISE EXCEPTION 'INVALID_STATE: Batas jumlah pesan pelapor untuk laporan ini telah tercapai.';
  END IF;

  INSERT INTO public.report_messages (report_id, sender_type, sender_label, message, attachments_json, created_at)
  VALUES (v_id, 'REPORTER', 'Pelapor Anonim', p_message_encrypted, v_att, v_now);

  v_merged := (CASE WHEN jsonb_typeof(v_report.attachments_json) = 'array'
                    THEN v_report.attachments_json ELSE '[]'::jsonb END) || v_att;

  UPDATE public.anonymous_reports
  SET waiting_additional_info = FALSE,
      attachments_json = v_merged,
      attachment_count = jsonb_array_length(v_merged),
      updated_at = v_now,
      version = version + 1
  WHERE id = v_id;

  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
  ) VALUES (
    v_id, v_report.status, v_report.status, 'Pelapor Anonim',
    'Pelapor mengirimkan informasi atau bukti tambahan.', FALSE, v_now
  );

  RETURN jsonb_build_object('success', TRUE, 'updated_at', v_now);
END;
$$;

-- 4E. Otorisasi bukti untuk pelapor: path harus tercatat pada laporan MILIKNYA
CREATE OR REPLACE FUNCTION public.svc_authorize_report_evidence(
  p_ticket_code TEXT, p_token_hash BYTEA, p_storage_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id TEXT := private.verify_report_token(p_ticket_code, p_token_hash);
BEGIN
  IF v_id IS NULL OR p_storage_path IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.anonymous_reports ar,
           jsonb_array_elements(CASE WHEN jsonb_typeof(ar.attachments_json) = 'array'
                                     THEN ar.attachments_json ELSE '[]'::jsonb END) e
    WHERE ar.id = v_id AND e ->> 'storagePath' = p_storage_path
  ) OR EXISTS (
    SELECT 1 FROM public.report_messages m,
           jsonb_array_elements(CASE WHEN jsonb_typeof(m.attachments_json) = 'array'
                                     THEN m.attachments_json ELSE '[]'::jsonb END) e
    WHERE m.report_id = v_id AND e ->> 'storagePath' = p_storage_path
  );
END;
$$;

-- 4F. Rotasi token oleh pemegang token lama (token lama langsung tidak berlaku)
CREATE OR REPLACE FUNCTION public.svc_rotate_report_token(
  p_ticket_code TEXT, p_old_hash BYTEA, p_new_hash BYTEA
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id TEXT := private.verify_report_token(p_ticket_code, p_old_hash);
BEGIN
  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;
  IF p_new_hash IS NULL OR length(p_new_hash) <> 32 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Token baru tidak valid.';
  END IF;
  UPDATE public.anonymous_reports
  SET access_token_hash = p_new_hash,
      access_token_issued_at = clock_timestamp(),
      access_token_revoked_at = NULL,
      access_token_rotations = access_token_rotations + 1
  WHERE id = v_id;
  RETURN TRUE;
END;
$$;

-- 4G. Pembatasan laju konsisten antar-instance (counter atomik di PostgreSQL)
CREATE OR REPLACE FUNCTION public.svc_rate_limit(
  p_bucket TEXT,
  p_key_hash TEXT,
  p_max INT,
  p_window_seconds INT,
  p_increment BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hits INT;
  v_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_bucket IS NULL OR p_bucket !~ '^[a-z0-9_:-]{1,60}$'
     OR p_key_hash IS NULL OR p_key_hash !~ '^[A-Za-z0-9_-]{8,128}$'
     OR p_max IS NULL OR p_max < 1 OR p_max > 100000
     OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 604800 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Parameter pembatasan laju tidak valid.';
  END IF;

  IF p_increment THEN
    INSERT INTO public.security_rate_limits AS rl (bucket, key_hash, window_start, hits)
    VALUES (p_bucket, p_key_hash, v_now, 1)
    ON CONFLICT (bucket, key_hash) DO UPDATE
    SET hits = CASE WHEN rl.window_start < v_now - make_interval(secs => p_window_seconds)
                    THEN 1 ELSE rl.hits + 1 END,
        window_start = CASE WHEN rl.window_start < v_now - make_interval(secs => p_window_seconds)
                            THEN v_now ELSE rl.window_start END
    RETURNING rl.hits, rl.window_start INTO v_hits, v_start;
  ELSE
    SELECT rl.hits, rl.window_start INTO v_hits, v_start
    FROM public.security_rate_limits rl
    WHERE rl.bucket = p_bucket AND rl.key_hash = p_key_hash;
    IF NOT FOUND OR v_start < v_now - make_interval(secs => p_window_seconds) THEN
      v_hits := 0;
      v_start := v_now;
    END IF;
  END IF;

  IF random() < 0.02 THEN
    DELETE FROM public.security_rate_limits WHERE window_start < v_now - INTERVAL '2 days';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_hits <= p_max,
    'hits', v_hits,
    'retry_after', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_start + make_interval(secs => p_window_seconds) - v_now)))::INT)
  );
END;
$$;

-- 4H. Nonce sekali pakai (CAPTCHA & sesi pengiriman anti-replay)
CREATE OR REPLACE FUNCTION public.svc_consume_nonce(p_nonce TEXT, p_ttl_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows INT;
BEGIN
  IF p_nonce IS NULL OR p_nonce !~ '^[A-Za-z0-9_:-]{8,120}$'
     OR p_ttl_seconds IS NULL OR p_ttl_seconds < 1 OR p_ttl_seconds > 86400 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Nonce tidak valid.';
  END IF;

  DELETE FROM public.security_used_nonces
  WHERE nonce = p_nonce AND expires_at < clock_timestamp();

  INSERT INTO public.security_used_nonces (nonce, expires_at)
  VALUES (p_nonce, clock_timestamp() + make_interval(secs => p_ttl_seconds))
  ON CONFLICT (nonce) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF random() < 0.02 THEN
    DELETE FROM public.security_used_nonces WHERE expires_at < clock_timestamp();
  END IF;

  RETURN v_rows = 1;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RPC PETUGAS (JWT authenticated + officer_profiles aktif sebagai sumber otoritatif)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.officer_get_reports_queue()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.officer_profiles op
    WHERE op.id = auth.uid()
      AND op.is_active = TRUE
      AND op.role IN ('officer', 'supervisor')
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Hanya petugas Dinas Pendidikan yang berwenang melihat antrean laporan.';
  END IF;

  RETURN coalesce((
    SELECT jsonb_agg(to_jsonb(q) ORDER BY q.created_at ASC)
    FROM (
      SELECT ar.id, ar.ticket_code, ar.school_id, ar.school_name, ar.school_npsn,
             ar.kabupaten, ar.kecamatan, ar.category, ar.requester_role, ar.status,
             ar.waiting_additional_info, ar.is_forwarded, ar.forwarded_to,
             ar.resolution_outcome, ar.attachment_count, ar.opened_at, ar.opened_by_name,
             ar.resolved_at, ar.resolved_by_name, ar.version, ar.created_at, ar.updated_at
      FROM public.anonymous_reports ar
      ORDER BY ar.created_at ASC
      LIMIT 2000
    ) q
  ), '[]'::jsonb);
END;
$$;

-- Bundel detail: kolom teks sensitif TETAP berupa ciphertext (backend yang mendekripsi
-- setelah memverifikasi JWT petugas; kunci enkripsi tidak pernah ada di database/browser).
CREATE OR REPLACE FUNCTION public.officer_get_report_detail_bundle(p_report_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_report public.anonymous_reports%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.officer_profiles op
    WHERE op.id = auth.uid()
      AND op.is_active = TRUE
      AND op.role IN ('officer', 'supervisor')
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Hanya petugas Dinas Pendidikan yang berwenang memeriksa detail laporan.';
  END IF;

  IF p_report_id IS NULL OR char_length(p_report_id) > 64 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Identitas laporan tidak valid.';
  END IF;

  SELECT * INTO v_report FROM public.anonymous_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Data laporan tidak ditemukan.';
  END IF;

  RETURN jsonb_build_object(
    'report', to_jsonb(v_report) - 'access_token_hash' - 'encryption_iv' - 'encryption_salt',
    'history', coalesce((
      SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at ASC)
      FROM public.report_status_history h WHERE h.report_id = v_report.id), '[]'::jsonb),
    'internal_notes', coalesce((
      SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC)
      FROM public.report_internal_notes n WHERE n.report_id = v_report.id), '[]'::jsonb),
    'messages', coalesce((
      SELECT jsonb_agg(to_jsonb(m) ORDER BY m.created_at ASC)
      FROM public.report_messages m WHERE m.report_id = v_report.id), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.officer_can_access_evidence(p_report_id TEXT, p_storage_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.officer_profiles op
    WHERE op.id = auth.uid()
      AND op.is_active = TRUE
      AND op.role IN ('officer', 'supervisor')
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Hanya petugas Dinas Pendidikan yang berwenang membuka bukti laporan.';
  END IF;
  IF p_report_id IS NULL OR p_storage_path IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.anonymous_reports ar,
           jsonb_array_elements(CASE WHEN jsonb_typeof(ar.attachments_json) = 'array'
                                     THEN ar.attachments_json ELSE '[]'::jsonb END) e
    WHERE ar.id = p_report_id AND e ->> 'storagePath' = p_storage_path
  ) OR EXISTS (
    SELECT 1 FROM public.report_messages m,
           jsonb_array_elements(CASE WHEN jsonb_typeof(m.attachments_json) = 'array'
                                     THEN m.attachments_json ELSE '[]'::jsonb END) e
    WHERE m.report_id = p_report_id AND e ->> 'storagePath' = p_storage_path
  );
END;
$$;

-- Pencabutan token akses: hanya supervisor
CREATE OR REPLACE FUNCTION public.officer_revoke_report_access_token(p_report_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_officer public.officer_profiles%ROWTYPE;
  v_ticket TEXT;
BEGIN
  SELECT * INTO v_officer FROM public.officer_profiles
  WHERE id = auth.uid() AND is_active = TRUE AND role = 'supervisor';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Hanya supervisor yang dapat mencabut token akses pelapor.';
  END IF;

  UPDATE public.anonymous_reports
  SET access_token_revoked_at = clock_timestamp(), updated_at = clock_timestamp()
  WHERE id = p_report_id
  RETURNING ticket_code INTO v_ticket;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Data laporan tidak ditemukan.';
  END IF;

  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal
  ) SELECT ar.id, ar.status, ar.status, v_officer.id, v_officer.full_name,
           'Token akses pelapor dicabut oleh supervisor.', TRUE
    FROM public.anonymous_reports ar WHERE ar.id = p_report_id;

  RETURN jsonb_build_object('success', TRUE, 'ticket_code', v_ticket);
END;
$$;

-- Fungsi petugas lama (dari supabase_reports_migration.sql): kunci search_path, tanpa
-- mengubah logika bisnis. Seluruh objek di dalam badan fungsi sudah dikualifikasi skema.
DO $$
DECLARE
  v_sig TEXT;
BEGIN
  FOREACH v_sig IN ARRAY ARRAY[
    'public.is_active_officer()',
    'public.officer_open_report_detail(text)',
    'public.officer_transition_report(text,integer,text,text,text,text,text,text,jsonb,boolean,text,text)',
    'public.officer_add_internal_note(text,text)',
    'public.guard_report_status_history_immutable()'
  ]
  LOOP
    IF to_regprocedure(v_sig) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', v_sig);
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 6. HAK EKSEKUSI FUNGSI: PUBLIC/anon/authenticated DICABUT, lalu diberikan minimal
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION private.constant_time_equals(BYTEA, BYTEA) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.verify_report_token(TEXT, BYTEA) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sanitize_attachments(JSONB, INT) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.svc_submit_report(TEXT, BYTEA, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_verify_report_access(TEXT, BYTEA) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_get_report_tracking(TEXT, BYTEA) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_add_reporter_message(TEXT, BYTEA, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_authorize_report_evidence(TEXT, BYTEA, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_rotate_report_token(TEXT, BYTEA, BYTEA) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_rate_limit(TEXT, TEXT, INT, INT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_consume_nonce(TEXT, INT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.svc_submit_report(TEXT, BYTEA, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_verify_report_access(TEXT, BYTEA) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_get_report_tracking(TEXT, BYTEA) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_add_reporter_message(TEXT, BYTEA, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_authorize_report_evidence(TEXT, BYTEA, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_rotate_report_token(TEXT, BYTEA, BYTEA) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_rate_limit(TEXT, TEXT, INT, INT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_consume_nonce(TEXT, INT) TO service_role;

-- Fungsi petugas: hanya role authenticated (pemeriksaan officer_profiles ada di dalam fungsi)
DO $$
DECLARE
  v_sig TEXT;
BEGIN
  FOREACH v_sig IN ARRAY ARRAY[
    'public.officer_get_reports_queue()',
    'public.officer_get_report_detail_bundle(text)',
    'public.officer_can_access_evidence(text,text)',
    'public.officer_revoke_report_access_token(text)',
    'public.is_active_officer()',
    'public.officer_open_report_detail(text)',
    'public.officer_transition_report(text,integer,text,text,text,text,text,text,jsonb,boolean,text,text)',
    'public.officer_add_internal_note(text,text)'
  ]
  LOOP
    IF to_regprocedure(v_sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', v_sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', v_sig);
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 7. RLS + HAK TABEL: tabel laporan tertutup total untuk anon & authenticated
-- -----------------------------------------------------------------------------
ALTER TABLE public.officer_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_internal_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_tracking_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_rate_limits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_used_nonces    ENABLE ROW LEVEL SECURITY;

-- Hapus SEMUA policy lama (termasuk "Public Read Tracking Signals" USING (true))
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'anonymous_reports', 'report_status_history', 'report_internal_notes',
        'report_messages', 'report_tracking_signals',
        'security_rate_limits', 'security_used_nonces', 'officer_profiles'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

REVOKE ALL ON TABLE
  public.anonymous_reports,
  public.report_status_history,
  public.report_internal_notes,
  public.report_messages,
  public.report_tracking_signals,
  public.security_rate_limits,
  public.security_used_nonces,
  public.officer_profiles
FROM PUBLIC, anon, authenticated;

-- Petugas hanya boleh MEMBACA profilnya sendiri yang aktif (tanpa INSERT/UPDATE/DELETE
-- sehingga tidak ada jalur eskalasi hak akses).
GRANT SELECT (id, email, full_name, jabatan, unit_kerja, role, is_active)
  ON public.officer_profiles TO authenticated;
CREATE POLICY "Officers read own active profile"
ON public.officer_profiles FOR SELECT
TO authenticated
USING (id = auth.uid() AND is_active = TRUE);

-- Tabel sinyal realtime tidak dipakai lagi (pelacakan memakai polling lewat backend).
-- Dikosongkan karena memuat nomor tiket lama; boleh di-DROP setelah rilis stabil.
TRUNCATE TABLE public.report_tracking_signals;

-- -----------------------------------------------------------------------------
-- 8. REALTIME: keluarkan tabel laporan dari publikasi & matikan REPLICA IDENTITY FULL
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY[
      'anonymous_reports', 'report_status_history', 'report_messages',
      'report_internal_notes', 'report_tracking_signals'
    ]
    LOOP
      IF EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.anonymous_reports       REPLICA IDENTITY DEFAULT;
ALTER TABLE public.report_status_history   REPLICA IDENTITY DEFAULT;
ALTER TABLE public.report_messages         REPLICA IDENTITY DEFAULT;
ALTER TABLE public.report_internal_notes   REPLICA IDENTITY DEFAULT;
ALTER TABLE public.report_tracking_signals REPLICA IDENTITY DEFAULT;

-- -----------------------------------------------------------------------------
-- 9. STORAGE: bucket report-evidence PRIVATE, tanpa policy baca/tulis publik
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-evidence', 'report-evidence', FALSE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "Public Read Report Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload Report Evidence" ON storage.objects;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (coalesce(qual, '') ILIKE '%report-evidence%' OR coalesce(with_check, '') ILIKE '%report-evidence%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Pagar terakhir: policy RESTRICTIVE di-AND-kan dengan semua policy permisif lain
-- sehingga bucket bukti tidak bisa dibuka anon/authenticated walau ada policy longgar.
-- (service_role memiliki BYPASSRLS sehingga backend tetap berfungsi.)
DROP POLICY IF EXISTS "Deny client access to report evidence" ON storage.objects;
CREATE POLICY "Deny client access to report evidence"
ON storage.objects AS RESTRICTIVE FOR ALL
TO anon, authenticated
USING (bucket_id <> 'report-evidence')
WITH CHECK (bucket_id <> 'report-evidence');

-- URL publik lama pada metadata lampiran tidak lagi berlaku -> hapus kunci 'url'.
UPDATE public.anonymous_reports
SET attachments_json = (
  SELECT coalesce(jsonb_agg(e - 'url' ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(attachments_json) WITH ORDINALITY AS t(e, ord)
)
WHERE jsonb_typeof(attachments_json) = 'array' AND attachments_json::text LIKE '%"url"%';

UPDATE public.report_messages
SET attachments_json = (
  SELECT coalesce(jsonb_agg(e - 'url' ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(attachments_json) WITH ORDINALITY AS t(e, ord)
)
WHERE jsonb_typeof(attachments_json) = 'array' AND attachments_json::text LIKE '%"url"%';

-- -----------------------------------------------------------------------------
-- 10. BATASAN UKURAN INPUT PADA TINGKAT TABEL (NOT VALID: baris lama tidak dipindai)
-- -----------------------------------------------------------------------------
ALTER TABLE public.anonymous_reports DROP CONSTRAINT IF EXISTS anonymous_reports_text_limits;
ALTER TABLE public.anonymous_reports ADD CONSTRAINT anonymous_reports_text_limits CHECK (
  char_length(category) <= 300
  AND char_length(requester_role) <= 120
  AND char_length(notes_encrypted) <= 30000
  AND char_length(coalesce(rejection_reason, '')) <= 5000
  AND char_length(coalesce(public_resolution_note, '')) <= 5000
  AND char_length(coalesce(skip_inspection_reason, '')) <= 5000
  AND jsonb_typeof(inspection_methods) = 'array'
  AND jsonb_array_length(inspection_methods) <= 12
) NOT VALID;

ALTER TABLE public.report_internal_notes DROP CONSTRAINT IF EXISTS report_internal_notes_text_limits;
ALTER TABLE public.report_internal_notes ADD CONSTRAINT report_internal_notes_text_limits
  CHECK (char_length(note) <= 5000) NOT VALID;

ALTER TABLE public.report_messages DROP CONSTRAINT IF EXISTS report_messages_text_limits;
ALTER TABLE public.report_messages ADD CONSTRAINT report_messages_text_limits
  CHECK (char_length(message) <= 30000) NOT VALID;

ALTER TABLE public.report_status_history DROP CONSTRAINT IF EXISTS report_status_history_text_limits;
ALTER TABLE public.report_status_history ADD CONSTRAINT report_status_history_text_limits
  CHECK (char_length(coalesce(note, '')) <= 5000) NOT VALID;

NOTIFY pgrst, 'reload schema';

COMMIT;

