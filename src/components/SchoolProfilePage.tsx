import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  CheckCircle2,
  Search,
  Wind,
  Paintbrush,
  BookMarked,
  Monitor,
  Droplets,
  Armchair,
  FileText,
  MapPin,
  AlertTriangle,
  ChevronDown,
  ReceiptText,
  ScanLine,
  X,
  Building2,
  Scale,
  Loader2,
  Info,
  Calendar,
  Clock,
  Flag,
  Wallet,
  BookOpen,
} from 'lucide-react';
import {
  BAZMA_YEARLY_HISTORY,
  BospRealizationItem,
  SchoolData,
  WaScenarioData,
  formatRupiah,
} from '../data/schoolsData';
import { InteractiveDonutChart } from './DonutChart';
import { WaScannerWorkspace } from './WaScannerWorkspace';
import {
  searchBospItems,
  SemanticSearchResultItem,
} from '../lib/semanticItemSearch';
import { generateBospTransparencyPdf } from '../lib/pdfReportGenerator';

export type ProfileTab = 'summary' | 'items-ai' | 'wa-scanner';

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

const QUICK_CHIPS = [
  'kipas angin',
  'proyektor',
  'modul buku',
  'kamar mandi',
  'meja kursi',
  'switch internet',
];

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
  const selectedYear = '2026';

  // Active Year Data (Tahun Berjalan 2026)
  const activeYearData = useMemo(() => {
    if (school.history && school.history[selectedYear]) {
      return school.history[selectedYear];
    }
    if (BAZMA_YEARLY_HISTORY[selectedYear]) {
      return BAZMA_YEARLY_HISTORY[selectedYear];
    }
    return BAZMA_YEARLY_HISTORY['2026'];
  }, [school.history]);

  const currentItems = activeYearData.items;
  const currentStudentCount =
    activeYearData.studentCount || school.studentCount || 90;
  const currentPerStudentEstimate =
    activeYearData.perStudentEstimate || school.perStudentEstimate || 1680000;
  const currentTotalBosp =
    activeYearData.totalBosp || currentStudentCount * currentPerStudentEstimate;
  const currentTahap1 = activeYearData.tahap1;
  const currentTahap2 = activeYearData.tahap2;

  const schoolType =
    school.schoolType ||
    (/^SMKN|^SMAN|\bNegeri\b/i.test(school.name) ? 'Negeri' : 'Swasta');
  const educationLevel =
    school.educationLevel || (/^SMK/i.test(school.name) ? 'SMK' : 'SMA');
  const maxHonorLimit =
    school.maxHonorariumLimit || (schoolType === 'Swasta' ? 40 : 20);

  // State 3 Tab Komposisi Pie Chart: Global (Juknis 2026), Tahap 1, Tahap 2
  const [compositionTab, setCompositionTab] = useState<
    'global' | 'tahap1' | 'tahap2'
  >('global');

  const globalCompositions = activeYearData.compositions;
  const currentCompositions = globalCompositions;
  const tahap1Compositions =
    activeYearData.tahap1Compositions ||
    school.tahap1Compositions ||
    activeYearData.compositions;
  const tahap2Compositions =
    activeYearData.tahap2Compositions ||
    school.tahap2Compositions ||
    activeYearData.compositions;

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

  // Tab 2 State: Search & Expand
  const [searchInput, setSearchInput] = useState<string>('');
  const [committedQuery, setCommittedQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<string>(
    currentItems[0]?.id || ''
  );

  // PDF Export State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Animation progress
  const animProgress = useAnimatedProgress(
    `${school.id}-${activeTab}-${selectedYear}`,
    560
  );

  // Semantic Search Execution
  const searchResult = useMemo(() => {
    return searchBospItems(committedQuery, currentItems);
  }, [committedQuery, currentItems]);

  useEffect(() => {
    if (currentItems.length > 0) {
      setExpandedItemId(currentItems[0].id);
    }
  }, [currentItems]);

  const handleExecuteSearch = (queryToSearch?: string) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchInput;
    setIsSearching(true);

    setTimeout(() => {
      setCommittedQuery(q.trim());
      setIsSearching(false);
      const result = searchBospItems(q.trim(), currentItems);
      if (result.results.length > 0) {
        setExpandedItemId(result.results[0].item.id);
      }
    }, 180);
  };

  const handleSelectQuickChip = (chip: string) => {
    setSearchInput(chip);
    handleExecuteSearch(chip);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setCommittedQuery('');
    if (currentItems.length > 0) {
      setExpandedItemId(currentItems[0].id);
    }
  };

  const handleShareSchool = async () => {
    const shareUrl = `${window.location.origin}/?npsn=${school.npsn}`;
    const shareText = `Ringkasan Transparansi BOSP ${school.name} (NPSN: ${school.npsn}), Pagu BOSP TA ${selectedYear}: ${formatRupiah(
      currentTotalBosp
    )}. Cek rincian penggunaan di: ${shareUrl}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      // Fallback
    }
    onShowToast(
      'Tautan ringkasan transparansi berhasil disalin untuk dibagikan ke grup WA!'
    );
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateBospTransparencyPdf(school, '2026');
      onShowToast(
        `Laporan PDF resmi ${school.name} (TA ${selectedYear}) berhasil diunduh.`
      );
    } catch (err) {
      console.error('[DARADIK PDF]', err);
      onShowToast('Gagal memproses berkas PDF. Silakan coba kembali.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const renderItemIcon = (type: BospRealizationItem['iconType']) => {
    const iconProps = { className: 'w-5 h-5 text-[#2E6496] shrink-0' };
    switch (type) {
      case 'fan':
        return <Wind {...iconProps} />;
      case 'paint':
        return <Paintbrush {...iconProps} />;
      case 'book':
        return <BookMarked {...iconProps} />;
      case 'projector':
        return <Monitor {...iconProps} />;
      case 'sanitation':
        return <Droplets {...iconProps} />;
      case 'desk':
        return <Armchair {...iconProps} />;
    }
  };

  const renderMatchBadge = (res: SemanticSearchResultItem) => {
    switch (res.matchCategory) {
      case 'exact':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-semibold text-[#2E6496]">
            <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
            <span>Cocok Persis</span>
          </span>
        );
      case 'synonym':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-medium text-[#2E6496]">
            Istilah Serupa
          </span>
        );
      case 'fuzzy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[11px] font-medium text-[#B45309]">
            Koreksi Ejaan
          </span>
        );
      case 'semantic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-medium text-[#2E6496]">
            Kategori Terkait
          </span>
        );
      default:
        return null;
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
        {/* ===================================================================
            1. TOP UTILITY BAR (Kembali ke Pencarian Left | Bagikan & Unduh Right)
           =================================================================== */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 animate-school-header">
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-bold text-[#1E293B] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Kembali ke Pencarian</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleShareSchool}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-bold text-[#1E293B] shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#2E6496]" />
              <span>Bagikan</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 text-[#FFFFFF] animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#FFFFFF]" />
              )}
              <span>
                {isDownloadingPdf ? 'Membuat...' : 'Unduh Ringkasan'}
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            2. SCHOOL PROFILE IDENTITY CARD (Desain Modern, Foto Sekolah & Responsif HP)
           =================================================================== */}
        <div
          className="rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs p-4 sm:p-6 lg:p-7 animate-school-header"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            {/* School Real Photo / Emblem Badge */}
            {school.imageUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl border-2 border-[#C9DFDC] shadow-xs shrink-0 overflow-hidden bg-[#FAF8F5] relative group">
                <img
                  src={school.imageUrl}
                  alt={school.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#2E6496] to-[#457FA8] text-[#FFFFFF] flex items-center justify-center shadow-xs shrink-0">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFFFFF]" />
              </div>
            )}

            {/* School Identity Main Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#EBF3F8] text-[11px] sm:text-xs font-bold text-[#2E6496] tabular-nums">
                  NPSN {school.npsn}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B]">
                  Sekolah {schoolType}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                {school.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                <span className="break-words">{school.address}</span>
              </p>
            </div>

            {/* Structured Spec Info (Kepala Sekolah & Jumlah Siswa) */}
            <div className="w-full md:w-auto grid grid-cols-2 md:flex md:flex-col gap-2 sm:gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-[#C9DFDC]/60 md:pl-6">
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

        {/* ===================================================================
            3. PROMINENT 3-TAB NAVIGATION BAR
           =================================================================== */}
        <div
          className="p-1.5 sm:p-2 bg-[#FFFFFF]/95 backdrop-blur-md border border-[#C9DFDC] rounded-2xl grid grid-cols-3 gap-1 sm:gap-2 shadow-xs sticky top-[68px] sm:static z-30 animate-school-header"
          style={{ animationDelay: '80ms' }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'summary'}
            onClick={() => onTabChange('summary')}
            className={`py-2 sm:py-3 px-1 sm:px-4 rounded-xl text-[11px] sm:text-sm leading-tight font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center cursor-pointer ${
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
            aria-selected={activeTab === 'items-ai'}
            onClick={() => onTabChange('items-ai')}
            className={`py-2 sm:py-3 px-1 sm:px-4 rounded-xl text-[11px] sm:text-sm leading-tight font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center cursor-pointer ${
              activeTab === 'items-ai'
                ? 'bg-[#1E293B] text-[#FFFFFF] shadow-xs'
                : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
            }`}
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${
                activeTab === 'items-ai'
                  ? 'bg-[#2E6496] text-[#FFFFFF]'
                  : 'bg-[#EBF3F8] text-[#2E6496]'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
            </div>
            <span>Hasil Belanja</span>
            <span
              className={`hidden sm:inline px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums ${
                activeTab === 'items-ai'
                  ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                  : 'bg-[#EBF3F8] text-[#2E6496]'
              }`}
            >
              {currentItems.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'wa-scanner'}
            onClick={() => onTabChange('wa-scanner')}
            className={`py-2 sm:py-3 px-1 sm:px-4 rounded-xl text-[11px] sm:text-sm leading-tight font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center cursor-pointer ${
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
            <span>Cek Iuran WA</span>
          </button>
        </div>

        {/* ===================================================================
            TAB 1: RINGKASAN DANA BOSP
           =================================================================== */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* CARD 1: DANA BOSP TAHUN INI & PENCAIRAN 2 TAHAP */}
            <div
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2E6496] via-[#3570A6] to-[#5B98B5] text-[#FFFFFF] p-4 sm:p-6 lg:p-8 shadow-sm animate-school-item"
              style={{ animationDelay: '60ms' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left 7 Cols: Perhitungan & Total Dana BOSP (Alur Membaca Alami & Nyaman) */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#FFFFFF] text-[#2E6496] flex items-center justify-center shrink-0 shadow-xs">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-extrabold text-[#FFFFFF]">
                          Dana BOSP Tahun {selectedYear}
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
                    <div className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#FFFFFF] tracking-tight tabular-nums leading-none break-words">
                      {formatRupiah(Math.round(currentTotalBosp * animProgress))}
                    </div>
                    <p className="text-xs text-[#FFFFFF]/80 mt-1.5">
                      Total alokasi pagu dana BOSP selama 1 tahun
                    </p>
                  </div>

                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={onOpenKamusModal}
                      className="px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#2E6496] text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
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
                      <div className="text-base sm:text-lg font-extrabold text-[#1E293B] tabular-nums mt-1">
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
                      <div className="text-base sm:text-lg font-extrabold text-[#1E293B] tabular-nums mt-1">
                        {formatRupiah(Math.round(currentTahap2.amount * animProgress))}
                      </div>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        Cair: {currentTahap2.disbursedDate}
                      </span>
                    </div>
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
        )}

        {/* ===================================================================
            TAB 2: HASIL PEMBELANJAAN SEKOLAH
           =================================================================== */}
        {activeTab === 'items-ai' && (
          <div className="space-y-5">
            {/* Search & Quick Filter Card */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-3xl p-5 sm:p-6 shadow-xs animate-school-item">
              <div className="mb-3.5">
                <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] tracking-tight">
                  Daftar Realisasi Pembelanjaan BOSP (TA 2026)
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Periksa bukti nota kuitansi dan lokasi fisik barang yang dibeli sekolah menggunakan dana BOSP.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteSearch();
                }}
                className="flex flex-col sm:flex-row items-stretch gap-2.5"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#2E6496] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Ketik barang yang dicari: kipas angin, buku modul, proyektor, meja kursi, wifi..."
                    className="w-full pl-11 pr-9 py-3 text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-full text-[#1E293B] font-medium placeholder:text-[#94A3B8] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496] transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#1E293B] rounded-full cursor-pointer"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 rounded-full bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-sm font-bold shadow-xs active:translate-y-[1px] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-[#FFFFFF]" />
                      <span>Cari Barang</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#64748B] mr-1 font-medium">
                  Pencarian cepat:
                </span>
                {QUICK_CHIPS.map((chip) => {
                  const isActive =
                    committedQuery.toLowerCase() === chip.toLowerCase();
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSelectQuickChip(chip)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                          : 'bg-[#FAF8F5] text-[#475569] border border-[#C9DFDC] hover:bg-[#EBF3F8] hover:text-[#1E293B]'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              {committedQuery && (
                <div className="mt-4 pt-3 border-t border-[#C9DFDC]/60 flex items-center justify-between text-xs text-[#475569]">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>
                      Hasil pencarian:{' '}
                      <strong className="text-[#1E293B]">
                        &ldquo;{committedQuery}&rdquo;
                      </strong>{' '}
                      ({searchResult.totalFound} barang ditemukan)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="font-bold text-[#2E6496] hover:underline cursor-pointer"
                  >
                    Tampilkan Semua
                  </button>
                </div>
              )}
            </div>

            {/* Item Cards List */}
            <div
              className="space-y-3 animate-school-item"
              style={{ animationDelay: '90ms' }}
            >
              {searchResult.results.length === 0 ? (
                <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1E293B]">
                      Barang Tidak Ditemukan
                    </h4>
                    <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto mt-1 leading-relaxed">
                      Barang dengan kata kunci{' '}
                      <strong className="text-[#1E293B]">
                        &ldquo;{committedQuery}&rdquo;
                      </strong>{' '}
                      tidak tercatat dalam pembelanjaan BOSP tahun {selectedYear}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="school-btn-secondary px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Tampilkan Semua Barang ({currentItems.length})
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResult.results.map((res) => {
                    const item = res.item;
                    const isExpanded = expandedItemId === item.id;
                    const cleanRoomLabel = item.geotag.roomLabel
                      .split('\u2014')[0]
                      .split(' - ')[0]
                      .trim();

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border transition-all duration-200 ease-out overflow-hidden ${
                          isExpanded
                            ? 'bg-[#FFFFFF] border-[#2E6496] shadow-xs'
                            : 'bg-[#FFFFFF] border-[#C9DFDC] hover:border-[#66A3BF]'
                        }`}
                      >
                        <div
                          onClick={() =>
                            setExpandedItemId(isExpanded ? '' : item.id)
                          }
                          className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-[#2E6496]">
                              {renderItemIcon(item.iconType)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-[#1E293B] leading-snug tracking-tight">
                                  {item.name}
                                </h3>
                                {committedQuery && renderMatchBadge(res)}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-[#475569]">
                                <span className="font-semibold text-[#1E293B]">
                                  {item.unitSummary}
                                </span>
                                <span
                                  className="text-[#CBD5E1]"
                                  aria-hidden="true"
                                >
                                  •
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                                  <span>{item.date}</span>
                                </span>
                                <span
                                  className="text-[#CBD5E1]"
                                  aria-hidden="true"
                                >
                                  •
                                </span>
                                <span className="inline-flex items-center gap-1 text-[#2E6496] font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-[#2E6496]" />
                                  <span>{cleanRoomLabel}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#C9DFDC]/50 shrink-0">
                            <div className="text-left sm:text-right">
                              <span className="text-[11px] text-[#64748B] block font-medium">
                                Total Biaya
                              </span>
                              <div className="text-base sm:text-lg font-extrabold text-[#2E6496] tabular-nums tracking-tight">
                                {formatRupiah(item.amount)}
                              </div>
                            </div>

                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-200 ${
                                isExpanded
                                  ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                                  : 'bg-[#FAF8F5] border-[#C9DFDC] text-[#475569]'
                              }`}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-300 ease-out ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 bg-[#FAF8F5] border-t border-[#C9DFDC]/60 space-y-4 text-xs sm:text-sm school-expand-panel">
                            <div className="rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] divide-y divide-[#C9DFDC]/60 overflow-hidden">
                              <div className="p-4">
                                <span className="text-xs font-bold text-[#2E6496] block mb-1">
                                  Tujuan Penggunaan
                                </span>
                                <p className="text-[#1E293B] leading-relaxed">
                                  {item.allocation}
                                </p>
                              </div>

                              {item.invoice.lineItems.length > 0 && (
                                <div className="p-4 space-y-2">
                                  <span className="text-xs font-bold text-[#475569] block">
                                    Rincian Barang yang Dibeli
                                  </span>
                                  <div className="divide-y divide-[#C9DFDC]/40">
                                    {item.invoice.lineItems.map((li, lIdx) => (
                                      <div
                                        key={lIdx}
                                        className="flex items-center justify-between py-2 first:pt-1 last:pb-0 gap-3"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#2E6496] shrink-0" />
                                          <span className="font-medium text-[#1E293B] truncate">
                                            {li.name}
                                          </span>
                                          <span className="text-xs text-[#64748B] shrink-0 tabular-nums">
                                            ({li.qty})
                                          </span>
                                        </div>
                                        <span className="font-bold text-[#2E6496] tabular-nums shrink-0">
                                          {formatRupiah(li.subtotal)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="p-4 flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-bold text-[#1E293B] block">
                                    Lokasi Ruangan:{' '}
                                    {item.geotag.roomLabel.replace(
                                      '\u2014',
                                      '-'
                                    )}
                                  </span>
                                  <p className="text-[#475569] mt-0.5">
                                    Catatan pemeriksaan: &ldquo;
                                    {item.geotag.inspectorNote}&rdquo;
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenInvoiceModal(item)}
                                  className="school-btn-secondary px-4 py-2 rounded-full text-xs font-semibold text-[#2E6496] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#2E6496]" />
                                  <span>Lihat Foto Kwitansi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenGeotagModal(item)}
                                  className="school-btn-secondary px-4 py-2 rounded-full text-xs font-semibold text-[#2E6496] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#2E6496]" />
                                  <span>Foto Ruang Kelas</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => onReportFromItem(item)}
                                className="px-4 py-2 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-xs font-bold text-[#DC2626] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                                <span>Laporkan Jika Tidak Ada</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: VERIFIKASI IURAN GRUP WA
           =================================================================== */}
        {activeTab === 'wa-scanner' && (
          <div className="animate-school-item">
            <WaScannerWorkspace
              school={school}
              onReportFromWaScenario={onReportFromWaScenario}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* ===================================================================
            5. BOTTOM REPORT CALLOUT
           =================================================================== */}
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
