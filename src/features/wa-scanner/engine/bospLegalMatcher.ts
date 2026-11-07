import type { BospRealizationItem, BudgetComposition } from '@/types/school';
import type {
  AiScanAnalysisResult,
  ImageDiagnostics,
  SchoolScannerContext,
  ThreeWayComparison,
} from '@/types/scanner';
import type {
  BudgetItemMatchResult,
  CoercionLevyAnalysis,
  EnrichedMessageDoc,
  KamusBospRuleMatch,
} from './internalTypes';
import {
  INDONESIAN_STOP_FILLERS,
  buildEnrichedMessageDoc,
  extractMonetaryAmounts,
  matchPhraseSmart,
} from './indonesianNlu';

export function analyzeCoercionAndLevyIntent(
  doc: EnrichedMessageDoc,
  rawText: string,
  detectedAmount: number | null
): CoercionLevyAnalysis {
  const norm = doc.normalizedText;

  // Mask negated obligations so "tidak wajib" or "tanpa paksaan" never trigger false coercion.
  const negatedObligationPatterns = [
    /\b(?:tidak|bukan|tanpa)\s+(?:ada\s+)?(?:wajib|diwajibkan|kewajiban|harus|diharuskan|keharusan|paksaan|dipaksa|memaksa|mengikat|pungutan|denda|sanksi|biaya|dipungut\s+biaya)\b/g,
    /\b(?:gratis|bebas)\s+(?:tanpa\s+)?(?:biaya|pungutan|iuran|nominal)\b/g,
    /\bnominal\s+(?:bebas|seikhlasnya|sukarela)\b/g,
    /\btidak\s+ditentukan\s+(?:nominal|besaran)\b/g,
  ];

  let guardedNorm = norm;
  let negatedVoluntaryHits = 0;
  for (const pat of negatedObligationPatterns) {
    guardedNorm = guardedNorm.replace(pat, () => {
      negatedVoluntaryHits++;
      return ' sukarela_murni ';
    });
  }

  const guardedDoc = buildEnrichedMessageDoc(guardedNorm);

  const collectMatches = (phrases: string[]): string[] => {
    const hits: string[] = [];
    for (const p of phrases) {
      const m = matchPhraseSmart(guardedDoc, p);
      if (m.matched) {
        hits.push(p);
      }
    }
    return hits;
  };

  const explicitHits = collectMatches([
    'wajib',
    'diwajibkan',
    'kewajiban',
    'harus',
    'diharuskan',
    'keharusan',
    'mutlak',
    'tanpa terkecuali',
    'semua siswa',
    'setiap siswa',
    'seluruh siswa',
    'semua wali murid',
    'setiap wali murid',
    'dibebankan',
    'dipungut',
    'pungutan',
  ]);

  const bureaucraticHits = collectMatches([
    'dimohon segera',
    'harap segera',
    'mohon segera',
    'diharapkan melunasi',
    'segera melunasi',
    'segera dilunasi',
    'mengingatkan pembayaran',
    'mengingatkan tunggakan',
    'mengingatkan tagihan',
    'bagi yang belum lunas',
    'bagi yang belum membayar',
    'yang belum bayar',
    'rekap tunggakan',
    'daftar belum lunas',
    'kesepakatan rapat ditetapkan',
    'partisipasi wajib',
    'disepakati sebesar',
  ]);

  const deadlineHits = collectMatches([
    'paling lambat',
    'selambat lambatnya',
    'batas akhir',
    'batas waktu',
    'batas pembayaran',
    'batas pelunasan',
    'jatuh tempo',
    'tenggat waktu',
    'tenggat',
    'maksimal tanggal',
    'maksimal hari',
    'ditunggu sampai',
    'terakhir pembayaran',
    'besok terakhir',
    'hari ini terakhir',
    'segera lunasi',
    'sebelum ujian',
    'sebelum ulangan',
    'sebelum pembagian rapor',
    'sebelum ambil rapor',
    'sebelum ambil kartu',
  ]);

  const tariffHits = collectMatches([
    'per siswa',
    'per anak',
    'per murid',
    'per orang',
    'per bulan',
    'ditetapkan sebesar',
    'dikenakan biaya',
    'tagihan',
    'tunggakan',
    'kurang bayar',
    'belum lunas',
    'pelunasan',
    'melunasi',
    'lunas',
    'dicicil',
    'cicilan',
    'angsuran',
  ]);

  const hasPerStudentSymbol =
    /@\s*(?:rp\.?\s*)?\d+/i.test(rawText) ||
    /\/\s*(?:siswa|anak|murid|org|orang|bln|bulan)\b/i.test(rawText);
  if (hasPerStudentSymbol) {
    tariffHits.push('tarif per siswa (@/per siswa)');
  }

  const hasMinimumAmount =
    /\bminimal\s+(?:rp\.?\s*|sumbangan\s+|infaq\s+|infak\s+|donasi\s+|iuran\s+|bayar\s+)?(?:\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|sejuta)/i.test(
      guardedNorm
    ) || /\bmin\.?\s*(?:rp\.?\s*)?\d+\s*(?:rb|ribu|k|jt|juta)\b/i.test(rawText);
  if (hasMinimumAmount) {
    tariffHits.push('batas nominal minimal');
  }

  const sanctionHits = collectMatches([
    'tidak boleh ikut ujian',
    'tidak bisa ikut ujian',
    'dilarang ikut ujian',
    'belum bisa ikut ujian',
    'tidak diperkenankan ikut ujian',
    'kartu ujian ditahan',
    'kartu ujian belum bisa',
    'kartu peserta ditahan',
    'tidak mendapat kartu ujian',
    'syarat ambil kartu',
    'ambil kartu harus lunas',
    'rapor ditahan',
    'rapor belum bisa diambil',
    'ijazah ditahan',
    'ijazah belum bisa diambil',
    'penahanan ijazah',
    'penahanan rapor',
    'tebus ijazah',
    'tebus rapor',
    'denda',
    'sanksi',
    'konsekuensi',
    'dipulangkan',
    'skorsing',
    'diumumkan di grup',
    'nama siswa belum bayar',
  ]);

  const directiveHits = collectMatches([
    'transfer',
    'rekening',
    'bendahara',
    'bukti transfer',
    'setor',
    'setorkan',
    'dikumpulkan ke',
    'kumpulkan ke',
    'bayar ke',
    'pembayaran ke',
    'tata usaha',
  ]);

  const voluntaryHits = collectMatches([
    'sukarela',
    'sukarela_murni',
    'seikhlasnya',
    'semampunya',
    'kerelaan',
    'bagi yang berkenan',
    'yang berkenan',
    'opsional',
    'boleh ikut boleh tidak',
  ]);

  const hasAcademicSanction = sanctionHits.length > 0;
  const hasExplicitObligation = explicitHits.length > 0;
  const hasBureaucraticPressure = bureaucraticHits.length > 0;
  const hasBindingDeadline = deadlineHits.length > 0;
  const hasFixedTariff = tariffHits.length > 0;
  const hasPaymentDirective = directiveHits.length > 0;
  const hasVoluntaryCue = voluntaryHits.length > 0 || negatedVoluntaryHits > 0;

  // Disguised coercion: calls a fee voluntary while attaching deadlines, quotas, or academic consequences.
  const isDisguisedCoercion =
    hasVoluntaryCue &&
    (hasAcademicSanction ||
      hasExplicitObligation ||
      hasBindingDeadline ||
      hasMinimumAmount ||
      (detectedAmount !== null && hasFixedTariff && hasBureaucraticPressure));

  const hasPureVoluntary =
    hasVoluntaryCue &&
    !isDisguisedCoercion &&
    !hasAcademicSanction &&
    !hasExplicitObligation &&
    !hasBindingDeadline &&
    !hasMinimumAmount;

  const isMandatory =
    hasAcademicSanction ||
    hasExplicitObligation ||
    isDisguisedCoercion ||
    hasBindingDeadline ||
    hasBureaucraticPressure ||
    (hasFixedTariff && (detectedAmount !== null || hasPaymentDirective || !hasPureVoluntary)) ||
    (detectedAmount !== null && hasPaymentDirective && !hasPureVoluntary);

  const financialLexemeHits = collectMatches([
    'iuran',
    'bayar',
    'pembayaran',
    'biaya',
    'uang',
    'dana',
    'tarif',
    'tagihan',
    'tunggakan',
    'pungutan',
    'sumbangan',
    'patungan',
    'urunan',
    'infaq',
    'sedekah',
    'santunan',
    'donasi',
    'pembelian',
    'pengadaan',
    'beli',
    'lunas',
    'pelunasan',
    'transfer',
    'rekening',
    'setor',
    'bendahara',
    'tebus',
    'denda',
    'spp',
    'cicilan',
    'komite',
  ]);

  const hasFinancialOrLevyContext =
    detectedAmount !== null ||
    isMandatory ||
    financialLexemeHits.length > 0;

  let coercionScore = 0;
  if (hasAcademicSanction) coercionScore += 55;
  if (hasExplicitObligation) coercionScore += 38;
  if (isDisguisedCoercion) coercionScore += 35;
  if (hasBindingDeadline) coercionScore += 28;
  if (hasBureaucraticPressure) coercionScore += 22;
  if (hasFixedTariff) coercionScore += 22;
  if (detectedAmount !== null) coercionScore += 15;
  if (hasPaymentDirective) coercionScore += 12;
  if (hasPureVoluntary) coercionScore = Math.max(0, coercionScore - 45);
  coercionScore = Math.min(100, coercionScore);

  const matchedCoercionSignals = Array.from(
    new Set([
      ...sanctionHits,
      ...explicitHits,
      ...deadlineHits,
      ...bureaucraticHits,
      ...tariffHits,
      ...directiveHits,
    ])
  );

  let toneLabel = 'Himbauan / Informasi Tanpa Tagihan';
  let toneBadge = 'Informatif';

  if (hasAcademicSanction) {
    toneLabel = 'Ancaman Sanksi Akademik / Penahanan Hak Siswa';
    toneBadge = 'Ancaman Sanksi';
  } else if (isDisguisedCoercion) {
    toneLabel = 'Paksaan Terselubung (Berkedok Sumbangan namun Mengikat)';
    toneBadge = 'Paksaan Terselubung';
  } else if (isMandatory) {
    toneLabel = 'Wajib / Menagih dengan Tarif atau Batas Waktu';
    toneBadge = 'Wajib/Menagih';
  } else if (hasPureVoluntary && hasFinancialOrLevyContext) {
    toneLabel = 'Sumbangan Sukarela Murni (Tanpa Paksaan & Tanpa Tarif Mengikat)';
    toneBadge = 'Sukarela';
  } else if (hasFinancialOrLevyContext) {
    toneLabel = 'Permintaan Iuran / Pengumpulan Dana';
    toneBadge = 'Tarikan Dana';
  }

  return {
    isMandatory,
    isDisguisedCoercion,
    hasAcademicSanction,
    hasBindingDeadline,
    hasFixedTariff,
    hasExplicitObligation,
    hasBureaucraticPressure,
    hasPaymentDirective,
    hasPureVoluntary,
    hasFinancialOrLevyContext,
    coercionScore,
    matchedCoercionSignals,
    toneLabel,
    toneBadge,
  };
}

export const DOMAIN_ITEM_CONCEPT_CLUSTERS: Array<{
  triggerRegex: RegExp;
  strongPhrases: string[];
  contextOnlyPhrases?: string[];
  excludePhrases?: string[];
}> = [
  {
    triggerRegex: /buku|perpustakaan|literasi|kurikulum/i,
    strongPhrases: [
      'buku paket',
      'buku teks',
      'buku cetak',
      'buku pelajaran',
      'buku kurikulum',
      'kurikulum merdeka',
      'buku bacaan',
      'buku literasi',
      'buku perpustakaan',
      'modul ajar',
      'modul belajar',
      'modul praktikum',
      'lembar kerja siswa',
      'lks',
      'uang buku',
      'beli buku',
      'pengadaan buku',
    ],
    contextOnlyPhrases: ['buku', 'modul', 'perpustakaan'],
    excludePhrases: ['buku tahunan', 'yearbook', 'album kenangan', 'buku tabungan', 'buku rekening'],
  },
  {
    triggerRegex: /kertas|hvs|atk|penilaian|ujian|asesmen/i,
    strongPhrases: [
      'kertas hvs',
      'kertas sidu',
      'kertas ujian',
      'kertas ulangan',
      'uang kertas',
      'fotokopi soal',
      'penggandaan soal',
      'cetak soal',
      'lembar soal',
      'lembar jawaban',
      'ljk',
      'alat tulis kantor',
      'atk',
      'tinta printer',
      'spidol papan',
      'spidol kelas',
      'penghapus papan',
      'map rapor',
      'sampul rapor',
      'cetak rapor',
    ],
    contextOnlyPhrases: ['kertas', 'fotokopi', 'spidol', 'tinta'],
  },
  {
    triggerRegex: /sanitasi|toilet|wastafel|keran|air/i,
    strongPhrases: [
      'toilet',
      'toilet siswa',
      'kamar mandi',
      'wc',
      'wastafel',
      'tempat cuci tangan',
      'keran air',
      'saluran air',
      'air bersih',
      'pipa air',
      'paralon',
      'pompa air',
      'toren air',
      'tandon air',
      'kloset',
      'sanitasi',
      'sabun cuci tangan',
      'alat kebersihan',
      'sapu kelas',
      'kain pel',
    ],
    contextOnlyPhrases: ['keran', 'pipa', 'toren', 'tandon', 'sabun'],
  },
  {
    triggerRegex: /meja|kursi|meubel|bangku/i,
    strongPhrases: [
      'meja kursi',
      'meja belajar',
      'kursi belajar',
      'meja siswa',
      'kursi siswa',
      'meja kelas',
      'kursi kelas',
      'bangku kelas',
      'bangku belajar',
      'meubelair',
      'mebel kelas',
      'furniture kelas',
      'lemari kelas',
      'papan tulis',
      'whiteboard',
    ],
    contextOnlyPhrases: ['meja', 'kursi'],
    excludePhrases: ['uang bangku', 'jual beli bangku'],
  },
  {
    triggerRegex: /kipas|ventilasi|pendingin|sirkulasi/i,
    strongPhrases: [
      'kipas angin',
      'kipas dinding',
      'kipas kelas',
      'kipas ruang',
      'exhaust fan',
      'blower kelas',
      'ventilasi udara',
      'sirkulasi udara',
      'pendingin ruangan',
      'ac kelas',
      'ac ruang',
      'beli kipas',
      'iuran kipas',
    ],
    contextOnlyPhrases: ['kipas', 'exhaust', 'ventilasi', 'blower', 'gerah', 'kepanasan'],
  },
  {
    triggerRegex: /internet|wifi|jaringan|router|switch/i,
    strongPhrases: [
      'internet sekolah',
      'uang internet',
      'biaya internet',
      'langganan internet',
      'wifi',
      'uang wifi',
      'iuran wifi',
      'kuota internet',
      'router',
      'modem',
      'access point',
      'mikrotik',
      'switch jaringan',
      'kabel lan',
      'kabel utp',
      'konektor rj45',
      'rj45',
      'fiber optik',
      'indihome',
      'bandwidth',
      'jaringan komputer',
      'jaringan internet',
    ],
    contextOnlyPhrases: ['internet', 'jaringan', 'kuota', 'switch'],
  },
  {
    triggerRegex: /proyektor|multimedia|lcd|infocus/i,
    strongPhrases: [
      'proyektor',
      'projector',
      'infocus',
      'lcd proyektor',
      'layar proyektor',
      'kabel hdmi',
      'bracket proyektor',
      'multimedia kelas',
      'media presentasi',
    ],
    contextOnlyPhrases: ['lcd', 'hdmi', 'multimedia'],
  },
];

export function matchSchoolBudgetItems(
  doc: EnrichedMessageDoc,
  bospItems: BospRealizationItem[],
  hasFinancialOrLevyContext: boolean
): BudgetItemMatchResult | null {
  if (!bospItems || bospItems.length === 0) return null;

  let bestMatch: BudgetItemMatchResult | null = null;

  for (const item of bospItems) {
    const itemDescriptor = `${item.id} ${item.name} ${item.category} ${item.allocation} ${(item.keywords || []).join(' ')}`;
    let itemBestScore = 0;
    let itemBestKw = '';

    for (const cluster of DOMAIN_ITEM_CONCEPT_CLUSTERS) {
      if (!cluster.triggerRegex.test(itemDescriptor)) continue;

      if (cluster.excludePhrases?.some((ex) => matchPhraseSmart(doc, ex).matched)) {
        continue;
      }

      for (const phrase of cluster.strongPhrases) {
        const m = matchPhraseSmart(doc, phrase);
        if (m.matched) {
          const weighted = m.score * (phrase.includes(' ') ? 1.08 : 1.0);
          if (weighted > itemBestScore) {
            itemBestScore = weighted;
            itemBestKw = phrase;
          }
        }
      }

      if (hasFinancialOrLevyContext && cluster.contextOnlyPhrases) {
        for (const phrase of cluster.contextOnlyPhrases) {
          const m = matchPhraseSmart(doc, phrase);
          if (m.matched) {
            const weighted = m.score * 0.92;
            if (weighted > itemBestScore) {
              itemBestScore = weighted;
              itemBestKw = phrase;
            }
          }
        }
      }
    }

    const dynamicCandidates = new Set<string>();
    for (const kw of item.keywords || []) {
      const cleanKw = kw.toLowerCase().trim();
      if (!cleanKw) continue;
      const genericSingleWords = new Set(['air', 'ujian', 'penilaian', 'asesmen', 'buku', 'layar', 'presentasi', 'map', 'pulpen', 'pensil', 'kebersihan']);
      if (genericSingleWords.has(cleanKw) && !hasFinancialOrLevyContext) continue;
      if (cleanKw === 'buku' && matchPhraseSmart(doc, 'buku tahunan').matched) continue;
      if (cleanKw === 'bangku' && matchPhraseSmart(doc, 'uang bangku').matched) continue;
      dynamicCandidates.add(cleanKw);
    }

    const nameWords = item.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !INDONESIAN_STOP_FILLERS.has(w));
    for (let i = 0; i + 1 < nameWords.length; i++) {
      dynamicCandidates.add(`${nameWords[i]} ${nameWords[i + 1]}`);
    }

    for (const cand of dynamicCandidates) {
      const m = matchPhraseSmart(doc, cand);
      if (m.matched) {
        const weighted = m.score * (cand.includes(' ') ? 1.05 : 0.94);
        if (weighted > itemBestScore) {
          itemBestScore = weighted;
          itemBestKw = cand;
        }
      }
    }

    if (itemBestScore >= 0.78) {
      if (!bestMatch || itemBestScore > bestMatch.score) {
        bestMatch = {
          item,
          matchedKeyword: itemBestKw,
          score: itemBestScore,
        };
      }
    }
  }

  // Purely informational reminders without fee context must never trigger duplicate funding flags.
  if (bestMatch && !hasFinancialOrLevyContext) {
    return null;
  }

  return bestMatch;
}

export function findMatchingSchoolComposition(
  schoolContext: SchoolScannerContext | undefined,
  pattern: RegExp
): { label: string; amount: number; stage: string; code: string } | null {
  if (!schoolContext) return null;

  const pools: Array<{ list?: BudgetComposition[]; stage: string; prefix: string }> = [
    { list: schoolContext.compositions, stage: 'RKAS Tahunan', prefix: 'RKAS-KOMP' },
    { list: schoolContext.tahap1Compositions, stage: 'Tahap 1', prefix: 'RKAS-T1' },
    { list: schoolContext.tahap2Compositions, stage: 'Tahap 2', prefix: 'RKAS-T2' },
  ];

  for (const pool of pools) {
    if (!pool.list) continue;
    for (let idx = 0; idx < pool.list.length; idx++) {
      const c = pool.list[idx];
      const hay = `${c.label} ${c.description || ''}`;
      if (pattern.test(hay) && c.amount > 0) {
        return {
          label: c.label,
          amount: c.amount,
          stage: pool.stage,
          code: `${pool.prefix}-0${idx + 1}`,
        };
      }
    }
  }
  return null;
}

export function matchKamusBospAndCompositions(
  doc: EnrichedMessageDoc,
  schoolContext: SchoolScannerContext | undefined,
  coercion: CoercionLevyAnalysis
): KamusBospRuleMatch | null {
  const formatRp = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  interface RuleDef {
    id: string;
    categoryTitle: string;
    kind: KamusBospRuleMatch['kind'];
    requiresFinancialOrSanction: boolean;
    compositionRegex?: RegExp;
    phrases: string[];
    contextOnlyPhrases?: string[];
    primaryRegulation: string;
    statusTitleDanger: string;
    statusTitleSafe?: string;
    legalNoteDanger: string;
    legalNoteSafe?: string;
    buildFact: KamusBospRuleMatch['bospFactBuilder'];
  }

  const rules: RuleDef[] = [
    {
      id: 'kamus-academic-sanction',
      categoryTitle: 'Penahanan Hak Akademik / Kartu Ujian / Rapor / Ijazah',
      kind: 'ACADEMIC_RIGHTS_SANCTION',
      requiresFinancialOrSanction: false,
      phrases: [
        'kartu ujian ditahan',
        'kartu ujian belum bisa',
        'tidak boleh ikut ujian',
        'tidak bisa ikut ujian',
        'dilarang ikut ujian',
        'belum bisa ikut ujian',
        'rapor ditahan',
        'rapor belum bisa diambil',
        'ijazah ditahan',
        'ijazah belum bisa diambil',
        'tebus ijazah',
        'tebus rapor',
      ],
      primaryRegulation: 'UU Sisdiknas 20/2003 Pasal 34 & Permendikbud 75/2016',
      statusTitleDanger: 'Terindikasi Pelanggaran Hak Akademik & Penahanan Dokumen Siswa',
      legalNoteDanger:
        'Sekolah dilarang keras menahan kartu ujian, melarang siswa mengikuti evaluasi belajar, atau menahan rapor/ijazah dengan alasan tunggakan administrasi maupun iuran.',
      buildFact: ({ schoolName }) =>
        `Pesan mengandung ancaman pembatasan hak akademik peserta didik di ${schoolName} (penahanan kartu ujian/rapor/ijazah). Dalam aturan BOSP nasional, kendala biaya orang tua tidak boleh menghalangi hak evaluasi belajar siswa.`,
    },
    {
      id: 'kamus-ppdb-daftar-ulang',
      categoryTitle: 'Biaya PPDB / SPMB, Daftar Ulang & MPLS Siswa Baru',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /ppdb|spmb|penerimaan|operasional kbm|administrasi/i,
      phrases: [
        'daftar ulang',
        'uang daftar ulang',
        'biaya daftar ulang',
        'uang pendaftaran',
        'biaya pendaftaran',
        'formulir pendaftaran',
        'uang formulir',
        'biaya ppdb',
        'uang ppdb',
        'biaya spmb',
        'uang spmb',
        'uang mpls',
        'biaya mpls',
        'uang mos',
        'tes masuk',
      ],
      contextOnlyPhrases: ['ppdb', 'spmb', 'mpls'],
      primaryRegulation: 'Permendikdasmen 8/2026 & Permendikbud 44/2012 Pasal 9',
      statusTitleDanger: 'Terindikasi Pungutan PPDB / Daftar Ulang (Sudah Dijamin BOSP)',
      legalNoteDanger:
        'Sesuai Juknis BOSP Permendikdasmen No. 8/2026 dan Permendikbud No. 44/2012, seluruh pembiayaan pelaksanaan PPDB/SPMB, daftar ulang tahunan, dan MPLS ditanggung penuh oleh dana BOSP tanpa pungutan.',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `Komponen penerimaan siswa baru & operasional KBM di ${schoolName} telah dialokasikan dalam RKAS BOSP pada pos "${compMatch.label}" sebesar ${formatRp(compMatch.amount)}. Penarikan biaya daftar ulang/PPDB (${tarikanStr}) bertentangan dengan Juknis BOSP.`
          : `Sesuai Kamus BOSP Nasional, seluruh biaya formulir, PPDB/SPMB, daftar ulang kenaikan kelas, dan MPLS di ${schoolName} wajib dibiayai pos operasional BOSP dan dilarang dibebankan kepada wali murid (${tarikanStr}).`,
    },
    {
      id: 'kamus-asesmen-ujian-anbk',
      categoryTitle: 'Biaya Pelaksanaan Ujian, Asesmen, ANBK & UKK',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /asesmen|ujian|anbk|evaluasi|kertas|operasional kbm/i,
      phrases: [
        'uang ujian',
        'biaya ujian',
        'iuran ujian',
        'uang ulangan',
        'uang semester',
        'biaya semester',
        'uang uts',
        'uang uas',
        'uang pts',
        'uang pas',
        'uang pat',
        'biaya sumatif',
        'uang anbk',
        'biaya anbk',
        'simulasi anbk',
        'uang ukk',
        'biaya ukk',
        'uji kompetensi',
        'ujian praktik',
        'ujian sekolah',
        'biaya legalisir',
      ],
      contextOnlyPhrases: ['anbk', 'ukk', 'uts', 'uas', 'pts', 'pas', 'sumatif'],
      primaryRegulation: 'Permendikdasmen 8/2026 & Permendikbudristek 21/2022',
      statusTitleDanger: 'Terindikasi Pungutan Biaya Ujian / Asesmen (Sudah Dibiayai BOSP)',
      legalNoteDanger:
        'Berdasarkan Juknis BOSP Permendikdasmen No. 8/2026, seluruh operasional asesmen akademik, ulangan harian, PTS/PAS, ANBK, hingga Uji Kompetensi Keahlian (UKK) merupakan komponen resmi belanja BOSP.',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `${schoolName} memiliki alokasi RKAS BOSP resmi pada pos "${compMatch.label}" senilai ${formatRp(compMatch.amount)} yang mencakup operasional asesmen & ujian siswa. Tarikan ${tarikanStr}/siswa terindikasi pendanaan ganda.`
          : `Pelaksanaan ujian semester, asesmen nasional (ANBK), ujian praktik, dan UKK merupakan komponen resmi Kamus BOSP yang dilarang dipungut kembali dari orang tua murid (${tarikanStr}).`,
    },
    {
      id: 'kamus-ekskul-praktikum',
      categoryTitle: 'Biaya Ekstrakurikuler, Praktikum & Bahan Ajar KBM',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /ekstrakurikuler|praktikum|pembelajaran|operasional kbm|multimedia/i,
      phrases: [
        'uang ekskul',
        'iuran ekskul',
        'biaya ekstrakurikuler',
        'iuran ekstrakurikuler',
        'uang pramuka',
        'iuran pramuka',
        'uang praktikum',
        'biaya praktikum',
        'iuran praktikum',
        'bahan praktik',
        'alat praktik',
        'uang laboratorium',
        'biaya lab',
        'alat peraga',
      ],
      contextOnlyPhrases: ['ekstrakurikuler', 'pramuka', 'praktikum'],
      primaryRegulation: 'Permendikdasmen 8/2026 & Permendikbudristek 63/2023 Pasal 61',
      statusTitleDanger: 'Terindikasi Pungutan Praktikum / Ekstrakurikuler (Komponen BOSP)',
      legalNoteDanger:
        'Juknis BOSP Permendikdasmen No. 8/2026 menetapkan bahan habis pakai praktikum, kegiatan pembelajaran, dan ekstrakurikuler wajib sekolah dibiayai melalui dana BOSP.',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `Kebutuhan pembelajaran, praktikum, dan kegiatan kesiswaan di ${schoolName} termasuk dalam pos RKAS "${compMatch.label}" (${formatRp(compMatch.amount)}). Pungutan ${tarikanStr}/siswa berpotensi tumpang tindih dengan BOSP.`
          : `Pengadaan bahan habis pakai praktikum dan operasional ekstrakurikuler sekolah merupakan komponen resmi Kamus BOSP sehingga tidak boleh dipungut paksa sebesar ${tarikanStr} dari wali murid.`,
    },
    {
      id: 'kamus-daya-jasa-utilitas',
      categoryTitle: 'Tagihan Langganan Daya & Jasa (Listrik, Air, Internet)',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /listrik|air|internet|daya|wifi|operasional kbm/i,
      phrases: [
        'uang listrik',
        'iuran listrik',
        'bayar listrik',
        'token listrik',
        'tagihan listrik',
        'uang air',
        'iuran air',
        'tagihan pdam',
        'bayar pdam',
        'langganan daya',
      ],
      contextOnlyPhrases: ['listrik', 'pdam'],
      primaryRegulation: 'Permendikdasmen 8/2026 (Komponen Langganan Daya & Jasa)',
      statusTitleDanger: 'Terindikasi Pungutan Utilitas Sekolah (Listrik/Air Dijamin BOSP)',
      legalNoteDanger:
        'Pembayaran tagihan listrik PLN, air bersih/PDAM, dan internet sekolah merupakan komponen pokok Langganan Daya dan Jasa pada Juknis BOSP Permendikdasmen No. 8/2026.',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `Utilitas operasional ${schoolName} telah dianggarkan pada pos RKAS "${compMatch.label}" senilai ${formatRp(compMatch.amount)}. Membebankan iuran listrik/air (${tarikanStr}) kepada siswa melanggar ketentuan BOSP.`
          : `Langganan daya dan jasa (listrik, air, telekomunikasi) merupakan beban operasional rutin BOSP ${schoolName}, bukan tanggungan iuran orang tua murid (${tarikanStr}).`,
    },
    {
      id: 'kamus-pemeliharaan-sarpras',
      categoryTitle: 'Pemeliharaan & Perawatan Ringan Ruang Kelas / Sarpras',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /pemeliharaan|sarana|prasarana|sanitasi|ruang belajar/i,
      phrases: [
        'uang cat',
        'cat kelas',
        'pengecatan kelas',
        'iuran cat',
        'renovasi kelas',
        'perbaikan kelas',
        'atap bocor',
        'perbaikan plafon',
        'keramik kelas',
        'pintu kelas',
        'jendela kelas',
        'kaca kelas',
        'lampu kelas',
        'gorden kelas',
        'tirai kelas',
        'uang kebersihan',
        'iuran kebersihan',
      ],
      contextOnlyPhrases: ['pengecatan', 'renovasi', 'plafon', 'gorden'],
      primaryRegulation: 'Permendikdasmen 8/2026 & Permendikbudristek 63/2023 Pasal 61',
      statusTitleDanger: 'Terindikasi Pungutan Pemeliharaan Kelas (Sudah Dicover BOSP)',
      legalNoteDanger:
        'Pengecatan, penggantian lampu/kaca/pintu, dan perawatan ringan ruang belajar merupakan komponen resmi Pemeliharaan Sarana dan Prasarana Sekolah pada dana BOSP (alokasi s.d. ≥20% di Juknis 2026).',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `${schoolName} telah mengalokasikan dana BOSP untuk pemeliharaan sarpras pada pos "${compMatch.label}" sebesar ${formatRp(compMatch.amount)}. Menarik patungan perawatan kelas (${tarikanStr}) terindikasi tumpang tindih anggaran.`
          : `Perawatan ringan ruang kelas (cat, lampu, pintu, kebersihan) wajib dibiayai melalui pos Pemeliharaan Sarana Prasarana BOSP ${schoolName}, bukan dari patungan wali murid (${tarikanStr}).`,
    },
    {
      id: 'kamus-honor-gtk',
      categoryTitle: 'Honorarium Guru / Tendik & Pengembangan Profesi GTK',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /honor|guru|tendik|profesi/i,
      phrases: [
        'honor guru',
        'uang honor',
        'gaji guru',
        'patungan gaji',
        'insentif guru',
        'uang lelah guru',
        'tunjangan guru',
        'uang pengawas',
        'pelatihan guru',
        'workshop guru',
      ],
      primaryRegulation: 'Permendikdasmen 8/2026 & SE Mendikdasmen 6/2026',
      statusTitleDanger: 'Terindikasi Pungutan Honorarium GTK (Komponen Resmi BOSP)',
      legalNoteDanger:
        'Pembayaran honor guru/tendik non-ASN (maks. 20% Negeri / 40% Swasta sesuai Permendikdasmen 8/2026) serta peningkatan kompetensi guru dibiayai melalui RKAS BOSP, bukan iuran insidental kelas.',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `${schoolName} telah memiliki alokasi resmi "${compMatch.label}" sebesar ${formatRp(compMatch.amount)} dalam RKAS BOSP. Penarikan iuran honor/insentif guru (${tarikanStr}) dari siswa tidak dibenarkan.`
          : `Kesejahteraan/honorarium pendidik dan pelatihan GTK diatur ketat melalui pagu BOSP resmi ${schoolName} dan dilarang dipungut secara langsung di grup kelas (${tarikanStr}).`,
    },
    {
      id: 'kamus-administrasi-sekolah',
      categoryTitle: 'Biaya Administrasi Sekolah, Kartu Pelajar & Dapodik',
      kind: 'BOSP_FUNDED_OPERATIONAL',
      requiresFinancialOrSanction: true,
      compositionRegex: /administrasi|operasional kbm|dapodik/i,
      phrases: [
        'uang administrasi',
        'biaya administrasi',
        'kartu pelajar',
        'uang kartu pelajar',
        'kartu osis',
        'biaya dapodik',
        'uang dapodik',
        'urus nisn',
      ],
      primaryRegulation: 'Permendikdasmen 8/2026 (Administrasi Kegiatan Sekolah)',
      statusTitleDanger: 'Terindikasi Pungutan Administrasi Sekolah (Sudah Dibiayai BOSP)',
      legalNoteDanger:
        'Pengelolaan Dapodik, pencetakan kartu pelajar/OSIS, dan surat-menyurat kesiswaan termasuk komponen Administrasi Kegiatan Sekolah dalam Juknis BOSP.',
      buildFact: ({ schoolName, compMatch, tarikanStr }) =>
        compMatch
          ? `Administrasi kesiswaan di ${schoolName} tercakup dalam pos RKAS "${compMatch.label}" (${formatRp(compMatch.amount)}). Pungutan ${tarikanStr} untuk kartu pelajar/administrasi berindikasi duplikasi BOSP.`
          : `Layanan administrasi sekolah, Dapodik, dan kartu identitas siswa merupakan layanan dasar operasional BOSP di ${schoolName} yang bebas pungutan (${tarikanStr}).`,
    },
    {
      id: 'kamus-uang-gedung-pangkal',
      categoryTitle: 'Uang Gedung / Uang Pangkal / Pembangunan Ruang Baru',
      kind: 'PROHIBITED_STRUCTURAL_LEVY',
      requiresFinancialOrSanction: true,
      phrases: [
        'uang gedung',
        'uang pangkal',
        'uang bangku',
        'jual beli bangku',
        'dana pembangunan',
        'uang pembangunan',
        'sumbangan institusi',
        'dsp',
        'spi',
        'bangun gedung',
        'bangun ruang kelas',
        'pembangunan pagar',
        'pembangunan masjid',
      ],
      primaryRegulation: 'Permendikbud 75/2016 Pasal 12 & Permendikbud 44/2012',
      statusTitleDanger: 'Terindikasi Pungutan Uang Gedung / Uang Pangkal Mengikat',
      legalNoteDanger:
        'Dana BOSP dilarang membiayai pembangunan gedung baru, DAN sesuai Permendikbud No. 44/2012 serta Permendikbud No. 75/2016 Pasal 12, satuan pendidikan negeri maupun komite sekolah dilarang melakukan pungutan wajib uang gedung/bangku kepada siswa.',
      buildFact: ({ schoolName, schoolType, tarikanStr }) =>
        schoolType.toLowerCase() === 'swasta'
          ? `Pembangunan gedung baru memang berada di luar cakupan BOSP. Namun di ${schoolName}, penarikan uang gedung/pembangunan (${tarikanStr}) dengan paksaan, ancaman penahanan hak ujian/rapor, atau melalui komite secara mengikat tetap melanggar perlindungan hak belajar siswa.`
          : `${schoolName} berstatus Sekolah Negeri yang dilarang keras memungut uang gedung, uang pangkal, maupun uang bangku (${tarikanStr}) dalam bentuk pungutan wajib yang menentukan besaran dan tenggat waktu.`,
    },
    {
      id: 'kamus-spp-komite-bulanan',
      categoryTitle: 'Tagihan SPP / Iuran Komite Bulanan Mengikat',
      kind: 'PROHIBITED_STRUCTURAL_LEVY',
      requiresFinancialOrSanction: true,
      phrases: [
        'uang komite',
        'iuran komite',
        'dana komite',
        'tagihan komite',
        'uang spp',
        'bayar spp',
        'tagihan spp',
        'tunggakan spp',
        'iuran bulanan',
        'uang bulanan',
      ],
      contextOnlyPhrases: ['spp', 'komite'],
      primaryRegulation: 'Permendikbud 75/2016 Pasal 10 & 12 & Permendikbud 44/2012',
      statusTitleDanger: 'Terindikasi Pungutan Wajib Komite / Iuran Bulanan Mengikat',
      legalNoteDanger:
        'Permendikbud No. 75/2016 Pasal 10 ayat (2) & Pasal 12 menegaskan Komite Sekolah HANYA boleh menggalang bantuan/sumbangan sukarela, dan DILARANG menarik pungutan yang menentukan nominal tetap maupun batas waktu bagi peserta didik/orang tua.',
      buildFact: ({ schoolName, schoolType, tarikanStr }) =>
        schoolType.toLowerCase() === 'negeri'
          ? `Sebagai satuan pendidikan Negeri, ${schoolName} telah dibiayai negara melalui BOSP dan dilarang memungut SPP maupun iuran bulanan komite yang bersifat wajib/mengikat (${tarikanStr}).`
          : `Penarikan dana komite/bulanan (${tarikanStr}) di ${schoolName} disertai unsur kewajiban, tenggat jatuh tempo, atau ancaman sanksi akademik yang bertentangan dengan prinsip perlindungan hak peserta didik.`,
    },
    {
      id: 'kamus-seragam-atribut',
      categoryTitle: 'Pembelian Seragam Sekolah, Kain Batik & Atribut Koperasi',
      kind: 'UNIFORM_ATTIRE_RULE',
      requiresFinancialOrSanction: false,
      phrases: [
        'uang seragam',
        'beli seragam',
        'biaya seragam',
        'tebus seragam',
        'paket seragam',
        'seragam batik',
        'kain batik',
        'seragam olahraga',
        'baju olahraga',
        'seragam pramuka',
        'atribut sekolah',
        'beli di koperasi',
        'koperasi sekolah',
      ],
      contextOnlyPhrases: ['seragam'],
      primaryRegulation: 'PP 17/2010 Pasal 181 & Permendikbud 50/2022 Pasal 12',
      statusTitleDanger: 'Terindikasi Pemaksaan Pembelian Seragam / Atribut di Sekolah',
      statusTitleSafe: 'Kebutuhan Pribadi Siswa (Seragam Bukan Komponen BOSP)',
      legalNoteDanger:
        'Berdasarkan PP No. 17/2010 Pasal 181 huruf a dan Permendikbud No. 50/2022 Pasal 12, pendidik, tenaga kependidikan, dan komite sekolah DILARANG memaksa atau mengaitkan pembelian pakaian seragam/atribut di sekolah/koperasi dengan penerimaan maupun kenaikan kelas siswa.',
      legalNoteSafe:
        'Seragam sekolah merupakan tanggung jawab pribadi orang tua (bukan anggaran BOSP), dan orang tua bebas memperolehnya sendiri di luar sekolah tanpa kewajiban membeli melalui koperasi sekolah.',
      buildFact: ({ schoolName, tarikanStr, isMandatory }) =>
        isMandatory
          ? `Seragam memang tidak dibiayai dana BOSP ${schoolName}, NAMUN sekolah/koperasi dilarang mewajibkan pembelian seragam/kain batik terpusat sebesar ${tarikanStr} atau mengaitkannya dengan syarat daftar ulang/ujian.`
          : `Pakaian seragam siswa tidak termasuk komponen belanja BOSP ${schoolName}. Selama tidak diwajibkan membeli di sekolah/koperasi, pengadaan seragam menjadi hak mandiri masing-masing wali murid.`,
    },
    {
      id: 'kamus-non-rkas-paguyuban',
      categoryTitle: 'Kegiatan Non-RKAS / Paguyuban (Wisata, Wisuda, Kas & Sosial)',
      kind: 'NON_RKAS_PAGUYUBAN',
      requiresFinancialOrSanction: false,
      phrases: [
        'study tour',
        'karya wisata',
        'outing class',
        'jalan jalan',
        'piknik',
        'rekreasi',
        'perpisahan',
        'wisuda',
        'purnawiyata',
        'pelepasan siswa',
        'buku tahunan',
        'yearbook',
        'album kenangan',
        'pentas seni',
        'pensi',
        'kaos kelas',
        'baju kelas',
        'jaket angkatan',
        'seragam angkatan',
        'kas kelas',
        'uang kas',
        'kas paguyuban',
        'kenang kenangan',
        'hadiah guru',
        'buka bersama',
        'bukber',
        'halal bihalal',
        'iuran qurban',
        'santunan sosial',
        'sumbangan sosial',
        'dana sosial',
        'uang duka',
      ],
      contextOnlyPhrases: ['wisata', 'tour', 'outing', 'kaos', 'jaket', 'infaq', 'sedekah', 'santunan', 'qurban'],
      primaryRegulation: 'Permendikbud 75/2016 Pasal 10 & 12 & SE Kemendikbudristek 14/2023',
      statusTitleDanger: 'Terindikasi Pemaksaan Iuran Kegiatan Non-BOSP',
      statusTitleSafe: 'Kegiatan Non-BOSP (Sah Hanya Jika Sukarela Murni)',
      legalNoteDanger:
        'Berdasarkan Permendikbud No. 75/2016 Pasal 10 & 12 serta SE Kemendikbudristek No. 14/2023 (terkait wisuda/kegiatan seremonial), kegiatan non-RKAS TIDAK BOLEH diwajibkan, ditetapkan tarif mengikat, diberi tenggat paksaan, atau berdampak pada nilai/hak siswa.',
      legalNoteSafe:
        'Sesuai Permendikbud No. 75/2016, inisiatif paguyuban/sosial di luar RKAS BOSP diperbolehkan HANYA apabila murni sukarela, seikhlasnya, tidak mengikat, dan tanpa konsekuensi bagi siswa yang tidak berpartisipasi.',
      buildFact: ({ schoolName, matchedPhrase, isMandatory, tarikanStr }) =>
        isMandatory
          ? `Kegiatan "${matchedPhrase}" tidak dibiayai dana BOSP ${schoolName}, namun pesan ini mengandung unsur pemaksaan/tarif mengikat (${tarikanStr}) yang dilarang dalam Permendikbud No. 75/2016.`
          : `Kegiatan "${matchedPhrase}" berada di luar cakupan belanja wajib RKAS BOSP ${schoolName}. Karena bersifat himbauan sukarela tanpa paksaan maupun batas waktu mengikat, kegiatan ini tidak melanggar dana BOSP.`,
    },
  ];

  let best: KamusBospRuleMatch | null = null;

  for (const rule of rules) {
    if (
      rule.requiresFinancialOrSanction &&
      !coercion.hasFinancialOrLevyContext &&
      !coercion.hasAcademicSanction
    ) {
      continue;
    }

    let bestScore = 0;
    let bestPhrase = '';

    for (const p of rule.phrases) {
      const m = matchPhraseSmart(doc, p);
      if (m.matched) {
        const weighted = m.score * (p.includes(' ') ? 1.07 : 1.0);
        if (weighted > bestScore) {
          bestScore = weighted;
          bestPhrase = p;
        }
      }
    }

    if (coercion.hasFinancialOrLevyContext && rule.contextOnlyPhrases) {
      for (const p of rule.contextOnlyPhrases) {
        const m = matchPhraseSmart(doc, p);
        if (m.matched) {
          const weighted = m.score * 0.93;
          if (weighted > bestScore) {
            bestScore = weighted;
            bestPhrase = p;
          }
        }
      }
    }

    if (bestScore >= 0.78) {
      const priorityMult =
        rule.kind === 'ACADEMIC_RIGHTS_SANCTION'
          ? 1.12
          : rule.kind === 'BOSP_FUNDED_OPERATIONAL'
          ? 1.08
          : rule.kind === 'PROHIBITED_STRUCTURAL_LEVY'
          ? 1.05
          : 1.0;
      const finalScore = bestScore * priorityMult;

      if (!best || finalScore > best.score) {
        const matchedComposition = rule.compositionRegex
          ? findMatchingSchoolComposition(schoolContext, rule.compositionRegex)
          : null;

        best = {
          id: rule.id,
          categoryTitle: rule.categoryTitle,
          matchedPhrase: bestPhrase,
          score: finalScore,
          kind: rule.kind,
          primaryRegulation: rule.primaryRegulation,
          statusTitleDanger: rule.statusTitleDanger,
          statusTitleSafe: rule.statusTitleSafe,
          bospFactBuilder: rule.buildFact,
          legalNoteDanger: rule.legalNoteDanger,
          legalNoteSafe: rule.legalNoteSafe,
          matchedComposition,
        };
      }
    }
  }

  return best;
}

export function analyzeChatWithBospItems(
  ocrText: string,
  bospItems: BospRealizationItem[],
  schoolName: string = 'SMK TI BAZMA',
  studentCount: number = 90,
  sourceType: 'screenshot' | 'direct_text' = 'screenshot',
  schoolContext?: SchoolScannerContext
): AiScanAnalysisResult {
  const effectiveSchoolName = schoolContext?.schoolName || schoolName || 'SMK TI BAZMA';
  const effectiveStudentCount = schoolContext?.studentCount || studentCount || 90;
  const effectiveSchoolType = schoolContext?.schoolType || 'Swasta';

  const doc = buildEnrichedMessageDoc(ocrText || '');
  const detectedAmount = extractMonetaryAmounts(ocrText || '', doc.normalizedText);
  const coercion = analyzeCoercionAndLevyIntent(doc, ocrText || '', detectedAmount);

  const itemMatch = matchSchoolBudgetItems(
    doc,
    bospItems,
    coercion.hasFinancialOrLevyContext
  );

  const kamusMatch = matchKamusBospAndCompositions(doc, schoolContext, coercion);

  const lines = (ocrText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const detectedQuote = lines.slice(0, 6).join(' ') || '[tidak terbaca]';

  const totalCollectedEstimate = detectedAmount
    ? detectedAmount * effectiveStudentCount
    : null;

  const formatRp = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  const tarikanStr = detectedAmount ? formatRp(detectedAmount) : 'nominal yang ditagihkan';
  const totalTarikanStr = totalCollectedEstimate
    ? formatRp(totalCollectedEstimate)
    : 'belum tertera nominal per siswa';

  const emptyDiagnostics: ImageDiagnostics = {
    width: 0,
    height: 0,
    aspectRatio: 1,
    orientation: 'portrait',
    isTallScreenshot: false,
    isLowResolution: false,
    meanBrightness: 128,
    contrastScore: 70,
    sharpnessScore: 80,
    compressionArtifactScore: 10,
    backgroundComplexityScore: 15,
    dominantTheme: 'light',
    qualityWarnings: [],
    structuralZones: {
      headerBandY: 0,
      footerBandY: 0,
      hasEmbeddedMedia: false,
      embeddedMediaBoxes: [],
    },
    riskZones: [],
    candidateZones: [],
  };

  const matchedItem =
    itemMatch &&
    (!kamusMatch ||
      kamusMatch.kind !== 'ACADEMIC_RIGHTS_SANCTION' ||
      itemMatch.score >= kamusMatch.score)
      ? itemMatch.item
      : null;

  let statusType: 'danger' | 'safe' | 'neutral' = 'neutral';
  let statusTitle = 'Pesan Informatif Sekolah (Tidak Ditemukan Penarikan Biaya)';
  let bospFact = `AI telah memeriksa struktur kalimat kata demi kata dan tidak menemukan penarikan iuran maupun duplikasi anggaran BOSP aktif di ${effectiveSchoolName}.`;
  let legalNote =
    'Jika terdapat penarikan biaya lisan atau informasi tambahan di luar pesan ini, Anda tetap dapat melaporkan secara anonim melalui kanal pengaduan.';
  let confidenceScore = 88;
  let detectedItemKeyword: string | null = null;

  let isFundedByBosp = false;
  let budgetStatusLabel = 'Tidak Ada Tagihan Anggaran';
  let budgetItemCode: string | null = null;
  let budgetAllocatedAmount: number | null = null;
  let budgetStage: string | null = null;
  let budgetFactText = `Pesan tidak memuat penarikan biaya atas komponen RKAS BOSP ${effectiveSchoolName}.`;
  let discrepancyVerdict = 'Tidak terindikasi duplikasi belanja operasional BOSP.';

  let verdictType: ThreeWayComparison['bospPolicy']['verdictType'] = 'BELUM_TERIDENTIFIKASI';
  let verdictTitle = 'Tidak Ditemukan Indikasi Pungutan Liar';
  let primaryRegulation = 'Permendikdasmen 8/2026 & Permendikbud 75/2016';
  let policySummary =
    'Pesan yang dianalisis tidak menunjukkan penarikan biaya yang bertentangan dengan Juknis BOSP maupun aturan sumbangan pendidikan.';
  let isMandatoryEffective = coercion.isMandatory;
  let effectiveToneBadge = coercion.toneBadge;

  if (matchedItem && itemMatch) {
    statusType = 'danger';
    detectedItemKeyword = itemMatch.matchedKeyword || matchedItem.name;
    isFundedByBosp = true;
    budgetStatusLabel = 'Sudah Dibiayai BOSP Negara';
    budgetItemCode = matchedItem.code;
    budgetAllocatedAmount = matchedItem.amount;
    budgetStage = matchedItem.stage;
    isMandatoryEffective = true;
    if (!coercion.isMandatory) {
      effectiveToneBadge = 'Tarikan Duplikat BOSP';
    }

    const itemAmountStr = formatRp(matchedItem.amount);
    statusTitle = 'Terindikasi Tumpang Tindih dengan Dana BOSP';
    bospFact = `${effectiveSchoolName} telah merealisasikan "${matchedItem.name}" senilai ${itemAmountStr} pada ${matchedItem.stage} (${matchedItem.date}, Kode ${matchedItem.code}). Penarikan ${tarikanStr}/siswa${totalCollectedEstimate ? ` (estimasi ${totalTarikanStr} dari ${effectiveStudentCount} siswa)` : ''} terindikasi tumpang tindih anggaran BOSP.`;
    budgetFactText = `${effectiveSchoolName} telah mencairkan dana BOSP resmi sebesar ${itemAmountStr} untuk "${matchedItem.name}" (${matchedItem.stage}, Kode: ${matchedItem.code}).`;
    legalNote =
      'Sesuai Permendikbudristek No. 63/2023 Pasal 61, Permendikdasmen No. 8/2026, dan Permendikbud No. 75/2016 Pasal 12, sekolah maupun komite dilarang memungut biaya atas sarana/operasional yang telah dibiayai dana BOSP.';
    discrepancyVerdict =
      'TUMPANG TINDIH 100% — Barang/fasilitas telah ditanggung negara melalui RKAS BOSP sekolah.';
    verdictType = 'PUNGLI_BOSP';
    verdictTitle = 'Terindikasi Pungutan Liar (Pendanaan Ganda BOSP)';
    primaryRegulation = 'Permendikbudristek 63/2023 Pasal 61 & Permendikdasmen 8/2026';
    policySummary =
      'Satuan pendidikan penerima BOSP dilarang keras menarik iuran/patungan wali murid untuk komponen belanja yang sudah dianggarkan dan dicairkan melalui dana BOSP resmi.';
    confidenceScore = Math.min(99, Math.round(92 + Math.min(7, itemMatch.score * 6)));
  } else if (kamusMatch) {
    detectedItemKeyword = kamusMatch.matchedPhrase;
    const compMatch = kamusMatch.matchedComposition;
    const factCtx = {
      schoolName: effectiveSchoolName,
      schoolType: effectiveSchoolType,
      matchedPhrase: kamusMatch.matchedPhrase,
      compMatch,
      tarikanStr,
      totalTarikanStr,
      studentCount: effectiveStudentCount,
      isMandatory: coercion.isMandatory,
    };

    if (kamusMatch.kind === 'BOSP_FUNDED_OPERATIONAL') {
      statusType = 'danger';
      isFundedByBosp = true;
      isMandatoryEffective = true;
      if (!coercion.isMandatory) {
        effectiveToneBadge = 'Tarikan Komponen BOSP';
      }
      budgetStatusLabel = compMatch
        ? 'Sudah Tercakup Pagu RKAS BOSP'
        : 'Wajib Dijamin Dana BOSP';
      budgetItemCode = compMatch ? compMatch.code : 'KAMUS-BOSP';
      budgetAllocatedAmount = compMatch
        ? compMatch.amount
        : schoolContext?.totalBosp || null;
      budgetStage = compMatch ? compMatch.stage : 'Pagu Tahunan BOSP';
      statusTitle = kamusMatch.statusTitleDanger;
      bospFact = kamusMatch.bospFactBuilder(factCtx);
      budgetFactText = compMatch
        ? `Pos "${compMatch.label}" tercatat dalam RKAS BOSP ${effectiveSchoolName} sebesar ${formatRp(compMatch.amount)} (${compMatch.stage}).`
        : `Termasuk komponen operasional wajib yang dijamin Juknis BOSP di ${effectiveSchoolName}.`;
      legalNote = kamusMatch.legalNoteDanger;
      discrepancyVerdict =
        'MELANGGAR KAMUS BOSP — Komponen operasional ini wajib dibiayai dana BOSP tanpa pungutan.';
      verdictType = 'PUNGLI_REGULASI_BOSP';
      verdictTitle = kamusMatch.statusTitleDanger;
      primaryRegulation = kamusMatch.primaryRegulation;
      policySummary = kamusMatch.legalNoteDanger;
      confidenceScore = 95;
    } else if (
      kamusMatch.kind === 'ACADEMIC_RIGHTS_SANCTION' ||
      kamusMatch.kind === 'PROHIBITED_STRUCTURAL_LEVY'
    ) {
      const isSwastaPureVoluntary =
        kamusMatch.kind === 'PROHIBITED_STRUCTURAL_LEVY' &&
        effectiveSchoolType.toLowerCase() === 'swasta' &&
        coercion.hasPureVoluntary &&
        !coercion.isMandatory;

      if (isSwastaPureVoluntary) {
        statusType = 'safe';
        isFundedByBosp = false;
        budgetStatusLabel = 'Di Luar Pagu BOSP (Non-RKAS)';
        budgetItemCode = 'NON-RKAS';
        budgetAllocatedAmount = 0;
        statusTitle = 'Sumbangan Sukarela Pengembangan (Tanpa Paksaan)';
        bospFact = `Pembangunan fisik baru tidak dibiayai BOSP ${effectiveSchoolName}. Karena pesan bersifat sumbangan sukarela murni tanpa tarif wajib maupun tenggat paksaan, hal ini tidak melanggar aturan BOSP.`;
        legalNote =
          'Sumbangan pengembangan hanya sah selama tidak mengikat, tidak mematok nominal minimal, dan tidak mengurangi hak belajar siswa.';
        discrepancyVerdict = 'NON-BOSP — Sumbangan sukarela tanpa unsur pemaksaan.';
        verdictType = 'SUMBANGAN_SUKARELA_SAH';
        verdictTitle = 'Sumbangan Sukarela Sah';
        primaryRegulation = 'Permendikbud 75/2016 Pasal 10 & 12';
        policySummary = legalNote;
        confidenceScore = 90;
      } else {
        statusType = 'danger';
        isFundedByBosp = false;
        isMandatoryEffective = true;
        if (!coercion.isMandatory) {
          effectiveToneBadge = 'Pungutan Dilarang';
        }
        budgetStatusLabel =
          kamusMatch.kind === 'ACADEMIC_RIGHTS_SANCTION'
            ? 'Pelanggaran Hak Belajar Siswa'
            : 'Dilarang Dipungut Mengikat';
        budgetItemCode = 'NON-RKAS';
        budgetAllocatedAmount = 0;
        statusTitle = kamusMatch.statusTitleDanger;
        bospFact = kamusMatch.bospFactBuilder(factCtx);
        budgetFactText = bospFact;
        legalNote = kamusMatch.legalNoteDanger;
        discrepancyVerdict =
          'MELANGGAR REGULASI — Pungutan struktural mengikat atau penyanderaan hak akademik siswa dilarang.';
        verdictType = 'PUNGLI_REGULASI_BOSP';
        verdictTitle = kamusMatch.statusTitleDanger;
        primaryRegulation = kamusMatch.primaryRegulation;
        policySummary = kamusMatch.legalNoteDanger;
        confidenceScore = 96;
      }
    } else if (kamusMatch.kind === 'UNIFORM_ATTIRE_RULE') {
      const isForcedSale =
        coercion.isMandatory ||
        (coercion.hasPaymentDirective && !coercion.hasPureVoluntary) ||
        (detectedAmount !== null && !coercion.hasPureVoluntary);

      isFundedByBosp = false;
      budgetStatusLabel = 'Kebutuhan Pribadi (Non-BOSP)';
      budgetItemCode = 'NON-RKAS';
      budgetAllocatedAmount = 0;
      primaryRegulation = kamusMatch.primaryRegulation;

      if (isForcedSale) {
        statusType = 'danger';
        isMandatoryEffective = true;
        if (effectiveToneBadge === 'Informatif') {
          effectiveToneBadge = 'Penjualan Terikat';
        }
        statusTitle = kamusMatch.statusTitleDanger;
        bospFact = kamusMatch.bospFactBuilder({ ...factCtx, isMandatory: true });
        legalNote = kamusMatch.legalNoteDanger;
        discrepancyVerdict =
          'MELANGGAR PP 17/2010 PASAL 181 — Sekolah/koperasi dilarang mewajibkan pembelian seragam di sekolah.';
        verdictType = 'PUNGLI_PEMAKSAAN';
        verdictTitle = kamusMatch.statusTitleDanger;
        policySummary = kamusMatch.legalNoteDanger;
        confidenceScore = 94;
      } else {
        statusType = coercion.hasFinancialOrLevyContext ? 'safe' : 'neutral';
        statusTitle =
          kamusMatch.statusTitleSafe || 'Ketentuan Seragam Siswa (Bukan Anggaran BOSP)';
        bospFact = kamusMatch.bospFactBuilder({ ...factCtx, isMandatory: false });
        legalNote = kamusMatch.legalNoteSafe || kamusMatch.legalNoteDanger;
        discrepancyVerdict =
          'NON-BOSP — Kebutuhan pribadi siswa, wali murid bebas membeli mandiri di luar sekolah.';
        verdictType = 'SUMBANGAN_SUKARELA_SAH';
        verdictTitle = statusTitle;
        policySummary = legalNote;
        confidenceScore = 90;
      }
    } else {
      isFundedByBosp = false;
      budgetStatusLabel = 'Di Luar Pagu BOSP (Non-RKAS)';
      budgetItemCode = 'NON-RKAS';
      budgetAllocatedAmount = 0;
      primaryRegulation = kamusMatch.primaryRegulation;

      if (coercion.isMandatory) {
        statusType = 'danger';
        statusTitle = coercion.isDisguisedCoercion
          ? 'Terindikasi Paksaan Terselubung Iuran Non-BOSP'
          : kamusMatch.statusTitleDanger;
        bospFact = kamusMatch.bospFactBuilder({ ...factCtx, isMandatory: true });
        legalNote = kamusMatch.legalNoteDanger;
        discrepancyVerdict =
          'MELANGGAR PERMENDIKBUD 75/2016 — Kegiatan non-RKAS dilarang dipaksakan atau dipatok tarif wajib.';
        verdictType = 'PUNGLI_PEMAKSAAN';
        verdictTitle = statusTitle;
        policySummary = kamusMatch.legalNoteDanger;
        confidenceScore = 94;
      } else {
        statusType = 'safe';
        statusTitle =
          kamusMatch.statusTitleSafe ||
          'Tidak Tercantum di RKAS BOSP (Sah Jika Sukarela Murni)';
        bospFact = kamusMatch.bospFactBuilder({ ...factCtx, isMandatory: false });
        legalNote = kamusMatch.legalNoteSafe || kamusMatch.legalNoteDanger;
        discrepancyVerdict =
          'NON-BOSP — Pengeluaran di luar anggaran sekolah, sah selama murni sukarela tanpa paksaan.';
        verdictType = 'SUMBANGAN_SUKARELA_SAH';
        verdictTitle = statusTitle;
        policySummary = legalNote;
        confidenceScore = 92;
      }
    }
  } else if (coercion.isMandatory && coercion.hasFinancialOrLevyContext) {
    statusType = 'danger';
    detectedItemKeyword = coercion.hasAcademicSanction
      ? 'Tagihan Disertai Ancaman Sanksi'
      : 'Pungutan / Iuran Mengikat';
    isFundedByBosp = false;
    budgetStatusLabel = 'Tidak Terdaftar di RKAS Resmi';
    budgetItemCode = 'NON-RKAS';
    budgetAllocatedAmount = 0;
    statusTitle = coercion.isDisguisedCoercion
      ? 'Terindikasi Pungutan Mengikat Berkedok Sumbangan'
      : 'Terindikasi Pungutan Wajib Tanpa Dasar RKAS BOSP';
    bospFact = `Pesan mewajibkan pembayaran ${tarikanStr}${coercion.matchedCoercionSignals.length > 0 ? ` dengan indikasi tekanan (${coercion.matchedCoercionSignals.slice(0, 3).join(', ')})` : ''} di luar mekanisme resmi BOSP ${effectiveSchoolName}.`;
    legalNote =
      'Berdasarkan Permendikbud No. 75/2016 Pasal 10 & 12, pihak sekolah maupun komite dilarang menarik pungutan wajib yang menentukan nominal tetap, batas waktu pelunasan, atau sanksi akademik.';
    discrepancyVerdict =
      'PUNGLI PEMAKSAAN — Penarikan biaya mengikat tanpa dasar komponen resmi negara.';
    verdictType = 'PUNGLI_PEMAKSAAN';
    verdictTitle = statusTitle;
    primaryRegulation = 'Permendikbud 75/2016 Pasal 10 & 12';
    policySummary = legalNote;
    confidenceScore = 92;
  } else if (coercion.hasPureVoluntary && coercion.hasFinancialOrLevyContext) {
    statusType = 'safe';
    detectedItemKeyword = 'Sumbangan Sukarela';
    isFundedByBosp = false;
    budgetStatusLabel = 'Di Luar Pagu BOSP (Sukarela)';
    budgetItemCode = 'NON-RKAS';
    budgetAllocatedAmount = 0;
    statusTitle = 'Himbauan Sumbangan Sukarela Murni (Bukan Dana BOSP)';
    bospFact = `Pesan merupakan ajakan partisipasi sukarela tanpa nominal mengikat, tanpa tenggat jatuh tempo, dan tidak tumpang tindih dengan belanja BOSP ${effectiveSchoolName}.`;
    legalNote =
      'Sesuai Permendikbud No. 75/2016 Pasal 1 angka 4 & Pasal 10, sumbangan pendidikan diperbolehkan apabila bersifat sukarela, tidak memaksa, dan tidak mengikat.';
    discrepancyVerdict = 'SESUAI KETENTUAN — Sumbangan sukarela tanpa paksaan.';
    verdictType = 'SUMBANGAN_SUKARELA_SAH';
    verdictTitle = statusTitle;
    primaryRegulation = 'Permendikbud 75/2016 Pasal 1 & Pasal 10';
    policySummary = legalNote;
    confidenceScore = 91;
  }

  const itemDisplayLabel =
    detectedItemKeyword ||
    (matchedItem
      ? matchedItem.name
      : statusType === 'neutral'
      ? 'Pengumuman Umum Sekolah'
      : 'Iuran Sekolah');

  const threeWayComparison: ThreeWayComparison = {
    teacherText: {
      sourceType,
      quote: detectedQuote,
      detectedItem: itemDisplayLabel,
      detectedAmount,
      isMandatory: isMandatoryEffective,
      toneLabel: coercion.toneLabel,
      toneBadge: effectiveToneBadge,
    },
    schoolBudget: {
      schoolName: effectiveSchoolName,
      isFundedByBosp,
      budgetStatusLabel,
      itemCode: budgetItemCode,
      allocatedAmount: budgetAllocatedAmount,
      stage: budgetStage,
      factText: budgetFactText,
    },
    bospPolicy: {
      verdictType,
      verdictTitle,
      primaryRegulation,
      policySummary,
      rules: [
        {
          id: 'rule-double-funding',
          ruleTitle: 'Larangan Pendanaan Ganda / Komponen Wajib BOSP',
          regulation: 'Permendikdasmen 8/2026 & Permendikbudristek 63/2023 Pasal 61',
          status: isFundedByBosp ? 'violation' : 'compliant',
          verdictLabel: isFundedByBosp ? 'Melanggar Aturan' : 'Sesuai',
          explanation: isFundedByBosp
            ? bospFact
            : 'Objek pesan tidak mengambil pendanaan ganda dari realisasi barang BOSP sekolah.',
        },
        {
          id: 'rule-voluntary-nature',
          ruleTitle: 'Larangan Pungutan Mengikat & Paksaan Terselubung',
          regulation: 'Permendikbud No. 75/2016 Pasal 10 & 12',
          status: isMandatoryEffective && statusType === 'danger' ? 'violation' : 'compliant',
          verdictLabel:
            isMandatoryEffective && statusType === 'danger' ? 'Melanggar Aturan' : 'Sesuai',
          explanation:
            isMandatoryEffective && statusType === 'danger'
              ? 'Ditemukan unsur kewajiban, tarif per siswa, batas waktu pelunasan, atau paksaan terselubung.'
              : 'Tidak ditemukan paksaan pembayaran maupun batas waktu mengikat.',
        },
        {
          id: 'rule-academic-rights',
          ruleTitle: 'Perlindungan Hak Evaluasi & Dokumen Akademik Siswa',
          regulation: 'UU Sisdiknas No. 20/2003 Pasal 34 & PP 17/2010 Pasal 181',
          status: coercion.hasAcademicSanction
            ? 'violation'
            : statusType === 'danger'
            ? 'warning'
            : 'compliant',
          verdictLabel: coercion.hasAcademicSanction
            ? 'Pelanggaran Berat'
            : statusType === 'danger'
            ? 'Perhatian Khusus'
            : 'Terjaga',
          explanation: coercion.hasAcademicSanction
            ? 'Pesan mengaitkan pelunasan biaya dengan hak mengikuti ujian atau pengambilan kartu/rapor/ijazah.'
            : 'Hak belajar dan administrasi akademik peserta didik wajib bebas dari diskriminasi biaya.',
        },
      ],
    },
  };

  return {
    rawOcrText: ocrText,
    fullStructuredTranscript: ocrText,
    detectedQuote,
    detectedAmount,
    detectedItemKeyword,
    isMandatoryTone: isMandatoryEffective,
    statusType,
    statusTitle,
    bospFact,
    matchedItem,
    legalNote,
    confidenceScore,
    financialComparison: {
      nominalPerStudent: detectedAmount,
      totalCollectedEstimate,
      bospAllocatedAmount: budgetAllocatedAmount,
      itemCode: budgetItemCode,
      disbursedPeriod: budgetStage,
      disbursedDate: matchedItem ? matchedItem.date : null,
      discrepancyVerdict,
    },
    sourceType,
    threeWayComparison,
    diagnostics: emptyDiagnostics,
    regions: [],
    uncertainRegionsCount: 0,
    unreadableRegionsCount: 0,
    passesExecuted: [sourceType === 'direct_text' ? 'Direct-Text-Input' : 'OCR-Pipeline'],
    reconciledDiffsCount: 0,
    processedPreviewDataUrl: '',
    privacyMode: 'local-browser',
  };
}

export function analyzeDirectTextMessage(
  text: string,
  bospItems: BospRealizationItem[],
  schoolName: string = 'SMK TI BAZMA',
  studentCount: number = 90,
  schoolContext?: SchoolScannerContext
): AiScanAnalysisResult {
  return analyzeChatWithBospItems(
    text,
    bospItems,
    schoolName,
    studentCount,
    'direct_text',
    schoolContext
  );
}

