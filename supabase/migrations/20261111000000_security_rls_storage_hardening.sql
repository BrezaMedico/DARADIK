-- =============================================================================
-- DARADIK SECURITY HARDENING INCREMENTAL MIGRATION (2026-11-11)
-- Fokus: Private Storage enforcement, ketat RLS semua tabel sensitif,
--        otorisasi role petugas dari DB (tidak pernah percaya role frontend),
--        dan penghapusan RPC plaintext lama.
-- =============================================================================

BEGIN;

-- 1. Hapus sisa RPC lama tanpa enkripsi / tanpa token rahasia jika masih ada
DO $$
DECLARE
  fn_oid OID;
BEGIN
  FOR fn_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'submit_public_report',
        'submit_public_report_encrypted',
        'get_public_report_tracking',
        'submit_reporter_additional_info',
        'submit_reporter_additional_info_encrypted'
      )
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', fn_oid::regprocedure);
  END LOOP;
END $$;

-- 2. Pastikan RLS aktif dan seluruh akses langsung tabel sensitif ditutup bagi publik
ALTER TABLE public.anonymous_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_internal_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_tracking_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_profiles        ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.security_rate_limits') IS NOT NULL THEN
    ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.security_rate_limits FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regclass('public.security_used_nonces') IS NOT NULL THEN
    ALTER TABLE public.security_used_nonces ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.security_used_nonces FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

REVOKE ALL ON TABLE
  public.anonymous_reports,
  public.report_status_history,
  public.report_internal_notes,
  public.report_messages,
  public.report_tracking_signals
FROM PUBLIC, anon, authenticated;

-- 3. Perketat RLS & privileges officer_profiles: hanya baca profil aktif milik sendiri ber-role resmi
REVOKE ALL ON TABLE public.officer_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.officer_profiles TO authenticated;

DROP POLICY IF EXISTS "Officers Read Profiles" ON public.officer_profiles;
DROP POLICY IF EXISTS "Officers Read Own Active Profile" ON public.officer_profiles;
CREATE POLICY "Officers Read Own Active Profile"
ON public.officer_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  AND is_active = TRUE
  AND role IN ('officer', 'supervisor')
);

-- 4. Pasti-aman Storage: bucket report-evidence private total untuk anon & client
UPDATE storage.buckets
SET public = FALSE
WHERE id = 'report-evidence';

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        coalesce(qual, '') ILIKE '%report-evidence%'
        OR coalesce(with_check, '') ILIKE '%report-evidence%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Deny All Public And Client Storage Access On report-evidence"
ON storage.objects AS RESTRICTIVE FOR ALL
TO anon, authenticated
USING (bucket_id <> 'report-evidence')
WITH CHECK (bucket_id <> 'report-evidence');

-- 5. Otorisasi bukti oleh petugas terautentikasi (dipanggil backend service_role setelah verifikasi JWT)
CREATE OR REPLACE FUNCTION public.svc_authorize_officer_evidence(
  p_officer_uid UUID,
  p_report_id TEXT,
  p_storage_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_officer_uid IS NULL
     OR nullif(btrim(coalesce(p_report_id, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_storage_path, '')), '') IS NULL
     OR p_storage_path LIKE '%..%'
     OR p_storage_path LIKE '/%' THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.officer_profiles op
    WHERE op.id = p_officer_uid
      AND op.is_active = TRUE
      AND op.role IN ('officer', 'supervisor')
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.anonymous_reports ar,
         jsonb_array_elements(
           CASE WHEN jsonb_typeof(ar.attachments_json) = 'array'
                THEN ar.attachments_json ELSE '[]'::jsonb END
         ) e
    WHERE ar.id = p_report_id
      AND e ->> 'storagePath' = p_storage_path
  ) OR EXISTS (
    SELECT 1
    FROM public.report_messages m,
         jsonb_array_elements(
           CASE WHEN jsonb_typeof(m.attachments_json) = 'array'
                THEN m.attachments_json ELSE '[]'::jsonb END
         ) e
    WHERE m.report_id = p_report_id
      AND e ->> 'storagePath' = p_storage_path
  );
END;
$$;

REVOKE ALL ON FUNCTION public.svc_authorize_officer_evidence(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_authorize_officer_evidence(UUID, TEXT, TEXT)
  TO service_role;

-- 6. Pastikan seluruh RPC petugas memeriksa role IN ('officer', 'supervisor') di DB
DO $$
DECLARE
  fn_name TEXT;
  fn_oid OID;
  fn_def TEXT;
  patched_def TEXT;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY[
    'officer_get_reports_queue',
    'officer_get_report_detail_bundle',
    'officer_can_access_evidence',
    'officer_open_report_detail',
    'officer_transition_report',
    'officer_add_internal_note'
  ]
  LOOP
    FOR fn_oid IN
      SELECT p.oid
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fn_name
    LOOP
      fn_def := pg_get_functiondef(fn_oid);
      IF fn_def NOT LIKE '%role IN (''officer'', ''supervisor'')%' THEN
        patched_def := replace(
          fn_def,
          'op.is_active = TRUE',
          'op.is_active = TRUE AND op.role IN (''officer'', ''supervisor'')'
        );
        patched_def := replace(
          patched_def,
          'WHERE id = auth.uid() AND is_active = TRUE',
          'WHERE id = auth.uid() AND is_active = TRUE AND role IN (''officer'', ''supervisor'')'
        );
        IF patched_def <> fn_def THEN
          EXECUTE patched_def;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 7. Perbarui private.sanitize_attachments agar lampiran 'Referensi Data' tanpa berkas fisik
--    tetap diizinkan dengan storagePath NULL, namun jalur berkas fisik tetap divalidasi ketat.
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

REVOKE ALL ON FUNCTION private.sanitize_attachments(JSONB, INT)
  FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

