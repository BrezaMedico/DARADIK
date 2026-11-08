import React, { useState, useRef, useEffect } from 'react';
import { Building2, Search, X } from 'lucide-react';
import type { MasterSchoolSearchOption, SchoolData } from '@/types';
import {
  fetchSchoolFromSupabase,
  searchMasterSchoolsInSupabase,
} from '@/services/supabase';
import type { ChosenSchoolTarget } from '../reportFormUtils';

export interface SchoolTargetSelectorProps {
  chosenSchool: ChosenSchoolTarget | null;
  isSearchingSchool: boolean;
  onSelectChosenSchool: (school: ChosenSchoolTarget | null) => void;
  onSearchingSchoolChange: (searching: boolean) => void;
  onChangeSchool: (school: SchoolData) => void;
  onClearSchoolValidationError: () => void;
}

export const SchoolTargetSelector: React.FC<SchoolTargetSelectorProps> = ({
  chosenSchool,
  isSearchingSchool,
  onSelectChosenSchool,
  onSearchingSchoolChange,
  onChangeSchool,
  onClearSchoolValidationError,
}) => {
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState<boolean>(false);
  const [remoteSchools, setRemoteSchools] = useState<MasterSchoolSearchOption[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(false);
  const schoolSearchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        schoolSearchContainerRef.current &&
        !schoolSearchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Queries the Supabase master schools view with a 220ms debounce while typing.
  useEffect(() => {
    if (!isSchoolDropdownOpen && !schoolSearchQuery.trim()) return;
    let cancelled = false;
    setIsLoadingSchools(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchMasterSchoolsInSupabase(schoolSearchQuery, 20);
        if (!cancelled) {
          const sorted = [...results].sort((a, b) => a.name.localeCompare(b.name, 'id'));
          setRemoteSchools(sorted);
        }
      } catch {
        if (!cancelled) {
          setRemoteSchools([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSchools(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [schoolSearchQuery, isSchoolDropdownOpen]);

  const handleSelectSchoolOption = (option: MasterSchoolSearchOption) => {
    onSelectChosenSchool({
      id: option.id,
      name: option.name,
      npsn: option.npsn,
      jenjang: option.jenjang,
      kabupaten: option.kabupaten,
      kecamatan: option.kecamatan,
      provinsi: option.provinsi,
    });

    fetchSchoolFromSupabase(option.id || option.npsn, option.jenjang)
      .then((remote) => {
        if (remote) {
          onChangeSchool(remote);
        }
      })
      .catch(() => {});

    onSearchingSchoolChange(false);
    setIsSchoolDropdownOpen(false);
    setSchoolSearchQuery('');
    onClearSchoolValidationError();
  };

  const handleClearSelectedSchool = () => {
    onSelectChosenSchool(null);
    onSearchingSchoolChange(true);
    setSchoolSearchQuery('');
    setTimeout(() => {
      setIsSchoolDropdownOpen(true);
    }, 50);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="school-search-input"
          className="block text-sm font-bold text-[#1E293B]"
        >
          Sekolah Tujuan Laporan
          <span className="text-[#991B1B] font-bold ml-1">*</span>
        </label>

        {chosenSchool && !isSearchingSchool && (
          <button
            type="button"
            onClick={handleClearSelectedSchool}
            className="text-xs font-semibold text-[#2E6496] hover:underline cursor-pointer"
          >
            Ganti Sekolah
          </button>
        )}
      </div>

      {chosenSchool && !isSearchingSchool ? (
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#1E293B]">
                  {chosenSchool.name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-[#2E6496] text-[#FFFFFF]">
                  {chosenSchool.jenjang}
                </span>
              </div>
              <div className="text-xs text-[#475569] mt-0.5">
                NPSN:{' '}
                <span className="font-mono text-[#1D4F7A] font-semibold tabular-nums">
                  {chosenSchool.npsn}
                </span>{' '}
                • Kec. {chosenSchool.kecamatan}, {chosenSchool.kabupaten}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearSelectedSchool}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E293B] cursor-pointer shrink-0"
          >
            Ubah
          </button>
        </div>
      ) : (
        <div ref={schoolSearchContainerRef} className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="school-search-input"
              type="text"
              value={schoolSearchQuery}
              onFocus={() => setIsSchoolDropdownOpen(true)}
              onChange={(e) => {
                setSchoolSearchQuery(e.target.value);
                setIsSchoolDropdownOpen(true);
                onClearSchoolValidationError();
              }}
              placeholder="Cari nama sekolah, NPSN, atau kabupaten/kota..."
              className="w-full min-h-[44px] pl-10 pr-9 py-2.5 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
            />
            {schoolSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSchoolSearchQuery('');
                  setIsSchoolDropdownOpen(true);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#1E293B] p-1 cursor-pointer"
                aria-label="Hapus kata kunci sekolah"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSchoolDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xl shadow-slate-900/10 z-30 max-h-64 overflow-y-auto p-1.5 space-y-1 animate-view-enter custom-scrollbar">
              {isLoadingSchools ? (
                <div className="p-4 text-center text-xs text-[#475569]">
                  Mencari data sekolah dari basis data...
                </div>
              ) : remoteSchools.length > 0 ? (
                remoteSchools.map((s) => (
                  <button
                    key={`${s.jenjang}-${s.npsn}`}
                    type="button"
                    onClick={() => handleSelectSchoolOption(s)}
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
                          {s.jenjang}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-[#475569] tabular-nums mt-0.5 truncate">
                        NPSN: {s.npsn} • {s.kecamatan}, {s.kabupaten}
                      </p>
                    </div>
                    <span className="text-xs text-[#2E6496] font-semibold shrink-0">
                      Pilih
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#475569]">
                  Sekolah dengan kata kunci tersebut tidak ditemukan di basis data.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
