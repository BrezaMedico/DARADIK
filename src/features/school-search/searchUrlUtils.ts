import { REGION_HIERARCHY } from '@/data';

export interface SchoolSearchFilterState {
  province: string;
  city: string;
  level: string;
  status: string;
  search: string;
  page: number;
}

export const VALID_LEVELS = ['SD', 'SMP', 'SMA', 'SMK'] as const;
export const VALID_STATUSES = ['Negeri', 'Swasta'] as const;
export const PAGE_SIZE = 10;

export function resolveProvinceName(rawProvince: string): string {
  const clean = (rawProvince || '').trim();
  if (!clean) return '';
  const provinces = Object.keys(REGION_HIERARCHY);
  const exact = provinces.find((p) => p.toLowerCase() === clean.toLowerCase());
  return exact || '';
}

export function resolveCityName(
  rawCity: string,
  resolvedProvince: string
): { province: string; city: string } {
  const cleanCity = (rawCity || '').trim();
  if (!cleanCity) {
    return { province: resolvedProvince, city: '' };
  }

  const matchInProvince = (prov: string): string => {
    const cities = Object.keys(REGION_HIERARCHY[prov] || {});
    const lower = cleanCity.toLowerCase();
    const exact = cities.find((c) => c.toLowerCase() === lower);
    if (exact) return exact;

    // Match bare city names against entries prefixed with "Kab." or "Kota".
    const strippedMatch = cities.find(
      (c) => c.replace(/^(kab\.|kota)\s+/i, '').toLowerCase() === lower
    );
    if (strippedMatch) return strippedMatch;

    const partial = cities.find((c) => c.toLowerCase().includes(lower));
    return partial || '';
  };

  if (resolvedProvince) {
    return {
      province: resolvedProvince,
      city: matchInProvince(resolvedProvince),
    };
  }

  // Infer the parent province when a URL query specifies only a city.
  for (const prov of Object.keys(REGION_HIERARCHY)) {
    const matched = matchInProvince(prov);
    if (matched) {
      return { province: prov, city: matched };
    }
  }

  return { province: '', city: '' };
}

export function parseSchoolSearchUrlParams(
  searchStr: string
): SchoolSearchFilterState {
  const params = new URLSearchParams(searchStr);

  const rawProvince = params.get('province') || params.get('provinsi') || '';
  const rawCity = params.get('city') || params.get('kabupaten') || '';
  const rawLevel = (params.get('level') || params.get('jenjang') || '')
    .trim()
    .toUpperCase();
  const rawStatus = (params.get('status') || '').trim();
  // Strip control characters and cap length to prevent malformed query strings.
  const rawSearch = (params.get('search') || params.get('q') || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 120);
  const rawPage = parseInt(params.get('page') || '1', 10);

  const initialProv = resolveProvinceName(rawProvince);
  const { province, city } = resolveCityName(rawCity, initialProv);

  const level = VALID_LEVELS.includes(rawLevel as (typeof VALID_LEVELS)[number])
    ? rawLevel
    : '';

  const matchedStatus = VALID_STATUSES.find(
    (s) => s.toLowerCase() === rawStatus.toLowerCase()
  );
  const status = matchedStatus || '';

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  return {
    province,
    city,
    level,
    status,
    search: rawSearch,
    page,
  };
}

export function buildSchoolSearchUrl(state: SchoolSearchFilterState): string {
  const params = new URLSearchParams();
  if (state.province) params.set('province', state.province);
  if (state.city) params.set('city', state.city);
  if (state.level) params.set('level', state.level);
  if (state.status) params.set('status', state.status);
  if (state.search.trim()) params.set('search', state.search.trim());
  params.set('page', String(Math.max(1, state.page || 1)));

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/search';
}

export function buildPaginationItems(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];

  if (currentPage <= 4) {
    for (let i = 2; i <= 5; i++) {
      items.push(i);
    }
    items.push('ellipsis-end');
    items.push(totalPages);
    return items;
  }

  if (currentPage >= totalPages - 3) {
    items.push('ellipsis-start');
    for (let i = totalPages - 4; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  items.push('ellipsis-start');
  items.push(currentPage - 1);
  items.push(currentPage);
  items.push(currentPage + 1);
  items.push('ellipsis-end');
  items.push(totalPages);
  return items;
}
