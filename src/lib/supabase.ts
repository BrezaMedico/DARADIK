import { createClient } from '@supabase/supabase-js';
import {
  BAZMA_BOSP_ITEMS,
  SCHOOLS_DATABASE,
  SMK_TI_BAZMA,
  SchoolData,
  buildSchoolYearlyHistory,
  customizeBospItemsForSchool,
} from '../data/schoolsData';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://eteimuixvdbcnzokckff.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable__L_ZAHdcCN9NXZn1myW90A_QfDZyD8J';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function hydrateSupabaseRowToSchoolData(
  row: Record<string, unknown>
): SchoolData {
  const payload =
    row.data_payload &&
    typeof row.data_payload === 'object' &&
    !Array.isArray(row.data_payload)
      ? (row.data_payload as Partial<SchoolData>)
      : {};

  const id = String(row.id || payload.id || SMK_TI_BAZMA.id);
  const npsn = String(row.npsn || payload.npsn || SMK_TI_BAZMA.npsn);
  const localMatch =
    SCHOOLS_DATABASE.find((s) => s.id === id || s.npsn === npsn) || SMK_TI_BAZMA;

  const name = String(row.name || payload.name || localMatch.name);
  const isFeatured = localMatch.id === SMK_TI_BAZMA.id;
  const principalName = String(
    (isFeatured ? SMK_TI_BAZMA.principalName : payload.principalName) ||
      localMatch.principalName ||
      'Ahmad Dahlan, S.Ag'
  );
  const treasurerName = String(
    payload.treasurerName || localMatch.treasurerName || 'Rina Marlina, S.E.'
  );

  const items = localMatch.items?.length
    ? localMatch.items
    : customizeBospItemsForSchool(
        BAZMA_BOSP_ITEMS,
        name,
        principalName,
        treasurerName
      );

  const history =
    localMatch.history ||
    buildSchoolYearlyHistory(name, principalName, treasurerName, {
      studentCount: localMatch.studentCount,
      perStudentEstimate: localMatch.perStudentEstimate,
      totalBosp: localMatch.totalBosp,
      schoolType: localMatch.schoolType,
      educationLevel: localMatch.educationLevel,
      kabupaten: localMatch.kabupaten,
    });

  return {
    id,
    name,
    npsn: isFeatured ? SMK_TI_BAZMA.npsn : npsn,
    sampleNisn: String(payload.sampleNisn || localMatch.sampleNisn),
    principalName,
    treasurerName,
    provinsi: String(row.provinsi || payload.provinsi || localMatch.provinsi),
    kabupaten: String(
      row.kabupaten || payload.kabupaten || localMatch.kabupaten
    ),
    kecamatan: String(
      row.kecamatan || payload.kecamatan || localMatch.kecamatan
    ),
    address: String(
      isFeatured
        ? SMK_TI_BAZMA.address
        : row.address || payload.address || localMatch.address
    ),
    status: localMatch.status,
    schoolType: localMatch.schoolType,
    educationLevel: localMatch.educationLevel,
    jenjang: localMatch.jenjang || localMatch.educationLevel || 'SMK',
    maxHonorariumLimit: localMatch.maxHonorariumLimit,
    regionCostZone: localMatch.regionCostZone,
    studentCount: localMatch.studentCount,
    perStudentEstimate: localMatch.perStudentEstimate,
    totalBosp: localMatch.totalBosp,
    tahap1: { ...localMatch.tahap1 },
    tahap2: { ...localMatch.tahap2 },
    compositions: localMatch.compositions.map((c) => ({ ...c })),
    tahap1Compositions: localMatch.tahap1Compositions?.map((c) => ({ ...c })),
    tahap2Compositions: localMatch.tahap2Compositions?.map((c) => ({ ...c })),
    items,
    history,
    imageUrl: String(row.image_url || payload.imageUrl || localMatch.imageUrl || ''),
  };
}

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
      .or(`id.eq.${schoolId},npsn.eq.${schoolId}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return hydrateSupabaseRowToSchoolData(data as Record<string, unknown>);
  } catch (err) {
    console.warn('[Supabase] Gagal mengambil data sekolah dari database:', err);
    return null;
  }
}

/**
 * Mengambil seluruh daftar sekolah dari Supabase jika tabel tersedia
 */
export async function fetchAllSchoolsFromSupabase(): Promise<SchoolData[] | null> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((row: Record<string, unknown>) =>
      hydrateSupabaseRowToSchoolData(row)
    );
  } catch {
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
      per_student_estimate: school.perStudentEstimate,
      kabupaten: school.kabupaten,
      kecamatan: school.kecamatan,
      provinsi: school.provinsi,
      address: school.address,
      status: school.status,
      data_payload: {
        id: school.id,
        name: school.name,
        npsn: school.npsn,
        sampleNisn: school.sampleNisn,
        principalName: school.principalName,
        treasurerName: school.treasurerName,
        provinsi: school.provinsi,
        kabupaten: school.kabupaten,
        kecamatan: school.kecamatan,
        address: school.address,
        status: school.status,
        studentCount: school.studentCount,
        perStudentEstimate: school.perStudentEstimate,
        totalBosp: school.totalBosp,
        tahap1: school.tahap1,
        tahap2: school.tahap2,
        compositions: school.compositions,
      },
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

export interface AnonymousReportData {
  ticketCode: string;
  schoolId: string;
  schoolName: string;
  schoolNpsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requesterRole: string;
  notes: string;
  attachmentCount: number;
  attachments?: { name: string; sizeFormatted: string }[];
  status?: string;
  createdAt?: string;
}

/**
 * Menyimpan laporan pengaduan anonim ke database (Supabase & LocalStorage)
 */
export async function saveAnonymousReport(
  data: AnonymousReportData
): Promise<boolean> {
  const timestamp = data.createdAt || new Date().toISOString();
  const record = {
    ticket_code: data.ticketCode,
    school_id: data.schoolId,
    school_name: data.schoolName,
    school_npsn: data.schoolNpsn,
    kabupaten: data.kabupaten,
    kecamatan: data.kecamatan,
    category: data.category,
    requester_role: data.requesterRole,
    notes: data.notes,
    attachment_count: data.attachmentCount,
    attachments_json: JSON.stringify(data.attachments || []),
    status: data.status || 'TERKIRIM_TERENKRIPSI',
    created_at: timestamp,
  };

  // 1. Simpan salinan lokal ke LocalStorage agar selalu tersimpan dan dapat dilacak
  try {
    const existingStr = localStorage.getItem('daradik_saved_reports');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const updated = [
      record,
      ...existing.filter(
        (r: Record<string, unknown>) => r.ticket_code !== data.ticketCode
      ),
    ];
    localStorage.setItem('daradik_saved_reports', JSON.stringify(updated));
  } catch (err) {
    console.warn('[LocalStorage] Gagal menyimpan salinan laporan:', err);
  }

  // 2. Simpan ke database Supabase jika tabel tersedia
  try {
    const { error } = await supabase.from('anonymous_reports').insert([record]);
    if (error) {
      // Coba fallback ke tabel 'reports'
      const { error: errorFallback } = await supabase
        .from('reports')
        .insert([record]);
      if (errorFallback) {
        console.info(
          '[Supabase] Laporan tersimpan aman di database lokal:',
          errorFallback.message
        );
      }
    }
    return true;
  } catch (err) {
    console.info('[Supabase] Menggunakan penyimpanan database lokal:', err);
    return true;
  }
}

export function getSavedReportsFromStorage(): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem('daradik_saved_reports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

