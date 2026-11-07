import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  AlertCircle,
  X,
} from 'lucide-react';
import { REGION_HIERARCHY, SMK_TI_BAZMA } from '@/data';
import type { SchoolData } from '@/types';
import {
  fetchPaginatedSchoolsFromSupabase,
  fetchSchoolFromSupabase,
} from '@/services/supabase';

interface HeroSchoolSearchBoxProps {
  onSelectSchoolAndOpenProfile: (
    school: SchoolData,
    initialTab?: 'summary' | 'items-ai' | 'wa-scanner'
  ) => void;
  onOpenSearchPage: (filters?: {
    province?: string;
    city?: string;
    level?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => void;
}

export const HeroSchoolSearchBox: React.FC<HeroSchoolSearchBoxProps> = ({
  onSelectSchoolAndOpenProfile,
  onOpenSearchPage,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chosenSchool, setChosenSchool] = useState<SchoolData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState<boolean>(false);

  const [provinsi, setProvinsi] = useState<string>('');
  const [kabupaten, setKabupaten] = useState<string>('');
  const [jenjangFilter, setJenjangFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const kabupatenOptions = useMemo(() => {
    if (!provinsi || !REGION_HIERARCHY[provinsi]) return [];
    return Object.keys(REGION_HIERARCHY[provinsi]);
  }, [provinsi]);

  const handleProvinsiChange = (newProv: string) => {
    setProvinsi(newProv);
    setKabupaten('');
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const handleKabupatenChange = (newKab: string) => {
    setKabupaten(newKab);
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const handleJenjangChange = (newJenjang: string) => {
    setJenjangFilter(newJenjang);
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const handleResetFilters = () => {
    setProvinsi('');
    setKabupaten('');
    setJenjangFilter('');
    setStatusFilter('');
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (provinsi) count++;
    if (kabupaten) count++;
    if (jenjangFilter) count++;
    if (statusFilter) count++;
    return count;
  }, [provinsi, kabupaten, jenjangFilter, statusFilter]);

  const [featuredSchool, setFeaturedSchool] = useState<SchoolData>(SMK_TI_BAZMA);
  const [filteredSchools, setFilteredSchools] = useState<SchoolData[]>([
    SMK_TI_BAZMA,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetchSchoolFromSupabase('smk-ti-bazma')
      .then((remote) => {
        if (!cancelled && remote) {
          setFeaturedSchool(remote);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const rawQuery = searchQuery.trim();
    const isFormattedSelection =
      chosenSchool &&
      rawQuery.toLowerCase() ===
        `${chosenSchool.name} (npsn: ${chosenSchool.npsn})`.toLowerCase();
    const q = isFormattedSelection ? '' : rawQuery;

    if (!q && !provinsi && !kabupaten && !jenjangFilter && !statusFilter) {
      setFilteredSchools([featuredSchool]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchPaginatedSchoolsFromSupabase({
          province: provinsi || undefined,
          city: kabupaten || undefined,
          level: jenjangFilter || undefined,
          status: statusFilter || undefined,
          search: q || undefined,
          page: 1,
          pageSize: 16,
        });
        if (!cancelled) {
          const sorted = [...res.schools].sort((a, b) => {
            if (a.id === featuredSchool.id) return -1;
            if (b.id === featuredSchool.id) return 1;
            return 0;
          });
          setFilteredSchools(sorted);
        }
      } catch {
        if (!cancelled) {
          setFilteredSchools([]);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    provinsi,
    kabupaten,
    jenjangFilter,
    statusFilter,
    searchQuery,
    chosenSchool,
    featuredSchool,
  ]);

  const handleSelectSchool = (school: SchoolData) => {
    setChosenSchool(school);
    setSearchQuery(`${school.name} (NPSN: ${school.npsn})`);
    setIsDropdownOpen(false);
    setValidationError(null);
  };

  const handleClearSearch = () => {
    setChosenSchool(null);
    setSearchQuery('');
    setValidationError(null);
    setIsDropdownOpen(true);
    searchInputRef.current?.focus();
  };

  const getCleanSearchKeyword = () => {
    const raw = searchQuery.trim();
    if (!raw) return '';
    if (
      chosenSchool &&
      raw.toLowerCase() ===
        `${chosenSchool.name} (npsn: ${chosenSchool.npsn})`.toLowerCase()
    ) {
      return chosenSchool.name;
    }
    return raw;
  };

  const handleNavigateToSearchPage = () => {
    setValidationError(null);
    setIsDropdownOpen(false);
    onOpenSearchPage({
      province: provinsi,
      city: kabupaten,
      level: jenjangFilter,
      status: statusFilter,
      search: getCleanSearchKeyword(),
      page: 1,
    });
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (chosenSchool) {
      onSelectSchoolAndOpenProfile(chosenSchool, 'summary');
      return;
    }

    const cleanKeyword = getCleanSearchKeyword();
    if (activeFilterCount > 0 || cleanKeyword.length > 0) {
      handleNavigateToSearchPage();
      return;
    }

    // Shake and focus input instead of silently opening a default school when submitted empty.
    setValidationError('Silakan ketik nama sekolah atau pilih sekolah terlebih dahulu.');
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    searchInputRef.current?.focus();
  };

  return (
    <form
      data-tour-id="tour-search-box"
      onSubmit={handleSubmitSearch}
      className={`w-full bg-[#FFFFFF] border rounded-2xl shadow-lg p-3.5 sm:p-6 transition-all duration-200 ${
        isShaking
          ? 'animate-daradik-shake border-red-400 ring-2 ring-red-400/50'
          : 'border-[#C9DFDC]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <label
          htmlFor="school-search-field"
          className="text-xs sm:text-sm font-bold text-[#1E293B]"
        >
          Cari Nama Sekolah / NPSN
        </label>

        <button
          type="button"
          onClick={() => setIsRegionFilterOpen((prev) => !prev)}
          className={`min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            isRegionFilterOpen || activeFilterCount > 0
              ? 'bg-[#EBF3F8] text-[#2E6496] border-[#2E6496]'
              : 'bg-[#F2EFE8] text-[#475569] border-[#C9DFDC] hover:text-[#1E293B] hover:bg-[#EBF3F8]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#2E6496]" />
          <span>Filter Wilayah</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#2E6496] text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
          {isRegionFilterOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={searchInputRef}
          id="school-search-field"
          type="text"
          value={searchQuery}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setChosenSchool(null);
            setIsDropdownOpen(true);
            setValidationError(null);
          }}
          placeholder="Nama sekolah, NPSN, atau kota..."
          className="w-full min-h-[46px] pl-10 pr-10 py-2.5 text-base sm:text-sm bg-[#F2EFE8]/45 border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium placeholder:text-[#475569]/75 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/30 focus:border-[#2E6496]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#475569] hover:text-[#1E293B]"
            aria-label="Bersihkan pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isRegionFilterOpen && (
        <div className="mb-3.5 p-3 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-3 animate-view-enter">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#C9DFDC]/70">
            <span className="text-[11px] font-bold text-[#2E6496] uppercase tracking-wider">
              Saring Wilayah &amp; Jenjang
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-[#DC2626] hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label
                htmlFor="hero-prov"
                className="block text-[11px] text-[#475569] font-semibold mb-1"
              >
                Provinsi
              </label>
              <select
                id="hero-prov"
                value={provinsi}
                onChange={(e) => handleProvinsiChange(e.target.value)}
                className="w-full min-h-[42px] px-2.5 py-2 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
              >
                <option value="">Semua Provinsi</option>
                {Object.keys(REGION_HIERARCHY).map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label
                htmlFor="hero-kab"
                className="block text-[11px] text-[#475569] font-semibold mb-1"
              >
                Kota / Kabupaten
              </label>
              <select
                id="hero-kab"
                value={kabupaten}
                onChange={(e) => handleKabupatenChange(e.target.value)}
                disabled={!provinsi}
                className="w-full min-h-[42px] px-2.5 py-2 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-lg text-[#1E293B] font-medium disabled:opacity-50 disabled:bg-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
              >
                <option value="">Semua Kota/Kab.</option>
                {kabupatenOptions.map((kab) => (
                  <option key={kab} value={kab}>
                    {kab}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label
                htmlFor="hero-jenjang"
                className="block text-[11px] text-[#475569] font-semibold mb-1"
              >
                Jenjang
              </label>
              <select
                id="hero-jenjang"
                value={jenjangFilter}
                onChange={(e) => handleJenjangChange(e.target.value)}
                className="w-full min-h-[42px] px-2.5 py-2 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
              >
                <option value="">Semua Jenjang</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
              </select>
            </div>

            <div className="col-span-1">
              <label
                htmlFor="hero-status"
                className="block text-[11px] text-[#475569] font-semibold mb-1"
              >
                Status Sekolah
              </label>
              <select
                id="hero-status"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full min-h-[42px] px-2.5 py-2 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
              >
                <option value="">Semua Status</option>
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#C9DFDC]/70 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#64748B]">
              {activeFilterCount > 0
                ? `${activeFilterCount} filter dipilih`
                : 'Semua filter opsional'}
            </span>
            <button
              type="button"
              onClick={handleNavigateToSearchPage}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Sekolah</span>
            </button>
          </div>
        </div>
      )}

      {!isRegionFilterOpen && activeFilterCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs animate-view-enter">
          <span className="text-[11px] font-semibold text-[#64748B]">Filter aktif:</span>
          {provinsi && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#2E6496] font-medium text-[11px]">
              {provinsi}
              <button type="button" onClick={() => handleProvinsiChange('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}
          {kabupaten && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#2E6496] font-medium text-[11px]">
              {kabupaten}
              <button type="button" onClick={() => handleKabupatenChange('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}
          {jenjangFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#2E6496] font-medium text-[11px]">
              {jenjangFilter}
              <button type="button" onClick={() => handleJenjangChange('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#2E6496] font-medium text-[11px]">
              {statusFilter}
              <button type="button" onClick={() => handleStatusChange('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-semibold text-[#DC2626] hover:underline ml-1 cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleNavigateToSearchPage}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#2E6496] hover:underline cursor-pointer"
          >
            <span>Cari Sekolah</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {isDropdownOpen && (
        <div className="mt-2 border border-[#C9DFDC] rounded-lg bg-[#FFFFFF] divide-y divide-[#C9DFDC]/50 max-h-64 overflow-y-auto shadow-sm animate-view-enter">
          <div className="px-3.5 py-1.5 bg-[#F2EFE8] flex items-center justify-between text-[11px] text-[#475569]">
            <span className="font-semibold text-[#2E6496]">
              Daftar Sekolah ({filteredSchools.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNavigateToSearchPage}
                className="text-[#2E6496] font-bold hover:underline cursor-pointer"
              >
                Cari Sekolah →
              </button>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="text-[#475569] font-semibold hover:underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
          {filteredSchools.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSchool(s)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-[#C9DFDC]/35 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs sm:text-sm font-bold text-[#1E293B] truncate" title={s.name}>
                  {s.name}
                </p>
                <p className="font-mono text-[11px] text-[#64748B] tabular-nums mt-0.5">
                  NPSN: {s.npsn}
                </p>
              </div>
              <span className="text-xs text-[#2E6496] font-semibold shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                Pilih →
              </span>
            </button>
          ))}
        </div>
      )}

      {validationError && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-view-enter">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      <div className="mt-3.5 sm:mt-4 space-y-2.5">
        <button
          type="submit"
          className="w-full min-h-[46px] py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl daradik-cta-subtle btn-glass-sheen text-[#FFFFFF] font-bold text-sm sm:text-base active:translate-y-[1px] flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          <span className="relative z-10">
            {!chosenSchool && (activeFilterCount > 0 || searchQuery.trim().length > 0)
              ? 'Cari Sekolah'
              : 'Cek Transparansi Sekolah'}
          </span>
          <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pt-1 px-0.5">
          <span className="text-[11px] sm:text-xs text-[#64748B] leading-snug">
            Telusuri direktori berdasarkan provinsi, kota/kabupaten, atau jenjang
          </span>
          <button
            type="button"
            onClick={handleNavigateToSearchPage}
            className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#2E6496] hover:text-[#245385] hover:underline cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buka Direktori Sekolah →</span>
          </button>
        </div>
      </div>
    </form>
  );
};
