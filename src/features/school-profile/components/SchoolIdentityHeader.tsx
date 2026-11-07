import React from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  Building2,
  MapPin,
  Scale,
  ReceiptText,
  ScanLine,
  Loader2,
} from 'lucide-react';
import type { SchoolData } from '@/types/school';

export type ProfileTab = 'summary' | 'items-ai' | 'wa-scanner';

interface SchoolIdentityHeaderProps {
  school: SchoolData;
  schoolType: string;
  principalName: string;
  currentStudentCount: number;
  itemCount: number;
  activeTab: ProfileTab;
  isDownloadingPdf: boolean;
  onTabChange: (tab: ProfileTab) => void;
  onBackToLanding: () => void;
  onShareSchool: () => void;
  onDownloadPdf: () => void;
}

export const SchoolIdentityHeader: React.FC<SchoolIdentityHeaderProps> = ({
  school,
  schoolType,
  principalName,
  currentStudentCount,
  itemCount,
  activeTab,
  isDownloadingPdf,
  onTabChange,
  onBackToLanding,
  onShareSchool,
  onDownloadPdf,
}) => {
  return (
    <>
      {/* 1. TOP UTILITY BAR (Kembali ke Beranda Left | Bagikan & Unduh Right) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 animate-school-header">
        <button
          type="button"
          onClick={onBackToLanding}
          className="min-h-[42px] w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-bold text-[#1E293B] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onShareSchool}
            className="min-h-[42px] px-3.5 sm:px-4 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-bold text-[#1E293B] shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
            <span>Bagikan</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="min-h-[42px] px-3.5 sm:px-4 py-2.5 rounded-full bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 text-[#FFFFFF] animate-spin shrink-0" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0" />
            )}
            <span className="truncate">
              {isDownloadingPdf ? 'Membuat...' : 'Unduh Ringkasan'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. SCHOOL PROFILE IDENTITY CARD */}
      <div
        className="rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs p-4 sm:p-6 lg:p-7 animate-school-header"
        style={{ animationDelay: '40ms' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3.5 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 w-full md:w-auto md:flex-1 min-w-0">
            {school.imageUrl ? (
              <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl border-2 border-[#C9DFDC] shadow-xs shrink-0 overflow-hidden bg-[#FAF8F5] relative group">
                <img
                  src={school.imageUrl}
                  alt={school.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-[#2E6496] text-[#FFFFFF] flex items-center justify-center shadow-xs shrink-0">
                <Building2 className="w-7 h-7 sm:w-10 sm:h-10 text-[#FFFFFF]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[11px] sm:text-xs font-bold text-[#2E6496] tabular-nums">
                  NPSN {school.npsn}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B]">
                  Sekolah {schoolType}
                </span>
              </div>
              <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                {school.name}
              </h1>
              <p className="hidden sm:flex text-xs sm:text-sm text-[#64748B] mt-1 items-start gap-1.5 leading-relaxed">
                <MapPin className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                <span className="break-words">{school.address}</span>
              </p>
            </div>
          </div>

          <p className="flex sm:hidden text-xs text-[#64748B] items-start gap-1.5 leading-relaxed">
            <MapPin className="w-3.5 h-3.5 text-[#2E6496] shrink-0 mt-0.5" />
            <span className="break-words">{school.address}</span>
          </p>

          <div className="w-full md:w-auto grid grid-cols-2 md:flex md:flex-col gap-2 sm:gap-2.5 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 md:border-l border-[#C9DFDC]/60 md:pl-6">
            <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC]/70">
              <span className="text-[10px] sm:text-[11px] font-medium text-[#64748B] block">
                Kepala Sekolah
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#1E293B] block mt-0.5 break-words">
                {principalName}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC]/70">
              <span className="text-[10px] sm:text-[11px] font-medium text-[#64748B] block">
                Jumlah Siswa
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#2E6496] tabular-nums block mt-0.5">
                {currentStudentCount.toLocaleString('id-ID')} Siswa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROMINENT 3-TAB NAVIGATION BAR */}
      <div
        className="p-1.5 sm:p-2 bg-[#FFFFFF]/95 backdrop-blur-md border border-[#C9DFDC] rounded-2xl grid grid-cols-3 gap-1 sm:gap-2 shadow-xs sticky top-[62px] sm:static z-30 animate-school-header"
        style={{ animationDelay: '80ms' }}
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          data-tour-id="tour-profile-summary"
          aria-selected={activeTab === 'summary'}
          onClick={() => onTabChange('summary')}
          className={`min-h-[54px] sm:min-h-[48px] py-2 sm:py-3 px-1 sm:px-4 rounded-xl text-[11px] sm:text-sm leading-tight font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[#1E293B] text-[#FFFFFF] shadow-xs'
              : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
          }`}
        >
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${
              activeTab === 'summary'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'bg-[#EBF3F8] text-[#2E6496]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span>Ringkasan Dana</span>
        </button>

        <button
          type="button"
          role="tab"
          data-tour-id="tour-profile-items"
          aria-selected={activeTab === 'items-ai'}
          onClick={() => onTabChange('items-ai')}
          className={`min-h-[54px] sm:min-h-[48px] py-2 sm:py-3 px-1 sm:px-4 rounded-xl text-[11px] sm:text-sm leading-tight font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center cursor-pointer ${
            activeTab === 'items-ai'
              ? 'bg-[#1E293B] text-[#FFFFFF] shadow-xs'
              : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${
                activeTab === 'items-ai'
                  ? 'bg-[#2E6496] text-[#FFFFFF]'
                  : 'bg-[#EBF3F8] text-[#2E6496]'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
            </div>
            <span
              className={`sm:hidden -right-3 -top-1 absolute px-1.5 py-0.2 rounded-full text-[9px] font-extrabold tabular-nums ${
                activeTab === 'items-ai'
                  ? 'bg-[#2E6496] text-[#FFFFFF] ring-1 ring-[#FFFFFF]/40'
                  : 'bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC]'
              }`}
            >
              {itemCount}
            </span>
          </div>
          <span>Hasil Belanja</span>
          <span
            className={`hidden sm:inline px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums ${
              activeTab === 'items-ai'
                ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                : 'bg-[#EBF3F8] text-[#2E6496]'
            }`}
          >
            {itemCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          data-tour-id="tour-profile-wa"
          aria-selected={activeTab === 'wa-scanner'}
          onClick={() => onTabChange('wa-scanner')}
          className={`min-h-[54px] sm:min-h-[48px] py-2 sm:py-3 px-1 sm:px-4 rounded-xl text-[11px] sm:text-sm leading-tight font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center cursor-pointer ${
            activeTab === 'wa-scanner'
              ? 'bg-[#1E293B] text-[#FFFFFF] shadow-xs'
              : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
          }`}
        >
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${
              activeTab === 'wa-scanner'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'bg-[#EBF3F8] text-[#2E6496]'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
          </div>
          <span>Verifikasi Iuran WA</span>
        </button>
      </div>
    </>
  );
};

