import { createClient } from '@supabase/supabase-js';
import {
  BospRealizationItem,
  BudgetComposition,
  KamusBospItem,
  SchoolData,
} from '../data/schoolsData';
import {
  InspectionMethodCode,
  PublicStatusHistoryItem,
  ReportInternalStatus,
  ResolutionOutcomeCode,
} from './reportTracking';
import {
  encryptClientPayload,
  generateAnonymousEvidencePath,
} from './cryptoSecurity';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://eteimuixvdbcnzokckff.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable__L_ZAHdcCN9NXZn1myW90A_QfDZyD8J';

const privacyShieldFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers || {});
  headers.set('X-Client-Info', 'daradik-privacy-shield');
  headers.delete('X-Forwarded-For');
  headers.delete('CF-Connecting-IP');
  headers.delete('X-Real-IP');

  return fetch(input, {
    ...init,
    headers,
    referrerPolicy: 'no-referrer',
  });
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'daradik-privacy-shield',
    },
    fetch: privacyShieldFetch,
  },
});

export function mapDbItemRowToBospRealizationItem(
  row: Record<string, unknown>
): BospRealizationItem {
  const invoiceRaw =
    row.invoice_json && typeof row.invoice_json === 'object'
      ? (row.invoice_json as BospRealizationItem['invoice'])
      : {
          number: '-',
          vendorName: '-',
          vendorAddress: '-',
          npwp: '-',
          date: '-',
          treasurerName: '-',
          principalName: '-',
          lineItems: [],
        };

  const geotagRaw =
    row.geotag_json && typeof row.geotag_json === 'object'
      ? (row.geotag_json as BospRealizationItem['geotag'])
      : {
          lat: '-6.5683',
          lng: '106.6974',
          roomLabel: '-',
          uploadedAt: '-',
          inspectorNote: '-',
          conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
        };

  const keywordsRaw = Array.isArray(row.keywords)
    ? row.keywords.map((k) => String(k))
    : [];

  return {
    id: String(row.item_id || row.id || ''),
    code: String(row.code || ''),
    name: String(row.name || ''),
    unitSummary: String(row.unit_summary || ''),
    amount: Number(row.amount || 0),
    category: String(row.category || ''),
    aiCategoryPath: String(row.ai_category_path || ''),
    date: String(row.realization_date || ''),
    stage: (String(row.stage || 'Tahap 1') === 'Tahap 2'
      ? 'Tahap 2'
      : 'Tahap 1') as 'Tahap 1' | 'Tahap 2',
    allocation: String(row.allocation || ''),
    iconType: (String(row.icon_type || 'book') as BospRealizationItem['iconType']),
    keywords: keywordsRaw,
    invoice: invoiceRaw,
    geotag: geotagRaw,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
  };
}

export async function fetchSchoolBospItemsFromSupabase(
  schoolIdOrNpsn: string
): Promise<BospRealizationItem[]> {
  const clean = (schoolIdOrNpsn || '').trim();
  if (!clean) return [];

  try {
    const { data, error } = await supabase.rpc('rpc_get_school_bosp_items', {
      p_identifier: clean,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) =>
        mapDbItemRowToBospRealizationItem(row as Record<string, unknown>)
      );
    }
  } catch {
    // fallback ke items di data_payload
  }
  return [];
}

export function hydrateSupabaseRowToSchoolData(
  row: Record<string, unknown>,
  dbItems?: BospRealizationItem[]
): SchoolData {
  const payload =
    row.data_payload &&
    typeof row.data_payload === 'object' &&
    !Array.isArray(row.data_payload)
      ? (row.data_payload as Partial<SchoolData>)
      : {};

  const id = String(row.id || payload.id || '');
  const npsn = String(row.npsn || payload.npsn || '');
  const name = String(row.name || payload.name || '');

  const jenjangRaw = String(
    row.jenjang || payload.jenjang || payload.educationLevel || 'SMK'
  ).toUpperCase();
  const jenjang = (
    ['SD', 'SMP', 'SMA', 'SMK'].includes(jenjangRaw) ? jenjangRaw : 'SMK'
  ) as 'SD' | 'SMP' | 'SMA' | 'SMK';

  const schoolTypeRaw = String(
    row.school_type || payload.schoolType || 'Negeri'
  );
  const schoolType: 'Negeri' | 'Swasta' =
    schoolTypeRaw === 'Swasta' ? 'Swasta' : 'Negeri';

  const provinsi = String(row.provinsi || payload.provinsi || '');
  const kabupaten = String(row.kabupaten || payload.kabupaten || '');
  const kecamatan = String(row.kecamatan || payload.kecamatan || '');
  const address = String(row.address || payload.address || '');
  const status = String(
    row.status || payload.status || 'Terdaftar Aktif di Kemendikdasmen'
  );

  const principalName = String(
    row.principal_name || payload.principalName || '-'
  );
  const treasurerName = String(
    row.treasurer_name || payload.treasurerName || '-'
  );

  const studentCount = Number(
    row.student_count ?? payload.studentCount ?? 100
  );
  const perStudentEstimate = Number(
    row.per_student_estimate ?? payload.perStudentEstimate ?? 1500000
  );
  const totalBosp = Number(
    row.total_bosp ?? payload.totalBosp ?? studentCount * perStudentEstimate
  );

  const maxHonorariumLimit = Number(
    payload.maxHonorariumLimit ?? (schoolType === 'Swasta' ? 40 : 20)
  );
  const regionCostZone = String(
    row.region_cost_zone ||
      payload.regionCostZone ||
      `Satuan Biaya BOSP ${kabupaten}, ${provinsi} (${jenjang}) — Kepmendikbud 16/P/2021`
  );

  const halfAmount = Math.round(totalBosp / 2);
  const tahap1 =
    payload.tahap1 && typeof payload.tahap1 === 'object'
      ? {
          amount: Number(payload.tahap1.amount ?? halfAmount),
          period: String(payload.tahap1.period || 'Jan–Jun'),
          status: String(payload.tahap1.status || 'Sudah Cair'),
          disbursedDate: String(
            payload.tahap1.disbursedDate || '16 Februari 2026'
          ),
        }
      : {
          amount: halfAmount,
          period: 'Jan–Jun',
          status: 'Sudah Cair',
          disbursedDate: '16 Februari 2026',
        };

  const tahap2 =
    payload.tahap2 && typeof payload.tahap2 === 'object'
      ? {
          amount: Number(payload.tahap2.amount ?? totalBosp - halfAmount),
          period: String(payload.tahap2.period || 'Jul–Des'),
          status: String(payload.tahap2.status || 'Sudah Cair'),
          disbursedDate: String(
            payload.tahap2.disbursedDate || '14 Agustus 2026'
          ),
        }
      : {
          amount: totalBosp - halfAmount,
          period: 'Jul–Des',
          status: 'Sudah Cair',
          disbursedDate: '14 Agustus 2026',
        };

  const compositions: BudgetComposition[] = Array.isArray(payload.compositions)
    ? payload.compositions.map((c) => ({ ...c }))
    : [];

  const tahap1Compositions: BudgetComposition[] | undefined =
    Array.isArray(payload.tahap1Compositions) &&
    payload.tahap1Compositions.length > 0
      ? payload.tahap1Compositions.map((c) => ({ ...c }))
      : undefined;

  const tahap2Compositions: BudgetComposition[] | undefined =
    Array.isArray(payload.tahap2Compositions) &&
    payload.tahap2Compositions.length > 0
      ? payload.tahap2Compositions.map((c) => ({ ...c }))
      : undefined;

  const items: BospRealizationItem[] =
    dbItems && dbItems.length > 0
      ? dbItems
      : Array.isArray(payload.items)
      ? payload.items.map((it) => ({ ...it }))
      : [];

  return {
    id,
    name,
    npsn,
    sampleNisn: String(payload.sampleNisn || '0081928491'),
    principalName,
    treasurerName,
    provinsi,
    kabupaten,
    kecamatan,
    address,
    status,
    schoolType,
    educationLevel: jenjang,
    jenjang,
    maxHonorariumLimit,
    regionCostZone,
    studentCount,
    perStudentEstimate,
    totalBosp,
    tahap1,
    tahap2,
    compositions,
    tahap1Compositions,
    tahap2Compositions,
    items,
    imageUrl: String(row.image_url || payload.imageUrl || ''),
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
  _jenjangHint?: string
): Promise<SchoolData | null> {
  const cleanId = (schoolId || '').trim();
  if (!cleanId) return null;

  try {
    const { data, error } = await supabase.rpc('rpc_get_school_by_id_or_npsn', {
      p_identifier: cleanId,
    });

    if (!error && data && typeof data === 'object') {
      const bundle = data as Record<string, unknown>;
      const schoolRow = bundle.school as Record<string, unknown> | undefined;
      const rawItems = Array.isArray(bundle.items) ? bundle.items : [];
      if (schoolRow) {
        const dbItems = rawItems.map((it) =>
          mapDbItemRowToBospRealizationItem(it as Record<string, unknown>)
        );
        return hydrateSupabaseRowToSchoolData(schoolRow, dbItems);
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function fetchKamusBospFromSupabase(): Promise<{
  allowed: KamusBospItem[];
  prohibited: KamusBospItem[];
} | null> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_kamus_bosp');

    if (error || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const allowed: KamusBospItem[] = [];
    const prohibited: KamusBospItem[] = [];

    for (const row of data as Record<string, unknown>[]) {
      const item: KamusBospItem = {
        title: String(row.title || ''),
        detail: String(row.detail || ''),
        ref: String(row.ref || ''),
      };
      if (String(row.entry_type) === 'prohibited') {
        prohibited.push(item);
      } else {
        allowed.push(item);
      }
    }

    return { allowed, prohibited };
  } catch {
    return null;
  }
}

export async function fetchAllSchoolsFromSupabase(
  jenjang?: JenjangType
): Promise<SchoolData[] | null> {
  try {
    const res = await fetchPaginatedSchoolsFromSupabase({
      level: jenjang || '',
      page: 1,
      pageSize: 50,
    });
    return res.schools.length > 0 ? res.schools : null;
  } catch {
    return null;
  }
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

  const { data, error } = await supabase.rpc('rpc_get_paginated_schools', {
    p_province: province,
    p_city: city,
    p_level: level,
    p_status: status,
    p_search: searchRaw,
    p_page: requestedPage,
    p_page_size: pageSize,
  });

  if (error || !data || typeof data !== 'object') {
    throw new Error(
      error?.message || 'Gagal memuat daftar sekolah dari database.'
    );
  }

  const payload = data as Record<string, unknown>;
  const rawRows = Array.isArray(payload.rows) ? payload.rows : [];
  const totalCount = Number(payload.total_count || 0);
  const resolvedPage = Number(payload.page || 1);
  const resolvedSize = Number(payload.page_size || pageSize);
  const totalPages = Math.max(1, Number(payload.total_pages || 1));

  return {
    schools: rawRows.map((row) =>
      hydrateSupabaseRowToSchoolData(row as Record<string, unknown>)
    ),
    totalCount,
    page: totalCount === 0 ? 1 : resolvedPage,
    pageSize: resolvedSize,
    totalPages,
  };
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
 * Pencarian sekolah melalui RPC terkendali rpc_search_master_schools
 */
export async function searchMasterSchoolsInSupabase(
  query: string,
  limit: number = 20
): Promise<MasterSchoolSearchOption[]> {
  const q = query.trim();
  const safeLimit = Math.max(1, Math.min(30, limit));

  const { data, error } = await supabase.rpc('rpc_search_master_schools', {
    p_query: q,
    p_limit: safeLimit,
  });

  if (error || !Array.isArray(data)) {
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
 * Mengambil identitas resmi sekolah dari tabel master database murni berdasarkan NPSN via RPC terkendali.
 */
export async function fetchOfficialSchoolIdentityByNpsn(
  npsn: string
): Promise<OfficialSchoolIdentity | null> {
  const cleanNpsn = (npsn || '').trim();
  if (!cleanNpsn || cleanNpsn === '-') return null;

  const { data, error } = await supabase.rpc('rpc_get_official_school_identity', {
    p_npsn: cleanNpsn,
  });

  if (error) {
    throw new Error(`Gagal memeriksa data sekolah pada basis data: ${error.message}`);
  }

  if (!data || typeof data !== 'object') {
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
 * menggunakan token nama berkas acak agar nama berkas perangkat pelapor dirahasiakan.
 */
export async function uploadReportEvidenceFile(
  blobOrFile: Blob | File,
  _originalFileName: string,
  folder: 'initial' | 'followup' = 'initial'
): Promise<ReportAttachmentMeta> {
  const mimeType = blobOrFile.type || 'image/jpeg';
  const { storagePath, maskedDisplayName } = generateAnonymousEvidencePath(
    folder,
    mimeType
  );

  const { error: uploadError } = await supabase.storage
    .from('report-evidence')
    .upload(storagePath, blobOrFile, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah berkas bukti terenkripsi: ${uploadError.message}`);
  }

  const { data: pubData } = supabase.storage
    .from('report-evidence')
    .getPublicUrl(storagePath);

  const sizeKb = Math.max(1, Math.round(blobOrFile.size / 1024));

  return {
    name: maskedDisplayName,
    sizeFormatted: `${sizeKb} KB`,
    url: pubData.publicUrl,
    storagePath,
    mimeType,
    uploadedAt: new Date().toISOString(),
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
 * Mengirim laporan baru ke Supabase dalam bentuk amplop terenkripsi penuh (E2EE AES-256-CBC + HMAC-SHA256)
 */
export async function submitPublicReportRpc(
  input: SubmitPublicReportInput
): Promise<SubmitPublicReportResult> {
  const encryptedEnvelope = await encryptClientPayload({
    schoolId: input.schoolId,
    schoolName: input.schoolName,
    schoolNpsn: input.schoolNpsn,
    kabupaten: input.kabupaten,
    kecamatan: input.kecamatan,
    category: input.category,
    requesterRole: input.requesterRole,
    notes: input.notes,
    attachments: input.attachments,
    ocrText: input.ocrText || null,
    ocrBospFact: input.ocrBospFact || null,
  });

  const { data, error } = await supabase.rpc('submit_public_report_encrypted', {
    p_envelope: encryptedEnvelope,
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
 * Mengambil status pelacakan, riwayat perubahan, dan pesan anonim berdasarkan kode tiket (case-sensitive)
 */
export async function fetchPublicReportTrackingRpc(
  ticketCode: string
): Promise<PublicReportTrackingPayload | null> {
  const cleanCode = ticketCode.trim();
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
 * Mengirim balasan pesan dan bukti tambahan dari pelapor secara anonim & terenkripsi penuh (E2EE)
 */
export async function submitReporterAdditionalInfoRpc(
  ticketCode: string,
  message: string,
  attachments: ReportAttachmentMeta[] = []
): Promise<void> {
  const encryptedEnvelope = await encryptClientPayload({
    ticketCode: ticketCode.trim(),
    message,
    attachments,
  });

  const { error } = await supabase.rpc('submit_reporter_additional_info_encrypted', {
    p_envelope: encryptedEnvelope,
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
  const { data, error } = await supabase.rpc('officer_get_reports_queue');

  if (error) {
    throw new Error(
      `Gagal memuat antrean laporan dari Supabase: ${cleanRpcErrorMessage(error.message)}`
    );
  }

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: Record<string, unknown>) => ({
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
  const { data, error } = await supabase.rpc('officer_get_report_detail_bundle', {
    p_report_id: reportId,
  });

  if (error || !data || typeof data !== 'object') {
    throw new Error(
      error ? cleanRpcErrorMessage(error.message) : 'Detail laporan tidak ditemukan di basis data.'
    );
  }

  const bundle = data as Record<string, unknown>;
  const r = (bundle.report || {}) as Record<string, unknown>;
  const rawHistory = Array.isArray(bundle.history) ? bundle.history : [];
  const rawInternal = Array.isArray(bundle.internal_notes) ? bundle.internal_notes : [];
  const rawMessages = Array.isArray(bundle.messages) ? bundle.messages : [];

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
    history: rawHistory.map((h: Record<string, unknown>) => ({
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
    internalNotes: rawInternal.map((n: Record<string, unknown>) => ({
      id: String(n.id || ''),
      report_id: String(n.report_id || reportId),
      officer_uid: String(n.officer_uid || ''),
      officer_name: String(n.officer_name || ''),
      note: String(n.note || ''),
      created_at: String(n.created_at || ''),
    })),
    messages: rawMessages.map((m: Record<string, unknown>) => ({
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
