import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  MessageSquare,
  Scale,
} from 'lucide-react';
import type { AiScanAnalysisResult } from '@/types';
import { formatRupiah } from '@/utils/formatters';

interface ScannerVerdictPanelProps {
  ocrScanResult: AiScanAnalysisResult;
  schoolName: string;
  onReport: () => void;
}

export const ScannerVerdictPanel: React.FC<ScannerVerdictPanelProps> = ({
  ocrScanResult,
  schoolName,
  onReport,
}) => {
  const isDanger = ocrScanResult.statusType === 'danger';
  const comp = ocrScanResult.threeWayComparison;

  return (
    <div className="lg:col-span-7 space-y-5">
      <div
        className={`rounded-2xl p-5 sm:p-6 shadow-xs border space-y-2 ${
          isDanger
            ? 'border-[#FECACA] bg-[#FEF2F2]/60'
            : 'border-[#C9DFDC] bg-[#EBF3F8]/40'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isDanger ? (
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#2E6496] shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                isDanger ? 'text-[#DC2626]' : 'text-[#2E6496]'
              }`}
            >
              {isDanger
                ? 'Terindikasi Pungli'
                : ocrScanResult.statusType === 'neutral'
                ? 'Pesan Informatif'
                : 'Bukan Dana BOSP'}
            </span>
          </div>

          <span className="text-xs font-semibold text-[#64748B] tabular-nums">
            Kecocokan {ocrScanResult.confidenceScore}%
          </span>
        </div>

        <h3
          className={`text-lg sm:text-xl font-bold tracking-tight ${
            isDanger ? 'text-[#991B1B]' : 'text-[#1E293B]'
          }`}
        >
          {ocrScanResult.statusTitle}
        </h3>

        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            isDanger ? 'text-[#7F1D1D]' : 'text-[#475569]'
          }`}
        >
          {ocrScanResult.bospFact}
        </p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#C9DFDC]/60">
          <span className="text-xs font-bold text-[#475569]">
            Perbandingan 3 Sisi
          </span>
        </div>

        <div className="divide-y divide-[#C9DFDC]/60 text-xs">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#2E6496] shrink-0" />
              <div>
                <span className="text-[11px] text-[#64748B] block">1. Pesan Guru</span>
                <span className="font-bold text-[#1E293B] text-xs sm:text-sm capitalize">
                  {comp?.teacherText.detectedItem || 'Iuran Kelas'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:text-right">
              <span className="font-bold text-[#1E293B] tabular-nums">
                {comp?.teacherText.detectedAmount
                  ? formatRupiah(comp.teacherText.detectedAmount)
                  : 'Nominal tidak tertera'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  comp?.teacherText.isMandatory
                    ? 'bg-[#FEF2F2] text-[#DC2626]'
                    : 'bg-[#EBF3F8] text-[#2E6496]'
                }`}
              >
                {comp?.teacherText.toneBadge ||
                  (comp?.teacherText.isMandatory ? 'Wajib/Menagih' : 'Sukarela')}
              </span>
            </div>
          </div>

          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#2E6496] shrink-0" />
              <div>
                <span className="text-[11px] text-[#64748B] block">2. Anggaran Sekolah ({schoolName})</span>
                <span className="font-bold text-[#1E293B] text-xs sm:text-sm">
                  {comp?.schoolBudget.budgetStatusLabel ||
                    (comp?.schoolBudget.isFundedByBosp
                      ? 'Sudah Dibiayai BOSP Negara'
                      : 'Di Luar Pagu BOSP (Non-RKAS)')}
                </span>
              </div>
            </div>
            <div className="sm:text-right tabular-nums">
              <span className="font-bold text-[#1E293B] block">
                {comp?.schoolBudget.allocatedAmount
                  ? formatRupiah(comp.schoolBudget.allocatedAmount)
                  : '-'}
              </span>
              {comp?.schoolBudget.itemCode && (
                <span className="text-[11px] text-[#64748B]">
                  Kode: {comp.schoolBudget.itemCode}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-[#2E6496] shrink-0" />
              <div>
                <span className="text-[11px] text-[#64748B] block">3. Aturan Kemendikbudristek</span>
                <span className="font-semibold text-[#1E293B] text-xs">
                  {comp?.bospPolicy.primaryRegulation ||
                    (isDanger
                      ? 'Permendikdasmen 8/2026 & Permendikbudristek 63/2023'
                      : 'Permendikbud 75/2016 Pasal 10 & 12')}
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                isDanger
                  ? 'bg-[#FEF2F2] text-[#DC2626]'
                  : 'bg-[#EBF3F8] text-[#2E6496]'
              }`}
            >
              {isDanger
                ? 'Melanggar Regulasi'
                : ocrScanResult.statusType === 'neutral'
                ? 'Tidak Ada Tarikan'
                : 'Sesuai Ketentuan'}
            </span>
          </div>
        </div>
      </div>

      {isDanger ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onReport}
            className="w-full py-3.5 px-5 rounded-xl school-btn-danger font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Kirim Laporan Anonim ke Inspektorat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-center text-[#64748B]">
            Laporan dikirim secara anonim tanpa mencantumkan nama atau nomor HP Anda.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onReport}
          className="w-full py-3 px-5 rounded-xl school-btn-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <span>Tetap Laporkan jika Mengalami Pemaksaan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
