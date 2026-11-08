import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronRight,
  FileText,
  RefreshCw,
  CheckCircle2,
  MessageSquare,
  Upload,
  Send,
  Paperclip,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  supabase,
  PublicReportTrackingPayload,
  ReportAttachmentMeta,
  fetchPublicReportTrackingRpc,
  submitReporterAdditionalInfoRpc,
  uploadReportEvidenceFile,
} from '../lib/supabase';
import {
  buildParentTimelineStages,
  formatWibDateTime,
  getInspectionMethodLabel,
  getParentStatusLabel,
  getResolutionOutcomeOption,
} from '../lib/reportTracking';
import { computeTicketSignalHash } from '../lib/cryptoSecurity';

interface TicketBookmarkItem {
  ticketCode: string;
  schoolName: string;
  schoolNpsn?: string;
  category: string;
  createdAt?: string;
}

interface LiveTrackingPageProps {
  ticketCode?: string;
  onBackToHome: () => void;
  onOpenAnonymousReport?: () => void;
  onShowToast: (message: string) => void;
}

interface PendingReplyFile {
  id: string;
  name: string;
  sizeFormatted: string;
  blob: Blob;
  previewUrl?: string;
}

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

function readTicketBookmarksFromCookie(): TicketBookmarkItem[] {
  try {
    let raw = getCookie(TRACKED_COOKIE_KEY);
    if (!raw && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(TRACKED_COOKIE_KEY);
      if (raw) {
        setCookie(TRACKED_COOKIE_KEY, raw, 90);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => String(item?.ticketCode || '').trim().startsWith('CHK-'))
      .map((item) => ({
        ticketCode: String(item.ticketCode).trim(),
        schoolName: String(item.schoolName || 'Sekolah Terlapor'),
        schoolNpsn: item.schoolNpsn ? String(item.schoolNpsn) : undefined,
        category: String(item.category || 'Laporan Pengaduan'),
        createdAt: String(item.createdAt || item.createdAtRaw || item.date || ''),
      }));
  } catch {
    return [];
  }
}

function writeTicketBookmarkToCookie(bookmark: TicketBookmarkItem) {
  try {
    const current = readTicketBookmarksFromCookie();
    const next = [
      bookmark,
      ...current.filter((b) => b.ticketCode !== bookmark.ticketCode),
    ].slice(0, 15);
    setCookie(TRACKED_COOKIE_KEY, JSON.stringify(next), 90);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TRACKED_COOKIE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
}

function compressReplyAttachment(file: File): Promise<PendingReplyFile> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        blob: file,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1280;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  sizeFormatted: `${Math.max(1, Math.round(blob.size / 1024))} KB`,
                  blob,
                  previewUrl: URL.createObjectURL(blob),
                });
              } else {
                resolve({
                  id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: file.name,
                  sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                  blob: file,
                });
              }
            },
            'image/jpeg',
            0.78
          );
        } else {
          resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            blob: file,
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const LiveTrackingPage: React.FC<LiveTrackingPageProps> = ({
  ticketCode = '',
  onBackToHome,
  onOpenAnonymousReport,
  onShowToast,
}) => {
  const [ticketInput, setTicketInput] = useState<string>(ticketCode || '');
  const [activeTicket, setActiveTicket] = useState<string>(
    ticketCode ? ticketCode.trim() : ''
  );
  const [viewMode, setViewMode] = useState<'list' | 'detail'>(ticketCode ? 'detail' : 'list');
  const [trackingPayload, setTrackingPayload] =
    useState<PublicReportTrackingPayload | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [notFoundTicket, setNotFoundTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState<boolean>(false);
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState<boolean>(false);

  const [bookmarks, setBookmarks] = useState<TicketBookmarkItem[]>(() =>
    readTicketBookmarksFromCookie()
  );

  // Komunikasi dua arah & unggah bukti tambahan pelapor
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [replyFiles, setReplyFiles] = useState<PendingReplyFile[]>([]);
  const [isCompressingReply, setIsCompressingReply] = useState<boolean>(false);
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox pratinjau bukti gambar
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const loadTrackingData = useCallback(
    async (codeToFetch: string, silentRefresh: boolean = false) => {
      const clean = codeToFetch.trim();
      if (!clean) {
        setTrackingPayload(null);
        setNotFoundTicket(null);
        setQueryError(null);
        return;
      }

      if (silentRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setQueryError(null);
        setNotFoundTicket(null);
      }

      try {
        const result = await fetchPublicReportTrackingRpc(clean);
        if (!result) {
          setTrackingPayload(null);
          setNotFoundTicket(clean);
        } else {
          setTrackingPayload(result);
          setNotFoundTicket(null);
          setQueryError(null);

          const bookmark: TicketBookmarkItem = {
            ticketCode: result.report.ticket_code,
            schoolName: result.report.school_name,
            schoolNpsn: result.report.school_npsn,
            category: result.report.category,
            createdAt: result.report.created_at,
          };
          writeTicketBookmarkToCookie(bookmark);
          setBookmarks(readTicketBookmarksFromCookie());
        }
      } catch (err: unknown) {
        if (!silentRefresh) {
          setTrackingPayload(null);
        }
        setQueryError(
          err instanceof Error
            ? err.message
            : 'Terjadi gangguan koneksi saat mengambil status laporan dari server.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    const incoming = ticketCode ? ticketCode.trim() : '';
    if (incoming) {
      setTicketInput(incoming);
      setActiveTicket(incoming);
      setViewMode('detail');
      loadTrackingData(incoming, false);
    }
  }, [ticketCode, loadTrackingData]);

  // Supabase Realtime pada hash sinyal kode tiket aktif (tanpa mengekspos kode tiket asli)
  useEffect(() => {
    if (!activeTicket) {
      setIsRealtimeSubscribed(false);
      return;
    }

    let cancelled = false;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;
    const clean = activeTicket.trim();

    computeTicketSignalHash(clean)
      .then((signalHash) => {
        if (cancelled || !signalHash) return;
        const ch = supabase
          .channel(`public-report-signal-${signalHash.slice(0, 20)}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'report_tracking_signals',
              filter: `ticket_code=eq.${signalHash}`,
            },
            () => {
              loadTrackingData(clean, true);
            }
          )
          .subscribe((status) => {
            if (!cancelled) {
              setIsRealtimeSubscribed(status === 'SUBSCRIBED');
            }
          });
        activeChannel = ch;
      })
      .catch(() => {
        if (!cancelled) setIsRealtimeSubscribed(false);
      });

    return () => {
      cancelled = true;
      setIsRealtimeSubscribed(false);
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [activeTicket, loadTrackingData]);

  const handleBackToList = () => {
    setViewMode('list');
    setTrackingPayload(null);
    setActiveTicket('');
    setTicketInput('');
    setQueryError(null);
    setNotFoundTicket(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ticketInput.trim();
    if (!clean) {
      setQueryError('Masukkan kode tiket laporan terlebih dahulu (contoh: CHK-9xK4mP-7vR2nQ-B8wL).');
      return;
    }
    setActiveTicket(clean);
    setViewMode('detail');
    loadTrackingData(clean, false);
  };

  const handleSelectBookmark = (code: string) => {
    setTicketInput(code);
    setActiveTicket(code);
    setViewMode('detail');
    loadTrackingData(code, false);
  };

  const handleDeleteBookmark = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = bookmarks.filter((b) => b.ticketCode !== code);
    setBookmarks(next);
    setCookie(TRACKED_COOKIE_KEY, JSON.stringify(next), 60);
    if (activeTicket === code) {
      handleBackToList();
    }
  };

  const handleCopyTicket = (code: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedTicket(true);
    onShowToast(`Kode tiket ${code} berhasil disalin.`);
    setTimeout(() => setCopiedTicket(false), 2200);
  };

  const handleReplyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - replyFiles.length;
    if (remaining <= 0) {
      setReplyError('Maksimal 3 berkas bukti tambahan per pengiriman.');
      return;
    }

    const slice = Array.from(files).slice(0, remaining);
    setIsCompressingReply(true);
    setReplyError(null);
    try {
      const processed = await Promise.all(slice.map((f) => compressReplyAttachment(f)));
      setReplyFiles((prev) => [...prev, ...processed]);
    } finally {
      setIsCompressingReply(false);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveReplyFile = (id: string) => {
    setReplyFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSendAdditionalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingPayload || isSendingReply) return;

    if (!replyMessage.trim() && replyFiles.length === 0) {
      setReplyError('Tuliskan pesan penjelasan atau lampirkan bukti foto tambahan.');
      return;
    }

    setIsSendingReply(true);
    setReplyError(null);

    try {
      const uploadedMeta: ReportAttachmentMeta[] = [];
      for (const f of replyFiles) {
        const uploaded = await uploadReportEvidenceFile(f.blob, f.name, 'followup');
        uploadedMeta.push(uploaded);
      }

      await submitReporterAdditionalInfoRpc(
        trackingPayload.report.ticket_code,
        replyMessage.trim(),
        uploadedMeta
      );

      replyFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      setReplyMessage('');
      setReplyFiles([]);
      onShowToast('Informasi tambahan berhasil dikirim ke petugas pemeriksa.');
      await loadTrackingData(trackingPayload.report.ticket_code, true);
    } catch (err: unknown) {
      setReplyError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim informasi tambahan. Silakan coba lagi.'
      );
    } finally {
      setIsSendingReply(false);
    }
  };

  const report = trackingPayload?.report || null;
  const history = trackingPayload?.history || [];
  const messages = trackingPayload?.messages || [];

  const timelineStages = report
    ? buildParentTimelineStages(
        report.status,
        report.created_at,
        report.opened_at,
        report.resolved_at,
        report.skip_inspection_reason,
        history
      )
    : [];

  const outcomeOption = report
    ? getResolutionOutcomeOption(report.resolution_outcome)
    : null;

  const canReplyAdditionalInfo =
    report &&
    (report.status === 'PEMERIKSAAN_LANJUTAN' || report.waiting_additional_info);

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-view-enter">
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {/* Navigasi Atas List View */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onBackToHome}
                className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#2E6496] shrink-0" />
                <span>Kembali ke Pencarian</span>
              </button>

              {onOpenAnonymousReport && (
                <button
                  type="button"
                  onClick={onOpenAnonymousReport}
                  className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-xs sm:text-sm font-bold text-[#FFFFFF] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Buat Laporan Baru</span>
                </button>
              )}
            </div>

            {/* Kartu Pencarian Kode Tiket */}
            <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs space-y-5">
              <div className="space-y-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496]">
                  Pelacakan Pengaduan Warga
                </span>
                <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                  Pantau Perkembangan Laporan
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Masukkan kode tiket unik Anda untuk melihat perkembangan pemeriksaan oleh petugas Dinas Pendidikan, atau pilih laporan tersimpan di bawah ini.
                </p>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ticketInput}
                    onChange={(e) => {
                      setTicketInput(e.target.value);
                      if (queryError) setQueryError(null);
                    }}
                    placeholder="Masukkan kode tiket (contoh: CHK-9xK4mP-7vR2nQ-B8wL)"
                    aria-label="Kode tiket pelacakan laporan"
                    className="w-full min-h-[46px] pl-10 pr-9 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] font-mono text-sm font-bold text-[#1E293B] placeholder:font-sans placeholder:font-normal placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  {ticketInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setTicketInput('');
                        setQueryError(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#1E293B] p-1 cursor-pointer"
                      aria-label="Kosongkan kode tiket"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  <span>{isLoading ? 'Memeriksa...' : 'Cek Status Laporan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {queryError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-xs font-semibold text-[#991B1B]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{queryError}</span>
                </div>
              )}
            </section>

            {/* List Tabel Sederhana: Riwayat Laporan dari Perangkat Ini */}
            <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E0D8]">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2E6496]" />
                  <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">
                    Riwayat Laporan dari Perangkat Ini
                  </h2>
                </div>
                <span className="text-xs font-semibold text-[#64748B] tabular-nums">
                  {bookmarks.length} laporan tersimpan
                </span>
              </div>

              {bookmarks.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs sm:text-sm text-[#475569]">
                    Belum ada riwayat laporan tersimpan di perangkat ini.
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#64748B]">
                    Laporan yang Anda kirimkan dari peramban ini akan otomatis tercatat di sini agar mudah dipantau kapan saja.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] rounded-xl overflow-hidden">
                  {bookmarks.map((bm) => (
                    <div
                      key={bm.ticketCode}
                      onClick={() => handleSelectBookmark(bm.ticketCode)}
                      className="p-3.5 sm:p-4 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#1D4F7A] group-hover:text-[#2E6496]">
                            {bm.ticketCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#C9DFDC] text-[10px] sm:text-[11px] font-semibold text-[#475569]">
                            {bm.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#475569] truncate">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                          <span className="font-semibold text-[#1E293B] truncate">
                            {bm.schoolName}
                          </span>
                          {bm.schoolNpsn && (
                            <span className="text-[#64748B] font-mono text-[11px] shrink-0">
                              (NPSN: {bm.schoolNpsn})
                            </span>
                          )}
                        </div>
                        {bm.createdAt && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                            <Clock className="w-3 h-3 text-[#64748B]" />
                            <span>{formatWibDateTime(bm.createdAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBookmark(bm.ticketCode);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#EBF3F8] hover:bg-[#2E6496] text-[#2E6496] hover:text-[#FFFFFF] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="hidden sm:inline">Lihat Isi</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteBookmark(bm.ticketCode, e)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#991B1B] hover:bg-[#FEE2E2]/50 transition-colors cursor-pointer"
                          title="Hapus dari riwayat perangkat ini"
                          aria-label={`Hapus tiket ${bm.ticketCode} dari riwayat perangkat`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Navigasi Atas Detail View */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="min-h-[40px] px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
                <span>Kembali ke Riwayat Laporan</span>
              </button>

              {report && (
                <button
                  type="button"
                  onClick={() => loadTrackingData(report.ticket_code, true)}
                  disabled={isRefreshing || isLoading}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#2E6496] ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{isRefreshing ? 'Memuat...' : 'Perbarui Status'}</span>
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-10 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-[#2E6496] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#1E293B]">
                  Mengambil data status laporan dari server...
                </p>
              </div>
            )}

            {/* Error State Jelas (Tanpa Data Dummy) */}
            {!isLoading && queryError && (
              <div
                role="alert"
                className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-[#991B1B]">
                      Tidak Dapat Memuat Data Laporan
                    </h2>
                    <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed">
                      {queryError}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeTicket && (
                    <button
                      type="button"
                      onClick={() => loadTrackingData(activeTicket, false)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FFFFFF] border border-[#FECACA] text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]/40 cursor-pointer shrink-0"
                    >
                      Coba Lagi
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] hover:bg-[#FAF8F5] cursor-pointer shrink-0"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            )}

            {/* Not Found State */}
            {!isLoading && !queryError && notFoundTicket && (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#475569] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-[#1E293B]">
                    Kode Tiket {notFoundTicket} Tidak Ditemukan
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
                    Pastikan kode tiket diketik lengkap sesuai huruf kapital, huruf kecil, dan angka (misalnya CHK-9xK4mP-7vR2nQ-B8wL).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2E6496] text-[#FFFFFF] text-xs font-bold hover:bg-[#245385] cursor-pointer inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Riwayat Laporan</span>
                </button>
              </div>
            )}

            {/* ===================================================================
                DETAIL PELACAKAN LAPORAN AKTUAL DARI DATABASE SUPABASE
               =================================================================== */}
            {!isLoading && report && (
              <div className="space-y-6">
            {/* 1. Ringkasan Utama Laporan */}
            <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E4E0D8]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                      Kode Tiket Laporan
                    </span>
                    {isRealtimeSubscribed && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#166534]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
                        <span>Pembaruan Langsung Aktif</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-lg sm:text-2xl font-extrabold text-[#2E6496] tabular-nums break-all">
                      {report.ticket_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(report.ticket_code)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedTicket ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#166534]" />
                          <span className="text-[#166534]">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#2E6496]" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Badge Status Utama */}
                <div className="self-start">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      report.status === 'COMPLETED'
                        ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                        : report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : report.waiting_additional_info
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        : 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
                    }`}
                  >
                    {getParentStatusLabel(report.status, report.waiting_additional_info)}
                  </span>
                </div>
              </div>

              {/* Informasi Sekolah & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                  <span className="text-[11px] font-medium text-[#475569] block">
                    Sekolah yang Dilaporkan
                  </span>
                  <div className="font-bold text-[#1E293B] flex items-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0 mt-0.5" />
                    <span>{report.school_name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#475569] tabular-nums block">
                    NPSN: {report.school_npsn}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                  <span className="text-[11px] font-medium text-[#475569] block">
                    Kategori Laporan
                  </span>
                  <span className="font-bold text-[#1E293B] block">
                    {report.category}
                  </span>
                  <span className="text-[11px] text-[#475569] block">
                    Pihak terkait: {report.requester_role}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                  <span className="text-[11px] font-medium text-[#475569] block">
                    Waktu Pengiriman
                  </span>
                  <span className="font-mono font-bold text-[#1E293B] tabular-nums block">
                    {formatWibDateTime(report.created_at)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                  <span className="text-[11px] font-medium text-[#475569] block">
                    Terakhir Diperbarui
                  </span>
                  <span className="font-mono font-bold text-[#1E293B] tabular-nums block">
                    {formatWibDateTime(report.updated_at)}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Banner Kondisi Alternatif: Perlu Informasi Tambahan / Diteruskan / Tidak Dapat Ditindaklanjuti */}
            {report.waiting_additional_info && report.status === 'PEMERIKSAAN_LANJUTAN' && (
              <section
                aria-label="Permintaan Informasi Tambahan"
                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5 sm:p-6 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#92400E]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Perlu Informasi Tambahan</span>
                </div>
                <h2 className="text-base font-bold text-[#1E293B]">
                  Petugas Membutuhkan Keterangan atau Bukti Tambahan dari Kamu
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Baca pesan petugas pada bagian Komunikasi Pemeriksaan di bawah ini, lalu kirimkan penjelasan atau unggah bukti tambahan tanpa perlu mencantumkan identitas pribadi.
                </p>
              </section>
            )}

            {report.is_forwarded && (
              <section className="bg-[#EBF3F8] border border-[#C9DFDC] rounded-2xl p-5 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#1D4F7A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-[#1E293B]">
                    Proses Diteruskan ke Instansi Terkait
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    Laporan ini sedang dikoordinasikan atau diteruskan kepada{' '}
                    <strong className="text-[#1E293B]">
                      {report.forwarded_to || 'instansi pengawasan terkait'}
                    </strong>{' '}
                    sesuai kewenangan pemeriksaan.
                  </p>
                </div>
              </section>
            )}

            {report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI' && (
              <section className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
                    Status Akhir Laporan: Tidak Dapat Ditindaklanjuti
                  </span>
                  {report.resolved_at && (
                    <span className="font-mono text-xs text-[#991B1B] tabular-nums">
                      {formatWibDateTime(report.resolved_at)}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#1E293B]">
                  Keterangan dari Petugas Dinas Pendidikan
                </h2>
                <p className="text-xs sm:text-sm text-[#1E293B] bg-[#FFFFFF] border border-[#FECACA] rounded-xl p-4 leading-relaxed">
                  {report.rejection_reason ||
                    'Laporan belum memenuhi persyaratan informasi awal untuk dilanjutkan ke tahap pemeriksaan.'}
                </p>
                <p className="text-xs text-[#475569]">
                  Apabila kamu memiliki bukti atau rincian informasi baru yang lebih lengkap, kamu tetap dapat mengirimkan laporan baru melalui kanal pelaporan DARADIK.
                </p>
              </section>
            )}

            {/* 3. Kartu Hasil Penanganan (Tahap 5 Selesai) */}
            {report.status === 'COMPLETED' && (
              <section className="bg-[#FFFFFF] border-2 border-[#2E6496] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E4E0D8]">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2E6496]">
                      Tahap 5 • Hasil Penanganan Dinas Pendidikan
                    </span>
                    <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
                      {outcomeOption?.label || 'Pemeriksaan Selesai'}
                    </h2>
                  </div>

                  {report.resolved_at && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1E293B] bg-[#FAF8F5] border border-[#E4E0D8] px-3 py-1.5 rounded-lg tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-[#2E6496]" />
                      <span>{formatWibDateTime(report.resolved_at)}</span>
                    </div>
                  )}
                </div>

                {outcomeOption && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
                      outcomeOption.code === 'HAS_INDICATION'
                        ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                        : outcomeOption.code === 'NO_INDICATION'
                        ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                        : 'bg-[#FAF8F5] border-[#C9DFDC] text-[#1E293B]'
                    }`}
                  >
                    {outcomeOption.parentSummary}
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#1E293B] block">
                    Catatan Hasil Penanganan untuk Pelapor:
                  </span>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                    {report.public_resolution_note ||
                      'Pemeriksaan atas laporan telah diselesaikan oleh petugas Dinas Pendidikan.'}
                  </div>
                </div>

                <p className="text-[11px] text-[#475569] leading-relaxed">
                  Catatan: Hasil penanganan di atas merupakan kesimpulan pemeriksaan administratif Dinas Pendidikan sesuai kewenangannya, bukan merupakan putusan pengadilan atau penegakan hukum pidana.
                </p>
              </section>
            )}

            {/* 4. Timeline 5 Tahapan Utama */}
            <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
                  Tahapan Pemeriksaan Laporan
                </h2>
                <p className="text-xs sm:text-sm text-[#475569]">
                  Seluruh status dan waktu di bawah ini tercatat otomatis berdasarkan tindakan nyata petugas di sistem Dinas Pendidikan.
                </p>
              </div>

              <ol className="space-y-4">
                {timelineStages.map((stage, idx) => {
                  const isLast = idx === timelineStages.length - 1;
                  const isDone = stage.state === 'done';
                  const isCurrent = stage.state === 'current';
                  const isStopped = stage.state === 'stopped';
                  const isSkipped = stage.state === 'skipped';

                  return (
                    <li key={stage.statusKey} className="relative pl-9">
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[13px] top-8 bottom-[-18px] w-[2px] ${
                            isDone ? 'bg-[#2E6496]' : 'bg-[#E2E8F0]'
                          }`}
                        />
                      )}

                      {/* Indikator Lingkaran Tahap */}
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          isDone
                            ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                            : isCurrent
                            ? 'bg-[#EBF3F8] border-[#2E6496] text-[#1D4F7A]'
                            : isStopped
                            ? 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'
                            : 'bg-[#FAF8F5] border-[#CBD5E1] text-[#475569]'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.step}
                      </span>

                      <div
                        className={`p-4 rounded-xl border space-y-2 ${
                          isCurrent
                            ? 'bg-[#EBF3F8]/45 border-[#2E6496]'
                            : isStopped
                            ? 'bg-[#FEF2F2]/60 border-[#FECACA]'
                            : isDone
                            ? 'bg-[#FFFFFF] border-[#C9DFDC]'
                            : 'bg-[#FAF8F5] border-[#E4E0D8]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                              {stage.step}. {stage.label}
                            </h3>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                isDone
                                  ? 'bg-[#DCFCE7] text-[#166534]'
                                  : isCurrent
                                  ? 'bg-[#2E6496] text-[#FFFFFF]'
                                  : isStopped
                                  ? 'bg-[#FEE2E2] text-[#991B1B]'
                                  : isSkipped
                                  ? 'bg-[#E2E8F0] text-[#1E293B]'
                                  : 'bg-[#E2E8F0]/70 text-[#475569]'
                              }`}
                            >
                              {stage.stateLabel}
                            </span>
                          </div>

                          <span className="font-mono text-[11px] sm:text-xs text-[#475569] tabular-nums">
                            {stage.timestampWib || 'Belum dimulai'}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                          {stage.description}
                        </p>

                        {/* Tampilkan metode pemeriksaan aktual jika tahap 4 memiliki catatan kegiatan nyata */}
                        {stage.step === 4 &&
                          report.inspection_methods &&
                          report.inspection_methods.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {report.inspection_methods.map((methodCode) => (
                                <span
                                  key={methodCode}
                                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-[#1E293B]"
                                >
                                  {getInspectionMethodLabel(methodCode)}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* 5. Komunikasi Anonim Dua Arah & Permintaan Informasi Tambahan */}
            {(messages.length > 0 || canReplyAdditionalInfo) && (
              <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#2E6496]" />
                    <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
                      Komunikasi Pemeriksaan Anonim
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569]">
                    Riwayat pesan klarifikasi dan bukti tambahan antara petugas Dinas Pendidikan dan pelapor tanpa menampilkan identitas pribadi.
                  </p>
                </div>

                {messages.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {messages.map((msg) => {
                      const isOfficer = msg.sender_type === 'OFFICER';
                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            isOfficer
                              ? 'bg-[#EBF3F8]/60 border-[#C9DFDC]'
                              : 'bg-[#FAF8F5] border-[#E4E0D8]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span
                              className={`font-bold ${
                                isOfficer ? 'text-[#1D4F7A]' : 'text-[#1E293B]'
                              }`}
                            >
                              {msg.sender_label}
                            </span>
                            <span className="font-mono text-[11px] text-[#475569] tabular-nums">
                              {formatWibDateTime(msg.created_at)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>

                          {msg.attachments_json && msg.attachments_json.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-2">
                              {msg.attachments_json.map((att, i) =>
                                att.url ? (
                                  <button
                                    key={`${msg.id}-att-${i}`}
                                    type="button"
                                    onClick={() =>
                                      setLightboxImage({
                                        url: att.url!,
                                        title: att.name,
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-semibold text-[#2E6496] hover:bg-[#EBF3F8] cursor-pointer"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>{att.name}</span>
                                  </button>
                                ) : (
                                  <span
                                    key={`${msg.id}-att-${i}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E4E0D8] text-xs text-[#475569]"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>{att.name}</span>
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-4">
                    Belum ada pesan komunikasi pada laporan ini.
                  </p>
                )}

                {canReplyAdditionalInfo && (
                  <form
                    onSubmit={handleSendAdditionalInfo}
                    className="pt-4 border-t border-[#E4E0D8] space-y-3"
                  >
                    <label
                      htmlFor="reporter-reply-textarea"
                      className="block text-xs sm:text-sm font-bold text-[#1E293B]"
                    >
                      Balas Pesan atau Tambah Bukti Pendukung Secara Anonim
                    </label>

                    {replyError && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#991B1B]"
                      >
                        {replyError}
                      </div>
                    )}

                    <textarea
                      id="reporter-reply-textarea"
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => {
                        setReplyMessage(e.target.value);
                        if (replyError) setReplyError(null);
                      }}
                      placeholder="Tuliskan informasi tambahan untuk membantu pemeriksaan petugas (hindari menuliskan nama pribadi atau nomor HP)..."
                      className="w-full p-3.5 rounded-xl bg-[#FAF8F5] focus:bg-[#FFFFFF] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                    />

                    {replyFiles.length > 0 && (
                      <div className="space-y-2">
                        {replyFiles.map((rf) => (
                          <div
                            key={rf.id}
                            className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                              <span className="font-semibold text-[#1E293B] truncate">
                                {rf.name}
                              </span>
                              <span className="text-[#475569] shrink-0">
                                ({rf.sizeFormatted})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveReplyFile(rf.id)}
                              className="p-1 text-[#475569] hover:text-[#991B1B] cursor-pointer"
                              aria-label={`Hapus berkas ${rf.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={replyFileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleReplyFileSelect}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => replyFileInputRef.current?.click()}
                        disabled={isCompressingReply || replyFiles.length >= 3 || isSendingReply}
                        className="min-h-[42px] px-4 py-2 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-bold text-[#1E293B] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#2E6496]" />
                        <span>
                          {isCompressingReply
                            ? 'Memproses Berkas...'
                            : `Unggah Bukti Tambahan (${replyFiles.length}/3)`}
                        </span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSendingReply || isCompressingReply}
                        className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isSendingReply ? 'Mengirim Balasan...' : 'Kirim Informasi Tambahan'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* 6. Ringkasan Isi Laporan & Bukti yang Dikirim Pelapor */}
            <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2E6496]" />
                <h2 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
                  Arsip Kronologi &amp; Bukti yang Kamu Kirimkan
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                {report.notes}
              </div>

              {report.attachments_json && report.attachments_json.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#475569] block">
                    Lampiran Bukti ({report.attachments_json.length} berkas):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {report.attachments_json.map((att, idx) => (
                      <div
                        key={`rep-att-${idx}`}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-[#1E293B] block truncate">
                              {att.name}
                            </span>
                            <span className="text-[11px] text-[#475569]">
                              {att.sizeFormatted}
                            </span>
                          </div>
                        </div>

                        {att.url && (
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({ url: att.url!, title: att.name })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-[#2E6496] font-semibold hover:bg-[#EBF3F8] inline-flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>Lihat</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 7. Riwayat Perubahan Status Kronologis (Tanpa Catatan Internal) */}
            {history.length > 0 && (
              <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
                  Catatan Waktu Perubahan Status
                </h2>

                <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] rounded-xl overflow-hidden">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#1E293B] flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                          <span>{getParentStatusLabel(h.new_status)}</span>
                          <span className="text-[11px] font-normal text-[#475569]">
                            • {h.actor_label}
                          </span>
                        </div>
                        {h.note && (
                          <p className="text-[#475569] pl-5 leading-relaxed">{h.note}</p>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-[#475569] tabular-nums pl-5 sm:pl-0 shrink-0">
                        {formatWibDateTime(h.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      )}
      </div>

      {/* Modal Pratinjau Bukti */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D8]">
              <span className="text-sm font-bold text-[#1E293B] truncate">
                {lightboxImage.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup pratinjau berkas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2">
              {lightboxImage.url.toLowerCase().endsWith('.pdf') ? (
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#2E6496] text-[#FFFFFF] text-xs font-bold inline-flex items-center gap-2"
                >
                  <span>Buka Dokumen PDF di Tab Baru</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[65vh] w-auto object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
