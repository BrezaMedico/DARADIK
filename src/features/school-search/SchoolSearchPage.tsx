import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { REGION_HIERARCHY } from '@/data';
import type { SchoolData } from '@/types';
import { fetchPaginatedSchoolsFromSupabase } from '@/services/supabase';
import {
  PAGE_SIZE,
  VALID_LEVELS,
  VALID_STATUSES,
  buildSchoolSearchUrl,
  parseSchoolSearchUrlParams,
  resolveCityName,
  resolveProvinceName,
  type SchoolSearchFilterState,
} from './searchUrlUtils';
import { SearchFilterPanel } from './components/SearchFilterPanel';
import { SchoolResultList } from './components/SchoolResultList';
import { SearchPagination } from './components/SearchPagination';

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

  const provinceOptions = useMemo(
    () => Object.keys(REGION_HIERARCHY).sort((a, b) => a.localeCompare(b, 'id')),
    []
  );

  const cityOptions = useMemo(() => {
    if (!province || !REGION_HIERARCHY[province]) return [];
    return Object.keys(REGION_HIERARCHY[province]).sort((a, b) => a.localeCompare(b, 'id'));
  }, [province]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  // Skip pushState when state was just restored from a browser back/forward event.
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

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-view-enter">
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

        <SearchFilterPanel
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onClearSearchInput={handleClearSearchInput}
          hasActiveCriteria={hasActiveCriteria}
          onResetAllFilters={handleResetAllFilters}
          province={province}
          provinceOptions={provinceOptions}
          onProvinceChange={handleProvinceChange}
          city={city}
          cityOptions={cityOptions}
          onCityChange={handleCityChange}
          level={level}
          onLevelChange={handleLevelChange}
          status={status}
          onStatusChange={handleStatusChange}
        />

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

        <SchoolResultList
          isLoading={isLoading}
          errorMsg={errorMsg}
          schools={schools}
          onRetry={loadSchools}
          onResetAllFilters={handleResetAllFilters}
          onSelectSchool={onSelectSchool}
        />

        {!isLoading && !errorMsg && totalCount > PAGE_SIZE && totalPages > 1 && (
          <SearchPagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};
