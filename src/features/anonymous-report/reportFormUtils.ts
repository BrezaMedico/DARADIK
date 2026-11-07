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

export interface MathChallengeState {
  textToDraw: string;
  salt: string;
  timestamp: number;
  token: string;
}

export interface ChosenSchoolTarget {
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

export const COOKIE_CONSENT_KEY = 'daradik_cookie_consent';
export const REPORT_TRACK_KEY = 'daradik_daily_reports';
export const TRACKED_TICKETS_COOKIE_KEY = 'daradik_tracked_tickets';
export const MAX_DAILY_REPORTS = 3;

export const ENABLE_DAILY_LIMIT = false;

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days: number = 30) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyReportData(): { date: string; count: number } {
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
  } catch {}
  return { date: getTodayString(), count: 0 };
}

export function recordReportSubmissionQuota() {
  const current = getDailyReportData();
  const nextData = { date: getTodayString(), count: current.count + 1 };
  const str = JSON.stringify(nextData);
  setCookie(REPORT_TRACK_KEY, str, 2);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REPORT_TRACK_KEY, str);
  }
}

// Stores only a local ticket reference; official status is always fetched from Supabase.
export function saveTicketBookmarkToBrowserCookie(bookmark: {
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
  } catch {}
}

export function hashCaptchaAnswer(ans: number | string, salt: string, timestamp: number): string {
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

export function generateMathChallenge(): MathChallengeState {
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

export function renderMathCaptchaToCanvas(canvas: HTMLCanvasElement, text: string) {
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

// Re-encodes images on a canvas to strip EXIF and GPS metadata before upload.
export function compressImageFile(file: File): Promise<UploadedFileItem> {
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
