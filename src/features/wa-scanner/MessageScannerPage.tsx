import React, { useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Search, X } from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';
import { SMK_TI_BAZMA, getSchoolsSeedDatabase } from '@/data';
import {
  fetchPaginatedSchoolsFromSupabase,
  fetchSchoolFromSupabase,
} from '@/services/supabase';
import type { SchoolData, WaScenarioData } from '@/types';
import { WaScannerWorkspace } from './WaScannerWorkspace';

interface MessageScannerPageProps {
  onBackToLanding: () => void;
  onReportFromWaScenario: (scenario: WaScenarioData, school: SchoolData) => void;
  onShowToast: (message: string) => void;
}

const MAX_TOP_RESULTS = 5;

function searchLocalFallback(query: string): SchoolData[] {
  const pool = [
    SMK_TI_BAZMA,
    ...getSchoolsSeedDatabase().filter((s) => s.id !== SMK_TI_BAZMA.id),
  ];
  const q = query.trim().toLowerCase();
  if (!q) return pool.slice(0, MAX_TOP_RESULTS);
  return pool
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.npsn.toLowerCase().includes(q) ||
        s.kabupaten.toLowerCase().includes(q) ||
        s.kecamatan.toLowerCase().includes(q)
    )
    .slice(0, MAX_TOP_RESULTS);
}

export const MessageScannerPage: React.FC<MessageScannerPageProps> = ({
  onBackToLanding,
  onReportFromWaScenario,
  onShowToast,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chosenSchool, setChosenSchool] = useState<SchoolData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [topSchools, setTopSchools] = useState<SchoolData[]>(() =>
    searchLocalFallback('')
  );
  const [isHydratingSchool, setIsHydratingSchool] = useState<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (chosenSchool) return;

    let cancelled = false;
    setIsSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetchPaginatedSchoolsFromSupabase({
          search: q || undefined,
          page: 1,
          pageSize: MAX_TOP_RESULTS,
        });
        if (!cancelled) {
          const rows = res.schools.slice(0, MAX_TOP_RESULTS);
          setTopSchools(rows.length > 0 ? rows : searchLocalFallback(q));
        }
      } catch {
        if (!cancelled) {
          setTopSchools(searchLocalFallback(q));
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, chosenSchool]);

  const handleSelectSchool = (school: SchoolData) => {
    setChosenSchool(school);
    setSearchQuery(`${school.name} (NPSN: ${school.npsn})`);
    setIsDropdownOpen(false);

    setIsHydratingSchool(true);
    fetchSchoolFromSupabase(school.id || school.npsn, school.jenjang)
      .then((remote) => {
        if (remote && (remote.id === school.id || remote.npsn === school.npsn)) {
          setChosenSchool(remote);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsHydratingSchool(false);
      });
  };

  const handleClearSelection = () => {
    setChosenSchool(null);
    setSearchQuery('');
    setIsDropdownOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 30);
  };

  const schoolSelectorContent = (
    <div ref={searchBoxRef} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="scanner-school-search-field"
          className="text-xs sm:text-sm font-bold text-[#1E293B]"
        >
          Cari Sekolah Tujuan
        </label>

        {chosenSchool && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-xs font-bold text-[#2E6496] hover:underline cursor-pointer"
          >
            Ganti Sekolah
          </button>
        )}
      </div>

      {chosenSchool ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#EBF3F8]/60 border border-[#C9DFDC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#1E293B] truncate">
                  {chosenSchool.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2E6496] text-[#FFFFFF]">
                  {chosenSchool.educationLevel || chosenSchool.jenjang}
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#475569] tabular-nums mt-0.5 truncate">
                NPSN: {chosenSchool.npsn} • {chosenSchool.kecamatan}, {chosenSchool.kabupaten}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isHydratingSchool ? 'Memuat Data...' : 'Siap Dipindai'}</span>
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E293B] cursor-pointer"
              aria-label="Hapus pilihan sekolah"
            >
              Ubah
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              id="scanner-school-search-field"
              type="text"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder="Ketik nama sekolah, NPSN, atau kota..."
              className="w-full min-h-[46px] pl-10 pr-10 py-2.5 text-base sm:text-sm bg-[#F2EFE8]/45 border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium placeholder:text-[#475569]/80 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/30 focus:border-[#2E6496]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(true);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Bersihkan kata kunci sekolah"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isDropdownOpen && (
            <div className="mt-2 border border-[#C9DFDC] rounded-2xl bg-[#FFFFFF] shadow-lg max-h-72 overflow-y-auto p-1.5 space-y-1 animate-view-enter school-custom-scroll">
              <div className="px-3 py-1.5 bg-[#FAF8F5] rounded-xl flex items-center justify-between text-[11px] text-[#475569] mb-1">
                <span className="font-semibold text-[#2E6496]">
                  {isSearching
                    ? 'Mencari sekolah...'
                    : `Daftar Sekolah (${topSchools.length})`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-[#475569] font-semibold hover:underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {topSchools.length > 0 ? (
                topSchools.slice(0, MAX_TOP_RESULTS).map((s) => (
                  <button
                    key={`${s.id}-${s.npsn}`}
                    type="button"
                    onClick={() => handleSelectSchool(s)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#EBF3F8] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-xs sm:text-sm font-bold text-[#1E293B] group-hover:text-[#2E6496] truncate"
                          title={s.name}
                        >
                          {s.name}
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3F8] text-[#1D4F7A] shrink-0">
                          {s.educationLevel || s.jenjang}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-[#475569] tabular-nums mt-0.5 truncate">
                        NPSN: {s.npsn} • {s.kecamatan}, {s.kabupaten}
                      </p>
                    </div>
                    <span className="text-xs text-[#2E6496] font-bold shrink-0">
                      Pilih
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#475569]">
                  Sekolah tidak ditemukan. Coba ketik nama sekolah atau NPSN lain.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-view-enter">
        <div className="flex items-center justify-between gap-3">
          <BackButton onClick={onBackToLanding} label="Kembali ke Beranda" />
        </div>

        <WaScannerWorkspace
          school={chosenSchool || SMK_TI_BAZMA}
          schoolSelectorSlot={schoolSelectorContent}
          isLocked={!chosenSchool}
          lockedMessage="Pilih sekolah di atas terlebih dahulu agar tombol Cari Berkas Gambar aktif."
          headingAs="h1"
          onReportFromWaScenario={(scenario) =>
            onReportFromWaScenario(scenario, chosenSchool || SMK_TI_BAZMA)
          }
          onShowToast={onShowToast}
        />
      </div>
    </div>
  );
};
