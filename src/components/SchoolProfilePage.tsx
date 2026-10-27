import React, { useState, useMemo, useRef } from 'react';
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
  Cpu,
  Upload,
  EyeOff,
  ArrowDown,
  Check,
  RefreshCw,
  Scale,
  RotateCcw,
} from 'lucide-react';
import {
  BospRealizationItem,
  SchoolData,
  WA_SCENARIOS,
  WaScenarioData,
  formatRupiah,
} from '../data/schoolsData';
import { InteractiveDonutChart } from './DonutChart';

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

  // Tab 3 State: WA Screenshot Scanner
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<
    'scenario-a' | 'scenario-b'
  >('scenario-a');
  const [customUploadedFileName, setCustomUploadedFileName] = useState<
    string | null
  >(null);
  const [isScanningWa, setIsScanningWa] = useState<boolean>(false);
  const [showUploadPicker, setShowUploadPicker] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF Download simulation state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Helper to render item icon without OS emojis
  const renderItemIcon = (type: BospRealizationItem['iconType']) => {
    switch (type) {
      case 'fan':
        return <Wind className="w-5 h-5 text-[#2E6496] shrink-0" />;
      case 'paint':
        return <Paintbrush className="w-5 h-5 text-[#2E6496] shrink-0" />;
      case 'book':
        return <BookMarked className="w-5 h-5 text-[#2E6496] shrink-0" />;
      case 'projector':
        return <Monitor className="w-5 h-5 text-[#2E6496] shrink-0" />;
      case 'sanitation':
        return <Droplets className="w-5 h-5 text-[#2E6496] shrink-0" />;
      case 'desk':
        return <Armchair className="w-5 h-5 text-[#2E6496] shrink-0" />;
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

  // Handle keyword chip or search typing
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

  // Share button handler
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

  // Download PDF simulation handler
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      // Create a clean text/summary report blob so the user actually gets a real file download too
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

  // Switch WA Scenario with brief AI scanning feedback
  const handleSelectScenario = (key: 'scenario-a' | 'scenario-b') => {
    setIsScanningWa(true);
    setCustomUploadedFileName(null);
    setShowUploadPicker(false);
    setTimeout(() => {
      setSelectedScenarioKey(key);
      setIsScanningWa(false);
    }, 320);
  };

  // Handle custom image upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningWa(true);
    setShowUploadPicker(false);
    setTimeout(() => {
      setCustomUploadedFileName(file.name);
      // If filename hints at outing/kas/kaos, show scenario-b, else scenario-a
      if (
        file.name.toLowerCase().includes('kas') ||
        file.name.toLowerCase().includes('pentas') ||
        file.name.toLowerCase().includes('outing')
      ) {
        setSelectedScenarioKey('scenario-b');
      } else {
        setSelectedScenarioKey('scenario-a');
      }
      setIsScanningWa(false);
    }, 400);
  };

  const activeScenario = WA_SCENARIOS[selectedScenarioKey];
  const displayedFileName = customUploadedFileName || activeScenario.fileName;

  return (
    <div className="w-full py-8 px-4 sm:px-6 animate-view-enter">
      {/* 1 CENTRAL COLUMN CONTAINER (max-w-[760px] per instructions) */}
      <div className="max-w-[760px] mx-auto">
        {/* TOP NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E0D8]">
          <button
            type="button"
            onClick={onBackToLanding}
            className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all duration-150 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Kembali ke Pencarian</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareSchool}
              className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all duration-150 flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-[#2E6496]" />
              <span>Bagikan</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all duration-150 flex items-center gap-1.5 disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-[#2E6496]" />
              <span>{isDownloadingPdf ? 'Menyiapkan...' : 'Unduh PDF'}</span>
            </button>
          </div>
        </div>

        {/* SCHOOL IDENTITY HEADER */}
        <div className="mt-5 bg-[#FFFFFF] border border-[#C8DFDC] rounded-lg p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EBF7EE] border border-[#2E7D32]/30 text-xs font-mono font-semibold text-[#2E7D32]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {school.status}
            </span>
            <span className="text-xs font-mono text-[#475569] tabular-nums">
              • Tahun Anggaran 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
            {school.name}
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm text-[#475569] font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono font-semibold text-[#1E293B] tabular-nums">
              NPSN: {school.npsn}
            </span>
            <span>•</span>
            <span>
              {school.kecamatan}, {school.kabupaten}, {school.provinsi}
            </span>
            <span>•</span>
            <span>Status: {school.status}</span>
          </p>

          {/* 3 SEGMENTED PILL CONTROL TABS */}
          <div
            className="mt-5 p-1 bg-[#F4F1EA] border border-[#E4E0D8] rounded-md grid grid-cols-1 sm:grid-cols-3 gap-1"
            role="tablist"
            aria-label="Navigasi Audit Transparansi Sekolah"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'summary'}
              onClick={() => onTabChange('summary')}
              className={`py-2.5 px-3 rounded-md text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'summary'
                  ? 'bg-[#2E6496] text-[#FFFFFF] shadow-sm'
                  : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
              }`}
            >
              <span className="font-mono text-xs tabular-nums">
                {activeTab === 'summary' ? '(●)' : '( )'} 1.
              </span>
              <span>Ringkasan Dana</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'items-ai'}
              onClick={() => onTabChange('items-ai')}
              className={`py-2.5 px-3 rounded-md text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'items-ai'
                  ? 'bg-[#2E6496] text-[#FFFFFF] shadow-sm'
                  : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
              }`}
            >
              <span className="font-mono text-xs tabular-nums">
                {activeTab === 'items-ai' ? '(●)' : '( )'} 2.
              </span>
              <span>Cek Barang (AI)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'wa-scanner'}
              onClick={() => onTabChange('wa-scanner')}
              className={`py-2.5 px-3 rounded-md text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'wa-scanner'
                  ? 'bg-[#2E6496] text-[#FFFFFF] shadow-sm'
                  : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
              }`}
            >
              <span className="font-mono text-xs tabular-nums">
                {activeTab === 'wa-scanner' ? '(●)' : '( )'} 3.
              </span>
              <span>Cek Chat WA</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            TAB 1: RINGKASAN DANA
           =================================================================== */}
        {activeTab === 'summary' && (
          <div className="mt-6 space-y-6 animate-view-enter">
            {/* CARD 1: DANA BOSP DITERIMA TAHUN INI */}
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
              <div className="px-6 py-3.5 bg-[#FAF8F5] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#1E293B]">
                  01 / DANA BOSP DITERIMA TAHUN INI
                </span>
                <span className="text-xs font-mono text-[#2E7D32] font-semibold">
                  Sinkronisasi RKAS & OM-SPAN Kemenkeu
                </span>
              </div>

              {/* 3-Column Hairline Grid inside Main Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E0D8]">
                {/* Col 1: Total Dana Masuk */}
                <div className="p-5 bg-[#FFFFFF]">
                  <span className="text-xs font-semibold text-[#475569] block">
                    Total Dana Masuk
                  </span>
                  <div className="font-mono text-2xl font-extrabold text-[#2E6496] mt-1.5 tabular-nums">
                    {formatRupiah(school.totalBosp)}
                  </div>
                  <span className="inline-block mt-2 text-[11px] font-mono text-[#475569]">
                    Pagu Reguler 1 Tahun Penuh
                  </span>
                </div>

                {/* Col 2: Tahap 1 */}
                <div className="p-5 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-[#475569]">
                      Tahap 1 ({school.tahap1.period} • Cair)
                    </span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#1E293B] mt-1.5 tabular-nums">
                    {formatRupiah(school.tahap1.amount)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF7EE] border border-[#2E7D32]/30 text-[11px] font-mono font-semibold text-[#2E7D32]">
                      <CheckCircle2 className="w-3 h-3" />
                      {school.tahap1.status}
                    </span>
                    <span className="text-[11px] font-mono text-[#475569] tabular-nums">
                      {school.tahap1.disbursedDate}
                    </span>
                  </div>
                </div>

                {/* Col 3: Tahap 2 */}
                <div className="p-5 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-[#475569]">
                      Tahap 2 ({school.tahap2.period} • Cair)
                    </span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#1E293B] mt-1.5 tabular-nums">
                    {formatRupiah(school.tahap2.amount)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF7EE] border border-[#2E7D32]/30 text-[11px] font-mono font-semibold text-[#2E7D32]">
                      <CheckCircle2 className="w-3 h-3" />
                      {school.tahap2.status}
                    </span>
                    <span className="text-[11px] font-mono text-[#475569] tabular-nums">
                      {school.tahap2.disbursedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: AI Regional Insight */}
              <div className="px-6 py-3.5 bg-[#C8DFDC]/50 flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-[#1E293B]">
                <Cpu className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="font-semibold text-[#2E6496]">
                    Estimasi AI Daerah:
                  </strong>{' '}
                  <span className="font-mono font-bold tabular-nums">
                    ~{formatRupiah(school.perStudentEstimate)} / siswa / tahun
                  </span>{' '}
                  <span className="text-[#475569]">
                    (Berdasarkan indeks wilayah {school.kabupaten} untuk ~
                    <span className="font-mono tabular-nums">
                      {school.studentCount}
                    </span>{' '}
                    siswa)
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: KOMPOSISI PENGGUNAAN DANA */}
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
              <div className="px-6 py-3.5 bg-[#FAF8F5] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#1E293B]">
                  02 / KOMPOSISI PENGGUNAAN DANA
                </span>
                <span className="text-xs font-mono text-[#475569] tabular-nums">
                  3 Komponen Utama RKAS
                </span>
              </div>

              <div className="p-6">
                <InteractiveDonutChart
                  compositions={school.compositions}
                  totalAmount={school.totalBosp}
                />

                {/* Secondary Button: Lihat Aturan Kamus Juknis BOSP */}
                <div className="mt-5 pt-4 border-t border-[#E4E0D8] flex justify-center">
                  <button
                    type="button"
                    onClick={onOpenKamusModal}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-[#FAF8F5] hover:bg-[#F4F1EA] border border-[#C8DFDC] text-xs sm:text-sm font-bold text-[#2E6496] active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lihat Aturan Kamus Juknis BOSP</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM TRANSITION BUTTON TO TAB 2 */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onTabChange('items-ai')}
                className="w-full py-3.5 px-6 rounded-md bg-[#2E6496] hover:bg-[#24507a] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <span>Lanjut Cek Pembelian Barang (AI)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: CEK BARANG (PENCARIAN PINTAR AI & ACCORDION)
           =================================================================== */}
        {activeTab === 'items-ai' && (
          <div className="mt-6 space-y-6 animate-view-enter">
            {/* AI SIMILARITY SEARCH BOX */}
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
              <div className="p-5">
                <label
                  htmlFor="ai-item-search"
                  className="block text-xs font-mono uppercase tracking-wider font-bold text-[#2E6496] mb-2"
                >
                  CARI BARANG ATAU FASILITAS SEKOLAH (AI SIMILARITY SEARCH)
                </label>

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
                    placeholder="Ketik bahasa sehari-hari: kipas, gerah, cat kelas, buku cerita, proyektor, toilet..."
                    className="w-full pl-10 pr-24 py-2.5 text-sm bg-[#FFFFFF] border border-[#E4E0D8] rounded-md text-[#1E293B] font-medium placeholder:text-[#475569]/70 focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
                  />
                  {itemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setItemSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-mono font-semibold text-[#475569] hover:text-[#1E293B] bg-[#FAF8F5] border border-[#E4E0D8] rounded-md"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>

                {/* Quick Keyword Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono text-[#475569] mr-1">
                    Kata kunci cepat:
                  </span>
                  {QUICK_CHIPS.map((chip) => {
                    const isActive =
                      itemSearchQuery.toLowerCase() === chip.toLowerCase();
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSelectQuickChip(chip)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                          isActive
                            ? 'bg-[#2E6496] text-[#FFFFFF] font-semibold'
                            : 'bg-[#FAF8F5] text-[#1E293B] border border-[#E4E0D8] hover:bg-[#C8DFDC]/40'
                        }`}
                      >
                        "{chip}"
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Similarity Mapping Insight Banner */}
              {aiSimilarityMatch ? (
                <div className="px-5 py-3.5 bg-[#C8DFDC]/45 flex items-start gap-2.5 text-xs sm:text-sm text-[#1E293B]">
                  <Cpu className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#2E6496]">
                      Hasil AI:
                    </strong>{' '}
                    Kata kunci cocok dengan pengajuan{' '}
                    <span className="font-semibold underline decoration-[#629BB5]">
                      "{aiSimilarityMatch.aiCategoryPath}"
                    </span>{' '}
                    (Total Anggaran:{' '}
                    <span className="font-mono font-bold text-[#1E293B] tabular-nums">
                      {formatRupiah(aiSimilarityMatch.amount)}
                    </span>
                    )
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3.5 bg-[#FFFBEB] flex items-center justify-between gap-2 text-xs text-[#D97706]">
                  <span>
                    Kata kunci "{itemSearchQuery}" tidak ditemukan dalam daftar realisasi BOSP tahun berjalan.
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery('')}
                    className="font-mono font-semibold underline shrink-0"
                  >
                    Tampilkan Semua (6 Barang)
                  </button>
                </div>
              )}
            </div>

            {/* ACCORDION LIST OF REALIZED ITEMS */}
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
              <div className="px-5 py-3.5 bg-[#FAF8F5] flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#1E293B]">
                  DAFTAR REALISASI BARANG (Klik baris untuk melihat bukti fisik)
                </h2>
                <span className="text-xs font-mono text-[#475569] tabular-nums">
                  {matchedItems.length} dari {school.items.length} Item
                </span>
              </div>

              {matchedItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#475569]">
                    Tidak ada item pembelian BOSP yang cocok dengan pencarian{' '}
                    <strong className="text-[#1E293B]">"{itemSearchQuery}"</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery('')}
                    className="mt-3 px-4 py-2 rounded-md bg-[#2E6496] text-[#FFFFFF] text-xs font-semibold"
                  >
                    Reset Pencarian Barang
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E4E0D8]">
                  {matchedItems.map((item) => {
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <div key={item.id} className="bg-[#FFFFFF]">
                        {/* Accordion Header Row */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedItemId(isExpanded ? '' : item.id)
                          }
                          aria-expanded={isExpanded}
                          className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 transition-colors ${
                            isExpanded
                              ? 'bg-[#FAF8F5]'
                              : 'bg-[#FFFFFF] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {renderItemIcon(item.iconType)}
                            <div className="min-w-0">
                              <div className="text-sm sm:text-base font-bold text-[#1E293B] truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-[#475569] font-mono mt-0.5 tabular-nums">
                                Kode {item.code} • {item.date} ({item.stage})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-sm sm:text-base font-extrabold text-[#2E6496] tabular-nums">
                              {formatRupiah(item.amount)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[#2E6496]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[#475569]" />
                            )}
                          </div>
                        </button>

                        {/* Accordion Expanded Details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 bg-[#FAF8F5] border-t border-[#E4E0D8] space-y-4 animate-view-enter">
                            {/* Metadata Specifications */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                              <div>
                                <span className="text-xs font-mono uppercase text-[#475569] block">
                                  Kategori Anggaran
                                </span>
                                <span className="font-semibold text-[#1E293B]">
                                  {item.category}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-mono uppercase text-[#475569] block">
                                  Tanggal Realisasi
                                </span>
                                <span className="font-mono font-semibold text-[#1E293B] tabular-nums">
                                  {item.date} (Dana BOSP {item.stage})
                                </span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-xs font-mono uppercase text-[#475569] block">
                                  Peruntukan Fisik di Sekolah
                                </span>
                                <span className="font-medium text-[#1E293B]">
                                  {item.allocation}
                                </span>
                              </div>
                            </div>

                            {/* 2 Physical Proof Modal Trigger Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => onOpenInvoiceModal(item)}
                                className="py-2.5 px-4 rounded-md bg-[#FFFFFF] hover:bg-[#C8DFDC]/35 border border-[#2E6496] text-xs sm:text-sm font-bold text-[#2E6496] active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                <span>Lihat Foto Nota</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenGeotagModal(item)}
                                className="py-2.5 px-4 rounded-md bg-[#FFFFFF] hover:bg-[#C8DFDC]/35 border border-[#2E6496] text-xs sm:text-sm font-bold text-[#2E6496] active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>Lihat Foto & Geotagging Kelas</span>
                              </button>
                            </div>

                            {/* Quick Report Row at Bottom of Accordion */}
                            <div className="pt-3 border-t border-[#E4E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <span className="text-xs sm:text-sm font-medium text-[#475569]">
                                Ada kejanggalan fisik di kelas atau diminta iuran lagi untuk barang ini?
                              </span>
                              <button
                                type="button"
                                onClick={() => onReportFromItem(item)}
                                className="px-3.5 py-2 rounded-md bg-[#FDF2F2] hover:bg-[#f9e1e1] border border-[#F5C6CB] text-xs font-bold text-[#D9534F] active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-1.5 shrink-0"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                <span>Laporkan Barang Ini</span>
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

            {/* Bottom Navigation to Tab 3 */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => onTabChange('wa-scanner')}
                className="w-full py-3.5 px-6 rounded-md bg-[#2E6496] hover:bg-[#24507a] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <span>Lanjut Verifikasi Screenshot Chat Grup WA (AI)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: DETEKSI PUNGLI DARI SCREENSHOT WA (ALUR BERTAHAP 1 KOLOM)
           =================================================================== */}
        {activeTab === 'wa-scanner' && (
          <div className="mt-6 space-y-4 animate-view-enter">
            {/* STEP 1 CARD: UPLOAD & SIMULATION SELECTOR */}
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
              {/* Card Header */}
              <div className="p-5 bg-[#FAF8F5]">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-[#2E6496]">
                  <Cpu className="w-4 h-4" />
                  <span>TAHAP 01 // OCR & DETEKSI SILANG ANGGARAN BOSP</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#1E293B] mt-1">
                  Verifikasi Iuran Grup WhatsApp (AI)
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5 max-w-[65ch]">
                  Unggah screenshot pengumuman iuran dari grup WhatsApp kelas/paguyuban untuk dicocokkan otomatis dengan data anggaran BOSP sekolah.
                </p>
              </div>

              {/* Quick Simulation Scenario Buttons */}
              <div className="p-5 bg-[#FFFFFF] space-y-3">
                <div className="text-xs font-mono uppercase text-[#475569] font-semibold">
                  Pilih Skenario Uji Cepat (1-Klik Simulasi AI) atau Unggah File:
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectScenario('scenario-a')}
                    className={`w-full text-left p-3.5 rounded-md border transition-all duration-150 flex items-center justify-between gap-3 ${
                      selectedScenarioKey === 'scenario-a' &&
                      !customUploadedFileName
                        ? 'bg-[#FDF2F2] border-[#D9534F] text-[#1E293B]'
                        : 'bg-[#FAF8F5] border-[#E4E0D8] text-[#475569] hover:text-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          selectedScenarioKey === 'scenario-a'
                            ? 'bg-[#D9534F]'
                            : 'bg-[#475569]/40'
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-bold">
                        {WA_SCENARIOS['scenario-a'].buttonLabel}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] shrink-0">
                      Skenario A
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectScenario('scenario-b')}
                    className={`w-full text-left p-3.5 rounded-md border transition-all duration-150 flex items-center justify-between gap-3 ${
                      selectedScenarioKey === 'scenario-b' &&
                      !customUploadedFileName
                        ? 'bg-[#EBF7EE] border-[#2E7D32] text-[#1E293B]'
                        : 'bg-[#FAF8F5] border-[#E4E0D8] text-[#475569] hover:text-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          selectedScenarioKey === 'scenario-b'
                            ? 'bg-[#2E7D32]'
                            : 'bg-[#475569]/40'
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-bold">
                        {WA_SCENARIOS['scenario-b'].buttonLabel}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] shrink-0">
                      Skenario B
                    </span>
                  </button>
                </div>

                {/* Hidden File Input for Custom Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Status & Automatic Redaction Notice */}
                <div className="mt-4 p-4 rounded-md bg-[#FAF8F5] border border-[#C8DFDC] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2E7D32]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="font-mono">{displayedFileName}</span>
                      <span>berhasil dibaca</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUploadPicker((prev) => !prev)}
                      className="px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs font-semibold text-[#2E6496] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ganti Gambar Lain</span>
                    </button>
                  </div>

                  {showUploadPicker && (
                    <div className="p-3.5 rounded-md bg-[#FFFFFF] border border-dashed border-[#2E6496] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-[#475569]">
                        Pilih file screenshot dari perangkat Anda (JPG/PNG) atau ganti simulasi:
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-md bg-[#2E6496] text-[#FFFFFF] text-xs font-semibold"
                        >
                          Pilih File Gambar...
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectScenario(
                              selectedScenarioKey === 'scenario-a'
                                ? 'scenario-b'
                                : 'scenario-a'
                            )
                          }
                          className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E4E0D8] text-xs font-semibold text-[#1E293B]"
                        >
                          Tukar Skenario Simulasi
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-[#1E293B] bg-[#C8DFDC]/40 px-3 py-2 rounded-md">
                    <EyeOff className="w-4 h-4 text-[#2E6496] shrink-0" />
                    <span>
                      <strong>Privasi Aman:</strong> Nomor HP & nama pengirim pada gambar disensor otomatis oleh sistem sebelum dianalisis.
                    </span>
                  </div>

                  {/* Visual Redacted WhatsApp Screenshot Preview (Solid Redaction Bars, ZERO CSS blur) */}
                  <div className="border border-[#E4E0D8] rounded-md bg-[#F4F1EA] p-3.5">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E4E0D8] text-[11px] font-mono text-[#475569]">
                      <span>GRUP WA: {activeScenario.groupName}</span>
                      <span className="text-[#2E7D32] font-semibold">
                        [IDENTITAS PENGIRIM DISENSOR]
                      </span>
                    </div>
                    <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-md p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded-sm bg-[#1E293B] text-[#FAF8F5] font-mono text-[10px] tracking-widest select-none">
                            ████████████
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-sm bg-[#475569] text-[#FAF8F5] font-mono text-[10px] select-none">
                            +62 812-████-████
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#475569] tabular-nums">
                          {activeScenario.timestamp}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                        "{activeScenario.ocrQuote}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VERTICAL FLOW ARROW (↓) WITH AI ANALYSIS STATUS */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#F4F1EA] border border-[#C8DFDC] text-xs font-mono font-semibold text-[#2E6496]">
                {isScanningWa ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencocokkan teks OCR dengan RKAS BOSP 2026...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-[#2E6496]" />
                    <span>HASIL PENCOCOKAN SILANG AI DENGAN DATA BOSP SEKOLAH</span>
                  </>
                )}
              </div>
            </div>

            {/* STEP 2 CARD: AI CONCLUSION CARD (DYNAMIC BY SCENARIO) */}
            {activeScenario.statusType === 'danger' ? (
              /* SCENARIO A: OVERLAP WITH BOSP DETECTED */
              <div className="bg-[#FDF2F2] border-2 border-[#F5C6CB] rounded-lg shadow-sm overflow-hidden divide-y divide-[#F5C6CB] animate-view-enter">
                <div className="px-6 py-4 bg-[#FDF2F2] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-[#D9534F]">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                      {activeScenario.statusHeader}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#F5C6CB] text-[#D9534F]">
                    TUMPANG TINDIH ANGGARAN
                  </span>
                </div>

                <div className="p-6 bg-[#FFFFFF] space-y-4">
                  <div>
                    <span className="text-xs font-mono uppercase text-[#475569] font-semibold block">
                      Isi Pesan Grup WA (Hasil OCR AI):
                    </span>
                    <blockquote className="mt-1 p-3.5 rounded-md bg-[#FAF8F5] border-l-4 border-[#D9534F] text-sm text-[#1E293B] italic">
                      "{activeScenario.ocrQuote}"
                    </blockquote>
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase text-[#D9534F] font-bold block">
                      Fakta Data BOSP Sekolah ({school.name}):
                    </span>
                    <div className="mt-1 p-4 rounded-md bg-[#FDF2F2] border border-[#F5C6CB] text-sm text-[#1E293B] leading-relaxed">
                      Sekolah <strong>SUDAH menganggarkan dan mencairkan</strong>{' '}
                      <span className="font-mono font-extrabold text-[#D9534F] tabular-nums">
                        Rp 35.000.000
                      </span>{' '}
                      pada BOSP Tahap 2 (12 Oktober 2026) untuk pembelian{' '}
                      <strong>Kipas Angin Dinding (Pemasangan Kelas 1–3)</strong>.
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onReportFromWaScenario(activeScenario)}
                      className="w-full py-3.5 px-6 rounded-md bg-[#D9534F] hover:bg-[#c5423e] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Kirim Laporan Anonim Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SCENARIO B: ITEM NOT IN BOSP RKAS */
              <div className="bg-[#EBF7EE] border-2 border-[#C8DFDC] rounded-lg shadow-sm overflow-hidden divide-y divide-[#C8DFDC] animate-view-enter">
                <div className="px-6 py-4 bg-[#EBF7EE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-[#2E7D32]">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                      {activeScenario.statusHeader}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#C8DFDC] text-[#2E7D32]">
                    NON-RKAS BOSP
                  </span>
                </div>

                <div className="p-6 bg-[#FFFFFF] space-y-4">
                  <div>
                    <span className="text-xs font-mono uppercase text-[#475569] font-semibold block">
                      Isi Pesan Grup WA (Hasil OCR AI):
                    </span>
                    <blockquote className="mt-1 p-3.5 rounded-md bg-[#FAF8F5] border-l-4 border-[#629BB5] text-sm text-[#1E293B] italic">
                      "{activeScenario.ocrQuote}"
                    </blockquote>
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase text-[#2E7D32] font-bold block">
                      Fakta Data BOSP Sekolah ({school.name}):
                    </span>
                    <div className="mt-1 p-3.5 rounded-md bg-[#EBF7EE] border border-[#2E7D32]/25 text-sm text-[#1E293B]">
                      {activeScenario.bospFact}
                    </div>
                  </div>

                  {/* Legal Reminder Note */}
                  <div className="p-4 rounded-md bg-[#FFFBEB] border border-[#D97706]/35 flex items-start gap-3">
                    <Scale className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                      <strong>Pengingat Penting:</strong> Sesuai Permendikbud, Sekolah Negeri dilarang melakukan pungutan wajib yang mengikat siswa. Jika iuran ini bersifat memaksa, Anda tetap berhak melaporkannya.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onReportFromWaScenario(activeScenario)}
                      className="w-full py-3 px-5 rounded-md bg-[#2E6496] hover:bg-[#24507a] text-[#FFFFFF] font-bold text-sm shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2"
                    >
                      <span>Tetap Laporkan Pungutan Ini</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
