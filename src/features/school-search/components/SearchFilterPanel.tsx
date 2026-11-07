import React from 'react';
import { RotateCcw, Search, X } from 'lucide-react';

interface SearchFilterPanelProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onClearSearchInput: () => void;
  hasActiveCriteria: boolean;
  onResetAllFilters: () => void;
  province: string;
  provinceOptions: string[];
  onProvinceChange: (province: string) => void;
  city: string;
  cityOptions: string[];
  onCityChange: (city: string) => void;
  level: string;
  onLevelChange: (level: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  searchInput,
  onSearchInputChange,
  onClearSearchInput,
  hasActiveCriteria,
  onResetAllFilters,
  province,
  provinceOptions,
  onProvinceChange,
  city,
  cityOptions,
  onCityChange,
  level,
  onLevelChange,
  status,
  onStatusChange,
}) => {
  return (
    <section
      aria-label="Pencarian dan Filter Sekolah"
      className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4"
    >
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
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Cari nama sekolah..."
            className="w-full min-h-[46px] pl-10 sm:pl-11 pr-10 py-2.5 text-sm sm:text-base bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearchInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#E4E0D8]/50 transition-colors cursor-pointer"
              aria-label="Hapus teks pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-[#E4E0D8]">
        {hasActiveCriteria && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onResetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
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
              onChange={(e) => onProvinceChange(e.target.value)}
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
              onChange={(e) => onCityChange(e.target.value)}
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
              onChange={(e) => onLevelChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/25 focus:border-[#2E6496] transition-colors cursor-pointer"
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
              htmlFor="search-page-status"
              className="block text-xs font-semibold text-[#475569] mb-1.5"
            >
              Status
            </label>
            <select
              id="search-page-status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
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
  );
};
