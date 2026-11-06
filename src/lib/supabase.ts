import { createClient } from '@supabase/supabase-js';
import {
  BAZMA_BOSP_ITEMS,
  SCHOOLS_DATABASE,
  SMK_TI_BAZMA,
  SchoolData,
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
    imageUrl: String(row.image_url || payload.imageUrl || localMatch.imageUrl || ''),
  };
}

export type JenjangType = 'SD' | 'SMP' | 'SMA' | 'SMK';

export function getJenjangTableName(jenjang?: string): string {
  const normalized = (jenjang || '').trim().toUpperCase();
  if (normalized === 'SD') return 'schools_sd';
  if (normalized === 'SMP') return 'schools_smp';
  if (normalized === 'SMA') return 'schools_sma';
  if (normalized === 'SMK') return 'schools_smk';
  return 'schools';
}

export function detectJenjangFromIdOrName(schoolIdOrName: string): JenjangType | null {
  const lower = schoolIdOrName.toLowerCase();
  if (
    lower.startsWith('sd-') ||
    lower.startsWith('sdn-') ||
    lower.startsWith('sds-') ||
    lower.includes('sd ') ||
    lower.includes('sdn ')
  )
    return 'SD';
  if (
    lower.startsWith('smp-') ||
    lower.startsWith('smpn-') ||
    lower.startsWith('smps-') ||
    lower.includes('smp ') ||
    lower.includes('smpn ')
  )
    return 'SMP';
  if (
    lower.startsWith('sma-') ||
    lower.startsWith('sman-') ||
    lower.startsWith('smas-') ||
    lower.includes('sma ') ||
    lower.includes('sman ')
  )
    return 'SMA';
  if (
    lower.startsWith('smk-') ||
    lower.startsWith('smkn-') ||
    lower.startsWith('smks-') ||
    lower.includes('smk ') ||
    lower.includes('smkn ')
  )
    return 'SMK';
  return null;
}

/**
 * Mengambil data sekolah dari Supabase Database.
 * Mengecek tabel terpisah per jenjang (schools_sd, schools_smp, schools_sma, schools_smk)
 * dengan fallback halus ke tabel schools dan data lokal.
 */
export async function fetchSchoolFromSupabase(
  schoolId: string = 'smk-ti-bazma',
  jenjangHint?: string
): Promise<SchoolData | null> {
  const detected = (jenjangHint as JenjangType) || detectJenjangFromIdOrName(schoolId);
  const targetTables = detected
    ? [getJenjangTableName(detected), 'schools']
    : ['schools_smk', 'schools_sma', 'schools_smp', 'schools_sd', 'schools'];

  for (const tbl of targetTables) {
    try {
      const { data, error } = await supabase
        .from(tbl)
        .select('*')
        .or(`id.eq.${schoolId},npsn.eq.${schoolId}`)
        .maybeSingle();

      if (!error && data) {
        return hydrateSupabaseRowToSchoolData(data as Record<string, unknown>);
      }
    } catch {
      // lanjut ke tabel berikutnya jika tabel belum ada di database
    }
  }

  return null;
}

/**
 * Mengambil seluruh daftar sekolah dari Supabase.
 * Dapat difilter per jenjang tabel terpisah (schools_sd, schools_smp, schools_sma, schools_smk)
 */
export async function fetchAllSchoolsFromSupabase(
  jenjang?: JenjangType
): Promise<SchoolData[] | null> {
  const targetTable = jenjang ? getJenjangTableName(jenjang) : 'schools';

  try {
    const { data, error } = await supabase
      .from(targetTable)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (!error && data && data.length > 0) {
      return data.map((row: Record<string, unknown>) =>
        hydrateSupabaseRowToSchoolData(row)
      );
    }
  } catch {
    // fallback
  }

  // Jika tabel jenjang spesifik belum dibuat, coba fallback ke 'schools'
  if (targetTable !== 'schools') {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (!error && data && data.length > 0) {
        return data.map((row: Record<string, unknown>) =>
          hydrateSupabaseRowToSchoolData(row)
        );
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Menyimpan atau memperbarui data sekolah ke database Supabase
 * Disimpan ke tabel spesifik jenjang (schools_sd, schools_smp, schools_sma, schools_smk)
 * serta disinkronkan ke tabel 'schools' utama.
 */
export async function syncSchoolToSupabase(school: SchoolData): Promise<boolean> {
  const jenjang = school.jenjang || school.educationLevel || 'SMK';
  const jenjangTable = getJenjangTableName(jenjang);

  const payload = {
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
    school_type: school.schoolType || 'Negeri',
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
      schoolType: school.schoolType,
      educationLevel: school.educationLevel,
      jenjang: school.jenjang,
      maxHonorariumLimit: school.maxHonorariumLimit,
      regionCostZone: school.regionCostZone,
      studentCount: school.studentCount,
      perStudentEstimate: school.perStudentEstimate,
      totalBosp: school.totalBosp,
      tahap1: school.tahap1,
      tahap2: school.tahap2,
      compositions: school.compositions,
    },
    updated_at: new Date().toISOString(),
  };

  let saved = false;

  // 1. Simpan ke tabel spesifik jenjang (schools_sd / schools_smp / schools_sma / schools_smk)
  try {
    const { error: errJenjang } = await supabase
      .from(jenjangTable)
      .upsert(payload, { onConflict: 'id' });
    if (!errJenjang) saved = true;
  } catch {
    // jika tabel belum ada di database, lanjut ke tabel utama
  }

  // 2. Simpan juga ke tabel 'schools' utama
  try {
    const { error: errMain } = await supabase
      .from('schools')
      .upsert(payload, { onConflict: 'id' });
    if (!errMain) saved = true;
  } catch {
    // ignore
  }

  return saved;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface InspectionLog {
  stage: string;
  time: string;
  actor: string;
  note: string;
}

export interface InspectionChatMessage {
  id: string;
  sender: 'dinas' | 'reporter';
  senderLabel: string;
  timestamp: string;
  text: string;
}

export interface AdminReviewDocument {
  inspection_status: string;
  verified_by?: string;
  admin_notes?: string;
  official_action?: string;
  verdict_type?: 'TERBUKTI' | 'TIDAK_TERBUKTI';
  timeline?: InspectionLog[];
  chat_messages?: InspectionChatMessage[];
}

export interface AnonymousReportData {
  id?: string;
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
  letterDocument?: AdminReviewDocument | null;
}

export interface AnonymousReportRecord {
  id: string;
  ticket_code: string;
  school_id: string;
  school_name: string;
  school_npsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requester_role: string;
  notes_encrypted: string;
  notes?: string;
  encryption_algorithm: string;
  status: string;
  attachment_count: number;
  attachments_json: unknown;
  letter_document: string | AdminReviewDocument | null;
  created_at: string;
  updated_at: string;
}

/**
 * Menyimpan laporan pengaduan anonim ke database Supabase dan salinan lokal
 */
export async function saveAnonymousReport(
  data: AnonymousReportData
): Promise<boolean> {
  const timestamp = data.createdAt || new Date().toISOString();
  const reportId = data.id || generateUUID();

  const initialReviewDoc: AdminReviewDocument = data.letterDocument || {
    inspection_status: 'LAPORAN_TERKIRIM',
    verified_by: 'Tim Verifikator BOSP Dinas Pendidikan & Inspektorat',
    admin_notes:
      'Laporan telah teregistrasi dalam sistem pengawasan terpadu. Tim penelaah dinas sedang memverifikasi Berita Acara Pemeriksaan BOSP.',
    official_action: 'TERKIRIM_TERENKRIPSI',
    timeline: [
      {
        stage: 'LAPORAN_TERKIRIM',
        time: timestamp,
        actor: 'Sistem Protokol Sandi DARADIK',
        note: 'Laporan terenkripsi diterima tanpa merekam IP/identitas pelapor.',
      },
    ],
    chat_messages: [
      {
        id: `msg-sys-${Date.now()}`,
        sender: 'dinas',
        senderLabel: 'Tim Verifikator Inspektorat & Dinas Pendidikan',
        timestamp: 'Hari ini, Otomatis',
        text: 'Laporan Anda telah berhasil masuk ke basis data Pengawasan BOSP. Kami sedang menelaah data realisasi BOS sekolah terlapor.',
      },
    ],
  };

  const supabaseRecord = {
    id: reportId,
    ticket_code: data.ticketCode,
    school_id: data.schoolId,
    school_name: data.schoolName,
    school_npsn: data.schoolNpsn,
    kabupaten: data.kabupaten,
    kecamatan: data.kecamatan,
    category: data.category,
    requester_role: data.requesterRole,
    notes_encrypted: data.notes,
    encryption_algorithm: 'AES-GCM-256 / PBKDF2',
    status: data.status || 'LAPORAN_TERKIRIM',
    attachment_count: data.attachmentCount || 0,
    attachments_json: data.attachments || [],
    letter_document: JSON.stringify(initialReviewDoc),
    created_at: timestamp,
    updated_at: timestamp,
  };

  const localRecord = {
    ...supabaseRecord,
    notes: data.notes,
  };

  // 1. Simpan salinan lokal ke LocalStorage & Cookie perangkat pelapor
  try {
    if (typeof localStorage !== 'undefined') {
      const existingStr = localStorage.getItem('daradik_saved_reports');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [
        localRecord,
        ...existing.filter(
          (r: Record<string, unknown>) => r.ticket_code !== data.ticketCode
        ),
      ];
      localStorage.setItem('daradik_saved_reports', JSON.stringify(updated));
    }

    if (typeof document !== 'undefined') {
      const match = document.cookie.match(
        new RegExp('(^| )daradik_tracked_tickets=([^;]+)')
      );
      const existingCookie = match ? JSON.parse(decodeURIComponent(match[2])) : [];
      const updatedCookie = [
        {
          ticketCode: data.ticketCode,
          schoolName: data.schoolName,
          schoolNpsn: data.schoolNpsn,
          category: data.category,
          date: timestamp,
          createdAtRaw: timestamp,
          status: data.status || 'LAPORAN_TERKIRIM',
          notes: data.notes,
        },
        ...existingCookie.filter((i: { ticketCode?: string }) => i.ticketCode !== data.ticketCode),
      ].slice(0, 10);
      const expDate = new Date();
      expDate.setTime(expDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      document.cookie = `daradik_tracked_tickets=${encodeURIComponent(
        JSON.stringify(updatedCookie)
      )};expires=${expDate.toUTCString()};path=/;SameSite=Lax`;
    }
  } catch (err) {
    console.warn('[LocalStorage/Cookie] Gagal menyimpan salinan laporan:', err);
  }

  // 2. Simpan ke tabel Supabase 'anonymous_reports' agar dapat diperiksa oleh dinas kependidikan
  try {
    const { error } = await supabase
      .from('anonymous_reports')
      .upsert(supabaseRecord, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Reports Error]', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Reports Exception]', err);
    return false;
  }
}

/**
 * Mengambil satu laporan berdasarkan nomor tiket dari Supabase atau fallback LocalStorage
 */
export async function fetchAnonymousReportByTicket(
  ticketCode: string
): Promise<AnonymousReportRecord | null> {
  const cleanCode = ticketCode.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const { data, error } = await supabase
      .from('anonymous_reports')
      .select('*')
      .eq('ticket_code', cleanCode)
      .maybeSingle();

    if (!error && data) {
      return {
        ...(data as AnonymousReportRecord),
        notes: (data as AnonymousReportRecord).notes_encrypted,
      };
    }
  } catch (err) {
    console.warn('[Supabase fetchReport error]', err);
  }

  // Fallback ke penyimpanan lokal
  const localList = getSavedReportsFromStorage();
  const localFound = localList.find(
    (r) => String(r.ticket_code || '').toUpperCase() === cleanCode
  );
  if (localFound) {
    return localFound as unknown as AnonymousReportRecord;
  }
  return null;
}

/**
 * Mengambil semua daftar laporan dari Supabase untuk keperluan telaah Dinas Pendidikan
 */
export async function fetchAllAnonymousReportsFromSupabase(): Promise<
  AnonymousReportRecord[]
> {
  try {
    const { data, error } = await supabase
      .from('anonymous_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      return data.map((item) => ({
        ...(item as AnonymousReportRecord),
        notes: (item as AnonymousReportRecord).notes_encrypted,
      }));
    }
  } catch (err) {
    console.warn('[Supabase fetchAllReports error]', err);
  }

  return [];
}

/**
 * Memperbarui status laporan dan memberikan tanggapan resmi seolah-olah admin dinas pendidikan memeriksa
 */
export async function updateReportByDinas(
  ticketCode: string,
  newStatus: string,
  adminComment: string,
  actorName: string = 'Pengawas Pembina Dinas Pendidikan',
  verdictType?: 'TERBUKTI' | 'TIDAK_TERBUKTI'
): Promise<boolean> {
  const cleanCode = ticketCode.trim().toUpperCase();
  const existing = await fetchAnonymousReportByTicket(cleanCode);
  const now = new Date();
  const nowFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let parsedDoc: AdminReviewDocument = {
    inspection_status: newStatus,
    verified_by: actorName,
    admin_notes: adminComment,
    official_action: newStatus,
    verdict_type: verdictType,
    timeline: [],
    chat_messages: [],
  };

  if (existing?.letter_document) {
    try {
      parsedDoc =
        typeof existing.letter_document === 'string'
          ? JSON.parse(existing.letter_document)
          : existing.letter_document;
    } catch {
      // keep fallback
    }
  }

  parsedDoc.inspection_status = newStatus;
  parsedDoc.verified_by = actorName;
  parsedDoc.admin_notes = adminComment;
  if (verdictType) {
    parsedDoc.verdict_type = verdictType;
  }

  const newLog: InspectionLog = {
    stage: newStatus,
    time: now.toISOString(),
    actor: actorName,
    note: adminComment || `Status laporan diperbarui ke tahap: ${newStatus}`,
  };

  parsedDoc.timeline = [...(parsedDoc.timeline || []), newLog];

  if (adminComment && adminComment.trim()) {
    const newChat: InspectionChatMessage = {
      id: `dinas-reply-${Date.now()}`,
      sender: 'dinas',
      senderLabel: actorName,
      timestamp: `Hari ini, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`,
      text: adminComment.trim(),
    };
    parsedDoc.chat_messages = [...(parsedDoc.chat_messages || []), newChat];
  }

  const docString = JSON.stringify(parsedDoc);
  const updatedIso = now.toISOString();

  // 1. Simpan ke Supabase
  let supabaseOk = false;
  try {
    const { error } = await supabase
      .from('anonymous_reports')
      .update({
        status: newStatus,
        letter_document: docString,
        updated_at: updatedIso,
      })
      .eq('ticket_code', cleanCode);

    if (!error) {
      supabaseOk = true;
    } else {
      console.warn('[Supabase updateReport error]', error.message);
    }
  } catch (err) {
    console.warn('[Supabase updateReport exception]', err);
  }

  // 2. Simpan ke LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const localList = getSavedReportsFromStorage();
      const updated = localList.map((item) => {
        if (String(item.ticket_code || '').toUpperCase() === cleanCode) {
          return {
            ...item,
            status: newStatus,
            letter_document: docString,
            updated_at: updatedIso,
          };
        }
        return item;
      });
      localStorage.setItem('daradik_saved_reports', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  return supabaseOk;
}

export function getSavedReportsFromStorage(): Record<string, unknown>[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem('daradik_saved_reports');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Hapus data uji coba / tester yang tidak valid
    return parsed.filter((r) => {
      const code = String(r.ticket_code || '');
      const notes = String(r.notes || r.notes_encrypted || '').toLowerCase();
      const isTest = /^(test|testing|coba|percobaan|uji coba|dummy|asdf)/i.test(notes.trim());
      return code.startsWith('CHK-') && !isTest;
    });
  } catch {
    return [];
  }
}

