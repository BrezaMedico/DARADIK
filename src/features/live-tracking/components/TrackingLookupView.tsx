import React from 'react';
import {
  ArrowLeft,
  Building2,
  Search,
  Clock,
  AlertCircle,
  History,
  Trash2,
  ArrowRight,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react';
import { formatWibDateTime } from '@/utils/reportTracking';
import type { TicketBookmarkItem } from '../trackingCookieUtils';

export interface TrackingLookupViewProps {
  ticketInput: string;
  isLoading: boolean;
  queryError: string | null;
  bookmarks: TicketBookmarkItem[];
  onBackToHome: () => void;
  onOpenAnonymousReport?: () => void;
  onTicketInputChange: (value: string) => void;
  onClearTicketInput: () => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSelectBookmark: (code: string) => void;
  onDeleteBookmark: (code: string, e: React.MouseEvent) => void;
}

export const TrackingLookupView: React.FC<TrackingLookupViewProps> = ({
  ticketInput,
  isLoading,
  queryError,
  bookmarks,
  onBackToHome,
  onOpenAnonymousReport,
  onTicketInputChange,
  onClearTicketInput,
  onSearchSubmit,
  onSelectBookmark,
  onDeleteBookmark,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBackToHome}
          className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2E6496] shrink-0" />
          <span>Kembali ke Pencarian</span>
        </button>

        {onOpenAnonymousReport && (
          <button
            type="button"
            onClick={onOpenAnonymousReport}
            className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-xs sm:text-sm font-bold text-[#FFFFFF] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Buat Laporan Baru</span>
          </button>
        )}
      </div>

      <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs space-y-5">
        <div className="space-y-1.5">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496]">
            Pelacakan Pengaduan Warga
          </span>
          <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
            Pantau Perkembangan Laporan
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Masukkan kode tiket unik Anda untuk melihat perkembangan pemeriksaan oleh petugas Dinas Pendidikan, atau pilih laporan tersimpan di bawah ini.
          </p>
        </div>

        <form
          onSubmit={onSearchSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => onTicketInputChange(e.target.value)}
              placeholder="Masukkan kode tiket (contoh: CHK-9xK4mP-7vR2nQ-B8wL)"
              aria-label="Kode tiket pelacakan laporan"
              className="w-full min-h-[46px] pl-10 pr-9 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] font-mono text-sm font-bold text-[#1E293B] placeholder:font-sans placeholder:font-normal placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
            />
            {ticketInput && (
              <button
                type="button"
                onClick={onClearTicketInput}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#1E293B] p-1 cursor-pointer"
                aria-label="Kosongkan kode tiket"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
          >
            <span>{isLoading ? 'Memeriksa...' : 'Cek Status Laporan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {queryError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-xs font-semibold text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{queryError}</span>
          </div>
        )}
      </section>

      <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E0D8]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2E6496]" />
            <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">
              Riwayat Laporan dari Perangkat Ini
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#64748B] tabular-nums">
            {bookmarks.length} laporan tersimpan
          </span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs sm:text-sm text-[#475569]">
              Belum ada riwayat laporan tersimpan di perangkat ini.
            </p>
            <p className="text-[11px] sm:text-xs text-[#64748B]">
              Laporan yang Anda kirimkan dari peramban ini akan otomatis tercatat di sini agar mudah dipantau kapan saja.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] rounded-xl overflow-hidden">
            {bookmarks.map((bm) => (
              <div
                key={bm.ticketCode}
                onClick={() => onSelectBookmark(bm.ticketCode)}
                className="p-3.5 sm:p-4 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#1D4F7A] group-hover:text-[#2E6496]">
                      {bm.ticketCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#C9DFDC] text-[10px] sm:text-[11px] font-semibold text-[#475569]">
                      {bm.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#475569] truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                    <span className="font-semibold text-[#1E293B] truncate">
                      {bm.schoolName}
                    </span>
                    {bm.schoolNpsn && (
                      <span className="text-[#64748B] font-mono text-[11px] shrink-0">
                        (NPSN: {bm.schoolNpsn})
                      </span>
                    )}
                  </div>
                  {bm.createdAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                      <Clock className="w-3 h-3 text-[#64748B]" />
                      <span>{formatWibDateTime(bm.createdAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBookmark(bm.ticketCode);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#EBF3F8] hover:bg-[#2E6496] text-[#2E6496] hover:text-[#FFFFFF] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Lihat Isi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => onDeleteBookmark(bm.ticketCode, e)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#991B1B] hover:bg-[#FEE2E2]/50 transition-colors cursor-pointer"
                    title="Hapus dari riwayat perangkat ini"
                    aria-label={`Hapus tiket ${bm.ticketCode} dari riwayat perangkat`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
