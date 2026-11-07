import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
} from 'lucide-react';
import type {
  InspectionMethodCode,
  OfficerProfileRecord,
  OfficerQueueReportRow,
  OfficerReportDetailBundle,
  ResolutionOutcomeCode,
} from '@/types';
import {
  ReportVersionConflictError,
  addOfficerInternalNoteRpc,
  fetchOfficerReportsQueue,
  getActiveOfficerSession,
  openReportDetailByOfficer,
  signInOfficerWithPassword,
  signOutOfficer,
  transitionReportByOfficerRpc,
} from '@/services/supabase';
import {
  REJECTION_QUICK_REASONS,
  RESOLUTION_OUTCOME_OPTIONS,
  formatWibDateTime,
  getOfficerStatusLabel,
  toWibDateInputString,
} from '@/utils/reportTracking';
import {
  DetailActiveSection,
  DinasDashboardPageProps,
  LightboxMeta,
  QueueCategoryTab,
  QueueCounters,
  RECOMMENDED_RESOLUTION_NOTES,
} from './dinasDashboardTypes';
import { OfficerConflictBanner, OfficerHeader } from './components/OfficerHeader';
import { OfficerLoginView } from './components/OfficerLoginView';
import { ReportCommunicationTab } from './components/ReportCommunicationTab';
import { ReportHistoryTab } from './components/ReportHistoryTab';
import { ReportInspectionView } from './components/ReportInspectionView';
import { ReportSchoolIdentityTab } from './components/ReportSchoolIdentityTab';
import { ReportsQueuePanel } from './components/ReportsQueuePanel';

export const DinasDashboardPage: React.FC<DinasDashboardPageProps> = ({
  onBackToHome,
  onShowToast,
}) => {
  const [officer, setOfficer] = useState<OfficerProfileRecord | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [queueReports, setQueueReports] = useState<OfficerQueueReportRow[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<QueueCategoryTab>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const [activeReportDetail, setActiveReportDetail] =
    useState<OfficerReportDetailBundle | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<DetailActiveSection>('pemeriksaan');
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);

  const [selectedMethods, setSelectedMethods] = useState<InspectionMethodCode[]>([]);
  const [isForwardedCheck, setIsForwardedCheck] = useState<boolean>(false);
  const [forwardedToInput, setForwardedToInput] = useState<string>('Inspektorat Daerah');
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const [infoRequestMessage, setInfoRequestMessage] = useState<string>('');
  const [isSendingInfoRequest, setIsSendingInfoRequest] = useState<boolean>(false);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [rejectReasonQuick, setRejectReasonQuick] = useState<string>(
    REJECTION_QUICK_REASONS[0]
  );
  const [rejectReasonCustom, setRejectReasonCustom] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState<boolean>(false);
  const [chosenOutcome, setChosenOutcome] = useState<ResolutionOutcomeCode>('HAS_INDICATION');
  const [resolutionPublicNote, setResolutionPublicNote] = useState<string>('');
  const [skipReasonInput, setSkipReasonInput] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const [lightboxMeta, setLightboxMeta] = useState<LightboxMeta | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const currentOfficer = await getActiveOfficerSession();
        if (mounted) {
          setOfficer(currentOfficer);
        }
      } catch {
        if (mounted) setOfficer(null);
      } finally {
        if (mounted) setIsCheckingAuth(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const loadQueue = useCallback(
    async (silent: boolean = false) => {
      if (!officer) return;
      if (silent) {
        setIsRefreshingQueue(true);
      } else {
        setIsLoadingQueue(true);
        setQueueError(null);
      }

      try {
        const rows = await fetchOfficerReportsQueue();
        setQueueReports(rows);
        setQueueError(null);
      } catch (err: unknown) {
        setQueueError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat antrean laporan pengaduan dari server.'
        );
      } finally {
        setIsLoadingQueue(false);
        setIsRefreshingQueue(false);
      }
    },
    [officer]
  );

  useEffect(() => {
    if (officer) {
      loadQueue(false);
    }
  }, [officer, loadQueue]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailOrUsername = loginEmail.trim();
    if (!emailOrUsername || !loginPassword) {
      setLoginError('Ketikkan username / email dan kata sandi administrator.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const authenticatedOfficer = await signInOfficerWithPassword(
        emailOrUsername,
        loginPassword
      );
      setOfficer(authenticatedOfficer);
      setLoginPassword('');
      onShowToast(`Selamat datang, ${authenticatedOfficer.full_name}`);
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'Gagal masuk. Periksa kembali username dan kata sandi administrator.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOutOfficer();
    setOfficer(null);
    setActiveReportDetail(null);
    setQueueReports([]);
    onShowToast('Anda telah keluar dari sesi petugas.');
  };

  const counters = useMemo<QueueCounters>(() => {
    const totalMasuk = queueReports.length;
    let belumDibuka = 0;
    let sedangDiproses = 0;
    let menungguInfo = 0;
    let selesai = 0;

    for (const r of queueReports) {
      if (r.status === 'SUBMITTED' || (r.status === 'QUEUED' && !r.opened_at)) {
        belumDibuka++;
      }
      if (
        r.status === 'SEDANG_DITELAAH' ||
        (r.status === 'PEMERIKSAAN_LANJUTAN' && !r.waiting_additional_info)
      ) {
        sedangDiproses++;
      }
      if (r.status === 'PEMERIKSAAN_LANJUTAN' && r.waiting_additional_info) {
        menungguInfo++;
      }
      if (r.status === 'COMPLETED') {
        selesai++;
      }
    }

    return { totalMasuk, belumDibuka, sedangDiproses, menungguInfo, selesai };
  }, [queueReports]);

  // Open reports sort oldest-first so long-waiting cases stay at the top; closed reports sort newest-first.
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return queueReports
      .filter((r) => {
        if (activeTab === 'UNOPENED') {
          if (r.status !== 'SUBMITTED' && (r.status !== 'QUEUED' || r.opened_at)) {
            return false;
          }
        } else if (activeTab === 'REVIEW') {
          if (r.status !== 'SEDANG_DITELAAH') return false;
        } else if (activeTab === 'INSPECTION') {
          if (r.status !== 'PEMERIKSAAN_LANJUTAN' || r.waiting_additional_info) {
            return false;
          }
        } else if (activeTab === 'WAITING_INFO') {
          if (r.status !== 'PEMERIKSAAN_LANJUTAN' || !r.waiting_additional_info) {
            return false;
          }
        } else if (activeTab === 'COMPLETED') {
          if (r.status !== 'COMPLETED') return false;
        } else if (activeTab === 'REJECTED') {
          if (r.status !== 'TIDAK_DAPAT_DITINDAKLANJUTI') return false;
        }

        if (q) {
          const matchTicket = r.ticket_code.toLowerCase().includes(q);
          const matchSchool = r.school_name.toLowerCase().includes(q);
          const matchNpsn = r.school_npsn.toLowerCase().includes(q);
          const matchCategory = r.category.toLowerCase().includes(q);
          if (!matchTicket && !matchSchool && !matchNpsn && !matchCategory) {
            return false;
          }
        }

        if (filterStartDate) {
          const reportDateStr = toWibDateInputString(r.created_at);
          if (reportDateStr < filterStartDate) return false;
        }
        if (filterEndDate) {
          const reportDateStr = toWibDateInputString(r.created_at);
          if (reportDateStr > filterEndDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const isAClosed =
          a.status === 'COMPLETED' || a.status === 'TIDAK_DAPAT_DITINDAKLANJUTI';
        const isBClosed =
          b.status === 'COMPLETED' || b.status === 'TIDAK_DAPAT_DITINDAKLANJUTI';

        if (isAClosed && isBClosed) {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        if (isAClosed) return 1;
        if (isBClosed) return -1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [queueReports, activeTab, searchQuery, filterStartDate, filterEndDate]);

  // Opening a QUEUED report triggers a one-time atomic RPC transition to SEDANG_DITELAAH.
  const handleOpenReportDetail = async (reportId: string) => {
    setIsLoadingDetail(true);
    setConflictBanner(null);
    try {
      const bundle = await openReportDetailByOfficer(reportId);
      setActiveReportDetail(bundle);
      setDetailTab('pemeriksaan');
      setSelectedMethods(bundle.report.inspection_methods || []);
      setIsForwardedCheck(Boolean(bundle.report.is_forwarded));
      setForwardedToInput(bundle.report.forwarded_to || 'Inspektorat Daerah');
      setNewInternalNote('');
      setInfoRequestMessage('');

      if (bundle.autoTransitionedOnOpen) {
        onShowToast(
          `Laporan ${bundle.report.ticket_code} dibuka. Status otomatis masuk ke: Sedang Ditelaah.`
        );
      }

      await loadQueue(true);
    } catch (err: unknown) {
      onShowToast(
        err instanceof Error ? err.message : 'Gagal membuka detail laporan dari server.'
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setActiveReportDetail(null);
    setConflictBanner(null);
    loadQueue(true);
  };

  const handleAcceptForFollowUp = async () => {
    if (!activeReportDetail) return;
    setConflictBanner(null);

    try {
      await transitionReportByOfficerRpc({
        reportId: activeReportDetail.report.id,
        expectedVersion: activeReportDetail.report.version,
        action: 'ACCEPT_FOR_FOLLOWUP',
      });

      onShowToast(
        `Laporan ${activeReportDetail.report.ticket_code} diterima untuk pemeriksaan lanjutan.`
      );
      const updatedBundle = await openReportDetailByOfficer(activeReportDetail.report.id);
      setActiveReportDetail(updatedBundle);
      await loadQueue(true);
    } catch (err: unknown) {
      if (err instanceof ReportVersionConflictError) {
        setConflictBanner(err.message);
      } else {
        onShowToast(err instanceof Error ? err.message : 'Gagal memproses tindakan.');
      }
    }
  };

  const handleConfirmReject = async () => {
    if (!activeReportDetail) return;
    const finalReason =
      rejectReasonQuick === 'Alasan lainnya.'
        ? rejectReasonCustom.trim()
        : rejectReasonQuick.trim();

    if (!finalReason) {
      onShowToast('Alasan penolakan laporan wajib diisi.');
      return;
    }

    setIsRejecting(true);
    setConflictBanner(null);

    try {
      await transitionReportByOfficerRpc({
        reportId: activeReportDetail.report.id,
        expectedVersion: activeReportDetail.report.version,
        action: 'REJECT_REPORT',
        rejectionReason: finalReason,
      });

      setIsRejectDialogOpen(false);
      onShowToast(`Laporan ${activeReportDetail.report.ticket_code} ditolak dengan alasan.`);
      const updatedBundle = await openReportDetailByOfficer(activeReportDetail.report.id);
      setActiveReportDetail(updatedBundle);
      await loadQueue(true);
    } catch (err: unknown) {
      if (err instanceof ReportVersionConflictError) {
        setIsRejectDialogOpen(false);
        setConflictBanner(err.message);
      } else {
        onShowToast(err instanceof Error ? err.message : 'Gagal menolak laporan.');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSaveInspectionProgress = async () => {
    if (!activeReportDetail) return;
    setConflictBanner(null);

    try {
      await transitionReportByOfficerRpc({
        reportId: activeReportDetail.report.id,
        expectedVersion: activeReportDetail.report.version,
        action: 'SAVE_INSPECTION_PROGRESS',
        inspectionMethods: selectedMethods,
        isForwarded: isForwardedCheck,
        forwardedTo: isForwardedCheck ? forwardedToInput.trim() : null,
      });

      onShowToast('Catatan metode pemeriksaan berhasil disimpan.');
      const updatedBundle = await openReportDetailByOfficer(activeReportDetail.report.id);
      setActiveReportDetail(updatedBundle);
      await loadQueue(true);
    } catch (err: unknown) {
      if (err instanceof ReportVersionConflictError) {
        setConflictBanner(err.message);
      } else {
        onShowToast(err instanceof Error ? err.message : 'Gagal menyimpan kemajuan pemeriksaan.');
      }
    }
  };

  const handleSendInfoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportDetail) return;
    const msg = infoRequestMessage.trim();
    if (!msg) {
      onShowToast('Ketikkan rincian informasi atau dokumen tambahan yang diminta.');
      return;
    }

    setIsSendingInfoRequest(true);
    setConflictBanner(null);

    try {
      await transitionReportByOfficerRpc({
        reportId: activeReportDetail.report.id,
        expectedVersion: activeReportDetail.report.version,
        action: 'REQUEST_ADDITIONAL_INFO',
        messageToReporter: msg,
      });

      setInfoRequestMessage('');
      onShowToast('Permintaan informasi tambahan berhasil dikirim ke pelapor.');
      const updatedBundle = await openReportDetailByOfficer(activeReportDetail.report.id);
      setActiveReportDetail(updatedBundle);
      await loadQueue(true);
    } catch (err: unknown) {
      if (err instanceof ReportVersionConflictError) {
        setConflictBanner(err.message);
      } else {
        onShowToast(err instanceof Error ? err.message : 'Gagal mengirim permintaan info.');
      }
    } finally {
      setIsSendingInfoRequest(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!activeReportDetail) return;
    const note = resolutionPublicNote.trim();
    if (!note) {
      onShowToast('Catatan hasil penanganan untuk pelapor wajib diisi.');
      return;
    }

    const isDirectFromReview =
      activeReportDetail.report.status === 'SEDANG_DITELAAH';
    if (isDirectFromReview && !skipReasonInput.trim()) {
      onShowToast('Alasan melewati pemeriksaan lanjutan wajib dicatat.');
      return;
    }

    setIsCompleting(true);
    setConflictBanner(null);

    try {
      await transitionReportByOfficerRpc({
        reportId: activeReportDetail.report.id,
        expectedVersion: activeReportDetail.report.version,
        action: 'COMPLETE_REPORT',
        resolutionOutcome: chosenOutcome,
        publicResolutionNote: note,
        skipInspectionReason: isDirectFromReview ? skipReasonInput.trim() : null,
        inspectionMethods: selectedMethods,
      });

      setIsCompleteDialogOpen(false);
      onShowToast(`Pemeriksaan laporan ${activeReportDetail.report.ticket_code} selesai disimpan.`);
      const updatedBundle = await openReportDetailByOfficer(activeReportDetail.report.id);
      setActiveReportDetail(updatedBundle);
      await loadQueue(true);
    } catch (err: unknown) {
      if (err instanceof ReportVersionConflictError) {
        setIsCompleteDialogOpen(false);
        setConflictBanner(err.message);
      } else {
        onShowToast(err instanceof Error ? err.message : 'Gagal menyelesaikan laporan.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportDetail) return;
    const note = newInternalNote.trim();
    if (!note) return;

    setIsSubmittingNote(true);
    try {
      await addOfficerInternalNoteRpc(activeReportDetail.report.id, note);
      setNewInternalNote('');
      onShowToast('Catatan internal berhasil disimpan.');
      const updatedBundle = await openReportDetailByOfficer(activeReportDetail.report.id);
      setActiveReportDetail(updatedBundle);
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'Gagal menambahkan catatan internal.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleToggleMethod = (code: InspectionMethodCode, checked: boolean) => {
    if (checked) {
      setSelectedMethods((prev) => [...prev, code]);
    } else {
      setSelectedMethods((prev) => prev.filter((m) => m !== code));
    }
  };

  if (isCheckingAuth || !officer) {
    return (
      <OfficerLoginView
        isCheckingAuth={isCheckingAuth}
        loginEmail={loginEmail}
        onLoginEmailChange={setLoginEmail}
        loginPassword={loginPassword}
        onLoginPasswordChange={setLoginPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        onLoginSubmit={handleLoginSubmit}
        onBackToHome={onBackToHome}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-12">
      <OfficerHeader
        officer={officer}
        onBackToHome={onBackToHome}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 space-y-6">
        <OfficerConflictBanner
          conflictBanner={conflictBanner}
          onReload={() => {
            if (activeReportDetail) {
              openReportDetailByOfficer(activeReportDetail.report.id);
            }
            loadQueue(true);
          }}
        />

        <section
          aria-label="Ringkasan Antrean Laporan"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
        >
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#475569] block">
              1. Laporan Masuk
            </span>
            <div className="font-sturdy-heading text-2xl font-extrabold text-[#1E293B] tabular-nums">
              {counters.totalMasuk}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#475569] block">
              2. Belum Dibuka
            </span>
            <div className="font-sturdy-heading text-2xl font-extrabold text-[#2E6496] tabular-nums">
              {counters.belumDibuka}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#475569] block">
              3. Sedang Diproses
            </span>
            <div className="font-sturdy-heading text-2xl font-extrabold text-[#1D4F7A] tabular-nums">
              {counters.sedangDiproses}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#475569] block">
              4. Menunggu Info Tambahan
            </span>
            <div className="font-sturdy-heading text-2xl font-extrabold text-[#92400E] tabular-nums">
              {counters.menungguInfo}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-[#475569] block">
              5. Selesai
            </span>
            <div className="font-sturdy-heading text-2xl font-extrabold text-[#166534] tabular-nums">
              {counters.selesai}
            </div>
          </div>
        </section>

        {activeReportDetail ? (
          <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-view-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E0D8]">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="min-h-[34px] px-3 py-1 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#2E6496]" />
                  <span>Kembali ke Daftar Antrean</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#2E6496] tabular-nums">
                    {activeReportDetail.report.ticket_code}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${
                      activeReportDetail.report.status === 'COMPLETED'
                        ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                        : activeReportDetail.report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : activeReportDetail.report.waiting_additional_info
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        : 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
                    }`}
                  >
                    {getOfficerStatusLabel(
                      activeReportDetail.report.status,
                      activeReportDetail.report.waiting_additional_info,
                      activeReportDetail.report.opened_at
                    )}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#475569] font-mono tabular-nums text-left sm:text-right">
                <div>Waktu masuk: {formatWibDateTime(activeReportDetail.report.created_at)}</div>
                {activeReportDetail.report.opened_at && (
                  <div>
                    Pertama dibuka: {formatWibDateTime(activeReportDetail.report.opened_at)} (
                    {activeReportDetail.report.opened_by_name || 'Petugas'})
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-[#E4E0D8] overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setDetailTab('pemeriksaan')}
                className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  detailTab === 'pemeriksaan'
                    ? 'bg-[#2E6496] text-[#FFFFFF]'
                    : 'text-[#475569] hover:bg-[#FAF8F5]'
                }`}
              >
                Pemeriksaan &amp; Tindakan
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('sekolah')}
                className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  detailTab === 'sekolah'
                    ? 'bg-[#2E6496] text-[#FFFFFF]'
                    : 'text-[#475569] hover:bg-[#FAF8F5]'
                }`}
              >
                Identitas Sekolah (Basis Data)
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('komunikasi')}
                className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  detailTab === 'komunikasi'
                    ? 'bg-[#2E6496] text-[#FFFFFF]'
                    : 'text-[#475569] hover:bg-[#FAF8F5]'
                }`}
              >
                Komunikasi &amp; Catatan Internal ({activeReportDetail.messages.length + activeReportDetail.internalNotes.length})
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('riwayat')}
                className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  detailTab === 'riwayat'
                    ? 'bg-[#2E6496] text-[#FFFFFF]'
                    : 'text-[#475569] hover:bg-[#FAF8F5]'
                }`}
              >
                Riwayat Status ({activeReportDetail.history.length})
              </button>
            </div>

            {detailTab === 'pemeriksaan' && (
              <ReportInspectionView
                report={activeReportDetail.report}
                selectedMethods={selectedMethods}
                onToggleMethod={handleToggleMethod}
                isForwardedCheck={isForwardedCheck}
                onForwardedCheckChange={setIsForwardedCheck}
                forwardedToInput={forwardedToInput}
                onForwardedToInputChange={setForwardedToInput}
                onAcceptForFollowUp={handleAcceptForFollowUp}
                onOpenRejectDialog={() => {
                  setRejectReasonQuick(REJECTION_QUICK_REASONS[0]);
                  setRejectReasonCustom('');
                  setIsRejectDialogOpen(true);
                }}
                onOpenCompleteDialog={() => {
                  setSkipReasonInput('');
                  setResolutionPublicNote('');
                  setIsCompleteDialogOpen(true);
                }}
                onSaveInspectionProgress={handleSaveInspectionProgress}
                onPreviewAttachment={setLightboxMeta}
              />
            )}

            {detailTab === 'sekolah' && (
              <ReportSchoolIdentityTab
                report={activeReportDetail.report}
                schoolIdentity={activeReportDetail.schoolIdentity}
              />
            )}

            {detailTab === 'komunikasi' && (
              <ReportCommunicationTab
                report={activeReportDetail.report}
                messages={activeReportDetail.messages}
                internalNotes={activeReportDetail.internalNotes}
                infoRequestMessage={infoRequestMessage}
                onInfoRequestMessageChange={setInfoRequestMessage}
                isSendingInfoRequest={isSendingInfoRequest}
                onSendInfoRequest={handleSendInfoRequest}
                newInternalNote={newInternalNote}
                onNewInternalNoteChange={setNewInternalNote}
                isSubmittingNote={isSubmittingNote}
                onAddInternalNote={handleAddInternalNote}
              />
            )}

            {detailTab === 'riwayat' && (
              <ReportHistoryTab history={activeReportDetail.history} />
            )}
          </section>
        ) : (
          <ReportsQueuePanel
            counters={counters}
            filteredReports={filteredReports}
            isLoadingQueue={isLoadingQueue}
            isRefreshingQueue={isRefreshingQueue}
            queueError={queueError}
            isLoadingDetail={isLoadingDetail}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filterStartDate={filterStartDate}
            onFilterStartDateChange={setFilterStartDate}
            filterEndDate={filterEndDate}
            onFilterEndDateChange={setFilterEndDate}
            onRefreshQueue={() => loadQueue(false)}
            onOpenReportDetail={handleOpenReportDetail}
          />
        )}
      </main>

      {isRejectDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-view-enter">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            className="daradik-modal-dialog bg-[#FFFFFF] rounded-2xl border border-[#C9DFDC] shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto relative z-10"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#991B1B]" />
                <h3
                  id="reject-dialog-title"
                  className="font-sturdy-heading text-base font-bold text-[#1E293B]"
                >
                  Konfirmasi Tolak Laporan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectDialogOpen(false)}
                className="p-1 rounded text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Petugas wajib memberikan alasan penolakan. Alasan ini akan ditampilkan kepada orang tua dengan bahasa yang mudah dimengerti. Laporan tidak akan dihapus dari arsip.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1E293B] block">
                Pilih Alasan Cepat:
              </span>
              <div className="space-y-1.5">
                {REJECTION_QUICK_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer select-none ${
                      rejectReasonQuick === reason
                        ? 'bg-[#EBF3F8] border-[#2E6496] font-semibold text-[#1E293B]'
                        : 'bg-[#FAF8F5] border-[#E4E0D8] text-[#475569]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection-quick-reason"
                      value={reason}
                      checked={rejectReasonQuick === reason}
                      onChange={() => setRejectReasonQuick(reason)}
                      className="w-4 h-4 text-[#2E6496] focus:ring-[#2E6496]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {rejectReasonQuick === 'Alasan lainnya.' && (
                <div className="pt-2">
                  <textarea
                    rows={3}
                    value={rejectReasonCustom}
                    onChange={(e) => setRejectReasonCustom(e.target.value)}
                    placeholder="Tuliskan penjelasan alasan penolakan secara jelas dan santun..."
                    className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D8]">
              <button
                type="button"
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isRejecting}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#C9DFDC] text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-[#FFFFFF] text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Menolak Laporan...' : 'Tolak & Simpan Alasan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCompleteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-view-enter">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-dialog-title"
            className="daradik-modal-dialog bg-[#FFFFFF] rounded-2xl border border-[#C9DFDC] shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2E6496]" />
                <h3
                  id="complete-dialog-title"
                  className="font-sturdy-heading text-base font-bold text-[#1E293B]"
                >
                  Selesaikan &amp; Simpan Hasil Penanganan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteDialogOpen(false)}
                className="p-1 rounded text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeReportDetail?.report.status === 'SEDANG_DITELAAH' && (
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
                <span className="font-bold block">
                  Melewati Tahap Pemeriksaan Lanjutan:
                </span>
                <p className="leading-relaxed">
                  Catat alasan mengapa tahap pemeriksaan lanjutan dilewati sebelum menyelesaikan laporan.
                </p>
                <input
                  type="text"
                  value={skipReasonInput}
                  onChange={(e) => setSkipReasonInput(e.target.value)}
                  placeholder="Alasan melewati pemeriksaan (misal: dokumen awal telah cukup membuktikan)..."
                  className="w-full mt-1.5 p-2 rounded-lg bg-[#FFFFFF] border border-[#FDE68A] text-xs text-[#1E293B] focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1E293B] block">
                Pilih Kesimpulan Hasil Penanganan:
              </span>
              <div className="space-y-1.5">
                {RESOLUTION_OUTCOME_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer select-none ${
                      chosenOutcome === opt.code
                        ? 'bg-[#EBF3F8] border-[#2E6496] font-semibold text-[#1E293B]'
                        : 'bg-[#FAF8F5] border-[#E4E0D8] text-[#475569]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution-outcome-choice"
                      value={opt.code}
                      checked={chosenOutcome === opt.code}
                      onChange={() => setChosenOutcome(opt.code)}
                      className="w-4 h-4 text-[#2E6496] focus:ring-[#2E6496] mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-[#1E293B]">{opt.label}</div>
                      <div className="text-[11px] text-[#475569] mt-0.5">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="public-resolution-note-input"
                  className="block text-xs font-bold text-[#1E293B]"
                >
                  Catatan Hasil Penanganan untuk Pelapor:
                </label>
                <span className="text-[11px] font-semibold text-[#2E6496]">Rekomendasi Jawaban</span>
              </div>

              <div className="space-y-1.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC]">
                <div className="text-[11px] font-semibold text-[#64748B] mb-1">
                  Pilih rekomendasi jawaban di bawah untuk mengisi otomatis:
                </div>
                {RECOMMENDED_RESOLUTION_NOTES[chosenOutcome]?.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResolutionPublicNote(template)}
                    className="w-full text-left p-2 rounded-lg bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#E4E0D8] hover:border-[#2E6496] text-xs text-[#1E293B] transition-colors cursor-pointer flex items-start gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-[#2E6496] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{template}</span>
                  </button>
                ))}
              </div>

              <textarea
                id="public-resolution-note-input"
                rows={3}
                value={resolutionPublicNote}
                onChange={(e) => setResolutionPublicNote(e.target.value)}
                placeholder="Tuliskan atau sesuaikan keterangan hasil penanganan..."
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D8]">
              <button
                type="button"
                onClick={() => setIsCompleteDialogOpen(false)}
                disabled={isCompleting}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#C9DFDC] text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={isCompleting}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isCompleting ? 'Menyimpan Hasil...' : 'Simpan & Selesaikan Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxMeta && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-view-enter"
          onClick={() => setLightboxMeta(null)}
        >
          <div
            className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D8]">
              <span className="text-sm font-bold text-[#1E293B] truncate">
                {lightboxMeta.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxMeta(null)}
                className="p-1 rounded text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2">
              <img
                src={lightboxMeta.url}
                alt={lightboxMeta.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DinasDashboardPage;
