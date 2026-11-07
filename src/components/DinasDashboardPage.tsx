import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Paperclip,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight,
  Inbox,
  User,
  Check,
  Copy,
  LogOut,
  Lock,
  Mail,
  ShieldAlert,
  Info,
  X,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  OfficerInternalNoteRow,
  OfficerProfileRecord,
  OfficerQueueReportRow,
  OfficerReportDetailBundle,
  OfficerStatusHistoryRow,
  PublicReportMessageItem,
  ReportAttachmentMeta,
  ReportVersionConflictError,
  addOfficerInternalNoteRpc,
  fetchOfficerReportsQueue,
  getActiveOfficerSession,
  openReportDetailByOfficer,
  signInOfficerWithPassword,
  signOutOfficer,
  transitionReportByOfficerRpc,
} from '../lib/supabase';
import {
  INSPECTION_METHOD_OPTIONS,
  InspectionMethodCode,
  REJECTION_QUICK_REASONS,
  RESOLUTION_OUTCOME_OPTIONS,
  ReportInternalStatus,
  ResolutionOutcomeCode,
  formatWibDateTime,
  getInspectionMethodLabel,
  getOfficerStatusLabel,
  getResolutionOutcomeOption,
  toWibDateInputString,
} from '../lib/reportTracking';

interface DinasDashboardPageProps {
  onBackToHome: () => void;
  onShowToast: (message: string) => void;
}

const RECOMMENDED_RESOLUTION_NOTES: Record<ResolutionOutcomeCode, string[]> = {
  HAS_INDICATION: [
    'Ditemukan indikasi ketidaksesuaian alokasi BOSP. Dinas Pendidikan telah menerbitkan surat peringatan dan instruksi pengembalian dana kepada pihak sekolah.',
    'Pemeriksaan dokumen membuktikan adanya pungutan di luar ketentuan Juknis BOSP. Sekolah diinstruksikan menghentikan pungutan dan mengembalikan biaya kepada orang tua siswa.',
  ],
  NO_INDICATION: [
    'Pemeriksaan SPJ dan klarifikasi membuktikan alokasi BOSP telah sesuai ketentuan peraturan perundang-undangan dan tidak ditemukan indikasi pelanggaran.',
    'Dokumen pertanggungjawaban sekolah lengkap dan sah. Dugaan dalam laporan telah diklarifikasi sesuai prosedur pengelolaan BOSP.',
  ],
  INCONCLUSIVE: [
    'Bukti dan keterangan yang dihimpun belum cukup membuktikan dugaan. Laporan dicatat dalam arsip pengawasan berkala Dinas Pendidikan.',
    'Dokumen pendukung yang tersedia belum memadai untuk disimpulkan. Pengawasan tindak lanjut akan dimasukkan dalam jadwal audit berkala dinas.',
  ],
};

type QueueCategoryTab =
  | 'ALL'
  | 'UNOPENED'
  | 'REVIEW'
  | 'INSPECTION'
  | 'WAITING_INFO'
  | 'COMPLETED'
  | 'REJECTED';

type DetailActiveSection =
  | 'pemeriksaan'
  | 'sekolah'
  | 'komunikasi'
  | 'riwayat';

export const DinasDashboardPage: React.FC<DinasDashboardPageProps> = ({
  onBackToHome,
  onShowToast,
}) => {
  // Autentikasi Petugas Dinas
  const [officer, setOfficer] = useState<OfficerProfileRecord | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Antrean Laporan
  const [queueReports, setQueueReports] = useState<OfficerQueueReportRow[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<QueueCategoryTab>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Tampilan Detail Laporan Terbuka (Hanya terbuka setelah klik "Buka Detail")
  const [activeReportDetail, setActiveReportDetail] =
    useState<OfficerReportDetailBundle | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<DetailActiveSection>('pemeriksaan');
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);

  // Form Tindakan Petugas
  const [selectedMethods, setSelectedMethods] = useState<InspectionMethodCode[]>([]);
  const [isForwardedCheck, setIsForwardedCheck] = useState<boolean>(false);
  const [forwardedToInput, setForwardedToInput] = useState<string>('Inspektorat Daerah');
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  // Permintaan Informasi Tambahan
  const [infoRequestMessage, setInfoRequestMessage] = useState<string>('');
  const [isSendingInfoRequest, setIsSendingInfoRequest] = useState<boolean>(false);

  // Modal Dialog Konfirmasi: Tolak Laporan
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [rejectReasonQuick, setRejectReasonQuick] = useState<string>(
    REJECTION_QUICK_REASONS[0]
  );
  const [rejectReasonCustom, setRejectReasonCustom] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Modal Dialog Konfirmasi: Selesaikan Laporan
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState<boolean>(false);
  const [chosenOutcome, setChosenOutcome] = useState<ResolutionOutcomeCode>('HAS_INDICATION');
  const [resolutionPublicNote, setResolutionPublicNote] = useState<string>('');
  const [skipReasonInput, setSkipReasonInput] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  // Lightbox Pratinjau Bukti
  const [lightboxMeta, setLightboxMeta] = useState<{ url: string; title: string } | null>(
    null
  );

  // Periksa Sesi Petugas Saat Mount
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

  // Muat Antrean Laporan dari Supabase Saat Petugas Terotentikasi
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

  // Menghitung 5 Counter Ringkasan Murni dari Data Asli Supabase
  const counters = useMemo(() => {
    let totalMasuk = queueReports.length;
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

  // Filter & Urutkan: Laporan yang belum selesai diurutkan paling lama masuk terlebih dahulu (created_at ASC)
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return queueReports
      .filter((r) => {
        // Tab Category Filter
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

        // Text Search Filter
        if (q) {
          const matchTicket = r.ticket_code.toLowerCase().includes(q);
          const matchSchool = r.school_name.toLowerCase().includes(q);
          const matchNpsn = r.school_npsn.toLowerCase().includes(q);
          const matchCategory = r.category.toLowerCase().includes(q);
          if (!matchTicket && !matchSchool && !matchNpsn && !matchCategory) {
            return false;
          }
        }

        // Date Range Filter (WIB date YYYY-MM-DD)
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
        // Laporan belum selesai: waktu masuk paling lama terlebih dahulu
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [queueReports, activeTab, searchQuery, filterStartDate, filterEndDate]);

  // Petugas Membuka Detail Laporan (RPC atomik: transisi satu kali jika berstatus QUEUED)
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

  // 1. Terima Laporan untuk Pemeriksaan Lanjutan (Stage 3 -> Stage 4)
  const handleAcceptForFollowUp = async () => {
    if (!activeReportDetail) return;
    setConflictBanner(null);

    try {
      const res = await transitionReportByOfficerRpc({
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

  // 2. Tolak Laporan dengan Alasan Wajib (Stage 3 -> TIDAK_DAPAT_DITINDAKLANJUTI)
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

  // 3. Simpan Catatan Kegiatan Pemeriksaan Lanjutan
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

  // 4. Minta Informasi Tambahan kepada Pelapor (Substatus pada Stage 4)
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

  // 5. Selesaikan Pemeriksaan & Simpan Hasil Penanganan (Stage 4 / Stage 3 -> COMPLETED)
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

  // Tambah Catatan Internal Khusus Petugas
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

  // ---------------------------------------------------------------------------
  // TAMPILAN 1: MEMERIKSA STATUS AUTENTIKASI AWAL
  // ---------------------------------------------------------------------------
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="p-8 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#2E6496] animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-[#1E293B]">
            Memeriksa sesi petugas Dinas Pendidikan...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TAMPILAN 2: FORM LOGIN PETUGAS RESMI (SUPABASE AUTH GATE)
  // ---------------------------------------------------------------------------
  if (!officer) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#1E293B] cursor-pointer mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#2E6496]" />
              <span>Kembali ke Pencarian Sekolah</span>
            </button>

            <img
              src="/logo-daradik.png"
              alt="Logo DARADIK"
              className="h-8 w-auto mx-auto select-none"
            />
            <h1 className="font-sturdy-heading text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
              Portal Administrator Dinas Pendidikan
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Masuk dengan akun administrator untuk memeriksa dan mengelola laporan pengaduan BOSP.
            </p>
          </div>

          <form
            onSubmit={handleLoginSubmit}
            className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
          >
            {loginError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="officer-email"
                className="block text-xs font-bold text-[#1E293B]"
              >
                Username / Email Administrator
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="officer-email"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="officer-password"
                className="block text-xs font-bold text-[#1E293B]"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="officer-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <span>Masuk ke Dashboard</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-[#475569] text-center leading-relaxed">
            Halaman ini khusus untuk aparatur pengawasan Dinas Pendidikan dan Inspektorat.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TAMPILAN 3: WORKSPACE DASHBOARD PETUGAS DINAS PENDIDIKAN
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-12">
      {/* Top Header Minimalis & Profesional */}
      <header className="bg-[#FFFFFF] border-b border-[#C9DFDC] sticky top-0 z-30 px-4 sm:px-6 lg:px-10 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer"
              title="Kembali ke portal utama"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#2E6496]" />
              <span className="hidden sm:inline">Portal Utama</span>
            </button>

            <div>
              <span className="text-[11px] font-mono font-bold text-[#2E6496] uppercase tracking-wider block">
                Dinas Pendidikan
              </span>
              <h1 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B] leading-tight">
                Pemeriksaan Pengaduan BOSP
              </h1>
            </div>
          </div>

          {/* Profil Petugas & Tombol Keluar */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-[#1E293B] block">
                {officer.full_name}
              </span>
              <span className="text-[11px] text-[#475569] block">
                {officer.jabatan}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#FEF2F2] hover:text-[#991B1B] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Keluar dari akun petugas"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 space-y-6">
        {/* Banner Penanganan Konflik Optimistic Concurrency */}
        {conflictBanner && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-view-enter"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{conflictBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeReportDetail) {
                  openReportDetailByOfficer(activeReportDetail.report.id);
                }
                loadQueue(true);
              }}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#FECACA] text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]/60 cursor-pointer self-start sm:self-auto shrink-0"
            >
              Muat Ulang Data Terbaru
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------------
            BAGIAN A: 5 COUNTER RINGKASAN DATA REAL SUPABASE
           ------------------------------------------------------------------- */}
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

        {/* -------------------------------------------------------------------
            JIKA DETAIL LAPORAN SEDANG DIBUKA PETUGAS
           ------------------------------------------------------------------- */}
        {activeReportDetail ? (
          <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-view-enter">
            {/* Header Detail & Navigasi Tutup */}
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

            {/* Navigasi Tab Pengelompokan Detail */}
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

            {/* TAB 1: PEMERIKSAAN & TINDAKAN UTAMA */}
            {detailTab === 'pemeriksaan' && (
              <div className="space-y-6 animate-view-enter">
                {/* 1. Informasi Utama Laporan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                    <span className="text-[#475569] block">Kategori Dugaan:</span>
                    <span className="font-bold text-[#1E293B] block">
                      {activeReportDetail.report.category}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                    <span className="text-[#475569] block">Pihak yang Meminta:</span>
                    <span className="font-bold text-[#1E293B] block">
                      {activeReportDetail.report.requester_role}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                    <span className="text-[#475569] block">Jumlah Berkas Bukti:</span>
                    <span className="font-bold text-[#1E293B] block tabular-nums">
                      {activeReportDetail.report.attachment_count} berkas
                    </span>
                  </div>
                </div>

                {/* 3. Kronologi Laporan */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#1E293B] block">
                    Kronologi / Uraian Pelapor:
                  </span>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                    {activeReportDetail.report.notes_encrypted ||
                      'Tidak ada catatan kronologi tertulis.'}
                  </div>
                </div>

                {/* 4. Bukti atau Dokumen Pendukung */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1E293B] block">
                    Bukti Pendukung:
                  </span>
                  {activeReportDetail.report.attachments_json &&
                  activeReportDetail.report.attachments_json.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeReportDetail.report.attachments_json.map((att, idx) => (
                        <div
                          key={`att-det-${idx}`}
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
                                setLightboxMeta({ url: att.url!, title: att.name })
                              }
                              className="min-h-[32px] px-3 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold text-[#2E6496] hover:bg-[#EBF3F8] cursor-pointer inline-flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-3.5">
                      Pelapor tidak melampirkan berkas gambar atau dokumen saat pengiriman awal.
                    </p>
                  )}
                </div>

                {/* 5. Hasil Pembacaan OCR (jika ada) */}
                {activeReportDetail.report.ocr_text && (
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-2 text-xs">
                    <span className="font-bold text-[#1E293B] block">
                      Hasil Pembacaan Pemindai Pesan WhatsApp (OCR):
                    </span>
                    <p className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E4E0D8] text-[#1E293B] leading-relaxed">
                      &ldquo;{activeReportDetail.report.ocr_text}&rdquo;
                    </p>
                    {activeReportDetail.report.ocr_bosp_fact && (
                      <p className="text-[#475569]">
                        Catatan pencocokan: {activeReportDetail.report.ocr_bosp_fact}
                      </p>
                    )}
                  </div>
                )}

                {/* 8. Tombol Tindakan Sesuai Status Saat Ini */}
                <div className="pt-4 border-t border-[#E4E0D8] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E6496] block">
                    Tindakan Sesuai Status ({activeReportDetail.report.status})
                  </span>

                  {/* KONDISI A: Status SEDANG_DITELAAH -> Dua Tindakan Utama (Terima / Tolak) */}
                  {activeReportDetail.report.status === 'SEDANG_DITELAAH' && (
                    <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[#1E293B]">
                          Keputusan Penelaahan Awal
                        </h4>
                        <p className="text-xs text-[#475569] leading-relaxed">
                          Tentukan apakah laporan memiliki informasi awal yang cukup untuk dilanjutkan ke pemeriksaan, atau tidak memenuhi syarat untuk ditindaklanjuti.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={handleAcceptForFollowUp}
                          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Terima untuk Ditindaklanjuti</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectReasonQuick(REJECTION_QUICK_REASONS[0]);
                            setRejectReasonCustom('');
                            setIsRejectDialogOpen(true);
                          }}
                          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FEF2F2] border border-[#FECACA] text-xs sm:text-sm font-bold text-[#991B1B] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Tolak Laporan</span>
                        </button>

                        {/* Opsi selesaikan langsung jika pemeriksaan lanjutan tidak diperlukan */}
                        <button
                          type="button"
                          onClick={() => {
                            setSkipReasonInput('');
                            setResolutionPublicNote('');
                            setIsCompleteDialogOpen(true);
                          }}
                          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-semibold text-[#475569] cursor-pointer sm:ml-auto"
                        >
                          Selesaikan Langsung (Lewati Pemeriksaan)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KONDISI B: Status PEMERIKSAAN_LANJUTAN -> Rekam Pemeriksaan, Minta Info, atau Selesaikan */}
                  {activeReportDetail.report.status === 'PEMERIKSAAN_LANJUTAN' && (
                    <div className="space-y-5">
                      {/* Rekam Metode Pemeriksaan Nyata */}
                      <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-[#1E293B]">
                            Kegiatan Pemeriksaan Lanjutan yang Dilakukan
                          </h4>
                          <p className="text-xs text-[#475569]">
                            Centang metode pemeriksaan yang nyata dilakukan agar pelapor tidak melihat seolah-olah dilakukan pemeriksaan lapangan jika kenyataannya hanya pemeriksaan dokumen.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {INSPECTION_METHOD_OPTIONS.map((method) => {
                            const isChecked = selectedMethods.includes(method.code);
                            return (
                              <label
                                key={method.code}
                                className={`min-h-[44px] p-3 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-[#EBF3F8] border-[#2E6496] font-semibold text-[#1E293B]'
                                    : 'bg-[#FFFFFF] border-[#C9DFDC] text-[#475569]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMethods((prev) => [...prev, method.code]);
                                    } else {
                                      setSelectedMethods((prev) =>
                                        prev.filter((m) => m !== method.code)
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496]"
                                />
                                <span>{method.label}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Indikator Penerusan ke Instansi Terkait */}
                        <div className="pt-2 border-t border-[#E4E0D8] space-y-2">
                          <label className="text-xs flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isForwardedCheck}
                              onChange={(e) => setIsForwardedCheck(e.target.checked)}
                              className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496]"
                            />
                            <span className="font-semibold text-[#1E293B]">
                              Proses diteruskan ke instansi terkait
                            </span>
                          </label>

                          {isForwardedCheck && (
                            <div className="pl-6">
                              <input
                                type="text"
                                value={forwardedToInput}
                                onChange={(e) => setForwardedToInput(e.target.value)}
                                placeholder="Nama instansi (contoh: Inspektorat Daerah)..."
                                className="w-full sm:w-80 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveInspectionProgress}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-[#2E6496]" />
                          <span>Simpan Catatan Metode Pemeriksaan</span>
                        </button>
                      </div>

                      {/* Tombol Penyelesaian Pemeriksaan */}
                      <div className="p-5 rounded-2xl bg-[#EBF3F8]/50 border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-[#1E293B]">
                            Pemeriksaan Selesai Dilaksanakan?
                          </h4>
                          <p className="text-xs text-[#475569]">
                            Simpan kesimpulan dan catatan hasil penanganan akhir untuk pelapor.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSkipReasonInput('');
                            setResolutionPublicNote('');
                            setIsCompleteDialogOpen(true);
                          }}
                          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-2 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selesaikan &amp; Simpan Hasil Penanganan</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KONDISI C: Status Selesai / Ditolak (Read-only Summary) */}
                  {activeReportDetail.report.status === 'COMPLETED' && (
                    <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="font-bold text-[#166534]">
                          Hasil Pemeriksaan: {getResolutionOutcomeOption(activeReportDetail.report.resolution_outcome)?.label || 'Selesai'}
                        </span>
                        <span className="font-mono text-[#166534] tabular-nums">
                          {formatWibDateTime(activeReportDetail.report.resolved_at)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1E293B] bg-[#FFFFFF] p-3.5 rounded-xl border border-[#BBF7D0] leading-relaxed">
                        {activeReportDetail.report.public_resolution_note}
                      </p>
                    </div>
                  )}

                  {activeReportDetail.report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI' && (
                    <div className="p-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="font-bold text-[#991B1B]">
                          Laporan Tidak Dapat Ditindaklanjuti
                        </span>
                        <span className="font-mono text-[#991B1B] tabular-nums">
                          {formatWibDateTime(activeReportDetail.report.resolved_at)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1E293B] bg-[#FFFFFF] p-3.5 rounded-xl border border-[#FECACA] leading-relaxed">
                        {activeReportDetail.report.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: IDENTITAS SEKOLAH DARI DATABASE ASLI (public.schools_all) */}
            {detailTab === 'sekolah' && (
              <div className="space-y-5 animate-view-enter text-xs sm:text-sm">
                <div className="space-y-1">
                  <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
                    Data Resmi Sekolah Terlapor
                  </h3>
                  <p className="text-xs text-[#475569]">
                    Informasi diverifikasi langsung dari basis data Dapodik &amp; BOSP DARADIK berdasarkan NPSN {activeReportDetail.report.school_npsn}.
                  </p>
                </div>

                {activeReportDetail.schoolIdentity ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                      <span className="text-xs text-[#475569] block">Nama Resmi Sekolah:</span>
                      <span className="font-bold text-[#1E293B] block">
                        {activeReportDetail.schoolIdentity.name}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                      <span className="text-xs text-[#475569] block">NPSN:</span>
                      <span className="font-mono font-bold text-[#1D4F7A] block tabular-nums">
                        {activeReportDetail.schoolIdentity.npsn}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                      <span className="text-xs text-[#475569] block">Jenjang &amp; Status:</span>
                      <span className="font-bold text-[#1E293B] block">
                        {activeReportDetail.schoolIdentity.jenjang || 'Data belum tersedia'} •{' '}
                        {activeReportDetail.schoolIdentity.schoolType || 'Data belum tersedia'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                      <span className="text-xs text-[#475569] block">Kepala Sekolah:</span>
                      <span className="font-bold text-[#1E293B] block">
                        {activeReportDetail.schoolIdentity.principalName || 'Data belum tersedia'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1 sm:col-span-2">
                      <span className="text-xs text-[#475569] block">Alamat Sekolah:</span>
                      <span className="text-[#1E293B] block leading-relaxed">
                        {activeReportDetail.schoolIdentity.address || 'Data belum tersedia'}
                      </span>
                      <div className="text-xs text-[#475569] pt-1">
                        Kec. {activeReportDetail.schoolIdentity.kecamatan || 'Data belum tersedia'},{' '}
                        {activeReportDetail.schoolIdentity.kabupaten || 'Data belum tersedia'},{' '}
                        {activeReportDetail.schoolIdentity.provinsi || 'Data belum tersedia'}
                      </div>
                    </div>

                    {activeReportDetail.schoolIdentity.studentCount !== null && (
                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                        <span className="text-xs text-[#475569] block">Jumlah Siswa:</span>
                        <span className="font-bold text-[#1E293B] block tabular-nums">
                          {activeReportDetail.schoolIdentity.studentCount} murid
                        </span>
                      </div>
                    )}

                    {activeReportDetail.schoolIdentity.totalBosp !== null && (
                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
                        <span className="text-xs text-[#475569] block">Alokasi BOSP 2026:</span>
                        <span className="font-mono font-bold text-[#166534] block tabular-nums">
                          Rp {activeReportDetail.schoolIdentity.totalBosp.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      <span>Data Master Sekolah Belum Ditemukan</span>
                    </div>
                    <p className="leading-relaxed">
                      NPSN {activeReportDetail.report.school_npsn} tidak tercatat dalam tabel master sekolah aktif. Informasi yang tersimpan pada laporan: {activeReportDetail.report.school_name} ({activeReportDetail.report.kecamatan}, {activeReportDetail.report.kabupaten}).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: KOMUNIKASI & CATATAN INTERNAL */}
            {detailTab === 'komunikasi' && (
              <div className="space-y-6 animate-view-enter">
                {/* Bagian A: Permintaan Informasi Tambahan & Riwayat Komunikasi dengan Pelapor */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
                      Komunikasi Dua Arah dengan Pelapor Anonim
                    </h3>
                    <p className="text-xs text-[#475569]">
                      Pesan pada kolom ini dapat dibaca oleh orang tua pemegang kode tiket untuk melengkapi bukti.
                    </p>
                  </div>

                  {activeReportDetail.messages.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {activeReportDetail.messages.map((m) => {
                        const isOfficerMsg = m.sender_type === 'OFFICER';
                        return (
                          <div
                            key={m.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              isOfficerMsg
                                ? 'bg-[#EBF3F8] border-[#C9DFDC]'
                                : 'bg-[#FAF8F5] border-[#E4E0D8]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`font-bold ${
                                  isOfficerMsg ? 'text-[#1D4F7A]' : 'text-[#1E293B]'
                                }`}
                              >
                                {isOfficerMsg
                                  ? 'Petugas Dinas Pendidikan'
                                  : 'Pelapor Anonim'}
                              </span>
                              <span className="font-mono text-[#475569] tabular-nums">
                                {formatWibDateTime(m.created_at)}
                              </span>
                            </div>
                            <p className="text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                              {m.message}
                            </p>
                            {m.attachments_json && m.attachments_json.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {m.attachments_json.map((att, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#C9DFDC] text-[11px] font-semibold text-[#2E6496]"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>{att.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-4">
                      Belum ada pesan komunikasi dengan pelapor pada laporan ini.
                    </p>
                  )}

                  {activeReportDetail.report.status === 'PEMERIKSAAN_LANJUTAN' && (
                    <form onSubmit={handleSendInfoRequest} className="space-y-2.5 pt-2">
                      <label
                        htmlFor="officer-request-info-input"
                        className="block text-xs font-bold text-[#1E293B]"
                      >
                        Kirim Permintaan Informasi / Bukti Tambahan kepada Pelapor:
                      </label>
                      <textarea
                        id="officer-request-info-input"
                        rows={3}
                        value={infoRequestMessage}
                        onChange={(e) => setInfoRequestMessage(e.target.value)}
                        placeholder="Jelaskan keterangan atau bukti apa yang masih dibutuhkan dari pelapor..."
                        className="w-full p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSendingInfoRequest}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSendingInfoRequest
                              ? 'Mengirim...'
                              : 'Kirim Permintaan & Pasang Status Menunggu'}
                          </span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Bagian B: Catatan Internal Petugas (Strictly Internal) */}
                <div className="pt-5 border-t border-[#E4E0D8] space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#991B1B]" />
                      <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
                        Catatan Internal Petugas (Rahasia)
                      </h3>
                    </div>
                    <p className="text-xs text-[#475569]">
                      Catatan di bawah ini hanya dapat dibaca oleh aparatur dinas yang memiliki akses dan tidak pernah ditampilkan kepada pelapor.
                    </p>
                  </div>

                  <form onSubmit={handleAddInternalNote} className="space-y-2.5">
                    <textarea
                      rows={2}
                      value={newInternalNote}
                      onChange={(e) => setNewInternalNote(e.target.value)}
                      placeholder="Tuliskan catatan internal hasil koordinasi, rapat dinas, atau berkas rahasia..."
                      className="w-full p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !newInternalNote.trim()}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <span>Simpan Catatan Internal</span>
                      </button>
                    </div>
                  </form>

                  {activeReportDetail.internalNotes.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeReportDetail.internalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#1E293B]">
                              {note.officer_name}
                            </span>
                            <span className="font-mono text-[#475569] tabular-nums">
                              {formatWibDateTime(note.created_at)}
                            </span>
                          </div>
                          <p className="text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                            {note.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#475569]">
                      Belum ada catatan internal pada laporan ini.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: RIWAYAT PERUBAHAN STATUS LENGKAP */}
            {detailTab === 'riwayat' && (
              <div className="space-y-4 animate-view-enter">
                <div className="space-y-1">
                  <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
                    Audit Log Riwayat Perubahan Status
                  </h3>
                  <p className="text-xs text-[#475569]">
                    Setiap tindakan terekam secara permanen dengan stempel waktu dan identitas aparatur.
                  </p>
                </div>

                <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] rounded-xl overflow-hidden">
                  {activeReportDetail.history.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap font-bold text-[#1E293B]">
                          <span>
                            {h.previous_status || 'Awal'} &rarr; {h.new_status}
                          </span>
                          <span className="text-[11px] font-normal text-[#475569]">
                            • {h.changed_by_name}
                          </span>
                          {h.is_internal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] font-semibold">
                              Internal
                            </span>
                          )}
                        </div>
                        {h.note && (
                          <p className="text-[#475569] leading-relaxed">{h.note}</p>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-[#475569] tabular-nums shrink-0">
                        {formatWibDateTime(h.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          /* -------------------------------------------------------------------
              BAGIAN B: SISTEM ANTREAN LAPORAN (TABEL UTAMA)
             ------------------------------------------------------------------- */
          <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Toolbar Filter & Pencarian */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
                    Daftar Antrean Pemeriksaan Laporan
                  </h2>
                  <p className="text-xs text-[#475569]">
                    Laporan yang belum selesai ditangani diurutkan berdasarkan waktu masuk paling lama terlebih dahulu.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadQueue(false)}
                  disabled={isLoadingQueue || isRefreshingQueue}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#2E6496] ${
                      isRefreshingQueue ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Segarkan Antrean</span>
                </button>
              </div>

              {/* 6 Kategori Tab Antrean */}
              <div className="flex items-center gap-1.5 border-b border-[#E4E0D8] overflow-x-auto pb-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'ALL'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Semua ({counters.totalMasuk})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('UNOPENED')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'UNOPENED'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Belum Dibuka ({counters.belumDibuka})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('REVIEW')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'REVIEW'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Sedang Ditelaah
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('INSPECTION')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'INSPECTION'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Pemeriksaan Lanjutan
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('WAITING_INFO')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'WAITING_INFO'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Menunggu Info ({counters.menungguInfo})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('COMPLETED')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'COMPLETED'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Selesai ({counters.selesai})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('REJECTED')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                    activeTab === 'REJECTED'
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : 'text-[#475569] hover:bg-[#FAF8F5]'
                  }`}
                >
                  Tidak Dapat Ditindaklanjuti
                </button>
              </div>

              {/* Pencarian & Filter Tanggal Laporan */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode tiket, nama sekolah, atau NPSN..."
                    className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#1E293B] p-1 cursor-pointer"
                      aria-label="Kosongkan pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
                    title="Dari Tanggal Laporan (WIB)"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
                    title="Sampai Tanggal Laporan (WIB)"
                  />

                  {(filterStartDate || filterEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                      className="min-h-[42px] px-3 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] text-xs text-[#475569] hover:text-[#1E293B] cursor-pointer shrink-0"
                      title="Reset tanggal"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message pada Antrean */}
            {queueError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold flex items-center justify-between gap-3"
              >
                <span>{queueError}</span>
                <button
                  type="button"
                  onClick={() => loadQueue(false)}
                  className="px-3 py-1 rounded-lg bg-[#FFFFFF] border border-[#FECACA] text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]/60 cursor-pointer shrink-0"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Tabel Antrean Ringkas & Responsif (Kartu di HP, Tabel di Tablet/Desktop) */}
            <div className="border border-[#C9DFDC] rounded-xl overflow-hidden bg-[#FFFFFF]">
              {/* Tampilan Kartu Mobile (<768px) */}
              <div className="md:hidden divide-y divide-[#E4E0D8]">
                {isLoadingQueue ? (
                  <div className="px-4 py-12 text-center text-xs text-[#475569]">
                    <RefreshCw className="w-5 h-5 text-[#2E6496] animate-spin mx-auto mb-2" />
                    <span>Memuat antrean laporan pengaduan...</span>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="px-4 py-12 text-center text-[#475569]">
                    <Inbox className="w-6 h-6 text-[#475569] mx-auto mb-2" />
                    <div className="font-bold text-[#1E293B] text-sm">
                      Belum ada laporan yang masuk.
                    </div>
                    <p className="text-xs text-[#475569] mt-1">
                      Tidak ada pengaduan pada kategori atau filter tanggal yang dipilih.
                    </p>
                  </div>
                ) : (
                  filteredReports.map((r) => {
                    const isClosed =
                      r.status === 'COMPLETED' ||
                      r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI';
                    return (
                      <div
                        key={`mobile-${r.id}`}
                        className={`p-4 space-y-2.5 bg-[#FFFFFF] ${
                          isClosed ? 'opacity-85' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-mono font-bold text-xs text-[#2E6496] tabular-nums">
                              {r.ticket_code}
                            </div>
                            <div className="text-[11px] text-[#64748B] tabular-nums">
                              {formatWibDateTime(r.created_at)}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                              r.status === 'COMPLETED'
                                ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                                : r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                                ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                                : r.waiting_additional_info
                                ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                : r.status === 'SEDANG_DITELAAH'
                                ? 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
                                : 'bg-[#FAF8F5] text-[#475569] border-[#C9DFDC]'
                            }`}
                          >
                            {getOfficerStatusLabel(
                              r.status,
                              r.waiting_additional_info,
                              r.opened_at
                            )}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#1E293B]">
                            {r.school_name}
                          </div>
                          <div className="text-[11px] text-[#64748B] font-mono">
                            NPSN: {r.school_npsn} • {r.kabupaten}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#F1F5F9]">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#1E293B] truncate">
                              {r.category}
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              Pelapor: {r.requester_role}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenReportDetail(r.id)}
                            disabled={isLoadingDetail}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                          >
                            <span>Buka Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tampilan Tabel Tablet & Desktop (>=768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1E293B]">
                  <thead className="bg-[#FAF8F5] border-b border-[#C9DFDC] text-[#475569] uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th scope="col" className="px-3.5 py-3 w-48">Kode &amp; Waktu</th>
                      <th scope="col" className="px-3.5 py-3">Sekolah &amp; Wilayah</th>
                      <th scope="col" className="px-3.5 py-3 w-48">Kategori Masalah</th>
                      <th scope="col" className="px-3.5 py-3 w-40">Status</th>
                      <th scope="col" className="px-3.5 py-3 text-right w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D8] bg-[#FFFFFF]">
                    {isLoadingQueue ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-[#475569]">
                          <RefreshCw className="w-5 h-5 text-[#2E6496] animate-spin mx-auto mb-2" />
                          <span>Memuat antrean laporan pengaduan...</span>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-14 text-center text-[#475569]">
                          <Inbox className="w-6 h-6 text-[#475569] mx-auto mb-2" />
                          <div className="font-bold text-[#1E293B] text-sm">
                            Belum ada laporan yang masuk.
                          </div>
                          <p className="text-xs text-[#475569] mt-1">
                            Tidak ada pengaduan pada kategori atau filter tanggal yang dipilih.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((r) => {
                        const isClosed =
                          r.status === 'COMPLETED' ||
                          r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI';
                        return (
                          <tr
                            key={r.id}
                            className={`hover:bg-[#FAF8F5] transition-colors ${
                              isClosed ? 'opacity-85' : ''
                            }`}
                          >
                            <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                              <div className="font-mono font-bold text-[#2E6496] tabular-nums">
                                {r.ticket_code}
                              </div>
                              <div className="text-[11px] text-[#64748B] tabular-nums mt-0.5">
                                {formatWibDateTime(r.created_at)}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 align-middle">
                              <div className="font-bold text-[#1E293B] line-clamp-1">
                                {r.school_name}
                              </div>
                              <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                                NPSN: {r.school_npsn} • {r.kabupaten}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 align-middle">
                              <div className="text-xs font-semibold text-[#1E293B] line-clamp-1">
                                {r.category}
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">
                                Pelapor: {r.requester_role}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  r.status === 'COMPLETED'
                                    ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                                    : r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                                    ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                                    : r.waiting_additional_info
                                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                    : r.status === 'SEDANG_DITELAAH'
                                    ? 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
                                    : 'bg-[#FAF8F5] text-[#475569] border-[#C9DFDC]'
                                }`}
                              >
                                {getOfficerStatusLabel(
                                  r.status,
                                  r.waiting_additional_info,
                                  r.opened_at
                                )}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right align-middle whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenReportDetail(r.id)}
                                disabled={isLoadingDetail}
                                className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Buka Detail</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =======================================================================
          MODAL KONFIRMASI: TOLAK LAPORAN DENGAN ALASAN WAJIB (Stage 3)
         ======================================================================= */}
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

      {/* =======================================================================
          MODAL KONFIRMASI: SELESAIKAN LAPORAN DENGAN KESIMPULAN HASIL (Stage 5)
         ======================================================================= */}
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

              {/* Rekomendasi Jawaban Cepat */}
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

      {/* =======================================================================
          LIGHTBOX PRATINJAU GAMBAR / BUKTI
         ======================================================================= */}
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
