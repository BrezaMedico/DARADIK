import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  CheckCircle2,
  ArrowRight,
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
  ChevronUp,
  Sparkles,
  ReceiptText,
  ScanLine,
  X,
  Building2,
  Camera,
  Scale,
  Loader2,
  Info,
  Calendar,
  Clock,
  History,
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
import { searchBospItems, SemanticSearchResultItem } from '../lib/semanticItemSearch';
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

/**
 * Smooth animation progress hook (0 -> 1) for count-up numbers and progress bars.
 * Respects `prefers-reduced-motion: reduce`.
 */
function useAnimatedProgress(triggerKey: string, duration = 550): number {
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
  onOpenInvoiceModal,
  onOpenGeotagModal,
  onReportFromItem,
  onReportFromWaScenario,
  onOpenAnonymousReport,
  onShowToast,
}) => {
  // Year History State: '2026' (default: tahun ini) or '2025' (tahun kemarin)
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');

  // Active Year Data: Derived from school.history or BAZMA_YEARLY_HISTORY
  const activeYearData = useMemo(() => {
    if (school.history && school.history[selectedYear]) {
      return school.history[selectedYear];
    }
    if (BAZMA_YEARLY_HISTORY[selectedYear]) {
      return BAZMA_YEARLY_HISTORY[selectedYear];
    }
    return BAZMA_YEARLY_HISTORY['2026'];
  }, [school.history, selectedYear]);

  const currentItems = activeYearData.items;
  const currentTotalBosp = activeYearData.totalBosp;
  const currentTahap1 = activeYearData.tahap1;
  const currentTahap2 = activeYearData.tahap2;
  const currentCompositions = activeYearData.compositions;

  // Tab 2 State: AI Semantic Search
  const [searchInput, setSearchInput] = useState<string>('');
  const [committedQuery, setCommittedQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<string>(
    currentItems[0]?.id || ''
  );

  // PDF Export State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Animation progress
  const animProgress = useAnimatedProgress(`${school.id}-${activeTab}-${selectedYear}`, 560);

  // Semantic Search Execution using the AI Semantic Search Engine on the active year's items
  const searchResult = useMemo(() => {
    return searchBospItems(committedQuery, currentItems);
  }, [committedQuery, currentItems]);

  // When selected year changes, update expandedItemId to the first item of that year
  useEffect(() => {
    if (currentItems.length > 0) {
      setExpandedItemId(currentItems[0].id);
    }
  }, [selectedYear, currentItems]);

  // Execute committed search with loading state
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
    const shareText = `Ringkasan Transparansi BOSP ${school.name} (NPSN: ${school.npsn}) — Pagu BOSP 1 Tahun TA ${selectedYear}: ${formatRupiah(
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

  // Real, Professional PDF Download
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateBospTransparencyPdf(school, selectedYear);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-[11px] font-semibold text-[#2E6496]">
            <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
            <span>Kecocokan Persis</span>
          </span>
        );
      case 'synonym':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] border border-[#66A3BF]/40 text-[11px] font-semibold text-[#2E6496]">
            <Sparkles className="w-3 h-3 text-[#2E6496]" />
            <span>Sinonim &amp; Istilah Serupa</span>
          </span>
        );
      case 'fuzzy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[11px] font-semibold text-[#B45309]">
            <Sparkles className="w-3 h-3 text-[#B45309]" />
            <span>Koreksi Penulisan (Typo)</span>
          </span>
        );
      case 'semantic':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3E8FF] border border-[#D8B4FE] text-[11px] font-semibold text-[#6B21A8]">
            <Sparkles className="w-3 h-3 text-[#6B21A8]" />
            <span>Makna Serupa</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#C9DFDC] text-[11px] font-medium text-[#475569]">
            <span>Katalog Resmi</span>
          </span>
        );
    }
  };

  const stage1SharePct = Math.round(
    (currentTahap1.amount / Math.max(currentTotalBosp, 1)) * 100
  );
  const stage2SharePct = Math.round(
    (currentTahap2.amount / Math.max(currentTotalBosp, 1)) * 100
  );

  return (
    <div className="w-full py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* TOP UTILITY BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 animate-school-header">
          <button
            type="button"
            onClick={onBackToLanding}
            className="school-btn-secondary px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Kembali ke Pencarian</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareSchool}
              className="school-btn-secondary px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#2E6496]" />
              <span>Bagikan</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="school-btn-secondary px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 text-[#2E6496] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#2E6496]" />
              )}
              <span>{isDownloadingPdf ? 'Membuat PDF...' : 'Unduh Ringkasan'}</span>
            </button>
          </div>
        </div>

        {/* SCHOOL PROFILE CARD — CLEANED & BALANCED LAYOUT */}
        <section
          className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-7 shadow-xs animate-school-header"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-6">
            {/* Foto Frame Sekolah di Kiri */}
            <div className="w-full sm:w-48 md:w-56 h-48 sm:h-52 rounded-xl border border-[#C9DFDC] bg-gradient-to-b from-[#F2EFE8] via-[#EAF2F1] to-[#DDECEB] flex flex-col items-center justify-center p-3 text-center shrink-0 relative overflow-hidden shadow-xs select-none">
              <div className="w-14 h-14 rounded-2xl bg-[#FFFFFF] border border-[#C9DFDC] flex items-center justify-center text-[#2E6496] shadow-xs mb-2">
                <Building2 className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-[#1E293B]">
                Profil Satuan Pendidikan
              </span>
              <span className="text-[11px] text-[#475569] mt-0.5">
                Arsip Data Dapodik
              </span>
              <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FFFFFF]/90 border border-[#C9DFDC] text-[10px] font-mono text-[#2E6496]">
                <Camera className="w-3 h-3" />
                <span>NPSN: {school.npsn}</span>
              </div>
            </div>

            {/* Detail Informasi Sekolah di Kanan (Clean Structure, No Old Tags) */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#C9DFDC]/60">
                <span className="text-xs font-mono uppercase tracking-wider text-[#475569] font-bold">
                  Data Pokok Sekolah
                </span>
                <span className="text-xs font-mono text-[#2E6496]">
                  NPSN {school.npsn}
                </span>
              </div>

              <table className="w-full text-xs sm:text-sm text-[#1E293B] border-collapse">
                <tbody className="divide-y divide-[#C9DFDC]/40">
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-[#475569] w-[130px] sm:w-[150px] whitespace-nowrap">
                      Nama Sekolah
                    </td>
                    <td className="py-2.5 px-1 font-bold text-[#64748B] w-[12px]">:</td>
                    <td className="py-2.5 pl-2 font-bold text-[#1E293B] text-sm sm:text-base">
                      {school.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      NPSN
                    </td>
                    <td className="py-2.5 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2.5 pl-2 font-mono font-semibold text-[#1E293B]">
                      {school.npsn}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      Alamat / Wilayah
                    </td>
                    <td className="py-2.5 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2.5 pl-2 text-[#1E293B] leading-relaxed">
                      {school.address || `Kec. ${school.kecamatan}, ${school.kabupaten}, ${school.provinsi}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      Kepala Sekolah
                    </td>
                    <td className="py-2.5 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2.5 pl-2 text-[#1E293B]">
                      {school.items[0]?.invoice?.principalName || 'Ahmad Dahlan, S.Kom., M.Pd.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      Jumlah Siswa
                    </td>
                    <td className="py-2.5 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2.5 pl-2 font-mono text-[#1E293B] tabular-nums font-semibold">
                      {school.studentCount} Siswa
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3 STANDALONE NAVIGATION TABS */}
        <div
          className="mt-6 p-1.5 bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-1.5 shadow-xs"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'summary'}
            onClick={() => onTabChange('summary')}
            className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-[#2E6496] text-[#FFFFFF] shadow-sm'
                : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FFFFFF]'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>Ringkasan Dana</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'items-ai'}
            onClick={() => onTabChange('items-ai')}
            className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'items-ai'
                ? 'bg-[#2E6496] text-[#FFFFFF] shadow-sm'
                : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FFFFFF]'
            }`}
          >
            <ReceiptText className="w-4 h-4 shrink-0" />
            <span>Hasil Pembelanjaan</span>
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[11px] tabular-nums ${
                activeTab === 'items-ai'
                  ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]'
                  : 'bg-[#C9DFDC]/60 text-[#2E6496]'
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
            className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'wa-scanner'
                ? 'bg-[#2E6496] text-[#FFFFFF] shadow-sm'
                : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FFFFFF]'
            }`}
          >
            <ScanLine className="w-4 h-4 shrink-0" />
            <span>Cek Iuran WA</span>
          </button>
        </div>

        {/* YEAR HISTORY SELECTOR BAR (TAMPIL PADA TAB RINGKASAN & HASIL PEMBELANJAAN) */}
        {(activeTab === 'summary' || activeTab === 'items-ai') && (
          <div className="mt-5 p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-school-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center text-[#2E6496] shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#1E293B]">
                    Histori Tahun Anggaran BOSP
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#C9DFDC] text-[#2E6496]">
                    TA {selectedYear}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  {selectedYear === '2026'
                    ? 'Menampilkan data BOSP tahun berjalan (2026 — Default)'
                    : 'Menampilkan arsip riwayat pembelanjaan tahun kemarin (2025)'}
                </p>
              </div>
            </div>

            <div className="inline-flex p-1 bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => setSelectedYear('2026')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedYear === '2026'
                    ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <span>2026</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    selectedYear === '2026'
                      ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]'
                      : 'bg-[#C9DFDC]/60 text-[#2E6496]'
                  }`}
                >
                  Tahun Ini
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedYear('2025')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedYear === '2025'
                    ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <span>2025</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    selectedYear === '2025'
                      ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]'
                      : 'bg-[#C9DFDC]/60 text-[#475569]'
                  }`}
                >
                  Tahun Lalu
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 1: REDESIGN HALAMAN RINGKASAN DANA (FOKUS 1 TAHUN PENUH)
           =================================================================== */}
        {activeTab === 'summary' && (
          <div className="mt-5 space-y-5">
            {/* EXECUTIVE 1-YEAR PAGU BOSP CARD */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-7 shadow-xs animate-school-item"
              style={{ animationDelay: '60ms' }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#2E6496]">
                      Alokasi Pagu 1 Tahun Penuh
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#64748B]">
                      Tahun Anggaran {selectedYear}
                    </span>
                    {selectedYear === '2026' ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-semibold text-[#2E6496] border border-[#66A3BF]/40">
                        Tahun Berjalan (Default)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[11px] font-semibold text-[#475569] border border-[#C9DFDC]">
                        Arsip Tahun Kemarin
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-[#475569]">
                    Total Alokasi Pagu Dana BOSP ({selectedYear})
                  </h3>

                  <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#2E6496] tabular-nums tracking-tight">
                    {formatRupiah(Math.round(currentTotalBosp * animProgress))}
                  </div>

                  <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
                    Alokasi dana BOSP resmi dari Kemdikbudristek untuk operasional pendidikan 1 tahun penuh (12 bulan kalender) di {school.name}.
                  </p>
                </div>

                {/* Status Ringkas Penyaluran Tahapan */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex flex-col justify-center min-w-[260px] space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-bold">
                    Status Penyaluran Tahapan ({selectedYear})
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#475569]">Tahap 1 (Semester Ganjil):</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#2E6496]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6496]" />
                        {currentTahap1.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#475569]">Tahap 2 (Semester Genap):</span>
                      {currentTahap2.status === 'Belum Cair' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#B45309]">
                          <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                          Belum Cair
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[#2E6496]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6496]" />
                          {currentTahap2.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* JADWAL & STATUS PENCAIRAN TAHAPAN BOSP */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-7 shadow-xs animate-school-item"
              style={{ animationDelay: '120ms' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#C9DFDC]/60">
                <div>
                  <h3 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
                    Jadwal &amp; Status Pencairan Tahapan BOSP {selectedYear}
                  </h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Penyaluran resmi dari kas negara langsung ke rekening satuan pendidikan
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-mono font-semibold text-[#2E6496]">
                  2 Tahap Reguler
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tahap 1 */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1E293B]">Tahap 1 ({currentTahap1.period})</span>
                      <span className="text-[11px] text-[#475569] block">Pencairan: {currentTahap1.disbursedDate}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFFFF] text-[11px] font-mono font-semibold text-[#2E6496] border border-[#C9DFDC]">
                      <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
                      {currentTahap1.status}
                    </span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#2E6496] tabular-nums">
                    {formatRupiah(currentTahap1.amount)}
                  </div>
                  <div className="w-full h-2 bg-[#FFFFFF] border border-[#C9DFDC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2E6496] rounded-full"
                      style={{ width: `${stage1SharePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-[#64748B]">
                    <span>Alokasi Semester Ganjil</span>
                    <span className="font-bold text-[#2E6496]">{stage1SharePct}% Pagu (Sudah Cair)</span>
                  </div>
                </div>

                {/* Tahap 2 */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    currentTahap2.status === 'Belum Cair'
                      ? 'bg-[#FFFBEB]/40 border-[#FDE68A]'
                      : 'bg-[#FAF8F5] border-[#C9DFDC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1E293B]">Tahap 2 ({currentTahap2.period})</span>
                      <span
                        className={`text-[11px] block ${
                          currentTahap2.status === 'Belum Cair'
                            ? 'text-[#B45309] font-medium'
                            : 'text-[#475569]'
                        }`}
                      >
                        {currentTahap2.status === 'Belum Cair'
                          ? 'Menunggu Penyaluran Kemenkeu'
                          : `Pencairan: ${currentTahap2.disbursedDate}`}
                      </span>
                    </div>
                    {currentTahap2.status === 'Belum Cair' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[11px] font-mono font-bold text-[#B45309] border border-[#FDE68A]">
                        <Clock className="w-3 h-3 text-[#B45309]" />
                        Belum Cair
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFFFF] text-[11px] font-mono font-semibold text-[#2E6496] border border-[#C9DFDC]">
                        <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
                        {currentTahap2.status}
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono text-xl font-bold tabular-nums ${
                      currentTahap2.status === 'Belum Cair'
                        ? 'text-[#B45309]'
                        : 'text-[#2E6496]'
                    }`}
                  >
                    {formatRupiah(currentTahap2.amount)}
                  </div>
                  <div className="w-full h-2 bg-[#FFFFFF] border border-[#C9DFDC] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        currentTahap2.status === 'Belum Cair'
                          ? 'bg-[#F59E0B]/30'
                          : 'bg-[#66A3BF]'
                      }`}
                      style={{
                        width:
                          currentTahap2.status === 'Belum Cair'
                            ? '0%'
                            : `${stage2SharePct}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-[#64748B]">
                    <span>Alokasi Semester Genap</span>
                    {currentTahap2.status === 'Belum Cair' ? (
                      <span className="font-bold text-[#B45309]">
                        Menunggu Penyaluran (0% Tersalurkan)
                      </span>
                    ) : (
                      <span className="font-bold text-[#66A3BF]">
                        {stage2SharePct}% Pagu (Sudah Cair)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KOMPOSISI PENGGUNAAN DANA (DONUT CHART) */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-8 shadow-xs animate-school-item"
              style={{ animationDelay: '180ms' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-[#C9DFDC]/60">
                <div>
                  <h2 className="font-sturdy-heading text-lg sm:text-xl font-bold text-[#1E293B]">
                    Komposisi Penggunaan Dana ({selectedYear})
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    Proporsi alokasi anggaran BOSP berdasarkan 3 komponen utama RKAS
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-mono font-semibold text-[#2E6496] tabular-nums">
                  3 Komponen RKAS
                </span>
              </div>

              <InteractiveDonutChart
                compositions={currentCompositions}
                totalAmount={currentTotalBosp}
              />
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: REDESIGN HASIL PEMBELANJAAN (SEDERHANA, HUMAN-FRIENDLY, BEBAS TABEL RUMIT)
           =================================================================== */}
        {activeTab === 'items-ai' && (
          <div className="mt-6 space-y-6">
            {/* PENCARIAN SEDERHANA */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-6 shadow-xs animate-school-item"
              style={{ animationDelay: '60ms' }}
            >
              <div className="mb-4">
                <h2 className="font-sturdy-heading text-lg sm:text-xl font-bold text-[#1E293B]">
                  Barang yang Disediakan Sekolah
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Cari tahu barang apa saja yang sudah dibeli dengan dana BOSP, berapa biayanya, dan di mana barang tersebut digunakan.
                </p>
              </div>

              {/* Kolom Pencarian + Tombol Cari */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteSearch();
                }}
                className="flex flex-col sm:flex-row items-stretch gap-2.5"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Ketik barang yang dicari: kipas angin, buku modul, proyektor, meja kursi, wifi..."
                    className="w-full pl-10 pr-9 py-3 text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium placeholder:text-[#94A3B8] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496] transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#1E293B] rounded-md cursor-pointer"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-sm font-bold shadow-xs active:translate-y-[1px] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-[#FFFFFF]" />
                      <span>Cari</span>
                    </>
                  )}
                </button>
              </form>

              {/* Pilihan Kata Kunci Cepat */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#475569] mr-1 font-medium">
                  Coba cari:
                </span>
                {QUICK_CHIPS.map((chip) => {
                  const isActive =
                    committedQuery.toLowerCase() === chip.toLowerCase();
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSelectQuickChip(chip)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                          : 'bg-[#FAF8F5] text-[#1E293B] border border-[#C9DFDC] hover:bg-[#EBF3F8] hover:border-[#66A3BF]'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              {/* Status Filter */}
              {committedQuery && (
                <div className="mt-4 pt-3 border-t border-[#C9DFDC]/60 flex items-center justify-between text-xs text-[#475569]">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>
                      Menampilkan hasil pencarian: <strong className="text-[#1E293B]">"{committedQuery}"</strong> ({searchResult.totalFound} barang cocok)
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

            {/* DAFTAR BARANG YANG SUDAH DIBELI (BERSIH & MUDAH DIBACA) */}
            <div className="space-y-3.5 animate-school-item" style={{ animationDelay: '130ms' }}>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono uppercase tracking-wider text-[#475569] font-bold">
                  Daftar Barang ({searchResult.results.length} Item)
                </span>
                <span className="text-xs text-[#64748B]">
                  Klik salah satu barang untuk melihat rincian &amp; fotonya
                </span>
              </div>

              {/* Kondisi Jika Tidak Ada Hasil */}
              {searchResult.results.length === 0 ? (
                <div className="p-8 sm:p-10 rounded-2xl bg-[#FFFFFF] border border-[#C9DFDC] text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1E293B]">
                      Barang Tidak Ditemukan
                    </h4>
                    <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto mt-1 leading-relaxed">
                      Barang dengan kata kunci <strong className="text-[#1E293B]">"{committedQuery}"</strong> tidak tercatat dalam pembelanjaan BOSP tahun {selectedYear}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="school-btn-secondary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Tampilkan Semua Barang ({currentItems.length})
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResult.results.map((res) => {
                    const item = res.item;
                    const isExpanded = expandedItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isExpanded
                            ? 'bg-[#FFFFFF] border-[#2E6496] shadow-sm ring-1 ring-[#2E6496]/20'
                            : 'bg-[#FFFFFF] border-[#C9DFDC] hover:border-[#66A3BF] hover:shadow-xs'
                        }`}
                      >
                        {/* Baris Utama Kartu Barang */}
                        <div
                          onClick={() => setExpandedItemId(isExpanded ? '' : item.id)}
                          className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-[#2E6496]">
                              {renderItemIcon(item.iconType)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-[#1E293B] leading-snug">
                                  {item.name}
                                </h3>
                                {committedQuery && renderMatchBadge(res)}
                              </div>

                              {/* Informasi Singkat & Bahasa Sehari-hari */}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#475569]">
                                <span className="inline-flex items-center gap-1 font-semibold text-[#1E293B]">
                                  <span>📦</span>
                                  <span>{item.unitSummary}</span>
                                </span>
                                <span className="text-[#CBD5E1]">•</span>
                                <span className="inline-flex items-center gap-1">
                                  <span>📅</span>
                                  <span>Dibeli {item.date}</span>
                                </span>
                                <span className="text-[#CBD5E1]">•</span>
                                <span className="inline-flex items-center gap-1 text-[#2E6496] font-medium">
                                  <span>📍</span>
                                  <span>{item.geotag.roomLabel.split('—')[0].trim()}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Harga & Tombol Buka */}
                          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#C9DFDC]/50 shrink-0">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] font-mono uppercase text-[#64748B] block font-semibold">
                                Total Biaya
                              </span>
                              <div className="font-mono text-base sm:text-lg font-extrabold text-[#2E6496] tabular-nums">
                                {formatRupiah(item.amount)}
                              </div>
                            </div>

                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                                isExpanded
                                  ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                                  : 'bg-[#FAF8F5] border-[#C9DFDC] text-[#475569]'
                              }`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rincian Tambahan (Hanya jika dibuka, bahasa santai, tanpa tabel rumit) */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 bg-[#FAF8F5] border-t border-[#C9DFDC]/60 space-y-4 text-xs sm:text-sm">
                            {/* 1. Untuk Apa Barang Ini Dibeli? */}
                            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC]">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E6496] block mb-1">
                                Tujuan Penggunaan:
                              </span>
                              <p className="text-[#1E293B] leading-relaxed">
                                {item.allocation}
                              </p>
                            </div>

                            {/* 2. Rincian Barang yang Diterima (List Bersih Sederhana) */}
                            {item.invoice.lineItems.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block">
                                  Rincian Barang yang Dibeli:
                                </span>
                                <div className="space-y-1.5">
                                  {item.invoice.lineItems.map((li, lIdx) => (
                                    <div
                                      key={lIdx}
                                      className="flex items-center justify-between py-1 border-b border-[#C9DFDC]/40 last:border-none gap-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E6496] shrink-0" />
                                        <span className="font-medium text-[#1E293B]">{li.name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#C9DFDC] text-[11px] text-[#475569] font-mono">
                                          {li.qty}
                                        </span>
                                      </div>
                                      <span className="font-mono font-bold text-[#2E6496] tabular-nums shrink-0">
                                        {formatRupiah(li.subtotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 3. Lokasi & Bukti Pemeriksaan Fisik */}
                            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] flex items-start gap-2.5">
                              <MapPin className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-[#1E293B] block">
                                  Lokasi Ruangan: {item.geotag.roomLabel}
                                </span>
                                <p className="text-[#475569] mt-0.5 italic">
                                  "{item.geotag.inspectorNote}"
                                </p>
                              </div>
                            </div>

                            {/* Tombol Aksi Simpel */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenInvoiceModal(item)}
                                  className="school-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2E6496] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#2E6496]" />
                                  <span>Lihat Foto Kwitansi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenGeotagModal(item)}
                                  className="school-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2E6496] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#2E6496]" />
                                  <span>Foto Ruang Kelas</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => onReportFromItem(item)}
                                className="px-3.5 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-xs font-bold text-[#DC2626] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
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
          <div className="mt-6 animate-school-item" style={{ animationDelay: '60ms' }}>
            <WaScannerWorkspace
              school={school}
              onReportFromWaScenario={onReportFromWaScenario}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* ===================================================================
            SECTION 8: AJAKAN PEMERIKSAAN DATA & LAPOR DI BAGIAN BAWAH
           =================================================================== */}
        <div
          className="mt-10 p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-school-item"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center text-[#2E6496] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                Menemukan data yang tidak sesuai? Laporkan kepada kami agar dapat diperiksa dan diperbaiki.
              </h3>
              <p className="text-xs text-[#475569] mt-0.5">
                Pengawasan publik BOSP melindungi hak pendidikan siswa. Pengaduan dijamin 100% anonim dan dienkripsi aman.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onOpenAnonymousReport ||
              (() => onReportFromItem(school.items[0]))
            }
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-xs active:translate-y-[1px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-[#C9DFDC]" />
            <span>Lapor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
