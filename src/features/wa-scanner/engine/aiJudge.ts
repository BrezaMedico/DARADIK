import type { BospRealizationItem } from '@/types/school';
import type {
  AiJudgementSummary,
  AiScanAnalysisResult,
  PolicyRuleCheck,
  SchoolScannerContext,
  ThreeWayComparison,
} from '@/types/scanner';

/**
 * Klien AI Hakim Pungli + penggabungan keputusan (ensemble) dengan mesin aturan lokal.
 * Mesin aturan = jaring pengaman offline & cepat; AI = pemahaman semantik (eufemisme, negasi, konteks).
 */

export interface AiJudgement {
  verdict: 'PUNGLI' | 'BUKAN_PUNGLI';
  category: string;
  confidence: number;
  isMandatoryOrBinding: boolean;
  isDisguised: boolean;
  hasAcademicSanction: boolean;
  itemName: string;
  amountPerStudent: number | null;
  matchedBospItemCode: string | null;
  coerciveSignals: string[];
  evidenceQuotes: string[];
  alasan: string;
  analisis: string;
  regulationRefs: string[];
}

export interface AiJudgeRequestInput {
  text: string;
  imageDataUrl?: string;
  bospItems: BospRealizationItem[];
  schoolName: string;
  studentCount: number;
  schoolContext?: SchoolScannerContext;
}

export interface AiJudgeFusionContext {
  bospItems: BospRealizationItem[];
  schoolName: string;
  studentCount: number;
}

const JUDGE_TIMEOUT_MS = 50_000;

function buildSchoolPayload(input: AiJudgeRequestInput) {
  const ctx = input.schoolContext;
  return {
    name: ctx?.schoolName || input.schoolName,
    schoolType: ctx?.schoolType || undefined,
    educationLevel: ctx?.educationLevel || undefined,
    studentCount: ctx?.studentCount || input.studentCount,
    items: (input.bospItems || []).map((i) => ({
      code: i.code,
      name: i.name,
      amount: i.amount,
      stage: i.stage,
      allocation: i.allocation,
    })),
    compositions: (ctx?.compositions || []).map((c) => ({ label: c.label, amount: c.amount })),
  };
}

async function postJudge(body: unknown): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JUDGE_TIMEOUT_MS);
  try {
    return await fetch('/api/scan-judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestAiJudgement(
  input: AiJudgeRequestInput
): Promise<{ judgement: AiJudgement; model: string } | null> {
  const school = buildSchoolPayload(input);
  const text = (input.text || '').trim();
  if (!text && !input.imageDataUrl) return null;

  let imageBase64: string | undefined;
  let mimeType: string | undefined;
  if (input.imageDataUrl) {
    const m = input.imageDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (m) {
      mimeType = m[1];
      imageBase64 = m[2];
    }
  }

  let res = await postJudge({ text, school, imageBase64, mimeType });
  if (imageBase64 && (!res || res.status === 413 || res.status >= 500)) {
    res = await postJudge({ text, school });
  }
  if (!res || !res.ok) return null;

  try {
    const json = await res.json();
    if (json?.judgement?.verdict) {
      return { judgement: json.judgement as AiJudgement, model: String(json.model || 'gemini') };
    }
  } catch {
    // respons tidak valid -> jatuh kembali ke mesin aturan
  }
  return null;
}

const DANGER_CATEGORIES = new Set([
  'DUPLIKASI_DANA_BOSP',
  'KOMPONEN_WAJIB_BOSP',
  'PUNGUTAN_WAJIB_MENGIKAT',
  'PAKSAAN_TERSELUBUNG',
  'SANKSI_AKADEMIK_SOSIAL',
  'PENJUALAN_PAKSA_BARANG',
  'GRATIFIKASI_PELICIN',
  'BIAYA_LAYANAN_TERLARANG',
  'UANG_GEDUNG_SPP_KOMITE',
]);

type VerdictType = ThreeWayComparison['bospPolicy']['verdictType'];

const DANGER_NARRATIVES: Record<
  string,
  { title: string; verdictType: VerdictType; regulation: string; legal: string; discrepancy: string; badge: string }
> = {
  DUPLIKASI_DANA_BOSP: {
    title: 'Terindikasi Pungutan atas Komponen yang Sudah Dibiayai BOSP',
    verdictType: 'PUNGLI_REGULASI_BOSP',
    regulation: 'Permendikdasmen 8/2026 & Permendikbudristek 63/2023 Pasal 61',
    legal:
      'Sesuai Permendikbudristek No. 63/2023 Pasal 61, Permendikdasmen No. 8/2026, dan Permendikbud No. 75/2016 Pasal 12, sekolah maupun komite dilarang memungut biaya atas sarana/operasional yang telah dibiayai dana BOSP.',
    discrepancy: 'MELANGGAR KAMUS BOSP — Komponen ini wajib dibiayai dana BOSP tanpa pungutan.',
    badge: 'Tarikan Komponen BOSP',
  },
  KOMPONEN_WAJIB_BOSP: {
    title: 'Terindikasi Pungutan Komponen Wajib BOSP',
    verdictType: 'PUNGLI_REGULASI_BOSP',
    regulation: 'Permendikdasmen 8/2026 & Permendikbudristek 63/2023 Pasal 61',
    legal:
      'Komponen operasional yang tercantum dalam Juknis BOSP wajib dibiayai dana BOSP dan tidak boleh dibebankan kepada orang tua murid.',
    discrepancy: 'MELANGGAR KAMUS BOSP — Komponen operasional wajib dijamin BOSP.',
    badge: 'Tarikan Komponen BOSP',
  },
  PUNGUTAN_WAJIB_MENGIKAT: {
    title: 'Terindikasi Pungutan Wajib Tanpa Dasar RKAS BOSP',
    verdictType: 'PUNGLI_PEMAKSAAN',
    regulation: 'Permendikbud 75/2016 Pasal 10 & 12',
    legal:
      'Berdasarkan Permendikbud No. 75/2016 Pasal 10 & 12, pihak sekolah maupun komite dilarang menarik pungutan wajib yang menentukan nominal tetap, batas waktu pelunasan, atau sanksi akademik.',
    discrepancy: 'PUNGLI PEMAKSAAN — Penarikan biaya mengikat tanpa dasar komponen resmi negara.',
    badge: 'Wajib/Menagih',
  },
  PAKSAAN_TERSELUBUNG: {
    title: 'Terindikasi Pungutan Mengikat Berkedok Sumbangan',
    verdictType: 'PUNGLI_PEMAKSAAN',
    regulation: 'Permendikbud 75/2016 Pasal 10 & 12',
    legal:
      'Sumbangan hanya sah bila sukarela, tidak ditentukan jumlah dan waktunya. Pesan ini menyebut sumbangan/partisipasi tetapi disertai nominal, tenggat, target, atau pendataan sehingga menjadi pungutan terselubung (Permendikbud No. 75/2016 Pasal 10 & 12).',
    discrepancy: 'PUNGLI TERSELUBUNG — Berkedok sumbangan namun mengikat.',
    badge: 'Paksaan Terselubung',
  },
  SANKSI_AKADEMIK_SOSIAL: {
    title: 'Terindikasi Pelanggaran Hak Siswa: Sanksi bagi yang Belum Membayar',
    verdictType: 'PUNGLI_REGULASI_BOSP',
    regulation: 'UU Sisdiknas 20/2003 Pasal 34 & Permendikbud 75/2016',
    legal:
      'Sekolah dilarang menahan kartu ujian, rapor, ijazah, melarang siswa mengikuti pembelajaran/evaluasi, atau mempermalukan siswa karena belum membayar iuran maupun tunggakan.',
    discrepancy: 'MELANGGAR HAK SISWA — Sanksi akademik/sosial karena iuran dilarang.',
    badge: 'Ancaman Sanksi',
  },
  PENJUALAN_PAKSA_BARANG: {
    title: 'Terindikasi Pemaksaan Pembelian Buku / Seragam / Atribut',
    verdictType: 'PUNGLI_PEMAKSAAN',
    regulation: 'PP 17/2010 Pasal 181 & Permendikbud 75/2016 Pasal 12',
    legal:
      'Pendidik, tenaga kependidikan, dan komite sekolah dilarang memaksa atau mengaitkan pembelian buku, LKS, seragam, atau atribut dengan penerimaan, ujian, maupun kenaikan kelas siswa (PP No. 17/2010 Pasal 181).',
    discrepancy: 'MELANGGAR PP 17/2010 PASAL 181 — Penjualan paksa di sekolah dilarang.',
    badge: 'Penjualan Terikat',
  },
  GRATIFIKASI_PELICIN: {
    title: 'Terindikasi Uang Pelicin / Gratifikasi Layanan Pendidikan',
    verdictType: 'PUNGLI_PEMAKSAAN',
    regulation: 'UU 31/1999 jo. UU 20/2001 & Perpres 87/2016 (Saber Pungli)',
    legal:
      'Permintaan uang terima kasih, uang pelicin, atau jalur masuk berbayar termasuk pungutan liar dan gratifikasi yang dilarang. Layanan pendidikan tidak boleh dikaitkan dengan pembayaran apa pun.',
    discrepancy: 'GRATIFIKASI / PUNGLI — Uang di luar ketentuan resmi untuk memperlancar layanan.',
    badge: 'Uang Pelicin',
  },
  BIAYA_LAYANAN_TERLARANG: {
    title: 'Terindikasi Pungutan Biaya Layanan Sekolah (Dijamin BOSP)',
    verdictType: 'PUNGLI_REGULASI_BOSP',
    regulation: 'Permendikdasmen 8/2026 & Permendikbud 44/2012',
    legal:
      'Layanan administrasi dasar sekolah (formulir, daftar ulang, rapor, kartu pelajar, legalisir, ujian/remedial) termasuk komponen yang dibiayai BOSP dan tidak boleh dipungut dari siswa atau orang tua.',
    discrepancy: 'MELANGGAR KAMUS BOSP — Layanan dasar sekolah bebas pungutan.',
    badge: 'Pungutan Dilarang',
  },
  UANG_GEDUNG_SPP_KOMITE: {
    title: 'Terindikasi Pungutan Uang Gedung / Iuran Komite Mengikat',
    verdictType: 'PUNGLI_REGULASI_BOSP',
    regulation: 'Permendikbud 75/2016 Pasal 10 & 12 & Permendikbud 44/2012',
    legal:
      'Komite Sekolah hanya boleh menggalang bantuan/sumbangan sukarela dan dilarang menarik pungutan yang menentukan nominal tetap maupun batas waktu bagi peserta didik atau orang tua.',
    discrepancy: 'MELANGGAR REGULASI — Pungutan struktural mengikat dilarang.',
    badge: 'Pungutan Dilarang',
  },
};

const SAFE_NARRATIVES: Record<
  string,
  { statusType: 'safe' | 'neutral'; title: string; legal: string; discrepancy: string; badge: string }
> = {
  SUMBANGAN_SUKARELA_SAH: {
    statusType: 'safe',
    title: 'Himbauan Sumbangan Sukarela Murni (Bukan Dana BOSP)',
    legal:
      'Sesuai Permendikbud No. 75/2016 Pasal 1 angka 4 & Pasal 10, sumbangan pendidikan diperbolehkan apabila bersifat sukarela, tidak memaksa, dan tidak mengikat.',
    discrepancy: 'SESUAI KETENTUAN — Sumbangan sukarela tanpa paksaan.',
    badge: 'Sukarela',
  },
  PERNYATAAN_GRATIS: {
    statusType: 'safe',
    title: 'Pernyataan Bebas Pungutan (Tidak Ada Penarikan Biaya)',
    legal:
      'Pesan menegaskan tidak ada pungutan kepada orang tua, sejalan dengan ketentuan BOSP. Tetap laporkan bila praktik di lapangan berbeda.',
    discrepancy: 'SESUAI KETENTUAN — Pesan menegaskan tidak ada pungutan.',
    badge: 'Bebas Pungutan',
  },
  LAPORAN_DANA: {
    statusType: 'safe',
    title: 'Laporan Penggunaan Dana (Transparansi, Bukan Penarikan)',
    legal: 'Pesan melaporkan penggunaan dana secara transparan dan tidak meminta pembayaran dari wali murid.',
    discrepancy: 'SESUAI KETENTUAN — Laporan dana tanpa tagihan.',
    badge: 'Laporan Dana',
  },
  INFORMASI_UMUM: {
    statusType: 'neutral',
    title: 'Pesan Informatif Sekolah (Tidak Ditemukan Penarikan Biaya)',
    legal:
      'Jika terdapat penarikan biaya lisan atau informasi tambahan di luar pesan ini, Anda tetap dapat melaporkan secara anonim melalui kanal pengaduan.',
    discrepancy: 'TIDAK ADA TARIKAN — Pesan informatif.',
    badge: 'Informatif',
  },
  EDUKASI_ANTI_PUNGLI: {
    statusType: 'neutral',
    title: 'Pesan Peringatan / Edukasi Anti-Pungli (Bukan Penarikan Dana)',
    legal: 'Pesan berupa peringatan atau ajakan waspada pungutan, bukan permintaan pembayaran.',
    discrepancy: 'TIDAK ADA TARIKAN — Pesan edukasi/peringatan.',
    badge: 'Edukasi',
  },
  PERTANYAAN: {
    statusType: 'neutral',
    title: 'Pertanyaan / Konfirmasi Warga (Belum Ada Tagihan Nyata)',
    legal:
      'Pesan berupa pertanyaan atau konfirmasi, bukan perintah membayar. Jika iuran benar-benar ditagihkan, unggah pesan penagihan aslinya untuk diperiksa.',
    discrepancy: 'TIDAK ADA TARIKAN — Pesan berupa pertanyaan.',
    badge: 'Pertanyaan',
  },
  OBROLAN_PRIBADI: {
    statusType: 'neutral',
    title: 'Percakapan Pribadi (Tidak Terkait Pungutan Sekolah)',
    legal: 'Pesan merupakan obrolan atau transaksi pribadi dan tidak berkaitan dengan pungutan sekolah.',
    discrepancy: 'TIDAK ADA TARIKAN — Transaksi/obrolan pribadi.',
    badge: 'Pribadi',
  },
  TIDAK_TERBACA: {
    statusType: 'neutral',
    title: 'Teks Pesan Tidak Terbaca Jelas',
    legal: 'Teks pada gambar terlalu buram atau terpotong untuk dinilai. Unggah tangkapan layar yang lebih jelas.',
    discrepancy: 'BELUM DAPAT DINILAI — Teks tidak terbaca.',
    badge: 'Tidak Terbaca',
  },
};

const formatRp = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

function appendAiReason(fact: string, alasan: string): string {
  const reason = (alasan || '').trim();
  if (!reason) return fact;
  const normFact = fact.toLowerCase();
  if (normFact.includes(reason.toLowerCase().slice(0, 40))) return fact;
  return `${fact} Analisis AI: ${reason}`;
}

function buildPolicyRules(
  isFundedByBosp: boolean,
  bospFact: string,
  isBinding: boolean,
  isDanger: boolean,
  hasAcademicSanction: boolean
): PolicyRuleCheck[] {
  return [
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
      status: isBinding && isDanger ? 'violation' : 'compliant',
      verdictLabel: isBinding && isDanger ? 'Melanggar Aturan' : 'Sesuai',
      explanation:
        isBinding && isDanger
          ? 'Ditemukan unsur kewajiban, tarif per siswa, batas waktu pelunasan, atau paksaan terselubung.'
          : 'Tidak ditemukan paksaan pembayaran maupun batas waktu mengikat.',
    },
    {
      id: 'rule-academic-rights',
      ruleTitle: 'Perlindungan Hak Evaluasi & Dokumen Akademik Siswa',
      regulation: 'UU Sisdiknas No. 20/2003 Pasal 34 & PP 17/2010 Pasal 181',
      status: hasAcademicSanction ? 'violation' : isDanger ? 'warning' : 'compliant',
      verdictLabel: hasAcademicSanction ? 'Pelanggaran Berat' : isDanger ? 'Perhatian Khusus' : 'Terjaga',
      explanation: hasAcademicSanction
        ? 'Pesan mengaitkan pelunasan biaya dengan hak mengikuti ujian, pengambilan kartu/rapor/ijazah, atau perlakuan buruk terhadap siswa.'
        : 'Hak belajar dan administrasi akademik peserta didik wajib bebas dari diskriminasi biaya.',
    },
  ];
}

interface FusionDecision {
  finalDanger: boolean;
  mode: 'agree' | 'ai-override' | 'rules-kept';
}

function decide(base: AiScanAnalysisResult, j: AiJudgement): FusionDecision {
  const aiDanger = j.verdict === 'PUNGLI';
  const ruleDanger = base.statusType === 'danger';
  if (aiDanger === ruleDanger) return { finalDanger: aiDanger, mode: 'agree' };

  const rules = base.threeWayComparison?.bospPolicy.rules || [];
  const academicHard = rules.some((r) => r.id === 'rule-academic-rights' && r.status === 'violation');
  const itemHard = Boolean(base.matchedItem) && base.detectedAmount !== null && base.isMandatoryTone;
  const ruleHardEvidence = ruleDanger && (academicHard || itemHard);

  if (aiDanger) {
    return j.confidence >= 55
      ? { finalDanger: true, mode: 'ai-override' }
      : { finalDanger: false, mode: 'rules-kept' };
  }
  const needed = ruleHardEvidence ? 92 : 78;
  return j.confidence >= needed
    ? { finalDanger: false, mode: 'ai-override' }
    : { finalDanger: true, mode: 'rules-kept' };
}

function summarize(j: AiJudgement, model: string, agreedWithRules: boolean): AiJudgementSummary {
  return {
    verdict: j.verdict,
    category: j.category,
    confidence: j.confidence,
    alasan: j.alasan,
    evidenceQuotes: j.evidenceQuotes,
    coerciveSignals: j.coerciveSignals,
    model,
    agreedWithRules,
  };
}

function rebuildAsDanger(
  base: AiScanAnalysisResult,
  j: AiJudgement,
  ctx: AiJudgeFusionContext
): AiScanAnalysisResult {
  const narrative =
    DANGER_NARRATIVES[DANGER_CATEGORIES.has(j.category) ? j.category : 'PUNGUTAN_WAJIB_MENGIKAT'];
  const matchedItem = j.matchedBospItemCode
    ? ctx.bospItems.find((i) => i.code === j.matchedBospItemCode) || null
    : null;

  const amount = j.amountPerStudent ?? base.detectedAmount;
  const total = amount ? amount * ctx.studentCount : null;
  const amountStr = amount ? formatRp(amount) : 'nominal yang ditagihkan';

  let statusTitle = narrative.title;
  let verdictType = narrative.verdictType;
  let regulation = j.regulationRefs.length ? j.regulationRefs.join(' & ') : narrative.regulation;
  let legal = narrative.legal;
  let discrepancy = narrative.discrepancy;
  let fact = j.alasan || `Pesan menagih ${amountStr} di luar mekanisme resmi.`;
  let budgetLabel = 'Tidak Terdaftar di RKAS Resmi';
  let budgetCode: string | null = 'NON-RKAS';
  let budgetAmount: number | null = 0;
  let budgetStage: string | null = null;
  let budgetFact = `Pesan menarik biaya di luar komponen RKAS BOSP ${ctx.schoolName}.`;
  let isFunded = false;

  if (matchedItem) {
    isFunded = true;
    statusTitle = 'Terindikasi Tumpang Tindih dengan Dana BOSP';
    verdictType = 'PUNGLI_BOSP';
    regulation = 'Permendikbudristek 63/2023 Pasal 61 & Permendikdasmen 8/2026';
    legal = DANGER_NARRATIVES.DUPLIKASI_DANA_BOSP.legal;
    discrepancy = 'TUMPANG TINDIH 100% — Barang/fasilitas telah ditanggung negara melalui RKAS BOSP sekolah.';
    budgetLabel = 'Sudah Dibiayai BOSP Negara';
    budgetCode = matchedItem.code;
    budgetAmount = matchedItem.amount;
    budgetStage = matchedItem.stage;
    budgetFact = `${ctx.schoolName} telah mencairkan dana BOSP resmi sebesar ${formatRp(matchedItem.amount)} untuk "${matchedItem.name}" (${matchedItem.stage}, Kode: ${matchedItem.code}).`;
    fact = `${ctx.schoolName} telah merealisasikan "${matchedItem.name}" senilai ${formatRp(matchedItem.amount)} pada ${matchedItem.stage} (${matchedItem.date}, Kode ${matchedItem.code}). Penarikan ${amountStr}/siswa${total ? ` (estimasi ${formatRp(total)} dari ${ctx.studentCount} siswa)` : ''} terindikasi tumpang tindih anggaran BOSP. ${j.alasan}`.trim();
  } else {
    fact = appendAiReason(fact, '');
  }

  const isBinding = true;
  const keyword = j.itemName || matchedItem?.name || base.detectedItemKeyword || 'Iuran Sekolah';
  const comparison: ThreeWayComparison = {
    teacherText: {
      sourceType: base.sourceType || 'screenshot',
      quote: base.detectedQuote,
      detectedItem: keyword,
      detectedAmount: amount,
      isMandatory: isBinding,
      toneLabel: j.isDisguised
        ? 'Paksaan Terselubung (Berkedok Sumbangan namun Mengikat)'
        : j.hasAcademicSanction
        ? 'Ancaman Sanksi Akademik / Penahanan Hak Siswa'
        : 'Wajib / Menagih dengan Tarif atau Batas Waktu',
      toneBadge: matchedItem && !j.isMandatoryOrBinding ? 'Tarikan Duplikat BOSP' : narrative.badge,
    },
    schoolBudget: {
      schoolName: ctx.schoolName,
      isFundedByBosp: isFunded,
      budgetStatusLabel: budgetLabel,
      itemCode: budgetCode,
      allocatedAmount: budgetAmount,
      stage: budgetStage,
      factText: budgetFact,
    },
    bospPolicy: {
      verdictType,
      verdictTitle: statusTitle,
      primaryRegulation: regulation,
      policySummary: legal,
      rules: buildPolicyRules(isFunded, fact, isBinding, true, j.hasAcademicSanction),
    },
  };

  return {
    ...base,
    statusType: 'danger',
    statusTitle,
    bospFact: fact,
    legalNote: legal,
    detectedItemKeyword: keyword,
    detectedAmount: amount,
    isMandatoryTone: true,
    matchedItem,
    confidenceScore: Math.max(60, Math.min(98, j.confidence)),
    financialComparison: {
      nominalPerStudent: amount,
      totalCollectedEstimate: total,
      bospAllocatedAmount: budgetAmount,
      itemCode: budgetCode,
      disbursedPeriod: budgetStage,
      disbursedDate: matchedItem ? matchedItem.date : null,
      discrepancyVerdict: discrepancy,
    },
    threeWayComparison: comparison,
  };
}

function rebuildAsSafe(
  base: AiScanAnalysisResult,
  j: AiJudgement,
  ctx: AiJudgeFusionContext
): AiScanAnalysisResult {
  const narrative = SAFE_NARRATIVES[j.category] || SAFE_NARRATIVES.INFORMASI_UMUM;
  const fact =
    j.alasan ||
    `AI telah memeriksa isi pesan dan tidak menemukan penarikan iuran maupun duplikasi anggaran BOSP di ${ctx.schoolName}.`;
  const keyword =
    j.itemName || base.detectedItemKeyword || (narrative.statusType === 'safe' ? narrative.badge : null);

  const comparison: ThreeWayComparison = {
    teacherText: {
      sourceType: base.sourceType || 'screenshot',
      quote: base.detectedQuote,
      detectedItem: keyword || 'Pengumuman Umum Sekolah',
      detectedAmount: base.detectedAmount,
      isMandatory: false,
      toneLabel: narrative.title,
      toneBadge: narrative.badge,
    },
    schoolBudget: {
      schoolName: ctx.schoolName,
      isFundedByBosp: false,
      budgetStatusLabel: 'Tidak Ada Penarikan Dana dari Wali Murid',
      itemCode: null,
      allocatedAmount: null,
      stage: null,
      factText: `Pesan tidak menagih pembayaran kepada wali murid ${ctx.schoolName}.`,
    },
    bospPolicy: {
      verdictType: narrative.statusType === 'safe' && j.category === 'SUMBANGAN_SUKARELA_SAH'
        ? 'SUMBANGAN_SUKARELA_SAH'
        : 'BELUM_TERIDENTIFIKASI',
      verdictTitle: narrative.title,
      primaryRegulation: j.regulationRefs.length ? j.regulationRefs.join(' & ') : 'Permendikbud 75/2016 Pasal 10 & 12',
      policySummary: narrative.legal,
      rules: buildPolicyRules(false, fact, false, false, false),
    },
  };

  return {
    ...base,
    statusType: narrative.statusType,
    statusTitle: narrative.title,
    bospFact: fact,
    legalNote: narrative.legal,
    detectedItemKeyword: keyword,
    isMandatoryTone: false,
    matchedItem: null,
    confidenceScore: Math.max(60, Math.min(98, j.confidence)),
    financialComparison: {
      nominalPerStudent: base.detectedAmount,
      totalCollectedEstimate: null,
      bospAllocatedAmount: null,
      itemCode: null,
      disbursedPeriod: null,
      disbursedDate: null,
      discrepancyVerdict: narrative.discrepancy,
    },
    threeWayComparison: comparison,
  };
}

export function fuseRulesWithAiJudgement(
  base: AiScanAnalysisResult,
  judgement: AiJudgement,
  model: string,
  ctx: AiJudgeFusionContext
): AiScanAnalysisResult {
  const decision = decide(base, judgement);
  const ruleDanger = base.statusType === 'danger';
  const agreed = (judgement.verdict === 'PUNGLI') === ruleDanger;
  const passes = [...base.passesExecuted, `AI-Judge-${model}`];

  let result: AiScanAnalysisResult;

  if (decision.mode === 'ai-override') {
    result = decision.finalDanger
      ? rebuildAsDanger(base, judgement, ctx)
      : rebuildAsSafe(base, judgement, ctx);
  } else if (decision.mode === 'rules-kept') {
    result = {
      ...base,
      confidenceScore: Math.max(60, base.confidenceScore - 10),
    };
  } else {
    // Sepakat: pertahankan narasi hukum mesin aturan (lebih kaya), perkuat dengan analisis AI.
    let enriched: AiScanAnalysisResult = base;
    if (decision.finalDanger && !base.matchedItem && judgement.matchedBospItemCode) {
      enriched = rebuildAsDanger(base, judgement, ctx);
    } else if (!decision.finalDanger && base.statusType === 'neutral' && SAFE_NARRATIVES[judgement.category]?.statusType === 'safe') {
      enriched = rebuildAsSafe(base, judgement, ctx);
    } else {
      enriched = {
        ...base,
        bospFact: appendAiReason(base.bospFact, judgement.alasan),
        detectedAmount: base.detectedAmount ?? judgement.amountPerStudent,
      };
    }
    const lo = Math.min(base.confidenceScore, judgement.confidence);
    result = {
      ...enriched,
      confidenceScore: Math.min(99, Math.max(base.confidenceScore, judgement.confidence) + (lo >= 80 ? 3 : 0)),
    };
  }

  return {
    ...result,
    passesExecuted: passes,
    privacyMode: 'hybrid-vision-ai',
    analysisEngine: 'rules+ai',
    aiJudgement: summarize(judgement, model, agreed),
  };
}

/**
 * Menjalankan AI Hakim Pungli untuk hasil mesin aturan; bila AI tidak tersedia (kuota/jaringan) hasil mesin aturan dipakai apa adanya.
 */
export async function enhanceWithAiJudgement(
  base: AiScanAnalysisResult,
  input: AiJudgeRequestInput
): Promise<AiScanAnalysisResult> {
  const ctx: AiJudgeFusionContext = {
    bospItems: input.bospItems,
    schoolName: input.schoolContext?.schoolName || input.schoolName,
    studentCount: input.schoolContext?.studentCount || input.studentCount,
  };
  const response = await requestAiJudgement(input);
  if (!response) {
    return {
      ...base,
      analysisEngine: 'rules-only',
      passesExecuted: [...base.passesExecuted, 'AI-Judge-Tidak-Tersedia (mesin aturan lokal)'],
    };
  }
  return fuseRulesWithAiJudgement(base, response.judgement, response.model, ctx);
}

