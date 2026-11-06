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
  Scale,
  FileCheck,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SchoolData, SMK_TI_BAZMA } from '../data/schoolsData';
import {
  getSavedReportsFromStorage,
  fetchAnonymousReportByTicket,
  fetchAllAnonymousReportsFromSupabase,
  updateReportByDinas,
  AnonymousReportRecord,
  AdminReviewDocument,
  InspectionChatMessage,
} from '../lib/supabase';

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
  attachments?: { name: string; sizeFormatted: string }[];
  letterDocument?: AdminReviewDocument | null;
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
    const updated = [item, ...filtered].slice(0, 10);
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
  // 1. State Input & Pencarian
  const [ticketInput, setTicketInput] = useState<string>(ticketCode || '');
  const [activeTicket, setActiveTicket] = useState<string>(ticketCode || '');
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState<boolean>(false);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  // 2. State Riwayat & Daftar Supabase
  const [historyList, setHistoryList] = useState<TrackedReportItem[]>([]);
  const [supabaseReportsList, setSupabaseReportsList] = useState<TrackedReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'supabase'>('supabase');

  // 3. State Data Laporan Aktif
  const [currentReportData, setCurrentReportData] = useState<TrackedReportItem | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('DITELAAH_DINAS');

  // 4. State Chat 2 Arah
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState<string>('');
  const [replyError, setReplyError] = useState<string | null>(null);

  // 5. State Panel Petugas / Admin Dinas Pendidikan (Verifikator Resmi)
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(true);
  const [selectedAdminStatus, setSelectedAdminStatus] = useState<string>('KLARIFIKASI_SEKOLAH');
  const [adminOfficerName, setAdminOfficerName] = useState<string>(
    'Tim Verifikator BOSP Dinas Pendidikan & Inspektorat'
  );
  const [adminOfficialNote, setAdminOfficialNote] = useState<string>(
    'Pengawas Pembina telah memanggil Kepala Sekolah dan Komite. Dilakukan penelaahan silang terhadap dokumen SPJ BOSP dan rekening resmi sekolah.'
  );
  const [isSubmittingAdminReview, setIsSubmittingAdminReview] = useState<boolean>(false);

  // Load Riwayat & Supabase Reports saat Mount
  useEffect(() => {
    loadLocalAndSupabaseData();
  }, [ticketCode]);

  const loadLocalAndSupabaseData = async () => {
    const cookieHistory = getStoredTrackedHistory();
    const savedReports = getSavedReportsFromStorage();

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
          status: String(r.status || 'DITELAAH_DINAS'),
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

    const localItems = Array.from(mergedMap.values());
    setHistoryList(localItems);

    // Ambil daftar seluruh laporan tersimpan dari Supabase
    try {
      const spReports = await fetchAllAnonymousReportsFromSupabase();
      if (spReports && spReports.length > 0) {
        const formatted: TrackedReportItem[] = spReports.map((r) => {
          let parsedDoc: AdminReviewDocument | null = null;
          if (r.letter_document) {
            try {
              parsedDoc =
                typeof r.letter_document === 'string'
                  ? JSON.parse(r.letter_document)
                  : r.letter_document;
            } catch {
              // ignore
            }
          }
          return {
            ticketCode: r.ticket_code,
            schoolName: r.school_name,
            schoolNpsn: r.school_npsn,
            category: r.category,
            date: r.created_at
              ? new Date(r.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Hari ini',
            status: r.status || 'DITELAAH_DINAS',
            notes: r.notes || r.notes_encrypted || '',
            letterDocument: parsedDoc,
          };
        });
        setSupabaseReportsList(formatted);
      }
    } catch (err) {
      console.warn('[Supabase Live Tracking]', err);
    }

    // Jika ada ticketCode aktif dari prop, muat data; jika kosong, reset
    if (ticketCode) {
      setTicketInput(ticketCode);
      setActiveTicket(ticketCode);
      resolveTicketData(ticketCode, localItems);
    } else {
      setTicketInput('');
      setActiveTicket('');
      setCurrentReportData(null);
    }
  };

  // Resolusi data tiket secara komprehensif (Supabase -> Local -> Fallback)
  const resolveTicketData = async (code: string, fallbackList?: TrackedReportItem[]) => {
    setIsLoadingReport(true);
    const cleaned = code.trim().toUpperCase();

    try {
      // 1. Coba ambil dari database Supabase
      const remote = await fetchAnonymousReportByTicket(cleaned);
      if (remote) {
        let parsedDoc: AdminReviewDocument | null = null;
        if (remote.letter_document) {
          try {
            parsedDoc =
              typeof remote.letter_document === 'string'
                ? JSON.parse(remote.letter_document)
                : remote.letter_document;
          } catch {
            // ignore
          }
        }

        let parsedAttachments: { name: string; sizeFormatted: string }[] = [];
        if (remote.attachments_json) {
          try {
            parsedAttachments =
              typeof remote.attachments_json === 'string'
                ? JSON.parse(remote.attachments_json)
                : remote.attachments_json;
          } catch {
            // ignore
          }
        }

        const resolvedItem: TrackedReportItem = {
          ticketCode: remote.ticket_code,
          schoolName: remote.school_name || 'Sekolah Terpilih',
          schoolNpsn: remote.school_npsn || '',
          category: remote.category || 'Pungutan Sekolah',
          date: remote.created_at
            ? new Date(remote.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Baru saja',
          status: remote.status || 'DITELAAH_DINAS',
          notes: remote.notes || remote.notes_encrypted || '',
          attachments: parsedAttachments,
          letterDocument: parsedDoc,
        };

        setCurrentReportData(resolvedItem);
        setCurrentStatus(resolvedItem.status);
        setSelectedAdminStatus(resolvedItem.status);
        buildChatStream(resolvedItem, parsedDoc);
        saveTrackedItemToHistory(resolvedItem);
        setIsLoadingReport(false);
        return;
      }
    } catch (err) {
      console.warn('[Resolve Ticket Remote]', err);
    }

    // 2. Coba cari di memori lokal
    const currentList = fallbackList || historyList;
    const found = currentList.find((i) => i.ticketCode.toUpperCase() === cleaned);

    if (found) {
      setCurrentReportData(found);
      setCurrentStatus(found.status || 'DITELAAH_DINAS');
      setSelectedAdminStatus(found.status || 'DITELAAH_DINAS');
      buildChatStream(found, found.letterDocument);
      saveTrackedItemToHistory(found);
    } else {
      // 3. Fallback baru
      const fallbackItem: TrackedReportItem = {
        ticketCode: cleaned,
        schoolName: school.name || 'SMK TI BAZMA',
        schoolNpsn: school.npsn || '70029710',
        category: reportCategory || 'Dugaan Pungutan',
        date: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        status: 'DITELAAH_DINAS',
        notes: reporterNote,
      };
      setCurrentReportData(fallbackItem);
      setCurrentStatus('DITELAAH_DINAS');
      setSelectedAdminStatus('DITELAAH_DINAS');
      buildChatStream(fallbackItem);
      saveTrackedItemToHistory(fallbackItem);
    }

    setIsLoadingReport(false);
  };

  const buildChatStream = (
    item: TrackedReportItem,
    doc?: AdminReviewDocument | null
  ) => {
    // Jika ada percakapan tersimpan di dokumen telaah Supabase
    if (doc?.chat_messages && doc.chat_messages.length > 0) {
      setMessages(doc.chat_messages);
      return;
    }

    const msgs: ChatMessage[] = [];

    // Catatan awal pelapor
    if (item.notes && item.notes.trim()) {
      msgs.push({
        id: 'msg-initial-note',
        sender: 'reporter',
        senderLabel: 'Catatan Pelapor (Terenkripsi)',
        timestamp: `${item.date}, Pengiriman`,
        text: item.notes.trim(),
      });
    }

    // Tanggapan awal sistem / dinas
    msgs.push({
      id: 'msg-dinas-initial',
      sender: 'dinas',
      senderLabel: doc?.verified_by || 'Tim Verifikator Inspektorat & Dinas Pendidikan',
      timestamp: 'Waktu Telaah',
      text:
        doc?.admin_notes ||
        `Laporan untuk ${item.schoolName} telah teregistrasi dalam sistem pengawasan dana BOSP. Pengawas pembina sedang memverifikasi Berita Acara Pemeriksaan bersama inspektorat daerah.`,
    });

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
    resolveTicketData(cleaned);
    onShowToast(`Memuat status pelaporan untuk kode ${cleaned}`);
  };

  // Pilih Tiket dari Riwayat / Supabase List
  const handleSelectTicket = (item: TrackedReportItem) => {
    setTicketInput(item.ticketCode);
    setActiveTicket(item.ticketCode);
    setTicketError(null);
    resolveTicketData(item.ticketCode);
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

  // Kirim Balasan Chat dari Pelapor (Anonim)
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
      senderLabel: 'Anda (Pelapor Anonim)',
      timestamp: `Hari ini, ${hours}:${mins} WIB`,
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyInput('');
    onShowToast('Pesan balasan anonim Anda telah ditambahkan.');
  };

  // Simpan Tindak Lanjut Resmi Dinas Pendidikan ke Supabase Database
  const handleSaveAdminReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setIsSubmittingAdminReview(true);
    try {
      await updateReportByDinas(
        activeTicket,
        selectedAdminStatus,
        adminOfficialNote,
        adminOfficerName
      );

      // Mutakhirkan state lokal secara instan
      setCurrentStatus(selectedAdminStatus);

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');

      const dinasMessage: ChatMessage = {
        id: `dinas-${Date.now()}`,
        sender: 'dinas',
        senderLabel: adminOfficerName,
        timestamp: `Hari ini, ${hours}:${mins} WIB`,
        text: adminOfficialNote,
      };

      setMessages((prev) => [...prev, dinasMessage]);

      if (currentReportData) {
        setCurrentReportData({
          ...currentReportData,
          status: selectedAdminStatus,
        });
      }

      // Refresh list agar sinkron
      fetchAllAnonymousReportsFromSupabase().then((spList) => {
        if (spList) {
          setSupabaseReportsList(
            spList.map((r) => ({
              ticketCode: r.ticket_code,
              schoolName: r.school_name,
              schoolNpsn: r.school_npsn,
              category: r.category,
              date: new Date(r.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
              status: r.status,
              notes: r.notes || r.notes_encrypted || '',
            }))
          );
        }
      });

      onShowToast(
        'Tanggapan & status pemeriksaan resmi Dinas Pendidikan berhasil disimpan ke database Supabase!'
      );
    } catch (err) {
      console.error('[Admin Review Save Error]', err);
      onShowToast('Gagal menyimpan ke Supabase. Periksa jaringan.');
    } finally {
      setIsSubmittingAdminReview(false);
    }
  };

  // Pemetaan tahapan untuk visualisasi Stepper
  const isStageComplete = (stageNum: number): boolean => {
    if (stageNum === 1) return true; // Step 1 selalu selesai jika tiket terbit
    if (stageNum === 2) {
      return (
        currentStatus === 'DITELAAH_DINAS' ||
        currentStatus === 'KLARIFIKASI_SEKOLAH' ||
        currentStatus === 'AUDIT_LAPANGAN' ||
        currentStatus === 'SELESAI' ||
        currentStatus === 'SELESAI_DIKLARIFIKASI'
      );
    }
    if (stageNum === 3) {
      return (
        currentStatus === 'KLARIFIKASI_SEKOLAH' ||
        currentStatus === 'AUDIT_LAPANGAN' ||
        currentStatus === 'SELESAI' ||
        currentStatus === 'SELESAI_DIKLARIFIKASI'
      );
    }
    if (stageNum === 4) {
      return (
        currentStatus === 'SELESAI' || currentStatus === 'SELESAI_DIKLARIFIKASI'
      );
    }
    return false;
  };

  const isStageActive = (stageNum: number): boolean => {
    if (stageNum === 4 && isStageComplete(4)) return true;
    if (
      stageNum === 3 &&
      (currentStatus === 'KLARIFIKASI_SEKOLAH' || currentStatus === 'AUDIT_LAPANGAN')
    ) {
      return true;
    }
    if (stageNum === 2 && currentStatus === 'DITELAAH_DINAS') return true;
    if (stageNum === 1 && currentStatus === 'TERKIRIM_TERENKRIPSI') return true;
    return false;
  };

  const getStatusBadgeMeta = (status: string) => {
    switch (status) {
      case 'SELESAI':
      case 'SELESAI_DIKLARIFIKASI':
        return {
          bg: 'bg-[#EBF7EE]',
          text: 'text-[#2E7D32]',
          border: 'border-[#2E7D32]/30',
          label: 'Selesai & Pengembalian Dana',
        };
      case 'KLARIFIKASI_SEKOLAH':
        return {
          bg: 'bg-[#FFF8E6]',
          text: 'text-[#D97706]',
          border: 'border-[#D97706]/30',
          label: 'Klarifikasi Sekolah & BAP',
        };
      case 'AUDIT_LAPANGAN':
        return {
          bg: 'bg-[#F3E8FF]',
          text: 'text-[#7E22CE]',
          border: 'border-[#7E22CE]/30',
          label: 'Audit Investigasi Lapangan',
        };
      case 'DITELAAH_DINAS':
      default:
        return {
          bg: 'bg-[#EBF3F8]',
          text: 'text-[#2E6496]',
          border: 'border-[#2E6496]/30',
          label: 'Penelaahan Dinas Pendidikan',
        };
    }
  };

  const statusMeta = getStatusBadgeMeta(currentStatus);

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-view-enter">
      {/* Container Konsisten Max-W-3XL */}
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
              STATUS PELAPORAN ANONIM // DATABASE RESMI
            </span>
            <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              Lacak Progres Laporan
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Masukkan kode tiket untuk memantau status pemeriksaan dokumen dan telaah Berita Acara BOSP oleh Dinas Pendidikan dan Inspektorat Daerah.
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
                disabled={isLoadingReport}
                className="px-6 py-3 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-2xs active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingReport ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Cek Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
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
            Tampilkan Segmentasi Tab: Laporan Supabase & Riwayat Perangkat
           =================================================================== */}
        {!activeTicket ? (
          <div className="space-y-4 animate-view-enter">
            {/* Segmented Controls Tab */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8]">
              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'supabase'
                    ? 'bg-[#FFFFFF] text-[#2E6496] shadow-2xs border border-[#C9DFDC]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Laporan Masuk ke Dinas ({supabaseReportsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'local'
                    ? 'bg-[#FFFFFF] text-[#2E6496] shadow-2xs border border-[#C9DFDC]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat di Perangkat ({historyList.length})</span>
              </button>
            </div>

            {/* TAB SUPABASE LIVE REPORTS */}
            {activeTab === 'supabase' && (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2E6496]" />
                    <h2 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                      Daftar Laporan Terdaftar di Supabase Database
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-[#2E7D32] bg-[#EBF7EE] px-2 py-0.5 rounded-md font-semibold">
                    Live Supabase
                  </span>
                </div>

                <div className="space-y-2.5">
                  {supabaseReportsList.length > 0 ? (
                    supabaseReportsList.map((item) => {
                      const itemMeta = getStatusBadgeMeta(item.status);
                      return (
                        <div
                          key={item.ticketCode}
                          className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] hover:border-[#2E6496]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md">
                                {item.ticketCode}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${itemMeta.bg} ${itemMeta.text}`}
                              >
                                {itemMeta.label}
                              </span>
                              <span className="text-[#64748B] text-[11px]">
                                • {item.date}
                              </span>
                            </div>
                            <div className="font-bold text-[#1E293B] text-xs sm:text-sm">
                              {item.schoolName}
                            </div>
                            <div className="text-[11px] text-[#475569] line-clamp-1">
                              {item.category}: {item.notes}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectTicket(item)}
                            className="px-4 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#2E6496] hover:text-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] transition-all cursor-pointer shadow-2xs self-start sm:self-auto active:translate-y-[1px]"
                          >
                            Buka Lacak & Audit
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-[#64748B]">
                      Belum ada laporan di database Supabase.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB LOCAL COOKIE HISTORY */}
            {activeTab === 'local' && (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#2E6496]" />
                    <h2 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                      Riwayat Pelaporan di Perangkat Ini
                    </h2>
                  </div>

                  {historyList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-[11px] text-[#64748B] hover:text-[#DC2626] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Hapus Riwayat Cookie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {historyList.length > 0 ? (
                    historyList.map((item) => {
                      const itemMeta = getStatusBadgeMeta(item.status);
                      return (
                        <div
                          key={item.ticketCode}
                          className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] hover:border-[#2E6496]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md">
                                {item.ticketCode}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${itemMeta.bg} ${itemMeta.text}`}
                              >
                                {itemMeta.label}
                              </span>
                              <span className="text-[#64748B] text-[11px]">
                                • {item.date}
                              </span>
                            </div>
                            <div className="font-bold text-[#1E293B] text-xs sm:text-sm">
                              {item.schoolName}
                            </div>
                            <div className="text-[11px] text-[#475569]">
                              {item.category}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectTicket(item)}
                            className="px-4 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#2E6496] hover:text-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] transition-all cursor-pointer shadow-2xs self-start sm:self-auto active:translate-y-[1px]"
                          >
                            Buka Lacak
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <p className="text-xs text-[#64748B]">
                        Belum ada laporan yang tersimpan di perangkat ini.
                      </p>
                      {onOpenAnonymousReport && (
                        <button
                          type="button"
                          onClick={onOpenAnonymousReport}
                          className="text-xs font-bold text-[#2E6496] hover:underline"
                        >
                          Buat Laporan Pengaduan Anonim Baru
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===================================================================
              KONDISI B: TIKET AKTIF DITEMUKAN (Tampilan Lacak + Panel Audit Dinas)
             =================================================================== */
          <div className="space-y-6 sm:space-y-8 animate-view-enter">
            {/* Kartu Status Laporan (Resi Lacak Kargo) */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              {/* Header Tiket & Salin */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E0D8]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] font-bold block mb-1">
                    TIKET TERVERIFIKASI // TERKONEKSI DATABASE SUPABASE
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
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusMeta.bg} ${statusMeta.text} border ${statusMeta.border}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{statusMeta.label}</span>
                  </span>
                </div>
              </div>

              {/* Rincian Ringkas */}
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
                    <span className="truncate">
                      {currentReportData?.schoolName || school.name}
                    </span>
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Jenis Pengaduan:</span>
                  <span className="font-bold text-[#1E293B] block truncate">
                    {currentReportData?.category || reportCategory}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Waktu Registrasi:</span>
                  <span className="font-bold text-[#1E293B] block">
                    {currentReportData?.date || 'Hari ini'}
                  </span>
                </div>
              </div>

              {/* Berkas Bukti Terlampir jika ada */}
              {currentReportData?.attachments && currentReportData.attachments.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] space-y-2">
                  <span className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>Dokumen Bukti Terlampir ({currentReportData.attachments.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentReportData.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E4E0D8] text-[11px] text-[#1E293B] flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3 h-3 text-[#2E7D32]" />
                        <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                        <span className="text-[#64748B]">({att.sizeFormatted})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stepper Progres Penanganan Real-Time */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Tahapan Penanganan Resmi
                  </h3>
                  <span className="text-[11px] text-[#64748B]">
                    Sinkron otomatis dengan keputusan auditor
                  </span>
                </div>

                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#C9DFDC]">
                  {/* Step 4: Selesai */}
                  <div
                    className={`relative ${
                      isStageComplete(4) ? 'opacity-100' : 'opacity-45'
                    }`}
                  >
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF] ${
                        isStageComplete(4)
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#E4E0D8] text-[#64748B]'
                      }`}
                    >
                      {isStageComplete(4) ? <Check className="w-3 h-3" /> : '4'}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-2">
                        <span>Selesai & Pengembalian Dana</span>
                        {isStageActive(4) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EBF7EE] text-[#2E7D32]">
                            Tuntas
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Pungutan dinyatakan melanggar aturan dan dana wajib dikembalikan penuh ke orang tua murid.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Tindak Lanjut Sekolah & Audit Lapangan */}
                  <div
                    className={`relative ${
                      isStageComplete(3) ? 'opacity-100' : 'opacity-45'
                    }`}
                  >
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF] ${
                        isStageComplete(3)
                          ? 'bg-[#2E6496] text-white'
                          : 'bg-[#E4E0D8] text-[#64748B]'
                      }`}
                    >
                      {isStageComplete(3) ? <Check className="w-3 h-3" /> : '3'}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-2">
                        <span>Pemeriksaan Lapangan & Klarifikasi Sekolah</span>
                        {isStageActive(3) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EBF3F8] text-[#2E6496] animate-pulse">
                            Sedang Berjalan
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Kepala Sekolah dan Bendahara dipanggil secara resmi untuk klarifikasi SPJ dan rekening penampung.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Telaah Berkas */}
                  <div
                    className={`relative ${
                      isStageComplete(2) ? 'opacity-100' : 'opacity-45'
                    }`}
                  >
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF] ${
                        isStageComplete(2)
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#E4E0D8] text-[#64748B]'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-2">
                        <span>Verifikasi Berkas Administrasi BOSP (Dinas Pendidikan)</span>
                        {isStageActive(2) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EBF3F8] text-[#2E6496] animate-pulse">
                            Sedang Berjalan
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Dokumen bukti kuitansi dan alokasi BOS sekolah diverifikasi sesuai petunjuk teknis.
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
                        Laporan Terenkripsi Diterima di Supabase
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Data disimpan dengan protokol sandi AES-GCM-256 tanpa merekam identitas pelapor.
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
                    Tanggapan Resmi & Komunikasi 2 Arah Anonim
                  </h3>
                </div>
                <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Identitas Terlindungi
                </span>
              </div>

              {/* Chat Stream */}
              <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                {messages.map((msg) => {
                  const isDinas = msg.sender === 'dinas';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isDinas ? 'items-start' : 'items-end'
                      } animate-view-enter`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#64748B]">
                        <span className="font-bold text-[#1E293B]">
                          {msg.senderLabel}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[90%] sm:max-w-[80%] p-3.5 rounded-xl text-xs leading-relaxed border ${
                          isDinas
                            ? 'bg-[#FAF8F5] border-[#E4E0D8] text-[#1E293B] shadow-2xs'
                            : 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form (Pelapor) */}
              <form
                onSubmit={handleSendReply}
                className="pt-2 border-t border-[#E4E0D8] space-y-2"
              >
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

            {/* ===================================================================
                PANEL PENGAWASAN & TELAAH DINAS PENDIDIKAN
                (Simulasi & Aksi Admin Dinas Langsung ke Database Supabase)
               =================================================================== */}
            <div className="bg-[#FFFFFF] border-2 border-[#2E6496]/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#2E6496]" />
                    <h3 className="font-sturdy-heading text-sm sm:text-base font-extrabold text-[#1E293B]">
                      Portal Verifikator Dinas Pendidikan & Inspektorat
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Fitur pemeriksaan resmi: telusuri bukti, perbarui tahapan audit, dan kirimkan telaah ke database Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAdminPanelOpen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#E4E0D8] text-xs font-bold text-[#2E6496] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isAdminPanelOpen ? 'Sembunyikan' : 'Buka Formulir'}</span>
                  {isAdminPanelOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isAdminPanelOpen && (
                <form onSubmit={handleSaveAdminReview} className="space-y-4 pt-1">
                  {/* Pilihan Tahapan Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#1E293B] block">
                      Keputusan Tahapan Penanganan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        {
                          val: 'DITELAAH_DINAS',
                          label: '🟡 2. Verifikasi Berkas SPJ',
                          desc: 'Dokumen telaah diproses oleh staf pengawas BOSP',
                        },
                        {
                          val: 'KLARIFIKASI_SEKOLAH',
                          label: '🟠 3. Panggil Pihak Sekolah',
                          desc: 'Penerbitan Surat Panggilan Klarifikasi BAP',
                        },
                        {
                          val: 'AUDIT_LAPANGAN',
                          label: '🟣 3. Audit Lapangan Inspektorat',
                          desc: 'Pemeriksaan lapangan dan audit rekening penampung',
                        },
                        {
                          val: 'SELESAI',
                          label: '🟢 4. Pengembalian Dana (Selesai)',
                          desc: 'Pungutan dibatalkan dan dana dikembalikan 100%',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setSelectedAdminStatus(opt.val)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedAdminStatus === opt.val
                              ? 'bg-[#EBF3F8] border-[#2E6496] shadow-2xs ring-1 ring-[#2E6496]'
                              : 'bg-[#FAF8F5] border-[#E4E0D8] hover:border-[#2E6496]/40'
                          }`}
                        >
                          <div className="font-bold text-[#1E293B]">{opt.label}</div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Identitas Petugas Penelaah */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1E293B] block">
                      Pejabat / Tim Penelaah:
                    </label>
                    <select
                      value={adminOfficerName}
                      onChange={(e) => setAdminOfficerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
                    >
                      <option value="Tim Verifikator BOSP Dinas Pendidikan & Inspektorat">
                        Tim Verifikator BOSP Dinas Pendidikan & Inspektorat
                      </option>
                      <option value="Pengawas Pembina Wilayah Dinas Pendidikan">
                        Pengawas Pembina Wilayah Dinas Pendidikan
                      </option>
                      <option value="Auditor Investigasi Inspektorat Daerah">
                        Auditor Investigasi Inspektorat Daerah
                      </option>
                      <option value="Kepala Bidang Pembinaan Sekolah (Kabid)">
                        Kepala Bidang Pembinaan Sekolah (Kabid)
                      </option>
                    </select>
                  </div>

                  {/* Catatan / Tanggapan Resmi */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E293B] block">
                        Catatan Hasil Telaah & Instruksi Resmi:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setAdminOfficialNote(
                              'Pengawas Pembina telah memanggil Kepala Sekolah dan Komite. Pungutan dinyatakan tidak memiliki dasar hukum sesuai Kepmendikbudristek 63/2022 dan dana wajib dikembalikan kepada seluruh siswa paling lambat 7 hari kerja.'
                            )
                          }
                          className="text-[10px] text-[#2E6496] hover:underline cursor-pointer"
                        >
                          Template Pengembalian
                        </button>
                        <span className="text-[10px] text-[#CBD5E1]">•</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAdminOfficialNote(
                              'Tim auditor sedang melakukan pemeriksaan silang terhadap rekening penampung sekolah dan kwitansi pembelian modul yang dilaporkan.'
                            )
                          }
                          className="text-[10px] text-[#2E6496] hover:underline cursor-pointer"
                        >
                          Template Audit
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={adminOfficialNote}
                      onChange={(e) => setAdminOfficialNote(e.target.value)}
                      placeholder="Tuliskan catatan hasil pemeriksaan atau instruksi dinas..."
                      className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 leading-relaxed"
                    />
                  </div>

                  {/* Tombol Simpan ke Supabase */}
                  <button
                    type="submit"
                    disabled={isSubmittingAdminReview}
                    className="w-full py-3 px-4 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-2xs active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAdminReview ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Simpan Hasil Pemeriksaan ke Database Supabase</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
