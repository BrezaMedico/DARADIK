import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Search,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Lock,
  RotateCcw,
  AlertCircle,
  History,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SchoolData, SMK_TI_BAZMA } from '../data/schoolsData';
import { getSavedReportsFromStorage } from '../lib/supabase';

interface ChatMessage {
  id: string;
  sender: 'dinas' | 'reporter';
  senderLabel: string;
  timestamp: string;
  text: string;
}

export interface TrackedReportItem {
  ticketCode: string;
  schoolName: string;
  schoolNpsn?: string;
  category: string;
  date: string;
  status: string;
  notes?: string;
}

interface LiveTrackingPageProps {
  ticketCode?: string;
  school?: SchoolData;
  reportCategory?: string;
  reporterNote?: string;
  onBackToHome: () => void;
  onBackToSchoolProfile: () => void;
  onOpenAnonymousReport?: () => void;
  onShowToast: (message: string) => void;
}

// Cookie Helper Functions
const TRACKED_COOKIE_KEY = 'daradik_tracked_tickets';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 60) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getStoredTrackedHistory(): TrackedReportItem[] {
  try {
    const fromCookie = getCookie(TRACKED_COOKIE_KEY);
    const fromStorage =
      typeof localStorage !== 'undefined' ? localStorage.getItem(TRACKED_COOKIE_KEY) : null;
    const raw = fromCookie || fromStorage;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

function saveTrackedItemToHistory(item: TrackedReportItem) {
  try {
    const existing = getStoredTrackedHistory();
    const filtered = existing.filter((i) => i.ticketCode !== item.ticketCode);
    const updated = [item, ...filtered].slice(0, 8); // Simpan maks 8 riwayat terbaru
    const str = JSON.stringify(updated);
    setCookie(TRACKED_COOKIE_KEY, str, 60);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TRACKED_COOKIE_KEY, str);
    }
  } catch (err) {
    console.warn('[Tracking History] Gagal menyimpan cookie riwayat:', err);
  }
}

export const LiveTrackingPage: React.FC<LiveTrackingPageProps> = ({
  ticketCode = '',
  school = SMK_TI_BAZMA,
  reportCategory = 'Pungutan Seragam & Buku',
  reporterNote = '',
  onBackToHome,
  onBackToSchoolProfile,
  onOpenAnonymousReport,
  onShowToast,
}) => {
  // 1. State: Default KOSONG bila tidak ada kode dari props pelaporan
  const [ticketInput, setTicketInput] = useState<string>(ticketCode || '');
  const [activeTicket, setActiveTicket] = useState<string>(ticketCode || '');
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState<boolean>(false);

  // 2. State: Riwayat Tiket dari Cookie / LocalStorage
  const [historyList, setHistoryList] = useState<TrackedReportItem[]>([]);

  // 3. State Simulasi Status Selesai
  const [isSimulatedComplete, setIsSimulatedComplete] = useState<boolean>(false);

  // 4. State Objek Laporan yang Sedang Dilacak
  const [currentReportData, setCurrentReportData] = useState<TrackedReportItem | null>(null);

  // 5. State Chat 2 Arah
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState<string>('');
  const [replyError, setReplyError] = useState<string | null>(null);

  // Load Riwayat dari Cookie & Database Lokal saat Mount
  useEffect(() => {
    const cookieHistory = getStoredTrackedHistory();
    const savedReports = getSavedReportsFromStorage();

    // Gabungkan laporan yang tersimpan di perangkat ini
    const mergedMap = new Map<string, TrackedReportItem>();

    // Dari saved reports lokal
    savedReports.forEach((r: Record<string, unknown>) => {
      const code = String(r.ticket_code || '');
      if (code) {
        mergedMap.set(code, {
          ticketCode: code,
          schoolName: String(r.school_name || 'Sekolah Terpilih'),
          schoolNpsn: String(r.school_npsn || ''),
          category: String(r.category || 'Pungutan Sekolah'),
          date: r.created_at
            ? new Date(String(r.created_at)).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Baru saja',
          status: String(r.status || 'DITINDAKLANJUTI'),
          notes: String(r.notes || ''),
        });
      }
    });

    // Dari cookie history
    cookieHistory.forEach((item) => {
      if (!mergedMap.has(item.ticketCode)) {
        mergedMap.set(item.ticketCode, item);
      }
    });

    const list = Array.from(mergedMap.values());
    setHistoryList(list);

    // Jika ada ticketCode aktif dari prop, tampilkan; jika kosong, reset ke tampilan bersih
    if (ticketCode) {
      setTicketInput(ticketCode);
      setActiveTicket(ticketCode);
      handleResolveActiveTicket(ticketCode, list);
    } else {
      setTicketInput('');
      setActiveTicket('');
      setCurrentReportData(null);
    }
  }, [ticketCode]);

  // Resolusi data saat activeTicket berubah
  const handleResolveActiveTicket = (code: string, availableList?: TrackedReportItem[]) => {
    const currentList = availableList || historyList;
    const found = currentList.find((i) => i.ticketCode.toUpperCase() === code.toUpperCase());

    if (found) {
      setCurrentReportData(found);
      initChatMessages(found.notes || reporterNote);
    } else {
      // Fallback data terstruktur jika dilacak dari luar
      const fallbackItem: TrackedReportItem = {
        ticketCode: code,
        schoolName: school.name || 'SMK TI BAZMA',
        schoolNpsn: school.npsn || '69992384',
        category: reportCategory || 'Dugaan Pungutan',
        date: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        status: 'DITINDAKLANJUTI',
        notes: reporterNote,
      };
      setCurrentReportData(fallbackItem);
      initChatMessages(reporterNote);
      saveTrackedItemToHistory(fallbackItem);
    }
  };

  const initChatMessages = (initialNote?: string) => {
    const msgs: ChatMessage[] = [
      {
        id: 'msg-dinas-1',
        sender: 'dinas',
        senderLabel: 'Tim Verifikator Inspektorat',
        timestamp: 'Hari ini, 10:35 WIB',
        text: 'Laporan Anda telah kami telaah bersama Berita Acara Pemeriksaan BOSP. Tim auditor sedang meminta klarifikasi kepada pihak sekolah.',
      },
    ];

    if (initialNote && initialNote.trim()) {
      msgs.unshift({
        id: 'msg-initial-note',
        sender: 'reporter',
        senderLabel: 'Catatan Pelapor',
        timestamp: 'Waktu Pengiriman',
        text: initialNote.trim(),
      });
    }

    setMessages(msgs);
  };

  // Submit Pencarian Tiket
  const handleCheckTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = ticketInput.trim().toUpperCase();

    if (!cleaned) {
      setTicketError('Ketik kode tiket pelacakan Anda.');
      return;
    }

    if (!cleaned.startsWith('CHK-') && cleaned.length < 8) {
      setTicketError('Format tiket tidak sesuai. Contoh resmi: CHK-2026-8849-BGR');
      return;
    }

    setTicketError(null);
    setActiveTicket(cleaned);
    handleResolveActiveTicket(cleaned);
    onShowToast(`Memuat status pelaporan untuk kode ${cleaned}`);
  };

  // Pilih Tiket dari Riwayat
  const handleSelectFromHistory = (item: TrackedReportItem) => {
    setTicketInput(item.ticketCode);
    setActiveTicket(item.ticketCode);
    setTicketError(null);
    setCurrentReportData(item);
    initChatMessages(item.notes);
    onShowToast(`Melacak tiket ${item.ticketCode}`);
  };

  // Hapus Riwayat Cookie
  const handleClearHistory = () => {
    setHistoryList([]);
    setCookie(TRACKED_COOKIE_KEY, '', -1);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TRACKED_COOKIE_KEY);
      localStorage.removeItem('daradik_saved_reports');
    }
    onShowToast('Riwayat pelacakan di perangkat ini telah dihapus.');
  };

  // Salin Kode Tiket
  const handleCopyTicket = async () => {
    if (!activeTicket) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeTicket);
      }
    } catch {
      // fallback
    }
    setCopiedTicket(true);
    onShowToast(`Kode tiket ${activeTicket} disalin ke clipboard.`);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // Kirim Balasan Chat Anonim
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyInput.trim();
    if (!trimmed) {
      setReplyError('Tuliskan pesan balasan terlebih dahulu.');
      return;
    }
    setReplyError(null);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'reporter',
      senderLabel: 'Anda (Anonim)',
      timestamp: `Hari ini, ${hours}:${mins} WIB`,
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyInput('');
  };

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-view-enter">
      {/* Container Konsisten Max-W-3XL (Sama seperti Halaman Lapor) */}
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        {/* 1. Navigasi Atas */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:translate-y-[1px]"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Kembali ke Beranda</span>
          </button>

          {activeTicket && (
            <button
              type="button"
              onClick={() => {
                setActiveTicket('');
                setTicketInput('');
                setCurrentReportData(null);
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#E4E0D8] text-xs font-semibold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
            >
              Lacak Tiket Lain
            </button>
          )}
        </div>

        {/* 2. Form Pencarian Tiket (Selalu Rapi & Sederhana di Atas) */}
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496]">
              STATUS PELAPORAN ANONIM
            </span>
            <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              Lacak Progres Laporan
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Masukkan kode tiket untuk memantau proses tindak lanjut Inspektorat dan Dinas Pendidikan.
            </p>
          </div>

          <form onSubmit={handleCheckTicket} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => {
                    setTicketInput(e.target.value);
                    setTicketError(null);
                  }}
                  placeholder="Contoh: CHK-2026-8849-BGR"
                  className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm font-mono font-bold bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] uppercase placeholder:text-[#94A3B8] placeholder:font-normal placeholder:capitalize focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-2xs active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Cek Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {ticketError && (
              <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F5C6CB] text-[#C24136] text-xs font-medium flex items-center gap-2 animate-view-enter">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                <span>{ticketError}</span>
              </div>
            )}
          </form>
        </div>

        {/* ===================================================================
            KONDISI A: DEFAULT KOSONG (Belum Ada Tiket yang Dicari)
            Tampilkan Riwayat Cookie Perangkat / State Bersih
           =================================================================== */}
        {!activeTicket ? (
          <div className="space-y-4 animate-view-enter">
            {historyList.length > 0 ? (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#2E6496]" />
                    <h2 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                      Riwayat Laporan di Perangkat Ini
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-[#64748B] hover:text-[#DC2626] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Hapus Riwayat Cookie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {historyList.map((item) => (
                    <div
                      key={item.ticketCode}
                      className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] hover:border-[#2E6496]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md">
                            {item.ticketCode}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#2E7D32]">
                            {item.status || 'DITINDAKLANJUTI'}
                          </span>
                          <span className="text-[#64748B] text-[11px]">• {item.date}</span>
                        </div>
                        <div className="font-bold text-[#1E293B] text-xs sm:text-sm">
                          {item.schoolName}
                        </div>
                        <div className="text-[11px] text-[#475569]">{item.category}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectFromHistory(item)}
                        className="px-4 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#2E6496] hover:text-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] transition-all cursor-pointer shadow-2xs self-start sm:self-auto active:translate-y-[1px]"
                      >
                        Buka Lacak
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Kartu State Bersih Ketika Belum Ada Riwayat */
              <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#94A3B8] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-[#2E6496]" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
                    Belum Ada Laporan yang Dilacak
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Masukkan kode tiket pelaporan pada kolom di atas untuk memantau status secara langsung.
                  </p>
                </div>
                {onOpenAnonymousReport && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onOpenAnonymousReport}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] transition-colors cursor-pointer"
                    >
                      <span>Belum punya tiket? Buat Laporan Anonim</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ===================================================================
              KONDISI B: TIKET AKTIF DITEMUKAN (Tampilan Rapi Seperti Lacak Kargo)
             =================================================================== */
          <div className="space-y-6 sm:space-y-8 animate-view-enter">
            {/* Kartu Status Laporan (Resi Lacak Kargo) */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              {/* Header Tiket & Salin */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E0D8]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] font-bold block mb-1">
                    TIKET TERVERIFIKASI // TERKONEKSI INSPEKTORAT
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
                      {activeTicket}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#E4E0D8] text-[#2E6496] cursor-pointer transition-colors"
                      title="Salin Kode Tiket"
                    >
                      {copiedTicket ? (
                        <Check className="w-4 h-4 text-[#2E7D32]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isSimulatedComplete
                        ? 'bg-[#EBF7EE] text-[#2E7D32] border border-[#2E7D32]/30'
                        : 'bg-[#EBF3F8] text-[#2E6496] border border-[#2E6496]/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{isSimulatedComplete ? 'Selesai / Tuntas' : 'Sedang Ditindaklanjuti'}</span>
                  </span>
                </div>
              </div>

              {/* Rincian Ringkas (Tanpa Teks Panjang) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Sekolah Terlapor:</span>
                  <button
                    type="button"
                    onClick={onBackToSchoolProfile}
                    className="font-bold text-[#2E6496] hover:underline flex items-center gap-1 truncate max-w-full text-left cursor-pointer"
                    title="Lihat Profil Dana BOSP Sekolah"
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{currentReportData?.schoolName || school.name}</span>
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Jenis Pungutan:</span>
                  <span className="font-bold text-[#1E293B] block truncate">
                    {currentReportData?.category || reportCategory}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Waktu Terkirim:</span>
                  <span className="font-bold text-[#1E293B] block">
                    {currentReportData?.date || '27 Okt 2026'}
                  </span>
                </div>
              </div>

              {/* Stepper Progres Penanganan (Gaya Lacak Kargo) */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Tahapan Penanganan
                  </h3>

                  {/* Tombol Simulasi Cepat */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulatedComplete((prev) => !prev);
                      onShowToast(
                        !isSimulatedComplete
                          ? 'Status diperbarui menjadi Selesai / Tuntas'
                          : 'Status dikembalikan ke tahap Ditindaklanjuti'
                      );
                    }}
                    className="text-[11px] text-[#64748B] hover:text-[#2E6496] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isSimulatedComplete ? 'Reset Status' : 'Simulasi Selesai'}</span>
                  </button>
                </div>

                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#C9DFDC]">
                  {/* Step 4: Selesai */}
                  <div className={`relative ${isSimulatedComplete ? 'opacity-100' : 'opacity-45'}`}>
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF] ${
                        isSimulatedComplete ? 'bg-[#2E7D32] text-white' : 'bg-[#E4E0D8] text-[#64748B]'
                      }`}
                    >
                      {isSimulatedComplete ? <Check className="w-3 h-3" /> : '4'}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
                        Selesai & Pengembalian Dana
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Pungutan dibatalkan resmi dan dana dikembalikan kepada wali murid.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Tindak Lanjut Sekolah (Aktif Saat Ini) */}
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2E6496] text-white flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF] animate-pulse">
                      <Check className="w-3 h-3" />
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-2">
                        <span>Pemeriksaan & Klarifikasi Sekolah</span>
                        {!isSimulatedComplete && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EBF3F8] text-[#2E6496]">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Pihak sekolah dipanggil untuk klarifikasi realisasi SPJ BOSP.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Telaah Berkas */}
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF]">
                      <Check className="w-3 h-3" />
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
                        Verifikasi Berkas Inspektorat
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Data laporan telah diverifikasi sesuai kewenangan dinas.
                      </p>
                    </div>
                  </div>

                  {/* Step 1: Laporan Diterima */}
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF]">
                      <Check className="w-3 h-3" />
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
                        Laporan Terenkripsi Diterima
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Laporan tersimpan dengan protokol anonim tanpa metadata.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Komunikasi 2 Arah Anonim */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2E6496]" />
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Komunikasi 2 Arah Anonim
                  </h3>
                </div>
                <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Identitas Terlindungi
                </span>
              </div>

              {/* Chat Stream */}
              <div className="space-y-3 max-h-72 overflow-y-auto p-1">
                {messages.map((msg) => {
                  const isDinas = msg.sender === 'dinas';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isDinas ? 'items-start' : 'items-end'} animate-view-enter`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#64748B]">
                        <span className="font-bold text-[#1E293B]">{msg.senderLabel}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[88%] sm:max-w-[78%] p-3 rounded-xl text-xs leading-relaxed border ${
                          isDinas
                            ? 'bg-[#FAF8F5] border-[#E4E0D8] text-[#1E293B]'
                            : 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-[#E4E0D8] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => {
                      setReplyInput(e.target.value);
                      setReplyError(null);
                    }}
                    placeholder="Tulis balasan anonim kepada tim verifikator..."
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </div>

                {replyError && (
                  <div className="text-[11px] text-[#DC2626] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{replyError}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
