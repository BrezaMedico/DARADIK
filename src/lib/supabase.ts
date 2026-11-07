import { createClient } from '@supabase/supabase-js';
import {
  BAZMA_BOSP_ITEMS,
  SCHOOLS_DATABASE,
  SMK_TI_BAZMA,
  SchoolData,
  customizeBospItemsForSchool,
} from '../data/schoolsData';
import {
  InspectionMethodCode,
  PublicStatusHistoryItem,
  ReportInternalStatus,
  ResolutionOutcomeCode,
} from './reportTracking';

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
    jenjang:
      (String(row.jenjang || payload.jenjang || localMatch.jenjang || 'SMK') as
        | 'SD'
        | 'SMP'
        | 'SMA'
        | 'SMK'),
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
  return 'schools_all';
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

export async function fetchSchoolFromSupabase(
  schoolId: string = 'smk-ti-bazma',
  jenjangHint?: string
): Promise<SchoolData | null> {
  const detected = (jenjangHint as JenjangType) || detectJenjangFromIdOrName(schoolId);
  const targetTables = detected
    ? [getJenjangTableName(detected), 'schools_all']
    : ['schools_smk', 'schools_sma', 'schools_smp', 'schools_sd', 'schools_all'];

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
      // lanjut ke tabel berikutnya
    }
  }

  return null;
}

export async function fetchAllSchoolsFromSupabase(
  jenjang?: JenjangType
): Promise<SchoolData[] | null> {
  const targetTable = jenjang ? getJenjangTableName(jenjang) : 'schools_all';

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
    // ignore
  }

  return null;
}

export interface PaginatedSchoolsQuery {
  province?: string;
  city?: string;
  level?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSchoolsResult {
  schools: SchoolData[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchPaginatedSchoolsFromSupabase(
  params: PaginatedSchoolsQuery
): Promise<PaginatedSchoolsResult> {
  const pageSize = Math.max(1, Math.min(50, params.pageSize || 10));
  const requestedPage = Math.max(1, Math.floor(Number(params.page) || 1));

  const province = (params.province || '').trim();
  const city = (params.city || '').trim();
  const level = (params.level || '').trim().toUpperCase();
  const status = (params.status || '').trim();
  const searchRaw = (params.search || '').trim();

  const buildBaseQuery = () => {
    let query = supabase
      .from('schools_all')
      .select(
        'id, name, npsn, jenjang, school_type, status, address, provinsi, kabupaten, kecamatan, student_count, total_bosp, per_student_estimate',
        { count: 'exact' }
      );

    if (province) {
      query = query.eq('provinsi', province);
    }
    if (city) {
      query = query.eq('kabupaten', city);
    }
    if (level && ['SD', 'SMP', 'SMA', 'SMK'].includes(level)) {
      query = query.eq('jenjang', level);
    }
    if (status && (status === 'Negeri' || status === 'Swasta')) {
      query = query.eq('school_type', status);
    }

    if (searchRaw) {
      const tokens = searchRaw
        .split(/\s+/)
        .map((tk) => tk.replace(/[,%()]/g, '').trim())
        .filter(Boolean);

      for (const tk of tokens) {
        const lower = tk.toLowerCase();
        if ('teknologi'.startsWith(lower) && lower.length >= 3) {
          query = query.or(`name.ilike.%${tk}%,name.ilike.% TI %`);
        } else if ('informasi'.startsWith(lower) && lower.length >= 4) {
          query = query.or(`name.ilike.%${tk}%,name.ilike.% TI %`);
        } else {
          query = query.or(
            `name.ilike.%${tk}%,id.ilike.%${tk}%,npsn.ilike.%${tk}%`
          );
        }
      }
    }

    return query
      .order('name', { ascending: true })
      .order('id', { ascending: true });
  };

  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await buildBaseQuery().range(from, to);

  if (error) {
    throw new Error(
      error.message || 'Gagal memuat daftar sekolah dari database.'
    );
  }

  const totalCount = typeof count === 'number' ? count : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount > 0 && requestedPage > totalPages) {
    const clampedFrom = (totalPages - 1) * pageSize;
    const clampedTo = clampedFrom + pageSize - 1;
    const retryRes = await buildBaseQuery().range(clampedFrom, clampedTo);
    if (retryRes.error) {
      throw new Error(
        retryRes.error.message || 'Gagal memuat daftar sekolah dari database.'
      );
    }
    return {
      schools: (retryRes.data || []).map((row) =>
        hydrateSupabaseRowToSchoolData(row as Record<string, unknown>)
      ),
      totalCount,
      page: totalPages,
      pageSize,
      totalPages,
    };
  }

  return {
    schools: (data || []).map((row) =>
      hydrateSupabaseRowToSchoolData(row as Record<string, unknown>)
    ),
    totalCount,
    page: totalCount === 0 ? 1 : requestedPage,
    pageSize,
    totalPages,
  };
}

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

  try {
    const { error } = await supabase
      .from(jenjangTable)
      .upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
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

// =============================================================================
// SISTEM PELAPORAN, PELACAKAN REAL-TIME, AUTENTIKASI, & DASHBOARD PETUGAS DINAS
// =============================================================================

export interface ReportAttachmentMeta {
  name: string;
  sizeFormatted: string;
  url?: string;
  storagePath?: string;
  mimeType?: string;
  uploadedAt?: string;
}

export interface OfficialSchoolIdentity {
  id: string;
  name: string;
  npsn: string;
  jenjang: string | null;
  schoolType: string | null;
  status: string | null;
  address: string | null;
  provinsi: string | null;
  kabupaten: string | null;
  kecamatan: string | null;
  principalName: string | null;
  treasurerName: string | null;
  studentCount: number | null;
  totalBosp: number | null;
  perStudentEstimate: number | null;
  regionCostZone: string | null;
}

export interface MasterSchoolSearchOption {
  id: string;
  name: string;
  npsn: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK';
  schoolType: 'Negeri' | 'Swasta';
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  address: string;
}

export interface OfficerProfileRecord {
  id: string;
  email: string;
  full_name: string;
  jabatan: string;
  unit_kerja: string;
  role: 'officer' | 'supervisor';
  is_active: boolean;
}

export interface PublicReportMessageItem {
  id: string;
  sender_type: 'OFFICER' | 'REPORTER';
  sender_label: string;
  message: string;
  attachments_json: ReportAttachmentMeta[];
  created_at: string;
}

export interface PublicReportTrackingDetail {
  id: string;
  ticket_code: string;
  school_id: string;
  school_name: string;
  school_npsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requester_role: string;
  notes: string;
  status: ReportInternalStatus;
  waiting_additional_info: boolean;
  is_forwarded: boolean;
  forwarded_to: string | null;
  rejection_reason: string | null;
  resolution_outcome: ResolutionOutcomeCode | null;
  public_resolution_note: string | null;
  skip_inspection_reason: string | null;
  field_inspection_conducted: boolean;
  inspection_methods: InspectionMethodCode[];
  attachment_count: number;
  attachments_json: ReportAttachmentMeta[];
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  resolved_at: string | null;
}

export interface PublicReportTrackingPayload {
  report: PublicReportTrackingDetail;
  history: PublicStatusHistoryItem[];
  messages: PublicReportMessageItem[];
}

export interface OfficerQueueReportRow {
  id: string;
  ticket_code: string;
  school_id: string;
  school_name: string;
  school_npsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requester_role: string;
  status: ReportInternalStatus;
  waiting_additional_info: boolean;
  is_forwarded: boolean;
  forwarded_to: string | null;
  resolution_outcome: ResolutionOutcomeCode | null;
  attachment_count: number;
  opened_at: string | null;
  opened_by_name: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface OfficerFullReportRow extends OfficerQueueReportRow {
  notes_encrypted: string;
  ocr_text: string | null;
  ocr_bosp_fact: string | null;
  rejection_reason: string | null;
  public_resolution_note: string | null;
  skip_inspection_reason: string | null;
  field_inspection_conducted: boolean;
  inspection_methods: InspectionMethodCode[];
  attachments_json: ReportAttachmentMeta[];
}

export interface OfficerStatusHistoryRow {
  id: string;
  report_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_uid: string | null;
  changed_by_name: string;
  note: string | null;
  is_internal: boolean;
  created_at: string;
}

export interface OfficerInternalNoteRow {
  id: string;
  report_id: string;
  officer_uid: string;
  officer_name: string;
  note: string;
  created_at: string;
}

export interface OfficerReportDetailBundle {
  report: OfficerFullReportRow;
  schoolIdentity: OfficialSchoolIdentity | null;
  history: OfficerStatusHistoryRow[];
  internalNotes: OfficerInternalNoteRow[];
  messages: PublicReportMessageItem[];
  autoTransitionedOnOpen: boolean;
}

function normalizeAttachments(raw: unknown): ReportAttachmentMeta[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item: Record<string, unknown>) => ({
      name: String(item.name || 'Berkas Lampiran'),
      sizeFormatted: String(item.sizeFormatted || '-'),
      url: item.url ? String(item.url) : undefined,
      storagePath: item.storagePath ? String(item.storagePath) : undefined,
      mimeType: item.mimeType ? String(item.mimeType) : undefined,
      uploadedAt: item.uploadedAt ? String(item.uploadedAt) : undefined,
    }));
}

function normalizeMethods(raw: unknown): InspectionMethodCode[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((x) => String(x) as InspectionMethodCode);
}

function cleanRpcErrorMessage(rawMessage: string): string {
  const prefixes = [
    'CONFLICT_VERSION:',
    'UNAUTHORIZED:',
    'VALIDATION_ERROR:',
    'INVALID_TRANSITION:',
    'INVALID_STATE:',
    'NOT_FOUND:',
  ];
  for (const prefix of prefixes) {
    const idx = rawMessage.indexOf(prefix);
    if (idx >= 0) {
      return rawMessage.slice(idx + prefix.length).trim();
    }
  }
  return rawMessage;
}

/**
 * Pencarian sekolah langsung dari view master database public.schools_all (4.112+ sekolah)
 */
export async function searchMasterSchoolsInSupabase(
  query: string,
  limit: number = 20
): Promise<MasterSchoolSearchOption[]> {
  const q = query.trim();
  let builder = supabase
    .from('schools_all')
    .select('id, name, npsn, jenjang, school_type, provinsi, kabupaten, kecamatan, address')
    .limit(limit);

  if (q) {
    const safe = q.replace(/[,%()]/g, ' ').trim();
    builder = builder.or(
      `name.ilike.%${safe}%,npsn.ilike.%${safe}%,kabupaten.ilike.%${safe}%,kecamatan.ilike.%${safe}%`
    );
  } else {
    builder = builder.order('name', { ascending: true });
  }

  const { data, error } = await builder;
  if (error || !data) {
    throw new Error(error?.message || 'Gagal memuat daftar sekolah dari basis data.');
  }

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id || ''),
    name: String(row.name || ''),
    npsn: String(row.npsn || ''),
    jenjang: (String(row.jenjang || 'SMK').toUpperCase() as 'SD' | 'SMP' | 'SMA' | 'SMK'),
    schoolType: String(row.school_type || 'Negeri') === 'Swasta' ? 'Swasta' : 'Negeri',
    provinsi: String(row.provinsi || ''),
    kabupaten: String(row.kabupaten || ''),
    kecamatan: String(row.kecamatan || ''),
    address: String(row.address || ''),
  }));
}

/**
 * Mengambil identitas resmi sekolah dari tabel master database murni berdasarkan NPSN.
 * Tidak pernah mengarang data atau fallback ke sekolah lain apabila NPSN tidak ditemukan.
 */
export async function fetchOfficialSchoolIdentityByNpsn(
  npsn: string
): Promise<OfficialSchoolIdentity | null> {
  const cleanNpsn = (npsn || '').trim();
  if (!cleanNpsn || cleanNpsn === '-') return null;

  const { data, error } = await supabase
    .from('schools_all')
    .select(
      'id, name, npsn, jenjang, school_type, status, address, provinsi, kabupaten, kecamatan, principal_name, treasurer_name, student_count, total_bosp, per_student_estimate, region_cost_zone'
    )
    .eq('npsn', cleanNpsn)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memeriksa data sekolah pada basis data: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const strOrNull = (val: unknown): string | null => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    return s ? s : null;
  };
  const numOrNull = (val: unknown): number | null => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    npsn: String(row.npsn || cleanNpsn),
    jenjang: strOrNull(row.jenjang),
    schoolType: strOrNull(row.school_type),
    status: strOrNull(row.status),
    address: strOrNull(row.address),
    provinsi: strOrNull(row.provinsi),
    kabupaten: strOrNull(row.kabupaten),
    kecamatan: strOrNull(row.kecamatan),
    principalName: strOrNull(row.principal_name),
    treasurerName: strOrNull(row.treasurer_name),
    studentCount: numOrNull(row.student_count),
    totalBosp: numOrNull(row.total_bosp),
    perStudentEstimate: numOrNull(row.per_student_estimate),
    regionCostZone: strOrNull(row.region_cost_zone),
  };
}

/**
 * Mengunggah berkas gambar/dokumen bukti laporan ke Supabase Storage bucket 'report-evidence'
 */
export async function uploadReportEvidenceFile(
  blobOrFile: Blob | File,
  originalFileName: string,
  folder: 'initial' | 'followup' = 'initial'
): Promise<ReportAttachmentMeta> {
  const safeBaseName = originalFileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-80);
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const storagePath = `${folder}/${ym}/${generateUUID()}-${safeBaseName || 'bukti.jpg'}`;
  const mimeType = blobOrFile.type || 'image/jpeg';

  const { error: uploadError } = await supabase.storage
    .from('report-evidence')
    .upload(storagePath, blobOrFile, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah berkas bukti (${originalFileName}): ${uploadError.message}`);
  }

  const { data: pubData } = supabase.storage
    .from('report-evidence')
    .getPublicUrl(storagePath);

  const sizeKb = Math.max(1, Math.round(blobOrFile.size / 1024));

  return {
    name: originalFileName,
    sizeFormatted: `${sizeKb} KB`,
    url: pubData.publicUrl,
    storagePath,
    mimeType,
    uploadedAt: now.toISOString(),
  };
}

export interface SubmitPublicReportInput {
  schoolId: string;
  schoolName: string;
  schoolNpsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requesterRole: string;
  notes: string;
  attachments: ReportAttachmentMeta[];
  ocrText?: string | null;
  ocrBospFact?: string | null;
}

export interface SubmitPublicReportResult {
  id: string;
  ticket_code: string;
  school_name: string;
  school_npsn: string;
  category: string;
  status: ReportInternalStatus;
  created_at: string;
}

/**
 * Mengirim laporan baru langsung ke Supabase melalui RPC atomik submit_public_report
 */
export async function submitPublicReportRpc(
  input: SubmitPublicReportInput
): Promise<SubmitPublicReportResult> {
  const { data, error } = await supabase.rpc('submit_public_report', {
    p_school_id: input.schoolId,
    p_school_name: input.schoolName,
    p_school_npsn: input.schoolNpsn,
    p_kabupaten: input.kabupaten,
    p_kecamatan: input.kecamatan,
    p_category: input.category,
    p_requester_role: input.requesterRole,
    p_notes: input.notes,
    p_attachments: input.attachments,
    p_ocr_text: input.ocrText || null,
    p_ocr_bosp_fact: input.ocrBospFact || null,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Sistem gagal menerbitkan tiket laporan. Silakan coba kembali.');
  }

  const res = data as Record<string, unknown>;
  return {
    id: String(res.id || ''),
    ticket_code: String(res.ticket_code || ''),
    school_name: String(res.school_name || input.schoolName),
    school_npsn: String(res.school_npsn || input.schoolNpsn),
    category: String(res.category || input.category),
    status: (String(res.status || 'QUEUED') as ReportInternalStatus),
    created_at: String(res.created_at || new Date().toISOString()),
  };
}

/**
 * Mengambil status pelacakan, riwayat perubahan, dan pesan anonim berdasarkan kode tiket
 */
export async function fetchPublicReportTrackingRpc(
  ticketCode: string
): Promise<PublicReportTrackingPayload | null> {
  const cleanCode = ticketCode.trim().toUpperCase();
  if (!cleanCode) return null;

  const { data, error } = await supabase.rpc('get_public_report_tracking', {
    p_ticket_code: cleanCode,
  });

  if (error) {
    throw new Error(`Gagal memuat data pelacakan dari server: ${cleanRpcErrorMessage(error.message)}`);
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const rawPayload = data as Record<string, unknown>;
  const r = (rawPayload.report || {}) as Record<string, unknown>;
  const rawHistory = Array.isArray(rawPayload.history) ? rawPayload.history : [];
  const rawMessages = Array.isArray(rawPayload.messages) ? rawPayload.messages : [];

  return {
    report: {
      id: String(r.id || ''),
      ticket_code: String(r.ticket_code || cleanCode),
      school_id: String(r.school_id || ''),
      school_name: String(r.school_name || ''),
      school_npsn: String(r.school_npsn || ''),
      kabupaten: String(r.kabupaten || ''),
      kecamatan: String(r.kecamatan || ''),
      category: String(r.category || ''),
      requester_role: String(r.requester_role || ''),
      notes: String(r.notes || ''),
      status: (String(r.status || 'QUEUED') as ReportInternalStatus),
      waiting_additional_info: Boolean(r.waiting_additional_info),
      is_forwarded: Boolean(r.is_forwarded),
      forwarded_to: r.forwarded_to ? String(r.forwarded_to) : null,
      rejection_reason: r.rejection_reason ? String(r.rejection_reason) : null,
      resolution_outcome: r.resolution_outcome
        ? (String(r.resolution_outcome) as ResolutionOutcomeCode)
        : null,
      public_resolution_note: r.public_resolution_note
        ? String(r.public_resolution_note)
        : null,
      skip_inspection_reason: r.skip_inspection_reason
        ? String(r.skip_inspection_reason)
        : null,
      field_inspection_conducted: Boolean(r.field_inspection_conducted),
      inspection_methods: normalizeMethods(r.inspection_methods),
      attachment_count: Number(r.attachment_count || 0),
      attachments_json: normalizeAttachments(r.attachments_json),
      created_at: String(r.created_at || ''),
      updated_at: String(r.updated_at || ''),
      opened_at: r.opened_at ? String(r.opened_at) : null,
      resolved_at: r.resolved_at ? String(r.resolved_at) : null,
    },
    history: rawHistory.map((item: Record<string, unknown>) => ({
      id: String(item.id || ''),
      previous_status: item.previous_status ? String(item.previous_status) : null,
      new_status: String(item.new_status || ''),
      actor_label: String(item.actor_label || 'Sistem DARADIK'),
      note: item.note ? String(item.note) : null,
      created_at: String(item.created_at || ''),
    })),
    messages: rawMessages.map((m: Record<string, unknown>) => ({
      id: String(m.id || ''),
      sender_type: String(m.sender_type) === 'OFFICER' ? 'OFFICER' : 'REPORTER',
      sender_label: String(m.sender_label || 'Pelapor Anonim'),
      message: String(m.message || ''),
      attachments_json: normalizeAttachments(m.attachments_json),
      created_at: String(m.created_at || ''),
    })),
  };
}

/**
 * Mengirim balasan pesan dan bukti tambahan dari pelapor secara anonim menggunakan kode tiket
 */
export async function submitReporterAdditionalInfoRpc(
  ticketCode: string,
  message: string,
  attachments: ReportAttachmentMeta[] = []
): Promise<void> {
  const { error } = await supabase.rpc('submit_reporter_additional_info', {
    p_ticket_code: ticketCode.trim().toUpperCase(),
    p_message: message,
    p_attachments: attachments,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }
}

// =============================================================================
// AUTENTIKASI & OPERASI PETUGAS DINAS PENDIDIKAN
// =============================================================================

export async function getActiveOfficerSession(): Promise<OfficerProfileRecord | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('officer_profiles')
    .select('id, email, full_name, jabatan, unit_kerja, role, is_active')
    .eq('id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return profile as OfficerProfileRecord;
}

export async function signInOfficerWithPassword(
  emailOrUsername: string,
  password: string
): Promise<OfficerProfileRecord> {
  const cleanInput = emailOrUsername.trim().toLowerCase();
  const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@daradik.id`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    throw new Error('Username atau kata sandi administrator tidak sesuai.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('officer_profiles')
    .select('id, email, full_name, jabatan, unit_kerja, role, is_active')
    .eq('id', data.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error(
      'Akun Anda tidak terdaftar sebagai administrator aktif Dinas Pendidikan pada sistem DARADIK.'
    );
  }

  return profile as OfficerProfileRecord;
}

export async function signOutOfficer(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchOfficerReportsQueue(): Promise<OfficerQueueReportRow[]> {
  const { data, error } = await supabase
    .from('anonymous_reports')
    .select(
      'id, ticket_code, school_id, school_name, school_npsn, kabupaten, kecamatan, category, requester_role, status, waiting_additional_info, is_forwarded, forwarded_to, resolution_outcome, attachment_count, opened_at, opened_by_name, resolved_at, resolved_by_name, version, created_at, updated_at'
    )
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat antrean laporan dari Supabase: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    id: String(r.id || ''),
    ticket_code: String(r.ticket_code || ''),
    school_id: String(r.school_id || ''),
    school_name: String(r.school_name || ''),
    school_npsn: String(r.school_npsn || ''),
    kabupaten: String(r.kabupaten || ''),
    kecamatan: String(r.kecamatan || ''),
    category: String(r.category || ''),
    requester_role: String(r.requester_role || ''),
    status: (String(r.status || 'QUEUED') as ReportInternalStatus),
    waiting_additional_info: Boolean(r.waiting_additional_info),
    is_forwarded: Boolean(r.is_forwarded),
    forwarded_to: r.forwarded_to ? String(r.forwarded_to) : null,
    resolution_outcome: r.resolution_outcome
      ? (String(r.resolution_outcome) as ResolutionOutcomeCode)
      : null,
    attachment_count: Number(r.attachment_count || 0),
    opened_at: r.opened_at ? String(r.opened_at) : null,
    opened_by_name: r.opened_by_name ? String(r.opened_by_name) : null,
    resolved_at: r.resolved_at ? String(r.resolved_at) : null,
    resolved_by_name: r.resolved_by_name ? String(r.resolved_by_name) : null,
    version: Number(r.version || 1),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  }));
}

export async function fetchOfficerReportDetailSnapshot(
  reportId: string,
  autoTransitionedOnOpen: boolean = false
): Promise<OfficerReportDetailBundle> {
  const [reportRes, historyRes, internalRes, messagesRes] = await Promise.all([
    supabase
      .from('anonymous_reports')
      .select(
        'id, ticket_code, school_id, school_name, school_npsn, kabupaten, kecamatan, category, requester_role, notes_encrypted, status, waiting_additional_info, is_forwarded, forwarded_to, ocr_text, ocr_bosp_fact, rejection_reason, resolution_outcome, public_resolution_note, skip_inspection_reason, field_inspection_conducted, inspection_methods, attachment_count, attachments_json, opened_at, opened_by_name, resolved_at, resolved_by_name, version, created_at, updated_at'
      )
      .eq('id', reportId)
      .single(),
    supabase
      .from('report_status_history')
      .select(
        'id, report_id, previous_status, new_status, changed_by_uid, changed_by_name, note, is_internal, created_at'
      )
      .eq('report_id', reportId)
      .order('created_at', { ascending: true }),
    supabase
      .from('report_internal_notes')
      .select('id, report_id, officer_uid, officer_name, note, created_at')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false }),
    supabase
      .from('report_messages')
      .select('id, sender_type, sender_label, message, attachments_json, created_at')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true }),
  ]);

  if (reportRes.error || !reportRes.data) {
    throw new Error(
      reportRes.error?.message || 'Detail laporan tidak ditemukan di basis data.'
    );
  }

  const r = reportRes.data as Record<string, unknown>;
  const schoolNpsn = String(r.school_npsn || '');
  const schoolIdentity = await fetchOfficialSchoolIdentityByNpsn(schoolNpsn);

  const fullReport: OfficerFullReportRow = {
    id: String(r.id || ''),
    ticket_code: String(r.ticket_code || ''),
    school_id: String(r.school_id || ''),
    school_name: String(r.school_name || ''),
    school_npsn: schoolNpsn,
    kabupaten: String(r.kabupaten || ''),
    kecamatan: String(r.kecamatan || ''),
    category: String(r.category || ''),
    requester_role: String(r.requester_role || ''),
    notes_encrypted: String(r.notes_encrypted || ''),
    status: (String(r.status || 'QUEUED') as ReportInternalStatus),
    waiting_additional_info: Boolean(r.waiting_additional_info),
    is_forwarded: Boolean(r.is_forwarded),
    forwarded_to: r.forwarded_to ? String(r.forwarded_to) : null,
    ocr_text: r.ocr_text ? String(r.ocr_text) : null,
    ocr_bosp_fact: r.ocr_bosp_fact ? String(r.ocr_bosp_fact) : null,
    rejection_reason: r.rejection_reason ? String(r.rejection_reason) : null,
    resolution_outcome: r.resolution_outcome
      ? (String(r.resolution_outcome) as ResolutionOutcomeCode)
      : null,
    public_resolution_note: r.public_resolution_note
      ? String(r.public_resolution_note)
      : null,
    skip_inspection_reason: r.skip_inspection_reason
      ? String(r.skip_inspection_reason)
      : null,
    field_inspection_conducted: Boolean(r.field_inspection_conducted),
    inspection_methods: normalizeMethods(r.inspection_methods),
    attachment_count: Number(r.attachment_count || 0),
    attachments_json: normalizeAttachments(r.attachments_json),
    opened_at: r.opened_at ? String(r.opened_at) : null,
    opened_by_name: r.opened_by_name ? String(r.opened_by_name) : null,
    resolved_at: r.resolved_at ? String(r.resolved_at) : null,
    resolved_by_name: r.resolved_by_name ? String(r.resolved_by_name) : null,
    version: Number(r.version || 1),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  };

  return {
    report: fullReport,
    schoolIdentity,
    history: (historyRes.data || []).map((h: Record<string, unknown>) => ({
      id: String(h.id || ''),
      report_id: String(h.report_id || reportId),
      previous_status: h.previous_status ? String(h.previous_status) : null,
      new_status: String(h.new_status || ''),
      changed_by_uid: h.changed_by_uid ? String(h.changed_by_uid) : null,
      changed_by_name: String(h.changed_by_name || 'Sistem DARADIK'),
      note: h.note ? String(h.note) : null,
      is_internal: Boolean(h.is_internal),
      created_at: String(h.created_at || ''),
    })),
    internalNotes: (internalRes.data || []).map((n: Record<string, unknown>) => ({
      id: String(n.id || ''),
      report_id: String(n.report_id || reportId),
      officer_uid: String(n.officer_uid || ''),
      officer_name: String(n.officer_name || ''),
      note: String(n.note || ''),
      created_at: String(n.created_at || ''),
    })),
    messages: (messagesRes.data || []).map((m: Record<string, unknown>) => ({
      id: String(m.id || ''),
      sender_type: String(m.sender_type) === 'OFFICER' ? 'OFFICER' : 'REPORTER',
      sender_label: String(m.sender_label || ''),
      message: String(m.message || ''),
      attachments_json: normalizeAttachments(m.attachments_json),
      created_at: String(m.created_at || ''),
    })),
    autoTransitionedOnOpen,
  };
}

/**
 * Dipanggil ketika petugas berwenang mengeklik "Buka Detail" pada suatu laporan.
 * Jika status masih QUEUED dan belum pernah dibuka, otomatis berubah satu kali ke SEDANG_DITELAAH.
 */
export async function openReportDetailByOfficer(
  reportId: string
): Promise<OfficerReportDetailBundle> {
  const { data, error } = await supabase.rpc('officer_open_report_detail', {
    p_report_id: reportId,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  const rpcRes = (data || {}) as Record<string, unknown>;
  const transitioned = Boolean(rpcRes.transitioned);

  return fetchOfficerReportDetailSnapshot(reportId, transitioned);
}

export type OfficerTransitionAction =
  | 'ACCEPT_FOR_FOLLOWUP'
  | 'REJECT_REPORT'
  | 'SAVE_INSPECTION_PROGRESS'
  | 'REQUEST_ADDITIONAL_INFO'
  | 'COMPLETE_REPORT';

export interface OfficerTransitionInput {
  reportId: string;
  expectedVersion: number;
  action: OfficerTransitionAction;
  rejectionReason?: string | null;
  resolutionOutcome?: ResolutionOutcomeCode | null;
  publicResolutionNote?: string | null;
  internalNote?: string | null;
  messageToReporter?: string | null;
  inspectionMethods?: InspectionMethodCode[] | null;
  isForwarded?: boolean | null;
  forwardedTo?: string | null;
  skipInspectionReason?: string | null;
}

export class ReportVersionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportVersionConflictError';
  }
}

export async function transitionReportByOfficerRpc(
  input: OfficerTransitionInput
): Promise<{ status: ReportInternalStatus; version: number; updated_at: string }> {
  const { data, error } = await supabase.rpc('officer_transition_report', {
    p_report_id: input.reportId,
    p_expected_version: input.expectedVersion,
    p_action: input.action,
    p_rejection_reason: input.rejectionReason ?? null,
    p_resolution_outcome: input.resolutionOutcome ?? null,
    p_public_resolution_note: input.publicResolutionNote ?? null,
    p_internal_note: input.internalNote ?? null,
    p_message_to_reporter: input.messageToReporter ?? null,
    p_inspection_methods: input.inspectionMethods ?? null,
    p_is_forwarded: input.isForwarded ?? null,
    p_forwarded_to: input.forwardedTo ?? null,
    p_skip_inspection_reason: input.skipInspectionReason ?? null,
  });

  if (error) {
    if (error.message.includes('CONFLICT_VERSION:')) {
      throw new ReportVersionConflictError(cleanRpcErrorMessage(error.message));
    }
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  const res = (data || {}) as Record<string, unknown>;
  return {
    status: (String(res.status || 'SEDANG_DITELAAH') as ReportInternalStatus),
    version: Number(res.version || input.expectedVersion + 1),
    updated_at: String(res.updated_at || new Date().toISOString()),
  };
}

export async function addOfficerInternalNoteRpc(
  reportId: string,
  note: string
): Promise<OfficerInternalNoteRow> {
  const { data, error } = await supabase.rpc('officer_add_internal_note', {
    p_report_id: reportId,
    p_note: note,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  const r = (data || {}) as Record<string, unknown>;
  return {
    id: String(r.id || ''),
    report_id: String(r.report_id || reportId),
    officer_uid: String(r.officer_uid || ''),
    officer_name: String(r.officer_name || ''),
    note: String(r.note || note),
    created_at: String(r.created_at || new Date().toISOString()),
  };
}
