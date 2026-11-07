import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { SchoolData } from '@/types';

interface SchoolResultListProps {
  isLoading: boolean;
  errorMsg: string | null;
  schools: SchoolData[];
  onRetry: () => void;
  onResetAllFilters: () => void;
  onSelectSchool: (school: SchoolData) => void;
}

export const SchoolResultList: React.FC<SchoolResultListProps> = ({
  isLoading,
  errorMsg,
  schools,
  onRetry,
  onResetAllFilters,
  onSelectSchool,
}) => {
  if (isLoading) {
    return (
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
    );
  }

  if (errorMsg) {
    return (
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
            onClick={onRetry}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
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
            onClick={onResetAllFilters}
            className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>
    );
  }

  return (
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
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2E6496] shrink-0 mt-0.5" />
                  <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#2E6496] transition-colors leading-snug break-words">
                    {school.name}
                  </h3>
                </div>

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
  );
};
