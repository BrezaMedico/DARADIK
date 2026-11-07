import React, { useState } from 'react';
import {
  Wallet,
  BookOpen,
  CheckCircle2,
  Scale,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { SchoolData } from '@/types/school';
import { formatRupiah } from '@/utils';
import { InteractiveDonutChart } from '@/components/charts/DonutChart';

interface BudgetSummaryTabProps {
  school: SchoolData;
  educationLevel: string;
  schoolType: string;
  currentStudentCount: number;
  currentPerStudentEstimate: number;
  currentTotalBosp: number;
  currentTahap1: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  currentTahap2: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  maxHonorLimit: number;
  animProgress: number;
  onOpenKamusModal: () => void;
}

export const BudgetSummaryTab: React.FC<BudgetSummaryTabProps> = ({
  school,
  educationLevel,
  schoolType,
  currentStudentCount,
  currentPerStudentEstimate,
  currentTotalBosp,
  currentTahap1,
  currentTahap2,
  maxHonorLimit,
  animProgress,
  onOpenKamusModal,
}) => {
  const [compositionTab, setCompositionTab] = useState<
    'global' | 'tahap1' | 'tahap2'
  >('global');

  const globalCompositions = school.compositions || [];
  const tahap1Compositions =
    school.tahap1Compositions ||
    school.compositions ||
    [];
  const tahap2Compositions =
    school.tahap2Compositions ||
    school.compositions ||
    [];

  const activeCompositionList =
    compositionTab === 'tahap1'
      ? tahap1Compositions
      : compositionTab === 'tahap2'
      ? tahap2Compositions
      : globalCompositions;

  const activeCompositionTotal =
    compositionTab === 'tahap1'
      ? currentTahap1.amount
      : compositionTab === 'tahap2'
      ? currentTahap2.amount
      : currentTotalBosp;

  return (
    <div className="space-y-6">
      {/* CARD 1: DANA BOSP TAHUN INI & PENCAIRAN 2 TAHAP */}
      <div
        className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2E6496] via-[#3570A6] to-[#5B98B5] text-[#FFFFFF] p-4 sm:p-6 lg:p-8 shadow-sm animate-school-item"
        style={{ animationDelay: '60ms' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 7 Cols: Perhitungan & Total Dana BOSP */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#FFFFFF] text-[#2E6496] flex items-center justify-center shrink-0 shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#FFFFFF]">
                    Dana BOSP Tahun 2026
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFFFFF]/20 text-[11px] font-bold text-[#FFFFFF]">
                    {educationLevel} {schoolType}
                  </span>
                </div>
                <p className="text-xs text-[#FFFFFF]/85 mt-0.5">
                  Wilayah {school.kabupaten}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs sm:text-sm font-semibold text-[#FFFFFF]/85 tabular-nums block mb-1">
                {currentStudentCount.toLocaleString('id-ID')} Siswa &times; {formatRupiah(currentPerStudentEstimate)} / siswa
              </span>
              <div className="text-2xl sm:text-4xl lg:text-[44px] font-extrabold text-[#FFFFFF] tracking-tight tabular-nums leading-none break-words font-sturdy-heading">
                {formatRupiah(Math.round(currentTotalBosp * animProgress))}
              </div>
              <p className="text-xs text-[#FFFFFF]/80 mt-1.5">
                Total alokasi pagu dana BOSP selama 1 tahun anggaran
              </p>
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={onOpenKamusModal}
                className="min-h-[40px] px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#2E6496] text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kamus Aturan BOSP</span>
              </button>
            </div>
          </div>

          {/* Right 5 Cols: Pencairan Tahap 1 & Tahap 2 */}
          <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] text-[#1E293B] p-4 sm:p-5 shadow-xs flex flex-col justify-center">
            <div className="space-y-2.5">
              {/* Tahap 1 */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC]/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Tahap 1 ({currentTahap1.period})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E6496]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentTahap1.status}</span>
                  </span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#1E293B] tabular-nums mt-1 font-mono">
                  {formatRupiah(Math.round(currentTahap1.amount * animProgress))}
                </div>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  Cair: {currentTahap1.disbursedDate}
                </span>
              </div>

              {/* Tahap 2 */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC]/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Tahap 2 ({currentTahap2.period})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E6496]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentTahap2.status}</span>
                  </span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#1E293B] tabular-nums mt-1 font-mono">
                  {formatRupiah(Math.round(currentTahap2.amount * animProgress))}
                </div>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  Cair: {currentTahap2.disbursedDate}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#C9DFDC]/60 flex items-center justify-between text-[11px] text-[#64748B]">
              <span className="inline-flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-[#2E6496]" />
                <span>Batas Honorarium: Maks {maxHonorLimit}%</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2E6496]" />
                <span>2 Tahap / Tahun</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: KOMPOSISI PENGGUNAAN DANA (3 TAB: GLOBAL, TAHAP 1, TAHAP 2) */}
      <div
        className="rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] p-4 sm:p-6 lg:p-8 shadow-xs animate-school-item"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#C9DFDC]/70">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] tracking-tight">
              Komposisi Penggunaan Dana
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              {compositionTab === 'global'
                ? `Pembagian dana 1 tahun sesuai ketentuan Kemendikdasmen 2026 (Sekolah ${schoolType})`
                : compositionTab === 'tahap1'
                ? `Alokasi pemakaian dana Tahap 1 (${currentTahap1.period})`
                : `Alokasi pemakaian dana Tahap 2 (${currentTahap2.period})`}
            </p>
          </div>

          {/* 3-Tab Switcher: Global, Tahap 1, Tahap 2 */}
          <div
            className="inline-grid grid-cols-3 p-1 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] gap-1 self-start sm:self-auto w-full sm:w-auto"
            role="tablist"
            aria-label="Pilih tahap komposisi dana"
          >
            <button
              type="button"
              role="tab"
              aria-selected={compositionTab === 'global'}
              onClick={() => setCompositionTab('global')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                compositionTab === 'global'
                  ? 'bg-[#2E6496] text-[#FFFFFF]'
                  : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FFFFFF]'
              }`}
            >
              Global
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={compositionTab === 'tahap1'}
              onClick={() => setCompositionTab('tahap1')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                compositionTab === 'tahap1'
                  ? 'bg-[#2E6496] text-[#FFFFFF]'
                  : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FFFFFF]'
              }`}
            >
              Tahap 1
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={compositionTab === 'tahap2'}
              onClick={() => setCompositionTab('tahap2')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                compositionTab === 'tahap2'
                  ? 'bg-[#2E6496] text-[#FFFFFF]'
                  : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FFFFFF]'
              }`}
            >
              Tahap 2
            </button>
          </div>
        </div>

        <InteractiveDonutChart
          compositions={activeCompositionList}
          totalAmount={activeCompositionTotal}
          centerSubtitle={
            compositionTab === 'global'
              ? 'Total 1 Tahun'
              : compositionTab === 'tahap1'
              ? 'Dana Tahap 1'
              : 'Dana Tahap 2'
          }
          badgeLabel={
            compositionTab === 'global'
              ? `Sekolah ${schoolType}`
              : compositionTab === 'tahap1'
              ? currentTahap1.period
              : currentTahap2.period
          }
        />
      </div>
    </div>
  );
};

