-- ==============================================================================
-- SKEMA DATABASE SUPABASE DARADIK TRANSPARANSI BOSP 2026
-- Satuan Pendidikan Terverifikasi: SMK TI BAZMA (90 Murid)
-- ==============================================================================

-- 1. Buat Tabel Data Sekolah
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  npsn TEXT NOT NULL UNIQUE,
  student_count INTEGER NOT NULL DEFAULT 90,
  total_bosp BIGINT NOT NULL DEFAULT 151200000,
  per_student_estimate BIGINT NOT NULL DEFAULT 1680000,
  kabupaten TEXT NOT NULL DEFAULT 'Kab. Bogor',
  kecamatan TEXT NOT NULL DEFAULT 'Ciampea',
  provinsi TEXT NOT NULL DEFAULT 'Jawa Barat',
  address TEXT DEFAULT 'Jl. Cikampak Cicadas RT 01/RW 01, Kp. Cirangkong, Cibatok II, Kec. Ciampea, Kab. Bogor',
  status TEXT DEFAULT 'Terverifikasi Dapodik & BOSP 2026',
  data_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Akses Publik (Read & Write untuk Pengujian Transparansi)
DROP POLICY IF EXISTS "Public Read Schools" ON public.schools;
CREATE POLICY "Public Read Schools" ON public.schools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Modify Schools" ON public.schools;
CREATE POLICY "Public Modify Schools" ON public.schools FOR ALL USING (true);

-- 4. Masukkan Data Seed Nyata SMK TI BAZMA (90 Siswa)
INSERT INTO public.schools (
  id,
  name,
  npsn,
  student_count,
  total_bosp,
  per_student_estimate,
  kabupaten,
  kecamatan,
  provinsi,
  address,
  status
) VALUES (
  'smk-ti-bazma',
  'SMK TI BAZMA',
  '69994998',
  90,
  151200000,
  1680000,
  'Kab. Bogor',
  'Ciampea',
  'Jawa Barat',
  'Jl. Cikampak Cicadas RT 01/RW 01, Kp. Cirangkong, Cibatok II, Kec. Ciampea / Cibungbulang, Kab. Bogor, Jawa Barat',
  'Terverifikasi Dapodik & BOSP 2026'
) ON CONFLICT (id) DO UPDATE SET
  student_count = EXCLUDED.student_count,
  total_bosp = EXCLUDED.total_bosp,
  updated_at = NOW();
