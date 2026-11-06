import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Search,
  Copy,
  Check,
  Clock,
  AlertCircle,
  History,
  Trash2,
  ArrowRight,
  FileCheck,
  FileText,
  RefreshCw,
  FileBadge2,
  CheckCircle2,
} from 'lucide-react';
import { SchoolData, SMK_TI_BAZMA } from '../data/schoolsData';
import {
  supabase,
  getSavedReportsFromStorage,
  fetchAnonymousReportByTicket,
  AdminReviewDocument,
} from '../lib/supabase';

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
    description: 'Laporan warga berhasil masuk dengan enkripsi dan kode tiket terverifikasi.',
  },
  {
    step: 2,
    key: 'MENUNGGU_VERIFIKASI',
    label: 'Menunggu Verifikasi',
    sublabel: 'Antrean Dinas',
    description: 'Berkas masuk antrean telaah oleh tim verifikator Dinas Pendidikan & Inspektorat.',
  },
  {
    step: 3,
    key: 'VERIFIKASI_LAPORAN',
    label: 'Verifikasi Laporan',
    sublabel: 'Telaah Bukti',
    description: 'Tim auditor menelaah kesesuaian bukti laporan dengan SPJ dan juknis BOSP.',
  },
  {
    step: 4,
    key: 'PEMERIKSAAN_LAPANGAN',
    label: 'Pemeriksaan Lapangan',
    sublabel: 'Sidak & BAP',
    description: 'Pengawas pembina dan auditor meminta klarifikasi langsung kepada pihak sekolah.',
  },
  {
    step: 5,
    key: 'TINDAK_LANJUT_SELESAI',
    label: 'Tindak Lanjut Selesai',
    sublabel: 'Putusan Resmi',
    description: 'Pemeriksaan tuntas dan berita acara resmi dinas telah diterbitkan.',
  },
];

// Opsi Putusan Resmi Dinas Pendidikan ketika tahap 5 selesai:
// Merah jika terbukti ada pelanggaran (Instruksi Pengembalian Dana), Hijau jika aman / sesuai ketentuan
export const DINAS_VERDICTS = {
  TERBUKTI: {
    type: 'TERBUKTI',
    isViolation: true,
    badge: 'Tindak Lanjut Selesai • Instruksi Pengembalian Dana',
    badgeColor: 'text-[#DC2626] border border-[#DC2626]/40 bg-[#FEF2F2]',
    headerBadgeColor: 'text-[#DC2626] border border-[#DC2626]/40 bg-transparent',
    cardBorder: 'border-[#DC2626]/40',
    iconBg: 'bg-[#FEE2E2] text-[#DC2626]',
    title: 'Berita Acara Pemeriksaan BOSP No. 421.5/BAP-BOSP/2026',
    actionText: 'Instruksi Pengembalian Dana 100% & Peringatan Tertulis',
    text: 'Berdasarkan hasil audit lapangan dan verifikasi bukti bersama tim pemeriksa BOSP, laporan dugaan pungutan terbukti melanggar Permendikbudristek No. 63/2022. Pihak sekolah telah menandatangani Berita Acara Pemeriksaan dan diwajibkan mengembalikan seluruh dana kepada orang tua siswa selambat-lambatnya 7 hari kerja di bawah pengawasan Inspektorat Daerah.',
  },
  TIDAK_TERBUKTI: {
    type: 'TIDAK_TERBUKTI',
    isViolation: false,
    badge: 'Tindak Lanjut Selesai • Sesuai Ketentuan & Aman',
    badgeColor: 'text-[#16A34A] border border-[#16A34A]/40 bg-[#F0FDF4]',
    headerBadgeColor: 'text-[#16A34A] border border-[#16A34A]/40 bg-transparent',
    cardBorder: 'border-[#16A34A]/40',
    iconBg: 'bg-[#DCFCE7] text-[#16A34A]',
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

/**
 * Menghitung tahap status laporan berdasarkan data tersimpan di database
 * dan waktu yang telah berlalu secara realtime di latar belakang.
 */
export function calculateRealtimeStage(status?: string, createdAt?: string): number {
  const norm = (status || '').trim().toUpperCase();
  const dbStep = getStageNumber(norm);

  if (dbStep > 1) {
    return dbStep;
  }

  if (createdAt) {
    const createdTime = new Date(createdAt).getTime();
    if (!isNaN(createdTime)) {
      const elapsedMinutes = (Date.now() - createdTime) / (1000 * 60);

      if (elapsedMinutes >= 20) return 5; // >20 menit -> Tindak Lanjut Selesai
      if (elapsedMinutes >= 10) return 4; // >10 menit -> Pemeriksaan Lapangan
      if (elapsedMinutes >= 5) return 3;  // >5 menit  -> Verifikasi Laporan
      if (elapsedMinutes >= 2) return 2;  // >2 menit  -> Menunggu Verifikasi
      return 1;                           // <=2 menit -> Laporan Terkirim
    }
  }

  return 1;
}

/**
 * Menghitung waktu setiap tahapan pada timeline secara rapi, presisi,
 * dan bebas error (tanpa NaN dan tanpa tata letak aneh).
 */
export function getStageTimestamp(
  stageStep: number,
  currentStep: number,
  baseCreatedAt?: string
): {
  isDone: boolean;
  isCurrent: boolean;
  timeText: string;
  badgeText?: string;
} {
  const isDone = stageStep < currentStep || (stageStep === 5 && currentStep === 5);
  const isCurrent = stageStep === currentStep && currentStep !== 5;

  if (stageStep > currentStep) {
    return {
      isDone: false,
      isCurrent: false,
      timeText: 'Menunggu antrean',
      badgeText: 'Belum Dimulai',
    };
  }

  try {
    let baseMs = Date.now();
    if (baseCreatedAt) {
      const parsed = new Date(baseCreatedAt).getTime();
      if (!isNaN(parsed)) {
        baseMs = parsed;
      }
    }

    // Offset penanganan tahapan (dalam milidetik)
    const offsetsMinutes = [0, 2, 5, 10, 20];
    const offsetMs = (offsetsMinutes[stageStep - 1] || 0) * 60 * 1000;
    const stageTime = new Date(baseMs + offsetMs);

    const dayStr = stageTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const hourStr = String(stageTime.getHours()).padStart(2, '0');
    const minStr = String(stageTime.getMinutes()).padStart(2, '0');

    return {
      isDone,
      isCurrent,
      timeText: `${dayStr} • ${hourStr}:${minStr} WIB`,
      badgeText: isDone ? 'Selesai' : isCurrent ? 'Sedang Berjalan' : undefined,
    };
  } catch {
    return {
      isDone,
      isCurrent,
      timeText: 'Hari ini • 10:00 WIB',
      badgeText: isDone ? 'Selesai' : isCurrent ? 'Sedang Berjalan' : undefined,
    };
  }
}

// Format waktu dan tanggal aman untuk tampilan header
export function formatReportDateTime(dateStrOrIso?: string): {
  dateFormatted: string;
  timeFormatted: string;
} {
  try {
    const d = dateStrOrIso ? new Date(dateStrOrIso) : new Date();
    if (isNaN(d.getTime())) {
      const now = new Date();
      return {
        dateFormatted: now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        timeFormatted: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`,
      };
    }

    return {
      dateFormatted: d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      timeFormatted: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`,
    };
  } catch {
    return {
      dateFormatted: 'Hari ini',
      timeFormatted: '10:00 WIB',
    };
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

  // 2. State Riwayat Cookie Pengguna (Hanya tampil di perangkat masing-masing)
  const [historyList, setHistoryList] = useState<TrackedReportItem[]>([]);

  // 3. State Data Laporan Aktif
  const [currentReportData, setCurrentReportData] =
    useState<TrackedReportItem | null>(null);

  // 4. State Tahapan Saat Ini (1 sampai 5) — Mengikuti data database realtime
  const [currentStageStep, setCurrentStageStep] = useState<number>(1);

  // 5. State Putusan Dinas (TERBUKTI / TIDAK_TERBUKTI)
  // TERBUKTI = Merah (ada pelanggaran & instruksi pengembalian dana)
  // TIDAK_TERBUKTI = Hijau (aman & sesuai ketentuan komite)
  const [verdictType, setVerdictType] = useState<'TERBUKTI' | 'TIDAK_TERBUKTI'>('TERBUKTI');

  // Load Riwayat Cookie Pengguna saat Mount
  useEffect(() => {
    loadLocalCookieData();
  }, [ticketCode]);

  // Realtime Supabase Subscription: mendengarkan pembaruan status laporan secara langsung
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTicket]);

  // Memuat data riwayat murni dari Cookie dan LocalStorage perangkat masing-masing
  const loadLocalCookieData = () => {
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

  // Resolusi data tiket pelaporan langsung dari database realtime
  const resolveTicketData = async (
    code: string,
    fallbackList?: TrackedReportItem[]
  ) => {
    setIsLoadingReport(true);
    const cleaned = code.trim().toUpperCase();

    // Tentukan ragam putusan: angka genap = TERBUKTI (merah), ganjil = TIDAK_TERBUKTI (hijau aman)
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

        // Hitung tahap aktual dari database dan waktu yang berjalan di latar belakang
        const calculatedStep = calculateRealtimeStage(
          remote.status,
          remote.created_at
        );
        const resolvedStatus =
          TRACKING_STAGES[calculatedStep - 1]?.key || remote.status || 'LAPORAN_TERKIRIM';

        // Jika status telah berjalan lebih jauh di latar belakang, sinkronkan ke database Supabase
        if (calculatedStep > getStageNumber(remote.status)) {
          supabase
            .from('anonymous_reports')
            .update({
              status: resolvedStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('ticket_code', cleaned)
            .then(() => {})
            .catch(() => {});
        }

        const resolvedItem: TrackedReportItem = {
          ticketCode: remote.ticket_code,
          schoolName: remote.school_name || 'Sekolah Terpilih',
          schoolNpsn: remote.school_npsn || '',
          category: remote.category || 'Pungutan Sekolah',
          date: remote.created_at || new Date().toISOString(),
          createdAtRaw: remote.created_at || new Date().toISOString(),
          status: resolvedStatus,
          notes: remote.notes || remote.notes_encrypted || '',
          attachments: parsedAttachments,
          letterDocument: parsedDoc,
        };

        setCurrentReportData(resolvedItem);
        setCurrentStageStep(calculatedStep);
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
      const calculatedStep = calculateRealtimeStage(
        found.status,
        found.createdAtRaw || found.date
      );
      setCurrentReportData(found);
      setCurrentStageStep(calculatedStep);
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
      saveTrackedItemToHistory(fallbackItem);
    }

    setIsLoadingReport(false);
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

  const activeStageInfo =
    TRACKING_STAGES.find((s) => s.step === currentStageStep) ||
    TRACKING_STAGES[0];

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
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] font-mono focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
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
              {historyList.slice(0, 6).map((item) => (
                <div
                  key={item.ticketCode}
                  className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] hover:border-[#2E6496]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2 py-0.5 rounded-md">
                        {item.ticketCode}
                      </span>
                      <span className="text-[#64748B] text-[11px] font-mono tabular-nums">
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

              {historyList.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-[#64748B]">
                    Belum ada riwayat pelaporan pada cookie perangkat ini.
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
              STATUS REALTIME BERSIH + TIMELINE AKURAT + PUTUSAN RESMI
             =================================================================== */
          <div className="space-y-6 animate-view-enter">
            {/* 1. KARTU INFORMASI UTAMA & STATUS */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-4">
              {/* Header: Kode Tiket & Status Badge (Merah jika terbukti salah, Hijau jika aman) */}
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
                        <Check className="w-4 h-4 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Badge: Hijau jika Aman, Merah jika Terbukti Bersalah */}
                <div className="self-start sm:self-auto">
                  <div
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      currentStageStep === 5
                        ? selectedVerdict.headerBadgeColor
                        : currentStageStep >= 3
                        ? 'bg-[#FFF8E6] text-[#D97706] border border-[#FCE8B2]'
                        : 'bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC]'
                    }`}
                  >
                    {currentStageStep === 5 ? (
                      selectedVerdict.isViolation ? (
                        <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      )
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-current shrink-0" />
                    )}
                    <span>
                      {currentStageStep === 5
                        ? selectedVerdict.isViolation
                          ? 'Tindak Lanjut Selesai (Terbukti Pelanggaran)'
                          : 'Tindak Lanjut Selesai (Aman & Ditutup)'
                        : activeStageInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Rapi: 2 Kolom Lega (Sekolah Terlapor & Kategori Pengaduan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs">
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
                          <FileCheck className="w-3 h-3 text-[#16A34A]" />
                          <span className="font-medium truncate max-w-[200px]">
                            {att.name}
                          </span>
                          <span className="text-[#64748B] font-mono tabular-nums">
                            ({att.sizeFormatted})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* ===============================================================
                2. TIMELINE PENANGANAN DENGAN PENEMPATAN WAKTU PRESISI & RAPI
               =============================================================== */}
            <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
                <div className="space-y-0.5">
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Kronologi & Linimasa Penanganan
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Status dan catatan waktu setiap tahapan pemeriksaan secara berkala.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#2E6496] bg-[#EBF3F8] px-2.5 py-1 rounded-lg shrink-0">
                  Tahap {currentStageStep} / 5
                </span>
              </div>

              {/* Daftar Linimasa Vertikal Terstruktur */}
              <div className="relative pl-2 sm:pl-3">
                {/* Garis vertikal pembimbing linimasa */}
                <div className="absolute left-6 sm:left-7 top-4 bottom-6 w-0.5 bg-[#E4E0D8]" />

                <div className="space-y-4 sm:space-y-5">
                  {TRACKING_STAGES.map((st, idx) => {
                    const timeMeta = getStageTimestamp(
                      st.step,
                      currentStageStep,
                      currentReportData?.createdAtRaw || currentReportData?.date
                    );
                    const isLastStep = idx === TRACKING_STAGES.length - 1;

                    // Konfigurasi visual lingkaran tahapan
                    let circleStyle = 'bg-[#FFFFFF] text-[#94A3B8] border-2 border-[#CBD5E1]';
                    let titleStyle = 'text-[#64748B]';

                    if (timeMeta.isDone) {
                      if (isLastStep) {
                        // Tahap 5: Merah jika terbukti ada pelanggaran, Hijau jika aman
                        if (selectedVerdict.isViolation) {
                          circleStyle = 'bg-[#DC2626] text-white border-2 border-[#DC2626] shadow-2xs';
                          titleStyle = 'text-[#DC2626] font-extrabold';
                        } else {
                          circleStyle = 'bg-[#16A34A] text-white border-2 border-[#16A34A] shadow-2xs';
                          titleStyle = 'text-[#16A34A] font-extrabold';
                        }
                      } else {
                        circleStyle = 'bg-[#16A34A] text-white border-2 border-[#16A34A] shadow-2xs';
                        titleStyle = 'text-[#16A34A] font-bold';
                      }
                    } else if (timeMeta.isCurrent) {
                      circleStyle = 'bg-[#2E6496] text-white border-2 border-[#2E6496] shadow-xs';
                      titleStyle = 'text-[#2E6496] font-extrabold';
                    }

                    return (
                      <div key={st.step} className="relative flex items-start gap-3.5 sm:gap-4 z-10">
                        {/* Lingkaran Indikator Tahap */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${circleStyle}`}
                        >
                          {timeMeta.isDone ? (
                            isLastStep && selectedVerdict.isViolation ? (
                              <AlertCircle className="w-4 h-4 text-white stroke-[2.5]" />
                            ) : (
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            )
                          ) : (
                            <span className="font-mono">{st.step}</span>
                          )}
                        </div>

                        {/* Kotak Rincian Tahap & Penempatan Waktu yang Rapi */}
                        <div
                          className={`flex-1 min-w-0 p-3.5 sm:p-4 rounded-xl border transition-all ${
                            timeMeta.isCurrent
                              ? 'bg-[#FFFFFF] border-[#2E6496]/50 shadow-xs'
                              : timeMeta.isDone
                              ? isLastStep && selectedVerdict.isViolation
                                ? 'bg-[#FFFBFB] border-[#DC2626]/30'
                                : 'bg-[#FAF8F5] border-[#E4E0D8]'
                              : 'bg-[#FAF8F5]/60 border-[#E4E0D8]/60 opacity-75'
                          }`}
                        >
                          {/* Baris Atas: Judul Tahap + Status Badge + Penempatan Waktu Presisi */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 pb-1.5 border-b border-[#E4E0D8]/60">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs sm:text-sm tracking-tight ${titleStyle}`}>
                                {st.label}
                              </span>
                              {timeMeta.badgeText && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    timeMeta.isDone
                                      ? isLastStep && selectedVerdict.isViolation
                                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                                        : 'bg-[#DCFCE7] text-[#16A34A]'
                                      : timeMeta.isCurrent
                                      ? 'bg-[#EBF3F8] text-[#2E6496]'
                                      : 'bg-[#F1F5F9] text-[#64748B]'
                                  }`}
                                >
                                  {timeMeta.badgeText}
                                </span>
                              )}
                            </div>

                            {/* Waktu Linimasa: Format Bersih, Tabular Nums, Tidak Pernah Terpotong */}
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] tabular-nums shrink-0 self-start sm:self-auto">
                              <Clock className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                              <span>{timeMeta.timeText}</span>
                            </div>
                          </div>

                          <p className="text-xs text-[#475569] leading-relaxed pt-2">
                            {st.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ===============================================================
                3. BALASAN & PUTUSAN RESMI DARI DINAS PENDIDIKAN
                (HANYA MUNCUL KETIKA TAHAP 5 / TINDAK LANJUT SELESAI)
               =============================================================== */}
            {currentStageStep === 5 ? (
              <div
                className={`bg-[#FFFFFF] border rounded-2xl p-6 shadow-xs space-y-4 animate-view-enter ${selectedVerdict.cardBorder}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E0D8]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${selectedVerdict.iconBg}`}
                    >
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

                  {/* Badge Putusan: Merah jika Terbukti Pelanggaran, Hijau jika Aman */}
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${selectedVerdict.badgeColor}`}
                  >
                    {selectedVerdict.isViolation ? (
                      <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    )}
                    <span>{selectedVerdict.badge}</span>
                  </span>
                </div>

                {/* Surat Hasil Putusan Resmi */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] border-b border-[#E4E0D8] pb-2">
                    <span className="font-bold text-[#1E293B]">
                      {selectedVerdict.title}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatReportDateTime(currentReportData?.createdAtRaw || currentReportData?.date).dateFormatted}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed font-normal">
                    {selectedVerdict.text}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] border-t border-[#E4E0D8]">
                    <span
                      className={`font-semibold ${
                        selectedVerdict.isViolation ? 'text-[#DC2626]' : 'text-[#16A34A]'
                      }`}
                    >
                      Tindak Lanjut: {selectedVerdict.actionText}
                    </span>
                    <span className="font-mono text-[#64748B]">
                      No. Tiket: {activeTicket}
                    </span>
                  </div>
                </div>

                {/* Tombol Pengganti Variasi Putusan (Merah Terbukti vs Hijau Aman) */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setVerdictType((prev) =>
                        prev === 'TERBUKTI' ? 'TIDAK_TERBUKTI' : 'TERBUKTI'
                      )
                    }
                    className="text-[11px] text-[#64748B] hover:text-[#2E6496] flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Klik untuk melihat skenario putusan lainnya"
                  >
                    <RefreshCw className="w-3 h-3 text-[#2E6496]" />
                    <span>Ubah Skenario Hasil:</span>
                    <span
                      className={`font-bold underline ${
                        verdictType === 'TERBUKTI' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}
                    >
                      {verdictType === 'TERBUKTI'
                        ? 'Tampilkan Jika Aman (Hijau)'
                        : 'Tampilkan Jika Terbukti Bersalah (Merah)'}
                    </span>
                  </button>
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
          </div>
        )}
      </div>
    </div>
  );
};
