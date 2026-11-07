import type { BospRealizationItem } from '@/types/school';

export type MatchCategory =
  | 'exact'
  | 'term'
  | 'synonym'
  | 'semantic'
  | 'fuzzy';

export interface SemanticSearchResultItem {
  item: BospRealizationItem;
  score: number;
  matchCategory: MatchCategory;
  matchReason: string;
  matchedTerm?: string;
  isAlternative?: boolean;
}

export interface SemanticSearchResult {
  query: string;
  normalizedQuery: string;
  hasMatch: boolean;
  totalFound: number;
  results: SemanticSearchResultItem[];
  suggestedKeywords: string[];
}

// Map everyday parent/student search terms to official BOSP procurement keywords and fallback item IDs.
const SEMANTIC_CLUSTERS: Record<
  string,
  { targetKeywords: string[]; label: string; concept: string; fallbackTargetId?: string }
> = {
  buku: {
    targetKeywords: ['buku', 'buku teks', 'buku paket', 'literasi', 'modul', 'perpustakaan', 'pelajaran', 'kurikulum'],
    label: 'Buku Pelajaran & Literasi',
    concept: 'Buku teks utama siswa dan bahan bacaan perpustakaan',
  },
  'buku paket': {
    targetKeywords: ['buku', 'buku teks', 'buku paket', 'literasi', 'kurikulum merdeka'],
    label: 'Buku Paket Siswa',
    concept: 'Buku pegangan wajib belajar siswa',
  },
  'buku teks': {
    targetKeywords: ['buku', 'buku teks', 'pelajaran', 'kurikulum'],
    label: 'Buku Teks Utama',
    concept: 'Buku kurikulum wajib yang disediakan gratis oleh BOSP',
  },
  modul: {
    targetKeywords: ['modul', 'buku', 'materi', 'literasi', 'pelajaran'],
    label: 'Modul Belajar Siswa',
    concept: 'Bahan cetak materi pembelajaran siswa',
  },
  lks: {
    targetKeywords: ['modul', 'buku', 'kertas', 'atk', 'soal'],
    label: 'Bahan Ajar / Lembar Kerja Siswa',
    concept: 'Buku materi dan lembar penilaian siswa (tanpa pungutan LKS)',
  },
  literasi: {
    targetKeywords: ['literasi', 'buku', 'perpustakaan', 'bacaan'],
    label: 'Program Literasi Sekolah',
    concept: 'Buku bacaan pengayaan dan koleksi perpustakaan',
  },
  perpustakaan: {
    targetKeywords: ['perpustakaan', 'buku', 'literasi', 'bacaan'],
    label: 'Fasilitas Perpustakaan',
    concept: 'Pengadaan buku teks dan sarana baca siswa',
  },
  kamus: {
    targetKeywords: ['buku', 'literasi', 'perpustakaan'],
    label: 'Buku Referensi & Kamus',
    concept: 'Buku penunjang mata pelajaran di perpustakaan',
  },

  kertas: {
    targetKeywords: ['kertas', 'hvs', 'atk', 'ujian', 'penilaian', 'fotokopi'],
    label: 'Kertas HVS & Penggandaan',
    concept: 'Kertas ujian dan administrasi belajar mengajar',
  },
  hvs: {
    targetKeywords: ['hvs', 'kertas', 'atk', 'ujian', 'soal'],
    label: 'Kertas HVS Ujian',
    concept: 'Kertas HVS A4/F4 untuk lembar evaluasi siswa',
  },
  atk: {
    targetKeywords: ['atk', 'kertas', 'alat tulis', 'spidol', 'pulpen', 'tinta'],
    label: 'Alat Tulis Kantor & KBM',
    concept: 'Perlengkapan alat tulis kegiatan belajar siswa',
  },
  'alat tulis': {
    targetKeywords: ['atk', 'kertas', 'spidol', 'pulpen', 'pensil'],
    label: 'Perlengkapan Alat Tulis',
    concept: 'Alat tulis pendukung pembelajaran siswa',
  },
  ujian: {
    targetKeywords: ['ujian', 'penilaian', 'kertas', 'soal', 'asesmen', 'atk'],
    label: 'Pelaksanaan Ujian / Asesmen',
    concept: 'Kebutuhan penggandaan lembar soal dan ujian siswa',
  },
  penilaian: {
    targetKeywords: ['penilaian', 'ujian', 'asesmen', 'kertas', 'atk'],
    label: 'Asesmen & Penilaian Belajar',
    concept: 'Evaluasi hasil belajar siswa gratis dari BOSP',
  },
  asesmen: {
    targetKeywords: ['asesmen', 'ujian', 'anbk', 'kertas', 'internet'],
    label: 'Asesmen Nasional & Sekolah',
    concept: 'Pelaksanaan ANBK dan asesmen sumatif siswa',
  },
  spidol: {
    targetKeywords: ['spidol', 'atk', 'papan tulis', 'tinta'],
    label: 'Spidol & Alat Tulis Kelas',
    concept: 'Alat tulis papan tulis dan sarana mengajar',
  },
  fotokopi: {
    targetKeywords: ['fotokopi', 'kertas', 'hvs', 'soal', 'ujian'],
    label: 'Penggandaan Materi & Soal',
    concept: 'Fotokopi lembar kerja dan soal evaluasi gratis',
  },
  tinta: {
    targetKeywords: ['tinta', 'printer', 'kertas', 'atk'],
    label: 'Tinta Printer & Penggandaan',
    concept: 'Tinta cetak soal ujian dan bahan belajar siswa',
  },

  toilet: {
    targetKeywords: ['toilet', 'wc', 'kamar mandi', 'sanitasi', 'wastafel', 'air'],
    label: 'Toilet & Kamar Mandi Siswa',
    concept: 'Fasilitas sanitasi bersih dan sehat untuk siswa',
  },
  wc: {
    targetKeywords: ['wc', 'toilet', 'kamar mandi', 'sanitasi', 'kloset'],
    label: 'Fasilitas WC Sekolah',
    concept: 'Kloset dan sarana kebersihan toilet siswa',
  },
  'kamar mandi': {
    targetKeywords: ['kamar mandi', 'toilet', 'wc', 'sanitasi', 'air bersih'],
    label: 'Kamar Mandi Siswa',
    concept: 'Pemeliharaan bilik kamar mandi sekolah',
  },
  sanitasi: {
    targetKeywords: ['sanitasi', 'toilet', 'air bersih', 'wastafel', 'kebersihan'],
    label: 'Sarana Sanitasi Sekolah',
    concept: 'Saluran air bersih, toilet, dan fasilitas cuci tangan',
  },
  wastafel: {
    targetKeywords: ['wastafel', 'cuci tangan', 'keran', 'sanitasi', 'sabun'],
    label: 'Wastafel Cuci Tangan',
    concept: 'Tempat cuci tangan higienis siswa',
  },
  keran: {
    targetKeywords: ['keran', 'kran', 'wastafel', 'pipa', 'air'],
    label: 'Keran Air & Wastafel',
    concept: 'Kran air wudhu dan cuci tangan siswa',
  },
  kran: {
    targetKeywords: ['kran', 'keran', 'air', 'wastafel', 'pipa'],
    label: 'Kran Air',
    concept: 'Instalasi keran air bersih sekolah',
  },
  air: {
    targetKeywords: ['air', 'air bersih', 'pipa', 'toren', 'pompa', 'sanitasi'],
    label: 'Pasokan Air Bersih',
    concept: 'Kelancaran pasokan air bersih toilet dan wastafel',
  },
  pompa: {
    targetKeywords: ['pompa', 'toren', 'pipa', 'air', 'sanitasi'],
    label: 'Pompa Air & Toren',
    concept: 'Distribusi air bersih ke seluruh toilet sekolah',
  },
  toren: {
    targetKeywords: ['toren', 'tandon', 'air', 'pipa', 'sanitasi'],
    label: 'Toren / Tandon Penampung Air',
    concept: 'Tangki penyimpan air bersih sekolah',
  },
  kloset: {
    targetKeywords: ['kloset', 'toilet', 'wc', 'sanitasi'],
    label: 'Kloset Toilet Siswa',
    concept: 'Perbaikan kloset duduk/jongkok siswa',
  },
  sabun: {
    targetKeywords: ['sabun', 'wastafel', 'sanitasi', 'kebersihan'],
    label: 'Perlengkapan Kebersihan & Cuci Tangan',
    concept: 'Sabun cuci tangan dan higienitas sekolah',
  },
  sapu: {
    targetKeywords: ['kebersihan', 'sanitasi', 'sarana'],
    label: 'Alat Kebersihan Ruang Kelas',
    concept: 'Perlengkapan sapu, pel, dan kebersihan ruang belajar',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },
  pel: {
    targetKeywords: ['kebersihan', 'sanitasi', 'kamar mandi'],
    label: 'Peralatan Kebersihan Lantai',
    concept: 'Kain pel dan cairan pembersih ruang belajar',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },

  meja: {
    targetKeywords: ['meja', 'kursi', 'bangku', 'meubelair', 'meja belajar'],
    label: 'Meja Belajar Siswa',
    concept: 'Meja belajar kokoh di ruang kelas',
  },
  kursi: {
    targetKeywords: ['kursi', 'meja', 'bangku', 'meubelair', 'kursi belajar'],
    label: 'Kursi Belajar Siswa',
    concept: 'Tempat duduk belajar siswa standar sekolah',
  },
  bangku: {
    targetKeywords: ['bangku', 'meja', 'kursi', 'meubelair'],
    label: 'Bangku Ruang Kelas',
    concept: 'Bangku dan meja kelas tempat belajar siswa',
  },
  meubelair: {
    targetKeywords: ['meubelair', 'meja', 'kursi', 'bangku', 'perabot'],
    label: 'Meubelair Ruang Belajar',
    concept: 'Peremajaan perabot meja dan kursi kelas yang rusak',
  },
  mebel: {
    targetKeywords: ['mebel', 'meubelair', 'meja', 'kursi'],
    label: 'Perabot Mebel Kelas',
    concept: 'Pengadaan mebel belajar siswa',
  },
  lemari: {
    targetKeywords: ['meja', 'kursi', 'meubelair', 'ruang kelas'],
    label: 'Lemari Kelas & Penyimpanan',
    concept: 'Fasilitas penyimpanan buku dan perlengkapan kelas',
    fallbackTargetId: 'item-meja-kursi-04',
  },
  'papan tulis': {
    targetKeywords: ['proyektor', 'layar', 'meja', 'ruang kelas', 'spidol'],
    label: 'Papan Tulis & Media Belajar',
    concept: 'Sarana penyampaian materi tatap muka di kelas',
    fallbackTargetId: 'item-proyektor-lcd-07',
  },
  whiteboard: {
    targetKeywords: ['papan tulis', 'proyektor', 'spidol', 'ruang kelas'],
    label: 'Whiteboard Ruang Kelas',
    concept: 'Papan tulis putih untuk pembelajaran visual',
    fallbackTargetId: 'item-proyektor-lcd-07',
  },

  kipas: {
    targetKeywords: ['kipas', 'kipas angin', 'angin', 'pendingin', 'ventilasi', 'sirkulasi'],
    label: 'Kipas Angin Dinding',
    concept: 'Alat penyejuk sirkulasi udara ruang kelas',
  },
  'kipas angin': {
    targetKeywords: ['kipas', 'kipas angin', 'angin', 'sirkulasi', 'pendingin'],
    label: 'Kipas Angin Kelas',
    concept: 'Sirkulasi udara sejuk saat jam belajar siswa',
  },
  angin: {
    targetKeywords: ['kipas', 'kipas angin', 'ventilasi', 'pendingin'],
    label: 'Sirkulasi Udara Ruang Kelas',
    concept: 'Menjaga ruang kelas tetap sejuk dan tidak gerah',
  },
  exhaust: {
    targetKeywords: ['exhaust', 'kipas', 'ventilasi', 'sirkulasi'],
    label: 'Exhaust Fan & Ventilasi',
    concept: 'Pembuangan udara panas dan sirkulasi ruangan',
  },
  ventilasi: {
    targetKeywords: ['ventilasi', 'kipas', 'exhaust', 'sirkulasi'],
    label: 'Ventilasi Udara Sekolah',
    concept: 'Sirkulasi udara segar di ruang belajar siswa',
  },
  pendingin: {
    targetKeywords: ['pendingin', 'kipas', 'ac', 'ventilasi'],
    label: 'Alat Pendingin Ruang Belajar',
    concept: 'Meredam suhu panas di ruang kelas',
  },
  ac: {
    targetKeywords: ['kipas', 'pendingin', 'ventilasi', 'sirkulasi'],
    label: 'Sistem Pendingin / Kipas Ruang',
    concept: 'Pengatur suhu ruangan belajar siswa agar sejuk',
    fallbackTargetId: 'item-kipas-angin-05',
  },
  gerah: {
    targetKeywords: ['kipas', 'pendingin', 'angin', 'ventilasi'],
    label: 'Kipas Ruang Kelas (Anti-Gerah)',
    concept: 'Solusi ruang kelas agar siswa nyaman saat siang hari',
  },
  panas: {
    targetKeywords: ['kipas', 'pendingin', 'ventilasi', 'sirkulasi'],
    label: 'Pendingin Suhu Kelas',
    concept: 'Kipas penyejuk ruangan belajar siswa',
  },
  lampu: {
    targetKeywords: ['listrik', 'kipas', 'sarana'],
    label: 'Penerangan & Kelistrikan Kelas',
    concept: 'Penerangan ruang kelas dan instalasi listrik aman',
    fallbackTargetId: 'item-kipas-angin-05',
  },

  internet: {
    targetKeywords: ['internet', 'wifi', 'kuota', 'jaringan', 'anbk'],
    label: 'Langganan Internet Sekolah',
    concept: 'Akses broadband untuk asesmen online dan pembelajaran',
  },
  wifi: {
    targetKeywords: ['wifi', 'internet', 'koneksi', 'jaringan', 'router'],
    label: 'Koneksi WiFi Sekolah',
    concept: 'Jaringan internet nirkabel untuk guru dan siswa',
  },
  kuota: {
    targetKeywords: ['kuota', 'internet', 'pulsa', 'wifi'],
    label: 'Kuota Internet Belajar',
    concept: 'Biaya langganan data dan koneksi internet sekolah',
  },
  pulsa: {
    targetKeywords: ['pulsa', 'internet', 'kuota', 'daya dan jasa'],
    label: 'Biaya Komunikasi / Internet',
    concept: 'Langganan jaringan komunikasi sekolah',
  },
  router: {
    targetKeywords: ['router', 'wifi', 'internet', 'modem', 'jaringan'],
    label: 'Router & Perangkat WiFi',
    concept: 'Perangkat pemancar sinyal internet sekolah',
  },
  modem: {
    targetKeywords: ['modem', 'internet', 'wifi', 'jaringan'],
    label: 'Modem Akses Internet',
    concept: 'Konektivitas internet sekolah',
  },
  jaringan: {
    targetKeywords: ['jaringan', 'internet', 'wifi', 'lan'],
    label: 'Jaringan Komputer & Internet',
    concept: 'Infrastruktur komunikasi data sekolah',
  },
  anbk: {
    targetKeywords: ['anbk', 'internet', 'proyektor', 'kertas', 'asesmen'],
    label: 'Persiapan & Pelaksanaan ANBK',
    concept: 'Dukungan internet dan sarana Asesmen Nasional',
  },
  dapodik: {
    targetKeywords: ['dapodik', 'internet', 'atk', 'kertas'],
    label: 'Sinkronisasi Dapodik Sekolah',
    concept: 'Akses internet untuk pelaporan data siswa dan sekolah',
  },

  proyektor: {
    targetKeywords: ['proyektor', 'infocus', 'lcd', 'layar', 'presentasi'],
    label: 'Proyektor LCD Pembelajaran',
    concept: 'Alat proyeksi materi visual dan video di kelas',
  },
  projector: {
    targetKeywords: ['proyektor', 'projector', 'infocus', 'lcd'],
    label: 'Projector Pembelajaran',
    concept: 'Media presentasi materi belajar siswa',
  },
  infocus: {
    targetKeywords: ['infocus', 'proyektor', 'lcd', 'layar'],
    label: 'Proyektor InFocus Kelas',
    concept: 'Perangkat display multimedia ruang kelas',
  },
  lcd: {
    targetKeywords: ['lcd', 'proyektor', 'layar', 'monitor'],
    label: 'Layar LCD / Proyektor',
    concept: 'Tampilan visual media presentasi guru',
  },
  layar: {
    targetKeywords: ['layar', 'proyektor', 'screen', 'infocus'],
    label: 'Layar Proyektor Gantung',
    concept: 'Layar pantul proyektor untuk pembelajaran',
  },
  presentasi: {
    targetKeywords: ['presentasi', 'proyektor', 'multimedia', 'layar'],
    label: 'Sarana Presentasi Belajar',
    concept: 'Media interaktif penyampaian materi pelajaran',
  },
  hdmi: {
    targetKeywords: ['hdmi', 'kabel hdmi', 'proyektor', 'multimedia'],
    label: 'Kabel Konektor Proyektor',
    concept: 'Kabel display laptop guru ke proyektor kelas',
  },
  komputer: {
    targetKeywords: ['komputer', 'proyektor', 'internet', 'anbk'],
    label: 'Sarana Komputer & Digital Siswa',
    concept: 'Fasilitas pembelajaran digital dan asesmen sekolah',
    fallbackTargetId: 'item-proyektor-lcd-07',
  },
  laptop: {
    targetKeywords: ['laptop', 'komputer', 'proyektor', 'internet'],
    label: 'Perangkat Pembelajaran Digital',
    concept: 'Alat kerja pembelajaran interaktif dan ANBK',
    fallbackTargetId: 'item-proyektor-lcd-07',
  },
  speaker: {
    targetKeywords: ['sound', 'multimedia', 'proyektor', 'alat peraga'],
    label: 'Speaker & Sound System Belajar',
    concept: 'Pengeras suara untuk video materi dan kegiatan upacara',
    fallbackTargetId: 'item-proyektor-lcd-07',
  },
  sound: {
    targetKeywords: ['speaker', 'multimedia', 'audio', 'proyektor'],
    label: 'Tata Suara Pembelajaran',
    concept: 'Peralatan audio pendukung pembelajaran visual',
    fallbackTargetId: 'item-proyektor-lcd-07',
  },
  printer: {
    targetKeywords: ['tinta', 'kertas', 'atk', 'fotokopi'],
    label: 'Mesin Cetak & Penggandaan',
    concept: 'Pencetakan lembar evaluasi dan laporan belajar siswa',
    fallbackTargetId: 'item-atk-kertas-02',
  },

  cat: {
    targetKeywords: ['sarana', 'perawatan', 'ruang kelas', 'sanitasi'],
    label: 'Pengecatan & Pemeliharaan Ruang',
    concept: 'Perbaikan estetika dan kenyamanan dinding ruang kelas',
    fallbackTargetId: 'item-meja-kursi-04',
  },
  renovasi: {
    targetKeywords: ['pemeliharaan', 'sarana', 'sanitasi', 'toilet', 'ruang kelas'],
    label: 'Pemeliharaan Ringan Gedung',
    concept: 'Perbaikan sarana prasarana sekolah skala ringan sesuai juknis',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },
  atap: {
    targetKeywords: ['pemeliharaan', 'sarana', 'ruang kelas'],
    label: 'Perbaikan Plafon & Atap Kelas',
    concept: 'Pemeliharaan genteng/atap ruang kelas agar tidak bocor',
    fallbackTargetId: 'item-meja-kursi-04',
  },
  bocor: {
    targetKeywords: ['sanitasi', 'pipa', 'atap', 'sarana'],
    label: 'Penanganan Kebocoran Sarana',
    concept: 'Perbaikan saluran air dan perlindungan ruang kelas',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },
  pintu: {
    targetKeywords: ['sarana', 'ruang kelas', 'meja', 'toilet'],
    label: 'Perbaikan Pintu Ruangan & Toilet',
    concept: 'Kunci, engsel, dan daun pintu bilik toilet/kelas',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },

  obat: {
    targetKeywords: ['sanitasi', 'kesehatan', 'uks', 'kebersihan'],
    label: 'Kotak P3K & Obat Darurat',
    concept: 'Sarana pertolongan pertama kesehatan siswa di sekolah',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },
  p3k: {
    targetKeywords: ['obat', 'sanitasi', 'kesehatan', 'kebersihan'],
    label: 'Kotak Obat P3K UKS',
    concept: 'Obat-obatan ringan pertolongan pertama bagi murid',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },
  uks: {
    targetKeywords: ['kesehatan', 'sanitasi', 'kebersihan', 'toilet'],
    label: 'Fasilitas Ruang UKS Siswa',
    concept: 'Fasilitas kesehatan dan higienitas lingkungan belajar',
    fallbackTargetId: 'item-sanitasi-toilet-03',
  },
  bola: {
    targetKeywords: ['olahraga', 'ekstrakurikuler', 'buku', 'pembelajaran'],
    label: 'Alat Peraga Olahraga & Ekskul',
    concept: 'Peralatan aktivitas jasmani dan kesiswaan',
    fallbackTargetId: 'item-atk-kertas-02',
  },
  olahraga: {
    targetKeywords: ['kegiatan', 'pembelajaran', 'alat peraga'],
    label: 'Sarana Olahraga & Jasmani',
    concept: 'Aktivitas pembelajaran fisik dan ekstrakurikuler siswa',
    fallbackTargetId: 'item-atk-kertas-02',
  },
  pramuka: {
    targetKeywords: ['kegiatan', 'kesiswaan', 'ekstrakurikuler'],
    label: 'Kegiatan Ekstrakurikuler Pramuka',
    concept: 'Kegiatan kesiswaan wajib sekolah',
    fallbackTargetId: 'item-atk-kertas-02',
  },
};

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let j = 0; j <= an; ++j) matrix[0][j] = j;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

export function fuzzySimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

function findFuzzyMatchInList(
  word: string,
  targetList: string[],
  minSimilarity = 0.72
): { target: string; similarity: number } | null {
  if (word.length < 3) return null;
  let bestTarget = '';
  let highestSim = 0;

  for (const target of targetList) {
    if (word === target) return { target, similarity: 1 };
    const sim = fuzzySimilarity(word, target);
    if (sim >= minSimilarity && sim > highestSim) {
      highestSim = sim;
      bestTarget = target;
    }
  }

  return highestSim >= minSimilarity
    ? { target: bestTarget, similarity: highestSim }
    : null;
}

// Strip common Indonesian prefixes and suffixes so inflected queries match root catalog terms.
function stripIndonesianAffixes(word: string): string {
  if (word.length < 5) return word;
  let root = word;
  root = root.replace(/^(peng|per|pem|pen|me|ber|ter|di)/, '');
  root = root.replace(/(kan|nya|an|i)$/, '');
  return root.length >= 3 ? root : word;
}

export function searchBospItems(
  rawQuery: string,
  items: BospRealizationItem[]
): SemanticSearchResult {
  const normalizedQuery = normalizeText(rawQuery);

  const defaultSuggestions = [
    'Buku Pelajaran',
    'Kertas HVS & ATK',
    'Perawatan Toilet',
    'Meja Kursi Belajar',
    'Kipas Angin Dinding',
    'WiFi & Internet',
    'Proyektor Pembelajaran',
  ];

  if (!normalizedQuery) {
    return {
      query: rawQuery,
      normalizedQuery: '',
      hasMatch: true,
      totalFound: items.length,
      results: items.map((item) => ({
        item,
        score: 100,
        matchCategory: 'exact',
        matchReason: 'Katalog Pembelanjaan BOSP',
      })),
      suggestedKeywords: defaultSuggestions,
    };
  }

  const queryTokens = normalizedQuery.split(' ').filter((t) => t.length > 1);
  const stemmedTokens = queryTokens.map(stripIndonesianAffixes);

  let clusterMatch = SEMANTIC_CLUSTERS[normalizedQuery];
  let clusterMatchedKey = normalizedQuery;

  if (!clusterMatch) {
    for (const [key, cluster] of Object.entries(SEMANTIC_CLUSTERS)) {
      if (
        normalizedQuery.includes(key) ||
        key.includes(normalizedQuery) ||
        queryTokens.some((tok) => tok === key || fuzzySimilarity(tok, key) >= 0.78) ||
        stemmedTokens.some((st) => key.includes(st) || st.includes(key))
      ) {
        clusterMatch = cluster;
        clusterMatchedKey = key;
        break;
      }
    }
  }

  const rankedItems: SemanticSearchResultItem[] = [];

  for (const item of items) {
    const itemNameNorm = normalizeText(item.name);
    const itemCatNorm = normalizeText(item.category);
    const itemAllocNorm = normalizeText(item.allocation);
    const itemKeywordsNorm = item.keywords.map(normalizeText);
    const lineItemNames = item.invoice.lineItems.map((li) => normalizeText(li.name));

    let score = 0;
    let matchCategory: MatchCategory = 'semantic';
    let matchReason = '';
    let matchedTerm = '';
    let isAlternative = false;

    if (itemNameNorm === normalizedQuery) {
      score = 100;
      matchCategory = 'exact';
      matchReason = 'Nama barang cocok persis 100%';
      matchedTerm = item.name;
    } else if (itemNameNorm.includes(normalizedQuery)) {
      score = 95;
      matchCategory = 'exact';
      matchReason = 'Frasa terdapat langsung dalam nama barang';
      matchedTerm = normalizedQuery;
    } else if (lineItemNames.some((li) => li.includes(normalizedQuery))) {
      score = 92;
      matchCategory = 'exact';
      matchReason = 'Tercantum langsung pada rincian nota belanja';
      matchedTerm = normalizedQuery;
    }

    if (score < 88) {
      let matchedCount = 0;
      for (let i = 0; i < queryTokens.length; i++) {
        const tok = queryTokens[i];
        const stem = stemmedTokens[i];

        const inName = itemNameNorm.includes(tok) || itemNameNorm.includes(stem);
        const inKw = itemKeywordsNorm.some((kw) => kw.includes(tok) || tok.includes(kw) || kw.includes(stem));
        const inCat = itemCatNorm.includes(tok) || itemCatNorm.includes(stem);
        const inAlloc = itemAllocNorm.includes(tok) || itemAllocNorm.includes(stem);
        const inLines = lineItemNames.some((li) => li.includes(tok) || li.includes(stem));

        if (inName || inKw || inCat || inAlloc || inLines) {
          matchedCount++;
        }
      }

      if (matchedCount === queryTokens.length && queryTokens.length > 0) {
        score = Math.max(score, 88);
        matchCategory = 'term';
        matchReason = 'Semua kata kunci cocok dengan deskripsi barang';
        matchedTerm = queryTokens.join(', ');
      } else if (matchedCount > 0) {
        const ratio = matchedCount / queryTokens.length;
        score = Math.max(score, Math.round(62 + ratio * 20));
        matchCategory = 'term';
        matchReason = `Cocok ${matchedCount} dari ${queryTokens.length} kata pencarian`;
        matchedTerm = queryTokens.join(' ');
      }
    }

    if (clusterMatch) {
      let clusterHits = 0;
      for (const targetKw of clusterMatch.targetKeywords) {
        if (
          itemNameNorm.includes(targetKw) ||
          itemKeywordsNorm.includes(targetKw) ||
          itemCatNorm.includes(targetKw) ||
          itemAllocNorm.includes(targetKw) ||
          lineItemNames.some((li) => li.includes(targetKw))
        ) {
          clusterHits++;
        }
      }

      if (clusterHits > 0) {
        const clusterScore = 80 + Math.min(clusterHits * 4, 15);
        if (clusterScore > score) {
          score = clusterScore;
          matchCategory = 'synonym';
          matchReason = `Istilah Serupa: ${clusterMatch.label}`;
          matchedTerm = clusterMatch.concept;
        }
      } else if (clusterMatch.fallbackTargetId === item.id) {
        // Route queries without direct keyword hits (e.g., AC -> fan, first-aid -> sanitation) to their closest BOSP item.
        const fallbackScore = 75;
        if (fallbackScore > score) {
          score = fallbackScore;
          matchCategory = 'semantic';
          matchReason = `Kategori Terkait: ${clusterMatch.label}`;
          matchedTerm = clusterMatch.concept;
          isAlternative = true;
        }
      }
    }

    if (score < 70) {
      let typoFound = false;
      let matchedKeyword = '';

      for (const tok of queryTokens) {
        const fuzzyHit = findFuzzyMatchInList(tok, itemKeywordsNorm, 0.72);
        if (fuzzyHit) {
          typoFound = true;
          matchedKeyword = fuzzyHit.target;
          score = Math.max(score, Math.round(fuzzyHit.similarity * 74));
          break;
        }
      }

      if (typoFound && score > 0) {
        matchCategory = 'fuzzy';
        matchReason = `Koreksi Penulisan: "${matchedKeyword}"`;
        matchedTerm = matchedKeyword;
      }
    }

    if (score < 55) {
      for (const tok of queryTokens) {
        if (tok.length >= 3) {
          if (
            itemNameNorm.includes(tok) ||
            itemKeywordsNorm.some((kw) => kw.includes(tok) || tok.includes(kw))
          ) {
            score = Math.max(score, 60);
            matchCategory = 'semantic';
            matchReason = `Kemiripan kata "${tok}" pada nama barang`;
            matchedTerm = tok;
            break;
          }
        }
      }
    }

    if (score >= 45) {
      rankedItems.push({
        item,
        score,
        matchCategory,
        matchReason,
        matchedTerm,
        isAlternative,
      });
    }
  }

  // Return top general procurement items as alternatives so arbitrary queries never render an empty state.
  if (rankedItems.length === 0 && items.length > 0) {
    const generalAlternatives = items.slice(0, 3);
    for (const altItem of generalAlternatives) {
      rankedItems.push({
        item: altItem,
        score: 48,
        matchCategory: 'semantic',
        matchReason: `Alternatif belanja sarana umum sekolah untuk "${rawQuery.trim()}"`,
        matchedTerm: 'Katalog Umum BOSP',
        isAlternative: true,
      });
    }
  }

  rankedItems.sort((a, b) => b.score - a.score);

  return {
    query: rawQuery,
    normalizedQuery,
    hasMatch: rankedItems.length > 0,
    totalFound: rankedItems.length,
    results: rankedItems,
    suggestedKeywords: defaultSuggestions,
  };
}
