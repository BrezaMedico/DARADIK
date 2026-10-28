import { BospRealizationItem } from '../data/schoolsData';

export type MatchCategory =
  | 'exact'
  | 'term'
  | 'synonym'
  | 'semantic'
  | 'fuzzy';

export interface SemanticSearchResultItem {
  item: BospRealizationItem;
  score: number; // 0 - 100
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

/**
 * Common Indonesian synonym and semantic cluster dictionary for school procurement & BOSP items.
 * Maps semantic concepts and alternative terms to target keyword groups.
 */
const SEMANTIC_CLUSTERS: Record<string, { targetKeywords: string[]; label: string; concept: string }> = {
  // 1. Pendingin & Ventilasi
  'kipas': {
    targetKeywords: ['kipas', 'angin', 'exhaust', 'ventilasi', 'pendingin', 'dinding'],
    label: 'Kipas Angin & Ventilasi',
    concept: 'Peralatan sirkulasi udara & pendingin ruangan lab',
  },
  'kipas angin': {
    targetKeywords: ['kipas', 'angin', 'exhaust', 'ventilasi', 'pendingin'],
    label: 'Kipas Angin Dinding',
    concept: 'Sirkulasi udara ruangan lab',
  },
  'exhaust': {
    targetKeywords: ['exhaust', 'kipas', 'ventilasi', 'sirkulasi', 'pendingin'],
    label: 'Exhaust Fan Lab',
    concept: 'Pengatur suhu & pembuangan udara panas server',
  },
  'pendingin': {
    targetKeywords: ['pendingin', 'kipas', 'exhaust', 'ventilasi', 'ac lab'],
    label: 'Sistem Pendingin Ruang',
    concept: 'Alat pengatur suhu ruang komputer',
  },
  'ac': {
    targetKeywords: ['pendingin', 'kipas', 'exhaust', 'ventilasi'],
    label: 'Alat Pendingin Ruang',
    concept: 'Sirkulasi pendingin udara lab komputer',
  },
  'gerah': {
    targetKeywords: ['kipas', 'exhaust', 'pendingin', 'ventilasi'],
    label: 'Kipas & Pendingin Lab',
    concept: 'Solusi sirkulasi udara ruangan',
  },
  'panas': {
    targetKeywords: ['kipas', 'exhaust', 'pendingin', 'ventilasi'],
    label: 'Pendingin Suhu Lab',
    concept: 'Peredam suhu ruangan komputer',
  },
  'ventilasi': {
    targetKeywords: ['ventilasi', 'exhaust', 'kipas', 'sirkulasi'],
    label: 'Ventilasi & Exhaust Fan',
    concept: 'Sirkulasi udara lab komputer',
  },

  // 2. Perangkat Jaringan & Internet
  'switch': {
    targetKeywords: ['switch', 'jaringan', 'kabel lan', 'hub', 'gigabit'],
    label: 'Switch Gigabit Jaringan',
    concept: 'Perangkat distribusi jaringan lab komputer',
  },
  'wifi': {
    targetKeywords: ['wifi', 'access point', 'internet', 'router', 'jaringan'],
    label: 'Access Point WiFi & Internet',
    concept: 'Konektivitas nirkabel praktikum siswa',
  },
  'router': {
    targetKeywords: ['switch', 'access point', 'jaringan', 'mikrotik', 'internet'],
    label: 'Perangkat Routing & Jaringan',
    concept: 'Infrastruktur komunikasi data sekolah',
  },
  'access point': {
    targetKeywords: ['access point', 'wifi', 'internet', 'jaringan'],
    label: 'Access Point WiFi-6',
    concept: 'Penyedia sinyal nirkabel lab praktikum',
  },
  'lan': {
    targetKeywords: ['kabel lan', 'switch', 'jaringan', 'hub'],
    label: 'Kabel Jaringan & Switch LAN',
    concept: 'Infrastruktur kabel jaringan lab SIJA',
  },
  'internet': {
    targetKeywords: ['internet', 'fiber optik', 'bandwidth', 'langganan internet', 'wifi'],
    label: 'Langganan Internet Dedicated',
    concept: 'Akses broadband fiber optik 100 Mbps',
  },
  'kuota': {
    targetKeywords: ['internet', 'wifi', 'langganan internet', 'bandwidth'],
    label: 'Layanan Akses Internet',
    concept: 'Konektivitas data pembelajaran sekolah',
  },
  'pulsa': {
    targetKeywords: ['internet', 'langganan internet', 'kuota'],
    label: 'Biaya Langganan Komunikasi/Internet',
    concept: 'Akses internet sekolah',
  },
  'fiber': {
    targetKeywords: ['fiber optik', 'internet', 'bandwidth'],
    label: 'Koneksi Fiber Optik',
    concept: 'Infrastruktur internet cepat 1:1',
  },

  // 3. Modul Pembelajaran & Buku
  'buku': {
    targetKeywords: ['buku', 'modul', 'materi', 'buku teks', 'perpustakaan', 'kurikulum merdeka'],
    label: 'Modul Ajar & Buku Siswa',
    concept: 'Materi pembelajaran cetak gratis bagi siswa',
  },
  'modul': {
    targetKeywords: ['modul', 'buku', 'praktikum', 'buku ajar', 'kurikulum merdeka'],
    label: 'Paket Modul Praktikum Kejuruan',
    concept: 'Panduan kurikulum praktikum SIJA',
  },
  'lks': {
    targetKeywords: ['modul', 'buku', 'materi', 'praktikum'],
    label: 'Modul Pembelajaran Siswa (Pengganti LKS)',
    concept: 'Bahan ajar resmi sekolah yang dibiayai BOSP',
  },
  'lembar kerja': {
    targetKeywords: ['modul', 'buku', 'praktikum'],
    label: 'Modul Siswa Resmi',
    concept: 'Bahan ajar praktikum siswa',
  },
  'fotokopi': {
    targetKeywords: ['modul', 'materi', 'buku'],
    label: 'Bahan Ajar & Modul Cetak',
    concept: 'Pengadaan materi pembelajaran gratis',
  },
  'perpustakaan': {
    targetKeywords: ['perpustakaan', 'buku', 'modul', 'buku teks'],
    label: 'Pengembangan Koleksi Buku & Modul',
    concept: 'Sarana literasi & modul praktikum',
  },

  // 4. Multimedia & Presentasi
  'proyektor': {
    targetKeywords: ['proyektor', 'infocus', 'lcd', 'presentasi', 'layar proyektor'],
    label: 'Proyektor Interaktif Lab',
    concept: 'Perangkat visual presentasi koding & jaringan',
  },
  'infocus': {
    targetKeywords: ['proyektor', 'lcd', 'presentasi', 'layar proyektor'],
    label: 'Proyektor Interaktif (InFocus)',
    concept: 'Display multimedia pembelajaran kelas',
  },
  'projector': {
    targetKeywords: ['proyektor', 'infocus', 'lcd', 'presentasi'],
    label: 'Interactive Projector',
    concept: 'Media presentasi proyektor lab komputer',
  },
  'lcd': {
    targetKeywords: ['proyektor', 'layar proyektor', 'infocus'],
    label: 'Proyektor LCD Pembelajaran',
    concept: 'Perangkat display visual interaktif',
  },
  'layar': {
    targetKeywords: ['proyektor', 'layar proyektor', 'infocus'],
    label: 'Layar & Proyektor Presentasi',
    concept: 'Media visual interaktif pembelajaran',
  },
  'hdmi': {
    targetKeywords: ['kabel hdmi', 'proyektor', 'presentasi'],
    label: 'Kabel Konektivitas Proyektor Lab',
    concept: 'Instalasi multimedia display lab',
  },

  // 5. Fasilitas Sanitasi & Air Bersih
  'toilet': {
    targetKeywords: ['toilet', 'sanitasi', 'kamar mandi', 'wc', 'wastafel', 'air bersih'],
    label: 'Fasilitas Sanitasi & Kamar Mandi',
    concept: 'Sarana kebersihan & air bersih asrama',
  },
  'kamar mandi': {
    targetKeywords: ['kamar mandi', 'sanitasi', 'toilet', 'wc', 'wastafel', 'keran'],
    label: 'Perbaikan Kamar Mandi Asrama',
    concept: 'Instalasi sanitasi dan pemeliharaan bilik asrama',
  },
  'wc': {
    targetKeywords: ['wc', 'toilet', 'kamar mandi', 'sanitasi', 'kloset'],
    label: 'Sanitasi & Kloset Asrama',
    concept: 'Perbaikan sarana sanitasi siswa',
  },
  'wastafel': {
    targetKeywords: ['wastafel', 'cuci tangan', 'sanitasi', 'keran'],
    label: 'Wastafel Cuci Tangan Keramik',
    concept: 'Sarana cuci tangan higienis asrama siswa',
  },
  'air': {
    targetKeywords: ['air bersih', 'pompa', 'toren', 'pipa', 'sanitasi'],
    label: 'Instalasi Air Bersih & Pompa',
    concept: 'Penyediaan air bersih gedung asrama',
  },
  'keran': {
    targetKeywords: ['keran', 'wastafel', 'pipa', 'sanitasi'],
    label: 'Keran & Wastafel Sanitasi',
    concept: 'Perlengkapan cuci tangan dan kamar mandi',
  },
  'pompa': {
    targetKeywords: ['pompa', 'toren', 'pipa', 'air bersih'],
    label: 'Pompa Booster & Toren Air',
    concept: 'Kelancaran pasokan air bersih asrama',
  },

  // 6. Meubelair & Sarana Belajar
  'meja': {
    targetKeywords: ['meja', 'kursi', 'meja lab', 'meubelair', 'meja kelas', 'bangku'],
    label: 'Set Meja Komputer Lab',
    concept: 'Perabot meja praktikum berkerangka kokoh',
  },
  'kursi': {
    targetKeywords: ['kursi', 'meja', 'bangku', 'kursi komputer', 'meubelair', 'kursi kelas'],
    label: 'Kursi Komputer Ergonomis',
    concept: 'Tempat duduk ergonomis praktikum koding',
  },
  'bangku': {
    targetKeywords: ['bangku', 'kursi', 'meja', 'meubelair'],
    label: 'Bangku & Kursi Praktikum',
    concept: 'Meubelair fasilitas belajar siswa',
  },
  'mebel': {
    targetKeywords: ['meubelair', 'meja', 'kursi', 'bangku'],
    label: 'Pengadaan Meubelair Sekolah',
    concept: 'Peremajaan meja kursi ruang kelas & lab',
  },
  'meubelair': {
    targetKeywords: ['meubelair', 'meja', 'kursi', 'bangku'],
    label: 'Pengadaan Meubelair Sekolah',
    concept: 'Fasilitas sarana duduk dan meja praktikum',
  },

  // 7. Perangkat Komputer & Komputer Jinjing (Laptop / PC)
  'komputer': {
    targetKeywords: ['lab komputer', 'switch', 'meja komputer', 'kursi komputer', 'proyektor'],
    label: 'Peralatan Fasilitas Lab Komputer',
    concept: 'Perlengkapan workstation dan sarana pendukung praktikum',
  },
  'laptop': {
    targetKeywords: ['lab komputer', 'komputer', 'workstation', 'switch'],
    label: 'Fasilitas Komputer & Lab Praktikum',
    concept: 'Sarana komputasi yang dialokasikan di lab jaringan',
  },
  'komputer jinjing': {
    targetKeywords: ['lab komputer', 'komputer', 'workstation'],
    label: 'Sarana Komputer & Praktikum Lab',
    concept: 'Fasilitas komputasi dan ruang kerja digital siswa',
  },
  'pc': {
    targetKeywords: ['lab komputer', 'workstation', 'switch', 'meja komputer'],
    label: 'Perangkat PC & Workstation Lab',
    concept: 'Fasilitas praktikum komputer kejuruan',
  },

  // 8. Perlengkapan Tulis & Papan Tulis
  'papan tulis': {
    targetKeywords: ['proyektor', 'modul', 'meja', 'lab komputer'],
    label: 'Sarana Visual Pembelajaran Kelas',
    concept: 'Media presentasi & pembelajaran interaktif ruang kelas',
  },
  'whiteboard': {
    targetKeywords: ['proyektor', 'modul', 'meja', 'lab komputer'],
    label: 'Media Presentasi & Tulis Kelas',
    concept: 'Papan tulis dan display presentasi visual guru/siswa',
  },
  'spidol': {
    targetKeywords: ['modul', 'buku', 'bahan ajar'],
    label: 'Alat Tulis & Bahan Ajar Habis Pakai',
    concept: 'Perlengkapan administrasi dan bahan belajar kelas',
  },
  'papan tulis putih': {
    targetKeywords: ['proyektor', 'modul', 'meja', 'lab komputer'],
    label: 'Sarana Visual Kelas',
    concept: 'Fasilitas media mengajar di ruang kelas/lab',
  },
  'papan untuk menulis dengan spidol': {
    targetKeywords: ['proyektor', 'modul', 'meja', 'lab komputer'],
    label: 'Media Tulis & Display Kelas',
    concept: 'Alat bantu visual pembelajaran tatap muka',
  },
};

/**
 * Normalizes input text: lowercases, strips special characters, trims multiple whitespace.
 */
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

/**
 * Calculates Levenshtein Distance between two strings.
 */
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates fuzzy string similarity ratio between 0 and 1.
 */
export function fuzzySimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Checks if a word is close to any target in a list of words (handles typos like "papn", "kyfas", "proyktor").
 */
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

/**
 * Comprehensive AI Semantic Search & Similarity Ranking Engine
 */
export function searchBospItems(
  rawQuery: string,
  items: BospRealizationItem[]
): SemanticSearchResult {
  const normalizedQuery = normalizeText(rawQuery);

  if (!normalizedQuery) {
    // Return all items in neutral order when query is empty
    return {
      query: rawQuery,
      normalizedQuery: '',
      hasMatch: true,
      totalFound: items.length,
      results: items.map((item) => ({
        item,
        score: 100,
        matchCategory: 'exact',
        matchReason: 'Katalog Pengadaan Resmi',
      })),
      suggestedKeywords: [
        'Kipas Angin Lab',
        'Proyektor Interaktif',
        'Modul Praktikum SIJA',
        'Switch Gigabit',
        'Meja Kursi Komputer',
        'Sanitasi Asrama',
        'Internet Fiber Optik',
      ],
    };
  }

  const queryTokens = normalizedQuery.split(' ').filter((t) => t.length > 1);

  // Look up semantic cluster for query
  let clusterMatch = SEMANTIC_CLUSTERS[normalizedQuery];
  if (!clusterMatch) {
    // Check if any cluster key is in query or matches query token
    for (const [key, cluster] of Object.entries(SEMANTIC_CLUSTERS)) {
      if (
        normalizedQuery.includes(key) ||
        key.includes(normalizedQuery) ||
        queryTokens.some((tok) => tok === key || fuzzySimilarity(tok, key) > 0.78)
      ) {
        clusterMatch = cluster;
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

    // 1. EXACT PHRASE MATCH
    if (itemNameNorm === normalizedQuery) {
      score = 100;
      matchCategory = 'exact';
      matchReason = 'Nama barang cocok persis 100%';
      matchedTerm = item.name;
    } else if (itemNameNorm.includes(normalizedQuery)) {
      score = 94;
      matchCategory = 'exact';
      matchReason = 'Frasa terdapat langsung dalam nama barang';
      matchedTerm = normalizedQuery;
    } else if (lineItemNames.some((li) => li.includes(normalizedQuery))) {
      score = 90;
      matchCategory = 'exact';
      matchReason = 'Tercantum persis pada rincian nota SIPLah';
      matchedTerm = normalizedQuery;
    }

    // 2. TOKEN OVERLAP & KEYWORD MATCH
    if (score < 85) {
      let matchingTokens = 0;
      for (const tok of queryTokens) {
        if (
          itemNameNorm.includes(tok) ||
          itemKeywordsNorm.some((kw) => kw.includes(tok) || tok.includes(kw)) ||
          itemCatNorm.includes(tok) ||
          itemAllocNorm.includes(tok)
        ) {
          matchingTokens++;
        }
      }

      if (matchingTokens === queryTokens.length && queryTokens.length > 0) {
        score = Math.max(score, 86);
        matchCategory = 'term';
        matchReason = 'Semua kata kunci cocok dengan deskripsi barang';
        matchedTerm = queryTokens.join(', ');
      } else if (matchingTokens > 0) {
        const tokenRatio = matchingTokens / queryTokens.length;
        score = Math.max(score, Math.round(65 + tokenRatio * 18));
        matchCategory = 'term';
        matchReason = `Cocok ${matchingTokens} dari ${queryTokens.length} kata kunci`;
      }
    }

    // 3. SYNONYM & SEMANTIC CLUSTER MATCH
    if (clusterMatch) {
      let clusterHits = 0;
      for (const targetKw of clusterMatch.targetKeywords) {
        if (
          itemNameNorm.includes(targetKw) ||
          itemKeywordsNorm.includes(targetKw) ||
          itemCatNorm.includes(targetKw)
        ) {
          clusterHits++;
        }
      }

      if (clusterHits > 0) {
        const clusterScore = 80 + Math.min(clusterHits * 4, 15);
        if (clusterScore > score) {
          score = clusterScore;
          matchCategory = 'synonym';
          matchReason = `Sinonim / Istilah Serupa: ${clusterMatch.label}`;
          matchedTerm = clusterMatch.concept;
        }
      }
    }

    // 4. FUZZY & TYPO MATCH (e.g. "papn tulis" -> "papan", "kyfas" -> "kipas", "proyktor" -> "proyektor")
    if (score < 70) {
      let typoFound = false;
      let matchedKeyword = '';

      for (const tok of queryTokens) {
        const fuzzyHit = findFuzzyMatchInList(tok, itemKeywordsNorm, 0.74);
        if (fuzzyHit) {
          typoFound = true;
          matchedKeyword = fuzzyHit.target;
          score = Math.max(score, Math.round(fuzzyHit.similarity * 72));
          break;
        }
      }

      if (typoFound && score > 0) {
        matchCategory = 'fuzzy';
        matchReason = `Koreksi Penulisan (Typo): "${matchedKeyword}"`;
        matchedTerm = matchedKeyword;
      }
    }

    // 5. SEMANTIC RELEVANCE FALLBACK (Alternative items when query is loosely related)
    if (score === 0 && clusterMatch) {
      // Suggest items that are part of standard classroom facilities
      if (item.category.includes('Peralatan') || item.category.includes('Sarana')) {
        score = 42;
        matchCategory = 'semantic';
        matchReason = 'Alternatif fasilitas sarana ruang kelas terkait';
        isAlternative = true;
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

  // Sort descending by score
  rankedItems.sort((a, b) => b.score - a.score);

  const suggestedKeywords = [
    'Kipas Angin Dinding',
    'Proyektor Interaktif',
    'Modul Praktikum SIJA',
    'Switch Gigabit Lab',
    'Meja Kursi Komputer',
    'Sanitasi Asrama',
    'Internet Dedicated 100 Mbps',
  ];

  return {
    query: rawQuery,
    normalizedQuery,
    hasMatch: rankedItems.length > 0,
    totalFound: rankedItems.length,
    results: rankedItems,
    suggestedKeywords,
  };
}
