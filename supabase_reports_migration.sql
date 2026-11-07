-- =============================================================================
-- DARADIK — MIGRATION SISTEM PELACAKAN LAPORAN & DASHBOARD PETUGAS DINAS
-- Aman dijalankan berulang (Idempotent) & menjaga seluruh data laporan yang ada
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PENGUNCIAN TABEL MASTER SEKOLAH (AKSES PUBLIK WAJIB MELALUI RPC TERKENDALI)
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.schools_sd FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.schools_smp FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.schools_sma FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.schools_smk FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['schools_sd', 'schools_smp', 'schools_sma', 'schools_smk']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Select %s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public Read Schools %s" ON public.%I;', UPPER(SUBSTRING(tbl FROM 9)), tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public Modify Schools %s" ON public.%I;', UPPER(SUBSTRING(tbl FROM 9)), tbl);
  END LOOP;
END $$;

CREATE OR REPLACE VIEW public.schools_all AS
SELECT
  id,
  name,
  npsn,
  'SD'::text AS jenjang,
  school_type,
  status,
  address,
  provinsi,
  kabupaten,
  kecamatan,
  student_count,
  total_bosp,
  per_student_estimate,
  (data_payload->>'principalName') AS principal_name,
  (data_payload->>'treasurerName') AS treasurer_name,
  (data_payload->>'regionCostZone') AS region_cost_zone,
  data_payload,
  updated_at
FROM public.schools_sd
UNION ALL
SELECT
  id,
  name,
  npsn,
  'SMP'::text AS jenjang,
  school_type,
  status,
  address,
  provinsi,
  kabupaten,
  kecamatan,
  student_count,
  total_bosp,
  per_student_estimate,
  (data_payload->>'principalName') AS principal_name,
  (data_payload->>'treasurerName') AS treasurer_name,
  (data_payload->>'regionCostZone') AS region_cost_zone,
  data_payload,
  updated_at
FROM public.schools_smp
UNION ALL
SELECT
  id,
  name,
  npsn,
  'SMA'::text AS jenjang,
  school_type,
  status,
  address,
  provinsi,
  kabupaten,
  kecamatan,
  student_count,
  total_bosp,
  per_student_estimate,
  (data_payload->>'principalName') AS principal_name,
  (data_payload->>'treasurerName') AS treasurer_name,
  (data_payload->>'regionCostZone') AS region_cost_zone,
  data_payload,
  updated_at
FROM public.schools_sma
UNION ALL
SELECT
  id,
  name,
  npsn,
  'SMK'::text AS jenjang,
  school_type,
  status,
  address,
  provinsi,
  kabupaten,
  kecamatan,
  student_count,
  total_bosp,
  per_student_estimate,
  (data_payload->>'principalName') AS principal_name,
  (data_payload->>'treasurerName') AS treasurer_name,
  (data_payload->>'regionCostZone') AS region_cost_zone,
  data_payload,
  updated_at
FROM public.schools_smk;

REVOKE ALL ON public.schools_all FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. TABEL PROFIL PETUGAS DINAS PENDIDIKAN & FUNGSI OTORISASI
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.officer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  jabatan TEXT NOT NULL DEFAULT 'Petugas Pemeriksa Pengaduan Dinas Pendidikan',
  unit_kerja TEXT NOT NULL DEFAULT 'Dinas Pendidikan',
  role TEXT NOT NULL DEFAULT 'officer' CHECK (role IN ('officer', 'supervisor')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_active_officer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.officer_profiles op
    WHERE op.id = auth.uid()
      AND op.is_active = TRUE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_officer() TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. UPGRADE SKEMA TABEL anonymous_reports (KONVERSI UTC TIMESTAMPTZ & KOLOM BARU)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_created_type TEXT;
  v_updated_type TEXT;
BEGIN
  SELECT data_type INTO v_created_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'anonymous_reports' AND column_name = 'created_at';

  IF v_created_type = 'timestamp without time zone' THEN
    ALTER TABLE public.anonymous_reports
      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING (created_at AT TIME ZONE 'UTC');
  END IF;

  SELECT data_type INTO v_updated_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'anonymous_reports' AND column_name = 'updated_at';

  IF v_updated_type = 'timestamp without time zone' THEN
    ALTER TABLE public.anonymous_reports
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING (updated_at AT TIME ZONE 'UTC');
  END IF;
END $$;

ALTER TABLE public.anonymous_reports
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN status SET DEFAULT 'QUEUED';

ALTER TABLE public.anonymous_reports
  ADD COLUMN IF NOT EXISTS waiting_additional_info BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS forwarded_to TEXT,
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_bosp_fact TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS resolution_outcome TEXT,
  ADD COLUMN IF NOT EXISTS public_resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS skip_inspection_reason TEXT,
  ADD COLUMN IF NOT EXISTS field_inspection_conducted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inspection_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_by UUID,
  ADD COLUMN IF NOT EXISTS opened_by_name TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS resolved_by_name TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Migrasi status lama ke 5 tahapan standar tanpa menghapus baris yang sudah ada
ALTER TABLE public.anonymous_reports DROP CONSTRAINT IF EXISTS anonymous_reports_status_check;
ALTER TABLE public.anonymous_reports DROP CONSTRAINT IF EXISTS anonymous_reports_outcome_check;

UPDATE public.anonymous_reports
SET
  status = 'QUEUED',
  opened_at = NULL
WHERE status IN ('LAPORAN_TERKIRIM', 'TERKIRIM_TERENKRIPSI', 'MENUNGGU_VERIFIKASI');

UPDATE public.anonymous_reports
SET
  status = 'SEDANG_DITELAAH',
  opened_at = COALESCE(opened_at, updated_at, created_at)
WHERE status IN ('VERIFIKASI_LAPORAN', 'DITELAAH_DINAS');

UPDATE public.anonymous_reports
SET
  status = 'PEMERIKSAAN_LANJUTAN',
  opened_at = COALESCE(opened_at, updated_at, created_at),
  field_inspection_conducted = FALSE
WHERE status IN ('PEMERIKSAAN_LAPANGAN', 'KLARIFIKASI_SEKOLAH', 'AUDIT_LAPANGAN');

UPDATE public.anonymous_reports
SET
  status = 'COMPLETED',
  opened_at = COALESCE(opened_at, created_at),
  resolved_at = COALESCE(resolved_at, updated_at, NOW()),
  resolution_outcome = COALESCE(resolution_outcome, 'INCONCLUSIVE'),
  public_resolution_note = COALESCE(
    public_resolution_note,
    'Pemeriksaan atas laporan ini telah diselesaikan dan dicatat dalam arsip pengawasan Dinas Pendidikan.'
  )
WHERE status IN ('TINDAK_LANJUT_SELESAI', 'SELESAI', 'SELESAI_DIKLARIFIKASI');

ALTER TABLE public.anonymous_reports
  ADD CONSTRAINT anonymous_reports_status_check
  CHECK (
    status IN (
      'SUBMITTED',
      'QUEUED',
      'SEDANG_DITELAAH',
      'PEMERIKSAAN_LANJUTAN',
      'TIDAK_DAPAT_DITINDAKLANJUTI',
      'COMPLETED'
    )
  );

ALTER TABLE public.anonymous_reports
  ADD CONSTRAINT anonymous_reports_outcome_check
  CHECK (
    resolution_outcome IS NULL
    OR resolution_outcome IN ('HAS_INDICATION', 'NO_INDICATION', 'INCONCLUSIVE')
  );

CREATE INDEX IF NOT EXISTS idx_anonymous_reports_status_created
  ON public.anonymous_reports (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_school_npsn
  ON public.anonymous_reports (school_npsn);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_waiting_info
  ON public.anonymous_reports (waiting_additional_info)
  WHERE waiting_additional_info = TRUE;

-- -----------------------------------------------------------------------------
-- 4. TABEL RIWAYAT STATUS (APPEND-ONLY), CATATAN INTERNAL, KOMUNIKASI, & SINYAL REALTIME
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL REFERENCES public.anonymous_reports(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_uid UUID,
  changed_by_name TEXT NOT NULL,
  note TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_status_history_report_created
  ON public.report_status_history (report_id, created_at ASC);

-- Trigger proteksi agar riwayat status tidak dapat ditimpa (UPDATE) dan tidak dapat dihapus sembarangan
CREATE OR REPLACE FUNCTION public.guard_report_status_history_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'IMMUTABLE_HISTORY: Riwayat perubahan status laporan tidak boleh diubah atau ditimpa.';
  ELSIF TG_OP = 'DELETE' THEN
    IF current_setting('daradik.bypass_history_guard', true) = 'on' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'IMMUTABLE_HISTORY: Riwayat perubahan status laporan bersifat append-only dan tidak boleh dihapus.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_report_status_history ON public.report_status_history;
CREATE TRIGGER trg_guard_report_status_history
BEFORE UPDATE OR DELETE ON public.report_status_history
FOR EACH ROW EXECUTE FUNCTION public.guard_report_status_history_immutable();

-- Backfill riwayat status untuk laporan eksisting yang belum memiliki baris riwayat
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT *
    FROM public.anonymous_reports ar
    WHERE NOT EXISTS (
      SELECT 1 FROM public.report_status_history h WHERE h.report_id = ar.id
    )
  LOOP
    INSERT INTO public.report_status_history (
      report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
    ) VALUES (
      r.id,
      NULL,
      'SUBMITTED',
      'Sistem DARADIK',
      'Laporan diterima oleh sistem DARADIK dan kode tiket diterbitkan.',
      FALSE,
      r.created_at
    );

    INSERT INTO public.report_status_history (
      report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
    ) VALUES (
      r.id,
      'SUBMITTED',
      'QUEUED',
      'Sistem Antrean Dinas Pendidikan',
      'Laporan masuk ke antrean pemeriksaan petugas Dinas Pendidikan.',
      FALSE,
      r.created_at + INTERVAL '1 millisecond'
    );

    IF r.status IN ('SEDANG_DITELAAH', 'PEMERIKSAAN_LANJUTAN', 'TIDAK_DAPAT_DITINDAKLANJUTI', 'COMPLETED') THEN
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
      ) VALUES (
        r.id,
        'QUEUED',
        'SEDANG_DITELAAH',
        COALESCE(r.opened_by_name, 'Petugas Dinas Pendidikan'),
        'Petugas membuka detail laporan untuk penelaahan awal.',
        FALSE,
        COALESCE(r.opened_at, r.created_at + INTERVAL '1 second')
      );
    END IF;

    IF r.status IN ('PEMERIKSAAN_LANJUTAN', 'COMPLETED') THEN
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
      ) VALUES (
        r.id,
        'SEDANG_DITELAAH',
        'PEMERIKSAAN_LANJUTAN',
        COALESCE(r.opened_by_name, 'Petugas Dinas Pendidikan'),
        'Laporan diterima untuk ditindaklanjuti pada tahap pemeriksaan lanjutan.',
        FALSE,
        GREATEST(
          COALESCE(r.opened_at, r.created_at) + INTERVAL '2 seconds',
          LEAST(r.updated_at, COALESCE(r.resolved_at, r.updated_at))
        )
      );
    END IF;

    IF r.status = 'TIDAK_DAPAT_DITINDAKLANJUTI' THEN
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
      ) VALUES (
        r.id,
        'SEDANG_DITELAAH',
        'TIDAK_DAPAT_DITINDAKLANJUTI',
        COALESCE(r.resolved_by_name, 'Petugas Dinas Pendidikan'),
        COALESCE(r.rejection_reason, 'Laporan tidak dapat ditindaklanjuti.'),
        FALSE,
        COALESCE(r.resolved_at, r.updated_at)
      );
    END IF;

    IF r.status = 'COMPLETED' THEN
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
      ) VALUES (
        r.id,
        'PEMERIKSAAN_LANJUTAN',
        'COMPLETED',
        COALESCE(r.resolved_by_name, 'Petugas Dinas Pendidikan'),
        COALESCE(r.public_resolution_note, 'Pemeriksaan laporan telah selesai.'),
        FALSE,
        COALESCE(r.resolved_at, r.updated_at) + INTERVAL '3 seconds'
      );
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.report_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL REFERENCES public.anonymous_reports(id) ON DELETE CASCADE,
  officer_uid UUID NOT NULL,
  officer_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_internal_notes_report_created
  ON public.report_internal_notes (report_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.report_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL REFERENCES public.anonymous_reports(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('OFFICER', 'REPORTER')),
  sender_label TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_messages_report_created
  ON public.report_messages (report_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.report_tracking_signals (
  ticket_code TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.report_tracking_signals (ticket_code, updated_at)
SELECT ticket_code, updated_at
FROM public.anonymous_reports
ON CONFLICT (ticket_code) DO UPDATE SET updated_at = EXCLUDED.updated_at;

-- -----------------------------------------------------------------------------
-- 5. STORAGE BUCKET UNTUK BUKTI PENDUKUNG (GAMBAR / DOKUMEN)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-evidence',
  'report-evidence',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Read Report Evidence" ON storage.objects;
CREATE POLICY "Public Read Report Evidence"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'report-evidence');

DROP POLICY IF EXISTS "Anon Upload Report Evidence" ON storage.objects;
CREATE POLICY "Anon Upload Report Evidence"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'report-evidence'
  AND (storage.foldername(name))[1] IN ('initial', 'followup')
);

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) KETAT PADA TABEL LAPORAN
-- -----------------------------------------------------------------------------
ALTER TABLE public.officer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_tracking_signals ENABLE ROW LEVEL SECURITY;

-- Hapus seluruh policy yang mengizinkan akses langsung publik pada tabel laporan
DROP POLICY IF EXISTS "Public Select Anonymous Reports" ON public.anonymous_reports;
DROP POLICY IF EXISTS "Public Insert Anonymous Reports" ON public.anonymous_reports;
DROP POLICY IF EXISTS "Public Update Anonymous Reports" ON public.anonymous_reports;
DROP POLICY IF EXISTS "Public Update Anonymous Reports Status" ON public.anonymous_reports;

-- Officer profiles: petugas hanya dapat melihat profil dirinya yang aktif
DROP POLICY IF EXISTS "Officers Read Profiles" ON public.officer_profiles;
CREATE POLICY "Officers Read Profiles"
ON public.officer_profiles FOR SELECT
TO authenticated
USING (id = auth.uid() AND is_active = TRUE);

-- Tracking signals: hanya menyimpan SHA-256 signal_hash & updated_at (tanpa kode tiket asli)
DROP POLICY IF EXISTS "Public Read Tracking Signals" ON public.report_tracking_signals;
CREATE POLICY "Public Read Tracking Signals"
ON public.report_tracking_signals FOR SELECT
TO anon, authenticated
USING (true);

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.officer_profiles TO authenticated;
GRANT SELECT ON public.report_tracking_signals TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. FUNGSI RPC ATOMIK & AMAN (SECURITY DEFINER)
-- -----------------------------------------------------------------------------

-- 7A. Kirim Laporan Baru oleh Orang Tua / Pelapor Anonim
CREATE OR REPLACE FUNCTION public.submit_public_report(
  p_school_id TEXT,
  p_school_name TEXT,
  p_school_npsn TEXT,
  p_kabupaten TEXT,
  p_kecamatan TEXT,
  p_category TEXT,
  p_requester_role TEXT,
  p_notes TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb,
  p_ocr_text TEXT DEFAULT NULL,
  p_ocr_bosp_fact TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT := gen_random_uuid()::text;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_year TEXT := EXTRACT(YEAR FROM v_now AT TIME ZONE 'Asia/Jakarta')::text;
  v_reg TEXT;
  v_rand INT;
  v_ticket TEXT;
  v_school RECORD;
  v_final_school_id TEXT;
  v_final_school_name TEXT;
  v_final_npsn TEXT := TRIM(COALESCE(p_school_npsn, ''));
  v_final_kabupaten TEXT;
  v_final_kecamatan TEXT;
  v_attachments JSONB := COALESCE(p_attachments, '[]'::jsonb);
  v_att_count INT := 0;
  v_attempts INT := 0;
BEGIN
  IF v_final_npsn = '' OR TRIM(COALESCE(p_school_name, '')) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Sekolah tujuan laporan wajib dipilih.';
  END IF;
  IF TRIM(COALESCE(p_category, '')) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Kategori laporan wajib diisi.';
  END IF;
  IF TRIM(COALESCE(p_requester_role, '')) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Pihak yang meminta wajib dipilih.';
  END IF;
  IF TRIM(COALESCE(p_notes, '')) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Kronologi atau catatan laporan wajib diisi.';
  END IF;

  -- Sinkronkan identitas sekolah dengan tabel master schools_all berdasarkan NPSN apabila tersedia
  SELECT id, name, npsn, kabupaten, kecamatan
  INTO v_school
  FROM public.schools_all
  WHERE npsn = v_final_npsn
  LIMIT 1;

  IF FOUND THEN
    v_final_school_id := v_school.id;
    v_final_school_name := v_school.name;
    v_final_kabupaten := v_school.kabupaten;
    v_final_kecamatan := v_school.kecamatan;
  ELSE
    v_final_school_id := COALESCE(NULLIF(TRIM(p_school_id), ''), v_final_npsn);
    v_final_school_name := TRIM(p_school_name);
    v_final_kabupaten := COALESCE(NULLIF(TRIM(p_kabupaten), ''), 'Data belum tersedia');
    v_final_kecamatan := COALESCE(NULLIF(TRIM(p_kecamatan), ''), 'Data belum tersedia');
  END IF;

  v_reg := UPPER(REGEXP_REPLACE(v_final_kabupaten, '^(KAB\.|KABUPATEN|KOTA)\s*', '', 'i'));
  v_reg := UPPER(REGEXP_REPLACE(v_reg, '[^A-Z]', '', 'g'));
  v_reg := RPAD(SUBSTRING(COALESCE(NULLIF(v_reg, ''), 'NAS') FROM 1 FOR 3), 3, 'X');

  LOOP
    v_attempts := v_attempts + 1;
    v_rand := FLOOR(1000 + RANDOM() * 9000)::int;
    v_ticket := 'CHK-' || v_year || '-' || v_rand::text || '-' || v_reg;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.anonymous_reports WHERE ticket_code = v_ticket
    ) OR v_attempts > 25;
  END LOOP;

  IF jsonb_typeof(v_attachments) = 'array' THEN
    v_att_count := jsonb_array_length(v_attachments);
  END IF;

  INSERT INTO public.anonymous_reports (
    id,
    ticket_code,
    school_id,
    school_name,
    school_npsn,
    kabupaten,
    kecamatan,
    category,
    requester_role,
    notes_encrypted,
    encryption_algorithm,
    status,
    waiting_additional_info,
    attachment_count,
    attachments_json,
    ocr_text,
    ocr_bosp_fact,
    created_at,
    updated_at,
    version
  ) VALUES (
    v_id,
    v_ticket,
    v_final_school_id,
    v_final_school_name,
    v_final_npsn,
    v_final_kabupaten,
    v_final_kecamatan,
    TRIM(p_category),
    TRIM(p_requester_role),
    TRIM(p_notes),
    'TLS-1.3 + PostgreSQL RLS',
    'QUEUED',
    FALSE,
    v_att_count,
    v_attachments,
    NULLIF(TRIM(COALESCE(p_ocr_text, '')), ''),
    NULLIF(TRIM(COALESCE(p_ocr_bosp_fact, '')), ''),
    v_now,
    v_now,
    1
  );

  -- Tahap 1: Laporan Terkirim (SUBMITTED)
  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
  ) VALUES (
    v_id,
    NULL,
    'SUBMITTED',
    'Sistem DARADIK',
    'Laporan berhasil dikirim dan diterima oleh sistem DARADIK.',
    FALSE,
    v_now
  );

  -- Tahap 2: Menunggu Pemeriksaan (QUEUED) di antrean Dinas Pendidikan
  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
  ) VALUES (
    v_id,
    'SUBMITTED',
    'QUEUED',
    'Sistem Antrean Dinas Pendidikan',
    'Laporan masuk ke antrean Dinas Pendidikan dan menunggu pemeriksaan petugas.',
    FALSE,
    v_now + INTERVAL '1 millisecond'
  );

  INSERT INTO public.report_tracking_signals (ticket_code, updated_at)
  VALUES (v_ticket, v_now)
  ON CONFLICT (ticket_code) DO UPDATE SET updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'id', v_id,
    'ticket_code', v_ticket,
    'school_name', v_final_school_name,
    'school_npsn', v_final_npsn,
    'category', TRIM(p_category),
    'status', 'QUEUED',
    'created_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_report(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT
) TO anon, authenticated;

-- 7B. Ambil Detail Pelacakan Orang Tua berdasarkan Kode Tiket (Tanpa Catatan Internal / Data Sensitif)
CREATE OR REPLACE FUNCTION public.get_public_report_tracking(
  p_ticket_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_ticket TEXT := UPPER(TRIM(COALESCE(p_ticket_code, '')));
  v_report public.anonymous_reports%ROWTYPE;
  v_history JSONB;
  v_messages JSONB;
BEGIN
  IF v_clean_ticket = '' THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO v_report
  FROM public.anonymous_reports
  WHERE ticket_code = v_clean_ticket
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
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
      )
      ORDER BY h.created_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_history
  FROM public.report_status_history h
  WHERE h.report_id = v_report.id
    AND h.is_internal = FALSE;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'sender_type', m.sender_type,
        'sender_label', CASE
          WHEN m.sender_type = 'OFFICER' THEN 'Petugas Pemeriksa Dinas Pendidikan'
          ELSE 'Anda (Pelapor Anonim)'
        END,
        'message', m.message,
        'attachments_json', m.attachments_json,
        'created_at', m.created_at
      )
      ORDER BY m.created_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_messages
  FROM public.report_messages m
  WHERE m.report_id = v_report.id;

  RETURN jsonb_build_object(
    'report', jsonb_build_object(
      'id', v_report.id,
      'ticket_code', v_report.ticket_code,
      'school_id', v_report.school_id,
      'school_name', v_report.school_name,
      'school_npsn', v_report.school_npsn,
      'kabupaten', v_report.kabupaten,
      'kecamatan', v_report.kecamatan,
      'category', v_report.category,
      'requester_role', v_report.requester_role,
      'notes', v_report.notes_encrypted,
      'status', v_report.status,
      'waiting_additional_info', v_report.waiting_additional_info,
      'is_forwarded', v_report.is_forwarded,
      'forwarded_to', v_report.forwarded_to,
      'rejection_reason', v_report.rejection_reason,
      'resolution_outcome', v_report.resolution_outcome,
      'public_resolution_note', v_report.public_resolution_note,
      'skip_inspection_reason', v_report.skip_inspection_reason,
      'field_inspection_conducted', v_report.field_inspection_conducted,
      'inspection_methods', v_report.inspection_methods,
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

GRANT EXECUTE ON FUNCTION public.get_public_report_tracking(TEXT) TO anon, authenticated;

-- 7C. Kirim Balasan & Bukti Tambahan oleh Orang Tua melalui Kode Tiket
CREATE OR REPLACE FUNCTION public.submit_reporter_additional_info(
  p_ticket_code TEXT,
  p_message TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_ticket TEXT := UPPER(TRIM(COALESCE(p_ticket_code, '')));
  v_msg TEXT := TRIM(COALESCE(p_message, ''));
  v_att JSONB := COALESCE(p_attachments, '[]'::jsonb);
  v_att_len INT := 0;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_report public.anonymous_reports%ROWTYPE;
  v_existing_att JSONB;
  v_merged_att JSONB;
BEGIN
  IF v_clean_ticket = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Kode tiket tidak valid.';
  END IF;

  IF jsonb_typeof(v_att) = 'array' THEN
    v_att_len := jsonb_array_length(v_att);
  ELSE
    v_att := '[]'::jsonb;
  END IF;

  IF v_msg = '' AND v_att_len = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Tuliskan pesan penjelasan atau unggah minimal satu bukti tambahan.';
  END IF;

  SELECT *
  INTO v_report
  FROM public.anonymous_reports
  WHERE ticket_code = v_clean_ticket
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Laporan dengan kode tiket tersebut tidak ditemukan.';
  END IF;

  IF v_report.status IN ('COMPLETED', 'TIDAK_DAPAT_DITINDAKLANJUTI') THEN
    RAISE EXCEPTION 'INVALID_STATE: Pemeriksaan laporan ini telah selesai sehingga tidak dapat menerima balasan baru.';
  END IF;

  IF v_report.status <> 'PEMERIKSAAN_LANJUTAN' AND v_report.waiting_additional_info = FALSE THEN
    RAISE EXCEPTION 'INVALID_STATE: Pengiriman informasi tambahan hanya dibuka saat petugas memintanya pada tahap Pemeriksaan Lanjutan.';
  END IF;

  IF v_msg = '' THEN
    v_msg := 'Melampirkan ' || v_att_len::text || ' berkas bukti pendukung tambahan.';
  END IF;

  INSERT INTO public.report_messages (
    report_id, sender_type, sender_label, message, attachments_json, created_at
  ) VALUES (
    v_report.id,
    'REPORTER',
    'Pelapor Anonim',
    v_msg,
    v_att,
    v_now
  );

  v_existing_att := CASE
    WHEN jsonb_typeof(v_report.attachments_json) = 'array' THEN v_report.attachments_json
    ELSE '[]'::jsonb
  END;
  v_merged_att := v_existing_att || v_att;

  UPDATE public.anonymous_reports
  SET
    waiting_additional_info = FALSE,
    attachments_json = v_merged_att,
    attachment_count = jsonb_array_length(v_merged_att),
    updated_at = v_now,
    version = version + 1
  WHERE id = v_report.id;

  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, changed_by_name, note, is_internal, created_at
  ) VALUES (
    v_report.id,
    v_report.status,
    v_report.status,
    'Pelapor Anonim',
    'Pelapor mengirimkan informasi atau bukti tambahan.',
    FALSE,
    v_now
  );

  INSERT INTO public.report_tracking_signals (ticket_code, updated_at)
  VALUES (v_report.ticket_code, v_now)
  ON CONFLICT (ticket_code) DO UPDATE SET updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'success', TRUE,
    'waiting_additional_info', FALSE,
    'updated_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_reporter_additional_info(TEXT, TEXT, JSONB) TO anon, authenticated;

-- 7D. Buka Detail Laporan Pertama Kali oleh Petugas Resmi (Transisi Sekali QUEUED -> SEDANG_DITELAAH)
CREATE OR REPLACE FUNCTION public.officer_open_report_detail(
  p_report_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer public.officer_profiles%ROWTYPE;
  v_report public.anonymous_reports%ROWTYPE;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_transitioned BOOLEAN := FALSE;
BEGIN
  SELECT *
  INTO v_officer
  FROM public.officer_profiles
  WHERE id = auth.uid() AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Hanya petugas Dinas Pendidikan yang berwenang memeriksa detail laporan.';
  END IF;

  SELECT *
  INTO v_report
  FROM public.anonymous_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Data laporan tidak ditemukan.';
  END IF;

  IF v_report.status IN ('SUBMITTED', 'QUEUED') AND v_report.opened_at IS NULL THEN
    UPDATE public.anonymous_reports
    SET
      status = 'SEDANG_DITELAAH',
      opened_at = v_now,
      opened_by = v_officer.id,
      opened_by_name = v_officer.full_name,
      updated_at = v_now,
      version = version + 1
    WHERE id = v_report.id
    RETURNING * INTO v_report;

    INSERT INTO public.report_status_history (
      report_id,
      previous_status,
      new_status,
      changed_by_uid,
      changed_by_name,
      note,
      is_internal,
      created_at
    ) VALUES (
      v_report.id,
      'QUEUED',
      'SEDANG_DITELAAH',
      v_officer.id,
      v_officer.full_name,
      'Petugas membuka detail laporan dan memulai penelaahan isi laporan serta bukti pendukung.',
      FALSE,
      v_now
    );

    INSERT INTO public.report_tracking_signals (ticket_code, updated_at)
    VALUES (v_report.ticket_code, v_now)
    ON CONFLICT (ticket_code) DO UPDATE SET updated_at = EXCLUDED.updated_at;

    v_transitioned := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'transitioned', v_transitioned,
    'status', v_report.status,
    'version', v_report.version,
    'opened_at', v_report.opened_at,
    'opened_by_name', v_report.opened_by_name,
    'updated_at', v_report.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.officer_open_report_detail(TEXT) TO authenticated;

-- 7E. Tindakan Perubahan Status Laporan oleh Petugas Resmi (Atomik + Optimistic Concurrency Check)
CREATE OR REPLACE FUNCTION public.officer_transition_report(
  p_report_id TEXT,
  p_expected_version INTEGER,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL,
  p_resolution_outcome TEXT DEFAULT NULL,
  p_public_resolution_note TEXT DEFAULT NULL,
  p_internal_note TEXT DEFAULT NULL,
  p_message_to_reporter TEXT DEFAULT NULL,
  p_inspection_methods JSONB DEFAULT NULL,
  p_is_forwarded BOOLEAN DEFAULT NULL,
  p_forwarded_to TEXT DEFAULT NULL,
  p_skip_inspection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer public.officer_profiles%ROWTYPE;
  v_report public.anonymous_reports%ROWTYPE;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_action TEXT := UPPER(TRIM(COALESCE(p_action, '')));
  v_internal TEXT := TRIM(COALESCE(p_internal_note, ''));
  v_rejection TEXT := TRIM(COALESCE(p_rejection_reason, ''));
  v_outcome TEXT := UPPER(TRIM(COALESCE(p_resolution_outcome, '')));
  v_public_note TEXT := TRIM(COALESCE(p_public_resolution_note, ''));
  v_msg TEXT := TRIM(COALESCE(p_message_to_reporter, ''));
  v_skip_reason TEXT := TRIM(COALESCE(p_skip_inspection_reason, ''));
  v_methods JSONB;
  v_has_field_inspection BOOLEAN := FALSE;
  v_new_forwarded BOOLEAN;
  v_new_forwarded_to TEXT;
BEGIN
  SELECT *
  INTO v_officer
  FROM public.officer_profiles
  WHERE id = auth.uid() AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Anda tidak memiliki hak akses petugas untuk mengubah status laporan.';
  END IF;

  SELECT *
  INTO v_report
  FROM public.anonymous_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Data laporan tidak ditemukan.';
  END IF;

  IF v_report.version <> p_expected_version THEN
    RAISE EXCEPTION 'CONFLICT_VERSION: Laporan telah diperbarui oleh petugas lain (versi terbaru: %). Muat ulang data sebelum menyimpan.', v_report.version;
  END IF;

  IF v_report.status IN ('COMPLETED', 'TIDAK_DAPAT_DITINDAKLANJUTI') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Laporan yang sudah selesai tidak dapat diubah kembali statusnya.';
  END IF;

  -- 1. TERIMA UNTUK DITINDAKLANJUTI (Tahap 3 -> Tahap 4)
  IF v_action = 'ACCEPT_FOR_FOLLOWUP' THEN
    IF v_report.status <> 'SEDANG_DITELAAH' THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Tindakan terima hanya dapat dilakukan pada laporan berstatus Sedang Ditelaah.';
    END IF;

    UPDATE public.anonymous_reports
    SET
      status = 'PEMERIKSAAN_LANJUTAN',
      updated_at = v_now,
      version = version + 1
    WHERE id = v_report.id
    RETURNING * INTO v_report;

    INSERT INTO public.report_status_history (
      report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
    ) VALUES (
      v_report.id,
      'SEDANG_DITELAAH',
      'PEMERIKSAAN_LANJUTAN',
      v_officer.id,
      v_officer.full_name,
      'Laporan memenuhi syarat awal dan diterima untuk pemeriksaan lanjutan.',
      FALSE,
      v_now
    );

    IF v_internal <> '' THEN
      INSERT INTO public.report_internal_notes (
        report_id, officer_uid, officer_name, note, created_at
      ) VALUES (
        v_report.id, v_officer.id, v_officer.full_name, v_internal, v_now
      );
    END IF;

  -- 2. TOLAK LAPORAN DENGAN ALASAN WAJIB (Tahap 3 -> TIDAK_DAPAT_DITINDAKLANJUTI)
  ELSIF v_action = 'REJECT_REPORT' THEN
    IF v_report.status <> 'SEDANG_DITELAAH' THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Tindakan penolakan awal hanya dapat dilakukan pada status Sedang Ditelaah.';
    END IF;
    IF v_rejection = '' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Alasan penolakan laporan wajib diisi.';
    END IF;

    UPDATE public.anonymous_reports
    SET
      status = 'TIDAK_DAPAT_DITINDAKLANJUTI',
      rejection_reason = v_rejection,
      waiting_additional_info = FALSE,
      resolved_at = v_now,
      resolved_by = v_officer.id,
      resolved_by_name = v_officer.full_name,
      updated_at = v_now,
      version = version + 1
    WHERE id = v_report.id
    RETURNING * INTO v_report;

    INSERT INTO public.report_status_history (
      report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
    ) VALUES (
      v_report.id,
      'SEDANG_DITELAAH',
      'TIDAK_DAPAT_DITINDAKLANJUTI',
      v_officer.id,
      v_officer.full_name,
      v_rejection,
      FALSE,
      v_now
    );

    IF v_internal <> '' THEN
      INSERT INTO public.report_internal_notes (
        report_id, officer_uid, officer_name, note, created_at
      ) VALUES (
        v_report.id, v_officer.id, v_officer.full_name, v_internal, v_now
      );
    END IF;

  -- 3. SIMPAN KEGIATAN PEMERIKSAAN LANJUTAN / PENERUSAN INSTANSI (Tahap 4)
  ELSIF v_action = 'SAVE_INSPECTION_PROGRESS' THEN
    IF v_report.status <> 'PEMERIKSAAN_LANJUTAN' THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Pencatatan kegiatan pemeriksaan hanya berlaku pada tahap Pemeriksaan Lanjutan.';
    END IF;

    v_methods := CASE
      WHEN p_inspection_methods IS NOT NULL AND jsonb_typeof(p_inspection_methods) = 'array'
        THEN p_inspection_methods
      ELSE v_report.inspection_methods
    END;
    v_has_field_inspection := v_methods @> '["PEMERIKSAAN_LAPANGAN"]'::jsonb;
    v_new_forwarded := COALESCE(p_is_forwarded, v_report.is_forwarded);
    v_new_forwarded_to := CASE
      WHEN v_new_forwarded THEN COALESCE(NULLIF(TRIM(COALESCE(p_forwarded_to, '')), ''), v_report.forwarded_to, 'Inspektorat Daerah')
      ELSE NULL
    END;

    UPDATE public.anonymous_reports
    SET
      inspection_methods = v_methods,
      field_inspection_conducted = v_has_field_inspection,
      is_forwarded = v_new_forwarded,
      forwarded_to = v_new_forwarded_to,
      updated_at = v_now,
      version = version + 1
    WHERE id = v_report.id
    RETURNING * INTO v_report;

    IF v_new_forwarded AND (NOT COALESCE(v_report.is_forwarded, FALSE) OR p_is_forwarded IS TRUE) THEN
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
      ) VALUES (
        v_report.id,
        'PEMERIKSAAN_LANJUTAN',
        'PEMERIKSAAN_LANJUTAN',
        v_officer.id,
        v_officer.full_name,
        'Proses pemeriksaan diteruskan ke ' || v_new_forwarded_to || '.',
        FALSE,
        v_now
      );
    ELSE
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
      ) VALUES (
        v_report.id,
        'PEMERIKSAAN_LANJUTAN',
        'PEMERIKSAAN_LANJUTAN',
        v_officer.id,
        v_officer.full_name,
        'Petugas memperbarui catatan metode pemeriksaan lanjutan.',
        TRUE,
        v_now
      );
    END IF;

    IF v_internal <> '' THEN
      INSERT INTO public.report_internal_notes (
        report_id, officer_uid, officer_name, note, created_at
      ) VALUES (
        v_report.id, v_officer.id, v_officer.full_name, v_internal, v_now
      );
    END IF;

  -- 4. MINTA INFORMASI TAMBAHAN KEPADA PELAPOR (Substatus pada Tahap 4)
  ELSIF v_action = 'REQUEST_ADDITIONAL_INFO' THEN
    IF v_report.status <> 'PEMERIKSAAN_LANJUTAN' THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Permintaan informasi tambahan hanya dapat dikirim pada tahap Pemeriksaan Lanjutan.';
    END IF;
    IF v_msg = '' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Tuliskan pesan penjelasan mengenai informasi atau bukti tambahan yang dibutuhkan.';
    END IF;

    INSERT INTO public.report_messages (
      report_id, sender_type, sender_label, message, attachments_json, created_at
    ) VALUES (
      v_report.id,
      'OFFICER',
      'Petugas Pemeriksa Dinas Pendidikan',
      v_msg,
      '[]'::jsonb,
      v_now
    );

    UPDATE public.anonymous_reports
    SET
      waiting_additional_info = TRUE,
      updated_at = v_now,
      version = version + 1
    WHERE id = v_report.id
    RETURNING * INTO v_report;

    INSERT INTO public.report_status_history (
      report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
    ) VALUES (
      v_report.id,
      'PEMERIKSAAN_LANJUTAN',
      'PEMERIKSAAN_LANJUTAN',
      v_officer.id,
      v_officer.full_name,
      'Petugas meminta informasi atau bukti tambahan kepada pelapor.',
      FALSE,
      v_now
    );

  -- 5. SELESAIKAN PEMERIKSAAN & SIMPAN HASIL PENANGANAN (Tahap 4 -> Tahap 5, atau Tahap 3 -> Tahap 5 dengan alasan lewati)
  ELSIF v_action = 'COMPLETE_REPORT' THEN
    IF v_report.status NOT IN ('PEMERIKSAAN_LANJUTAN', 'SEDANG_DITELAAH') THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Laporan belum berada pada tahap penelaahan atau pemeriksaan.';
    END IF;

    IF v_report.status = 'SEDANG_DITELAAH' AND v_skip_reason = '' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Alasan melewati tahap Pemeriksaan Lanjutan wajib dicatat sebelum menyelesaikan laporan.';
    END IF;

    IF v_outcome NOT IN ('HAS_INDICATION', 'NO_INDICATION', 'INCONCLUSIVE') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Kesimpulan hasil pemeriksaan wajib dipilih.';
    END IF;

    IF v_public_note = '' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Catatan hasil penanganan untuk pelapor wajib diisi.';
    END IF;

    v_methods := CASE
      WHEN p_inspection_methods IS NOT NULL AND jsonb_typeof(p_inspection_methods) = 'array'
        THEN p_inspection_methods
      ELSE v_report.inspection_methods
    END;
    v_has_field_inspection := v_methods @> '["PEMERIKSAAN_LAPANGAN"]'::jsonb;

    UPDATE public.anonymous_reports
    SET
      status = 'COMPLETED',
      waiting_additional_info = FALSE,
      resolution_outcome = v_outcome,
      public_resolution_note = v_public_note,
      skip_inspection_reason = COALESCE(NULLIF(v_skip_reason, ''), v_report.skip_inspection_reason),
      inspection_methods = v_methods,
      field_inspection_conducted = v_has_field_inspection,
      resolved_at = v_now,
      resolved_by = v_officer.id,
      resolved_by_name = v_officer.full_name,
      updated_at = v_now,
      version = version + 1
    WHERE id = v_report.id
    RETURNING * INTO v_report;

    INSERT INTO public.report_status_history (
      report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
    ) VALUES (
      v_report.id,
      CASE WHEN v_skip_reason <> '' THEN 'SEDANG_DITELAAH' ELSE 'PEMERIKSAAN_LANJUTAN' END,
      'COMPLETED',
      v_officer.id,
      v_officer.full_name,
      v_public_note,
      FALSE,
      v_now
    );

    IF v_skip_reason <> '' THEN
      INSERT INTO public.report_status_history (
        report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at
      ) VALUES (
        v_report.id,
        'COMPLETED',
        'COMPLETED',
        v_officer.id,
        v_officer.full_name,
        'Alasan melewati pemeriksaan lanjutan: ' || v_skip_reason,
        TRUE,
        v_now + INTERVAL '1 millisecond'
      );
    END IF;

    IF v_internal <> '' THEN
      INSERT INTO public.report_internal_notes (
        report_id, officer_uid, officer_name, note, created_at
      ) VALUES (
        v_report.id, v_officer.id, v_officer.full_name, v_internal, v_now
      );
    END IF;

  ELSE
    RAISE EXCEPTION 'VALIDATION_ERROR: Jenis tindakan tidak dikenali (%).', v_action;
  END IF;

  INSERT INTO public.report_tracking_signals (ticket_code, updated_at)
  VALUES (v_report.ticket_code, v_now)
  ON CONFLICT (ticket_code) DO UPDATE SET updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', v_report.id,
    'ticket_code', v_report.ticket_code,
    'status', v_report.status,
    'waiting_additional_info', v_report.waiting_additional_info,
    'field_inspection_conducted', v_report.field_inspection_conducted,
    'inspection_methods', v_report.inspection_methods,
    'resolution_outcome', v_report.resolution_outcome,
    'version', v_report.version,
    'updated_at', v_report.updated_at,
    'resolved_at', v_report.resolved_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.officer_transition_report(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, BOOLEAN, TEXT, TEXT
) TO authenticated;

-- 7F. Tambah Catatan Internal Khusus Petugas
CREATE OR REPLACE FUNCTION public.officer_add_internal_note(
  p_report_id TEXT,
  p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer public.officer_profiles%ROWTYPE;
  v_clean_note TEXT := TRIM(COALESCE(p_note, ''));
  v_now TIMESTAMPTZ := clock_timestamp();
  v_note_id UUID;
BEGIN
  SELECT *
  INTO v_officer
  FROM public.officer_profiles
  WHERE id = auth.uid() AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Hanya petugas resmi yang dapat menambahkan catatan internal.';
  END IF;

  IF v_clean_note = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Catatan internal tidak boleh kosong.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.anonymous_reports WHERE id = p_report_id) THEN
    RAISE EXCEPTION 'NOT_FOUND: Laporan tidak ditemukan.';
  END IF;

  INSERT INTO public.report_internal_notes (
    report_id, officer_uid, officer_name, note, created_at
  ) VALUES (
    p_report_id, v_officer.id, v_officer.full_name, v_clean_note, v_now
  )
  RETURNING id INTO v_note_id;

  RETURN jsonb_build_object(
    'id', v_note_id,
    'report_id', p_report_id,
    'officer_uid', v_officer.id,
    'officer_name', v_officer.full_name,
    'note', v_clean_note,
    'created_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.officer_add_internal_note(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. AKTIFKAN SUPABASE REALTIME PUBLICATION PADA TABEL TERKAIT
-- -----------------------------------------------------------------------------
ALTER TABLE public.anonymous_reports REPLICA IDENTITY FULL;
ALTER TABLE public.report_status_history REPLICA IDENTITY FULL;
ALTER TABLE public.report_messages REPLICA IDENTITY FULL;
ALTER TABLE public.report_internal_notes REPLICA IDENTITY FULL;
ALTER TABLE public.report_tracking_signals REPLICA IDENTITY FULL;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY ARRAY[
      'anonymous_reports',
      'report_status_history',
      'report_messages',
      'report_internal_notes',
      'report_tracking_signals'
    ]
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
      END IF;
    END LOOP;
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

