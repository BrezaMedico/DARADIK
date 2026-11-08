import React, { useState, useMemo, useEffect } from 'react';
import { Flag } from 'lucide-react';
import type {
  BospRealizationItem,
  SchoolData,
  WaScenarioData,
} from '@/types/school';
import { formatRupiah, searchBospItems } from '@/utils';
import { generateBospTransparencyPdf } from '@/utils/pdfReportGenerator';
import { WaScannerWorkspace } from '@/features/wa-scanner';
import {
  SchoolIdentityHeader,
  type ProfileTab,
} from './components/SchoolIdentityHeader';
import { BudgetSummaryTab } from './components/BudgetSummaryTab';
import { RealizedItemsTab } from './components/RealizedItemsTab';

export type { ProfileTab };

interface SchoolProfilePageProps {
  school: SchoolData;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onBackToLanding: () => void;
  onOpenKamusModal: () => void;
  onOpenInvoiceModal: (item: BospRealizationItem) => void;
  onOpenGeotagModal: (item: BospRealizationItem) => void;
  onReportFromItem: (item: BospRealizationItem) => void;
  onReportFromWaScenario: (scenario: WaScenarioData) => void;
  onOpenAnonymousReport?: () => void;
  onShowToast: (message: string) => void;
}

function useAnimatedProgress(triggerKey: string, duration = 560): number {
  const [progress, setProgress] = useState<number>(1);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }

    let frameId: number;
    const start = performance.now();
    setProgress(0);

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [triggerKey, duration]);

  return progress;
}

export const SchoolProfilePage: React.FC<SchoolProfilePageProps> = ({
  school,
  activeTab,
  onTabChange,
  onBackToLanding,
  onOpenKamusModal,
  onOpenInvoiceModal,
  onOpenGeotagModal,
  onReportFromItem,
  onReportFromWaScenario,
  onOpenAnonymousReport,
  onShowToast,
}) => {
  const currentItems = school.items || [];
  const currentStudentCount = school.studentCount || 90;
  const currentPerStudentEstimate = school.perStudentEstimate || 1900000;
  const currentTotalBosp =
    school.totalBosp || currentStudentCount * currentPerStudentEstimate;
  const currentTahap1 = school.tahap1 || {
    amount: Math.round(currentTotalBosp * 0.5),
    period: 'Jan–Jun',
    status: 'Sudah Cair',
    disbursedDate: '16 Februari 2026',
  };
  const currentTahap2 = school.tahap2 || {
    amount:
      currentTotalBosp -
      (school.tahap1?.amount || Math.round(currentTotalBosp * 0.5)),
    period: 'Jul–Des',
    status: 'Sudah Cair',
    disbursedDate: '14 Agustus 2026',
  };

  const schoolType =
    school.schoolType ||
    (/^SDN|^SMPN|^SMAN|^SMKN|\bNegeri\b/i.test(school.name) ? 'Negeri' : 'Swasta');
  const educationLevel =
    school.educationLevel ||
    (/^SD/i.test(school.name)
      ? 'SD'
      : /^SMP/i.test(school.name)
      ? 'SMP'
      : /^SMK/i.test(school.name)
      ? 'SMK'
      : 'SMA');
  const maxHonorLimit =
    school.maxHonorariumLimit || (schoolType === 'Swasta' ? 40 : 20);

  const [committedQuery, setCommittedQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string>(
    currentItems[0]?.id || ''
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const animProgress = useAnimatedProgress(`${school.id}-${activeTab}`, 560);

  const searchResult = useMemo(() => {
    return searchBospItems(committedQuery, currentItems);
  }, [committedQuery, currentItems]);

  useEffect(() => {
    if (currentItems.length > 0) {
      setExpandedItemId(currentItems[0].id);
    }
  }, [currentItems]);

  const handleExecuteSearch = (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : committedQuery).trim();
    setCommittedQuery(q);
    const result = searchBospItems(q, currentItems);
    if (result.results.length > 0) {
      setExpandedItemId(result.results[0].item.id);
    }
  };

  const handleClearSearch = () => {
    setCommittedQuery('');
    if (currentItems.length > 0) {
      setExpandedItemId(currentItems[0].id);
    }
  };

  const handleShareSchool = async () => {
    const shareUrl = `${window.location.origin}/?npsn=${school.npsn}`;
    let shared = false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transparansi BOSP - ${school.name}`,
          text: `Cek transparansi dana BOSP dan rincian belanja ${school.name} (NPSN: ${school.npsn}) di DARADIK:`,
          url: shareUrl,
        });
        shared = true;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    if (!shared) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        onShowToast('Tautan profil sekolah berhasil disalin ke papan klip!');
      } catch {
        onShowToast(`Tautan profil sekolah: ${shareUrl}`);
      }
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateBospTransparencyPdf(school, '2026');
      onShowToast(
        `Laporan PDF resmi ${school.name} (TA 2026) berhasil diunduh.`
      );
    } catch (err) {
      console.error('[DARADIK PDF]', err);
      onShowToast('Gagal memproses berkas PDF. Silakan coba kembali.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const principalName =
    school.principalName ||
    school.items[0]?.invoice?.principalName?.replace(
      /\s*\(Kepala Sekolah\)/i,
      ''
    ) ||
    'Ahmad Dahlan, S.Ag';

  return (
    <div className="w-full py-4 sm:py-8 lg:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <SchoolIdentityHeader
          school={school}
          schoolType={schoolType}
          principalName={principalName}
          currentStudentCount={currentStudentCount}
          itemCount={currentItems.length}
          activeTab={activeTab}
          isDownloadingPdf={isDownloadingPdf}
          onTabChange={onTabChange}
          onBackToLanding={onBackToLanding}
          onShareSchool={handleShareSchool}
          onDownloadPdf={handleDownloadPdf}
        />

        {activeTab === 'summary' && (
          <BudgetSummaryTab
            school={school}
            educationLevel={educationLevel}
            schoolType={schoolType}
            currentStudentCount={currentStudentCount}
            currentPerStudentEstimate={currentPerStudentEstimate}
            currentTotalBosp={currentTotalBosp}
            currentTahap1={currentTahap1}
            currentTahap2={currentTahap2}
            maxHonorLimit={maxHonorLimit}
            animProgress={animProgress}
            onOpenKamusModal={onOpenKamusModal}
          />
        )}

        {activeTab === 'items-ai' && (
          <RealizedItemsTab
            currentItems={currentItems}
            committedQuery={committedQuery}
            searchResult={searchResult}
            expandedItemId={expandedItemId}
            setExpandedItemId={setExpandedItemId}
            onExecuteSearch={handleExecuteSearch}
            onClearSearch={handleClearSearch}
            onOpenInvoiceModal={onOpenInvoiceModal}
            onOpenGeotagModal={onOpenGeotagModal}
            onReportFromItem={onReportFromItem}
          />
        )}

        {activeTab === 'wa-scanner' && (
          <div className="animate-school-item">
            <WaScannerWorkspace
              school={school}
              onReportFromWaScenario={onReportFromWaScenario}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* 5. BOTTOM REPORT CALLOUT */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1E293B]">
              Menemukan data yang tidak sesuai?
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Laporkan ketidaksesuaian barang atau pungutan sekolah secara 100% anonim.
            </p>
          </div>
          <button
            type="button"
            onClick={
              onOpenAnonymousReport ||
              (() => onReportFromItem(school.items[0]))
            }
            className="px-5 py-2.5 rounded-full bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Flag className="w-4 h-4" />
            <span>Buat Laporan Anonim</span>
          </button>
        </div>
      </div>
    </div>
  );
};

