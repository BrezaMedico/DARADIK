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
  ChevronRight,
  Copy,
  ArrowRight,
  Lock,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { SchoolData } from '../data/schoolsData';
import {
  MasterSchoolSearchOption,
  ReportAttachmentMeta,
  fetchSchoolFromSupabase,
  searchMasterSchoolsInSupabase,
  submitPublicReportRpc,
  uploadReportEvidenceFile,
} from '../lib/supabase';
import { formatWibDateTime } from '../lib/reportTracking';

interface AnonymousReportPageProps {
  selectedSchool?: SchoolData | null;
  preselectSchool?: boolean;
  onChangeSchool: (school: SchoolData) => void;
  prefilledCategory?: string;
  prefilledAttachment?: string;
  prefilledOcrText?: string;
  prefilledOcrBospFact?: string;
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmitSuccess: (ticketCode: string, notes: string, category: string) => void;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  sizeFormatted: string;
  previewUrl?: string;
  blob?: Blob;
}

export interface SubmissionSuccessState {
  ticketCode: string;
  timestamp: string;
  schoolName: string;
  schoolNpsn: string;
  category: string;
  role: string;
  fullNotes: string;
}

interface MathChallengeState {
  textToDraw: string;
  salt: string;
  timestamp: number;
  token: string;
}

interface ChosenSchoolTarget {
  id: string;
  name: string;
  npsn: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK';
  kabupaten: string;
  kecamatan: string;
  provinsi: string;
}

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

export const PIHAK_MEMINTA_OPTIONS = [
  'Kepala Sekolah',
  'Guru',
  'Komite Sekolah',
  'Tata Usaha (TU)',
  'Pihak Lain',
];

const COOKIE_CONSENT_KEY = 'daradik_cookie_consent';
const REPORT_TRACK_KEY = 'daradik_daily_reports';
const TRACKED_TICKETS_COOKIE_KEY = 'daradik_tracked_tickets';
const MAX_DAILY_REPORTS = 3;

export const ENABLE_DAILY_LIMIT = false;

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
    const rawStorage =
      typeof localStorage !== 'undefined' ? localStorage.getItem(REPORT_TRACK_KEY) : null;
    const raw = rawCookie || rawStorage;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayString()) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { date: getTodayString(), count: 0 };
}

function recordReportSubmissionQuota() {
  const current = getDailyReportData();
  const nextData = { date: getTodayString(), count: current.count + 1 };
  const str = JSON.stringify(nextData);
  setCookie(REPORT_TRACK_KEY, str, 2);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REPORT_TRACK_KEY, str);
  }
}

/**
 * Menyimpan penanda kode tiket pada cookie browser perangkat pelapor saja
 * (bukan sumber status; status resmi selalu diambil dari Supabase).
 */
function saveTicketBookmarkToBrowserCookie(bookmark: {
  ticketCode: string;
  schoolName: string;
  schoolNpsn: string;
  category: string;
  createdAt: string;
}) {
  try {
    const raw = getCookie(TRACKED_TICKETS_COOKIE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(existing) ? existing : [];
    const updated = [
      bookmark,
      ...safeList.filter(
        (item: { ticketCode?: string }) =>
          String(item?.ticketCode || '').trim() !== bookmark.ticketCode.trim()
      ),
    ].slice(0, 12);
    setCookie(TRACKED_TICKETS_COOKIE_KEY, JSON.stringify(updated), 60);
  } catch {
    // ignore
  }
}

function hashCaptchaAnswer(ans: number | string, salt: string, timestamp: number): string {
  const normalized = String(ans).trim();
  const secretKey = `daradik_shield_math_${salt}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < secretKey.length; i++) {
    const char = secretKey.charCodeAt(i);
    hash = (hash << 5) - hash + char + normalized.charCodeAt(i % (normalized.length || 1));
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function generateMathChallenge(): MathChallengeState {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 12) + 3;
    num2 = Math.floor(Math.random() * 11) + 2;
    answer = num1 + num2;
  } else if (op === '-') {
    num1 = Math.floor(Math.random() * 14) + 10;
    num2 = Math.floor(Math.random() * (num1 - 3)) + 1;
    answer = num1 - num2;
  } else {
    num1 = Math.floor(Math.random() * 6) + 2;
    num2 = Math.floor(Math.random() * 4) + 2;
    answer = num1 * num2;
  }

  const textToDraw = `${num1} ${op} ${num2} = ?`;
  const salt = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();
  const token = hashCaptchaAnswer(answer, salt, timestamp);

  return { textToDraw, salt, timestamp, token };
}

function renderMathCaptchaToCanvas(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#F8FAFC');
  bgGrad.addColorStop(0.5, '#F1F5F9');
  bgGrad.addColorStop(1, '#EBF3F8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const clashingLineColors = [
    'rgba(185, 28, 28, 0.35)',
    'rgba(46, 100, 150, 0.4)',
    'rgba(21, 128, 61, 0.35)',
    'rgba(180, 83, 9, 0.35)',
  ];

  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = clashingLineColors[i % clashingLineColors.length];
    ctx.lineWidth = Math.random() * 1.5 + 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h
    );
    ctx.stroke();
  }

  for (let i = 0; i < 36; i++) {
    ctx.fillStyle = clashingLineColors[Math.floor(Math.random() * clashingLineColors.length)];
    ctx.beginPath();
    ctx.arc(
      Math.random() * w,
      Math.random() * h,
      Math.random() * 1.6 + 0.6,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const charColors = ['#991B1B', '#1E3A8A', '#166534', '#92400E', '#1E293B'];
  const fonts = [
    'bold 24px "Plus Jakarta Sans", sans-serif',
    'bold 23px "Plus Jakarta Sans", sans-serif',
    'bold 25px "Plus Jakarta Sans", sans-serif',
  ];

  const chars = text.split('');
  const totalChars = chars.length;
  const startX = 16;
  const charSpacing = (w - 32) / totalChars;

  chars.forEach((ch, idx) => {
    ctx.save();
    const x = startX + idx * charSpacing + (Math.random() * 4 - 2);
    const y = h / 2 + (Math.random() * 6 - 3) + 7;
    const angle = (Math.random() * 28 - 14) * (Math.PI / 180);

    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.font = fonts[(idx + Math.floor(Math.random() * 2)) % fonts.length];
    ctx.fillStyle = charColors[(idx * 2 + Math.floor(Math.random() * 2)) % charColors.length];
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

function compressImageFile(file: File): Promise<UploadedFileItem> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      resolve({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        sizeFormatted: `${sizeKb} KB`,
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
                const compressedSizeKb = Math.max(1, Math.round(blob.size / 1024));
                const compressedUrl = URL.createObjectURL(blob);
                resolve({
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  sizeFormatted: `${compressedSizeKb} KB`,
                  previewUrl: compressedUrl,
                  blob,
                });
              } else {
                resolve({
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: file.name,
                  sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                  previewUrl: e.target?.result as string,
                  blob: file,
                });
              }
            },
            'image/jpeg',
            0.78
          );
        } else {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            previewUrl: e.target?.result as string,
            blob: file,
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const ScrambleToAsteriskCipher: React.FC<{ progressLabel: string }> = ({
  progressLabel,
}) => {
  const initialText = 'LAPORAN_ANONIM_DARADIK';
  const [displayText, setDisplayText] = useState<string>(initialText);

  useEffect(() => {
    const glitchChars = '#$%*+0123456789ABCDEF';
    const len = initialText.length;
    let ticks = 0;
    let asterisksCount = 0;

    const timer = setInterval(() => {
      ticks++;
      if (ticks <= 4) {
        const scrambled = initialText
          .split('')
          .map((c) =>
            c === '_' ? '_' : glitchChars[Math.floor(Math.random() * glitchChars.length)]
          )
          .join('');
        setDisplayText(scrambled);
      } else if (asterisksCount < len) {
        asterisksCount = Math.min(len, asterisksCount + 2);
        const masked = initialText
          .split('')
          .map((c, i) => {
            if (i < asterisksCount) return '*';
            return c === '_'
              ? '_'
              : glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join('');
        setDisplayText(masked);
      } else {
        setDisplayText('*'.repeat(len));
        clearInterval(timer);
      }
    }, 110);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl p-3 border border-[#E4E0D8] text-left space-y-2">
      <div className="flex items-center justify-between text-[11px] text-[#475569]">
        <span className="flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-[#2E6496]" />
          <span>Pengiriman Terlindungi</span>
        </span>
        <span className="text-[#475569] font-medium text-[11px]">
          {progressLabel}
        </span>
      </div>

      <div className="py-2 px-3 rounded-lg bg-[#F1EFEA] text-xs font-mono font-bold tracking-widest text-[#1E293B] text-center select-none border border-[#E4E0D8]">
        {displayText}
      </div>
    </div>
  );
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
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState<boolean>(false);
  const [remoteSchools, setRemoteSchools] = useState<MasterSchoolSearchOption[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(false);
  const schoolSearchContainerRef = useRef<HTMLDivElement | null>(null);

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
    return (
      getCookie(COOKIE_CONSENT_KEY) === 'true' ||
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem(COOKIE_CONSENT_KEY) === 'true')
    );
  });
  const [dailyQuotaCount, setDailyQuotaCount] = useState<number>(
    () => getDailyReportData().count
  );

  const [mathChallenge, setMathChallenge] =
    useState<MathChallengeState>(generateMathChallenge);
  const [mathInput, setMathInput] = useState<string>('');
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mathCanvasRef.current) {
      renderMathCaptchaToCanvas(mathCanvasRef.current, mathChallenge.textToDraw);
    }
  }, [mathChallenge]);

  const handleRegenerateCaptcha = () => {
    setMathChallenge(generateMathChallenge());
    setMathInput('');
  };

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const [isPolicyAgreed, setIsPolicyAgreed] = useState<boolean>(false);
  const policyScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStepLabel, setSubmitStepLabel] = useState<string>('Menyimpan ke server...');
  const [submissionSuccess, setSubmissionSuccess] =
    useState<SubmissionSuccessState | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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

  // Pencarian sekolah langsung dari view master Supabase (schools_all)
  useEffect(() => {
    if (!isSchoolDropdownOpen && !schoolSearchQuery.trim()) return;
    let cancelled = false;
    setIsLoadingSchools(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchMasterSchoolsInSupabase(schoolSearchQuery, 20);
        if (!cancelled) {
          setRemoteSchools(results);
        }
      } catch {
        if (!cancelled) {
          setRemoteSchools([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSchools(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [schoolSearchQuery, isSchoolDropdownOpen]);

  const handleSelectSchoolOption = (option: MasterSchoolSearchOption) => {
    setChosenSchool({
      id: option.id,
      name: option.name,
      npsn: option.npsn,
      jenjang: option.jenjang,
      kabupaten: option.kabupaten,
      kecamatan: option.kecamatan,
      provinsi: option.provinsi,
    });

    fetchSchoolFromSupabase(option.id || option.npsn, option.jenjang)
      .then((remote) => {
        if (remote) {
          onChangeSchool(remote);
        }
      })
      .catch(() => {
        // ignore
      });

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

  const handlePolicyScroll = () => {
    const el = policyScrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 25) {
      setHasScrolledToBottom(true);
    }
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
      setValidationError('Silakan setujui penggunaan cookie anti-spam di bagian bawah layar.');
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
      });

      recordReportSubmissionQuota();
      setDailyQuotaCount((prev) => prev + 1);

      saveTicketBookmarkToBrowserCookie({
        ticketCode: dbResult.ticket_code,
        schoolName: dbResult.school_name,
        schoolNpsn: dbResult.school_npsn,
        category: dbResult.category,
        createdAt: dbResult.created_at,
      });

      setSubmissionSuccess({
        ticketCode: dbResult.ticket_code,
        timestamp: formatWibDateTime(dbResult.created_at),
        schoolName: dbResult.school_name,
        schoolNpsn: dbResult.school_npsn,
        category: dbResult.category,
        role: roleLabel,
        fullNotes,
      });

      window.scrollTo({ top: 40, behavior: 'smooth' });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal mengirim laporan ke server Supabase. Periksa koneksi internet Anda.';
      setValidationError(message);
      handleRegenerateCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (!submissionSuccess?.ticketCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(submissionSuccess.ticketCode);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const selectedJenisLabel =
    JENIS_PUNGUTAN_OPTIONS.find((opt) => opt.value === jenisPungutan)?.label ||
    'Pilih jenis pungutan...';

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5]/85 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 max-w-sm w-full text-center shadow-lg space-y-4">
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
          </div>
        </div>
      )}

      {submissionSuccess ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-view-enter">
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                Laporan Terkirim
              </span>
              <h2 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Terima Kasih Telah Melapor
              </h2>
            </div>

            <p className="daradik-lead text-xs sm:text-sm text-[#475569] max-w-lg mx-auto leading-relaxed">
              Laporan kamu berhasil dikirim dan telah diterima oleh sistem DARADIK. Laporan akan masuk ke antrean pemeriksaan petugas.
            </p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E0D8]">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Kode Tiket Pelacakan
                </span>
                <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#2E6496] tracking-tight tabular-nums">
                  {submissionSuccess.ticketCode}
                </div>
                <p className="text-xs text-[#475569]">
                  Simpan kode tiket ini dengan teliti (perhatikan kombinasi huruf besar, huruf kecil, dan angka) untuk memantau laporan secara terenkripsi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyTicket}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-bold text-[#1E293B] flex items-center justify-center gap-2 cursor-pointer transition-colors self-start sm:self-auto shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-[#166534]" />
                    <span className="text-[#166534]">Kode Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#2E6496]" />
                    <span>Salin Kode Tiket</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-[#475569] block font-medium">
                  Sekolah yang Dilaporkan
                </span>
                <span
                  className="font-bold text-[#1E293B] flex items-center gap-1.5"
                  title={submissionSuccess.schoolName}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                  <span className="truncate">{submissionSuccess.schoolName}</span>
                </span>
                <span className="font-mono text-[11px] text-[#475569] tabular-nums block">
                  NPSN: {submissionSuccess.schoolNpsn}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#475569] block font-medium">
                  Kategori Laporan
                </span>
                <span
                  className="font-bold text-[#1E293B] block"
                  title={submissionSuccess.category}
                >
                  {submissionSuccess.category}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#475569] block font-medium">
                  Waktu Pengiriman
                </span>
                <div className="flex items-center gap-1.5 text-[#1E293B] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                  <span className="font-mono tabular-nums text-[#1E293B]">
                    {submissionSuccess.timestamp}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EBF3F8]/60 border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E6496] shrink-0" />
                <span className="text-[#1E293B] font-bold">
                  Status Saat Ini: Menunggu Pemeriksaan Petugas Dinas Pendidikan
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#1D4F7A] bg-[#FFFFFF] border border-[#C9DFDC] px-2.5 py-0.5 rounded-md font-semibold self-start sm:self-auto">
                Antrean Dinas
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  onSubmitSuccess(
                    submissionSuccess.ticketCode,
                    submissionSuccess.fullNotes,
                    submissionSuccess.category
                  )
                }
                className="w-full sm:flex-1 min-h-[44px] py-3 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Pantau Status Laporan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBackToHome || onCancel}
                className="w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
              >
                Kembali ke Pencarian
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-view-enter">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
              <span>Kembali</span>
            </button>
          </div>

          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
            <div className="w-full bg-[#FFFFFF] border-b border-[#E4E0D8]/80 overflow-hidden">
              <img
                src="/banner-lapor.jpg"
                alt="Banner Pelaporan DARADIK"
                className="w-full h-auto object-contain block select-none"
              />
            </div>

            <div className="p-4 sm:p-8 space-y-4">
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

            {/* Seksi 1: Sekolah Tujuan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="school-search-input"
                  className="block text-sm font-bold text-[#1E293B]"
                >
                  Sekolah Tujuan Laporan
                  <span className="text-[#991B1B] font-bold ml-1">*</span>
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
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1E293B]">
                          {chosenSchool.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-[#2E6496] text-[#FFFFFF]">
                          {chosenSchool.jenjang}
                        </span>
                      </div>
                      <div className="text-xs text-[#475569] mt-0.5">
                        NPSN:{' '}
                        <span className="font-mono text-[#1D4F7A] font-semibold tabular-nums">
                          {chosenSchool.npsn}
                        </span>{' '}
                        • Kec. {chosenSchool.kecamatan}, {chosenSchool.kabupaten}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearSelectedSchool}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E293B] cursor-pointer shrink-0"
                  >
                    Ubah
                  </button>
                </div>
              ) : (
                <div ref={schoolSearchContainerRef} className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="school-search-input"
                      type="text"
                      value={schoolSearchQuery}
                      onFocus={() => setIsSchoolDropdownOpen(true)}
                      onChange={(e) => {
                        setSchoolSearchQuery(e.target.value);
                        setIsSchoolDropdownOpen(true);
                        if (validationError?.includes('sekolah')) setValidationError(null);
                      }}
                      placeholder="Cari nama sekolah, NPSN, atau kabupaten/kota..."
                      className="w-full min-h-[44px] pl-10 pr-9 py-2.5 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                    />
                    {schoolSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSchoolSearchQuery('');
                          setIsSchoolDropdownOpen(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#1E293B] p-1 cursor-pointer"
                        aria-label="Hapus kata kunci sekolah"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isSchoolDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-[#E4E0D8]/60">
                      {isLoadingSchools ? (
                        <div className="p-4 text-center text-xs text-[#475569]">
                          Mencari data sekolah dari basis data...
                        </div>
                      ) : remoteSchools.length > 0 ? (
                        remoteSchools.map((s) => (
                          <button
                            key={`${s.jenjang}-${s.npsn}`}
                            type="button"
                            onClick={() => handleSelectSchoolOption(s)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[#EBF3F8] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <p
                                  className="text-xs sm:text-sm font-bold text-[#1E293B] group-hover:text-[#2E6496] truncate"
                                  title={s.name}
                                >
                                  {s.name}
                                </p>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3F8] text-[#1D4F7A] shrink-0">
                                  {s.jenjang}
                                </span>
                              </div>
                              <p className="font-mono text-[11px] text-[#475569] tabular-nums mt-0.5 truncate">
                                NPSN: {s.npsn} • {s.kecamatan}, {s.kabupaten}
                              </p>
                            </div>
                            <span className="text-xs text-[#2E6496] font-semibold shrink-0">
                              Pilih
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-[#475569]">
                          Sekolah dengan kata kunci tersebut tidak ditemukan di basis data.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seksi 2: Jenis Pungutan */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1E293B]">
                Kategori Laporan / Jenis Pungutan
                <span className="text-[#991B1B] font-bold ml-1">*</span>
              </label>

              <div ref={jenisDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsJenisDropdownOpen((prev) => !prev)}
                  className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
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
                  <ChevronDown
                    className={`w-4 h-4 text-[#475569] transition-transform duration-200 ${
                      isJenisDropdownOpen ? 'rotate-180 text-[#2E6496]' : ''
                    }`}
                  />
                </button>

                {isJenisDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-[#E4E0D8]/60">
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
                          className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
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

            {/* Seksi 3: Pihak yang Meminta */}
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

            {/* Seksi 4: Kronologi Kejadian */}
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

            {/* Seksi 5: Bukti Pendukung */}
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

            {/* Seksi 6: Verifikasi Anti-Bot */}
            <div className="space-y-3 pt-2 text-center flex flex-col items-center">
              <label
                htmlFor="math-captcha-input"
                className="text-xs sm:text-sm font-semibold text-[#1E293B]"
              >
                Hitung soal berikut untuk verifikasi pengiriman manusia
                <span className="text-[#991B1B] font-bold ml-1">*</span>
              </label>

              <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-3.5 max-w-sm w-full mx-auto flex flex-col items-center">
                <div className="flex items-center justify-center gap-2.5 w-full">
                  <div className="rounded-xl overflow-hidden border border-[#C9DFDC] bg-white shrink-0 select-none max-w-[180px] sm:max-w-[210px]">
                    <canvas
                      ref={mathCanvasRef}
                      width={210}
                      height={62}
                      className="block pointer-events-none w-full h-auto"
                      title="Soal Verifikasi Matematika"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateCaptcha}
                    className="w-11 h-11 rounded-xl bg-white hover:bg-[#EBF3F8] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Ganti Soal Baru"
                    aria-label="Ganti Soal Matematika"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full space-y-1">
                  <input
                    id="math-captcha-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={mathInput}
                    onChange={(e) => {
                      setMathInput(e.target.value.replace(/[^0-9]/g, ''));
                      if (
                        validationError?.includes('matematika') ||
                        validationError?.includes('verifikasi')
                      ) {
                        setValidationError(null);
                      }
                    }}
                    placeholder="Ketik hasil angka..."
                    className="w-full min-h-[44px] text-center px-4 py-2.5 text-sm font-mono font-bold tracking-wider bg-white border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  <p className="text-[11px] text-[#475569] text-center">
                    Masukkan hasil hitungan angka di atas
                  </p>
                </div>
              </div>
            </div>

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

      {!hasCookieConsent && (
        <div className="fixed bottom-[calc(var(--mobile-nav-h)+var(--safe-bottom)+0.75rem)] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#92400E] flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="text-xs font-bold text-[#1E293B]">
                Persetujuan Cookie Anti-Spam
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                Kami menggunakan cookie perangkat untuk mencegah pengiriman otomatis berulang dan menyimpan penanda kode tiket Anda secara lokal.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleAcceptCookieConsent}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
            >
              Setujui Cookie
            </button>
          </div>
        </div>
      )}

      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
            className="bg-[#FFFFFF] rounded-t-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border-t sm:border border-[#C9DFDC] flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="policy-modal-title"
                    className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]"
                  >
                    Kebijakan Pelaporan dan Privasi DARADIK
                  </h3>
                  <p className="text-[11px] text-[#475569]">
                    Baca ketentuan berikut sebelum mengirim laporan resmi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-2 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup dialog kebijakan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={policyScrollContainerRef}
              onScroll={handlePolicyScroll}
              className="overflow-y-auto p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs text-[#334155] space-y-4 leading-relaxed flex-1"
            >
              <p className="daradik-lead text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                DARADIK adalah platform keterbukaan dana BOSP yang membantu orang tua memahami penggunaan dana sekolah dan melaporkan dugaan pungutan tidak sesuai ketentuan. Mohon baca kebijakan ini sebelum mengirim laporan.
              </p>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  1. Peran DARADIK
                </div>
                <p>
                  DARADIK adalah sarana penyampaian dan pemantauan laporan. DARADIK bukan lembaga penegak hukum dan tidak menjatuhkan putusan hukum. Laporan yang memenuhi syarat diperiksa oleh petugas Dinas Pendidikan dan dapat diteruskan kepada instansi terkait sesuai kewenangan.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  2. Siapa yang Dapat Melapor
                </div>
                <p>
                  Orang tua/wali, siswa, alumni, guru, dan masyarakat yang mengetahui, mengalami, atau memiliki bukti dugaan pungutan di satuan pendidikan.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  3. Pernyataan Pelapor
                </div>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li>Laporan didasarkan pada kejadian nyata dan dapat dipertanggungjawabkan;</li>
                  <li>Laporan tidak dibuat untuk memfitnah atau menyebarkan informasi palsu;</li>
                  <li>Anda berhak membagikan bukti pendukung yang diunggah.</li>
                </ul>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  4. Perlindungan Identitas Pribadi
                </div>
                <p>
                  Jangan mencantumkan nama lengkap anak, NISN, alamat rumah, wajah anak yang dapat dikenali, NIK, atau nomor rekening pribadi. DARADIK tidak meminta akun, nama, nomor HP, atau email saat pelaporan. Satu-satunya akses pemantauan laporan adalah kode tiket unik Anda.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  5. Bukti Pendukung dan Komunikasi Lanjutan
                </div>
                <p>
                  Gambar bukti dikompresi ulang pada perangkat Anda untuk menghapus metadata lokasi GPS maupun perangkat kamera sebelum disimpan ke penyimpanan aman. Melalui kode tiket, Anda dapat melihat perkembangan 5 tahap pemeriksaan dan membalas permintaan informasi tambahan dari petugas tanpa membuka identitas pribadi.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  6. Penyimpanan Kode Tiket
                </div>
                <p>
                  Simpan kode tiket Anda secara mandiri dan rahasia. Siapa pun yang memegang kode tiket dapat membaca perkembangan dan mengirim balasan tambahan pada laporan tersebut.
                </p>
              </div>
            </div>

            <div className="shrink-0 pt-1">
              <label
                className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-colors select-none ${
                  hasScrolledToBottom
                    ? 'bg-[#FFFFFF] border-[#2E6496] ring-1 ring-[#2E6496]/20 cursor-pointer'
                    : 'bg-[#FAF8F5] border-[#E4E0D8] cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!hasScrolledToBottom}
                  checked={isPolicyAgreed}
                  onChange={(e) => setIsPolicyAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496] mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="text-xs space-y-0.5">
                  <span
                    className={
                      hasScrolledToBottom ? 'font-bold text-[#1E293B]' : 'text-[#475569]'
                    }
                  >
                    Saya telah membaca dan menyetujui ketentuan pelaporan DARADIK di atas.
                  </span>
                  {!hasScrolledToBottom && (
                    <div className="text-[11px] text-[#475569]">
                      Gulir kotak kebijakan hingga bagian bawah untuk mengaktifkan kotak persetujuan.
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E4E0D8] shrink-0">
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="min-h-[42px] px-4 py-2.5 rounded-xl border border-[#C9DFDC] text-xs font-bold text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5] cursor-pointer transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!isPolicyAgreed || isSubmitting}
                onClick={handleFinalConfirmSubmit}
                className={`min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
                  isPolicyAgreed && !isSubmitting
                    ? 'bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] cursor-pointer'
                    : 'bg-[#E4E0D8] text-[#475569] cursor-not-allowed'
                }`}
              >
                <span>Lanjutkan &amp; Kirim Laporan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
