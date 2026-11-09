import type {
  BoundingBox,
  CandidateTextZone,
  DetectedTextRegion,
  ImageDiagnostics,
  OcrWordDetail,
  RegionCategory,
  UncertaintyStatus,
} from '@/types/scanner';
import type { ImageVariant, RawOcrLine, RawOcrWord, ReconciledLine } from './internalTypes';
import { createAdaptiveSauvolaCanvas } from './imagePreprocessing';

export function parseTesseractPageLines(
  pageData: any,
  variant: ImageVariant,
  imgWidth: number,
  imgHeight: number
): RawOcrLine[] {
  const linesOut: RawOcrLine[] = [];

  if (pageData?.blocks && Array.isArray(pageData.blocks)) {
    for (const block of pageData.blocks) {
      if (!block.paragraphs) continue;
      for (const para of block.paragraphs) {
        if (!para.lines) continue;
        for (const line of para.lines) {
          const lineText = (line.text || '').trim();
          if (!lineText) continue;

          const words: RawOcrWord[] = [];
          if (Array.isArray(line.words)) {
            for (const w of line.words) {
              const wText = (w.text || '').trim();
              if (!wText) continue;
              const wx0 = Math.max(0, Math.round(w.bbox.x0 / variant.scaleX + variant.offsetX));
              const wy0 = Math.max(0, Math.round(w.bbox.y0 / variant.scaleY + variant.offsetY));
              const wx1 = Math.min(imgWidth, Math.round(w.bbox.x1 / variant.scaleX + variant.offsetX));
              const wy1 = Math.min(imgHeight, Math.round(w.bbox.y1 / variant.scaleY + variant.offsetY));

              const alts: string[] = [];
              if (Array.isArray(w.choices)) {
                for (const ch of w.choices) {
                  const ct = (ch.text || '').trim();
                  if (ct && ct !== wText && !alts.includes(ct)) {
                    alts.push(ct);
                  }
                }
              }

              words.push({
                text: wText,
                confidence: typeof w.confidence === 'number' ? w.confidence : line.confidence || 75,
                bbox: { x0: wx0, y0: wy0, x1: Math.max(wx0 + 4, wx1), y1: Math.max(wy0 + 4, wy1) },
                passName: variant.name,
                alternatives: alts.slice(0, 2),
              });
            }
          }

          if (words.length === 0) continue;

          const lx0 = Math.max(0, Math.round(line.bbox.x0 / variant.scaleX + variant.offsetX));
          const ly0 = Math.max(0, Math.round(line.bbox.y0 / variant.scaleY + variant.offsetY));
          const lx1 = Math.min(imgWidth, Math.round(line.bbox.x1 / variant.scaleX + variant.offsetX));
          const ly1 = Math.min(imgHeight, Math.round(line.bbox.y1 / variant.scaleY + variant.offsetY));

          linesOut.push({
            text: words.map((w) => w.text).join(' '),
            confidence: typeof line.confidence === 'number' ? line.confidence : 75,
            bbox: { x0: lx0, y0: ly0, x1: Math.max(lx0 + 8, lx1), y1: Math.max(ly0 + 6, ly1) },
            words,
            passName: variant.name,
          });
        }
      }
    }
  } else if (pageData?.text) {
    // Synthesize approximate row bands if Tesseract returned plain text without layout blocks.
    const rawLines = String(pageData.text)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    rawLines.forEach((lt, idx) => {
      const bandH = Math.max(18, Math.round(imgHeight / Math.max(rawLines.length + 1, 6)));
      const y0 = Math.min(imgHeight - 20, idx * bandH + 10);
      const y1 = Math.min(imgHeight, y0 + bandH - 4);
      const tokens = lt.split(/\s+/).filter(Boolean);
      const tokW = Math.max(20, Math.round((imgWidth * 0.8) / Math.max(tokens.length, 1)));
      const words: RawOcrWord[] = tokens.map((tok, tIdx) => ({
        text: tok,
        confidence: pageData.confidence || 75,
        bbox: {
          x0: 20 + tIdx * tokW,
          y0,
          x1: Math.min(imgWidth - 10, 20 + (tIdx + 1) * tokW - 2),
          y1,
        },
        passName: variant.name,
        alternatives: [],
      }));

      linesOut.push({
        text: lt,
        confidence: pageData.confidence || 75,
        bbox: { x0: 20, y0, x1: imgWidth - 20, y1 },
        words,
        passName: variant.name,
      });
    });
  }

  return linesOut;
}

export function cropRegionFromCanvas(
  canvas: HTMLCanvasElement,
  bbox: BoundingBox,
  upscale: number = 1,
  invertAndContrast: boolean = false,
  paddingPx: number = 6
): { dataUrl: string; offsetX: number; offsetY: number; scale: number } {
  const x0 = Math.max(0, Math.floor(bbox.x0 - paddingPx));
  const y0 = Math.max(0, Math.floor(bbox.y0 - paddingPx));
  const x1 = Math.min(canvas.width, Math.ceil(bbox.x1 + paddingPx));
  const y1 = Math.min(canvas.height, Math.ceil(bbox.y1 + paddingPx));
  const w = Math.max(16, x1 - x0);
  const h = Math.max(12, y1 - y0);

  const cropCanvas = document.createElement('canvas');
  const borderPad = Math.round(8 * upscale);
  cropCanvas.width = Math.round(w * upscale) + borderPad * 2;
  cropCanvas.height = Math.round(h * upscale) + borderPad * 2;
  const ctx = cropCanvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      canvas,
      x0,
      y0,
      w,
      h,
      borderPad,
      borderPad,
      Math.round(w * upscale),
      Math.round(h * upscale)
    );
  }

  const finalCanvas = invertAndContrast
    ? createAdaptiveSauvolaCanvas(cropCanvas, true)
    : upscale > 1.2
    ? createAdaptiveSauvolaCanvas(cropCanvas, false)
    : cropCanvas;

  return {
    dataUrl: finalCanvas.toDataURL('image/png'),
    offsetX: x0 - borderPad / upscale,
    offsetY: y0 - borderPad / upscale,
    scale: upscale,
  };
}

export async function runOptionalVisionAiPass(
  imageDataUrl: string,
  apiKey: string,
  imgWidth: number,
  imgHeight: number
): Promise<RawOcrLine[]> {
  try {
    const parts = imageDataUrl.split(',');
    const base64Data = parts[1];
    if (!base64Data) return [];

    let mimeType = 'image/png';
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }

    let rawText = '';

    // Cara 1: Gunakan server backend proxy /api/scan-vision (Aman, tanpa ekspos secret di client)
    try {
      const bController = new AbortController();
      const bTimeout = setTimeout(() => bController.abort(), 18000);
      const bRes = await fetch('/api/scan-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: bController.signal,
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      });
      clearTimeout(bTimeout);
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (bJson && typeof bJson.text === 'string' && bJson.text.trim()) {
          rawText = bJson.text.trim();
        }
      }
    } catch (bErr) {
      console.warn('[Vision AI] Backend proxy pass skipped, checking client direct key...', bErr);
    }

    // Cara 2: Fallback langsung ke Gemini API jika client memiliki direct key
    if (!rawText.trim() && apiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

      for (const modelCandidate of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${encodeURIComponent(
              apiKey
            )}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text:
                          'Transkripsikan seluruh teks dalam gambar tangkapan layar WhatsApp ini secara lengkap, persis, dan setia pada gambar baris demi baris dari atas ke bawah. ' +
                          'Pertahankan seluruh rincian seperti pengumuman, nama barang (contoh: kipas angin, buku, seragam), nominal rupiah (contoh: Rp75.000), tanggal batas akhir, dan kalimat lainnya tanpa meringkas.',
                      },
                      {
                        inlineData: {
                          mimeType,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            const json = await response.json();
            rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawText.trim()) break;
          }
        } catch {
          // try next model candidate
        }
      }

      clearTimeout(timeoutId);
    }
    if (!rawText.trim()) return [];

    const lines = rawText
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    return lines.map((lineText: string, idx: number) => {
      const bandH = Math.max(18, Math.round(imgHeight / Math.max(lines.length + 1, 6)));
      const y0 = Math.min(imgHeight - 20, idx * bandH + 10);
      const y1 = Math.min(imgHeight, y0 + bandH - 2);
      const tokens = lineText.split(/\s+/).filter(Boolean);
      const tokW = Math.max(20, Math.round((imgWidth * 0.8) / Math.max(tokens.length, 1)));
      return {
        text: lineText,
        confidence: 96,
        bbox: { x0: 24, y0, x1: imgWidth - 24, y1 },
        words: tokens.map((tok: string, tIdx: number) => ({
          text: tok,
          confidence: 96,
          bbox: {
            x0: 24 + tIdx * tokW,
            y0,
            x1: Math.min(imgWidth - 12, 24 + (tIdx + 1) * tokW - 2),
            y1,
          },
          passName: 'Vision-AI-Gemini',
          alternatives: [],
        })),
        passName: 'Vision-AI-Gemini',
      };
    });
  } catch {
    return [];
  }
}

export function computeBoxOverlap(a: BoundingBox, b: BoundingBox): {
  iou: number;
  vOverlapRatio: number;
  hOverlapRatio: number;
} {
  const ix0 = Math.max(a.x0, b.x0);
  const iy0 = Math.max(a.y0, b.y0);
  const ix1 = Math.min(a.x1, b.x1);
  const iy1 = Math.min(a.y1, b.y1);

  const iw = Math.max(0, ix1 - ix0);
  const ih = Math.max(0, iy1 - iy0);
  const interArea = iw * ih;

  const areaA = Math.max(1, (a.x1 - a.x0) * (a.y1 - a.y0));
  const areaB = Math.max(1, (b.x1 - b.x0) * (b.y1 - b.y0));
  const unionArea = areaA + areaB - interArea;

  const minH = Math.max(1, Math.min(a.y1 - a.y0, b.y1 - b.y0));
  const minW = Math.max(1, Math.min(a.x1 - a.x0, b.x1 - b.x0));

  return {
    iou: interArea / Math.max(1, unionArea),
    vOverlapRatio: ih / minH,
    hOverlapRatio: iw / minW,
  };
}

export const OCR_HIGH_PLAUSIBILITY_LEXICON = new Set([
  'assalamualaikum', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'bapak', 'ibu', 'wali', 'murid',
  'orang', 'tua', 'siswa', 'siswi', 'anak', 'kelas', 'sekolah', 'komite', 'paguyuban', 'bendahara',
  'kepala', 'guru', 'pengumuman', 'informasi', 'himbauan', 'dimohon', 'diharapkan', 'wajib', 'diwajibkan',
  'harus', 'bayar', 'pembayaran', 'iuran', 'sumbangan', 'pungutan', 'dana', 'uang', 'biaya', 'tarif',
  'tagihan', 'tunggakan', 'lunas', 'melunasi', 'pelunasan', 'transfer', 'rekening', 'tunai', 'setor',
  'kumpul', 'dikumpulkan', 'paling', 'lambat', 'batas', 'waktu', 'akhir', 'jatuh', 'tempo', 'tanggal',
  'sebelum', 'maksimal', 'minimal', 'sebesar', 'senilai', 'ribu', 'juta', 'rupiah', 'per', 'bulan',
  'semester', 'tahun', 'ajaran', 'denda', 'sanksi', 'ditahan', 'kartu', 'ujian', 'ulangan', 'rapor',
  'raport', 'ijazah', 'anbk', 'ukk', 'ppdb', 'spmb', 'daftar', 'ulang', 'formulir', 'buku', 'paket',
  'teks', 'modul', 'lks', 'perpustakaan', 'literasi', 'kertas', 'hvs', 'sidu', 'atk', 'fotokopi',
  'soal', 'tinta', 'printer', 'spidol', 'toilet', 'wastafel', 'sanitasi', 'kamar', 'mandi', 'keran',
  'kran', 'air', 'sabun', 'kebersihan', 'meja', 'kursi', 'bangku', 'meubelair', 'mebel', 'kipas',
  'angin', 'ventilasi', 'pendingin', 'ac', 'internet', 'wifi', 'kuota', 'router', 'modem', 'jaringan',
  'proyektor', 'projector', 'infocus', 'infokus', 'lcd', 'layar', 'komputer', 'laptop', 'multimedia',
  'listrik', 'gedung', 'bangunan', 'pangkal', 'spp', 'seragam', 'batik', 'olahraga', 'pramuka',
  'ekstrakurikuler', 'ekskul', 'praktikum', 'koperasi', 'study', 'tour', 'wisata', 'piknik', 'perpisahan',
  'wisuda', 'kaos', 'jaket', 'kas', 'sukarela', 'seikhlasnya', 'tidak', 'bukan', 'tanpa', 'paksaan',
]);

// Score real Indonesian/currency tokens above wallpaper border artifacts like "|||" or "~_~".
export function computeTokenPlausibilityScore(token: string): number {
  const trimmed = token.trim();
  if (!trimmed) return -50;

  const alnumMatches = trimmed.match(/[a-zA-Z0-9]/g);
  const alnumCount = alnumMatches ? alnumMatches.length : 0;

  if (alnumCount === 0) {
    if (/^[+\-&/%@✓✔]+$/.test(trimmed)) return 0;
    return -35;
  }

  const ratio = alnumCount / trimmed.length;
  let bonus = ratio * 18;

  if (/^(@?rp\.?|idr|\d{1,3}([.,]\d{3})+|\d+\s*(rb|ribu|k|jt|juta)|\d{1,2}[:.]\d{2}|wib|wita|wit)$/i.test(trimmed)) {
    bonus += 18;
  }
  const cleanAlpha = trimmed.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (OCR_HIGH_PLAUSIBILITY_LEXICON.has(cleanAlpha)) {
    bonus += 20;
  } else if (/^[A-Za-z]{3,}$/.test(cleanAlpha)) {
    bonus += 10;
  }
  if (/[|~^`\\§¤¨°]{1,}/.test(trimmed)) {
    bonus -= 24;
  }

  return bonus;
}

// Resolve O/0, I/l/1, S/5, and B/8 confusions strictly inside currency, timestamp, or phone contexts.
export function disambiguateConfusedCharacters(
  token: string,
  prevToken: string,
  nextToken: string
): { corrected: string; wasDisambiguated: boolean } {
  let out = token;
  const prevLower = (prevToken || '').toLowerCase();
  const nextLower = (nextToken || '').toLowerCase();

  const isAfterCurrency =
    prevLower === 'rp' ||
    prevLower === 'rp.' ||
    prevLower === '@rp' ||
    prevLower === 'idr' ||
    /^@?rp\.?/i.test(token);

  const isBeforeUnit =
    /^(rb|ribu|jt|juta|k|siswa|murid|anak|bulan|bln|unit|paket)$/i.test(nextLower) ||
    /(rb|ribu|jt|juta|\/(siswa|murid|anak|bln|bulan|orang))$/i.test(token);

  if (
    isAfterCurrency ||
    isBeforeUnit ||
    /^@?[0-9OIlSB]{1,3}\.[0-9OIl]{3}(\.[0-9OIl]{3})?(\/[a-zA-Z]+)?$/i.test(token)
  ) {
    out = out.replace(
      /([0-9OIlSB.,]{2,})/g,
      (numPart) => {
        if (!/[0-9O]/.test(numPart)) return numPart;
        return numPart
          .replace(/[Oo]/g, '0')
          .replace(/[Il|]/g, '1')
          .replace(/S(?=\d)/g, '5')
          .replace(/B(?=\d)/g, '8');
      }
    );
  }

  if (/^[0-2OIl][0-9OIl][:.][0-5OIl][0-9OIl]$/.test(token)) {
    out = token
      .replace(/[Oo]/g, '0')
      .replace(/[Il|]/g, '1');
  }

  if (/^(\+62|08)[0-9OIl\-]{6,}$/.test(token)) {
    out = token
      .replace(/[Oo]/g, '0')
      .replace(/[Il|]/g, '1');
  }

  return {
    corrected: out,
    wasDisambiguated: out !== token,
  };
}

export function reconcileMultiPassLinesStageE(
  allPassLines: RawOcrLine[],
  candidateZones: CandidateTextZone[],
  baseCanvas: HTMLCanvasElement
): {
  reconciledLines: ReconciledLine[];
  unreadRegions: DetectedTextRegion[];
  reconciledDiffsCount: number;
} {
  const validRawLines = allPassLines.filter((line) => {
    const clean = line.text.trim();
    if (!clean) return false;
    const alnum = (clean.match(/[a-zA-Z0-9]/g) || []).length;
    if (alnum === 0 && line.confidence < 65) return false;
    if (clean.length === 1 && alnum === 0) return false;
    if (line.confidence < 26 && alnum < 2) return false;
    return true;
  });

  const clusters: RawOcrLine[][] = [];

  for (const line of validRawLines) {
    let bestClusterIdx = -1;
    let bestOverlapScore = 0;

    for (let i = 0; i < clusters.length; i++) {
      const rep = clusters[i][0];
      const { vOverlapRatio, hOverlapRatio } = computeBoxOverlap(line.bbox, rep.bbox);
      const centerDistY = Math.abs(
        (line.bbox.y0 + line.bbox.y1) / 2 - (rep.bbox.y0 + rep.bbox.y1) / 2
      );
      const maxH = Math.max(line.bbox.y1 - line.bbox.y0, rep.bbox.y1 - rep.bbox.y0, 12);

      if (
        (vOverlapRatio >= 0.45 || centerDistY <= maxH * 0.5) &&
        hOverlapRatio >= 0.25
      ) {
        const score = vOverlapRatio * 0.65 + hOverlapRatio * 0.35;
        if (score > bestOverlapScore) {
          bestOverlapScore = score;
          bestClusterIdx = i;
        }
      }
    }

    if (bestClusterIdx >= 0) {
      clusters[bestClusterIdx].push(line);
    } else {
      clusters.push([line]);
    }
  }

  let reconciledDiffsCount = 0;
  const reconciledLines: ReconciledLine[] = [];

  for (const cluster of clusters) {
    const passSources = Array.from(new Set(cluster.map((c) => c.passName)));

    const scoredLines = cluster.map((c) => {
      const tokenScore =
        c.words.reduce((acc, w) => acc + computeTokenPlausibilityScore(w.text), 0) /
        Math.max(1, c.words.length);
      // Slight tie-breaker favors unthresholded pixels when confidence is otherwise equal.
      const passBonus = c.passName === 'Natural-Original' ? 4 : 0;
      return {
        line: c,
        totalScore: c.confidence + tokenScore + passBonus,
      };
    });
    scoredLines.sort((a, b) => b.totalScore - a.totalScore);

    const wordSlots: RawOcrWord[][] = [];
    for (const { line } of scoredLines) {
      for (const word of line.words) {
        if (computeTokenPlausibilityScore(word.text) < -20 && word.confidence < 55) {
          continue;
        }
        let matchedSlot = -1;
        let bestHOverlap = 0;
        for (let s = 0; s < wordSlots.length; s++) {
          const repW = wordSlots[s][0];
          const { hOverlapRatio, vOverlapRatio } = computeBoxOverlap(word.bbox, repW.bbox);
          if (hOverlapRatio >= 0.38 && vOverlapRatio >= 0.3) {
            if (hOverlapRatio > bestHOverlap) {
              bestHOverlap = hOverlapRatio;
              matchedSlot = s;
            }
          }
        }
        if (matchedSlot >= 0) {
          wordSlots[matchedSlot].push(word);
        } else {
          wordSlots.push([word]);
        }
      }
    }

    wordSlots.sort((a, b) => a[0].bbox.x0 - b[0].bbox.x0);

    const preliminaryWords = wordSlots.map((slot) => {
      const scoredW = slot.map((w) => ({
        w,
        score:
          w.confidence +
          computeTokenPlausibilityScore(w.text) +
          (w.passName === 'Natural-Original' ? 3 : 0),
      }));
      scoredW.sort((a, b) => b.score - a.score);
      const best = scoredW[0].w;

      const distinctTexts = Array.from(
        new Set(
          scoredW
            .filter((item) => item.score >= scoredW[0].score - 14 && item.w.confidence >= 48)
            .map((item) => item.w.text)
        )
      );

      if (distinctTexts.length > 1) {
        reconciledDiffsCount++;
      }

      const alts = Array.from(
        new Set([...distinctTexts.filter((t) => t !== best.text), ...best.alternatives])
      ).slice(0, 2);

      return {
        best,
        alts,
        hadDisagreement: distinctTexts.length > 1,
      };
    });

    if (preliminaryWords.length === 0) continue;

    const finalWords: OcrWordDetail[] = [];
    const lineUncertaintyNotes: string[] = [];
    const lineAlternatives: string[] = [];

    for (let i = 0; i < preliminaryWords.length; i++) {
      const curr = preliminaryWords[i];
      const prevText = i > 0 ? preliminaryWords[i - 1].best.text : '';
      const nextText =
        i + 1 < preliminaryWords.length ? preliminaryWords[i + 1].best.text : '';

      const { corrected, wasDisambiguated } = disambiguateConfusedCharacters(
        curr.best.text,
        prevText,
        nextText
      );
      if (wasDisambiguated) {
        reconciledDiffsCount++;
      }

      const conf = Math.round(curr.best.confidence);
      let uncertaintyStatus: UncertaintyStatus = 'certain';

      if (conf < 58) {
        uncertaintyStatus = 'uncertain';
        lineUncertaintyNotes.push(
          `Kata "${corrected}" memiliki skor keyakinan rendah (${conf}%).`
        );
      } else if (curr.hadDisagreement && conf < 76 && curr.alts.length > 0) {
        uncertaintyStatus = 'uncertain';
        lineUncertaintyNotes.push(
          `Perbedaan pembacaan antar-metode pada "${corrected}" (alternatif: ${curr.alts.join(', ')}).`
        );
        lineAlternatives.push(`${corrected} / ${curr.alts[0]}`);
      }

      finalWords.push({
        text: corrected,
        rawText: curr.best.text,
        confidence: conf,
        bbox: curr.best.bbox,
        uncertaintyStatus,
        alternatives: curr.alts,
        passSource: curr.best.passName,
      });
    }

    const cleanLineStr = finalWords.map((w) => w.text).join(' ');
    const avgConf = Math.round(
      finalWords.reduce((s, w) => s + w.confidence, 0) / finalWords.length
    );
    if (finalWords.length === 1 && avgConf < 45 && cleanLineStr.length <= 2) {
      continue;
    }

    const lx0 = Math.min(...finalWords.map((w) => w.bbox.x0));
    const ly0 = Math.min(...finalWords.map((w) => w.bbox.y0));
    const lx1 = Math.max(...finalWords.map((w) => w.bbox.x1));
    const ly1 = Math.max(...finalWords.map((w) => w.bbox.y1));

    const hasUncertainWord = finalWords.some((w) => w.uncertaintyStatus !== 'certain');
    const formattedLineText = finalWords
      .map((w) => {
        if (w.uncertaintyStatus === 'uncertain') {
          if (w.alternatives.length > 0 && w.confidence < 72) {
            return `[teks tidak pasti: ${w.text} / ${w.alternatives[0]}]`;
          }
          if (w.confidence < 55) {
            return `[teks tidak pasti: ${w.text}]`;
          }
        }
        return w.text;
      })
      .join(' ');

    reconciledLines.push({
      bbox: { x0: lx0, y0: ly0, x1: lx1, y1: ly1 },
      words: finalWords,
      text: formattedLineText,
      cleanText: cleanLineStr,
      confidence: avgConf,
      uncertaintyStatus: hasUncertainWord || avgConf < 64 ? 'uncertain' : 'certain',
      uncertaintyNotes: lineUncertaintyNotes,
      alternatives: lineAlternatives,
      passSources,
    });
  }

  // Surface high-density stroke regions that produced zero OCR text as explicit unreadable zones.
  const unreadRegions: DetectedTextRegion[] = [];
  const imgW = baseCanvas.width;
  const imgH = baseCanvas.height;

  for (const zone of candidateZones) {
    const isCovered = reconciledLines.some((rl) => {
      const { iou, vOverlapRatio, hOverlapRatio } = computeBoxOverlap(zone.bbox, rl.bbox);
      return iou > 0.08 || (vOverlapRatio > 0.35 && hOverlapRatio > 0.25);
    });

    const zw = zone.bbox.x1 - zone.bbox.x0;
    const zh = zone.bbox.y1 - zone.bbox.y0;

    if (
      !isCovered &&
      zone.strokeDensity >= 11.5 &&
      zw >= 45 &&
      zh >= 12 &&
      zh <= imgH * 0.25
    ) {
      const cropPreview = cropRegionFromCanvas(baseCanvas, zone.bbox, 1.5, false, 4);
      unreadRegions.push({
        id: `region-unread-${unreadRegions.length + 1}`,
        orderIndex: 0,
        category: zone.zoneHint === 'header' ? 'header' : 'detected_text',
        categoryLabel: 'Area Teks Belum Terbaca',
        senderName: null,
        timestamp: null,
        quotedText: null,
        text: '[tidak terbaca]',
        cleanText: '',
        confidence: 0,
        uncertaintyStatus: 'unreadable',
        uncertaintyNotes: [
          `Terdeteksi pola goresan huruf pada koordinat (${zone.bbox.x0}, ${zone.bbox.y0}) namun karakter terlalu buram, tertutup, atau berkontras sangat rendah untuk dipastikan.`,
        ],
        alternatives: [],
        passSources: ['Visual-Stroke-Detector'],
        bbox: zone.bbox,
        normBbox: {
          x: Number(((zone.bbox.x0 / imgW) * 100).toFixed(2)),
          y: Number(((zone.bbox.y0 / imgH) * 100).toFixed(2)),
          w: Number(((zw / imgW) * 100).toFixed(2)),
          h: Number(((zh / imgH) * 100).toFixed(2)),
        },
        cropDataUrl: cropPreview.dataUrl,
        words: [],
      });
    }
  }

  return {
    reconciledLines,
    unreadRegions,
    reconciledDiffsCount,
  };
}

export const CATEGORY_LABELS: Record<RegionCategory, string> = {
  status_bar: 'Status Bar Antarmuka',
  header: 'Header Grup / Kontak WA',
  date_separator: 'Tanggal / Info Sistem',
  quoted_reply: ' Kutipan Balasan Pesan',
  message_incoming: 'Pesan Diterima (Chat Masuk)',
  message_outgoing: 'Pesan Dikirim (Chat Keluar)',
  embedded_media_text: 'Teks di Dalam Gambar / Poster',
  footer_interface: 'Bilah Input / Antarmuka Bawah',
  edge_or_floating: 'Teks Tepi / Dekat Elemen UI',
  detected_text: 'Teks Terdeteksi pada Gambar',
};

export function classifyRegionStructure(
  bbox: BoundingBox,
  lines: ReconciledLine[],
  diagnostics: ImageDiagnostics,
  baseCanvas: HTMLCanvasElement
): {
  category: RegionCategory;
  senderName: string | null;
  timestamp: string | null;
  quotedText: string | null;
} {
  const imgW = diagnostics.width;
  const imgH = diagnostics.height;
  const centerX = (bbox.x0 + bbox.x1) / 2;
  const widthRatio = (bbox.x1 - bbox.x0) / Math.max(1, imgW);

  const combinedClean = lines.map((l) => l.cleanText).join('\n');

  let timestamp: string | null = null;
  const timeMatch = combinedClean.match(
    /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s?(?:WIB|WITA|WIT|AM|PM))?\b/i
  );
  if (timeMatch) {
    timestamp = timeMatch[0];
  }

  if (bbox.y1 <= imgH * 0.058 && lines.length === 1) {
    return {
      category: 'status_bar',
      senderName: null,
      timestamp,
      quotedText: null,
    };
  }

  if (bbox.y0 <= imgH * 0.145 && bbox.y1 <= imgH * 0.22) {
    if (
      /paguyuban|grup|group|wali\s*murid|smk|sma|sd|smp|kelas|online|ketuk|anggota|\+62/i.test(
        combinedClean
      ) ||
      bbox.y0 <= imgH * 0.11
    ) {
      return {
        category: 'header',
        senderName: null,
        timestamp: null,
        quotedText: null,
      };
    }
  }

  if (
    lines.length <= 2 &&
    Math.abs(centerX - imgW / 2) < imgW * 0.14 &&
    widthRatio < 0.65 &&
    /^(hari ini|kemarin|today|yesterday|\d{1,2}\s+[a-zA-Z]+\s+\d{4}|pesan dan panggilan terenkripsi)/i.test(
      combinedClean.trim()
    )
  ) {
    return {
      category: 'date_separator',
      senderName: null,
      timestamp: null,
      quotedText: null,
    };
  }

  if (
    bbox.y0 >= imgH * 0.91 &&
    /ketik pesan|type a message|pesan/i.test(combinedClean)
  ) {
    return {
      category: 'footer_interface',
      senderName: null,
      timestamp: null,
      quotedText: null,
    };
  }

  const inEmbeddedMedia = diagnostics.structuralZones.embeddedMediaBoxes.some(
    (eb) => computeBoxOverlap(bbox, eb).iou > 0.25
  );
  if (
    inEmbeddedMedia ||
    /pengumuman resmi|rincian biaya|daftar iuran|rekening pembayaran|batas akhir|poster|brosur/i.test(
      combinedClean
    )
  ) {
    return {
      category: 'embedded_media_text',
      senderName: null,
      timestamp,
      quotedText: null,
    };
  }

  if (
    (bbox.x0 <= imgW * 0.02 || bbox.x1 >= imgW * 0.98) &&
    widthRatio < 0.35
  ) {
    return {
      category: 'edge_or_floating',
      senderName: null,
      timestamp,
      quotedText: null,
    };
  }

  let senderName: string | null = null;
  let quotedText: string | null = null;

  if (lines.length >= 2) {
    const firstLine = lines[0].cleanText.trim();
    if (
      firstLine.length <= 48 &&
      (/^(\+62|08|~|[A-Z][a-z]+\s+[A-Z][a-z]+)/.test(firstLine) ||
        /bendahara|komite|wali kelas|ketua|paguyuban|admin|kepsek|guru/i.test(firstLine)) &&
      !/assalamualaikum|selamat|bapak\/ibu|dimohon|pengumuman/i.test(firstLine)
    ) {
      senderName = firstLine;
    }
  }

  // Outgoing WhatsApp bubbles carry a green tint (#D9FDD3 in light theme, #005C4B in dark theme).
  let isGreenBubble = false;
  const ctx = baseCanvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    const sx = Math.max(0, Math.min(baseCanvas.width - 1, Math.round(bbox.x0 + 8)));
    const sy = Math.max(0, Math.min(baseCanvas.height - 1, Math.round(bbox.y0 + 8)));
    const pixel = ctx.getImageData(sx, sy, 1, 1).data;
    const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
    if (g > r + 12 && g > b + 8) {
      isGreenBubble = true;
    }
  }

  if (isGreenBubble || (bbox.x0 > imgW * 0.22 && bbox.x1 > imgW * 0.82 && !senderName)) {
    return {
      category: 'message_outgoing',
      senderName: senderName || null,
      timestamp,
      quotedText,
    };
  }

  if (bbox.x0 < imgW * 0.28 || senderName) {
    return {
      category: 'message_incoming',
      senderName,
      timestamp,
      quotedText,
    };
  }

  return {
    category: 'detected_text',
    senderName,
    timestamp,
    quotedText,
  };
}

export function reconstructReadingOrderStageF(
  reconciledLines: ReconciledLine[],
  unreadRegions: DetectedTextRegion[],
  diagnostics: ImageDiagnostics,
  baseCanvas: HTMLCanvasElement
): {
  regions: DetectedTextRegion[];
  fullStructuredTranscript: string;
  rawOcrText: string;
} {
  const imgW = diagnostics.width;
  const imgH = diagnostics.height;

  const sortedLines = [...reconciledLines].sort((a, b) => {
    const midYa = (a.bbox.y0 + a.bbox.y1) / 2;
    const midYb = (b.bbox.y0 + b.bbox.y1) / 2;
    const avgH = Math.max(10, (a.bbox.y1 - a.bbox.y0 + (b.bbox.y1 - b.bbox.y0)) / 2);
    if (Math.abs(midYa - midYb) <= avgH * 0.55) {
      return a.bbox.x0 - b.bbox.x0;
    }
    return a.bbox.y0 - b.bbox.y0;
  });

  const lineGroups: ReconciledLine[][] = [];
  for (const line of sortedLines) {
    if (lineGroups.length === 0) {
      lineGroups.push([line]);
      continue;
    }

    const prevGroup = lineGroups[lineGroups.length - 1];
    const prevLine = prevGroup[prevGroup.length - 1];
    const prevH = Math.max(12, prevLine.bbox.y1 - prevLine.bbox.y0);
    const currH = Math.max(12, line.bbox.y1 - line.bbox.y0);
    const maxLineH = Math.max(prevH, currH);

    const verticalGap = line.bbox.y0 - prevLine.bbox.y1;
    const leftDiff = Math.abs(line.bbox.x0 - prevLine.bbox.x0);
    const { hOverlapRatio } = computeBoxOverlap(line.bbox, prevLine.bbox);

    const crossesHeaderBoundary =
      prevLine.bbox.y1 <= imgH * 0.145 && line.bbox.y0 > imgH * 0.145;

    if (
      !crossesHeaderBoundary &&
      verticalGap <= maxLineH * 1.35 &&
      verticalGap >= -maxLineH * 0.5 &&
      (leftDiff <= imgW * 0.18 || hOverlapRatio >= 0.45)
    ) {
      prevGroup.push(line);
    } else {
      lineGroups.push([line]);
    }
  }

  const regions: DetectedTextRegion[] = lineGroups.map((group, idx) => {
    const gx0 = Math.min(...group.map((l) => l.bbox.x0));
    const gy0 = Math.min(...group.map((l) => l.bbox.y0));
    const gx1 = Math.max(...group.map((l) => l.bbox.x1));
    const gy1 = Math.max(...group.map((l) => l.bbox.y1));
    const bbox: BoundingBox = { x0: gx0, y0: gy0, x1: gx1, y1: gy1 };

    const { category, senderName, timestamp, quotedText } = classifyRegionStructure(
      bbox,
      group,
      diagnostics,
      baseCanvas
    );

    const text = group.map((l) => l.text).join('\n');
    const cleanText = group.map((l) => l.cleanText).join('\n');
    const allWords = group.flatMap((l) => l.words);
    const avgConf = Math.round(
      group.reduce((s, l) => s + l.confidence, 0) / Math.max(1, group.length)
    );
    const hasUncertain = group.some((l) => l.uncertaintyStatus !== 'certain');
    const uncertaintyStatus: UncertaintyStatus = hasUncertain ? 'uncertain' : 'certain';
    const uncertaintyNotes = group.flatMap((l) => l.uncertaintyNotes);
    const alternatives = Array.from(new Set(group.flatMap((l) => l.alternatives)));
    const passSources = Array.from(new Set(group.flatMap((l) => l.passSources)));

    const cropPreview = cropRegionFromCanvas(baseCanvas, bbox, 1.35, false, 6);

    return {
      id: `region-${idx + 1}`,
      orderIndex: idx + 1,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      senderName,
      timestamp,
      quotedText,
      text,
      cleanText,
      confidence: avgConf,
      uncertaintyStatus,
      uncertaintyNotes,
      alternatives,
      passSources,
      bbox,
      normBbox: {
        x: Number(((gx0 / imgW) * 100).toFixed(2)),
        y: Number(((gy0 / imgH) * 100).toFixed(2)),
        w: Number((((gx1 - gx0) / imgW) * 100).toFixed(2)),
        h: Number((((gy1 - gy0) / imgH) * 100).toFixed(2)),
      },
      cropDataUrl: cropPreview.dataUrl,
      words: allWords,
    };
  });

  const allOrderedRegions = [...regions, ...unreadRegions].sort(
    (a, b) => a.bbox.y0 - b.bbox.y0
  );
  allOrderedRegions.forEach((reg, idx) => {
    reg.orderIndex = idx + 1;
  });

  const structuredBlocks: string[] = [];
  const rawBlocks: string[] = [];

  for (const reg of allOrderedRegions) {
    if (reg.uncertaintyStatus === 'unreadable') {
      structuredBlocks.push(
        `[${reg.categoryLabel} — Koordinat (${reg.bbox.x0}, ${reg.bbox.y0})]\n[tidak terbaca]`
      );
      rawBlocks.push('[tidak terbaca]');
      continue;
    }

    const metaParts: string[] = [reg.categoryLabel];
    if (reg.senderName) metaParts.push(`Pengirim: ${reg.senderName}`);
    if (reg.timestamp) metaParts.push(`Waktu: ${reg.timestamp}`);

    const displayText = reg.cleanText?.trim() || reg.text;
    structuredBlocks.push(`[${metaParts.join(' • ')}]\n${displayText}`);
    rawBlocks.push(displayText);
  }

  return {
    regions: allOrderedRegions,
    fullStructuredTranscript: structuredBlocks.join('\n\n'),
    rawOcrText: rawBlocks.join('\n\n'),
  };
}
