import React from 'react';
import { AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import type { OfficerProfileRecord } from '@/types';

interface OfficerHeaderProps {
  officer: OfficerProfileRecord;
  onBackToHome: () => void;
  onLogout: () => void;
}

export const OfficerHeader: React.FC<OfficerHeaderProps> = ({
  officer,
  onBackToHome,
  onLogout,
}) => {
  return (
    <header className="bg-[#FFFFFF] border-b border-[#C9DFDC] sticky top-0 z-30 px-4 sm:px-6 lg:px-10 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer"
            title="Kembali ke portal utama"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#2E6496]" />
            <span className="hidden sm:inline">Portal Utama</span>
          </button>

          <div>
            <span className="text-[11px] font-mono font-bold text-[#2E6496] uppercase tracking-wider block">
              Dinas Pendidikan
            </span>
            <h1 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B] leading-tight">
              Pemeriksaan Pengaduan BOSP
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-[#1E293B] block">
              {officer.full_name}
            </span>
            <span className="text-[11px] text-[#475569] block">
              {officer.jabatan}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#FEF2F2] hover:text-[#991B1B] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Keluar dari akun petugas"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

interface OfficerConflictBannerProps {
  conflictBanner: string | null;
  onReload: () => void;
}

export const OfficerConflictBanner: React.FC<OfficerConflictBannerProps> = ({
  conflictBanner,
  onReload,
}) => {
  if (!conflictBanner) return null;

  return (
    <div
      role="alert"
      className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-view-enter"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{conflictBanner}</span>
      </div>
      <button
        type="button"
        onClick={onReload}
        className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#FECACA] text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]/60 cursor-pointer self-start sm:self-auto shrink-0"
      >
        Muat Ulang Data Terbaru
      </button>
    </div>
  );
};
