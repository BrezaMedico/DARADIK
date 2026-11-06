-- ==============================================================================
-- SKEMA DATABASE SUPABASE DARADIK TRANSPARANSI BOSP 2026
-- Pemisahan Tabel Satuan Pendidikan per Jenjang (SD, SMP, SMA, SMK)
-- Catatan: Satuan Negeri & Swasta disatukan dalam masing-masing tabel jenjang
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL SEKOLAH DASAR (SD NEGERI & SWASTA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools_sd (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  npsn TEXT NOT NULL UNIQUE,
  student_count INTEGER NOT NULL DEFAULT 120,
  total_bosp BIGINT NOT NULL DEFAULT 108000000,
  per_student_estimate BIGINT NOT NULL DEFAULT 900000,
  kabupaten TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'Terverifikasi Dapodik & BOSP 2026',
  school_type TEXT DEFAULT 'Negeri', -- 'Negeri' atau 'Swasta'
  data_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schools_sd ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Schools SD" ON public.schools_sd;
CREATE POLICY "Public Read Schools SD" ON public.schools_sd FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Modify Schools SD" ON public.schools_sd;
CREATE POLICY "Public Modify Schools SD" ON public.schools_sd FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 2. TABEL SEKOLAH MENENGAH PERTAMA (SMP NEGERI & SWASTA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools_smp (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  npsn TEXT NOT NULL UNIQUE,
  student_count INTEGER NOT NULL DEFAULT 200,
  total_bosp BIGINT NOT NULL DEFAULT 220000000,
  per_student_estimate BIGINT NOT NULL DEFAULT 1100000,
  kabupaten TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'Terverifikasi Dapodik & BOSP 2026',
  school_type TEXT DEFAULT 'Negeri', -- 'Negeri' atau 'Swasta'
  data_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schools_smp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Schools SMP" ON public.schools_smp;
CREATE POLICY "Public Read Schools SMP" ON public.schools_smp FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Modify Schools SMP" ON public.schools_smp;
CREATE POLICY "Public Modify Schools SMP" ON public.schools_smp FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 3. TABEL SEKOLAH MENENGAH ATAS (SMA NEGERI & SWASTA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools_sma (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  npsn TEXT NOT NULL UNIQUE,
  student_count INTEGER NOT NULL DEFAULT 350,
  total_bosp BIGINT NOT NULL DEFAULT 525000000,
  per_student_estimate BIGINT NOT NULL DEFAULT 1500000,
  kabupaten TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'Terverifikasi Dapodik & BOSP 2026',
  school_type TEXT DEFAULT 'Negeri', -- 'Negeri' atau 'Swasta'
  data_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schools_sma ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Schools SMA" ON public.schools_sma;
CREATE POLICY "Public Read Schools SMA" ON public.schools_sma FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Modify Schools SMA" ON public.schools_sma;
CREATE POLICY "Public Modify Schools SMA" ON public.schools_sma FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 4. TABEL SEKOLAH MENENGAH KEJURUAN (SMK NEGERI & SWASTA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools_smk (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  npsn TEXT NOT NULL UNIQUE,
  student_count INTEGER NOT NULL DEFAULT 92,
  total_bosp BIGINT NOT NULL DEFAULT 151200000,
  per_student_estimate BIGINT NOT NULL DEFAULT 1680000,
  kabupaten TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'Terverifikasi Dapodik & BOSP 2026',
  school_type TEXT DEFAULT 'Swasta', -- 'Negeri' atau 'Swasta'
  data_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schools_smk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Schools SMK" ON public.schools_smk;
CREATE POLICY "Public Read Schools SMK" ON public.schools_smk FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Modify Schools SMK" ON public.schools_smk;
CREATE POLICY "Public Modify Schools SMK" ON public.schools_smk FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 5. VIEW GABUNGAN OTOMATIS (AGAR PENCARIAN GLOBAL TETAP RINGAN & CEPAT)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.schools_all AS
SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, 'SD' AS jenjang, data_payload, created_at, updated_at FROM public.schools_sd
UNION ALL
SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, 'SMP' AS jenjang, data_payload, created_at, updated_at FROM public.schools_smp
UNION ALL
SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, 'SMA' AS jenjang, data_payload, created_at, updated_at FROM public.schools_sma
UNION ALL
SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, 'SMK' AS jenjang, data_payload, created_at, updated_at FROM public.schools_smk;

-- ------------------------------------------------------------------------------
-- 6. MIGRASI OTOMATIS DARI TABEL 'schools' LAMA (JIKA SUDAH BERISI DATA)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') THEN
    -- Migrasi ke schools_sd
    INSERT INTO public.schools_sd (id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, data_payload, created_at, updated_at)
    SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, 
      COALESCE(data_payload->>'schoolType', 'Negeri'), data_payload, created_at, updated_at
    FROM public.schools
    WHERE (data_payload->>'jenjang' = 'SD' OR name ILIKE 'SD %' OR name ILIKE 'SDN %' OR name ILIKE 'SDS %')
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

    -- Migrasi ke schools_smp
    INSERT INTO public.schools_smp (id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, data_payload, created_at, updated_at)
    SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, 
      COALESCE(data_payload->>'schoolType', 'Negeri'), data_payload, created_at, updated_at
    FROM public.schools
    WHERE (data_payload->>'jenjang' = 'SMP' OR name ILIKE 'SMP %' OR name ILIKE 'SMPN %' OR name ILIKE 'SMPS %')
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

    -- Migrasi ke schools_sma
    INSERT INTO public.schools_sma (id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, data_payload, created_at, updated_at)
    SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, 
      COALESCE(data_payload->>'schoolType', 'Negeri'), data_payload, created_at, updated_at
    FROM public.schools
    WHERE (data_payload->>'jenjang' = 'SMA' OR name ILIKE 'SMA %' OR name ILIKE 'SMAN %' OR name ILIKE 'SMAS %')
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

    -- Migrasi ke schools_smk
    INSERT INTO public.schools_smk (id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type, data_payload, created_at, updated_at)
    SELECT id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, 
      COALESCE(data_payload->>'schoolType', 'Swasta'), data_payload, created_at, updated_at
    FROM public.schools
    WHERE (data_payload->>'jenjang' = 'SMK' OR name ILIKE 'SMK %' OR name ILIKE 'SMKN %' OR name ILIKE 'SMKS %' OR id = 'smk-ti-bazma')
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. SEED CONTOH TERVERIFIKASI: SMK TI BAZMA (92 SISWA)
-- ------------------------------------------------------------------------------
INSERT INTO public.schools_smk (
  id, name, npsn, student_count, total_bosp, per_student_estimate, kabupaten, kecamatan, provinsi, address, status, school_type
) VALUES (
  'smk-ti-bazma',
  'SMK TI BAZMA',
  '70029710',
  92,
  151200000,
  1680000,
  'Kab. Bogor',
  'Ciampea',
  'Jawa Barat',
  'Kp. Cicadas RT. 001/001, Desa Cicadas, Kec. Ciampea, Kab. Bogor, Jawa Barat',
  'Terverifikasi Dapodik & BOSP 2026',
  'Swasta'
) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. PEMBERSIHAN TABEL 'schools' LAMA (BERSIH TOTAL DARI DATABASE)
-- ------------------------------------------------------------------------------
-- Hapus objek 'schools' lama (baik berbentuk VIEW maupun TABLE fisik):
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'schools') THEN
    EXECUTE 'DROP VIEW public.schools CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools' AND table_type = 'BASE TABLE') THEN
    EXECUTE 'DROP TABLE public.schools CASCADE';
  END IF;
END $$;

-- Buat ulang 'schools' sebagai VIEW virtual gabungan dari 4 tabel jenjang
-- (data fisik murni tersimpan terpisah di schools_sd, schools_smp, schools_sma, schools_smk):
CREATE OR REPLACE VIEW public.schools AS
SELECT * FROM public.schools_all;

