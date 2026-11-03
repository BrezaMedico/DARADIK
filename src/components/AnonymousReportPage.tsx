import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Paperclip,
  Send,
  CheckCircle2,
  X,
  Building2,
  Search,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  Upload,
  RefreshCw,
  Eye,
  Check,
  FileCheck,
  Cookie,
  ShieldAlert,
} from 'lucide-react';
import { SCHOOLS_DATABASE, SchoolData } from '../data/schoolsData';

interface AnonymousReportPageProps {
  selectedSchool?: SchoolData | null;
  onChangeSchool: (school: SchoolData) => void;
  prefilledCategory?: string;
  prefilledAttachment?: string;
  onCancel: () => void;
  onSubmitSuccess: (ticketCode: string, notes: string, category: string) => void;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  sizeFormatted: string;
  previewUrl?: string;
}

// 8 Opsi Resmi Jenis Pungutan
export const JENIS_PUNGUTAN_OPTIONS = [
  {
    value: 'uang pembangunan',
    label: 'Uang Pembangunan',
    desc: 'Iuran sarana prasarana, renovasi gedung, paving, atau perbaikan fasilitas',
  },
  {
    value: 'uang buku/LKS',
    label: 'Uang Buku / LKS',
    desc: 'Kewajiban membeli buku paket atau lembar kerja siswa berbayar',
  },
  {
    value: 'seragam',
    label: 'Seragam',
    desc: 'Kewajiban membeli paket kain seragam, atribut, atau kaos olahraga di sekolah',
  },
  {
    value: 'pungutan ujian/kelulusan',
    label: 'Pungutan Ujian / Kelulusan',
    desc: 'Biaya cetak soal ujian, penulisan ijazah, atau wisuda/perpisahan',
  },
  {
    value: 'uang les/ekskul wajib',
    label: 'Uang Les / Ekskul Wajib',
    desc: 'Bimbingan belajar atau ekstrakurikuler wajib berbayar',
  },
  {
    value: 'pungutan PPDB/mutasi',
    label: 'Pungutan PPDB / Mutasi',
    desc: 'Biaya pendaftaran ulang siswa baru atau perpindahan mutasi',
  },
  {
    value: 'jual beli bangku',
    label: 'Jual Beli Bangku',
    desc: 'Mahar atau uang titipan kursi penerimaan murid baru',
  },
  {
    value: 'lainnya',
    label: 'Lainnya',
    desc: 'Pungutan di luar pilihan di atas',
  },
];

// Opsi Pihak yang Meminta
export const PIHAK_MEMINTA_OPTIONS = [
  'Kepala Sekolah',
  'Guru',
  'Komite Sekolah',
  'Tata Usaha (TU)',
  'Pihak Lain',
];

// Helper Cookie Anti-Spam (Maksimal 3 laporan per hari per perangkat)
const COOKIE_CONSENT_KEY = 'daradik_cookie_consent';
const REPORT_TRACK_KEY = 'daradik_daily_reports';
const MAX_DAILY_REPORTS = 3;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 30) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyReportData(): { date: string; count: number } {
  try {
    const rawCookie = getCookie(REPORT_TRACK_KEY);
    const rawStorage = typeof localStorage !== 'undefined' ? localStorage.getItem(REPORT_TRACK_KEY) : null;
    const raw = rawCookie || rawStorage;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayString()) {
        return parsed;
      }
    }
  } catch {
    // fallback default
  }
  return { date: getTodayString(), count: 0 };
}

function recordReportSubmission() {
  const current = getDailyReportData();
  const nextData = { date: getTodayString(), count: current.count + 1 };
  const str = JSON.stringify(nextData);
  setCookie(REPORT_TRACK_KEY, str, 2);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REPORT_TRACK_KEY, str);
  }
}

// Generate Captcha Alphanumerik 5 Karakter
function generateNewCaptcha(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Kompresi Gambar ke KB melalui Canvas di Client
function compressImageFile(file: File): Promise<UploadedFileItem> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const sizeKb = Math.round(file.size / 1024);
      resolve({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        sizeFormatted: `${sizeKb} KB`,
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
        const MAX_DIM = 1200;

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
                const compressedSizeKb = Math.max(1, Math.round(blob.size / 1024));
                const compressedUrl = URL.createObjectURL(blob);
                resolve({
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  sizeFormatted: `${compressedSizeKb} KB`,
                  previewUrl: compressedUrl,
                });
              } else {
                resolve({
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: file.name,
                  sizeFormatted: `${Math.round(file.size / 1024)} KB`,
                  previewUrl: e.target?.result as string,
                });
              }
            },
            'image/jpeg',
            0.72
          );
        } else {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            sizeFormatted: `${Math.round(file.size / 1024)} KB`,
            previewUrl: e.target?.result as string,
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const AnonymousReportPage: React.FC<AnonymousReportPageProps> = ({
  selectedSchool,
  onChangeSchool,
  prefilledCategory = '',
  prefilledAttachment = '',
  onCancel,
  onSubmitSuccess,
}) => {
  // 1. Sekolah State
  const isDirectItemPrefill = Boolean(prefilledCategory);
  const [chosenSchool, setChosenSchool] = useState<SchoolData | null>(() => {
    if (isDirectItemPrefill && selectedSchool) {
      return selectedSchool;
    }
    return null;
  });

  const [isSearchingSchool, setIsSearchingSchool] = useState<boolean>(() => !chosenSchool);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState<boolean>(false);
  const schoolSearchContainerRef = useRef<HTMLDivElement | null>(null);

  // 2. Jenis Pungutan Custom Scrollable Dropdown State
  const initialJenisPungutan = useMemo(() => {
    if (!prefilledCategory) return '';
    const lower = prefilledCategory.toLowerCase();
    const matched = JENIS_PUNGUTAN_OPTIONS.find((opt) =>
      lower.includes(opt.value) || lower.includes(opt.label.toLowerCase())
    );
    return matched ? matched.value : 'lainnya';
  }, [prefilledCategory]);

  const [jenisPungutan, setJenisPungutan] = useState<string>(initialJenisPungutan);
  const [isJenisDropdownOpen, setIsJenisDropdownOpen] = useState<boolean>(false);
  const [jenisPungutanLainnya, setJenisPungutanLainnya] = useState<string>(() => {
    if (prefilledCategory && !initialJenisPungutan) {
      return prefilledCategory;
    }
    return '';
  });
  const jenisDropdownRef = useRef<HTMLDivElement | null>(null);

  // 3. Pihak yang Meminta State
  const [pihakMeminta, setPihakMeminta] = useState<string>('');
  const [pihakLainnyaDetail, setPihakLainnyaDetail] = useState<string>('');

  // 4. Catatan Lainnya
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // 5. Bukti Gambar (Maksimal 5)
  const [attachments, setAttachments] = useState<UploadedFileItem[]>(() => {
    if (prefilledAttachment) {
      return [
        {
          id: 'prefilled-att-1',
          name: prefilledAttachment,
          sizeFormatted: '124 KB',
        },
      ];
    }
    return [];
  });
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox Preview Modal
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('');

  // 6. Persetujuan Kebijakan Melapor (Checkbox)
  const [isPolicyAgreed, setIsPolicyAgreed] = useState<boolean>(false);

  // 7. Cookie Anti-Spam Consent & Kuota Harian (Maksimal 3/hari)
  const [hasCookieConsent, setHasCookieConsent] = useState<boolean>(() => {
    return (
      getCookie(COOKIE_CONSENT_KEY) === 'true' ||
      (typeof localStorage !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'true')
    );
  });
  const [dailyQuotaCount, setDailyQuotaCount] = useState<number>(() => {
    return getDailyReportData().count;
  });

  // 8. Captcha State
  const [captchaCode, setCaptchaCode] = useState<string>(generateNewCaptcha);
  const [captchaInput, setCaptchaInput] = useState<string>('');

  // 9. Validation & Loading
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);

  // Click Outside Listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        schoolSearchContainerRef.current &&
        !schoolSearchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSchoolDropdownOpen(false);
      }
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

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    const q = schoolSearchQuery.trim().toLowerCase();
    if (!q) {
      return SCHOOLS_DATABASE.slice(0, 8);
    }
    return SCHOOLS_DATABASE.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.npsn.toLowerCase().includes(q) ||
        s.kecamatan.toLowerCase().includes(q) ||
        s.kabupaten.toLowerCase().includes(q) ||
        s.jenjang.toLowerCase().includes(q)
      );
    }).slice(0, 15);
  }, [schoolSearchQuery]);

  const handleSelectSchool = (school: SchoolData) => {
    setChosenSchool(school);
    onChangeSchool(school);
    setIsSearchingSchool(false);
    setIsSchoolDropdownOpen(false);
    setSchoolSearchQuery('');
    if (validationError?.includes('sekolah')) {
      setValidationError(null);
    }
  };

  const handleClearSelectedSchool = () => {
    setChosenSchool(null);
    setIsSearchingSchool(true);
    setSchoolSearchQuery('');
    setTimeout(() => {
      setIsSchoolDropdownOpen(true);
    }, 50);
  };

  // Upload & Compress Handler (Maksimal 5)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - attachments.length;
    if (remainingSlots <= 0) {
      setValidationError('Maksimal lampiran telah tercapai (maksimal 5 gambar).');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsCompressing(true);

    try {
      const compressedResults = await Promise.all(
        filesToProcess.map((f) => compressImageFile(f))
      );
      setAttachments((prev) => [...prev, ...compressedResults]);
      if (validationError?.includes('lampiran') || validationError?.includes('bukti')) {
        setValidationError(null);
      }
    } catch {
      // Fallback
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

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateNewCaptcha());
    setCaptchaInput('');
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Cek Kuota Anti-Spam
    if (dailyQuotaCount >= MAX_DAILY_REPORTS) {
      setValidationError(
        'Batas maksimal 3 laporan per hari untuk perangkat ini telah tercapai demi mencegah spam.'
      );
      return;
    }

    // 1. Cek Persetujuan Cookie
    if (!hasCookieConsent) {
      setValidationError('Silakan setujui penggunaan cookie anti-spam sebelum mengirim laporan.');
      return;
    }

    // 2. Validasi Sekolah
    if (!chosenSchool) {
      setValidationError('Pilih sekolah yang ingin dilaporkan.');
      setIsSearchingSchool(true);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // 3. Validasi Jenis Pungutan
    if (!jenisPungutan) {
      setValidationError('Pilih jenis pungutan.');
      return;
    }
    if (jenisPungutan === 'lainnya' && !jenisPungutanLainnya.trim()) {
      setValidationError('Tuliskan rincian jenis pungutan lainnya.');
      return;
    }

    // 4. Validasi Pihak yang Meminta
    if (!pihakMeminta) {
      setValidationError('Pilih pihak yang meminta pungutan.');
      return;
    }
    if (pihakMeminta === 'Pihak Lain' && !pihakLainnyaDetail.trim()) {
      setValidationError('Sebutkan peran pihak lain yang meminta.');
      return;
    }

    // 5. Validasi Bukti Gambar
    if (attachments.length === 0) {
      setValidationError('Unggah minimal 1 gambar bukti laporan.');
      return;
    }

    // 6. Validasi Kebijakan
    if (!isPolicyAgreed) {
      setValidationError('Anda harus menyetujui ketentuan pelaporan sebelum mengirim.');
      return;
    }

    // 7. Validasi Captcha
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setValidationError('Kode captcha tidak sesuai. Silakan coba lagi.');
      handleRefreshCaptcha();
      return;
    }

    setValidationError(null);
    setIsEncrypting(true);

    const categoryLabel =
      jenisPungutan === 'lainnya'
        ? `Lainnya: ${jenisPungutanLainnya.trim()}`
        : JENIS_PUNGUTAN_OPTIONS.find((o) => o.value === jenisPungutan)?.label || jenisPungutan;

    const roleLabel =
      pihakMeminta === 'Pihak Lain' && pihakLainnyaDetail.trim()
        ? `Pihak Lain (${pihakLainnyaDetail.trim()})`
        : pihakMeminta;

    const fullNotes = [
      additionalNotes.trim() ? `Catatan: ${additionalNotes.trim()}` : '',
      `Pihak yang meminta: ${roleLabel}`,
      `Lampiran gambar: ${attachments.length} berkas`,
    ]
      .filter(Boolean)
      .join('\n');

    // Catat Penggunaan Kuota Anti-Spam
    recordReportSubmission();
    setDailyQuotaCount((prev) => prev + 1);

    const randomTicketSuffix = Math.floor(1000 + Math.random() * 9000);
    const regCode = (chosenSchool.kabupaten || 'KAB').substring(0, 3).toUpperCase();
    const ticket = `CHK-2026-${randomTicketSuffix}-${regCode}`;

    setTimeout(() => {
      setIsEncrypting(false);
      setGeneratedTicket(ticket);

      setTimeout(() => {
        onSubmitSuccess(ticket, fullNotes, categoryLabel);
      }, 1000);
    }, 1100);
  };

  const selectedJenisLabel =
    JENIS_PUNGUTAN_OPTIONS.find((opt) => opt.value === jenisPungutan)?.label ||
    'Pilih jenis pungutan...';

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-view-enter">
        {/* ===================================================================
            1. TOP NAVIGATION
           =================================================================== */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:translate-y-[1px]"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Kembali</span>
          </button>
        </div>

        {/* ===================================================================
            2. HERO HEADER (Ringkas & Menyampaikan)
           =================================================================== */}
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-4">
          <div className="space-y-2">
            <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              Kirim Laporan Pungutan Liar
            </h1>
            <p className="daradik-lead text-xs sm:text-sm text-[#475569] leading-relaxed">
              Laporkan pungutan sekolah tanpa dasar hukum secara aman. Data identitas dan perangkat Anda tidak dilacak.
            </p>
          </div>

          {/* 3 Pills Ringkas & Modern (Desain Lebih Menarik) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EBF3F8] to-[#FAF8F5] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#2E6496]" />
              <span>Tanpa Akun & No. HP</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EBF3F8] to-[#FAF8F5] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B] shadow-2xs">
              <EyeOff className="w-4 h-4 text-[#2E6496]" />
              <span>Foto Dihapus Metadata</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EBF3F8] to-[#FAF8F5] border border-[#C9DFDC] text-xs font-semibold text-[#1E293B] shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span>Langsung ke Dinas</span>
            </span>
          </div>
        </div>

        {/* ===================================================================
            3. FORMULIR UTAMA
           =================================================================== */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl shadow-xs p-6 sm:p-8 space-y-7"
        >
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F5C6CB] text-[#C24136] text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-view-enter">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* -----------------------------------------------------------------
              SEKSI 1: SEKOLAH TUJUAN
             ----------------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-bold text-[#1E293B]">
                Sekolah Tujuan Laporan
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </label>

              {chosenSchool && !isSearchingSchool && (
                <button
                  type="button"
                  onClick={handleClearSelectedSchool}
                  className="text-xs font-semibold text-[#2E6496] hover:underline cursor-pointer"
                >
                  Ganti Sekolah
                </button>
              )}
            </div>

            {chosenSchool && !isSearchingSchool ? (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1E293B]">
                        {chosenSchool.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#2E6496] text-[#FFFFFF]">
                        {chosenSchool.jenjang}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      NPSN: <span className="font-mono text-[#2E6496] font-semibold">{chosenSchool.npsn}</span> • Kec. {chosenSchool.kecamatan}, {chosenSchool.kabupaten}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSelectedSchool}
                  className="px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E293B] cursor-pointer shrink-0"
                >
                  Ubah
                </button>
              </div>
            ) : (
              <div ref={schoolSearchContainerRef} className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={schoolSearchQuery}
                    onFocus={() => setIsSchoolDropdownOpen(true)}
                    onChange={(e) => {
                      setSchoolSearchQuery(e.target.value);
                      setIsSchoolDropdownOpen(true);
                      if (validationError?.includes('sekolah')) setValidationError(null);
                    }}
                    placeholder="Ketik nama sekolah atau NPSN..."
                    className="w-full pl-10 pr-9 py-3 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  {schoolSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolSearchQuery('');
                        setIsSchoolDropdownOpen(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Pencarian Sekolah */}
                {isSchoolDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-[#E4E0D8]/60 animate-view-enter">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSchool(s)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#EBF3F8] transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#1E293B] group-hover:text-[#2E6496]">
                              {s.name} ({s.jenjang})
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              NPSN: {s.npsn} • {s.kecamatan}, {s.kabupaten}
                            </div>
                          </div>
                          <span className="text-xs text-[#2E6496] font-semibold opacity-0 group-hover:opacity-100 shrink-0">
                            Pilih
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#64748B]">
                        Sekolah tidak ditemukan.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 2: JENIS PUNGUTAN (Scrollable Custom Dropdown Simple)
             ----------------------------------------------------------------- */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1E293B]">
              Jenis Pungutan
              <span className="text-[#DC2626] font-bold ml-1">*</span>
            </label>

            {/* Custom Simple Scrollable Selector */}
            <div ref={jenisDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsJenisDropdownOpen((prev) => !prev)}
                className={`w-full px-4 py-3 rounded-xl border text-left text-sm flex items-center justify-between transition-all cursor-pointer ${
                  isJenisDropdownOpen
                    ? 'border-[#2E6496] ring-2 ring-[#2E6496]/20 bg-[#FFFFFF]'
                    : 'border-[#C9DFDC] bg-[#FFFFFF] hover:border-[#A8C8C4]'
                }`}
              >
                <span
                  className={
                    jenisPungutan
                      ? 'font-semibold text-[#1E293B]'
                      : 'text-[#94A3B8]'
                  }
                >
                  {selectedJenisLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                    isJenisDropdownOpen ? 'rotate-180 text-[#2E6496]' : ''
                  }`}
                />
              </button>

              {/* Scrollable list options (Maksimal height dengan scroll) */}
              {isJenisDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-[#E4E0D8]/60 animate-view-enter">
                  {JENIS_PUNGUTAN_OPTIONS.map((opt) => {
                    const isSelected = jenisPungutan === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setJenisPungutan(opt.value);
                          setIsJenisDropdownOpen(false);
                          if (validationError?.includes('jenis')) setValidationError(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#EBF3F8] text-[#2E6496] font-bold'
                            : 'hover:bg-[#FAF8F5] text-[#1E293B]'
                        }`}
                      >
                        <div className="text-xs sm:text-sm">{opt.label}</div>
                        {isSelected && <Check className="w-4 h-4 text-[#2E6496] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input Rincian Jika 'Lainnya' Dipilih */}
            {jenisPungutan === 'lainnya' && (
              <div className="pt-1 animate-view-enter">
                <input
                  type="text"
                  value={jenisPungutanLainnya}
                  onChange={(e) => {
                    setJenisPungutanLainnya(e.target.value);
                    if (validationError?.includes('lainnya')) setValidationError(null);
                  }}
                  placeholder="Sebutkan jenis pungutan lainnya..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                />
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 3: PIHAK YANG MEMINTA (Design Pilihan / Radio Modern)
             ----------------------------------------------------------------- */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-bold text-[#1E293B]">
                Pihak yang Meminta
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </label>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pilih peran/jabatan pihak yang meminta (tanpa nama lengkap).
              </p>
            </div>

            {/* Tampilan Design Pilihan Radio / Pill Modern */}
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
                    className={`px-3.5 py-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF3F8] border-[#2E6496] ring-1 ring-[#2E6496] shadow-2xs'
                        : 'bg-[#FFFFFF] border-[#C9DFDC] hover:border-[#A8C8C4] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Visual Radio Indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#2E6496] bg-[#FFFFFF]'
                          : 'border-[#94A3B8] bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#2E6496]" />
                      )}
                    </div>

                    <span
                      className={`text-xs sm:text-sm ${
                        isSelected ? 'font-bold text-[#1E293B]' : 'font-medium text-[#475569]'
                      }`}
                    >
                      {role}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Input Tambahan Jika Pihak Lain */}
            {pihakMeminta === 'Pihak Lain' && (
              <div className="pt-1 animate-view-enter">
                <input
                  type="text"
                  value={pihakLainnyaDetail}
                  onChange={(e) => {
                    setPihakLainnyaDetail(e.target.value);
                    if (validationError?.includes('pihak lain')) setValidationError(null);
                  }}
                  placeholder="Sebutkan peran pihak lain (misal: Yayasan, Paguyuban, Calo)..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                />
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 4: CATATAN LAINNYA
             ----------------------------------------------------------------- */}
          <div className="space-y-1.5">
            <label htmlFor="report-notes" className="block text-sm font-bold text-[#1E293B]">
              Catatan Lainnya
              <span className="text-xs font-normal text-[#64748B] ml-1.5">(Opsional)</span>
            </label>

            <textarea
              id="report-notes"
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Tuliskan nominal uang, cara pembayaran (tunai/transfer), atau catatan lainnya..."
              className="w-full p-3.5 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
            />
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 5: BUKTI PELAPORAN (Maksimal 5 Gambar, Kompresi KB Otomatis)
             ----------------------------------------------------------------- */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-bold text-[#1E293B]">
                Bukti Pelaporan (Foto / Screenshot)
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </label>
              <span className="text-xs text-[#64748B]">
                Maks. 5 gambar ({attachments.length}/5)
              </span>
            </div>

            {/* List Berkas Terunggah */}
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
                          className="w-9 h-9 rounded-lg overflow-hidden border border-[#C9DFDC] shrink-0 bg-[#FFFFFF] cursor-pointer"
                        >
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                      )}

                      <div className="truncate">
                        <div className="font-semibold text-[#1E293B] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
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
                          className="p-1 rounded text-[#2E6496] hover:bg-[#EBF3F8] cursor-pointer"
                          title="Lihat Gambar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(item.id)}
                        className="p-1 rounded text-[#64748B] hover:text-[#DC2626] hover:bg-[#FDF2F2] cursor-pointer"
                        title="Hapus"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input File & Trigger */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {attachments.length < 5 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full p-4 rounded-xl border-2 border-dashed border-[#C9DFDC] hover:border-[#2E6496] hover:bg-[#EBF3F8]/30 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#2E6496] cursor-pointer disabled:opacity-50"
              >
                {isCompressing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengompresi gambar ke ukuran KB...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Foto / Screenshot Bukti (Maks. 5)</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-xs text-[#64748B] italic">
                Batas maksimal 5 gambar telah tercapai.
              </p>
            )}
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 6: KEBIJAKAN & PERATURAN MELAPOR (Checkbox Persetujuan)
             ----------------------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
              <FileCheck className="w-4 h-4 text-[#2E6496]" />
              <span>Ketentuan Pelaporan</span>
            </div>

            <ul className="text-xs text-[#475569] space-y-1 list-disc pl-4 leading-relaxed">
              <li>Laporan wajib didasarkan pada kejadian nyata dan dapat dipertanggungjawabkan.</li>
              <li>Dilarang memberikan laporan palsu, bermotif fitnah, atau menyebarkan hoaks.</li>
              <li>Data laporan dan berkas foto hanya digunakan untuk verifikasi pengawasan dinas.</li>
            </ul>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPolicyAgreed}
                onChange={(e) => {
                  setIsPolicyAgreed(e.target.checked);
                  if (validationError?.includes('ketentuan')) setValidationError(null);
                }}
                className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496] mt-0.5"
              />
              <span className="text-xs font-semibold text-[#1E293B]">
                Saya menyatakan laporan ini benar dan menyetujui ketentuan di atas.
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </span>
            </label>
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 7: PERSETUJUAN COOKIE ANTI-SPAM (Maks 3 Laporan/Hari)
             ----------------------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
                <Cookie className="w-4 h-4 text-[#C87A28]" />
                <span>Persetujuan Cookie Anti-Spam (Maks. 3 Laporan/Hari)</span>
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">
                {dailyQuotaCount}/3 Terpakai Hari Ini
              </span>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Kami menggunakan cookie fungsional pada perangkat ini untuk membatasi frekuensi pelaporan guna mencegah bot dan spam.
            </p>

            {hasCookieConsent ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E7D32]">
                <Check className="w-3.5 h-3.5" />
                <span>Cookie anti-spam aktif disetujui.</span>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAcceptCookieConsent}
                  className="px-3.5 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
                >
                  Setujui Cookie Anti-Spam
                </button>
              </div>
            )}

            {dailyQuotaCount >= MAX_DAILY_REPORTS && (
              <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#F5C6CB] text-xs text-[#DC2626] font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Batas maksimal 3 laporan per hari untuk perangkat ini telah tercapai.</span>
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 8: KODE CAPTCHA
             ----------------------------------------------------------------- */}
          <div className="space-y-2 pt-1">
            <label className="block text-sm font-bold text-[#1E293B]">
              Kode Keamanan (Captcha)
              <span className="text-[#DC2626] font-bold ml-1">*</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {/* Badge Visual Captcha */}
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E293B] to-[#2E6496] text-[#FFFFFF] font-mono font-extrabold text-base tracking-widest select-none shadow-xs flex items-center gap-3">
                <span className="line-through decoration-[#FAF8F5]/40">{captchaCode}</span>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className="text-[#C8DFDC] hover:text-[#FFFFFF] cursor-pointer"
                  title="Ganti Kode Captcha"
                  aria-label="Refresh Captcha"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Input Captcha */}
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value.toUpperCase());
                  if (validationError?.includes('captcha')) setValidationError(null);
                }}
                maxLength={6}
                placeholder="Ketik kode..."
                className="w-36 px-3.5 py-2.5 text-sm font-mono uppercase bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
              />
            </div>
          </div>

          {/* -----------------------------------------------------------------
              SEKSI 9: STATUS PENGIRIMAN & KONFIRMASI TIKET
             ----------------------------------------------------------------- */}
          {generatedTicket && (
            <div className="p-4 bg-[#EBF7EE] border border-[#2E7D32]/40 rounded-xl flex items-center gap-3 animate-view-enter">
              <CheckCircle2 className="w-6 h-6 text-[#2E7D32] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#2E7D32] uppercase">
                  Laporan Berhasil Terkirim
                </div>
                <div className="text-sm font-bold text-[#1E293B]">
                  Kode Tiket Anda:{' '}
                  <span className="font-mono text-[#2E6496] underline tabular-nums">
                    {generatedTicket}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              SEKSI 10: TOMBOL KIRIM
             ----------------------------------------------------------------- */}
          <div className="pt-2 border-t border-[#E4E0D8] flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isEncrypting || !!generatedTicket || dailyQuotaCount >= MAX_DAILY_REPORTS}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] disabled:bg-[#94A3B8] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-sm active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isEncrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                  <span>Mengenkripsi & Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#FFFFFF]" />
                  <span>Kirim Laporan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isEncrypting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-view-enter"
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
                className="p-1 rounded-lg text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2">
              <img
                src={previewModalUrl}
                alt="Preview Bukti"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-2 rounded-lg bg-[#2E6496] text-[#FFFFFF] text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
