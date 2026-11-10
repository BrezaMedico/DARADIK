import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';
import type {
  PublicReportTrackingPayload,
} from '@/types';
import {
  supabase,
  fetchPublicReportTrackingRpc,
} from '@/services/supabase';
import {
  buildParentTimelineStages,
  getResolutionOutcomeOption,
} from '@/utils/reportTracking';
import { computeTicketSignalHash } from '@/utils/cryptoSecurity';
import {
  TRACKED_COOKIE_KEY,
  getTrackingTokenForTicket,
  readTicketBookmarksFromCookie,
  setCookie,
  writeTicketBookmarkToCookie,
  type TicketBookmarkItem,
} from './trackingCookieUtils';
import { TrackingLookupView } from './components/TrackingLookupView';
import {
  TrackingAttachmentModal,
  TrackingDetailSummary,
} from './components/TrackingDetailSummary';
import { TrackingProgressTimeline } from './components/TrackingProgressTimeline';

export interface LiveTrackingPageProps {
  ticketCode?: string;
  onBackToHome: () => void;
  onOpenAnonymousReport?: () => void;
  onShowToast: (message: string) => void;
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

          const existingToken = getTrackingTokenForTicket(clean);
          const bookmark: TicketBookmarkItem = {
            ticketCode: result.report.ticket_code,
            trackingToken: existingToken || undefined,
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

  // Subscribes to a SHA-256 signal hash channel so the raw ticket code is never exposed on realtime.
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
    setCookie(TRACKED_COOKIE_KEY, JSON.stringify(next), 90);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TRACKED_COOKIE_KEY, JSON.stringify(next));
    }
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


  const report = trackingPayload?.report || null;
  const history = trackingPayload?.history || [];

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

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-view-enter">
        {viewMode === 'list' ? (
          <TrackingLookupView
            ticketInput={ticketInput}
            isLoading={isLoading}
            queryError={queryError}
            bookmarks={bookmarks}
            onBackToHome={onBackToHome}
            onOpenAnonymousReport={onOpenAnonymousReport}
            onTicketInputChange={(val) => {
              setTicketInput(val);
              if (queryError) setQueryError(null);
            }}
            onClearTicketInput={() => {
              setTicketInput('');
              setQueryError(null);
            }}
            onSearchSubmit={handleSearchSubmit}
            onSelectBookmark={handleSelectBookmark}
            onDeleteBookmark={handleDeleteBookmark}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <BackButton onClick={handleBackToList} label="Kembali ke Riwayat Laporan" />

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

            {isLoading && (
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-10 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-[#2E6496] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#1E293B]">
                  Mengambil data status laporan dari server...
                </p>
              </div>
            )}

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
                  <BackButton onClick={handleBackToList} label="Kembali" className="shrink-0" />
                </div>
              </div>
            )}

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
                <BackButton onClick={handleBackToList} label="Kembali ke Riwayat Laporan" />
              </div>
            )}

            {!isLoading && report && (
              <TrackingDetailSummary
                report={report}
                history={history}
                outcomeOption={outcomeOption}
                isRealtimeSubscribed={isRealtimeSubscribed}
                copiedTicket={copiedTicket}
                onCopyTicket={handleCopyTicket}
                onPreviewAttachment={setLightboxImage}
              >
                <TrackingProgressTimeline
                  timelineStages={timelineStages}
                  inspectionMethods={report.inspection_methods}
                />
              </TrackingDetailSummary>
            )}
          </div>
        )}
      </div>

      <TrackingAttachmentModal
        lightboxImage={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
