import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  CheckCircle2,
  BookOpen,
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
  Upload,
  EyeOff,
  RefreshCw,
  Scale,
  Wallet,
  ReceiptText,
  ScanLine,
  X,
  Building2,
  Camera,
} from 'lucide-react';
import {
  BospRealizationItem,
  SchoolData,
  WA_SCENARIOS,
  WaScenarioData,
  formatRupiah,
} from '../data/schoolsData';
import { InteractiveDonutChart } from './DonutChart';
import { WaScannerWorkspace } from './WaScannerWorkspace';

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
  onShowToast: (message: string) => void;
}

const QUICK_CHIPS = [
  'kipas angin',
  'cat kelas',
  'buku cerita',
  'proyektor',
  'kamar mandi',
];

/**
 * Smooth animation progress hook (0 -> 1) for count-up numbers and progress bars.
 * Respects `prefers-reduced-motion: reduce` and always finishes at exact 1.
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
  onOpenKamusModal,
  onOpenInvoiceModal,
  onOpenGeotagModal,
  onReportFromItem,
  onReportFromWaScenario,
  onShowToast,
}) => {
  // Tab 2 State: AI Similarity Search & Accordion
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string>(
    school.items[0]?.id || 'item-kipas-01'
  );

  // PDF Download simulation state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Animation progress for numbers & bars on school/tab change
  const animProgress = useAnimatedProgress(`${school.id}-${activeTab}`, 560);

  const maxItemAmount = useMemo(
    () => Math.max(...school.items.map((i) => i.amount), 1),
    [school.items]
  );

  // Render clean item icon with palette primary Navy accent
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

  // AI Similarity Matching Logic for Tab 2
  const { matchedItems, aiSimilarityMatch } = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    if (!q) {
      return {
        matchedItems: school.items,
        aiSimilarityMatch: school.items[0] || null,
      };
    }

    const matches = school.items.filter((item) => {
      const inName = item.name.toLowerCase().includes(q);
      const inCategory = item.category.toLowerCase().includes(q);
      const inAllocation = item.allocation.toLowerCase().includes(q);
      const inKeywords = item.keywords.some(
        (kw) => kw.includes(q) || q.includes(kw)
      );
      return inName || inCategory || inAllocation || inKeywords;
    });

    return {
      matchedItems: matches,
      aiSimilarityMatch: matches[0] || null,
    };
  }, [itemSearchQuery, school.items]);

  const handleSelectQuickChip = (chip: string) => {
    setItemSearchQuery(chip);
    const q = chip.toLowerCase();
    const firstMatch = school.items.find(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q) || q.includes(kw))
    );
    if (firstMatch) {
      setExpandedItemId(firstMatch.id);
    }
  };

  const handleShareSchool = async () => {
    const shareUrl = `${window.location.origin}/?npsn=${school.npsn}`;
    const shareText = `Ringkasan Transparansi BOSP ${school.name} (NPSN: ${school.npsn}) — Total Dana Cair: ${formatRupiah(
      school.totalBosp
    )}. Cek bukti nota & penggunaan di: ${shareUrl}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      // Fallback handled silently
    }
    onShowToast(
      'Tautan ringkasan transparansi berhasil disalin untuk dibagikan ke grup WA!'
    );
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      const reportContent = [
        '====================================================================',
        'LAPORAN RINGKAS TRANSPARANSI DANA BOSP TAHUN ANGGARAN 2026 (DARADIK)',
        '====================================================================',
        `Nama Sekolah   : ${school.name}`,
        `NPSN           : ${school.npsn}`,
        `Lokasi         : Kec. ${school.kecamatan}, ${school.kabupaten}, ${school.provinsi}`,
        `Status         : ${school.status}`,
        '--------------------------------------------------------------------',
        `Total BOSP Cair: ${formatRupiah(school.totalBosp)}`,
        `- Tahap 1      : ${formatRupiah(school.tahap1.amount)} (${school.tahap1.period} • ${school.tahap1.status})`,
        `- Tahap 2      : ${formatRupiah(school.tahap2.amount)} (${school.tahap2.period} • ${school.tahap2.status})`,
        `Estimasi Daerah: ~${formatRupiah(school.perStudentEstimate)} / siswa / tahun (${school.studentCount} siswa)`,
        '--------------------------------------------------------------------',
        'DAFTAR REALISASI BARANG & BUKTI FISIK TERVERIFIKASI:',
        ...school.items.map(
          (it, idx) =>
            `${idx + 1}. ${it.name} — ${formatRupiah(it.amount)} (${it.date}) | Nota: ${it.invoice.number} | GPS: ${it.geotag.lat}, ${it.geotag.lng}`
        ),
        '====================================================================',
        'Dicetak melalui Portal Publik DARADIK Transparansi BOSP & Anti-Pungli',
      ].join('\n');

      const blob = new Blob([reportContent], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ringkasan_BOSP_2026_${school.npsn}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDownloadingPdf(false);
      onShowToast(
        `Laporan ringkas BOSP ${school.name} (NPSN ${school.npsn}) berhasil diunduh.`
      );
    }, 500);
  };

  const stage1SharePct = Math.round(
    (school.tahap1.amount / Math.max(school.totalBosp, 1)) * 100
  );
  const stage2SharePct = Math.round(
    (school.tahap2.amount / Math.max(school.totalBosp, 1)) * 100
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
              <Download className="w-4 h-4 text-[#2E6496]" />
              <span>{isDownloadingPdf ? 'Menyiapkan...' : 'Unduh Ringkasan'}</span>
            </button>
          </div>
        </div>

        {/* SCHOOL PROFILE CARD — PHOTO FRAME ON LEFT, STRUCTURED SPECS TABLE ON RIGHT */}
        <section
          className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-7 shadow-xs animate-school-header"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-6">
            {/* FOTO FRAME SEKOLAH DI KIRI */}
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

            {/* TABEL INFORMASI DETAIL SEKOLAH DI KANAN */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#C9DFDC]/60">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-semibold text-[#2E6496]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>{school.status}</span>
                  </span>
                  <span className="text-xs font-mono text-[#475569] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#C9DFDC] tabular-nums">
                    TA 2026
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onOpenKamusModal}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496] hover:text-[#1E293B] hover:underline cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Panduan Juknis BOSP</span>
                </button>
              </div>

              {/* Tabel Bersih & Rapi dengan format Nama Sekolah : , dll */}
              <table className="w-full text-xs sm:text-sm text-[#1E293B] border-collapse">
                <tbody className="divide-y divide-[#C9DFDC]/40">
                  <tr>
                    <td className="py-2 pr-2 font-semibold text-[#475569] w-[130px] sm:w-[150px] whitespace-nowrap">
                      Nama Sekolah
                    </td>
                    <td className="py-2 px-1 font-bold text-[#64748B] w-[12px]">:</td>
                    <td className="py-2 pl-2 font-bold text-[#1E293B] text-sm sm:text-base">
                      {school.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      NPSN
                    </td>
                    <td className="py-2 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2 pl-2 font-mono font-semibold text-[#1E293B]">
                      {school.npsn}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      Alamat / Wilayah
                    </td>
                    <td className="py-2 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2 pl-2 text-[#1E293B]">
                      {school.address || `Kec. ${school.kecamatan}, ${school.kabupaten}, ${school.provinsi}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      Kepala Sekolah
                    </td>
                    <td className="py-2 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2 pl-2 text-[#1E293B]">
                      {school.items[0]?.invoice?.principalName || 'Drs. H. Bambang Sutrisno, M.Pd.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-semibold text-[#475569] whitespace-nowrap">
                      Jumlah Siswa
                    </td>
                    <td className="py-2 px-1 font-bold text-[#64748B]">:</td>
                    <td className="py-2 pl-2 font-mono text-[#1E293B] tabular-nums">
                      {school.studentCount} Siswa (Penerima Manfaat BOSP)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3 STANDALONE NAVIGATION TABS (DITARUH DI BAWAH KARTU PROFIL) */}
        <div
          className="mt-6 p-1.5 bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-1.5 shadow-xs"
          role="tablist"
          aria-label="Navigasi informasi dana sekolah"
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
            <Wallet className="w-4 h-4 shrink-0" />
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
            <span>Bukti Belanja</span>
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[11px] tabular-nums ${
                activeTab === 'items-ai'
                  ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]'
                  : 'bg-[#C9DFDC]/60 text-[#2E6496]'
              }`}
            >
              {school.items.length}
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

        {/* ===================================================================
            TAB 1: RINGKASAN DANA
           =================================================================== */}
        {activeTab === 'summary' && (
          <div className="mt-6 space-y-6">
            {/* 3 STAT CARDS WITH STAGGERED ENTRANCE & COUNT-UP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat Card 1: Total Dana BOSP */}
              <div
                className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-school-item"
                style={{ animationDelay: '60ms' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#475569]">
                      Total Pagu BOSP 2026
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC] font-mono text-[11px] font-semibold">
                      1 Tahun Penuh
                    </span>
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#2E6496] mt-2 tabular-nums tracking-tight">
                    {formatRupiah(Math.round(school.totalBosp * animProgress))}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#C9DFDC]/60 flex items-center justify-between gap-2 text-xs text-[#475569]">
                  <span>Indeks wilayah ({school.kabupaten})</span>
                  <span className="font-mono font-bold text-[#1E293B] tabular-nums">
                    ~{formatRupiah(school.perStudentEstimate)}/siswa
                  </span>
                </div>
              </div>

              {/* Stat Card 2: Pencairan Tahap 1 */}
              <div
                className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-school-item"
                style={{ animationDelay: '120ms' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#475569]">
                      Tahap 1 ({school.tahap1.period})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-mono font-semibold text-[#2E6496] border border-[#C9DFDC]">
                      <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
                      {school.tahap1.status}
                    </span>
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#1E293B] mt-2 tabular-nums">
                    {formatRupiah(
                      Math.round(school.tahap1.amount * animProgress)
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="w-full h-2 bg-[#FAF8F5] border border-[#C9DFDC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2E6496] rounded-full transition-[width] duration-150"
                      style={{ width: `${stage1SharePct * animProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#475569] tabular-nums">
                    <span>Cair: {school.tahap1.disbursedDate}</span>
                    <span className="font-semibold text-[#2E6496]">{stage1SharePct}% Pagu</span>
                  </div>
                </div>
              </div>

              {/* Stat Card 3: Pencairan Tahap 2 */}
              <div
                className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-school-item"
                style={{ animationDelay: '180ms' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#475569]">
                      Tahap 2 ({school.tahap2.period})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-mono font-semibold text-[#2E6496] border border-[#C9DFDC]">
                      <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
                      {school.tahap2.status}
                    </span>
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#1E293B] mt-2 tabular-nums">
                    {formatRupiah(
                      Math.round(school.tahap2.amount * animProgress)
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="w-full h-2 bg-[#FAF8F5] border border-[#C9DFDC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#66A3BF] rounded-full transition-[width] duration-150"
                      style={{ width: `${stage2SharePct * animProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#475569] tabular-nums">
                    <span>Cair: {school.tahap2.disbursedDate}</span>
                    <span className="font-semibold text-[#66A3BF]">{stage2SharePct}% Pagu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KOMPOSISI PENGGUNAAN DANA CARD */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-8 shadow-xs animate-school-item"
              style={{ animationDelay: '240ms' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-[#C9DFDC]/60">
                <div>
                  <h2 className="font-sturdy-heading text-lg sm:text-xl font-bold text-[#1E293B]">
                    Komposisi Penggunaan Dana
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
                compositions={school.compositions}
                totalAmount={school.totalBosp}
              />
            </div>

            {/* NEXT STEP BAR TO TAB 2 */}
            <div
              className="bg-[#FAF8F5] border border-[#C9DFDC] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-school-item"
              style={{ animationDelay: '300ms' }}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                  Ingin memeriksa barang apa saja yang sudah dibeli sekolah?
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Lihat daftar realisasi pengadaan lengkap dengan arsip nota SIPLah dan foto geotagging ruang kelas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('items-ai')}
                className="w-full sm:w-auto school-btn-primary px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer group"
              >
                <span>Cek Bukti Belanja ({school.items.length} Barang)</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: CEK BARANG & BUKTI FISIK
           =================================================================== */}
        {activeTab === 'items-ai' && (
          <div className="mt-6 space-y-6">
            {/* SEARCH & FILTER BAR */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs animate-school-item"
              style={{ animationDelay: '60ms' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label
                    htmlFor="ai-item-search"
                    className="block font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]"
                  >
                    Cari Barang atau Fasilitas Sekolah
                  </label>
                  <p className="text-xs sm:text-sm text-[#475569]">
                    Gunakan kata sehari-hari untuk mencocokkan barang dengan anggaran BOSP
                  </p>
                </div>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-semibold text-[#2E6496]">
                  <Sparkles className="w-3.5 h-3.5 text-[#2E6496]" />
                  <span>Pencarian Pintar</span>
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="ai-item-search"
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemSearchQuery(val);
                    const q = val.trim().toLowerCase();
                    if (q) {
                      const found = school.items.find(
                        (it) =>
                          it.name.toLowerCase().includes(q) ||
                          it.keywords.some(
                            (kw) => kw.includes(q) || q.includes(kw)
                          )
                      );
                      if (found) setExpandedItemId(found.id);
                    }
                  }}
                  placeholder="Ketik kata kunci: kipas, gerah, cat kelas, buku cerita, proyektor, toilet..."
                  className="w-full pl-10 pr-10 py-3 text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-medium placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496] transition-all"
                />
                {itemSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#1E293B] rounded-md cursor-pointer"
                    aria-label="Bersihkan pencarian barang"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filter Chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#475569] mr-1 font-medium">
                  Populer:
                </span>
                {QUICK_CHIPS.map((chip) => {
                  const isActive =
                    itemSearchQuery.toLowerCase() === chip.toLowerCase();
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        isActive
                          ? setItemSearchQuery('')
                          : handleSelectQuickChip(chip)
                      }
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

              {/* Contextual Match Notice when searching */}
              {itemSearchQuery.trim() && (
                <div className="mt-4 pt-3.5 border-t border-[#C9DFDC]/60">
                  {aiSimilarityMatch ? (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#1E293B]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2E6496] shrink-0" />
                        <span>
                          Cocok dengan anggaran{' '}
                          <strong className="text-[#2E6496]">
                            {aiSimilarityMatch.aiCategoryPath}
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#2E6496] tabular-nums">
                        {formatRupiah(aiSimilarityMatch.amount)}
                      </span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-2 text-xs text-[#92400E]">
                      <span>
                        Kata kunci "{itemSearchQuery}" tidak ditemukan pada realisasi tahun berjalan.
                      </span>
                      <button
                        type="button"
                        onClick={() => setItemSearchQuery('')}
                        className="font-semibold underline shrink-0 cursor-pointer"
                      >
                        Tampilkan Semua
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* REALIZED ITEMS LIST */}
            <div
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xs overflow-hidden animate-school-item"
              style={{ animationDelay: '130ms' }}
            >
              <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#C9DFDC] flex items-center justify-between">
                <h2 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                  Daftar Realisasi Barang &amp; Bukti Fisik
                </h2>
                <span className="text-xs font-mono text-[#475569] tabular-nums">
                  {matchedItems.length} dari {school.items.length} item
                </span>
              </div>

              {matchedItems.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-[#475569]">
                    Tidak ada item pembelian yang cocok dengan pencarian{' '}
                    <strong className="text-[#1E293B]">"{itemSearchQuery}"</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery('')}
                    className="mt-4 school-btn-primary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Tampilkan Semua Barang
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#C9DFDC]/50">
                  {matchedItems.map((item, idx) => {
                    const isExpanded = expandedItemId === item.id;
                    const barPct = Math.round(
                      (item.amount / maxItemAmount) * 100
                    );
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FFFFFF] animate-school-item"
                        style={{
                          animationDelay: `${Math.min(140 + idx * 45, 340)}ms`,
                        }}
                      >
                        {/* Item Row Header */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedItemId(isExpanded ? '' : item.id)
                          }
                          aria-expanded={isExpanded}
                          className={`w-full text-left px-6 py-4 flex items-center justify-between gap-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E6496] ${
                            isExpanded
                              ? 'bg-[#FAF8F5]'
                              : 'bg-[#FFFFFF] hover:bg-[#FAF8F5]/70'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0">
                              {renderItemIcon(item.iconType)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm sm:text-base font-bold text-[#1E293B] truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-[#475569] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                <span className="font-semibold text-[#1E293B]">
                                  {item.unitSummary}
                                </span>
                                <span className="text-[#94A3B8]">•</span>
                                <span className="font-mono tabular-nums">
                                  {item.date} ({item.stage})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-sm sm:text-base font-extrabold text-[#2E6496] tabular-nums">
                                {formatRupiah(item.amount)}
                              </div>
                              <div className="hidden sm:block w-24 h-1.5 bg-[#FAF8F5] border border-[#C9DFDC] rounded-full overflow-hidden mt-1 ml-auto">
                                <div
                                  className="h-full bg-[#2E6496] rounded-full transition-[width] duration-200"
                                  style={{ width: `${barPct * animProgress}%` }}
                                />
                              </div>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
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
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="school-expand-panel px-6 pb-5 pt-3 bg-[#FAF8F5] border-t border-[#C9DFDC]/60 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC]">
                                <span className="text-[11px] font-mono uppercase text-[#475569] block">
                                  Kategori RKAS
                                </span>
                                <span className="font-semibold text-[#1E293B] mt-0.5 block">
                                  {item.category}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC]">
                                <span className="text-[11px] font-mono uppercase text-[#475569] block">
                                  Kode &amp; Pencairan
                                </span>
                                <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block tabular-nums">
                                  {item.code} • {item.stage}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC]">
                                <span className="text-[11px] font-mono uppercase text-[#475569] block">
                                  Lokasi Peruntukan
                                </span>
                                <span className="font-medium text-[#1E293B] mt-0.5 block">
                                  {item.allocation}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenInvoiceModal(item)}
                                  className="school-btn-secondary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#2E6496] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-4 h-4 text-[#2E6496]" />
                                  <span>Lihat Bukti Nota</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenGeotagModal(item)}
                                  className="school-btn-secondary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#2E6496] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <MapPin className="w-4 h-4 text-[#2E6496]" />
                                  <span>Foto &amp; Geotag Kelas</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => onReportFromItem(item)}
                                className="px-4 py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-xs font-bold text-[#DC2626] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                                <span>Laporkan Kejanggalan</span>
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

            {/* NEXT STEP BAR TO TAB 3 */}
            <div
              className="bg-[#FAF8F5] border border-[#C9DFDC] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-school-item"
              style={{ animationDelay: '220ms' }}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                  Menerima pesan tarikan iuran di grup WhatsApp kelas?
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Cocokkan screenshot pengumuman iuran dengan data pencairan BOSP sekolah secara otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('wa-scanner')}
                className="w-full sm:w-auto school-btn-primary px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer group"
              >
                <span>Cek Screenshot Chat WA</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: VERIFIKASI IURAN GRUP WA (ADVANCED 6-STAGE OCR + VISION AI)
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
      </div>
    </div>
  );
};
