import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { REGION_HIERARCHY, SchoolData } from '../data/schoolsData';
import { fetchPaginatedSchoolsFromSupabase } from '../lib/supabase';

export interface SchoolSearchFilterState {
  province: string;
  city: string;
  level: string;
  status: string;
  search: string;
  page: number;
}

const VALID_LEVELS = ['SD', 'SMP', 'SMA', 'SMK'] as const;
const VALID_STATUSES = ['Negeri', 'Swasta'] as const;
const PAGE_SIZE = 10;

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

function buildPaginationItems(
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

interface SchoolSearchPageProps {
  initialFilters?: Partial<SchoolSearchFilterState>;
  onSelectSchool: (school: SchoolData) => void;
  onBackToLanding: () => void;
}

export const SchoolSearchPage: React.FC<SchoolSearchPageProps> = ({
  initialFilters,
  onSelectSchool,
  onBackToLanding,
}) => {
  const initialParsed = useMemo<SchoolSearchFilterState>(() => {
    const fromUrl =
      typeof window !== 'undefined'
        ? parseSchoolSearchUrlParams(window.location.search)
        : {
            province: '',
            city: '',
            level: '',
            status: '',
            search: '',
            page: 1,
          };

    const hasUrlCriteria =
      Boolean(fromUrl.province) ||
      Boolean(fromUrl.city) ||
      Boolean(fromUrl.level) ||
      Boolean(fromUrl.status) ||
      Boolean(fromUrl.search) ||
      fromUrl.page > 1;

    if (hasUrlCriteria || !initialFilters) {
      return fromUrl;
    }

    const prov = resolveProvinceName(initialFilters.province || '');
    const resolvedRegion = resolveCityName(initialFilters.city || '', prov);

    return {
      province: resolvedRegion.province,
      city: resolvedRegion.city,
      level: VALID_LEVELS.includes(
        (initialFilters.level || '').toUpperCase() as (typeof VALID_LEVELS)[number]
      )
        ? (initialFilters.level || '').toUpperCase()
        : '',
      status:
        VALID_STATUSES.find(
          (s) => s.toLowerCase() === (initialFilters.status || '').toLowerCase()
        ) || '',
      search: (initialFilters.search || '').trim(),
      page:
        initialFilters.page && initialFilters.page >= 1
          ? initialFilters.page
          : 1,
    };
  }, [initialFilters]);

  const [province, setProvince] = useState<string>(initialParsed.province);
  const [city, setCity] = useState<string>(initialParsed.city);
  const [level, setLevel] = useState<string>(initialParsed.level);
  const [status, setStatus] = useState<string>(initialParsed.status);
  const [searchInput, setSearchInput] = useState<string>(initialParsed.search);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(
    initialParsed.search
  );
  const [page, setPage] = useState<number>(initialParsed.page);

  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPopStateSyncRef = useRef<boolean>(false);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  const provinceOptions = useMemo(() => Object.keys(REGION_HIERARCHY), []);

  const cityOptions = useMemo(() => {
    if (!province || !REGION_HIERARCHY[province]) return [];
    return Object.keys(REGION_HIERARCHY[province]);
  }, [province]);

  // Debounce pencarian nama sekolah (350ms)
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  // Sinkronisasi state ke URL browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPopStateSyncRef.current) {
      isPopStateSyncRef.current = false;
      return;
    }

    const nextUrl = buildSchoolSearchUrl({
      province,
      city,
      level,
      status,
      search: debouncedSearch,
      page,
    });

    const currentFull = `${window.location.pathname}${window.location.search}`;
    if (currentFull !== nextUrl) {
      window.history.pushState({ view: 'school-search' }, '', nextUrl);
    }
  }, [province, city, level, status, debouncedSearch, page]);

  // Mendengarkan tombol Back / Forward pada browser
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname.toLowerCase();
      if (pathname !== '/search' && pathname !== '/search/') return;

      isPopStateSyncRef.current = true;
      const parsed = parseSchoolSearchUrlParams(window.location.search);
      setProvince(parsed.province);
      setCity(parsed.city);
      setLevel(parsed.level);
      setStatus(parsed.status);
      setSearchInput(parsed.search);
      setDebouncedSearch(parsed.search);
      setPage(parsed.page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Mengambil data sekolah secara server-side pagination dari Supabase
  const loadSchools = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await fetchPaginatedSchoolsFromSupabase({
        province,
        city,
        level,
        status,
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
      });

      setSchools(result.schools);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);

      if (result.page !== page) {
        setPage(result.page);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat memuat data sekolah. Silakan coba kembali.'
      );
      setSchools([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [province, city, level, status, debouncedSearch, page]);

  useEffect(() => {
    let isCancelled = false;

    const execute = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const result = await fetchPaginatedSchoolsFromSupabase({
          province,
          city,
          level,
          status,
          search: debouncedSearch,
          page,
          pageSize: PAGE_SIZE,
        });
        if (isCancelled) return;
        setSchools(result.schools);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        if (result.page !== page) {
          setPage(result.page);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat memuat data sekolah. Silakan coba kembali.'
        );
        setSchools([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    execute();
    return () => {
      isCancelled = true;
    };
  }, [province, city, level, status, debouncedSearch, page]);

  const handleProvinceChange = (nextProvince: string) => {
    setProvince(nextProvince);
    setCity('');
    setPage(1);
  };

  const handleCityChange = (nextCity: string) => {
    setCity(nextCity);
    setPage(1);
  };

  const handleLevelChange = (nextLevel: string) => {
    setLevel(nextLevel);
    setPage(1);
  };

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const handleClearSearchInput = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleResetAllFilters = () => {
    setProvince('');
    setCity('');
    setLevel('');
    setStatus('');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasActiveCriteria = Boolean(
    province || city || level || status || debouncedSearch
  );

  const startIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, totalCount);

  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages]
  );

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-view-enter">
        {/* A. Navigasi Kembali & Judul Halaman */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToLanding}
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>

          <div className="space-y-1">
            <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              Pencarian Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Temukan sekolah berdasarkan wilayah, jenjang pendidikan, status sekolah, atau nama sekolah.
            </p>
          </div>
        </div>

        {/* Panel Pencarian (Di Atas) dan Filter (Di Bawah) */}
        <section
          aria-label="Pencarian dan Filter Sekolah"
          className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4"
        >
          {/* 1. Input Search Utama (Di Atas) */}
          <div>
            <label
              htmlFor="search-page-keyword"
              className="sr-only"
            >
              Cari nama sekolah
            </label>
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-page-keyword"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama sekolah..."
                className="w-full min-h-[46px] pl-10 sm:pl-11 pr-10 py-2.5 text-sm sm:text-base bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearchInput}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#E4E0D8]/50 transition-colors cursor-pointer"
                  aria-label="Hapus teks pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Area Filter (Di Bawah Search) */}
          <div className="space-y-3 pt-3 border-t border-[#E4E0D8]">
            {hasActiveCriteria && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Filter 1: Provinsi */}
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="search-page-province"
                  className="block text-xs font-semibold text-[#475569] mb-1.5"
                >
                  Provinsi
                </label>
                <select
                  id="search-page-province"
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors cursor-pointer"
                >
                  <option value="">Semua Provinsi</option>
                  {provinceOptions.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Kabupaten/Kota */}
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="search-page-city"
                  className="block text-xs font-semibold text-[#475569] mb-1.5"
                >
                  Kabupaten/Kota
                </label>
                <select
                  id="search-page-city"
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!province}
                  className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium disabled:opacity-55 disabled:bg-[#F1F5F9] disabled:cursor-not-allowed focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors cursor-pointer"
                >
                  <option value="">
                    {province ? 'Semua Kabupaten/Kota' : 'Pilih Provinsi dahulu'}
                  </option>
                  {cityOptions.map((kab) => (
                    <option key={kab} value={kab}>
                      {kab}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Jenjang */}
              <div className="col-span-1">
                <label
                  htmlFor="search-page-level"
                  className="block text-xs font-semibold text-[#475569] mb-1.5"
                >
                  Jenjang
                </label>
                <select
                  id="search-page-level"
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors cursor-pointer"
                >
                  <option value="">Semua Jenjang</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              {/* Filter 4: Status */}
              <div className="col-span-1">
                <label
                  htmlFor="search-page-status"
                  className="block text-xs font-semibold text-[#475569] mb-1.5"
                >
                  Status
                </label>
                <select
                  id="search-page-status"
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* D. Informasi Hasil Pencarian */}
        <div
          ref={resultsTopRef}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1"
        >
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight">
              Hasil Pencarian
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] tabular-nums">
              {isLoading
                ? 'Memuat daftar sekolah...'
                : totalCount > 0
                ? `Menampilkan ${startIndex.toLocaleString('id-ID')}–${endIndex.toLocaleString('id-ID')} dari ${totalCount.toLocaleString('id-ID')} sekolah.`
                : 'Menampilkan 0 sekolah.'}
            </p>
          </div>

          {/* Konteks Kriteria Aktif Singkat */}
          {hasActiveCriteria && (
            <div className="flex flex-wrap items-center gap-1.5">
              {province && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#1E293B]">
                  <span>{province}</span>
                  <button
                    type="button"
                    onClick={() => handleProvinceChange('')}
                    className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                    aria-label={`Hapus filter provinsi ${province}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#1E293B]">
                  <span>{city}</span>
                  <button
                    type="button"
                    onClick={() => handleCityChange('')}
                    className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                    aria-label={`Hapus filter kabupaten/kota ${city}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {level && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#1E293B]">
                  <span>Jenjang: {level}</span>
                  <button
                    type="button"
                    onClick={() => handleLevelChange('')}
                    className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                    aria-label={`Hapus filter jenjang ${level}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#1E293B]">
                  <span>Status: {status}</span>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('')}
                    className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                    aria-label={`Hapus filter status ${status}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#1E293B]">
                  <span>&ldquo;{debouncedSearch}&rdquo;</span>
                  <button
                    type="button"
                    onClick={handleClearSearchInput}
                    className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                    aria-label="Hapus kata kunci pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* E. Kondisi Tampilan: Loading, Error, Empty, atau Daftar Sekolah */}
        {isLoading ? (
          <div
            className="space-y-3"
            aria-busy="true"
            aria-label="Memuat daftar sekolah"
          >
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-4 sm:p-5 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="h-5 bg-[#E4E0D8] rounded-md w-2/3 sm:w-1/2" />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-4 bg-[#E4E0D8]/80 rounded-md w-24" />
                    <div className="h-4 bg-[#E4E0D8]/80 rounded-md w-16" />
                    <div className="h-4 bg-[#E4E0D8]/80 rounded-md w-40" />
                  </div>
                </div>
                <div className="h-9 bg-[#E4E0D8]/70 rounded-lg w-28 shrink-0" />
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div
            role="alert"
            className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 text-center space-y-3"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FFFFFF] border border-[#FECACA] text-[#991B1B] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#991B1B]">
                Gagal Memuat Data Sekolah
              </h3>
              <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={loadSchools}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : schools.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#475569] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-[#1E293B]">
                Tidak ada sekolah yang ditemukan.
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Coba ubah kata kunci atau sesuaikan filter pencarian.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {schools.map((school) => {
              const schoolLevel =
                school.jenjang || school.educationLevel || 'SMA';
              const schoolStatus = school.schoolType || 'Negeri';

              return (
                <article
                  key={school.id}
                  onClick={() => onSelectSchool(school)}
                  className="bg-[#FFFFFF] border border-[#C9DFDC] hover:border-[#2E6496] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Nama Sekolah (Paling Menonjol) */}
                      <div className="flex items-start gap-2.5">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2E6496] shrink-0 mt-0.5" />
                        <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#2E6496] transition-colors leading-snug break-words">
                          {school.name}
                        </h3>
                      </div>

                      {/* Metadata: NPSN, Jenjang, Status, Kabupaten/Kota, Provinsi */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-6 sm:pl-7 text-xs text-[#475569]">
                        <span className="font-mono font-semibold text-[#1E293B] tabular-nums">
                          NPSN: {school.npsn}
                        </span>

                        <span className="text-[#CBD5E1]" aria-hidden="true">
                          •
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#C9DFDC] font-semibold text-[#1E293B]">
                          {schoolLevel}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#C9DFDC] font-medium text-[#475569]">
                          {schoolStatus}
                        </span>

                        <span className="text-[#CBD5E1]" aria-hidden="true">
                          •
                        </span>

                        <span className="inline-flex items-center gap-1 text-[#475569]">
                          <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                          <span>
                            {school.kabupaten}, {school.provinsi}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Tombol Lihat Detail Sekolah */}
                    <div className="pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#E4E0D8]/70 shrink-0 flex items-center justify-between sm:justify-end">
                      <span className="text-[11px] font-medium text-[#64748B] sm:hidden">
                        Rincian dana BOSP &amp; bukti belanja
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] group-hover:bg-[#2E6496] border border-[#C9DFDC] group-hover:border-[#2E6496] text-xs font-bold text-[#2E6496] group-hover:text-[#FFFFFF] transition-colors">
                        <span>Lihat Detail</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* F. Pagination (Hanya tampil jika hasil > 10 sekolah) */}
        {!isLoading && !errorMsg && totalCount > PAGE_SIZE && totalPages > 1 && (
          <nav
            aria-label="Navigasi halaman hasil pencarian"
            className="pt-2"
          >
            {/* Mobile Compact Pagination Bar (<640px) */}
            <div className="flex sm:hidden items-center justify-between gap-2 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-2 shadow-2xs">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-[#2E6496]" />
                <span>Prev</span>
              </button>

              <span className="text-xs font-bold text-[#1E293B] tabular-nums">
                Hal. <span className="text-[#2E6496]">{page}</span> / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 text-[#2E6496]" />
              </button>
            </div>

            {/* Tablet & Desktop Full Numbered Pagination (>=640px) */}
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] disabled:opacity-45 disabled:hover:bg-[#FFFFFF] disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {paginationItems.map((item) => {
                  if (item === 'ellipsis-start' || item === 'ellipsis-end') {
                    return (
                      <span
                        key={item}
                        className="px-2 py-2 text-xs sm:text-sm font-semibold text-[#64748B] select-none"
                      >
                        ...
                      </span>
                    );
                  }

                  const isCurrent = item === page;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`min-w-[40px] min-h-[40px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold tabular-nums transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] hover:bg-[#EBF3F8] border-[#C9DFDC] text-[#1E293B]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] disabled:opacity-45 disabled:hover:bg-[#FFFFFF] disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};
