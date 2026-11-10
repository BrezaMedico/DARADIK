import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Paperclip,
  Send,
  CheckCircle2,
  X,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  Upload,
  RefreshCw,
  Eye,
  Check,
  MessageSquare,
  Search,
} from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';
import type { ReportAttachmentMeta, SchoolData } from '@/types';
import {
  fetchReportCaptchaChallenge,
  submitPublicReportRpc,
  uploadReportEvidenceFile,
} from '@/services/supabase';
import { formatWibDateTime } from '@/utils/reportTracking';
import {
  COOKIE_CONSENT_KEY,
  ENABLE_DAILY_LIMIT,
  JENIS_PUNGUTAN_OPTIONS,
  MAX_DAILY_REPORTS,
  PIHAK_MEMINTA_OPTIONS,
  compressImageFile,
  generateMathChallenge,
  getCookie,
  getDailyReportData,
  hashCaptchaAnswer,
  recordReportSubmissionQuota,
  saveTicketBookmarkToBrowserCookie,
  setCookie,
  type ChosenSchoolTarget,
  type MathChallengeState,
  type SubmissionSuccessState,
  type UploadedFileItem,
} from './reportFormUtils';
import { ScrambleToAsteriskCipher } from './components/ScrambleCipherAnimation';
import { ReportSuccessReceipt } from './components/ReportSuccessReceipt';
import {
  CookieConsentBanner,
  ReportPolicyModal,
} from './components/ReportPolicyModal';
import { SchoolTargetSelector } from './components/SchoolTargetSelector';
import { MathCaptchaSection } from './components/MathCaptchaSection';

export interface AnonymousReportPageProps {
  selectedSchool?: SchoolData | null;
  preselectSchool?: boolean;
  onChangeSchool: (school: SchoolData) => void;
  prefilledCategory?: string;
  prefilledAttachment?: string;
  prefilledOcrText?: string;
  prefilledOcrBospFact?: string;
  onCancel: () => void;
  onBackToHome?: () => void;
  onOpenLiveTracking?: () => void;
  onSubmitSuccess: (ticketCode: string, notes: string, category: string) => void;
}

export {
  ENABLE_DAILY_LIMIT,
  JENIS_PUNGUTAN_OPTIONS,
  PIHAK_MEMINTA_OPTIONS,
  type SubmissionSuccessState,
  type UploadedFileItem,
};

export const AnonymousReportPage: React.FC<AnonymousReportPageProps> = ({
  selectedSchool,
  preselectSchool = false,
  onChangeSchool,
  prefilledCategory = '',
  prefilledAttachment = '',
  prefilledOcrText = '',
  prefilledOcrBospFact = '',
  onCancel,
  onBackToHome,
  onOpenLiveTracking,
  onSubmitSuccess,
}) => {
  const isDirectItemPrefill = Boolean(prefilledCategory) || preselectSchool;
  const [chosenSchool, setChosenSchool] = useState<ChosenSchoolTarget | null>(() => {
    if (isDirectItemPrefill && selectedSchool) {
      return {
        id: selectedSchool.id,
        name: selectedSchool.name,
        npsn: selectedSchool.npsn,
        jenjang: (selectedSchool.jenjang || selectedSchool.educationLevel || 'SMK') as
          | 'SD'
          | 'SMP'
          | 'SMA'
          | 'SMK',
        kabupaten: selectedSchool.kabupaten,
        kecamatan: selectedSchool.kecamatan,
        provinsi: selectedSchool.provinsi,
      };
    }
    return null;
  });

  const [isSearchingSchool, setIsSearchingSchool] = useState<boolean>(() => !chosenSchool);

  const initialJenisPungutan = useMemo(() => {
    if (!prefilledCategory) return '';
    const lower = prefilledCategory.toLowerCase();
    const matched = JENIS_PUNGUTAN_OPTIONS.find(
      (opt) => lower.includes(opt.value) || lower.includes(opt.label.toLowerCase())
    );
    return matched ? matched.value : 'lainnya';
  }, [prefilledCategory]);

  const [jenisPungutan, setJenisPungutan] = useState<string>(initialJenisPungutan);
  const [isJenisDropdownOpen, setIsJenisDropdownOpen] = useState<boolean>(false);
  const [jenisPungutanLainnya, setJenisPungutanLainnya] = useState<string>(() => {
    if (prefilledCategory && initialJenisPungutan === 'lainnya') {
      return prefilledCategory;
    }
    return '';
  });
  const jenisDropdownRef = useRef<HTMLDivElement | null>(null);

  const [pihakMeminta, setPihakMeminta] = useState<string>('');
  const [pihakLainnyaDetail, setPihakLainnyaDetail] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [attachments, setAttachments] = useState<UploadedFileItem[]>(() => {
    if (prefilledAttachment) {
      return [
        {
          id: 'prefilled-att-1',
          name: prefilledAttachment,
          sizeFormatted: 'Referensi Data',
        },
      ];
    }
    return [];
  });
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('');

  const [hasCookieConsent, setHasCookieConsent] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    const rawCookie = getCookie(COOKIE_CONSENT_KEY);
    const rawStorage = typeof localStorage !== 'undefined' ? localStorage.getItem(COOKIE_CONSENT_KEY) : null;
    return rawCookie === 'true' || rawStorage === 'true';
  });
  const [dailyQuotaCount, setDailyQuotaCount] = useState<number>(
    () => getDailyReportData().count
  );

  const [mathChallenge, setMathChallenge] =
    useState<MathChallengeState>(generateMathChallenge);
  const [mathInput, setMathInput] = useState<string>('');

  const handleRegenerateCaptcha = async () => {
    setMathInput('');
    try {
      const serverCap = await fetchReportCaptchaChallenge();
      setMathChallenge({
        textToDraw: serverCap.question,
        token: serverCap.token,
        timestamp: Date.now(),
        salt: '',
      });
    } catch {
      setMathChallenge(generateMathChallenge());
    }
  };

  useEffect(() => {
    handleRegenerateCaptcha();
  }, []);

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const [isPolicyAgreed, setIsPolicyAgreed] = useState<boolean>(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitModalSuccess, setIsSubmitModalSuccess] = useState<boolean>(false);
  const [submitStepLabel, setSubmitStepLabel] = useState<string>('Menyimpan ke server...');
  const [submissionSuccess, setSubmissionSuccess] =
    useState<SubmissionSuccessState | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        jenisDropdownRef.current &&
        !jenisDropdownRef.current.contains(e.target as Node)
      ) {
        setIsJenisDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - attachments.length;
    if (remainingSlots <= 0) {
      setValidationError('Maksimal lampiran telah tercapai (maksimal 5 berkas).');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    for (const file of filesToProcess) {
      if (file.size > 15 * 1024 * 1024) {
        setValidationError(`Ukuran berkas ${file.name} terlalu besar (maksimal 15 MB).`);
        return;
      }
    }

    setIsCompressing(true);
    try {
      const compressedResults = await Promise.all(
        filesToProcess.map((f) => compressImageFile(f))
      );
      setAttachments((prev) => [...prev, ...compressedResults]);
      if (validationError?.includes('lampiran') || validationError?.includes('bukti')) {
        setValidationError(null);
      }
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleAcceptCookieConsent = () => {
    setCookie(COOKIE_CONSENT_KEY, 'true', 365);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    }
    setHasCookieConsent(true);
  };

  const handleInitialSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (ENABLE_DAILY_LIMIT && dailyQuotaCount >= MAX_DAILY_REPORTS) {
      setValidationError(
        'Batas pengiriman harian tercapai (maksimal 3 laporan per hari). Silakan kirim kembali besok pukul 00:00 WIB.'
      );
      return;
    }

    if (!hasCookieConsent) {
      setValidationError('Silakan setujui penyimpanan data cookie di bagian bawah layar.');
      return;
    }

    if (!chosenSchool) {
      setValidationError('Pilih sekolah tujuan laporan terlebih dahulu.');
      setIsSearchingSchool(true);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!jenisPungutan) {
      setValidationError('Pilih kategori atau jenis dugaan pungutan.');
      return;
    }
    if (jenisPungutan === 'lainnya' && !jenisPungutanLainnya.trim()) {
      setValidationError('Tuliskan rincian jenis pungutan lainnya.');
      return;
    }

    if (!pihakMeminta) {
      setValidationError('Pilih peran pihak yang meminta pungutan.');
      return;
    }
    if (pihakMeminta === 'Pihak Lain' && !pihakLainnyaDetail.trim()) {
      setValidationError('Sebutkan peran pihak lain yang meminta.');
      return;
    }

    if (!additionalNotes.trim()) {
      setValidationError('Tuliskan kronologi atau rincian kejadian laporan.');
      return;
    }

    if (!mathInput.trim()) {
      setValidationError('Ketik hasil hitungan matematika verifikasi anti-bot.');
      return;
    }

    if (mathChallenge.salt) {
      if (Date.now() - mathChallenge.timestamp > 180000) {
        setValidationError('Waktu soal verifikasi telah habis. Silakan hitung soal baru.');
        handleRegenerateCaptcha();
        return;
      }

      const calculatedHash = hashCaptchaAnswer(
        mathInput.trim(),
        mathChallenge.salt,
        mathChallenge.timestamp
      );

      if (calculatedHash !== mathChallenge.token) {
        setValidationError('Hasil hitungan matematika belum tepat. Silakan coba kembali.');
        handleRegenerateCaptcha();
        return;
      }
    }

    setValidationError(null);
    setIsPolicyModalOpen(true);
    setHasScrolledToBottom(false);
    setIsPolicyAgreed(false);
  };

  const handleFinalConfirmSubmit = async () => {
    if (!isPolicyAgreed || !chosenSchool || isSubmitting) return;

    setIsPolicyModalOpen(false);
    setIsSubmitting(true);
    setValidationError(null);

    const categoryLabel =
      jenisPungutan === 'lainnya'
        ? `Lainnya: ${jenisPungutanLainnya.trim()}`
        : JENIS_PUNGUTAN_OPTIONS.find((o) => o.value === jenisPungutan)?.label ||
          jenisPungutan;

    const roleLabel =
      pihakMeminta === 'Pihak Lain' && pihakLainnyaDetail.trim()
        ? `Pihak Lain (${pihakLainnyaDetail.trim()})`
        : pihakMeminta;

    try {
      const uploadedAttachments: ReportAttachmentMeta[] = [];

      for (let i = 0; i < attachments.length; i++) {
        const item = attachments[i];
        if (item.blob) {
          setSubmitStepLabel(
            `Mengunggah bukti ${i + 1}/${attachments.length}...`
          );
          const meta = await uploadReportEvidenceFile(item.blob, item.name, 'initial');
          uploadedAttachments.push(meta);
        } else {
          uploadedAttachments.push({
            name: item.name,
            sizeFormatted: item.sizeFormatted,
          });
        }
      }

      setSubmitStepLabel('Menerbitkan kode tiket resmi...');

      const fullNotes = additionalNotes.trim();

      const dbResult = await submitPublicReportRpc({
        schoolId: chosenSchool.id,
        schoolName: chosenSchool.name,
        schoolNpsn: chosenSchool.npsn,
        kabupaten: chosenSchool.kabupaten,
        kecamatan: chosenSchool.kecamatan,
        category: categoryLabel,
        requesterRole: roleLabel,
        notes: fullNotes,
        attachments: uploadedAttachments,
        ocrText: prefilledOcrText || null,
        ocrBospFact: prefilledOcrBospFact || null,
        captchaAnswer: mathInput.trim(),
        captchaToken: mathChallenge.token,
      });

      recordReportSubmissionQuota();
      setDailyQuotaCount((prev) => prev + 1);

      saveTicketBookmarkToBrowserCookie({
        ticketCode: dbResult.ticket_code,
        trackingToken: dbResult.tracking_token,
        schoolName: dbResult.school_name,
        schoolNpsn: dbResult.school_npsn,
        category: dbResult.category,
        createdAt: dbResult.created_at,
      });

      const successData: SubmissionSuccessState = {
        ticketCode: dbResult.ticket_code,
        trackingToken: dbResult.tracking_token,
        timestamp: formatWibDateTime(dbResult.created_at),
        schoolName: dbResult.school_name,
        schoolNpsn: dbResult.school_npsn,
        category: dbResult.category,
        role: roleLabel,
        fullNotes,
      };

      // Tampilkan animasi centang dan teks 'Laporan Berhasil Dikirim' di popup loading
      setIsSubmitModalSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 1700));

      // Tutup popup loading dan tampilkan informasi detail pelaporan
      setIsSubmitting(false);
      setIsSubmitModalSuccess(false);
      setSubmissionSuccess(successData);

      window.scrollTo({ top: 40, behavior: 'smooth' });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal mengirim laporan ke server Supabase. Periksa koneksi internet Anda.';
      setValidationError(message);
      handleRegenerateCaptcha();
      setIsSubmitting(false);
      setIsSubmitModalSuccess(false);
    }
  };

  const selectedJenisLabel =
    JENIS_PUNGUTAN_OPTIONS.find((opt) => opt.value === jenisPungutan)?.label ||
    'Pilih jenis pungutan...';

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5]/85 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-7 max-w-sm w-full text-center shadow-lg space-y-4">
            {isSubmitModalSuccess ? (
              <>
                <div className="flex items-center justify-center py-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 sm:w-20 sm:h-20 daradik-success-circle-svg"
                      viewBox="0 0 72 72"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Ikon centang sukses pengiriman laporan"
                    >
                      {/* Lingkaran latar belakang hijau lembut */}
                      <circle
                        cx="36"
                        cy="36"
                        r="32"
                        fill="#DCFCE7"
                        className="daradik-success-circle-bg"
                      />
                      {/* Garis tepi lingkaran */}
                      <circle
                        cx="36"
                        cy="36"
                        r="32"
                        stroke="#86EFAC"
                        strokeWidth="2.5"
                        className="daradik-success-circle-ring"
                      />
                      {/* Path centang yang digambar bertahap dari pojok ke pojok */}
                      <path
                        d="M22 37.5L31.5 47L50 26.5"
                        fill="none"
                        stroke="#166534"
                        strokeWidth="4.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength="100"
                        className="daradik-success-check-path"
                      />
                    </svg>
                  </div>
                </div>

                <div className="daradik-success-text-enter space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                    Sukses Terkirim
                  </span>
                  <h3 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
                    Laporan Berhasil Dikirim
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Data laporan Anda telah dienkripsi dan berhasil diterima oleh sistem pengawasan DARADIK.
                  </p>
                </div>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#166534] bg-[#DCFCE7]/60 border border-[#86EFAC]/60 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-ping" />
                    Membuka informasi pelaporan...
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center py-1">
                  <div className="ccw-square-container">
                    <div className="ccw-square-item ccw-sq-1" />
                    <div className="ccw-square-item ccw-sq-2" />
                    <div className="ccw-square-item ccw-sq-3" />
                    <div className="ccw-square-item ccw-sq-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
                    Mengirim Laporan ke Sistem DARADIK
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Laporan disimpan ke basis data pengawasan tanpa mencatat identitas pribadi Anda.
                  </p>
                </div>

                <ScrambleToAsteriskCipher progressLabel={submitStepLabel} />
              </>
            )}
          </div>
        </div>
      )}

      {submissionSuccess ? (
        <ReportSuccessReceipt
          submissionSuccess={submissionSuccess}
          onSubmitSuccess={onSubmitSuccess}
          onBack={onBackToHome || onCancel}
        />
      ) : (
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-view-enter">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <BackButton onClick={onCancel} label="Kembali ke Beranda" />

            {onOpenLiveTracking && (
              <button
                type="button"
                onClick={onOpenLiveTracking}
                className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-xs sm:text-sm font-bold text-[#FFFFFF] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Lacak Lapor</span>
              </button>
            )}
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden md:grid md:grid-rows-2">
            <div className="relative w-full bg-[#FFFFFF] border-b border-[#E4E0D8]/80 overflow-hidden">
              <picture className="block w-full h-full">
                <source
                  media="(min-width: 768px)"
                  srcSet="/banner-lapor-desktop.jpg"
                  width={1024}
                  height={388}
                />
                <img
                  src="/banner-lapor.jpg"
                  alt="Banner Pelaporan DARADIK"
                  width={1024}
                  height={392}
                  className="w-full h-auto md:absolute md:inset-0 md:h-full object-contain md:object-cover md:object-[50%_48%] block select-none"
                />
              </picture>
            </div>

            <div className="p-4 sm:p-8 space-y-4 flex flex-col justify-center md:min-h-[222px]">
              <div className="space-y-2">
                <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                  Kirim Laporan Pungutan Sekolah
                </h1>
                <p className="daradik-lead text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Sampaikan laporan dugaan pungutan tidak sesuai ketentuan secara anonim. Sistem menerbitkan kode tiket unik tanpa meminta nama, email, atau nomor telepon Anda.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B]">
                  <ShieldCheck className="w-4 h-4 text-[#2E6496]" />
                  <span>Tanpa Akun &amp; Nomor HP</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B]">
                  <EyeOff className="w-4 h-4 text-[#2E6496]" />
                  <span>Metadata Foto Dihapus</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B]">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  <span>Terhubung ke Antrean Dinas</span>
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleInitialSubmitClick}
            className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl shadow-xs p-4 sm:p-8 space-y-6 sm:space-y-7"
          >
            {validationError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {prefilledOcrText && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                  <MessageSquare className="w-4 h-4 text-[#2E6496]" />
                  <span> Kutipan Hasil Pembacaan Pemindai Pesan (Disertakan ke Laporan)</span>
                </div>
                <p className="text-[#475569] leading-relaxed bg-[#FFFFFF] p-3 rounded-lg border border-[#E4E0D8]">
                  &ldquo;{prefilledOcrText}&rdquo;
                </p>
                {prefilledOcrBospFact && (
                  <p className="text-[11px] text-[#475569]">
                    Catatan pencocokan anggaran: {prefilledOcrBospFact}
                  </p>
                )}
              </div>
            )}

            <SchoolTargetSelector
              chosenSchool={chosenSchool}
              isSearchingSchool={isSearchingSchool}
              onSelectChosenSchool={setChosenSchool}
              onSearchingSchoolChange={setIsSearchingSchool}
              onChangeSchool={onChangeSchool}
              onClearSchoolValidationError={() => {
                if (validationError?.includes('sekolah')) {
                  setValidationError(null);
                }
              }}
            />

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1E293B]">
                Kategori Laporan / Jenis Pungutan
                <span className="text-[#991B1B] font-bold ml-1">*</span>
              </label>

              <div ref={jenisDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsJenisDropdownOpen((prev) => !prev)}
                  className={`w-full min-h-[44px] pl-3.5 pr-10 py-2.5 rounded-xl border text-left text-sm flex items-center justify-between transition-all cursor-pointer relative shadow-2xs ${
                    isJenisDropdownOpen
                      ? 'border-[#2E6496] ring-2 ring-[#2E6496]/20 bg-[#FFFFFF]'
                      : 'border-[#C9DFDC] bg-[#FFFFFF] hover:border-[#A8C8C4]'
                  }`}
                >
                  <span
                    className={
                      jenisPungutan
                        ? 'font-semibold text-[#1E293B]'
                        : 'text-[#64748B]'
                    }
                  >
                    {selectedJenisLabel}
                  </span>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                    <ChevronDown
                      className={`w-4 h-4 text-[#475569] transition-transform duration-200 ${
                        isJenisDropdownOpen ? 'rotate-180 text-[#2E6496]' : ''
                      }`}
                    />
                  </div>
                </button>

                {isJenisDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xl shadow-slate-900/10 z-30 max-h-64 overflow-y-auto p-1.5 space-y-1 animate-view-enter custom-scrollbar">
                    {JENIS_PUNGUTAN_OPTIONS.map((opt) => {
                      const isSelected = jenisPungutan === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setJenisPungutan(opt.value);
                            setIsJenisDropdownOpen(false);
                            if (validationError?.includes('jenis') || validationError?.includes('kategori')) {
                              setValidationError(null);
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#EBF3F8] text-[#1D4F7A] font-bold'
                              : 'hover:bg-[#FAF8F5] text-[#1E293B]'
                          }`}
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                            <div className="text-[11px] text-[#475569] font-normal">{opt.desc}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#2E6496] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {jenisPungutan === 'lainnya' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={jenisPungutanLainnya}
                    onChange={(e) => {
                      setJenisPungutanLainnya(e.target.value);
                      if (validationError?.includes('lainnya')) setValidationError(null);
                    }}
                    placeholder="Sebutkan kategori pungutan atau permasalahan lainnya..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-sm font-bold text-[#1E293B]">
                  Pihak yang Meminta
                  <span className="text-[#991B1B] font-bold ml-1">*</span>
                </label>
                <p className="text-xs text-[#475569] mt-0.5">
                  Pilih jabatan atau peran pihak yang meminta tanpa menuliskan nama pribadi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {PIHAK_MEMINTA_OPTIONS.map((role) => {
                  const isSelected = pihakMeminta === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setPihakMeminta(role);
                        if (validationError?.includes('pihak')) setValidationError(null);
                      }}
                      className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#EBF3F8] border-[#2E6496] ring-1 ring-[#2E6496]'
                          : 'bg-[#FFFFFF] border-[#C9DFDC] hover:border-[#A8C8C4] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#2E6496] bg-[#FFFFFF]'
                            : 'border-[#64748B] bg-transparent'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#2E6496]" />}
                      </div>

                      <span
                        className={`text-xs sm:text-sm ${
                          isSelected
                            ? 'font-bold text-[#1E293B]'
                            : 'font-medium text-[#475569]'
                        }`}
                      >
                        {role}
                      </span>
                    </button>
                  );
                })}
              </div>

              {pihakMeminta === 'Pihak Lain' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={pihakLainnyaDetail}
                    onChange={(e) => {
                      setPihakLainnyaDetail(e.target.value);
                      if (validationError?.includes('pihak lain')) setValidationError(null);
                    }}
                    placeholder="Sebutkan peran pihak lain (contoh: Yayasan, Paguyuban Kelas)..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-notes" className="block text-sm font-bold text-[#1E293B]">
                Kronologi Laporan
                <span className="text-[#991B1B] font-bold ml-1">*</span>
              </label>

              <textarea
                id="report-notes"
                rows={4}
                value={additionalNotes}
                onChange={(e) => {
                  setAdditionalNotes(e.target.value);
                  if (validationError?.includes('kronologi') || validationError?.includes('rincian')) {
                    setValidationError(null);
                  }
                }}
                placeholder="Jelaskan nominal pungutan, waktu penyampaian, mekanisme penarikan (tunai/transfer), serta kronologi kejadian secara jelas..."
                className="w-full p-3.5 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-bold text-[#1E293B]">
                  Bukti atau Dokumen Pendukung
                  <span className="text-xs font-normal text-[#475569] ml-1.5">(Opsional)</span>
                </label>
                <span className="text-xs text-[#475569] tabular-nums">
                  Maks. 5 berkas ({attachments.length}/5)
                </span>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.previewUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewModalUrl(item.previewUrl || null);
                              setPreviewModalTitle(item.name);
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-[#C9DFDC] shrink-0 bg-[#FFFFFF] cursor-pointer"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
                            <Paperclip className="w-4 h-4" />
                          </div>
                        )}

                        <div className="truncate">
                          <div className="font-semibold text-[#1E293B] truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[#475569]">
                            Ukuran: {item.sizeFormatted}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.previewUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewModalUrl(item.previewUrl || null);
                              setPreviewModalTitle(item.name);
                            }}
                            className="p-2 rounded-lg text-[#2E6496] hover:bg-[#EBF3F8] cursor-pointer"
                            title="Pratinjau Gambar"
                            aria-label={`Lihat pratinjau ${item.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(item.id)}
                          className="p-2 rounded-lg text-[#475569] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                          title="Hapus Lampiran"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {attachments.length < 5 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full min-h-[48px] p-4 rounded-xl border-2 border-dashed border-[#C9DFDC] hover:border-[#2E6496] hover:bg-[#EBF3F8]/30 transition-colors flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2E6496] cursor-pointer disabled:opacity-50"
                >
                  {isCompressing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menghapus metadata &amp; mengompresi gambar...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Unggah Foto Kuitansi / Screenshot Bukti (Maks. 5)</span>
                    </>
                  )}
                </button>
              ) : (
                <p className="text-xs text-[#475569]">
                  Batas maksimal 5 berkas bukti telah tercapai.
                </p>
              )}
            </div>

            <MathCaptchaSection
              mathChallenge={mathChallenge}
              mathInput={mathInput}
              onMathInputChange={(val) => {
                setMathInput(val);
                if (
                  validationError?.includes('matematika') ||
                  validationError?.includes('verifikasi')
                ) {
                  setValidationError(null);
                }
              }}
              onRegenerate={handleRegenerateCaptcha}
            />

            <div className="pt-3 border-t border-[#E4E0D8] flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 min-h-[46px] py-3.5 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4 text-[#FFFFFF]" />
                <span>Kirim Laporan</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[46px] px-6 py-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <CookieConsentBanner
        hasCookieConsent={hasCookieConsent}
        onAccept={handleAcceptCookieConsent}
      />

      <ReportPolicyModal
        isOpen={isPolicyModalOpen}
        hasScrolledToBottom={hasScrolledToBottom}
        isPolicyAgreed={isPolicyAgreed}
        isSubmitting={isSubmitting}
        onReachBottom={() => setHasScrolledToBottom(true)}
        onPolicyAgreedChange={setIsPolicyAgreed}
        onClose={() => setIsPolicyModalOpen(false)}
        onConfirmSubmit={handleFinalConfirmSubmit}
      />

      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D8]">
              <span className="text-sm font-bold text-[#1E293B] truncate">
                {previewModalTitle}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2">
              <img
                src={previewModalUrl}
                alt={previewModalTitle}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
