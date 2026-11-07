import { supabase } from './client';
import type {
  BospRealizationItem,
  BudgetComposition,
  KamusBospItem,
  SchoolData,
} from '@/types/school';
import type {
  MasterSchoolSearchOption,
  OfficialSchoolIdentity,
} from '@/types/report';

export type JenjangType = 'SD' | 'SMP' | 'SMA' | 'SMK';

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
    // Fall back to embedded items inside data_payload when the RPC fails.
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
    // Return null so callers can fall back to local seed data.
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
