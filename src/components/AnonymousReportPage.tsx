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
  Calculator,
  Lock,
} from 'lucide-react';
import { SCHOOLS_DATABASE, SchoolData } from '../data/schoolsData';
import { saveAnonymousReport } from '../lib/supabase';

interface AnonymousReportPageProps {
  selectedSchool?: SchoolData | null;
  preselectSchool?: boolean;
  onChangeSchool: (school: SchoolData) => void;
  prefilledCategory?: string;
  prefilledAttachment?: string;
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmitSuccess: (ticketCode: string, notes: string, category: string) => void;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  sizeFormatted: string;
  previewUrl?: string;
}

export interface SubmissionSuccessState {
  ticketCode: string;
  timestamp: string;
  schoolName: string;
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

// Flag pembatasan 3x pengiriman per hari (dinonaktifkan sementara untuk perbaikan)
// Ubah ke true untuk mengaktifkan kembali pembatasan
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

// Cryptographic Salted Hash untuk Verifikasi Jawaban Captcha Matematika (Anti-Bot)
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

// Generate Soal Matematika Acak & Aman
function generateMathChallenge(): MathChallengeState {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 12) + 3; // 3 - 14
    num2 = Math.floor(Math.random() * 11) + 2; // 2 - 12
    answer = num1 + num2;
  } else if (op === '-') {
    num1 = Math.floor(Math.random() * 14) + 10; // 10 - 23
    num2 = Math.floor(Math.random() * (num1 - 3)) + 1; // 1 to num1-3
    answer = num1 - num2;
  } else {
    // Perkalian kecil
    num1 = Math.floor(Math.random() * 6) + 2; // 2 - 7
    num2 = Math.floor(Math.random() * 4) + 2; // 2 - 5
    answer = num1 * num2;
  }

  const textToDraw = `${num1} ${op} ${num2} = ?`;
  const salt = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();
  const token = hashCaptchaAnswer(answer, salt, timestamp);

  return { textToDraw, salt, timestamp, token };
}

// Gambar Soal Matematika ke Canvas dengan Corakan & Warna Bertabrakan
function renderMathCaptchaToCanvas(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Latar Belakang Gradien Halus
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#F8FAFC');
  bgGrad.addColorStop(0.5, '#F1F5F9');
  bgGrad.addColorStop(1, '#EDE9FE');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Corakan Garis Warna-warni Bertabrakan
  const clashingLineColors = [
    'rgba(239, 68, 68, 0.4)',
    'rgba(37, 99, 235, 0.4)',
    'rgba(16, 185, 129, 0.4)',
    'rgba(217, 119, 6, 0.4)',
    'rgba(147, 51, 234, 0.4)',
  ];

  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = clashingLineColors[i % clashingLineColors.length];
    ctx.lineWidth = Math.random() * 1.6 + 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h
    );
    ctx.stroke();
  }

  // 3. Corakan Bintik / Noise Dots
  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = clashingLineColors[Math.floor(Math.random() * clashingLineColors.length)];
    ctx.beginPath();
    ctx.arc(
      Math.random() * w,
      Math.random() * h,
      Math.random() * 1.8 + 0.6,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 4. Karakter Matematika
  const charColors = [
    '#991B1B',
    '#1E3A8A',
    '#065F46',
    '#701A75',
    '#92400E',
    '#1E293B',
    '#581C87',
  ];

  const fonts = [
    'bold 24px "Space Grotesk", sans-serif',
    'bold 23px "Courier New", monospace',
    'bold 24px "Georgia", serif',
    'bold 24px "Plus Jakarta Sans", sans-serif',
  ];

  const chars = text.split('');
  const totalChars = chars.length;
  const startX = 16;
  const charSpacing = (w - 32) / totalChars;

  chars.forEach((ch, idx) => {
    ctx.save();
    const x = startX + idx * charSpacing + (Math.random() * 4 - 2);
    const y = h / 2 + (Math.random() * 6 - 3) + 7;
    const angle = (Math.random() * 32 - 16) * (Math.PI / 180);

    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.font = fonts[(idx + Math.floor(Math.random() * 2)) % fonts.length];
    ctx.fillStyle = charColors[(idx * 2 + Math.floor(Math.random() * 3)) % charColors.length];
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 1.5;
    ctx.shadowOffsetX = Math.random() * 2 - 1;
    ctx.shadowOffsetY = Math.random() * 2 - 1;

    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  // 5. Garis Gelombang Melintang
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(6, h / 2 + (Math.random() * 8 - 4));
  ctx.bezierCurveTo(
    w * 0.35, h / 2 + (Math.random() * 14 - 7),
    w * 0.65, h / 2 + (Math.random() * 14 - 7),
    w - 6, h / 2 + (Math.random() * 8 - 4)
  );
  ctx.stroke();
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

/**
 * Komponen Animasi Enkripsi Sederhana: Mengacak tulisan pesan secara tenang & bertahap
 * kemudian disamarkan menjadi bintang (*) dengan nuansa abu-abu menyatu latar.
 */
const ScrambleToAsteriskCipher: React.FC = () => {
  const initialText = 'PESAN_LAPORAN_TERENKRIPSI';
  const [displayText, setDisplayText] = useState<string>(initialText);
  const [statusLabel, setStatusLabel] = useState<string>('Menyiapkan');

  useEffect(() => {
    const glitchChars = '#$%*+0123456789ABCDEF';
    const len = initialText.length;
    let ticks = 0;
    let asterisksCount = 0;

    const timer = setInterval(() => {
      ticks++;

      // Fase 1: Karakter diacak perlahan
      if (ticks <= 5) {
        setStatusLabel('Mengacak karakter...');
        const scrambled = initialText
          .split('')
          .map((c) => (c === '_' ? '_' : glitchChars[Math.floor(Math.random() * glitchChars.length)]))
          .join('');
        setDisplayText(scrambled);
      }
      // Fase 2: Bertahap disamarkan menjadi bintang (*)
      else if (asterisksCount < len) {
        setStatusLabel('Menyamarkan (*) ...');
        asterisksCount = Math.min(len, asterisksCount + 2);
        const masked = initialText
          .split('')
          .map((c, i) => {
            if (i < asterisksCount) return '*';
            return c === '_' ? '_' : glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join('');
        setDisplayText(masked);
      }
      // Fase 3: Selesai menjadi bintang (*)
      else {
        setStatusLabel('Terenkripsi aman');
        setDisplayText('*'.repeat(len));
        clearInterval(timer);
      }
    }, 130);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl p-3 border border-[#E4E0D8] text-left space-y-2">
      <div className="flex items-center justify-between text-[11px] text-[#64748B]">
        <span className="flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>Enkripsi Anonim</span>
        </span>
        <span className="text-[#64748B] font-medium text-[10px]">
          {statusLabel}
        </span>
      </div>

      <div className="py-2 px-3 rounded-lg bg-[#F1EFEA] text-xs font-mono font-bold tracking-widest text-[#475569] text-center select-none border border-[#E4E0D8]/80">
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
  onCancel,
  onBackToHome,
  onSubmitSuccess,
}) => {
  // 1. Sekolah State
  const isDirectItemPrefill = Boolean(prefilledCategory) || preselectSchool;
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

  // 2. Jenis Pungutan State
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

  // 6. Cookie Consent Pop-up di Bawah Layar
  const [hasCookieConsent, setHasCookieConsent] = useState<boolean>(() => {
    return (
      getCookie(COOKIE_CONSENT_KEY) === 'true' ||
      (typeof localStorage !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'true')
    );
  });
  const [dailyQuotaCount, setDailyQuotaCount] = useState<number>(() => {
    return getDailyReportData().count;
  });

  // 7. Custom In-House Math Captcha Anti-Bot
  const [mathChallenge, setMathChallenge] = useState<MathChallengeState>(generateMathChallenge);
  const [mathInput, setMathInput] = useState<string>('');
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw Canvas whenever mathChallenge changes
  useEffect(() => {
    if (mathCanvasRef.current) {
      renderMathCaptchaToCanvas(mathCanvasRef.current, mathChallenge.textToDraw);
    }
  }, [mathChallenge]);

  const handleRegenerateCaptcha = () => {
    const nextChallenge = generateMathChallenge();
    setMathChallenge(nextChallenge);
    setMathInput('');
  };

  // 8. Modal Kebijakan Sebelum Mengirim (Scroll-to-accept gate)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const [isPolicyAgreed, setIsPolicyAgreed] = useState<boolean>(false);
  const policyScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 9. Validation, Loading, & Submission Success State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionSuccessState | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
    const tokens = q.split(/\s+/).filter(Boolean);
    return SCHOOLS_DATABASE.filter((s) => {
      const combined = `${s.name} ${s.npsn} ${s.kecamatan} ${s.kabupaten} ${s.provinsi} ${s.jenjang} ${s.schoolType || ''}`.toLowerCase();
      return tokens.every((tk) => combined.includes(tk));
    }).slice(0, 16);
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

  // Upload & Compress Handler
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

  // Cookie Consent Handler
  const handleAcceptCookieConsent = () => {
    setCookie(COOKIE_CONSENT_KEY, 'true', 365);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    }
    setHasCookieConsent(true);
  };

  // Scroll Detection in Policy Modal
  const handlePolicyScroll = () => {
    const el = policyScrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 25) {
      setHasScrolledToBottom(true);
    }
  };

  // Klik Tombol "Kirim Laporan" dari Form Utama -> Validasi & Buka Tab Kebijakan
  const handleInitialSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();

    // Pengecekan Batas Kuota Harian (Bisa diaktifkan/dinonaktifkan via flag ENABLE_DAILY_LIMIT)
    if (ENABLE_DAILY_LIMIT && dailyQuotaCount >= MAX_DAILY_REPORTS) {
      setValidationError(
        'Hari sudah mencapai batasnya (maksimal 3 laporan/hari). Anda dapat mengirimnya besok lagi di jam 00:00 WIB.'
      );
      return;
    }

    if (!hasCookieConsent) {
      setValidationError('Silakan setujui cookie anti-spam pada pop-up di bawah layar.');
      return;
    }

    if (!chosenSchool) {
      setValidationError('Pilih sekolah yang ingin dilaporkan.');
      setIsSearchingSchool(true);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!jenisPungutan) {
      setValidationError('Pilih jenis pungutan.');
      return;
    }
    if (jenisPungutan === 'lainnya' && !jenisPungutanLainnya.trim()) {
      setValidationError('Tuliskan rincian jenis pungutan lainnya.');
      return;
    }

    if (!pihakMeminta) {
      setValidationError('Pilih pihak yang meminta pungutan.');
      return;
    }
    if (pihakMeminta === 'Pihak Lain' && !pihakLainnyaDetail.trim()) {
      setValidationError('Sebutkan peran pihak lain yang meminta.');
      return;
    }

    if (!additionalNotes.trim()) {
      setValidationError('Tuliskan catatan detail kronologi kejadian laporan.');
      return;
    }

    // Validasi Captcha Matematika Mandiri (Bukan Robot)
    if (!mathInput.trim()) {
      setValidationError('Silakan ketik hasil hitungan captcha matematika.');
      return;
    }

    // Cek kadaluarsa (> 3 menit)
    if (Date.now() - mathChallenge.timestamp > 180000) {
      setValidationError('Waktu captcha telah habis. Silakan hitung soal matematika baru.');
      handleRegenerateCaptcha();
      return;
    }

    // Verifikasi hash jawaban
    const calculatedHash = hashCaptchaAnswer(
      mathInput.trim(),
      mathChallenge.salt,
      mathChallenge.timestamp
    );

    if (calculatedHash !== mathChallenge.token) {
      setValidationError('Hasil hitungan matematika tidak tepat. Silakan coba lagi.');
      handleRegenerateCaptcha();
      return;
    }

    setValidationError(null);
    setIsPolicyModalOpen(true);
    setHasScrolledToBottom(false);
    setIsPolicyAgreed(false);
  };

  // Final Action: Pengguna telah membaca, scroll sampai bawah, dan klik Lanjutkan & Kirim
  const handleFinalConfirmSubmit = async () => {
    if (!isPolicyAgreed) return;

    setIsPolicyModalOpen(false);
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

    recordReportSubmission();
    setDailyQuotaCount((prev) => prev + 1);

    // Dynamic unique Ticket Code (Resi Lacak Kargo)
    const randomTicketSuffix = Math.floor(1000 + Math.random() * 9000);
    const regCode = (chosenSchool?.kabupaten || 'BGR').substring(0, 3).toUpperCase();
    const ticket = `CHK-2026-${randomTicketSuffix}-${regCode}`;

    // Simpan ke basis data (Supabase & LocalStorage)
    await saveAnonymousReport({
      ticketCode: ticket,
      schoolId: chosenSchool?.id || 'sekolah-terpilih',
      schoolName: chosenSchool?.name || 'Sekolah Terpilih',
      schoolNpsn: chosenSchool?.npsn || '-',
      kabupaten: chosenSchool?.kabupaten || '-',
      kecamatan: chosenSchool?.kecamatan || '-',
      category: categoryLabel,
      requesterRole: roleLabel,
      notes: fullNotes,
      attachmentCount: attachments.length,
      attachments: attachments.map((a) => ({
        name: a.name,
        sizeFormatted: a.sizeFormatted,
      })),
      status: 'TERKIRIM_TERENKRIPSI',
    });

    // Jalankan animasi persegi 4 berbalik arah jarum jam & teks acak -> bintang (*) secara santai & halus
    setTimeout(() => {
      setIsEncrypting(false);
      const nowFormatted =
        new Date().toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB';

      setSubmissionSuccess({
        ticketCode: ticket,
        timestamp: nowFormatted,
        schoolName: chosenSchool?.name || 'Sekolah Terpilih',
        category: categoryLabel,
        role: roleLabel,
        fullNotes,
      });

      window.scrollTo({ top: 60, behavior: 'smooth' });
    }, 2800);
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
      {/* =====================================================================
          LOADING OVERLAY: 4 PERSEGI ABU-ABU LEMBUT + ENKRIPSI DISAMARKAN BINTANG (*)
         ===================================================================== */}
      {isEncrypting && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5]/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-view-enter">
          <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-2xl p-6 max-w-sm w-full text-center shadow-lg space-y-4">
            {/* 4 Persegi Berputar Berbalik Arah Jarum Jam (Abu-abu lembut) */}
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
                Mengirim Laporan...
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Pesan disamarkan dan dienkripsi secara aman.
              </p>
            </div>

            {/* Widget Teks Diacak dan Menjadi Bintang (*) */}
            <ScrambleToAsteriskCipher />
          </div>
        </div>
      )}

      {/* =====================================================================
          KONDISI A: TAMPILAN BERHASIL & RESI LACAK KARGO (SETELAH TERKIRIM)
         ===================================================================== */}
      {submissionSuccess ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-view-enter">
          {/* 1. Header Ucapan Terima Kasih */}
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#EBF7EE] text-[#2E7D32] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                Laporan Berhasil Terkirim & Tersimpan
              </span>
              <h2 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Terima Kasih Telah Melapor!
              </h2>
            </div>

            <p className="daradik-lead text-xs sm:text-sm text-[#475569] max-w-lg mx-auto leading-relaxed">
              Terima kasih banyak atas keberanian dan kepedulian Anda. Laporan Anda sangat berharga dalam menjaga transparansi anggaran pendidikan dan melindungi hak seluruh murid.
            </p>
          </div>

          {/* 2. Resi Lacak Kargo Card */}
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Resi Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E0D8]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  NO. RESI PELACAKAN (TIKET WHISTLEBLOWING)
                </span>
                <div className="font-mono text-xl sm:text-2xl font-extrabold text-[#2E6496] tracking-wide tabular-nums mt-0.5">
                  {submissionSuccess.ticketCode}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyTicket}
                className="px-4 py-2.5 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-bold text-[#1E293B] flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto shadow-2xs active:translate-y-[1px]"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-[#2E7D32]" />
                    <span className="text-[#2E7D32]">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#2E6496]" />
                    <span>Salin Kode Resi</span>
                  </>
                )}
              </button>
            </div>

            {/* Cargo Tracking Progress Stepper */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                STATUS PERJALANAN LAPORAN (SISTEM LACAK KARGO)
              </span>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E0D8]">
                {/* Step 1: Terkirim */}
                <div className="relative flex items-start gap-3">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-2">
                      <span>Laporan Diterima & Terenkripsi</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EBF7EE] text-[#2E7D32]">
                        Selesai
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {submissionSuccess.timestamp} • Tersimpan aman di basis data
                    </p>
                  </div>
                </div>

                {/* Step 2: Verifikasi Dokumen */}
                <div className="relative flex items-start gap-3">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#2E6496] text-white flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF] animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#1E293B] flex items-center gap-2">
                      <span>Verifikasi Berkas Inspektorat</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3F8] text-[#2E6496]">
                        Dalam Antrean
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Menunggu telaah auditor independen Dinas Pendidikan
                    </p>
                  </div>
                </div>

                {/* Step 3: Investigasi Lapangan */}
                <div className="relative flex items-start gap-3 opacity-60">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#E4E0D8] text-[#64748B] flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF]">
                    3
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
                      Klarifikasi & Pemeriksaan Sekolah
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Pencocokan realisasi SPJ BOSP dengan keterangan pelapor
                    </p>
                  </div>
                </div>

                {/* Step 4: Rekomendasi Sanksi */}
                <div className="relative flex items-start gap-3 opacity-60">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#E4E0D8] text-[#64748B] flex items-center justify-center text-[10px] ring-4 ring-[#FFFFFF]">
                    4
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
                      Putusan Tindak Lanjut & Rekomendasi
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Penerbitan surat teguran dan instruksi pengembalian pungutan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ringkasan Data Kiriman */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">Sekolah Tujuan:</span>
                <span className="font-bold text-[#1E293B]">{submissionSuccess.schoolName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Jenis Pungutan:</span>
                <span className="font-bold text-[#1E293B]">{submissionSuccess.category}</span>
              </div>
            </div>

            {/* Tombol Lacak */}
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
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-[1px]"
              >
                <span>Lacak Status Laporan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBackToHome || onCancel}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================================
            KONDISI B: FORMULIR PELAPORAN UTAMA
           =================================================================== */
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-view-enter">
          {/* Top Navigation */}
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

          {/* Hero Header Terpadu dengan Banner */}
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
            {/* Banner Ilustrasi Terpadu */}
            <div className="w-full bg-[#FFFFFF] border-b border-[#E4E0D8]/80 overflow-hidden">
              <img
                src="/banner-lapor.jpg"
                alt="Banner Lapor DARADIK: Ada yang janggal? Jangan diam. Lapor."
                className="w-full h-auto object-contain block select-none"
              />
            </div>

            {/* Konten Hero Header */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="space-y-2">
                <h1 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                  Kirim Laporan Pungutan Liar
                </h1>
                <p className="daradik-lead text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Laporkan pungutan sekolah tanpa dasar hukum secara aman. Data identitas dan perangkat Anda tidak dilacak.
                </p>
              </div>

              {/* 3 Pills Ringkas & Modern */}
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
          </div>

          {/* Formulir */}
          <form
            onSubmit={handleInitialSubmitClick}
            className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl shadow-xs p-6 sm:p-8 space-y-7"
          >
            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F5C6CB] text-[#C24136] text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-view-enter">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Seksi 1: Sekolah Tujuan */}
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
                        NPSN:{' '}
                        <span className="font-mono text-[#2E6496] font-semibold">
                          {chosenSchool.npsn}
                        </span>{' '}
                        • Kec. {chosenSchool.kecamatan}, {chosenSchool.kabupaten}
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

                  {isSchoolDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-[#E4E0D8]/60 animate-view-enter">
                      {filteredSchools.length > 0 ? (
                        filteredSchools.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSchool(s)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[#EBF3F8] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-xs sm:text-sm font-bold text-[#1E293B] group-hover:text-[#2E6496] truncate" title={s.name}>
                                {s.name}
                              </p>
                              <p className="font-mono text-[11px] text-[#64748B] tabular-nums mt-0.5">
                                NPSN: {s.npsn}
                              </p>
                            </div>
                            <span className="text-xs text-[#2E6496] font-semibold opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
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

            {/* Seksi 2: Jenis Pungutan */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1E293B]">
                Jenis Pungutan
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </label>

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

            {/* Seksi 3: Pihak yang Meminta */}
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

            {/* Seksi 4: Catatan Lainnya (Wajib) */}
            <div className="space-y-1.5">
              <label htmlFor="report-notes" className="block text-sm font-bold text-[#1E293B]">
                Catatan Lainnya
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </label>

              <textarea
                id="report-notes"
                rows={3}
                value={additionalNotes}
                onChange={(e) => {
                  setAdditionalNotes(e.target.value);
                  if (validationError?.includes('catatan')) setValidationError(null);
                }}
                placeholder="Tuliskan nominal uang, waktu kejadian, cara pembayaran (tunai/transfer), atau kronologi kejadian..."
                className="w-full p-3.5 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
              />
            </div>

            {/* Seksi 5: Bukti Pelaporan (Opsional) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-bold text-[#1E293B]">
                  Bukti Pelaporan (Foto / Screenshot)
                  <span className="text-xs font-normal text-[#64748B] ml-1.5">(Opsional)</span>
                </label>
                <span className="text-xs text-[#64748B]">
                  Maks. 5 gambar ({attachments.length}/5)
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

            {/* ===============================================================
                SEKSI 6: CUSTOM ANTI-BOT MATH CAPTCHA (POSISI DI TENGAH)
               =============================================================== */}
            <div className="space-y-3 pt-2 text-center flex flex-col items-center">
              <p className="text-xs sm:text-sm font-semibold text-[#475569]">
                Selesaikan hitungan untuk membuktikan Anda bukan bot
                <span className="text-[#DC2626] font-bold ml-1">*</span>
              </p>

              {/* Tampilan Box Sederhana & Simetris di Tengah */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-3.5 max-w-sm w-full mx-auto flex flex-col items-center shadow-2xs">
                <div className="flex items-center justify-center gap-2.5 w-full">
                  {/* Canvas Gambar di Tengah */}
                  <div className="rounded-xl overflow-hidden border border-[#C9DFDC] bg-white shadow-2xs shrink-0 select-none">
                    <canvas
                      ref={mathCanvasRef}
                      width={210}
                      height={62}
                      className="block pointer-events-none"
                      title="Captcha Soal Matematika"
                    />
                  </div>

                  {/* Tombol Acak Soal */}
                  <button
                    type="button"
                    onClick={handleRegenerateCaptcha}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-[#EBF3F8] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    title="Ganti Soal Captcha Baru"
                    aria-label="Ganti Soal Captcha"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Input Jawaban Angka di Tengah */}
                <div className="w-full space-y-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={mathInput}
                    onChange={(e) => {
                      setMathInput(e.target.value.replace(/[^0-9]/g, ''));
                      if (
                        validationError?.includes('captcha') ||
                        validationError?.includes('matematika')
                      ) {
                        setValidationError(null);
                      }
                    }}
                    placeholder="Ketik hasil angka..."
                    className="w-full text-center px-4 py-2.5 text-sm font-mono font-bold tracking-wider bg-white border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#94A3B8] placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                  />
                  <p className="text-[11px] text-[#64748B] text-center">
                    Hitung angka pada gambar di atas
                  </p>
                </div>
              </div>
            </div>

            {/* Notifikasi Validasi / Batas Kuota Dekat Tombol Kirim */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F5C6CB] text-[#C24136] text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-view-enter">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Tombol Kirim */}
            <div className="pt-2 border-t border-[#E4E0D8] flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isEncrypting}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-sm active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-[#FFFFFF]" />
                <span>Kirim Laporan</span>
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
      )}

      {/* =====================================================================
          COOKIE POP-UP DI BAWAH LAYAR
         ===================================================================== */}
      {!hasCookieConsent && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 shadow-xl space-y-2.5 animate-view-enter">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#C87A28] flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="text-xs font-bold text-[#1E293B]">
                Persetujuan Cookie Anti-Spam
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                Kami menggunakan cookie perangkat untuk membatasi frekuensi pelaporan (maksimal 3 laporan/hari) demi mencegah spam bot.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleAcceptCookieConsent}
              className="px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Setujui Cookie
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL KEBIJAKAN SEBELUM MENGIRIM (18 Pasal Lengkap)
         ===================================================================== */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-view-enter">
          <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#C9DFDC] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]">
                    Kebijakan Pelaporan dan Privasi DARADIK
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Terakhir diperbarui: 3 November 2026
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Policy Box: 18 Poin Kebijakan Resmi */}
            <div
              ref={policyScrollContainerRef}
              onScroll={handlePolicyScroll}
              className="overflow-y-auto p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs text-[#334155] space-y-4 leading-relaxed flex-1"
            >
              <p className="daradik-lead text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                DARADIK adalah platform keterbukaan dana BOSP yang membantu orang tua memahami penggunaan dana sekolah dan melaporkan dugaan pungutan liar. Mohon baca kebijakan ini sebelum mengirim laporan.
              </p>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  1. Peran DARADIK
                </div>
                <p>
                  DARADIK adalah sarana penyampaian dan pemantauan laporan. DARADIK bukan lembaga penegak hukum dan tidak dapat menjatuhkan sanksi. Laporan yang memenuhi syarat dapat diteruskan kepada pihak berwenang yang relevan, seperti Inspektorat atau Dinas Pendidikan, dan keputusan akhir ada pada instansi tersebut. Kami tidak menjamin hasil tertentu dari sebuah laporan.
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
                  3. Jenis Laporan
                </div>
                <p>
                  Formulir menerima laporan tentang uang pembangunan, uang buku/LKS, seragam, pungutan ujian/kelulusan, uang les/ekskul wajib, pungutan PPDB/mutasi, jual beli bangku, dan pungutan lainnya. Anda juga diminta menyebut peran pihak yang meminta (Kepala Sekolah, Guru, Komite Sekolah, Tata Usaha, atau pihak lain). Cukup tulis peran, jangan nama pribadi.
                </p>
                <p className="mt-1.5">
                  <strong>Pungutan dan sumbangan:</strong> Sumbangan bersifat sukarela, tanpa penentuan jumlah dan waktu. Pungutan bersifat wajib atau mengikat dan ditentukan jumlah serta waktunya. Kami menilai klasifikasi laporan berdasarkan peraturan yang berlaku, bukan hanya dari pilihan Anda di formulir.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  4. Pernyataan Pelapor
                </div>
                <p>Dengan mencentang persetujuan, Anda menyatakan bahwa:</p>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li>Laporan didasarkan pada kejadian nyata dan dapat dipertanggungjawabkan;</li>
                  <li>Laporan tidak dibuat untuk memfitnah, membalas dendam, atau menyebarkan hoaks;</li>
                  <li>Anda berhak membagikan bukti yang Anda unggah.</li>
                </ul>
                <p className="mt-1.5">
                  Pelapor bertanggung jawab atas kebenaran isi laporannya. Laporan palsu dapat berakibat hukum sesuai peraturan yang berlaku. Kami dapat menolak atau menghapus laporan yang melanggar ketentuan ini.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  5. Yang Tidak Boleh Dicantumkan
                </div>
                <p>
                  Jangan mencantumkan nama lengkap anak, NISN, alamat rumah, wajah anak yang dapat dikenali, NIK, nomor rekening pribadi, atau data pribadi lain yang tidak berkaitan dengan pungutan. Hindari juga detail yang secara tidak langsung dapat mengungkap identitas Anda. Ujaran kebencian, ancaman, SARA, dan konten asusila tidak diterima.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  6. Anonimitas
                </div>
                <p>
                  DARADIK tidak meminta akun, nama, nomor HP, email, atau NIK untuk mengirim laporan. Satu-satunya penanda laporan Anda adalah kode tiket.
                </p>
                <p className="mt-1.5">
                  Perlu diketahui, anonimitas juga bergantung pada isi laporan Anda. Detail yang sangat khusus dapat membuat pihak sekolah menebak siapa pelapornya.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  7. Bukti Pendukung
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Maksimal 5 gambar per laporan (foto atau tangkapan layar).</li>
                  <li>Gambar dikompresi ulang di perangkat Anda sebelum dikirim. Proses ini menghapus metadata seperti lokasi GPS, tipe kamera, dan waktu pengambilan foto.</li>
                  <li>Kami tidak menyunting isi gambar. Tutup sendiri nama, nomor telepon, atau data pribadi lain yang tampak di tangkapan layar.</li>
                </ul>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  8. Data yang Kami Proses
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Isi laporan: sekolah yang dilaporkan, jenis pungutan, peran pihak yang meminta, dan catatan tambahan.</li>
                  <li>Gambar bukti yang Anda unggah, setelah metadata dihapus.</li>
                  <li>Kode tiket yang dibuat otomatis untuk pelacakan.</li>
                  <li>Pesan balasan yang Anda tulis di halaman pelacakan.</li>
                  <li>Cookie dan penyimpanan lokal anti-spam (lihat bagian 9).</li>
                  <li>Log teknis standar dari layanan hosting dan basis data, seperti alamat IP, yang dapat tercatat otomatis untuk keamanan dan pemeliharaan sistem. Kami tidak menggunakannya untuk mengidentifikasi pelapor.</li>
                </ul>
                <p className="mt-1.5 font-semibold text-[#1E293B]">
                  Kami tidak menjual atau membagikan data Anda untuk tujuan komersial.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  9. Cookie dan Pembatasan Anti-Spam
                </div>
                <p>
                  Untuk mencegah spam dan bot, DARADIK menyimpan cookie dan penyimpanan lokal di perangkat Anda yang mencatat tanggal dan jumlah laporan yang sudah dikirim hari itu. Batasnya maksimal 3 laporan per hari per perangkat. Anda perlu menyetujui cookie ini sebelum mengirim laporan. Cookie ini tidak memuat identitas Anda dan tidak digunakan untuk iklan. Formulir juga dilengkapi kode captcha.
                </p>
                <p className="mt-1.5">
                  Beberapa laporan dari orang berbeda tentang kejadian yang sama diperbolehkan dan dapat dikelompokkan sebagai satu kasus. Pengiriman berulang yang disengaja atau otomatis dapat ditandai sebagai spam dan tidak diproses.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  10. Pemindai Iuran Grup WhatsApp
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Gambar atau teks yang Anda masukkan dianalisis di perangkat Anda menggunakan OCR yang berjalan di browser dan tidak diunggah ke server DARADIK selama Anda tidak mengirimkannya sebagai laporan.</li>
                  <li>Hasil pemindaian bersifat indikatif, bukan putusan bahwa suatu pungutan melanggar hukum. OCR dapat keliru membaca angka atau teks.</li>
                  <li>Jika Anda memilih mengirim hasilnya sebagai laporan, tangkapan layar menjadi bukti laporan dan tunduk pada bagian 5 dan 7.</li>
                  <li>Tangkapan layar grup WhatsApp sering memuat nama dan nomor orang lain. Tutup data tersebut sebelum mengunggah.</li>
                  <li>Jika di masa mendatang fitur ini memakai layanan pihak ketiga yang menerima gambar Anda, kebijakan ini akan diperbarui dan Anda akan diberi tahu sebelum memakainya.</li>
                </ul>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  11. Kode Tiket dan Pelacakan
                </div>
                <p>
                  Setelah mengirim laporan, Anda menerima kode tiket unik. Simpan kode ini. Kami tidak dapat memulihkannya karena kami tidak memiliki data untuk mengenali Anda. Dengan kode itu Anda dapat melihat status laporan dan berkomunikasi dengan verifikator. Siapa pun yang memegang kode Anda dapat melihat status dan membalas pesan, jadi jangan membagikannya.
                </p>
                <p className="mt-1.5">
                  Waktu pemrosesan bergantung pada kelengkapan laporan dan kebijakan instansi terkait. Laporan yang tidak lengkap atau tidak dapat diverifikasi dapat ditutup dengan catatan.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  12. Penyimpanan dan Keamanan
                </div>
                <p>
                  Data laporan disimpan pada layanan basis data berbasis cloud dengan akses terbatas bagi petugas verifikasi yang berwenang. Laporan disimpan selama diperlukan untuk verifikasi dan tindak lanjut, kemudian dihapus atau dianonimkan. Kami berupaya melindungi data Anda, tetapi tidak ada sistem yang sepenuhnya aman dan kami tidak dapat menjamin keamanan mutlak.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  13. Publikasi
                </div>
                <p>
                  Isi laporan dan bukti tidak ditampilkan ke publik. Yang dapat ditampilkan hanya ringkasan agregat (misalnya jumlah laporan per wilayah dan jenis pungutan), tanpa identitas dan tanpa data pribadi. Nama sekolah tidak disebut dalam publikasi sebelum laporan diverifikasi.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  14. Pengungkapan atas Perintah Hukum
                </div>
                <p>
                  Kami menjaga kerahasiaan laporan. Namun, jika ada perintah pengadilan atau kewajiban hukum, kami dapat diwajibkan menyerahkan data yang kami miliki. Karena kami tidak mengumpulkan identitas Anda, data yang dapat diserahkan terbatas pada isi laporan dan data teknis yang tercatat.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  15. Data Sekolah dan Anggaran
                </div>
                <p>
                  Informasi anggaran BOSP yang ditampilkan bertujuan membantu pemahaman publik. DARADIK berupaya menyajikannya secara akurat, tetapi tidak menjamin data selalu mutakhir. Untuk keperluan resmi, rujuklah dokumen resmi sekolah dan dinas pendidikan. Perbandingan antara pungutan dan anggaran BOSP, termasuk hasil pemindai WhatsApp, hanyalah alat bantu dan bukan kesimpulan bahwa suatu sekolah bersalah.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  16. Hak Anda atas Data
                </div>
                <p>
                  Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda berhak mengakses dan meminta penghapusan data pribadi Anda. Karena laporan bersifat anonim, kami hanya dapat memproses permintaan jika Anda dapat menunjukkan kode tiket. Anda dapat menghapus cookie dan penyimpanan lokal kapan saja melalui pengaturan browser.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  17. Perubahan Kebijakan
                </div>
                <p>
                  Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu ditampilkan di halaman ini beserta tanggal pembaruannya.
                </p>
              </div>

              <div>
                <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
                  18. Kontak
                </div>
                <p>
                  Pertanyaan tentang kebijakan ini dapat disampaikan melalui kanal kontak resmi yang tersedia di situs DARADIK.
                </p>
              </div>
            </div>

            {/* Checkbox Persetujuan Bersih & Simpel Tanpa Banner Mengganggu */}
            <div className="shrink-0 pt-1">
              <label
                className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all select-none ${
                  hasScrolledToBottom
                    ? 'bg-[#FFFFFF] border-[#2E6496] ring-1 ring-[#2E6496]/20 cursor-pointer shadow-2xs'
                    : 'bg-[#FAF8F5] border-[#E4E0D8] opacity-75 cursor-not-allowed'
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
                      hasScrolledToBottom ? 'font-bold text-[#1E293B]' : 'text-[#64748B]'
                    }
                  >
                    Saya telah membaca dan menyetujui seluruh isi Kebijakan Pelaporan dan Privasi DARADIK di atas.
                  </span>
                  {!hasScrolledToBottom && (
                    <div className="text-[11px] text-[#8597A8]">
                      (Gulir isi kebijakan hingga bagian paling akhir untuk mencentang)
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E4E0D8] shrink-0">
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#C9DFDC] text-xs font-bold text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5] cursor-pointer transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!isPolicyAgreed}
                onClick={handleFinalConfirmSubmit}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isPolicyAgreed
                    ? 'bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] shadow-sm cursor-pointer active:translate-y-[1px]'
                    : 'bg-[#E4E0D8] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                <span>Lanjutkan & Kirim Laporan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
