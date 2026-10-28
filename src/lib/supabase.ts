import { createClient } from '@supabase/supabase-js';
import { SchoolData } from '../data/schoolsData';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://eteimuixvdbcnzokckff.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable__L_ZAHdcCN9NXZn1myW90A_QfDZyD8J';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mengambil data sekolah dari Supabase Database.
 * Jika tabel belum ada atau koneksi gagal, mengembalikan null secara graceful
 * sehingga aplikasi langsung beralih ke data terverifikasi lokal.
 */
export async function fetchSchoolFromSupabase(
  schoolId: string = 'smk-ti-bazma'
): Promise<SchoolData | null> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as SchoolData;
  } catch (err) {
    console.warn('[Supabase] Gagal mengambil data sekolah dari database:', err);
    return null;
  }
}

/**
 * Menyimpan atau memperbarui data sekolah ke database Supabase
 */
export async function syncSchoolToSupabase(school: SchoolData): Promise<boolean> {
  try {
    const { error } = await supabase.from('schools').upsert({
      id: school.id,
      name: school.name,
      npsn: school.npsn,
      student_count: school.studentCount,
      total_bosp: school.totalBosp,
      kabupaten: school.kabupaten,
      kecamatan: school.kecamatan,
      provinsi: school.provinsi,
      address: school.address,
      status: school.status,
      data_payload: school,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase Sync]', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Sync Error]', err);
    return false;
  }
}
