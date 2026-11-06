import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  FileCheck,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  Inbox,
  User,
  MapPin,
  Check,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import {
  AnonymousReportRecord,
  AdminReviewDocument,
  fetchAllAnonymousReportsFromSupabase,
  updateReportByDinas,
} from '../lib/supabase';
import { TRACKING_STAGES, getStageNumber } from './LiveTrackingPage';

interface DinasDashboardPageProps {
  onBackToHome: () => void;
  onOpenLiveTracking: (ticketCode: string) => void;
  onShowToast: (message: string) => void;
}

// Rekomendasi Jawaban Cepat Dinas Pendidikan (Bisa Langsung Ditekan)
interface ReplyTemplate {
  id: string;
  category: string;
  badge: string;
  stageTarget: string;
  verdictTarget?: 'TERBUKTI' | 'TIDAK_TERBUKTI';
  title: string;
  text: string;
}

const QUICK_REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'verif-spj',
    category: 'Telaah Bukti',
    badge: 'Verifikasi SPJ',
    stageTarget: 'VERIFIKASI_LAPORAN',
    title: 'Pencocokan Bukti dengan SPJ BOSP',
    text: 'Laporan pengaduan telah diverifikasi oleh tim dinas. Saat ini tim auditor inspektorat sedang mencocokkan bukti pungutan dengan SPJ belanja BOSP sekolah terlapor.',
  },
  {
    id: 'sidak-lapangan',
    category: 'Pemeriksaan',
    badge: 'Jadwal Sidak',
    stageTarget: 'PEMERIKSAAN_LAPANGAN',
    title: 'Sidak Klarifikasi Lapangan',
    text: 'Tim Pengawas Pembina Dinas Pendidikan bersama Inspektorat Daerah telah menjadwalkan pemeriksaan lapangan dan klarifikasi langsung bersama kepala sekolah dan komite sekolah terlapor.',
  },
  {
    id: 'klarifikasi-komite',
    category: 'Pemeriksaan',
    badge: 'Klarifikasi Komite',
    stageTarget: 'PEMERIKSAAN_LAPANGAN',
    title: 'Penelitian Berkas Komite',
    text: 'Dinas telah memanggil komite sekolah untuk meneliti berita acara musyawarah dan dokumen pembukuan sumbangan guna memastikan tidak adanya unsur paksaan terhadap wali murid.',
  },
  {
    id: 'terbukti-pungutan',
    category: 'Putusan Resmi',
    badge: 'Terbukti Melanggar',
    stageTarget: 'TINDAK_LANJUT_SELESAI',
    verdictTarget: 'TERBUKTI',
    title: 'Instruksi Pengembalian Dana 100%',
    text: 'Berdasarkan audit lapangan dan telaah SPJ, laporan dugaan pungutan terbukti melanggar Permendikbudristek No. 63/2022. Diterbitkan Berita Acara Pemeriksaan dengan instruksi pengembalian dana 100% selambat-lambatnya 7 hari kerja.',
  },
  {
    id: 'sesuai-ketentuan',
    category: 'Putusan Resmi',
    badge: 'Aman & Sesuai Juknis',
    stageTarget: 'TINDAK_LANJUT_SELESAI',
    verdictTarget: 'TIDAK_TERBUKTI',
    title: 'Laporan Sesuai & Ditutup',
    text: 'Pemeriksaan tuntas. Berdasarkan Berita Acara Klarifikasi komite, kegiatan tersebut merupakan sumbangan sukarela yang sah dan tidak mengikat sesuai Permendikbud No. 75/2016 tanpa penahanan hak belajar siswa. Laporan resmi ditutup.',
  },
  {
    id: 'minta-dokumen',
    category: 'Permintaan Data',
    badge: 'Minta Dokumen Tambahan',
    stageTarget: 'MENUNGGU_VERIFIKASI',
    title: 'Permintaan Bukti Tambahan',
    text: 'Laporan telah teregistrasi. Tim verifikator memerlukan tambahan bukti kuitansi atau rincian tanggal kejadian agar penelusuran lebih terarah. Mohon pelapor memantau status secara berkala.',
  },
];

export const DinasDashboardPage: React.FC<DinasDashboardPageProps> = ({
  onBackToHome,
  onOpenLiveTracking,
  onShowToast,
}) => {
  // State Data & Pemuatan
  const [reports, setReports] = useState<AnonymousReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'NEW' | 'PROCESS' | 'DONE'>('ALL');

  // State Laporan Terpilih
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // State Aksi Form Pengawas
  const [selectedStatus, setSelectedStatus] = useState<string>('LAPORAN_TERKIRIM');
  const [selectedVerdict, setSelectedVerdict] = useState<'TERBUKTI' | 'TIDAK_TERBUKTI'>('TERBUKTI');
  const [adminComment, setAdminComment] = useState<string>('');
  const [actorName, setActorName] = useState<string>('Tim Verifikator BOSP Dinas Pendidikan & Inspektorat');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Data Laporan saat Mount
  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllAnonymousReportsFromSupabase();
      setReports(data);
      if (data.length > 0 && !selectedReportId) {
        selectReport(data[0]);
      }
    } catch (err) {
      console.warn('[Dinas Dashboard] Gagal memuat laporan:', err);
      onShowToast('Gagal memuat data dari Supabase. Menampilkan salinan lokal.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReportsData();
    onShowToast('Data laporan dinas berhasil disegarkan.');
  };

  // Pilih laporan untuk ditampilkan di panel kanan
  const selectReport = (report: AnonymousReportRecord) => {
    setSelectedReportId(report.id);
    setSelectedStatus(report.status || 'LAPORAN_TERKIRIM');

    let parsedDoc: AdminReviewDocument | null = null;
    if (report.letter_document) {
      try {
        parsedDoc =
          typeof report.letter_document === 'string'
            ? JSON.parse(report.letter_document)
            : (report.letter_document as AdminReviewDocument);
      } catch {
        // ignore
      }
    }

    if (parsedDoc?.verdict_type) {
      setSelectedVerdict(parsedDoc.verdict_type);
    } else {
      const lastDigit = parseInt(report.ticket_code.replace(/\D/g, '').slice(-1) || '0', 10);
      setSelectedVerdict(lastDigit % 2 === 0 ? 'TERBUKTI' : 'TIDAK_TERBUKTI');
    }

    if (parsedDoc?.admin_notes) {
      setAdminComment(parsedDoc.admin_notes);
    } else {
      setAdminComment('');
    }

    if (parsedDoc?.verified_by) {
      setActorName(parsedDoc.verified_by);
    }
  };

  // Terapkan template jawaban yang ditekan
  const handleApplyTemplate = (tmpl: ReplyTemplate) => {
    setAdminComment(tmpl.text);
    setSelectedStatus(tmpl.stageTarget);
    if (tmpl.verdictTarget) {
      setSelectedVerdict(tmpl.verdictTarget);
    }
    onShowToast(`Rekomendasi balasan "${tmpl.badge}" diterapkan.`);
  };

  // Kirim pembaruan status dan tanggapan resmi
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const active = reports.find((r) => r.id === selectedReportId);
    if (!active) {
      onShowToast('Pilih laporan yang ingin diperbarui.');
      return;
    }

    if (!adminComment.trim()) {
      onShowToast('Ketik atau pilih rekomendasi catatan/tanggapan dinas terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await updateReportByDinas(
        active.ticket_code,
        selectedStatus,
        adminComment.trim(),
        actorName.trim() || 'Tim Verifikator BOSP Dinas Pendidikan',
        selectedStatus === 'TINDAK_LANJUT_SELESAI' ? selectedVerdict : undefined
      );

      if (ok) {
        onShowToast(`Status tiket ${active.ticket_code} berhasil diperbarui.`);
        // Perbarui state lokal agar langsung mencerminkan data baru
        setReports((prev) =>
          prev.map((item) =>
            item.ticket_code === active.ticket_code
              ? {
                  ...item,
                  status: selectedStatus,
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );
      } else {
        onShowToast('Tersimpan di penyimpanan lokal perangkat.');
      }
    } catch (err) {
      console.warn('[Submit Dinas Error]', err);
      onShowToast('Terjadi kendala saat menyimpan. Cek koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = (code: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
    setIsCopied(true);
    onShowToast(`Kode tiket ${code} disalin.`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filter Data
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 1. Text Search
      const query = searchQuery.toLowerCase().trim();
      const matchText =
        !query ||
        r.ticket_code.toLowerCase().includes(query) ||
        r.school_name.toLowerCase().includes(query) ||
        r.school_npsn.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        (r.notes || '').toLowerCase().includes(query);

      if (!matchText) return false;

      // 2. Tab Filter
      const step = getStageNumber(r.status);
      if (statusTab === 'NEW') return step === 1;
      if (statusTab === 'PROCESS') return step >= 2 && step <= 4;
      if (statusTab === 'DONE') return step === 5;
      return true;
    });
  }, [reports, searchQuery, statusTab]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    let total = reports.length;
    let initial = 0;
    let inProgress = 0;
    let completed = 0;

    reports.forEach((r) => {
      const step = getStageNumber(r.status);
      if (step === 1) initial++;
      else if (step >= 2 && step <= 4) inProgress++;
      else if (step === 5) completed++;
    });

    return { total, initial, inProgress, completed };
  }, [reports]);

  const activeReport = reports.find((r) => r.id === selectedReportId) || filteredReports[0] || null;

  // Parser attachments & document
  const parsedAttachments: { name: string; sizeFormatted: string }[] = useMemo(() => {
    if (!activeReport?.attachments_json) return [];
    try {
      return typeof activeReport.attachments_json === 'string'
        ? JSON.parse(activeReport.attachments_json)
        : (activeReport.attachments_json as { name: string; sizeFormatted: string }[]);
    } catch {
      return [];
    }
  }, [activeReport]);

  const parsedDocument: AdminReviewDocument | null = useMemo(() => {
    if (!activeReport?.letter_document) return null;
    try {
      return typeof activeReport.letter_document === 'string'
        ? JSON.parse(activeReport.letter_document)
        : (activeReport.letter_document as AdminReviewDocument);
    } catch {
      return null;
    }
  }, [activeReport]);

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-view-enter">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-7">
        {/* ===================================================================
            HEADER: PORTAL PENGAWAS DINAS PENDIDIKAN & INSPEKTORAT
           =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xs">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-[#2E6496] transition-all cursor-pointer shadow-2xs"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E6496] font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2E6496]" />
                  <span>Portal Pengawas & Auditor Resmi BOSP</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                  Terintegrasi Supabase Realtime
                </span>
              </div>
              <h1 className="font-sturdy-heading text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
                Manajemen Pengaduan & Tindak Lanjut BOSP
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#2E6496] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Ke Halaman Utama
            </button>
          </div>
        </div>

        {/* ===================================================================
            KARTU STATISTIK PENGAWASAN (EXECUTIVE METRICS)
           =================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[#64748B] block">Total Laporan Masuk</span>
            <div className="font-mono text-2xl font-extrabold text-[#1E293B] tabular-nums">{stats.total}</div>
            <span className="text-[10px] text-[#64748B]">Semua data tersimpan</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[#64748B] block">Menunggu Telaah Awal</span>
            <div className="font-mono text-2xl font-extrabold text-[#2E6496] tabular-nums">{stats.initial}</div>
            <span className="text-[10px] text-[#2E6496]">Tahap 1 Laporan Terkirim</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[#64748B] block">Dalam Audit & Sidak</span>
            <div className="font-mono text-2xl font-extrabold text-[#D97706] tabular-nums">{stats.inProgress}</div>
            <span className="text-[10px] text-[#D97706]">Tahap 2, 3, dan 4</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[#64748B] block">Putusan Selesai</span>
            <div className="font-mono text-2xl font-extrabold text-[#16A34A] tabular-nums">{stats.completed}</div>
            <span className="text-[10px] text-[#16A34A]">Tahap 5 Diterbitkan BAP</span>
          </div>
        </div>

        {/* ===================================================================
            LAYOUT UTAMA: DAFTAR LAPORAN (KIRI) + DETAIL & PANEL AKSI (KANAN)
           =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* -----------------------------------------------------------------
              KOLOM KIRI: DAFTAR LAPORAN & PENCARIAN (4 COLUMNS)
             ----------------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search Input & Filter Tabs */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#2E6496] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tiket, sekolah, NPSN, atau isi..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl text-[11px] font-semibold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusTab('ALL')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-center cursor-pointer transition-colors whitespace-nowrap ${
                    statusTab === 'ALL'
                      ? 'bg-[#FFFFFF] text-[#2E6496] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Semua ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('NEW')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-center cursor-pointer transition-colors whitespace-nowrap ${
                    statusTab === 'NEW'
                      ? 'bg-[#FFFFFF] text-[#2E6496] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Baru ({stats.initial})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('PROCESS')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-center cursor-pointer transition-colors whitespace-nowrap ${
                    statusTab === 'PROCESS'
                      ? 'bg-[#FFFFFF] text-[#D97706] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Audit ({stats.inProgress})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('DONE')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-center cursor-pointer transition-colors whitespace-nowrap ${
                    statusTab === 'DONE'
                      ? 'bg-[#FFFFFF] text-[#16A34A] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Selesai ({stats.completed})
                </button>
              </div>
            </div>

            {/* List Kartu Laporan */}
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="p-8 text-center bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl space-y-2">
                  <RefreshCw className="w-5 h-5 text-[#2E6496] animate-spin mx-auto" />
                  <p className="text-xs text-[#64748B]">Memuat data pengaduan masuk...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="p-8 text-center bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl space-y-2">
                  <Inbox className="w-6 h-6 text-[#94A3B8] mx-auto" />
                  <p className="text-xs font-semibold text-[#1E293B]">Tidak ada laporan ditemukan</p>
                  <p className="text-[11px] text-[#64748B]">Sesuaikan kata kunci atau filter status Anda.</p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isSelected = report.id === selectedReportId;
                  const stepNum = getStageNumber(report.status);
                  const stageObj = TRACKING_STAGES[stepNum - 1] || TRACKING_STAGES[0];

                  return (
                    <div
                      key={report.id}
                      onClick={() => selectReport(report)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#FFFFFF] border-[#2E6496] shadow-sm ring-2 ring-[#2E6496]/20'
                          : 'bg-[#FFFFFF] border-[#E4E0D8] hover:border-[#C9DFDC] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E4E0D8]/60">
                        <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md text-[11px]">
                          {report.ticket_code}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stepNum === 5
                              ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                              : stepNum >= 3
                              ? 'bg-[#FFF8E6] text-[#D97706] border border-[#FCE8B2]'
                              : 'bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC]'
                          }`}
                        >
                          Tahap {stepNum}: {stageObj.label}
                        </span>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div className="font-bold text-[#1E293B] text-xs sm:text-sm truncate">
                          {report.school_name}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                          <span className="truncate max-w-[180px]">{report.category}</span>
                          <span className="font-mono tabular-nums text-[10px]">
                            {report.created_at ? new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Hari ini'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] line-clamp-2 pt-1 leading-relaxed">
                          {report.notes || report.notes_encrypted || 'Tidak ada catatan tertulis.'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* -----------------------------------------------------------------
              KOLOM KANAN: DETAIL LENGKAP LAPORAN & PANEL AKSI PENGAWAS (7 COLUMNS)
             ----------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-5">
            {activeReport ? (
              <>
                {/* 1. KARTU DETAIL LENGKAP FORMULIR PELAPOR */}
                <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E0D8]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-[#2E6496] uppercase tracking-wider block">
                        DETAIL BERKAS PENGADUAN RESMI
                      </span>
                      <div className="flex items-center gap-2">
                        <h2 className="font-mono text-xl font-extrabold text-[#1E293B] tracking-tight">
                          {activeReport.ticket_code}
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleCopyTicket(activeReport.ticket_code)}
                          className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#E4E0D8] text-[#2E6496] cursor-pointer"
                          title="Salin Kode Tiket"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenLiveTracking(activeReport.ticket_code)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Pratinjau di Lacak Lapor</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-[#E4E0D8]">
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#64748B] block font-medium">Sekolah Terlapor:</span>
                      <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                        <span className="truncate">{activeReport.school_name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#64748B] block">NPSN: {activeReport.school_npsn}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-[#64748B] block font-medium">Kategori & Pelapor:</span>
                      <div className="font-bold text-[#1E293B] truncate">{activeReport.category}</div>
                      <span className="text-[11px] text-[#475569] block">
                        Peran: <strong>{activeReport.requester_role || 'Warga / Orang Tua'}</strong>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-[#64748B] block font-medium">Waktu Registrasi Masuk:</span>
                      <div className="font-mono text-[#1E293B] text-[11px] flex items-center gap-1.5 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-[#2E6496]" />
                        <span>
                          {activeReport.created_at
                            ? new Date(activeReport.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) + ' WIB'
                            : 'Waktu penerimaan awal'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-[#64748B] block font-medium">Protokol Keamanan:</span>
                      <span className="font-mono text-[10px] text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded block w-fit font-bold">
                        {activeReport.encryption_algorithm || 'AES-GCM-256 / PBKDF2 Anonim'}
                      </span>
                    </div>
                  </div>

                  {/* Isi Catatan / Kronologi Lengkap dari Form Pelapor */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2E6496]" />
                      <span>Isi Laporan / Kronologi Kejadian (Lengkap):</span>
                    </span>
                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs text-[#1E293B] leading-relaxed whitespace-pre-line max-h-44 overflow-y-auto">
                      {activeReport.notes || activeReport.notes_encrypted || 'Tidak ada uraian kronologi tambahan dari pelapor.'}
                    </div>
                  </div>

                  {/* Bukti Dokumen Terlampir */}
                  {parsedAttachments.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Dokumen Bukti Terlampir ({parsedAttachments.length}):</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {parsedAttachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E4E0D8] text-xs flex items-center gap-2"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span className="font-medium text-[#1E293B] truncate max-w-[200px]">{att.name}</span>
                            <span className="text-[11px] font-mono text-[#64748B]">({att.sizeFormatted})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PANEL FORM AKSI PENGAWAS (UBAH STATUS & TANGGAPAN RESMI) */}
                <form
                  onSubmit={handleFormSubmit}
                  className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-5"
                >
                  <div className="space-y-1 pb-3 border-b border-[#E4E0D8]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#2E6496]" />
                      <h3 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
                        Panel Verifikasi & Pembaruan Status Dinas
                      </h3>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Pilih 1 dari 5 tahapan pemeriksaan dan tentukan tanggapan resmi yang akan tersinkronisasi ke Lacak Lapor.
                    </p>
                  </div>

                  {/* Pilihan 5 Status Tahapan */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#1E293B] block">
                      Tentukan Tahapan Status Pemeriksaan (1 s.d. 5):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {TRACKING_STAGES.map((st) => {
                        const isChosen = selectedStatus === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setSelectedStatus(st.key)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isChosen
                                ? 'bg-[#2E6496] text-white border-[#2E6496] shadow-xs'
                                : 'bg-[#FAF8F5] text-[#1E293B] border-[#E4E0D8] hover:border-[#2E6496]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono text-[10px] font-bold ${isChosen ? 'text-white/80' : 'text-[#2E6496]'}`}>
                                Tahap {st.step}
                              </span>
                              {isChosen && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="font-bold text-xs mt-0.5">{st.label}</div>
                            <div className={`text-[10px] truncate mt-0.5 ${isChosen ? 'text-white/85' : 'text-[#64748B]'}`}>
                              {st.sublabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opsi Putusan Resmi Khusus Jika Tahap 5 Selesai Dipilih */}
                  {selectedStatus === 'TINDAK_LANJUT_SELESAI' && (
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-2.5 animate-view-enter">
                      <span className="text-xs font-bold text-[#1E293B] block">
                        Ragam Putusan Akhir Pemeriksaan BOSP:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVerdict('TERBUKTI')}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                            selectedVerdict === 'TERBUKTI'
                              ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] shadow-2xs font-bold'
                              : 'bg-white border-[#E4E0D8] text-[#475569] hover:border-[#DC2626]/50'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs">Terbukti Pelanggaran</div>
                            <div className="text-[10px] text-[#64748B] font-normal">
                              Instruksi Pengembalian Dana 100% (Merah di Lacak Lapor)
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedVerdict('TIDAK_TERBUKTI')}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                            selectedVerdict === 'TIDAK_TERBUKTI'
                              ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A] shadow-2xs font-bold'
                              : 'bg-white border-[#E4E0D8] text-[#475569] hover:border-[#16A34A]/50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs">Sesuai Ketentuan & Aman</div>
                            <div className="text-[10px] text-[#64748B] font-normal">
                              Sumbangan Sah Sesuai Prosedur (Hijau di Lacak Lapor)
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rekomendasi Jawaban Cepat (Pill Templates yang Bisa Langsung Ditekan) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2E6496]" />
                        <span>Rekomendasi Balasan Cepat (Klik untuk Pasang):</span>
                      </label>
                      <span className="text-[10px] text-[#64748B]">Dapat diedit kembali</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {QUICK_REPLY_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] hover:border-[#2E6496] text-xs font-semibold text-[#2E6496] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:translate-y-[1px]"
                          title={tmpl.text}
                        >
                          <span>{tmpl.badge}</span>
                          <ChevronRight className="w-3 h-3 text-[#2E6496]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea Tanggapan / Berita Acara Dinas */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1E293B] block">
                      Catatan Resmi & Balasan Verifikator Dinas:
                    </label>
                    <textarea
                      rows={4}
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Ketik catatan hasil audit atau klik salah satu rekomendasi jawaban di atas..."
                      className="w-full p-3.5 text-xs bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                    />
                  </div>

                  {/* Input Nama Petugas Pemeriksa */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#64748B] block">
                      Nama Aparatur / Verifikator yang Bertanggung Jawab:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#2E6496] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={actorName}
                        onChange={(e) => setActorName(e.target.value)}
                        placeholder="Contoh: Tim Verifikator BOSP Dinas Pendidikan & Inspektorat"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
                      />
                    </div>
                  </div>

                  {/* Tombol Simpan & Kirim */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyimpan ke Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Pembaruan Status & Tanggapan Resmi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Riwayat Timeline Log Audit Dokumen Sebelumnya */}
                {parsedDocument?.timeline && parsedDocument.timeline.length > 0 && (
                  <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-3">
                    <h4 className="font-sturdy-heading text-xs sm:text-sm font-bold text-[#1E293B]">
                      Riwayat Log Audit Sebelumnya ({parsedDocument.timeline.length})
                    </h4>
                    <div className="space-y-2">
                      {parsedDocument.timeline.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#2E6496]">{log.stage}</span>
                            <span className="text-[#64748B] font-mono tabular-nums">
                              {new Date(log.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                          <p className="text-[#1E293B]">{log.note}</p>
                          <span className="text-[10px] text-[#64748B] block">Pemeriksa: {log.actor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl space-y-2">
                <Inbox className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <h3 className="font-sturdy-heading text-sm font-bold text-[#1E293B]">Pilih Berkas Laporan</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Pilih salah satu laporan di daftar sebelah kiri untuk menelaah isi formulir dan memperbarui statusnya.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
