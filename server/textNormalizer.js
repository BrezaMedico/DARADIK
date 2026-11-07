// Phonetic spellings prevent Piper TTS from reading Indonesian acronyms as English words.
export const KAMUS_PELAFALAN = {
  BOSP: 'bos-pe',
  BOS: 'bos',
  RKAS: 'er-ka-a-es',
  ARKAS: 'ar-kas',
  SIPLah: 'sip-lah',
  SIPLAH: 'sip-lah',
  NPSN: 'en-pe-es-en',
  NISN: 'en-i-es-en',
  PPDB: 'pe-pe-de-be',
  SPMB: 'es-pe-em-be',
  ANBK: 'a-en-be-ka',
  UKK: 'u-ka-ka',
  SD: 'es-de',
  SMP: 'es-em-pe',
  SMA: 'es-em-a',
  SMK: 'es-em-ka',
  SLB: 'es-el-be',
  PAUD: 'pa-ud',
  ASN: 'a-es-en',
  PNS: 'pe-en-es',
  PPPK: 'pe-pe-pe-ka',
  GTK: 'ge-te-ka',
  ATK: 'a-te-ka',
  APBN: 'a-pe-be-en',
  APBD: 'a-pe-be-de',
  DAK: 'de-a-ka',
  NPWP: 'en-pe-we-pe',
  RKUN: 'er-ka-u-en',
  WA: 'we-a',
  AI: 'a-i',
  OCR: 'o-ce-er',
  PDF: 'pe-de-ef',
  DARADIK: 'da-ra-dik',
};

const NAMA_BULAN = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SATUAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

export function angkaKeKata(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  if (num === 0) return 'nol';
  if (num < 0) return 'minus ' + angkaKeKata(Math.abs(num));

  const bulat = Math.floor(num);
  if (bulat < 12) return SATUAN[bulat];
  if (bulat < 20) return angkaKeKata(bulat - 10) + ' belas';
  if (bulat < 100) {
    const puluhan = Math.floor(bulat / 10);
    const sisa = bulat % 10;
    return (
      angkaKeKata(puluhan) +
      ' puluh' +
      (sisa > 0 ? ' ' + angkaKeKata(sisa) : '')
    );
  }
  if (bulat < 200) {
    const sisa = bulat - 100;
    return 'seratus' + (sisa > 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (bulat < 1000) {
    const ratusan = Math.floor(bulat / 100);
    const sisa = bulat % 100;
    return (
      angkaKeKata(ratusan) +
      ' ratus' +
      (sisa > 0 ? ' ' + angkaKeKata(sisa) : '')
    );
  }
  if (bulat < 2000) {
    const sisa = bulat - 1000;
    return 'seribu' + (sisa > 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (bulat < 1_000_000) {
    const ribuan = Math.floor(bulat / 1000);
    const sisa = bulat % 1000;
    return (
      angkaKeKata(ribuan) +
      ' ribu' +
      (sisa > 0 ? ' ' + angkaKeKata(sisa) : '')
    );
  }
  if (bulat < 1_000_000_000) {
    const jutaan = Math.floor(bulat / 1_000_000);
    const sisa = bulat % 1_000_000;
    return (
      angkaKeKata(jutaan) +
      ' juta' +
      (sisa > 0 ? ' ' + angkaKeKata(sisa) : '')
    );
  }
  if (bulat < 1_000_000_000_000) {
    const miliaran = Math.floor(bulat / 1_000_000_000);
    const sisa = bulat % 1_000_000_000;
    return (
      angkaKeKata(miliaran) +
      ' miliar' +
      (sisa > 0 ? ' ' + angkaKeKata(sisa) : '')
    );
  }
  if (bulat < 1_000_000_000_000_000) {
    const triliunan = Math.floor(bulat / 1_000_000_000_000);
    const sisa = bulat % 1_000_000_000_000;
    return (
      angkaKeKata(triliunan) +
      ' triliun' +
      (sisa > 0 ? ' ' + angkaKeKata(sisa) : '')
    );
  }
  return String(bulat);
}

export function normalizeIndonesianTextForTts(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  text = text.replace(/https?:\/\/\S+/gi, 'tautan situs');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/[*_~`#>|•●▪►]/g, ' ');
  text = text.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu,
    ' '
  );

  text = text.replace(/s\.d\.|s\/d/gi, 'sampai dengan');
  text = text.replace(/≥/g, 'minimal ');
  text = text.replace(/≤/g, 'maksimal ');
  text = text.replace(/\b(\d+)\s*[-–]\s*(\d+)\b/g, '$1 sampai $2');

  // Expand currency, dates, percentages, and grouped numbers before plain digits so separators stay intact.
  text = text.replace(
    /Rp\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?\b/gi,
    (_, rawDigits) => {
      const cleanNum = parseInt(rawDigits.replace(/\./g, ''), 10);
      if (Number.isNaN(cleanNum)) return rawDigits + ' rupiah';
      return `${angkaKeKata(cleanNum)} rupiah`;
    }
  );

  text = text.replace(
    /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2})\b/g,
    (_, d, m, y) => {
      const hari = angkaKeKata(parseInt(d, 10));
      const bulan = NAMA_BULAN[parseInt(m, 10)] || m;
      const tahun = angkaKeKata(parseInt(y, 10));
      return `${hari} ${bulan} ${tahun}`;
    }
  );

  text = text.replace(
    /\b(\d+)(?:[,.](\d+))?\s*%/g,
    (_, intPart, decPart) => {
      const utama = angkaKeKata(parseInt(intPart, 10));
      if (!decPart) return `${utama} persen`;
      const desimal = decPart
        .split('')
        .map((d) => angkaKeKata(parseInt(d, 10)))
        .join(' ');
      return `${utama} koma ${desimal} persen`;
    }
  );

  text = text.replace(/\b\d{1,3}(?:\.\d{3})+\b/g, (match) => {
    const cleanNum = parseInt(match.replace(/\./g, ''), 10);
    return Number.isNaN(cleanNum) ? match : angkaKeKata(cleanNum);
  });

  text = text.replace(/\b(\d+),(\d+)\b/g, (_, intPart, decPart) => {
    const utama = angkaKeKata(parseInt(intPart, 10));
    const desimal = decPart
      .split('')
      .map((d) => angkaKeKata(parseInt(d, 10)))
      .join(' ');
    return `${utama} koma ${desimal}`;
  });

  text = text.replace(/\b\d+\b/g, (match) => {
    // Spell 8+ digit identifiers like NPSN digit-by-digit instead of as millions.
    if (match.length >= 8) {
      return match
        .split('')
        .map((d) => angkaKeKata(parseInt(d, 10)))
        .join(' ');
    }
    const num = parseInt(match, 10);
    return Number.isNaN(num) ? match : angkaKeKata(num);
  });

  for (const [singkatan, lafal] of Object.entries(KAMUS_PELAFALAN)) {
    const escaped = singkatan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    text = text.replace(regex, lafal);
  }

  text = text.replace(/\bBapak\/Ibu\b/gi, 'Bapak Ibu');
  text = text.replace(/\s*\/\s*/g, ' atau ');

  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function splitIntoSentences(text = '') {
  if (!text || typeof text !== 'string') return [];
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const parts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [cleaned];
}

