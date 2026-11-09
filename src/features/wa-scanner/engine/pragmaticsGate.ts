import { buildEnrichedMessageDoc } from './indonesianNlu';

/**
 * Lapisan pragmatik: membedakan pesan yang MENAGIH / MEMINTA uang dari pesan yang hanya
 * membicarakan uang (pernyataan gratis, peringatan pungli, pertanyaan, laporan dana, obrolan pribadi).
 * Pencocokan kata kunci saja tidak bisa membedakan "wajib bayar kipas" dari "sekolah tidak memungut biaya kipas".
 */

export type NonDemandReason =
  | 'free_assurance'
  | 'warning_awareness'
  | 'question_hearsay'
  | 'financial_report'
  | 'personal_transaction'
  | 'voluntary_info'
  | 'none';

export interface PragmaticProfile {
  hasDemand: boolean;
  demandSignals: string[];
  nonDemandReason: NonDemandReason;
  hasSchoolLevyParty: boolean;
}

const AMT = String.raw`(?:rp\s*\d|\d+\s*(?:rb|ribu|jt|juta|k)\b|\b\d{1,3}\s000\b)`;
const AMT_RE = new RegExp(AMT);

const PAY_WORDS = String.raw`(?:bayar|membayar|bayarkan|membayarkan|dibayar|dibayarkan|transfer|mentransfer|ditransfer|setor|menyetor|setorkan|disetor|lunasi|melunasi|dilunasi|pelunasan|iuran|urunan|patungan|berpartisipasi|partisipasi|menyumbang|sumbang|menyumbangkan|kumpulkan|dikumpulkan|mengumpulkan|talangi|menalangi|beli|dibeli|membeli|pembelian|pengadaan|siapkan|menyiapkan|titip|titipkan|menitipkan)`;
const FIN_WORDS = String.raw`(?:iuran|biaya|bayar|membayar|dibayar|uang|dana|sumbangan|patungan|urunan|tarif|infaq|infak|sodaqoh|sedekah|partisipasi|donasi|kontribusi|tagihan|pungutan|spp|setoran|harga|paket|transfer|setor|kas|dsp|komite)`;

const SANCTION_RE =
  /\b(?:tidak (?:boleh|bisa|diperkenankan|diizinkan) (?:ikut|mengikuti)|dilarang (?:ikut|mengikuti)|belum (?:bisa|boleh) (?:ikut|diambil|dibagikan)|ditahan|penahanan|tidak (?:diberi|diberikan|dapat|mendapat|dikasih) (?:kartu|rapor|ijazah|nilai)|disuruh pulang|dipulangkan|diskors|skorsing|diumumkan|ditempel|dilaporkan ke|dipanggil orang tua|menghadap|nilai (?:bisa )?(?:dipertimbangkan|dikurangi|ditahan)|tebus (?:ijazah|rapor))\b/;

const NEG_PAY_CLAUSE =
  /\b(?:tidak|tak|bukan|tanpa|tiada|jangan|belum perlu)\s+(?:ada\s+|perlu\s+|usah\s+|akan\s+|boleh\s+|harus\s+|dikenakan\s+|dikenai\s+)?(?:\w+\s+){0,2}?(?:bayar|membayar|dibayar|dibayarkan|memungut|dipungut|pungutan|iuran|biaya|wajib|diwajibkan|kewajiban|paksaan|dipaksa|memaksa|transfer|setor|menyetor|dibebani|membebani|dibebankan|mengumpulkan|dikumpulkan|sumbangan|urunan|patungan|partisipasi|nominal|tenggat|sanksi|uang)/;

const FREE_ASSURANCE_RE =
  /\b(?:tidak|tak|tanpa|bebas|gratis|tiada)\s+(?:ada\s+|perlu\s+|usah\s+)?(?:\w+\s+){0,2}?(?:memungut|dipungut|pungutan|biaya|bayar|membayar|iuran|dibebani|membebani|dibebankan|uang)|\b(?:dibiayai|ditanggung|dicover|bersumber)\s+(?:penuh\s+)?(?:oleh\s+|dari\s+)?(?:dana\s+)?(?:bos|bosp|negara|apbn)\b|\bgratis\b|\bsudah\s+(?:dari|dibiayai|termasuk)\s+(?:dana\s+)?(?:bos|bosp)\b|\bdari\s+dana\s+(?:bos|bosp)\b/;

const WARNING_RE =
  /\b(?:waspada|hati hati|awas|jangan (?:mau|bayar|sampai|membayar|tertipu|percaya)|laporkan|melapor|melaporkan|melanggar|dilarang (?:keras )?(?:memungut|menarik|melakukan pungutan)|saber pungli|pungli|penipuan|modus|kanal pengaduan)\b/;

const QUESTION_HEARSAY_RE =
  /\b(?:apakah|apa) (?:benar|betul|ada|memang)|\bbenarkah\b|\bsetahu (?:saya|kami|aku)\b|\bkatanya\b|\bkabarnya\b|\bmau tanya\b|\bingin bertanya\b|\bizin bertanya\b|\bboleh tanya\b|\bnumpang tanya\b|\bmaaf tanya\b/;

const REPORT_RE =
  /\b(?:laporan (?:penggunaan|realisasi|pertanggungjawaban|keuangan)|realisasi (?:dana|anggaran|bos|bosp)|rincian (?:penggunaan|realisasi)|transparansi (?:dana|bos|bosp|anggaran)|penggunaan dana (?:bos|bosp)|dana (?:bos|bosp) (?:semester|tahap|tahun))\b/;

const PERSONAL_PAST_RE =
  /\b(?:saya|aku|sy)\s+(?:sudah|telah|udah|barusan)\s+(?:transfer|bayar|kirim|mentransfer|membayar)\b|\b(?:sudah|telah|udah|barusan)\s+(?:saya|aku|sy)\s+(?:transfer|bayar|kirim|mentransfer|membayar)\b/;

const PAST_SELF_ACTION_RE =
  /\b(?:saya|aku|sy)\s+(?:\w+\s+)?(?:sudah|telah|udah|barusan)\s+(?:transfer|bayar|setor|kirim|membayar|mentransfer|menyetor)\b|\b(?:tadi|kemarin|barusan)\s+(?:saya|aku|sy)\s+(?:sudah\s+)?(?:transfer|bayar|setor|kirim)\b|\b(?:sudah|telah|udah|barusan)\s+(?:saya|aku|sy)\s+(?:transfer|bayar|setor|kirim|membayar|mentransfer|menyetor)\b/;

const VOLUNTARY_RE =
  /\b(?:sukarela|seikhlasnya|semampunya|sesuai kemampuan|kerelaan|bagi yang berkenan|yang berkenan|opsional|boleh ikut boleh tidak|tidak ada paksaan|tidak diwajibkan|tidak wajib)\b/;

const PARTY_RE =
  /\b(?:wali murid|orang tua|siswa|murid|anak|kelas|komite|paguyuban|bendahara|wali kelas|sekolah|guru|kepala sekolah|tata usaha|tu|koperasi|ketua kelas|bapak ibu|bapak\/ibu|ananda)\b/;

function splitClauses(raw: string): string[] {
  return raw
    .split(/[.!?\n;:•]+|\b(?:tapi|namun|akan tetapi|hanya saja|meskipun|sedangkan)\b/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 2);
}

function normalizeClause(clause: string): string {
  return buildEnrichedMessageDoc(clause).normalizedText;
}

export function analyzePragmatics(rawText: string): PragmaticProfile {
  const clausesRaw = splitClauses(rawText || '');
  const clauses = clausesRaw.map(normalizeClause).filter(Boolean);
  const fullNorm = buildEnrichedMessageDoc(rawText || '').normalizedText;

  const signals: string[] = [];
  const addSignal = (label: string) => {
    if (!signals.includes(label)) signals.push(label);
  };

  let assurance = false;
  let warning = false;
  let hearsay = false;
  let report = false;

  const msgFin = new RegExp(`\\b${FIN_WORDS}\\b`).test(fullNorm);
  const D1 = new RegExp(
    String.raw`\b(?:mohon|harap|dimohon|diminta|diharapkan|segera|wajib|diwajibkan|harus|tolong|bisa|ayo)\b(?:\s+\w+){0,6}?\s+${PAY_WORDS}\b`
  );
  const D2 = new RegExp(
    String.raw`\b${FIN_WORDS}\b(?:\s+\w+){0,5}?\s+(?:sebesar\s+|senilai\s+|sejumlah\s+)?${AMT}`
  );
  const D3a = new RegExp(String.raw`\b(?:per|tiap|setiap|masing masing)\s*(?:siswa|anak|murid|orang|kepala|peserta|wali murid)\b`);
  const D3b = new RegExp(String.raw`\b\d+\s*(?:anak|siswa|murid|orang)\s+${AMT}`);
  const D4 = new RegExp(
    String.raw`\b(?:bayar|dibayar|dibayarkan|transfer|ditransfer|setor|disetor|setorkan|dikumpulkan|kumpulkan|diserahkan|serahkan|dititipkan|titip)\b(?:\s+\w+){0,4}?\s+(?:ke|kepada|via|melalui|lewat|pada|di)\s+(?:bendahara|rekening|ketua|wali kelas|tu|tata usaha|komite|koperasi|bu|pak|ibu|bapak|panitia|paguyuban)\b`
  );
  const D5 = /\b(?:kita|kami|semua|seluruh)\s+(?:\w+\s+){0,3}?(?:patungan|iuran|urunan|bagi rata|menyumbang)\b/;
  const D8 = /\b(?:belum (?:setor|bayar|membayar|lunas|transfer|menyetor)|tunggakan|menunggak|kurang bayar)\b/;
  const D9 = new RegExp(String.raw`\b(?:minimal|minimum|paling sedikit|tidak (?:boleh )?kurang dari)\b(?:\s+\w+){0,3}?\s*${AMT}`);
  const D10 = new RegExp(String.raw`\b(?:dikenakan|dikenai|dibebankan|ditetapkan|disepakati|dipungut)\b(?:\s+\w+){0,6}?\s*${AMT}`);
  const D7 = new RegExp(String.raw`\b(?:wajib|diwajibkan|harus|kewajiban)\b`);

  for (let i = 0; i < clauses.length; i++) {
    const s = clauses[i];

    if (SANCTION_RE.test(s)) {
      addSignal('sanksi / konsekuensi bagi yang belum bayar');
      continue;
    }

    const negated = NEG_PAY_CLAUSE.test(s);
    if (FREE_ASSURANCE_RE.test(s)) assurance = true;
    if (WARNING_RE.test(s)) warning = true;
    if (QUESTION_HEARSAY_RE.test(s)) hearsay = true;
    if (REPORT_RE.test(s)) report = true;

    if (negated) continue;
    if (QUESTION_HEARSAY_RE.test(s) || WARNING_RE.test(s)) continue;

    const reportClause = REPORT_RE.test(s) || /\b(?:dibiayai|ditanggung)\b/.test(s);

    // Pelaporan tindakan lampau oleh penutur ("saya sudah transfer ...") bukan perintah membayar.
    if (PAST_SELF_ACTION_RE.test(s) && !D1.test(s)) continue;

    if (D1.test(s)) addSignal('perintah / permintaan membayar');
    if (!reportClause && D2.test(s)) addSignal('tarif / nominal tertentu');
    if (AMT_RE.test(s) && (D3a.test(s) || D3b.test(s))) addSignal('nominal per siswa');
    if (D4.test(s)) addSignal('arahan setor / transfer ke pihak tertentu');
    if (D5.test(s) && AMT_RE.test(s)) addSignal('patungan kolektif');
    if (D8.test(s)) addSignal('penagihan tunggakan');
    if (D9.test(s)) addSignal('batas nominal minimal');
    if (D10.test(s)) addSignal('biaya dibebankan');
    if (D7.test(s) && new RegExp(`\\b${FIN_WORDS}\\b`).test(s)) addSignal('unsur kewajiban');
  }

  const deadlineRe =
    /\b(?:paling lambat|batas (?:akhir|waktu|pembayaran|pelunasan)|jatuh tempo|tenggat|selambat lambatnya|sebelum (?:pts|pas|uts|uas|ujian|ulangan|rapor|tanggal)|akhir bulan)\b/;
  const hasDeadline = deadlineRe.test(fullNorm);

  const strongNeg = NEG_PAY_CLAUSE.test(fullNorm);
  if (hasDeadline && msgFin && !assurance && !strongNeg && signals.length > 0) {
    addSignal('batas waktu pembayaran');
  }

  const isWarningAdvocacy =
    /\b(?:jangan (?:mau|dibayar|bayar)|laporkan|saber pungli)\b/.test(fullNorm) &&
    /\b(?:melanggar|pungli|waspada|dilarang)\b/.test(fullNorm);

  if (isWarningAdvocacy) {
    signals.length = 0;
    warning = true;
  }

  const hasDemand = signals.length > 0;
  const personal =
    (PERSONAL_PAST_RE.test(fullNorm) || /\b(?:toko ibu|arisan|warung)\b/.test(fullNorm)) &&
    !/\b(?:komite|paguyuban|sekolah|wali kelas|kepala sekolah|tata usaha)\b/.test(fullNorm);
  const voluntary = VOLUNTARY_RE.test(fullNorm);

  let nonDemandReason: NonDemandReason = 'none';
  if (!hasDemand) {
    if (personal) nonDemandReason = 'personal_transaction';
    else if (assurance) nonDemandReason = 'free_assurance';
    else if (warning || isWarningAdvocacy) nonDemandReason = 'warning_awareness';
    else if (hearsay) nonDemandReason = 'question_hearsay';
    else if (report) nonDemandReason = 'financial_report';
    else if (voluntary) nonDemandReason = 'voluntary_info';
  }

  return {
    hasDemand,
    demandSignals: signals,
    nonDemandReason,
    hasSchoolLevyParty: PARTY_RE.test(fullNorm),
  };
}
