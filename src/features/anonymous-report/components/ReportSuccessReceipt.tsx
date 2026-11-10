import React, { useState } from 'react';
import {
  Check,
  Copy,
  Building2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { SubmissionSuccessState } from '../reportFormUtils';

export interface ReportSuccessReceiptProps {
  submissionSuccess: SubmissionSuccessState;
  onSubmitSuccess: (ticketCode: string, notes: string, category: string) => void;
  onBack: () => void;
}

export const ReportSuccessReceipt: React.FC<ReportSuccessReceiptProps> = ({
  submissionSuccess,
  onSubmitSuccess,
  onBack,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopyTicket = () => {
    if (!submissionSuccess.ticketCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(submissionSuccess.ticketCode);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-view-enter">
      <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="flex items-center justify-center mx-auto">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 daradik-success-circle-svg"
              viewBox="0 0 72 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Ikon centang sukses pengiriman laporan"
            >
              {/* Lingkaran latar belakang hijau lembut */}
              <circle
                cx="36"
                cy="36"
                r="32"
                fill="#DCFCE7"
                className="daradik-success-circle-bg"
              />
              {/* Garis tepi lingkaran */}
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke="#86EFAC"
                strokeWidth="2.5"
                className="daradik-success-circle-ring"
              />
              {/* Path centang yang digambar bertahap dari pojok ke pojok */}
              <path
                d="M22 37.5L31.5 47L50 26.5"
                fill="none"
                stroke="#166534"
                strokeWidth="4.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="daradik-success-check-path"
              />
            </svg>
          </div>
        </div>

        <div className="daradik-success-text-enter space-y-1.5">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#166534]">
            Konfirmasi Pengiriman Berhasil
          </span>
          <h2 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
            Laporan Berhasil Dikirim
          </h2>
          <p className="daradik-lead text-xs sm:text-sm text-[#475569] max-w-lg mx-auto leading-relaxed">
            Terima kasih telah melapor. Laporan kamu berhasil dikirim dan telah diterima oleh sistem DARADIK untuk masuk ke antrean pemeriksaan petugas.
          </p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E0D8]">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
              Kode Tiket Pelacakan
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#2E6496] tracking-tight tabular-nums">
              {submissionSuccess.ticketCode}
            </div>
            <p className="text-xs text-[#475569]">
              Simpan kode tiket ini dengan teliti (perhatikan kombinasi huruf besar, huruf kecil, dan angka) untuk memantau laporan secara terenkripsi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyTicket}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-bold text-[#1E293B] flex items-center justify-center gap-2 cursor-pointer transition-colors self-start sm:self-auto shrink-0"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-[#166534]" />
                <span className="text-[#166534]">Kode Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#2E6496]" />
                <span>Salin Kode Tiket</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs">
          <div className="space-y-1">
            <span className="text-[11px] text-[#475569] block font-medium">
              Sekolah yang Dilaporkan
            </span>
            <span
              className="font-bold text-[#1E293B] flex items-center gap-1.5"
              title={submissionSuccess.schoolName}
            >
              <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
              <span className="truncate">{submissionSuccess.schoolName}</span>
            </span>
            <span className="font-mono text-[11px] text-[#475569] tabular-nums block">
              NPSN: {submissionSuccess.schoolNpsn}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-[#475569] block font-medium">
              Kategori Laporan
            </span>
            <span
              className="font-bold text-[#1E293B] block"
              title={submissionSuccess.category}
            >
              {submissionSuccess.category}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-[#475569] block font-medium">
              Waktu Pengiriman
            </span>
            <div className="flex items-center gap-1.5 text-[#1E293B] font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
              <span className="font-mono tabular-nums text-[#1E293B]">
                {submissionSuccess.timestamp}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#EBF3F8]/60 border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E6496] shrink-0" />
            <span className="text-[#1E293B] font-bold">
              Status Saat Ini: Menunggu Pemeriksaan Petugas Dinas Pendidikan
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#1D4F7A] bg-[#FFFFFF] border border-[#C9DFDC] px-2.5 py-0.5 rounded-md font-semibold self-start sm:self-auto">
            Antrean Dinas
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() =>
              onSubmitSuccess(
                submissionSuccess.ticketCode,
                submissionSuccess.fullNotes,
                submissionSuccess.category
              )
            }
            className="w-full sm:flex-1 min-h-[44px] py-3 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Pantau Status Laporan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
          >
            Kembali ke Pencarian
          </button>
        </div>
      </div>
    </div>
  );
};
