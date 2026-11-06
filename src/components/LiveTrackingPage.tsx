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
  Scale,
  FileCheck,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileBadge2,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { SchoolData, SMK_TI_BAZMA } from '../data/schoolsData';
import {
  supabase,
  getSavedReportsFromStorage,
  fetchAnonymousReportByTicket,
  fetchAllAnonymousReportsFromSupabase,
  updateReportByDinas,
  AnonymousReportRecord,
  AdminReviewDocument,
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

export interface TrackingStage {
  step: number;
  key: string;
  label: string;
  sublabel: string;
  description: string;
}

export const TRACKING_STAGES: TrackingStage[] = [
  {
    step: 1,
    key: 'LAPORAN_TERKIRIM',
    label: 'Laporan Terkirim',
    sublabel: 'Terenkripsi',
    description: 'Laporan warga diterima secara aman melalui protokol sandi tanpa rekaman identitas.',
  },
  {
    step: 2,
    key: 'MENUNGGU_VERIFIKASI',
    label: 'Menunggu Verifikasi',
    sublabel: 'Antrean Dinas',
    description: 'Laporan masuk antrean pengawasan BOSP Dinas Pendidikan & Inspektorat Daerah.',
  },
  {
    step: 3,
    key: 'VERIFIKASI_LAPORAN',
    label: 'Verifikasi Laporan',
    sublabel: 'Telaah Bukti',
    description: 'Auditor meneliti kesesuaian bukti pungutan dengan SPJ dan petunjuk teknis BOSP.',
  },
  {
    step: 4,
    key: 'PEMERIKSAAN_LAPANGAN',
    label: 'Pemeriksaan Lapangan',
    sublabel: 'Sidak & Klarifikasi',
    description: 'Tim pengawas memanggil pihak sekolah atau melakukan sidak verifikasi langsung.',
  },
  {
    step: 5,
    key: 'TINDAK_LANJUT_SELESAI',
    label: 'Tindak Lanjut Selesai',
    sublabel: 'Selesai & Tuntas',
    description: 'Pungutan dinyatakan tidak sah dan dana wajib dikembalikan penuh ke orang tua murid.',
  },
];

export function getStageNumber(status: string): number {
  const norm = (status || '').trim().toUpperCase();
  switch (norm) {
    case 'TINDAK_LANJUT_SELESAI':
    case 'SELESAI':
    case 'SELESAI_DIKLARIFIKASI':
      return 5;
    case 'PEMERIKSAAN_LAPANGAN':
    case 'KLARIFIKASI_SEKOLAH':
    case 'AUDIT_LAPANGAN':
      return 4;
    case 'VERIFIKASI_LAPORAN':
    case 'DITELAAH_DINAS':
      return 3;
    case 'MENUNGGU_VERIFIKASI':
      return 2;
    case 'LAPORAN_TERKIRIM':
    case 'TERKIRIM_TERENKRIPSI':
    default:
      return 1;
  }
}

export function getDefaultDinasResponse(stageNum: number, schoolName: string): string {
  switch (stageNum) {
    case 1:
      return `Laporan dugaan pungutan di ${schoolName} telah diterima melalui saluran aman DARADIK. Sistem telah menerbitkan kode registrasi dan menyalurkannya ke dashboard Dinas Pendidikan.`;
    case 2:
      return `Laporan untuk ${schoolName} saat ini masuk dalam antrean telaah pengawas pembina wilayah. Petugas sedang mengumpulkan riwayat penyaluran dana BOSP tahun berjalan.`;
    case 3:
      return `Tim Verifikator BOSP Dinas Pendidikan sedang memverifikasi berkas laporan bersama bukti kuitansi yang dilampirkan. Tim membandingkan dengan Berita Acara Pemeriksaan BOSP sekolah terlapor.`;
    case 4:
      return `Tim Auditor Investigasi Inspektorat Daerah telah menerbitkan Surat Tugas Resmi untuk memanggil Kepala Sekolah dan Komite ${schoolName}. Pemeriksaan rekening penampung dan klarifikasi SPJ sedang berlangsung.`;
    case 5:
      return `Pemeriksaan selesai. Berdasarkan hasil audit tim gabungan Dinas Pendidikan dan Inspektorat, pemungutan dana dinyatakan melanggar Permendikbudristek No. 63/2022. Pihak sekolah telah diinstruksikan mengembalikan 100% dana kepada wali murid dalam waktu 7 hari kerja.`;
    default:
      return `Laporan sedang diproses sesuai prosedur pengawasan BOSP.`;
  }
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
  const [activeTab, setActiveTab] = useState<'supabase' | 'local'>('supabase');

  // 3. State Data Laporan Aktif
  const [currentReportData, setCurrentReportData] = useState<TrackedReportItem | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('MENUNGGU_VERIFIKASI');

  // 4. State Chat 2 Arah
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState<string>('');
  const [replyError, setReplyError] = useState<string | null>(null);

  // 5. State Panel Dinas Pendidikan (Pengatur Status Realtime)
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(true);
  const [selectedAdminStatus, setSelectedAdminStatus] = useState<string>('VERIFIKASI_LAPORAN');
  const [adminOfficerName, setAdminOfficerName] = useState<string>(
    'Tim Verifikator BOSP Dinas Pendidikan & Inspektorat'
  );
  const [adminOfficialNote, setAdminOfficialNote] = useState<string>('');
  const [isSubmittingAdminReview, setIsSubmittingAdminReview] = useState<boolean>(false);

  // Load Riwayat & Supabase Reports saat Mount
  useEffect(() => {
    loadLocalAndSupabaseData();
  }, [ticketCode]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!activeTicket) return;

    // Supabase Realtime Listener untuk tiket yang sedang aktif
    const channel = supabase
      .channel(`realtime-tracking-${activeTicket}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anonymous_reports',
          filter: `ticket_code=eq.${activeTicket.trim().toUpperCase()}`,
        },
        (payload) => {
          if (payload.new) {
            const row = payload.new as Record<string, unknown>;
            const newStatus = String(row.status || 'MENUNGGU_VERIFIKASI');
            setCurrentStatus(newStatus);
            setSelectedAdminStatus(newStatus);

            let parsedDoc: AdminReviewDocument | null = null;
            if (row.letter_document) {
              try {
                parsedDoc =
                  typeof row.letter_document === 'string'
                    ? JSON.parse(row.letter_document)
                    : (row.letter_document as AdminReviewDocument);
              } catch {
                // ignore
              }
            }

            setCurrentReportData((prev) =>
              prev
                ? {
                    ...prev,
                    status: newStatus,
                    letterDocument: parsedDoc,
                  }
                : null
            );

            if (parsedDoc?.chat_messages && parsedDoc.chat_messages.length > 0) {
              setMessages(parsedDoc.chat_messages);
            }

            onShowToast(`Status laporan diperbarui secara realtime: ${newStatus}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTicket]);

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
          status: String(r.status || 'MENUNGGU_VERIFIKASI'),
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
            status: r.status || 'MENUNGGU_VERIFIKASI',
            notes: r.notes || r.notes_encrypted || '',
            letterDocument: parsedDoc,
          };
        });
        setSupabaseReportsList(formatted);
      }
    } catch (err) {
      console.warn('[Supabase Live Tracking]', err);
    }

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

  // Resolusi data tiket secara komprehensif
  const resolveTicketData = async (code: string, fallbackList?: TrackedReportItem[]) => {
    setIsLoadingReport(true);
    const cleaned = code.trim().toUpperCase();

    try {
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
          status: remote.status || 'MENUNGGU_VERIFIKASI',
          notes: remote.notes || remote.notes_encrypted || '',
          attachments: parsedAttachments,
          letterDocument: parsedDoc,
        };

        setCurrentReportData(resolvedItem);
        setCurrentStatus(resolvedItem.status);
        setSelectedAdminStatus(resolvedItem.status);
        setAdminOfficialNote(
          parsedDoc?.admin_notes ||
            getDefaultDinasResponse(getStageNumber(resolvedItem.status), resolvedItem.schoolName)
        );
        buildChatStream(resolvedItem, parsedDoc);
        saveTrackedItemToHistory(resolvedItem);
        setIsLoadingReport(false);
        return;
      }
    } catch (err) {
      console.warn('[Resolve Ticket Remote]', err);
    }

    const currentList = fallbackList || historyList;
    const found = currentList.find((i) => i.ticketCode.toUpperCase() === cleaned);

    if (found) {
      setCurrentReportData(found);
      setCurrentStatus(found.status || 'MENUNGGU_VERIFIKASI');
      setSelectedAdminStatus(found.status || 'MENUNGGU_VERIFIKASI');
      setAdminOfficialNote(
        found.letterDocument?.admin_notes ||
          getDefaultDinasResponse(getStageNumber(found.status), found.schoolName)
      );
      buildChatStream(found, found.letterDocument);
      saveTrackedItemToHistory(found);
    } else {
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
        status: 'MENUNGGU_VERIFIKASI',
        notes: reporterNote,
      };
      setCurrentReportData(fallbackItem);
      setCurrentStatus('MENUNGGU_VERIFIKASI');
      setSelectedAdminStatus('MENUNGGU_VERIFIKASI');
      setAdminOfficialNote(
        getDefaultDinasResponse(getStageNumber('MENUNGGU_VERIFIKASI'), fallbackItem.schoolName)
      );
      buildChatStream(fallbackItem);
      saveTrackedItemToHistory(fallbackItem);
    }

    setIsLoadingReport(false);
  };

  const buildChatStream = (
    item: TrackedReportItem,
    doc?: AdminReviewDocument | null
  ) => {
    if (doc?.chat_messages && doc.chat_messages.length > 0) {
      setMessages(doc.chat_messages);
      return;
    }

    const msgs: ChatMessage[] = [];

    if (item.notes && item.notes.trim()) {
      msgs.push({
        id: 'msg-initial-note',
        sender: 'reporter',
        senderLabel: 'Catatan Pelapor (Terenkripsi)',
        timestamp: `${item.date}, Waktu Kirim`,
        text: item.notes.trim(),
      });
    }

    const stageNum = getStageNumber(item.status);
    const officialText =
      doc?.admin_notes || getDefaultDinasResponse(stageNum, item.schoolName);

    msgs.push({
      id: 'msg-dinas-initial',
      sender: 'dinas',
      senderLabel: doc?.verified_by || 'Tim Verifikator Inspektorat & Dinas Pendidikan',
      timestamp: 'Waktu Telaah',
      text: officialText,
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
      setTicketError('Format tiket tidak sesuai. Contoh: CHK-2026-8849-BGR');
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

  // Simpan Tindak Lanjut Resmi Dinas Pendidikan ke Supabase Database secara Realtime
  const handleSaveAdminReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setIsSubmittingAdminReview(true);
    const finalNote =
      adminOfficialNote.trim() ||
      getDefaultDinasResponse(
        getStageNumber(selectedAdminStatus),
        currentReportData?.schoolName || 'Sekolah Terlapor'
      );

    try {
      await updateReportByDinas(
        activeTicket,
        selectedAdminStatus,
        finalNote,
        adminOfficerName
      );

      setCurrentStatus(selectedAdminStatus);

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');

      const dinasMessage: ChatMessage = {
        id: `dinas-${Date.now()}`,
        sender: 'dinas',
        senderLabel: adminOfficerName,
        timestamp: `Hari ini, ${hours}:${mins} WIB`,
        text: finalNote,
      };

      setMessages((prev) => [...prev, dinasMessage]);

      if (currentReportData) {
        setCurrentReportData({
          ...currentReportData,
          status: selectedAdminStatus,
          letterDocument: {
            inspection_status: selectedAdminStatus,
            verified_by: adminOfficerName,
            admin_notes: finalNote,
          },
        });
      }

      onShowToast(
        'Status pemeriksaan dan tanggapan resmi Dinas Pendidikan berhasil diperbarui di database!'
      );
    } catch (err) {
      console.error('[Admin Review Save Error]', err);
      onShowToast('Gagal menyimpan ke database Supabase.');
    } finally {
      setIsSubmittingAdminReview(false);
    }
  };

  const currentStageNumber = getStageNumber(currentStatus);
  const activeStageInfo =
    TRACKING_STAGES.find((s) => s.step === currentStageNumber) || TRACKING_STAGES[0];

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-view-enter">
      {/* Container Bersih & Rapi Max-W-3XL */}
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        {/* 1. Navigasi Atas */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:translate-y-[1px]"
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
              className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#E4E0D8] text-xs font-semibold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
            >
              Lacak Tiket Lain
            </button>
          )}
        </div>

        {/* 2. Header Pencarian Tiket (Sederhana, Bersih, Anti-Slop) */}
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E6496] block">
              STATUS PELAPORAN REALTIME // SISTEM RESMI DINAS PENDIDIKAN
            </span>
            <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              Lacak Status Penanganan Laporan
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Pantau tahapan pemeriksaan dokumen, klarifikasi pihak sekolah, hingga tindak lanjut pengembalian dana secara langsung.
            </p>
          </div>

          <form onSubmit={handleCheckTicket} className="space-y-3 pt-1">
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] uppercase placeholder:text-[#94A3B8] placeholder:font-normal placeholder:capitalize focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingReport}
                className="px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-2xs active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            Tampilkan Daftar Laporan Supabase & Riwayat Perangkat
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
                <span>Laporan Masuk Dinas ({supabaseReportsList.length})</span>
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
                <span>Riwayat di Perangkat Ini ({historyList.length})</span>
              </button>
            </div>

            {/* TAB SUPABASE LIVE REPORTS */}
            {activeTab === 'supabase' && (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2E6496]" />
                    <h2 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                      Daftar Laporan Terdaftar di Supabase Database
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-[#2E7D32] bg-[#EBF7EE] px-2 py-0.5 rounded-md font-semibold">
                    Realtime Synced
                  </span>
                </div>

                <div className="space-y-2.5">
                  {supabaseReportsList.length > 0 ? (
                    supabaseReportsList.map((item) => {
                      const stNum = getStageNumber(item.status);
                      const stInfo = TRACKING_STAGES.find((s) => s.step === stNum);
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
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  stNum === 5
                                    ? 'bg-[#EBF7EE] text-[#2E7D32]'
                                    : stNum >= 3
                                    ? 'bg-[#FFF8E6] text-[#D97706]'
                                    : 'bg-[#EBF3F8] text-[#2E6496]'
                                }`}
                              >
                                {stInfo?.label || item.status}
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
                            Buka Lacak & Periksa
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
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
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
                    historyList.map((item) => (
                      <div
                        key={item.ticketCode}
                        className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] hover:border-[#2E6496]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md">
                              {item.ticketCode}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#2E6496]">
                              {item.status}
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
                    ))
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
              KONDISI B: TIKET AKTIF DITEMUKAN
              STATUS REALTIME + ANIMASI CENTANG 1, 2, 3, 4, 5 + BALASAN DINAS
             =================================================================== */
          <div className="space-y-6 animate-view-enter">
            {/* 1. KARTU INFORMASI TIKET */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              {/* Header Tiket */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E0D8]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] font-bold block mb-1">
                    TIKET PELAPORAN RESMI // STATUS REALTIME
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
                      currentStageNumber === 5
                        ? 'bg-[#EBF7EE] text-[#2E7D32] border border-[#2E7D32]/30'
                        : currentStageNumber >= 3
                        ? 'bg-[#FFF8E6] text-[#D97706] border border-[#D97706]/30'
                        : 'bg-[#EBF3F8] text-[#2E6496] border border-[#2E6496]/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{activeStageInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Rincian Ringkas Sekolah Terlapor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Sekolah Terlapor:</span>
                  <button
                    type="button"
                    onClick={onBackToSchoolProfile}
                    className="font-bold text-[#2E6496] hover:underline flex items-center gap-1 truncate max-w-full text-left cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {currentReportData?.schoolName || school.name}
                    </span>
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Kategori Pungutan:</span>
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
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>Berkas Bukti ({currentReportData.attachments.length})</span>
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

              {/* ===============================================================
                  2. ANIMASI CENTANG 1, 2, 3, 4, 5 (STEPPER PROGRESS REALTIME)
                 =============================================================== */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Progres Penanganan Dinas Pendidikan
                  </h3>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Tahap {currentStageNumber} dari 5
                  </span>
                </div>

                {/* Stepper Bar Horisontal (Desktop) / Vertikal (Mobile) */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8]">
                  <div className="relative">
                    {/* Garis Penghubung Latar Belakang */}
                    <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-[#E4E0D8] -z-0" />
                    {/* Garis Penghubung Aktif */}
                    <div
                      className="hidden sm:block absolute top-4 left-6 h-0.5 bg-[#2E7D32] transition-all duration-500 ease-out -z-0"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((currentStageNumber - 1) / 4) * 100))}%`,
                      }}
                    />

                    {/* Titik-Titik Tahapan */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
                      {TRACKING_STAGES.map((st) => {
                        const isDone = st.step < currentStageNumber || currentStageNumber === 5;
                        const isCurrent = st.step === currentStageNumber && currentStageNumber !== 5;
                        const isUpcoming = st.step > currentStageNumber;

                        return (
                          <div
                            key={st.step}
                            className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2"
                          >
                            {/* Lingkaran Centang Animasi 1 2 3 4 5 */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 transform ${
                                isDone
                                  ? 'bg-[#2E7D32] text-white border-2 border-[#2E7D32] shadow-2xs scale-100 ring-2 ring-[#2E7D32]/20'
                                  : isCurrent
                                  ? 'bg-[#2E6496] text-white border-2 border-[#2E6496] shadow-xs ring-4 ring-[#2E6496]/20 scale-105 animate-pulse'
                                  : 'bg-[#FFFFFF] text-[#94A3B8] border-2 border-[#CBD5E1]'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-4 h-4 text-white stroke-[3] animate-scale-in" />
                              ) : (
                                <span className="font-mono">{st.step}</span>
                              )}
                            </div>

                            {/* Label Tahapan */}
                            <div className="space-y-0.5">
                              <div
                                className={`text-xs font-bold leading-tight ${
                                  isDone
                                    ? 'text-[#2E7D32]'
                                    : isCurrent
                                    ? 'text-[#2E6496]'
                                    : 'text-[#64748B]'
                                }`}
                              >
                                {st.label}
                              </div>
                              <p className="text-[10px] text-[#94A3B8] hidden sm:block">
                                {st.sublabel}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Keterangan Tahap Aktif */}
                <div className="p-3 rounded-xl bg-[#EBF3F8]/60 border border-[#C9DFDC] text-xs text-[#1E293B] flex items-start gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#2E6496] mr-1">
                      Status Saat Ini: {activeStageInfo.label}.
                    </span>
                    <span className="text-[#475569]">{activeStageInfo.description}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================================
                3. BALASAN RESMI DARI DINAS PENDIDIKAN DI BAWAHNYA
               =============================================================== */}
            <div className="bg-[#FFFFFF] border-2 border-[#2E6496]/30 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center font-bold">
                    <FileBadge2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sturdy-heading text-sm sm:text-base font-extrabold text-[#1E293B]">
                      Balasan & Berita Acara Dinas Pendidikan
                    </h3>
                    <span className="text-[11px] text-[#64748B]">
                      Tanggapan Resmi Pengawas Pembina & Inspektorat Daerah
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-[#EBF7EE] text-[#2E7D32] border border-[#2E7D32]/30 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resmi Diverifikasi</span>
                </span>
              </div>

              {/* Isi Balasan Resmi */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] border-b border-[#E4E0D8] pb-2">
                  <span className="font-bold text-[#1E293B]">
                    {currentReportData?.letterDocument?.verified_by ||
                      adminOfficerName}
                  </span>
                  <span>{currentReportData?.date || 'Hari ini'}</span>
                </div>

                <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed font-medium">
                  {currentReportData?.letterDocument?.admin_notes ||
                    adminOfficialNote ||
                    getDefaultDinasResponse(
                      currentStageNumber,
                      currentReportData?.schoolName || 'Sekolah Terlapor'
                    )}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#E4E0D8]">
                  <span>Status: <b>{activeStageInfo.label}</b></span>
                  <span className="font-mono text-[#2E6496]">No. Reg: {activeTicket}</span>
                </div>
              </div>
            </div>

            {/* ===============================================================
                4. PANEL PENGATUR STATUS DINAS PENDIDIKAN (REALTIME CONTROL)
               =============================================================== */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#2E6496]" />
                    <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                      Panel Verifikator Dinas Pendidikan
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Pilih status tahapan dan tuliskan balasan resmi yang tersimpan langsung ke basis data Supabase secara realtime.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAdminPanelOpen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#E4E0D8] text-xs font-bold text-[#2E6496] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isAdminPanelOpen ? 'Tutup Panel' : 'Atur Status'}</span>
                  {isAdminPanelOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isAdminPanelOpen && (
                <form onSubmit={handleSaveAdminReview} className="space-y-4 pt-1">
                  {/* Pilihan 5 Status yang Diminta User */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#1E293B] block">
                      Pilih Tahapan Penanganan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                      {TRACKING_STAGES.map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => {
                            setSelectedAdminStatus(st.key);
                            setAdminOfficialNote(
                              getDefaultDinasResponse(
                                st.step,
                                currentReportData?.schoolName || 'Sekolah Terlapor'
                              )
                            );
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedAdminStatus === st.key
                              ? 'bg-[#EBF3F8] border-[#2E6496] shadow-2xs ring-1 ring-[#2E6496]'
                              : 'bg-[#FAF8F5] border-[#E4E0D8] hover:border-[#2E6496]/40'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                selectedAdminStatus === st.key
                                  ? 'bg-[#2E6496] text-white'
                                  : 'bg-[#E4E0D8] text-[#64748B]'
                              }`}
                            >
                              {st.step}
                            </span>
                            <span className="font-bold text-[#1E293B] truncate">
                              {st.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pejabat Penelaah */}
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
                    </select>
                  </div>

                  {/* Catatan Balasan Resmi */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E293B] block">
                        Teks Balasan Resmi Dinas Pendidikan:
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAdminOfficialNote(
                            getDefaultDinasResponse(
                              getStageNumber(selectedAdminStatus),
                              currentReportData?.schoolName || 'Sekolah Terlapor'
                            )
                          )
                        }
                        className="text-[10px] text-[#2E6496] hover:underline cursor-pointer"
                      >
                        Gunakan Template Standar Tahap Ini
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={adminOfficialNote}
                      onChange={(e) => setAdminOfficialNote(e.target.value)}
                      placeholder="Tuliskan balasan resmi atau berita acara..."
                      className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 leading-relaxed"
                    />
                  </div>

                  {/* Tombol Simpan ke Supabase */}
                  <button
                    type="submit"
                    disabled={isSubmittingAdminReview}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-2xs active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAdminReview ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Perbarui Status & Simpan Balasan Dinas ke Database</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ===============================================================
                5. KOMUNIKASI 2 ARAH ANONIM (CHAT PELAPOR & VERIFIKATOR)
               =============================================================== */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2E6496]" />
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Riwayat Percakapan & Tanggapan Pelapor
                  </h3>
                </div>
                <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Identitas Dilindungi Sandi
                </span>
              </div>

              {/* Chat Stream */}
              <div className="space-y-3 max-h-72 overflow-y-auto p-1">
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

              {/* Reply Form */}
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
                    placeholder="Tulis balasan anonim tambahan kepada tim verifikator..."
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
