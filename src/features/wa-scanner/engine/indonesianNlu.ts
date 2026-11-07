import type { EnrichedMessageDoc, EnrichedToken } from './internalTypes';

export const WA_MULTIWORD_SLANG_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bplg\s+lmb?a?t\b/gi, 'paling lambat'],
  [/\bslmb?t2?nya\b/gi, 'selambat-lambatnya'],
  [/\bbts\s+(?:akhr|wktu?|waktu)\b/gi, 'batas akhir'],
  [/\bjth\s+tmpo\b/gi, 'jatuh tempo'],
  [/\b(?:tdk|gk|ga|gak|tak|ndak)\s+(?:bsa?|blh|boleh|bisa)\b/gi, 'tidak boleh'],
  [/\b(?:blm|blum)\s+lns\b/gi, 'belum lunas'],
  [/\b(?:hrp|mhn|mhon)\s+sgr\b/gi, 'harap segera'],
  [/\bu\s*\/\s*(?=siswa|murid|anak|pembelian|pengadaan|uang|biaya|iuran|dana|beli|bayar)/gi, 'untuk '],
  [/\bs\s*\/\s*d\b/gi, 'sampai dengan'],
  [/\bkps\s+angn\b/gi, 'kipas angin'],
  [/\bkpas\s+angn\b/gi, 'kipas angin'],
  [/\bkmr\s+mnd?i\b/gi, 'kamar mandi'],
  [/\bdftr\s+ulng\b/gi, 'daftar ulang'],
  [/\bdaftr\s+ulng\b/gi, 'daftar ulang'],
  [/\bbku\s+pkt\b/gi, 'buku paket'],
  [/\bbk\s+pkt\b/gi, 'buku paket'],
  [/\bstdy?\s*tour\b/gi, 'study tour'],
  [/\bstudi\s*tur\b/gi, 'study tour'],
  [/\bkarya\s*wisata\b/gi, 'study tour'],
  [/\bin\s+fo[ck]us\b/gi, 'infocus'],
  [/\bsinar\s+dunia\b/gi, 'sidu kertas hvs'],
];

export const WA_TOKEN_SLANG_MAP: Record<string, string> = {
  ass: 'assalamualaikum',
  aslm: 'assalamualaikum',
  asslmkm: 'assalamualaikum',
  asswrwb: 'assalamualaikum',
  bpk: 'bapak',
  bp: 'bapak',
  ortu: 'wali murid',
  orangtua: 'wali murid',
  walmur: 'wali murid',
  walsis: 'wali murid',
  walkel: 'wali kelas',
  walas: 'wali kelas',
  kepsek: 'kepala sekolah',
  kamad: 'kepala sekolah',
  bend: 'bendahara',
  bndhra: 'bendahara',
  bndahara: 'bendahara',
  komte: 'komite',
  pgybn: 'paguyuban',
  paguyubn: 'paguyuban',
  koprasi: 'koperasi',
  kops: 'koperasi',
  sklh: 'sekolah',
  skolah: 'sekolah',
  seklh: 'sekolah',
  negri: 'negeri',
  swsta: 'swasta',
  kls: 'kelas',
  mrd: 'murid',
  sswa: 'siswa',
  ank: 'anak',

  yg: 'yang',
  utk: 'untuk',
  untk: 'untuk',
  dgn: 'dengan',
  dg: 'dengan',
  dr: 'dari',
  pd: 'pada',
  kpd: 'kepada',
  krn: 'karena',
  karna: 'karena',
  tdk: 'tidak',
  tak: 'tidak',
  gak: 'tidak',
  ga: 'tidak',
  gk: 'tidak',
  ndak: 'tidak',
  enggak: 'tidak',
  blm: 'belum',
  blum: 'belum',
  sdh: 'sudah',
  udh: 'sudah',
  udah: 'sudah',
  bs: 'bisa',
  bsa: 'bisa',
  blh: 'boleh',
  dlm: 'dalam',
  sbg: 'sebagai',
  tsb: 'tersebut',
  dll: 'dan lain',
  dsb: 'dan sebagainya',

  wjb: 'wajib',
  wajb: 'wajib',
  wjib: 'wajib',
  dwajibkan: 'diwajibkan',
  diwjbkan: 'diwajibkan',
  hrs: 'harus',
  hrus: 'harus',
  byr: 'bayar',
  byar: 'bayar',
  pmbayaran: 'pembayaran',
  pembyrn: 'pembayaran',
  pbyrn: 'pembayaran',
  lns: 'lunas',
  lnsi: 'lunasi',
  pelunasn: 'pelunasan',
  plg: 'paling',
  lmbt: 'lambat',
  lmbat: 'lambat',
  maks: 'maksimal',
  max: 'maksimal',
  min: 'minimal',
  tgl: 'tanggal',
  bln: 'bulan',
  thn: 'tahun',
  smt: 'semester',
  smstr: 'semester',
  tf: 'transfer',
  trf: 'transfer',
  transfr: 'transfer',
  trnsfer: 'transfer',
  rek: 'rekening',
  rekn: 'rekening',
  norek: 'rekening',
  tgghn: 'tagihan',
  tagihn: 'tagihan',
  tunggakn: 'tunggakan',
  tnggakan: 'tunggakan',
  dnda: 'denda',
  snksi: 'sanksi',
  ditahn: 'ditahan',
  dtahan: 'ditahan',
  dthn: 'ditahan',
  sgr: 'segera',
  sgra: 'segera',
  mhn: 'mohon',
  hrp: 'harap',
  iurn: 'iuran',
  iyuran: 'iuran',
  yuran: 'iuran',
  smbngn: 'sumbangan',
  sumbngn: 'sumbangan',
  smbgn: 'sumbangan',
  pngutan: 'pungutan',
  pungutn: 'pungutan',
  pungli: 'pungutan liar',
  ptungan: 'patungan',
  patungn: 'patungan',
  skrela: 'sukarela',
  sukrela: 'sukarela',
  sukrla: 'sukarela',
  seiklasnya: 'seikhlasnya',
  seikhlsnya: 'seikhlasnya',
  ikhls: 'seikhlasnya',
  sbsr: 'sebesar',
  sebsr: 'sebesar',

  kps: 'kipas',
  kpas: 'kipas',
  angn: 'angin',
  vntlasi: 'ventilasi',
  pryektor: 'proyektor',
  proyektr: 'proyektor',
  prjktr: 'proyektor',
  proyktor: 'proyektor',
  poyektor: 'proyektor',
  infokus: 'infocus',
  inpokus: 'infocus',
  komp: 'komputer',
  komptr: 'komputer',
  lptp: 'laptop',
  leptop: 'laptop',
  prnter: 'printer',
  bku: 'buku',
  pkt: 'paket',
  mdul: 'modul',
  perpus: 'perpustakaan',
  perpustkaan: 'perpustakaan',
  krts: 'kertas',
  krtas: 'kertas',
  fc: 'fotokopi',
  fcopy: 'fotokopi',
  fotocopy: 'fotokopi',
  potokopi: 'fotokopi',
  ptkopi: 'fotokopi',
  wstfl: 'wastafel',
  wastapel: 'wastafel',
  wastfel: 'wastafel',
  kran: 'keran',
  klset: 'kloset',
  snitasi: 'sanitasi',
  kbrsihan: 'kebersihan',
  mja: 'meja',
  krsi: 'kursi',
  bngku: 'bangku',
  mebl: 'meubelair',
  mebeler: 'meubelair',
  meubeler: 'meubelair',
  inet: 'internet',
  wifii: 'wifi',
  jrngan: 'jaringan',
  kouta: 'kuota',
  qouta: 'kuota',
  ujn: 'ujian',
  ujiann: 'ujian',
  ulngn: 'ulangan',
  rpr: 'rapor',
  raport: 'rapor',
  rapot: 'rapor',
  erapor: 'rapor',
  ijzh: 'ijazah',
  ijasah: 'ijazah',
  ijash: 'ijazah',
  krtu: 'kartu',
  dftr: 'daftar',
  daftr: 'daftar',
  ulng: 'ulang',
  gdg: 'gedung',
  gdung: 'gedung',
  bngunan: 'bangunan',
  pngkal: 'pangkal',
  srgm: 'seragam',
  sragam: 'seragam',
  seragm: 'seragam',
  olga: 'olahraga',
  olhrga: 'olahraga',
  ekskul: 'ekstrakurikuler',
  eskul: 'ekstrakurikuler',
  prmuka: 'pramuka',
  lstrk: 'listrik',
  lstrik: 'listrik',
  studytour: 'study tour',
  studitur: 'study tour',
  karyawisata: 'study tour',
  prpisahan: 'perpisahan',
  wsuda: 'wisuda',
  infak: 'infaq',
};

// Used to segment run-on OCR tokens and rejoin fragmented syllables into valid domain words.
export const BOSP_SEGMENTATION_LEXICON = new Set<string>([
  'iuran', 'sumbangan', 'pungutan', 'patungan', 'dana', 'uang', 'biaya', 'tarif', 'tagihan',
  'tunggakan', 'cicilan', 'bayar', 'pembayaran', 'melunasi', 'pelunasan', 'lunas', 'wajib',
  'diwajibkan', 'harus', 'mohon', 'dimohon', 'harap', 'segera', 'paling', 'lambat', 'batas',
  'akhir', 'waktu', 'jatuh', 'tempo', 'sebelum', 'maksimal', 'minimal', 'ditetapkan', 'sebesar',
  'transfer', 'rekening', 'bendahara', 'komite', 'paguyuban', 'koperasi', 'wali', 'murid',
  'kelas', 'sekolah', 'siswa', 'anak', 'orang', 'tua', 'per', 'bulan', 'semester', 'tahun',
  'denda', 'sanksi', 'ditahan', 'kartu', 'peserta', 'ujian', 'ulangan', 'asesmen', 'anbk',
  'ukk', 'rapor', 'ijazah', 'sampul', 'map', 'cetak', 'fotokopi', 'penggandaan', 'soal',
  'kertas', 'hvs', 'sidu', 'atk', 'alat', 'tulis', 'spidol', 'tinta', 'printer', 'buku',
  'paket', 'teks', 'pelajaran', 'modul', 'ajar', 'lks', 'lembar', 'kerja', 'perpustakaan',
  'literasi', 'toilet', 'kamar', 'mandi', 'wastafel', 'sanitasi', 'keran', 'air', 'bersih',
  'sabun', 'kebersihan', 'pompa', 'toren', 'pipa', 'meja', 'kursi', 'bangku', 'belajar',
  'meubelair', 'mebel', 'lemari', 'papan', 'kipas', 'angin', 'dinding', 'ventilasi', 'pendingin',
  'ruangan', 'exhaust', 'lampu', 'listrik', 'token', 'internet', 'wifi', 'kuota', 'router',
  'modem', 'jaringan', 'kabel', 'proyektor', 'projector', 'infocus', 'layar', 'multimedia',
  'komputer', 'laptop', 'speaker', 'ppdb', 'spmb', 'daftar', 'ulang', 'pendaftaran', 'formulir',
  'mpls', 'gedung', 'bangunan', 'pangkal', 'pembangunan', 'renovasi', 'cat', 'spp', 'seragam',
  'batik', 'olahraga', 'pramuka', 'atribut', 'ekstrakurikuler', 'praktikum', 'honor', 'gaji',
  'guru', 'study', 'tour', 'wisata', 'piknik', 'rekreasi', 'perpisahan', 'wisuda', 'pentas',
  'seni', 'kaos', 'jaket', 'angkatan', 'kas', 'sukarela', 'seikhlasnya', 'tidak', 'boleh',
  'ikut', 'ambil', 'masuk', 'tanpa', 'paksaan', 'mengikat',
]);

// Prevents valid everyday Indonesian words (e.g. "ruang", "kelas", "buka") from fuzzy-matching short BOSP terms ("uang", "kas", "buku").
export const ORTHOGRAPHIC_GUARD_WORDS = new Set<string>([
  'ruang', 'ruangan', 'siang', 'orang', 'kurang', 'pulang', 'barang', 'jarang', 'bidang',
  'tukang', 'lubang', 'cabang', 'senang', 'tenang', 'menang', 'datang', 'pasang', 'pisang',
  'kelas', 'jelas', 'malas', 'balas', 'gelas', 'beras', 'keras', 'lepas', 'batas', 'atas',
  'buka', 'baru', 'batu', 'biru', 'buru', 'bulu', 'bahu', 'baku', 'beku', 'suku', 'kuku', 'duku',
  'saja', 'baja', 'raja', 'maju', 'meja', 'mata', 'masa', 'mana', 'maka',
  'akhir', 'hadir', 'cair', 'amir', 'alur', 'atur', 'ajar',
  'chat', 'cepat', 'catat', 'cacat', 'camat', 'adat', 'alat', 'amat', 'ayat', 'obat',
  'surat', 'sarapan', 'syarat', 'sarat', 'barat', 'darat',
  'kami', 'kamu', 'kala', 'kali', 'kaki', 'kaca', 'kata', 'kaya', 'kayu',
  'pagi', 'lagi', 'bagi', 'bayi', 'baca', 'bawa', 'bisa', 'biasa',
  'hari', 'mari', 'cari', 'dari', 'diri', 'kiri', 'sari', 'tari',
  'tahu', 'tahun', 'tangan', 'taman', 'teman', 'tuhan',
]);

export const INDONESIAN_STOP_FILLERS = new Set<string>([
  'yang', 'untuk', 'buat', 'guna', 'dalam', 'pada', 'kepada', 'dari', 'oleh', 'dengan',
  'dan', 'atau', 'serta', 'ini', 'itu', 'tersebut', 'para', 'di', 'ke', 'se', 'nya',
  'pun', 'lah', 'kah', 'ya', 'yah', 'bu', 'pak', 'bapak', 'ibu',
]);

export function stripIndonesianMorphology(word: string): string {
  if (word.length < 4) return word;
  let w = word.toLowerCase();

  w = w.replace(/(lah|kah|tah|pun)$/, '');
  if (w.length >= 5) {
    w = w.replace(/nya$/, '');
  }

  if (w.length >= 6 && w.endsWith('kan')) {
    w = w.slice(0, -3);
  } else if (w.length >= 5 && w.endsWith('an') && !BOSP_SEGMENTATION_LEXICON.has(w)) {
    w = w.slice(0, -2);
  } else if (w.length >= 5 && w.endsWith('i') && /^(me|pe|di|ber|ter)/.test(w)) {
    w = w.slice(0, -1);
  }

  if (w.length < 4) return word;

  // Restore elided root initials after nasal prefix stripping (mem->p, men->t, meng->k, meny->s).
  if (/^(di|ke|se)/.test(w) && w.length >= 5) {
    const cand = w.slice(2);
    if (cand.length >= 3) return cand;
  }
  if (/^(ber|ter|per)/.test(w) && w.length >= 6) {
    const cand = w.slice(3);
    if (cand.length >= 3) return cand;
  }
  if (/^(meny|peny)/.test(w) && w.length >= 6) {
    const rest = w.slice(4);
    const withS = 's' + rest;
    return BOSP_SEGMENTATION_LEXICON.has(withS) ? withS : withS;
  }
  if (/^(meng|peng)/.test(w) && w.length >= 6) {
    const rest = w.slice(4);
    if (/^[aiueo]/.test(rest)) {
      const withK = 'k' + rest;
      if (BOSP_SEGMENTATION_LEXICON.has(withK)) return withK;
      return rest;
    }
    return rest;
  }
  if (/^(mem|pem)/.test(w) && w.length >= 6) {
    const rest = w.slice(3);
    if (/^[aiueo]/.test(rest)) {
      const withP = 'p' + rest;
      if (BOSP_SEGMENTATION_LEXICON.has(withP)) return withP;
    }
    return rest;
  }
  if (/^(men|pen)/.test(w) && w.length >= 6) {
    const rest = w.slice(3);
    if (/^[aiueo]/.test(rest)) {
      const withT = 't' + rest;
      if (BOSP_SEGMENTATION_LEXICON.has(withT)) return withT;
    }
    return rest;
  }
  if (/^(me|pe)/.test(w) && w.length >= 5) {
    const rest = w.slice(2);
    if (rest.length >= 3) return rest;
  }

  return w;
}

export function toIndonesianPhoneticCode(word: string): string {
  if (!word) return '';
  let p = word
    .toLowerCase()
    .replace(/sy|sh/g, 's')
    .replace(/kh/g, 'k')
    .replace(/dj/g, 'j')
    .replace(/tj/g, 'c')
    .replace(/oe/g, 'u')
    .replace(/ph/g, 'p')
    .replace(/[fv]/g, 'p')
    .replace(/q/g, 'k')
    .replace(/z/g, 'j')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1');
  if (p.length >= 5) {
    // Strip interior vowels so vowel-dropped chat abbreviations share a consonant skeleton.
    p = p[0] + p.slice(1).replace(/[aiueo]/g, '');
  }
  return p;
}

export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (a === b) return 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = best;
    }
  }
  return dp[m][n];
}

export function charBigramDice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bgA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bgA.set(bg, (bgA.get(bg) || 0) + 1);
  }
  let inter = 0;
  for (let j = 0; j < b.length - 1; j++) {
    const bg = b.slice(j, j + 2);
    const c = bgA.get(bg) || 0;
    if (c > 0) {
      inter++;
      bgA.set(bg, c - 1);
    }
  }
  return (2 * inter) / (a.length - 1 + (b.length - 1));
}

export function repairOcrHomoglyphsAndElongation(rawToken: string): string {
  let t = rawToken.toLowerCase().trim();
  if (!t) return '';

  if (/^@?(?:rp\.?|idr)?\d[\d.,]*(?:rb|ribu|k|jt|juta)?$/i.test(t)) {
    return t;
  }

  const alphaCount = (t.match(/[a-z]/g) || []).length;
  const digitCount = (t.match(/[0-9]/g) || []).length;

  // Decode leetspeak or OCR digit substitutions only when alphabetic characters dominate.
  if (alphaCount >= 2 && digitCount > 0 && alphaCount >= digitCount) {
    t = t
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/6/g, 'g')
      .replace(/7/g, 't')
      .replace(/8/g, 'b')
      .replace(/@/g, 'a');
  }

  t = t.replace(/([a-z])\1{2,}/g, '$1');

  if (!BOSP_SEGMENTATION_LEXICON.has(t) && /([a-z])\1/.test(t)) {
    const deduped = t.replace(/([a-z])\1+/g, '$1');
    if (BOSP_SEGMENTATION_LEXICON.has(deduped) || WA_TOKEN_SLANG_MAP[deduped]) {
      t = deduped;
    }
  }

  // Repair common OCR multi-letter glyph collisions (vv->w, rn->m, cl->d) when the result matches the lexicon.
  if (t.includes('vv')) {
    const cand = t.replace(/vv/g, 'w');
    if (BOSP_SEGMENTATION_LEXICON.has(cand) || WA_TOKEN_SLANG_MAP[cand]) return cand;
    t = cand;
  }
  if (t.includes('rn') && !BOSP_SEGMENTATION_LEXICON.has(t)) {
    const cand = t.replace(/rn/g, 'm');
    if (BOSP_SEGMENTATION_LEXICON.has(cand) || BOSP_SEGMENTATION_LEXICON.has(stripIndonesianMorphology(cand))) {
      return cand;
    }
  }
  if (t.includes('cl') && !BOSP_SEGMENTATION_LEXICON.has(t)) {
    const cand = t.replace(/cl/g, 'd');
    if (BOSP_SEGMENTATION_LEXICON.has(cand) || BOSP_SEGMENTATION_LEXICON.has(stripIndonesianMorphology(cand))) {
      return cand;
    }
  }

  return t;
}

export function splitCollidingCompoundToken(token: string): string[] {
  if (
    token.length < 7 ||
    !/^[a-z]+$/.test(token) ||
    BOSP_SEGMENTATION_LEXICON.has(token) ||
    ORTHOGRAPHIC_GUARD_WORDS.has(token) ||
    WA_TOKEN_SLANG_MAP[token] ||
    BOSP_SEGMENTATION_LEXICON.has(stripIndonesianMorphology(token))
  ) {
    return [token];
  }

  const n = token.length;
  const bestScore = new Float64Array(n + 1).fill(-1e9);
  const backPtr = new Int32Array(n + 1).fill(-1);
  bestScore[0] = 0;

  for (let i = 0; i < n; i++) {
    if (bestScore[i] < -1e8) continue;
    for (let j = i + 3; j <= Math.min(n, i + 15); j++) {
      const sub = token.slice(i, j);
      const mapped = WA_TOKEN_SLANG_MAP[sub];
      if (BOSP_SEGMENTATION_LEXICON.has(sub) || (mapped && !mapped.includes(' ') && BOSP_SEGMENTATION_LEXICON.has(mapped))) {
        // Quadratic length weight favors longer dictionary words over short accidental splits.
        const wordScore = sub.length * sub.length;
        if (bestScore[i] + wordScore > bestScore[j]) {
          bestScore[j] = bestScore[i] + wordScore;
          backPtr[j] = i;
        }
      }
    }
  }

  if (bestScore[n] > 0) {
    const parts: string[] = [];
    let cur = n;
    while (cur > 0 && backPtr[cur] >= 0) {
      parts.push(token.slice(backPtr[cur], cur));
      cur = backPtr[cur];
    }
    parts.reverse();
    if (parts.length >= 2) {
      return parts;
    }
  }

  return [token];
}

export function buildEnrichedMessageDoc(rawText: string): EnrichedMessageDoc {
  // Preserve both primary and alternate readings from uncertain OCR brackets so downstream NLU can match either.
  const unwrapped = (rawText || '')
    .replace(/\[tidak terbaca[^\]]*\]/gi, ' ')
    .replace(/\[teks tidak pasti:\s*([^/\]]+?)(?:\s*\/\s*([^\]]+))?\]/gi, (_m, a, b) =>
      b ? `${a} ${b}` : `${a}`
    )
    .replace(/pesan dan panggilan terenkripsi secara end-to-end\.?/gi, ' ')
    .replace(/\bketik pesan\b/gi, ' ');

  let text = unwrapped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  for (const [pattern, replacement] of WA_MULTIWORD_SLANG_REPLACEMENTS) {
    text = text.replace(pattern, ` ${replacement} `);
  }

  text = text
    .replace(/@\s*(?=(?:rp\.?\s*)?\d)/gi, ' per siswa ')
    .replace(/\/(siswa|murid|anak|orang|bln|bulan|smt|semester|tahun)\b/gi, ' per $1 ')
    .replace(/\b(rp\.?|idr)(?=\d)/gi, '$1 ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawSplits = text ? text.split(' ') : [];

  const repairedTokens: string[] = [];
  for (const rawTok of rawSplits) {
    const fixed = repairOcrHomoglyphsAndElongation(rawTok);
    if (!fixed) continue;
    const segments = splitCollidingCompoundToken(fixed);
    for (const seg of segments) {
      const mapped = WA_TOKEN_SLANG_MAP[seg];
      if (mapped) {
        repairedTokens.push(...mapped.split(' '));
      } else {
        repairedTokens.push(seg);
      }
    }
  }

  // Rejoin adjacent short fragments split by OCR kerning gaps (e.g. ["pro", "yek", "tor"] -> "proyektor").
  const rechained: string[] = [];
  let idx = 0;
  while (idx < repairedTokens.length) {
    let mergedWord: string | null = null;
    let skipCount = 1;

    for (const span of [3, 2]) {
      if (idx + span > repairedTokens.length) continue;
      const slice = repairedTokens.slice(idx, idx + span);
      // Skip merging if every fragment is already a standalone dictionary word like ["uang", "kas"].
      const allFragmentsShort = slice.every((s) => s.length <= 5 && /^[a-z]+$/.test(s));
      const allAlreadyValidWords = slice.every(
        (s) => BOSP_SEGMENTATION_LEXICON.has(s) || ORTHOGRAPHIC_GUARD_WORDS.has(s)
      );
      if (!allFragmentsShort || allAlreadyValidWords) continue;

      const joined = slice.join('');
      if (joined.length >= 5) {
        if (BOSP_SEGMENTATION_LEXICON.has(joined)) {
          mergedWord = joined;
          skipCount = span;
          break;
        }
        const mappedJoin = WA_TOKEN_SLANG_MAP[joined];
        if (mappedJoin) {
          mergedWord = mappedJoin;
          skipCount = span;
          break;
        }
        for (const lexWord of BOSP_SEGMENTATION_LEXICON) {
          if (lexWord.length >= 6 && Math.abs(lexWord.length - joined.length) <= 1) {
            if (damerauLevenshtein(joined, lexWord) <= 1) {
              mergedWord = lexWord;
              skipCount = span;
              break;
            }
          }
        }
        if (mergedWord) break;
      }
    }

    if (mergedWord) {
      rechained.push(...mergedWord.split(' '));
      idx += skipCount;
    } else {
      rechained.push(repairedTokens[idx]);
      idx += 1;
    }
  }

  const enrichedTokens: EnrichedToken[] = rechained.map((tok) => {
    const stem = stripIndonesianMorphology(tok);
    const phonetic = toIndonesianPhoneticCode(tok);
    const isKnownDistinct =
      ORTHOGRAPHIC_GUARD_WORDS.has(tok) || BOSP_SEGMENTATION_LEXICON.has(tok);
    return { raw: tok, stem, phonetic, isKnownDistinct };
  });

  const contentTokens = enrichedTokens.filter(
    (t) => !INDONESIAN_STOP_FILLERS.has(t.raw) && t.raw.length >= 2
  );

  return {
    originalText: rawText,
    normalizedText: rechained.join(' '),
    tokens: enrichedTokens,
    contentTokens,
  };
}

export function computeSmartWordSimilarity(docTok: EnrichedToken, targetWord: string): number {
  const tw = targetWord.toLowerCase().trim();
  if (!tw) return 0;
  if (docTok.raw === tw) return 1.0;

  const targetStem = stripIndonesianMorphology(tw);
  if (docTok.stem === tw || docTok.raw === targetStem || (targetStem.length >= 4 && docTok.stem === targetStem)) {
    return 0.96;
  }

  // Short acronyms (<= 3 chars like "lks", "atk", "spp") require an exact match to avoid false positives.
  if (tw.length <= 3 || docTok.raw.length <= 2) {
    return 0;
  }

  // Never fuzzy-mutate a recognized Indonesian word into a different word (e.g. "ruang" vs "uang").
  if (docTok.isKnownDistinct && docTok.stem !== targetStem) {
    return 0;
  }

  const targetPhonetic = toIndonesianPhoneticCode(tw);
  if (
    targetPhonetic.length >= 3 &&
    docTok.phonetic === targetPhonetic &&
    Math.abs(docTok.raw.length - tw.length) <= 2
  ) {
    return 0.91;
  }

  const maxLen = Math.max(docTok.raw.length, tw.length);
  if (Math.abs(docTok.raw.length - tw.length) > 2) return 0;

  if (tw.length <= 5 && docTok.raw[0] !== tw[0] && docTok.raw.slice(-2) !== tw.slice(-2)) {
    return 0;
  }

  const dlDist = damerauLevenshtein(docTok.raw, tw);
  const dlSim = 1 - dlDist / maxLen;
  const diceSim = charBigramDice(docTok.raw, tw);
  const combined = dlSim * 0.68 + diceSim * 0.32;

  const minThreshold = tw.length <= 5 ? 0.79 : 0.74;
  return combined >= minThreshold ? combined : 0;
}

export function matchPhraseSmart(
  doc: EnrichedMessageDoc,
  phrase: string
): { matched: boolean; score: number; matchedSurface: string } {
  const cleanPhrase = phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleanPhrase) return { matched: false, score: 0, matchedSurface: '' };

  const targetWords = cleanPhrase.split(' ').filter(Boolean);
  if (targetWords.length === 0) return { matched: false, score: 0, matchedSurface: '' };

  if (targetWords.length === 1) {
    const tw = targetWords[0];
    let best = 0;
    let bestRaw = '';
    for (const tok of doc.tokens) {
      const sim = computeSmartWordSimilarity(tok, tw);
      if (sim > best) {
        best = sim;
        bestRaw = tok.raw;
        if (sim >= 0.99) break;
      }
    }
    return {
      matched: best >= (tw.length <= 3 ? 0.99 : tw.length <= 5 ? 0.79 : 0.74),
      score: best,
      matchedSurface: bestRaw || cleanPhrase,
    };
  }

  const k = targetWords.length;
  let bestContig = 0;
  let bestSurface = '';
  for (let i = 0; i + k <= doc.tokens.length; i++) {
    let sum = 0;
    let allOk = true;
    for (let j = 0; j < k; j++) {
      const sim = computeSmartWordSimilarity(doc.tokens[i + j], targetWords[j]);
      const req = targetWords[j].length <= 3 ? 0.96 : 0.74;
      if (sim < req) {
        allOk = false;
        break;
      }
      sum += sim;
    }
    if (allOk) {
      const avg = sum / k;
      if (avg > bestContig) {
        bestContig = avg;
        bestSurface = doc.tokens
          .slice(i, i + k)
          .map((t) => t.raw)
          .join(' ');
      }
    }
  }
  if (bestContig >= 0.78) {
    return { matched: true, score: bestContig, matchedSurface: bestSurface };
  }

  // Match content words across a slightly wider window when filler words intervene (e.g. "kipas buat ruang angin").
  const targetContent = targetWords.filter((w) => !INDONESIAN_STOP_FILLERS.has(w));
  if (targetContent.length >= 2 && doc.contentTokens.length >= targetContent.length) {
    const winSize = targetContent.length + 2;
    let bestChain = 0;
    for (let i = 0; i < doc.contentTokens.length; i++) {
      const winEnd = Math.min(doc.contentTokens.length, i + winSize);
      const windowSlice = doc.contentTokens.slice(i, winEnd);
      const usedIdx = new Set<number>();
      let sum = 0;
      let ok = true;

      for (const tw of targetContent) {
        let localBest = 0;
        let localIdx = -1;
        for (let wIdx = 0; wIdx < windowSlice.length; wIdx++) {
          if (usedIdx.has(wIdx)) continue;
          const sim = computeSmartWordSimilarity(windowSlice[wIdx], tw);
          if (sim > localBest) {
            localBest = sim;
            localIdx = wIdx;
          }
        }
        const req = tw.length <= 3 ? 0.96 : 0.78;
        if (localBest < req || localIdx < 0) {
          ok = false;
          break;
        }
        usedIdx.add(localIdx);
        sum += localBest;
      }

      if (ok) {
        const chainScore = (sum / targetContent.length) * 0.93;
        if (chainScore > bestChain) {
          bestChain = chainScore;
        }
      }
    }

    if (bestChain >= 0.76) {
      return { matched: true, score: bestChain, matchedSurface: cleanPhrase };
    }
  }

  return { matched: false, score: 0, matchedSurface: '' };
}

export function parseIndonesianSpokenAmount(normalizedText: string): number | null {
  const unitMap: Record<string, number> = {
    satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5,
    enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
    sepuluh: 10, sebelas: 11, seratus: 100, seribu: 1000, sejuta: 1000000,
    setengah: 0.5,
  };
  const multWords = new Set(['belas', 'puluh', 'ratus', 'ribu', 'juta', 'rupiah', 'perak']);

  const words = normalizedText.split(' ');
  let bestVal: number | null = null;

  for (let i = 0; i < words.length; i++) {
    if (!(words[i] in unitMap)) continue;
    let j = i;
    const seq: string[] = [];
    while (j < words.length && (words[j] in unitMap || multWords.has(words[j]))) {
      seq.push(words[j]);
      j++;
    }
    if (!seq.includes('ribu') && !seq.includes('juta') && !seq.includes('seribu') && !seq.includes('sejuta')) {
      continue;
    }

    let total = 0;
    let subGroup = 0;
    let digit = 0;
    for (const w of seq) {
      if (w === 'seribu') {
        total += 1000;
      } else if (w === 'sejuta') {
        total += 1000000;
      } else if (w === 'seratus') {
        subGroup += 100;
      } else if (w === 'sepuluh') {
        subGroup += 10;
      } else if (w === 'sebelas') {
        subGroup += 11;
      } else if (w in unitMap) {
        digit += unitMap[w];
      } else if (w === 'belas') {
        subGroup += 10 + (digit || 1);
        digit = 0;
      } else if (w === 'puluh') {
        subGroup += (digit || 1) * 10;
        digit = 0;
      } else if (w === 'ratus') {
        subGroup += (digit || 1) * 100;
        digit = 0;
      } else if (w === 'ribu') {
        total += ((subGroup + digit) || 1) * 1000;
        subGroup = 0;
        digit = 0;
      } else if (w === 'juta') {
        total += ((subGroup + digit) || 1) * 1000000;
        subGroup = 0;
        digit = 0;
      }
    }
    total += subGroup + digit;
    if (total >= 2000 && total <= 50000000) {
      bestVal = Math.round(total);
      break;
    }
    i = j - 1;
  }

  return bestVal;
}

export function extractMonetaryAmounts(text: string, normalizedText?: string): number | null {
  // Mask bank accounts, phone numbers, dates, and clock times so they are never parsed as Rupiah amounts.
  const scrubbed = (text || '')
    .replace(/(?:no\.?\s*rek(?:ening)?|rek(?:ening)?|bca|bri|bni|mandiri|bsi|cimb|danamon|permata|bank|va)\s*[:.-]?\s*[\d\s.-]{7,22}/gi, ' [REK] ')
    .replace(/(?:\+62|62|08)[\d\s-]{8,15}/g, ' [HP] ')
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, ' [DATE] ')
    .replace(/\b202[0-9]\s*\/\s*202[0-9]\b/g, ' [TA] ')
    .replace(/\b(?:pukul|jam|pkl\.?)\s*\d{1,2}[:.]\d{2}\b/gi, ' [TIME] ')
    .replace(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:wib|wita|wit)\b/gi, ' [TIME] ');

  // Normalize common OCR letter-for-digit confusions inside numeric currency strings.
  const fixDigitCore = (core: string) =>
    core
      .replace(/[Oo]/g, '0')
      .replace(/[Il|]/g, '1')
      .replace(/S/g, '5')
      .replace(/B/g, '8');

  const ocrNumFixed = scrubbed
    .replace(/((?:@|rp\.?|idr)\s*)([0-9OIlSB|.,]+)/gi, (_, prefix: string, core: string) => `${prefix}${fixDigitCore(core)}`)
    .replace(/\b([0-9OIlSB|.,]+)(\s*(?:rb|ribu|k|jt|juta)\b)/gi, (_, core: string, suffix: string) => `${fixDigitCore(core)}${suffix}`)
    .replace(/\b([0-9OIl|]{1,3}(?:\.[0-9OIl|]{3})+)\b/g, (core) => fixDigitCore(core));

  const totalMatch = ocrNumFixed.match(
    /(?:total|jumlah(?:\s+seluruhnya|\s+iuran|\s+tagihan|\s+bayar)?)\s*[:=-]?\s*(?:rp\.?|idr)?\s*(\d+(?:[.,]\d+)*)\s*(jt|juta|rb|ribu|k)?/i
  );
  if (totalMatch) {
    const rawNum = totalMatch[1];
    const unit = (totalMatch[2] || '').toLowerCase();
    if (unit === 'jt' || unit === 'juta') {
      const v = parseFloat(rawNum.replace(',', '.')) * 1000000;
      if (!isNaN(v) && v >= 5000) return Math.round(v);
    } else if (unit === 'rb' || unit === 'ribu' || unit === 'k') {
      const v = parseFloat(rawNum.replace(',', '.')) * 1000;
      if (!isNaN(v) && v >= 2000) return Math.round(v);
    } else {
      const v = parseInt(rawNum.replace(/[.,]/g, ''), 10);
      if (!isNaN(v) && v >= 2000 && v <= 100000000) return v;
    }
  }

  const foundAmounts: number[] = [];

  const jutaRegex = /(?:rp\.?|idr|@)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:jt|juta)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = jutaRegex.exec(ocrNumFixed)) !== null) {
    const val = Math.round(parseFloat(m[1].replace(',', '.')) * 1000000);
    if (!isNaN(val) && val >= 100000 && val <= 100000000) {
      foundAmounts.push(val);
    }
  }

  const ribuRegex = /(?:rp\.?|idr|@)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:rb|ribu|k)\b/gi;
  while ((m = ribuRegex.exec(ocrNumFixed)) !== null) {
    const numStr = m[1];
    // Avoid multiplying by 1000 a second time when the user wrote both thousands separators and "ribu" (e.g. "Rp 50.000 ribu").
    const cleanVal = /\.\d{3}$/.test(numStr)
      ? parseInt(numStr.replace(/\./g, ''), 10)
      : Math.round(parseFloat(numStr.replace(',', '.')) * 1000);
    if (!isNaN(cleanVal) && cleanVal >= 2000 && cleanVal <= 50000000) {
      foundAmounts.push(cleanVal);
    }
  }

  const rpRegex = /(?:rp\.?|idr|@)\s*(\d{1,3}(?:[.,]\d{3})+|\d{4,8})(?:,-|,-\.|\b)/gi;
  while ((m = rpRegex.exec(ocrNumFixed)) !== null) {
    const val = parseInt(m[1].replace(/[.,]/g, ''), 10);
    if (!isNaN(val) && val >= 2000 && val <= 100000000) {
      foundAmounts.push(val);
    }
  }

  if (foundAmounts.length === 0) {
    const stdRegex = /\b(\d{1,3}(?:\.\d{3})+)\b/g;
    while ((m = stdRegex.exec(ocrNumFixed)) !== null) {
      const val = parseInt(m[1].replace(/\./g, ''), 10);
      if (!isNaN(val) && val >= 2000 && val <= 100000000) {
        foundAmounts.push(val);
      }
    }
  }

  if (foundAmounts.length > 0) {
    // Sum distinct line-item amounts when the message formats fees as a numbered breakdown or addition list.
    const unique = Array.from(new Set(foundAmounts));
    const hasItemizedNumbering = /(?:^|\n)\s*[123][.)]\s+/m.test(ocrNumFixed) || /\+/.test(ocrNumFixed);
    if (hasItemizedNumbering && unique.length >= 2 && unique.length <= 5 && unique.every((v) => v <= 2000000)) {
      return foundAmounts.reduce((a, b) => a + b, 0);
    }
    return unique[0];
  }

  return parseIndonesianSpokenAmount(normalizedText || (text || '').toLowerCase());
}
