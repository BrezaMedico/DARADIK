import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Search,
  Copy,
  Check,
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
  FileBadge2,
  ChevronRight,
  FastForward,
} from 'lucide-react';
import { SchoolData, SMK_TI_BAZMA } from '../data/schoolsData';
import {
  supabase,
  getSavedReportsFromStorage,
  fetchAnonymousReportByTicket,
  fetchAllAnonymousReportsFromSupabase,
  updateReportByDinas,
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
  createdAtRaw?: string;
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
    description: 'Laporan telah diterima dan masuk ke sistem pelaporan resmi.',
  },
  {
    step: 2,
    key: 'MENUNGGU_VERIFIKASI',
    label: 'Menunggu Verifikasi',
    sublabel: 'Antrean Dinas',
    description: 'Laporan masuk antrean penelaahan pengawas BOSP Dinas Pendidikan.',
  },
  {
    step: 3,
    key: 'VERIFIKASI_LAPORAN',
    label: 'Verifikasi Laporan',
    sublabel: 'Telaah Bukti',
    description: 'Tim pemeriksa memverifikasi bukti kuitansi dan alokasi dana BOSP.',
  },
  {
    step: 4,
    key: 'PEMERIKSAAN_LAPANGAN',
    label: 'Pemeriksaan Lapangan',
    sublabel: 'Sidak & BAP',
    description: 'Tim auditor meminta klarifikasi langsung kepada pihak sekolah.',
  },
  {
    step: 5,
    key: 'TINDAK_LANJUT_SELESAI',
    label: 'Tindak Lanjut Selesai',
    sublabel: 'Putusan Resmi',
    description: 'Pemeriksaan tuntas dan keputusan resmi dinas telah diterbitkan.',
  },
];

// Opsi Putusan Resmi Dinas Pendidikan ketika tahap 5 selesai
export const DINAS_VERDICTS = {
  TERBUKTI: {
    type: 'TERBUKTI',
    badge: 'Terbukti Ada Pelanggaran Pungutan',
    badgeColor: 'bg-[#FDF2F2] text-[#DC2626] border-[#F5C6CB]',
    title: 'Berita Acara Pemeriksaan BOSP No. 421.5/BAP-BOSP/2026',
    actionText: 'Instruksi Pengembalian Dana 100% & Peringatan Tertulis',
    text: 'Berdasarkan hasil audit lapangan dan verifikasi bukti bersama tim pemeriksa BOSP, laporan dugaan pungutan terbukti melanggar Permendikbudristek No. 63/2022. Pihak sekolah telah menandatangani Berita Acara Pemeriksaan dan diwajibkan mengembalikan seluruh dana kepada orang tua siswa selambat-lambatnya 7 hari kerja di bawah pengawasan Inspektorat Daerah.',
  },
  TIDAK_TERBUKTI: {
    type: 'TIDAK_TERBUKTI',
    badge: 'Klarifikasi Selesai // Sesuai Ketentuan Komite',
    badgeColor: 'bg-[#EBF7EE] text-[#2E7D32] border-[#C3E6CB]',
    title: 'Berita Acara Klarifikasi No. 421.5/BAK-KOMITE/2026',
    actionText: 'Pungutan Dinyatakan Sesuai Prosedur & Laporan Ditutup',
    text: 'Tim Verifikator Dinas Pendidikan bersama Inspektorat Daerah telah meneliti dokumen SPJ dan pembukuan komite sekolah. Berdasarkan Berita Acara Klarifikasi, kegiatan tersebut merupakan sumbangan sukarela hasil kesepakatan musyawarah komite yang tidak mengikat sesuai Permendikbud No. 75/2016, serta tidak ada paksaan atau penahanan hak belajar siswa. Laporan dinyatakan selesai dan diarsipkan secara tertib.',
  },
};

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

// Format waktu dan tanggal terstruktur rapi
export function formatReportDateTime(dateStrOrIso?: string): {
  dateFormatted: string;
  timeFormatted: string;
} {
  const now = new Date();
  if (!dateStrOrIso) {
    return {
      dateFormatted: now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      timeFormatted: `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')} WIB`,
    };
  }

  const d = new Date(dateStrOrIso);
  if (isNaN(d.getTime())) {
    return {
      dateFormatted: dateStrOrIso,
      timeFormatted: '10:00 WIB',
    };
  }

  return {
    dateFormatted: d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    timeFormatted: `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')} WIB`,
  };
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

// Cookie Riwayat
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
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getStoredTrackedHistory(): TrackedReportItem[] {
  try {
    const fromCookie = getCookie(TRACKED_COOKIE_KEY);
    const fromStorage =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(TRACKED_COOKIE_KEY)
        : null;
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
  const [supabaseReportsList, setSupabaseReportsList] = useState<
    TrackedReportItem[]
  >([]);

  // 3. State Data Laporan Aktif
  const [currentReportData, setCurrentReportData] =
    useState<TrackedReportItem | null>(null);

  // 4. State Tahapan Saat Ini (1 sampai 5)
  // Untuk percobaan: mulai dari tahap 1 dan otomatis berpindah setiap 2 menit (120 detik)
  const [currentStageStep, setCurrentStageStep] = useState<number>(1);
  const [secondsUntilNextStage, setSecondsUntilNextStage] = useState<number>(120);

  // 5. State Putusan Dinas (TERBUKTI / TIDAK_TERBUKTI)
  const [verdictType, setVerdictType] = useState<'TERBUKTI' | 'TIDAK_TERBUKTI'>('TERBUKTI');

  // 6. State Chat 2 Arah
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState<string>('');
  const [replyError, setReplyError] = useState<string | null>(null);

  // Ref penanda waktu mulai simulasi
  const simulationStartTimeRef = useRef<number>(Date.now());

  // Load Riwayat & Supabase Reports saat Mount
  useEffect(() => {
    loadLocalAndSupabaseData();
  }, [ticketCode]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!activeTicket) return;

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
            const newStatus = String(row.status || 'LAPORAN_TERKIRIM');
            const newStep = getStageNumber(newStatus);
            setCurrentStageStep(newStep);

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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTicket]);

  // Timer Otomatis Simulasi 2 Menit (120 Detik per Tahap)
  useEffect(() => {
    if (!activeTicket || currentStageStep >= 5) return;

    const timer = setInterval(() => {
      setSecondsUntilNextStage((prev) => {
        if (prev <= 1) {
          // Berpindah ke tahap berikutnya
          setCurrentStageStep((curr) => {
            const next = Math.min(5, curr + 1);
            const nextStageObj = TRACKING_STAGES.find((s) => s.step === next);
            if (nextStageObj) {
              onShowToast(`Tahap penanganan diperbarui: ${nextStageObj.label}`);
            }
            return next;
          });
          return 120; // reset 2 menit lagi
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTicket, currentStageStep]);

  const loadLocalAndSupabaseData = async () => {
    const cookieHistory = getStoredTrackedHistory();
    const savedReports = getSavedReportsFromStorage();

    const mergedMap = new Map<string, TrackedReportItem>();

    savedReports.forEach((r: Record<string, unknown>) => {
      const code = String(r.ticket_code || '');
      if (code) {
        mergedMap.set(code, {
          ticketCode: code,
          schoolName: String(r.school_name || 'Sekolah Terpilih'),
          schoolNpsn: String(r.school_npsn || ''),
          category: String(r.category || 'Pungutan Sekolah'),
          date: r.created_at ? String(r.created_at) : new Date().toISOString(),
          createdAtRaw: r.created_at ? String(r.created_at) : new Date().toISOString(),
          status: String(r.status || 'LAPORAN_TERKIRIM'),
          notes: String(r.notes || ''),
        });
      }
    });

    cookieHistory.forEach((item) => {
      if (!mergedMap.has(item.ticketCode)) {
        mergedMap.set(item.ticketCode, item);
      }
    });

    const localItems = Array.from(mergedMap.values());
    setHistoryList(localItems);

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
            date: r.created_at,
            createdAtRaw: r.created_at,
            status: r.status || 'LAPORAN_TERKIRIM',
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

  // Resolusi data tiket pelaporan
  const resolveTicketData = async (
    code: string,
    fallbackList?: TrackedReportItem[]
  ) => {
    setIsLoadingReport(true);
    const cleaned = code.trim().toUpperCase();
    simulationStartTimeRef.current = Date.now();
    setSecondsUntilNextStage(120);

    // Tentukan ragam putusan berdasarkan akhiran nomor tiket (ganjil/genap)
    const lastDigit = parseInt(cleaned.replace(/\D/g, '').slice(-1) || '0', 10);
    setVerdictType(lastDigit % 2 === 0 ? 'TERBUKTI' : 'TIDAK_TERBUKTI');

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
          date: remote.created_at || new Date().toISOString(),
          createdAtRaw: remote.created_at || new Date().toISOString(),
          status: remote.status || 'LAPORAN_TERKIRIM',
          notes: remote.notes || remote.notes_encrypted || '',
          attachments: parsedAttachments,
          letterDocument: parsedDoc,
        };

        setCurrentReportData(resolvedItem);
        // Percobaan: selalu mulai dari tahap 1 saat dicek pertama kali
        setCurrentStageStep(1);
        buildChatStream(resolvedItem, parsedDoc);
        saveTrackedItemToHistory(resolvedItem);
        setIsLoadingReport(false);
        return;
      }
    } catch (err) {
      console.warn('[Resolve Ticket Remote]', err);
    }

    const currentList = fallbackList || historyList;
    const found = currentList.find(
      (i) => i.ticketCode.toUpperCase() === cleaned
    );

    if (found) {
      setCurrentReportData(found);
      setCurrentStageStep(1);
      buildChatStream(found, found.letterDocument);
      saveTrackedItemToHistory(found);
    } else {
      const nowIso = new Date().toISOString();
      const fallbackItem: TrackedReportItem = {
        ticketCode: cleaned,
        schoolName: school.name || 'SMK TI BAZMA',
        schoolNpsn: school.npsn || '70029710',
        category: reportCategory || 'Dugaan Pungutan',
        date: nowIso,
        createdAtRaw: nowIso,
        status: 'LAPORAN_TERKIRIM',
        notes: reporterNote,
      };
      setCurrentReportData(fallbackItem);
      setCurrentStageStep(1);
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
        timestamp: 'Waktu Kirim',
        text: item.notes.trim(),
      });
    }

    msgs.push({
      id: 'msg-dinas-initial',
      sender: 'dinas',
      senderLabel: 'Tim Verifikator Inspektorat & Dinas Pendidikan',
      timestamp: 'Sistem Terpadu',
      text: `Laporan untuk ${item.schoolName} telah diterima melalui jalur aman. Petugas pemeriksa sedang menelaah data administrasi dan bukti yang dilampirkan.`,
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

  // Pilih Tiket dari Riwayat
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
    onShowToast(`Kode tiket ${activeTicket} disalin.`);
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
      timestamp: `${hours}:${mins} WIB`,
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyInput('');
    onShowToast('Pesan balasan anonim Anda telah ditambahkan.');
  };

  // Tombol Simulasi Cepat: Langsung lompat ke tahap berikutnya (+2 Menit)
  const handleFastForwardStage = () => {
    if (currentStageStep < 5) {
      const nextStep = currentStageStep + 1;
      setCurrentStageStep(nextStep);
      setSecondsUntilNextStage(120);
      const stageObj = TRACKING_STAGES.find((s) => s.step === nextStep);
      onShowToast(`Simulasi: Berpindah ke Tahap ${nextStep} (${stageObj?.label})`);
    } else {
      setCurrentStageStep(1);
      setSecondsUntilNextStage(120);
      onShowToast('Simulasi: Diulang kembali dari Tahap 1 (Laporan Terkirim)');
    }
  };

  const activeStageInfo =
    TRACKING_STAGES.find((s) => s.step === currentStageStep) ||
    TRACKING_STAGES[0];

  const dateTimeMeta = formatReportDateTime(
    currentReportData?.createdAtRaw || currentReportData?.date
  );

  const selectedVerdict = DINAS_VERDICTS[verdictType];

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-view-enter">
      {/* Container Bersih Sederhana Max-W-3XL */}
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-7">
        {/* Navigasi Atas */}
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

        {/* Form Pencarian Tiket (Sederhana & Bersih) */}
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
          <div className="space-y-1">
            <h1 className="font-sturdy-heading text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
              Lacak Status Penanganan Laporan
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Masukkan kode tiket untuk memantau status pemeriksaan dinas secara langsung.
            </p>
          </div>

          <form onSubmit={handleCheckTicket} className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] uppercase placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
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
            KONDISI A: DEFAULT KOSONG (Belum Membuka Tiket)
           =================================================================== */}
        {!activeTicket ? (
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4 animate-view-enter">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#2E6496]" />
                <h2 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                  Riwayat Laporan Terakhir
                </h2>
              </div>

              {historyList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[11px] text-[#64748B] hover:text-[#DC2626] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {(supabaseReportsList.length > 0 ? supabaseReportsList : historyList)
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.ticketCode}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] hover:border-[#2E6496]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md">
                          {item.ticketCode}
                        </span>
                        <span className="text-[#64748B] text-[11px]">
                          {formatReportDateTime(item.date).dateFormatted}
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
                      className="px-4 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#2E6496] hover:text-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                    >
                      Buka Lacak
                    </button>
                  </div>
                ))}

              {supabaseReportsList.length === 0 && historyList.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-[#64748B]">
                    Belum ada riwayat pelaporan di perangkat ini.
                  </p>
                  {onOpenAnonymousReport && (
                    <button
                      type="button"
                      onClick={onOpenAnonymousReport}
                      className="text-xs font-bold text-[#2E6496] hover:underline cursor-pointer"
                    >
                      Buat Laporan Baru
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================================
              KONDISI B: TIKET AKTIF DITEMUKAN
              STATUS REALTIME BERSIH + ANIMASI CENTANG 1-5 + BALASAN DINAS
             =================================================================== */
          <div className="space-y-6 animate-view-enter">
            {/* 1. KARTU INFORMASI UTAMA & STATUS (TENANG, SOLID, TANPA KEDIP-KEDIP) */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-5">
              {/* Header Kode Tiket & Status Badge Diam (Solid) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E0D8]">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#2E6496] font-bold block uppercase tracking-wider">
                    KODE TIKET PELAPORAN
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-extrabold text-[#1E293B] tracking-tight">
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

                {/* Status Badge: Tenang, Tidak Berkedip, Warna Jelas */}
                <div className="self-start sm:self-auto">
                  <div
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                      currentStageStep === 5
                        ? verdictType === 'TERBUKTI'
                          ? 'bg-[#FDF2F2] text-[#DC2626] border-[#F5C6CB]'
                          : 'bg-[#EBF7EE] text-[#2E7D32] border-[#C3E6CB]'
                        : currentStageStep >= 3
                        ? 'bg-[#FFF8E6] text-[#D97706] border-[#FCE8B2]'
                        : 'bg-[#EBF3F8] text-[#2E6496] border-[#C9DFDC]'
                    }`}
                  >
                    {/* Lingkaran Status Solid Tanpa Animasi Kedip */}
                    <span className="w-2.5 h-2.5 rounded-full bg-current shrink-0" />
                    <span>{activeStageInfo.label}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Rapi: Sekolah, Kategori, dan Waktu (Tanggal & Jam Rapi) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#64748B] block font-medium">
                    Sekolah Terlapor:
                  </span>
                  <button
                    type="button"
                    onClick={onBackToSchoolProfile}
                    className="font-bold text-[#2E6496] hover:underline flex items-center gap-1.5 truncate max-w-full text-left cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {currentReportData?.schoolName || school.name}
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#64748B] block font-medium">
                    Kategori Pengaduan:
                  </span>
                  <span className="font-bold text-[#1E293B] block truncate">
                    {currentReportData?.category || reportCategory}
                  </span>
                </div>

                {/* Penempatan Waktu Rapi & Enak Dilihat */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[#64748B] block font-medium">
                    Waktu Pengiriman:
                  </span>
                  <div className="flex items-center gap-1.5 text-[#1E293B] font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <span>{dateTimeMeta.dateFormatted}</span>
                    <span className="text-[#94A3B8]">•</span>
                    <span className="font-mono text-[#2E6496]">
                      {dateTimeMeta.timeFormatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bukti Dokumen Terlampir jika ada */}
              {currentReportData?.attachments &&
                currentReportData.attachments.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] space-y-1.5">
                    <span className="text-[11px] font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2E6496]" />
                      <span>
                        Dokumen Bukti ({currentReportData.attachments.length})
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentReportData.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E4E0D8] text-[11px] text-[#1E293B] flex items-center gap-1.5"
                        >
                          <FileCheck className="w-3 h-3 text-[#2E7D32]" />
                          <span className="font-medium truncate max-w-[200px]">
                            {att.name}
                          </span>
                          <span className="text-[#64748B]">
                            ({att.sizeFormatted})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* ===============================================================
                  2. STEPPER PROGRESS (ANIMASI CENTANG 1, 2, 3, 4, 5 SOLID)
                 =============================================================== */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-sturdy-heading text-sm font-bold text-[#1E293B]">
                    Tahapan Penanganan
                  </h3>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Tahap {currentStageStep} dari 5
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8]">
                  <div className="relative">
                    {/* Garis Penghubung Latar Belakang */}
                    <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-[#E4E0D8] -z-0" />
                    {/* Garis Penghubung Aktif Hijau Solid */}
                    <div
                      className="hidden sm:block absolute top-4 left-6 h-0.5 bg-[#2E7D32] transition-all duration-500 ease-out -z-0"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, ((currentStageStep - 1) / 4) * 100)
                        )}%`,
                      }}
                    />

                    {/* 5 Titik Tahapan */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 relative z-10">
                      {TRACKING_STAGES.map((st) => {
                        const isDone =
                          st.step < currentStageStep || currentStageStep === 5;
                        const isCurrent =
                          st.step === currentStageStep && currentStageStep !== 5;

                        return (
                          <div
                            key={st.step}
                            className="flex sm:flex-col items-center sm:text-center gap-2.5 sm:gap-1.5"
                          >
                            {/* Lingkaran Centang: Centang Hijau Mulus / Angka Solid Diam */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                                isDone
                                  ? 'bg-[#2E7D32] text-white border-2 border-[#2E7D32] shadow-2xs'
                                  : isCurrent
                                  ? 'bg-[#2E6496] text-white border-2 border-[#2E6496] shadow-xs'
                                  : 'bg-[#FFFFFF] text-[#94A3B8] border-2 border-[#CBD5E1]'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                              ) : (
                                <span className="font-mono">{st.step}</span>
                              )}
                            </div>

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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================================
                3. BALASAN DARI DINAS PENDIDIKAN
                (HANYA MUNCUL KETIKA TAHAP 5 / TINDAK LANJUT SELESAI)
               =============================================================== */}
            {currentStageStep === 5 ? (
              <div className="bg-[#FFFFFF] border-2 border-[#2E6496]/40 rounded-2xl p-6 shadow-xs space-y-4 animate-view-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E0D8]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center font-bold shrink-0">
                      <FileBadge2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-sturdy-heading text-sm sm:text-base font-extrabold text-[#1E293B]">
                        Putusan & Berita Acara Dinas Pendidikan
                      </h3>
                      <span className="text-[11px] text-[#64748B]">
                        Hasil Resmi Pemeriksaan Lapangan & Audit Inspektorat Daerah
                      </span>
                    </div>
                  </div>

                  {/* Badge Putusan */}
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border self-start sm:self-auto ${selectedVerdict.badgeColor}`}
                  >
                    {selectedVerdict.badge}
                  </span>
                </div>

                {/* Surat Hasil Putusan Resmi */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] border-b border-[#E4E0D8] pb-2">
                    <span className="font-bold text-[#1E293B]">
                      {selectedVerdict.title}
                    </span>
                    <span>{dateTimeMeta.dateFormatted}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed font-normal">
                    {selectedVerdict.text}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#475569] border-t border-[#E4E0D8]">
                    <span className="font-semibold text-[#2E6496]">
                      Tindak Lanjut: {selectedVerdict.actionText}
                    </span>
                    <span className="font-mono text-[#64748B]">
                      No. Tiket: {activeTicket}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* KETIKA BELUM TAHAP 5: TAMPILKAN STATUS PENJELASAN RINGKAS */
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs text-[#475569] flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#2E6496] shrink-0" />
                  <div>
                    <span className="font-bold text-[#1E293B] block">
                      Pemeriksaan Berkas Sedang Berjalan
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Balasan resmi dan surat putusan dari Dinas Pendidikan akan diterbitkan di sini secara otomatis setelah tahapan tindak lanjut selesai.
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-[#2E6496] bg-[#EBF3F8] px-2 py-1 rounded-md shrink-0 font-semibold hidden sm:inline-block">
                  Tahap {currentStageStep}/5
                </span>
              </div>
            )}

            {/* ===============================================================
                4. KONTROL SIMULASI DUMMY 2 MENIT (UNTUK PENGUJIAN)
               =============================================================== */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1E293B]">
                    Mode Pengujian Otomatis
                  </span>
                  <span className="text-[10px] bg-[#EBF3F8] text-[#2E6496] px-1.5 py-0.2 rounded font-mono font-bold">
                    Tiap 2 Menit
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  {currentStageStep < 5
                    ? `Berpindah otomatis ke tahap berikutnya dalam ${Math.floor(
                        secondsUntilNextStage / 60
                      )}:${String(secondsUntilNextStage % 60).padStart(2, '0')}`
                    : 'Tahap akhir selesai. Surat putusan resmi telah diterbitkan.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle Putusan untuk Pengujian Tahap 5 */}
                {currentStageStep === 5 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVerdictType((prev) =>
                        prev === 'TERBUKTI' ? 'TIDAK_TERBUKTI' : 'TERBUKTI'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-[11px] font-bold text-[#2E6496] transition-all cursor-pointer"
                  >
                    Ganti Ragam Putusan ({verdictType === 'TERBUKTI' ? 'Terbukti' : 'Tidak Terbukti'})
                  </button>
                )}

                {/* Tombol Percepat */}
                <button
                  type="button"
                  onClick={handleFastForwardStage}
                  className="px-3 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:translate-y-[1px]"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>
                    {currentStageStep < 5
                      ? 'Lompat ke Tahap Berikutnya'
                      : 'Ulang dari Tahap 1'}
                  </span>
                </button>
              </div>
            </div>

            {/* ===============================================================
                5. KOMUNIKASI 2 ARAH ANONIM (CHAT RINGKAS PELAPOR)
               =============================================================== */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2E6496]" />
                  <h3 className="font-sturdy-heading text-sm font-bold text-[#1E293B]">
                    Tanggapan & Balasan Pelapor
                  </h3>
                </div>
                <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Jalur Aman Terenkripsi
                </span>
              </div>

              {/* Chat Stream */}
              <div className="space-y-3 max-h-64 overflow-y-auto p-1">
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
                        className={`max-w-[90%] sm:max-w-[80%] p-3 rounded-xl text-xs leading-relaxed border ${
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

              {/* Form Balasan */}
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
                    placeholder="Kirim pesan tambahan kepada tim verifikator..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold active:translate-y-[1px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
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
