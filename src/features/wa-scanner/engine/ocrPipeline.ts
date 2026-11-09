import { createWorker, PSM } from 'tesseract.js';
import type {
  AiScanAnalysisResult,
  BoundingBox,
  DetectedTextRegion,
  ImageDiagnostics,
  ImagePreprocessAdjustments,
  OcrEvaluationMetrics,
  OcrPipelineProgressInfo,
} from '@/types/scanner';
import type { BospRealizationItem } from '@/types/school';
import type { ImageVariant, RawOcrLine } from './internalTypes';
import { analyzeImageStageA } from './imageDiagnostics';
import { generateAdaptiveVariantsStageB } from './imagePreprocessing';
import {
  cropRegionFromCanvas,
  computeBoxOverlap,
  parseTesseractPageLines,
  reconcileMultiPassLinesStageE,
  reconstructReadingOrderStageF,
  runOptionalVisionAiPass,
} from './ocrReconciler';
import { analyzeChatWithBospItems } from './bospLegalMatcher';
import { enhanceWithAiJudgement } from './aiJudge';

function estimateAutoDeskewAngle(sourceCanvas: HTMLCanvasElement): number {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (w < 80 || h < 80) return 0;

  const sampleW = Math.min(280, w);
  const scale = sampleW / w;
  const sampleH = Math.max(60, Math.round(h * scale));

  const tmp = document.createElement('canvas');
  tmp.width = sampleW;
  tmp.height = sampleH;
  const tCtx = tmp.getContext('2d', { willReadFrequently: true });
  if (!tCtx) return 0;
  tCtx.drawImage(sourceCanvas, 0, 0, sampleW, sampleH);

  const rgba = tCtx.getImageData(0, 0, sampleW, sampleH).data;
  const lum = new Float32Array(sampleW * sampleH);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    lum[p] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }

  const angles = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];
  let bestAngle = 0;
  let maxVariance = -1;

  for (const ang of angles) {
    const rad = (ang * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const rowSums = new Float64Array(sampleH);
    const rowCounts = new Uint32Array(sampleH);

    for (let y = 0; y < sampleH; y += 2) {
      for (let x = 0; x < sampleW; x += 2) {
        const cx = x - sampleW / 2;
        const cy = y - sampleH / 2;
        const rotY = Math.round(cy * cosA - cx * sinA + sampleH / 2);
        if (rotY >= 0 && rotY < sampleH) {
          rowSums[rotY] += lum[y * sampleW + x];
          rowCounts[rotY]++;
        }
      }
    }

    let mean = 0;
    let validRows = 0;
    for (let r = 0; r < sampleH; r++) {
      if (rowCounts[r] > 0) {
        rowSums[r] /= rowCounts[r];
        mean += rowSums[r];
        validRows++;
      }
    }
    if (validRows === 0) continue;
    mean /= validRows;

    let variance = 0;
    for (let r = 0; r < sampleH; r++) {
      if (rowCounts[r] > 0) {
        const diff = rowSums[r] - mean;
        variance += diff * diff;
      }
    }

    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = ang;
    }
  }

  return bestAngle;
}

async function loadSourceToCanvas(
  imageSource: File | string | HTMLCanvasElement,
  adjustments?: ImagePreprocessAdjustments
): Promise<{
  canvas: HTMLCanvasElement;
  ocrCanvas: HTMLCanvasElement;
  dataUrl: string;
}> {
  if (typeof document === 'undefined') {
    throw new Error('Canvas DOM environment required for image processing.');
  }

  const baseImg = await new Promise<HTMLImageElement | HTMLCanvasElement>((resolve, reject) => {
    if (typeof HTMLCanvasElement !== 'undefined' && imageSource instanceof HTMLCanvasElement) {
      resolve(imageSource);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let objectUrl: string | null = null;

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat berkas gambar. Format tidak didukung atau gambar rusak.'));
    };

    if (imageSource instanceof File) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      reject(new Error('Sumber gambar tidak valid.'));
    }
  });

  const srcW = baseImg instanceof HTMLCanvasElement ? baseImg.width : baseImg.naturalWidth || baseImg.width;
  const srcH = baseImg instanceof HTMLCanvasElement ? baseImg.height : baseImg.naturalHeight || baseImg.height;

  if (!srcW || !srcH || srcW < 16 || srcH < 16) {
    throw new Error(`Dimensi gambar terlalu kecil atau tidak valid (${srcW}x${srcH}px).`);
  }

  const crop = adjustments?.cropRect;
  const cropX = crop ? Math.max(0, Math.round(crop.x * srcW)) : 0;
  const cropY = crop ? Math.max(0, Math.round(crop.y * srcH)) : 0;
  const cropW = crop ? Math.max(32, Math.min(srcW - cropX, Math.round(crop.width * srcW))) : srcW;
  const cropH = crop ? Math.max(32, Math.min(srcH - cropY, Math.round(crop.height * srcH))) : srcH;

  const rotDeg = ((adjustments?.rotationDeg || 0) % 360 + 360) % 360;
  const manualDeskewDeg = adjustments?.deskewDeg;
  const totalAngleRad = ((rotDeg + (manualDeskewDeg || 0)) * Math.PI) / 180;

  const isSwapDims = rotDeg === 90 || rotDeg === 270;
  const outW = isSwapDims ? cropH : cropW;
  const outH = isSwapDims ? cropW : cropH;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Gagal menginisialisasi konteks Canvas 2D.');
  }

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);
  ctx.translate(outW / 2, outH / 2);
  if (totalAngleRad !== 0) {
    ctx.rotate(totalAngleRad);
  }
  ctx.drawImage(
    baseImg,
    cropX,
    cropY,
    cropW,
    cropH,
    -cropW / 2,
    -cropH / 2,
    cropW,
    cropH
  );
  ctx.restore();

  let ocrCanvas = canvas;
  if (manualDeskewDeg === undefined) {
    const autoDeg = estimateAutoDeskewAngle(canvas);
    if (Math.abs(autoDeg) >= 0.75) {
      const deskewed = document.createElement('canvas');
      deskewed.width = outW;
      deskewed.height = outH;
      const dCtx = deskewed.getContext('2d', { willReadFrequently: true });
      if (dCtx) {
        dCtx.fillStyle = '#FFFFFF';
        dCtx.fillRect(0, 0, outW, outH);
        dCtx.translate(outW / 2, outH / 2);
        dCtx.rotate((autoDeg * Math.PI) / 180);
        dCtx.drawImage(canvas, -outW / 2, -outH / 2);
        ocrCanvas = deskewed;
      }
    }
  }

  return {
    canvas,
    ocrCanvas,
    dataUrl: canvas.toDataURL('image/png'),
  };
}

export function levenshteinDistance<T>(a: ArrayLike<T>, b: ArrayLike<T>): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Int32Array(n + 1);
  let curr = new Int32Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n];
}

export function evaluateOcrAccuracy(
  extractedText: string,
  groundTruthText: string,
  regions: DetectedTextRegion[]
): OcrEvaluationMetrics {
  const cleanHypothesis = extractedText
    .replace(/\[teks tidak pasti:\s*([^/\]]+?)(?:\s*\/[^\]]+)?\]/gi, '$1')
    .replace(/\[tidak terbaca\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanRef = groundTruthText.replace(/\s+/g, ' ').trim();

  const hypChars = Array.from(cleanHypothesis.toLowerCase());
  const refChars = Array.from(cleanRef.toLowerCase());
  const charDist = levenshteinDistance(hypChars, refChars);
  const cer = Number((charDist / Math.max(1, refChars.length)).toFixed(4));
  const characterAccuracyPct = Number(
    Math.max(0, Math.min(100, (1 - cer) * 100)).toFixed(1)
  );

  const normalizeWords = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s\d.,:/+-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const hypWords = normalizeWords(cleanHypothesis);
  const refWords = normalizeWords(cleanRef);
  const wordDist = levenshteinDistance(hypWords, refWords);
  const wer = Number((wordDist / Math.max(1, refWords.length)).toFixed(4));
  const wordAccuracyPct = Number(
    Math.max(0, Math.min(100, (1 - wer) * 100)).toFixed(1)
  );

  const hypWordSet = new Set(hypWords);
  const missedWords = refWords.filter((w) => w.length >= 2 && !hypWordSet.has(w));

  const refLines = groundTruthText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let matchedLinesCount = 0;
  const matchedOrderIndices: number[] = [];

  for (const rLine of refLines) {
    const rTokens = normalizeWords(rLine);
    if (rTokens.length === 0) continue;
    let bestRegIdx = -1;
    let bestHitRatio = 0;

    regions.forEach((reg, idx) => {
      const regWords = new Set(normalizeWords(reg.cleanText || reg.text));
      const hits = rTokens.filter((t) => regWords.has(t)).length;
      const ratio = hits / rTokens.length;
      if (ratio > bestHitRatio) {
        bestHitRatio = ratio;
        bestRegIdx = idx;
      }
    });

    if (bestHitRatio >= 0.5 && bestRegIdx >= 0) {
      matchedLinesCount++;
      matchedOrderIndices.push(bestRegIdx);
    }
  }

  const missedLinesCount = Math.max(0, refLines.length - matchedLinesCount);
  const regionCompletenessPct = Number(
    Math.min(100, (matchedLinesCount / Math.max(1, refLines.length)) * 100).toFixed(1)
  );

  let concordantPairs = 0;
  let totalPairs = 0;
  for (let i = 0; i < matchedOrderIndices.length; i++) {
    for (let j = i + 1; j < matchedOrderIndices.length; j++) {
      totalPairs++;
      if (matchedOrderIndices[i] <= matchedOrderIndices[j]) {
        concordantPairs++;
      }
    }
  }
  const readingOrderScorePct =
    totalPairs > 0
      ? Number(((concordantPairs / totalPairs) * 100).toFixed(1))
      : 100;

  const hasUncertaintyMarkers =
    regions.some((r) => r.uncertaintyStatus !== 'certain') ||
    /\[tidak terbaca\]|\[teks tidak pasti:/i.test(extractedText);

  return {
    cer,
    wer,
    characterAccuracyPct,
    wordAccuracyPct,
    regionCompletenessPct,
    missedWordsCount: missedWords.length,
    missedWordsSample: Array.from(new Set(missedWords)).slice(0, 6),
    missedLinesCount,
    readingOrderScorePct,
    uncertaintyMarkingValid: hasUncertaintyMarkers || cer < 0.08,
    evaluationSummary: `CER ${(cer * 100).toFixed(1)}% (Akurasi Karakter ${characterAccuracyPct}%) • WER ${(wer * 100).toFixed(1)}% (Akurasi Kata ${wordAccuracyPct}%) • Kelengkapan Wilayah ${regionCompletenessPct}% • Ketepatan Urutan ${readingOrderScorePct}%`,
  };
}

export async function runAdvancedWaOcrPipeline(
  imageSource: File | string | HTMLCanvasElement,
  bospItems: BospRealizationItem[],
  onProgress?: (info: OcrPipelineProgressInfo) => void,
  adjustments?: ImagePreprocessAdjustments
): Promise<AiScanAnalysisResult> {
  const reportStage = (
    stage: OcrPipelineProgressInfo['stage'],
    stageTitle: string,
    stageDetail: string,
    progressPct: number
  ) => {
    if (onProgress) {
      onProgress({ stage, stageTitle, stageDetail, progressPct });
    }
  };

  reportStage(
    'A',
    'Tahap A: Analisis Kualitas & Struktur Gambar',
    'Memeriksa dimensi, resolusi, ketajaman, tingkat kompresi, pencahayaan, dan memetakan zona risiko teks...',
    12
  );

  const {
    canvas: baseCanvas,
    ocrCanvas,
    dataUrl: processedPreviewDataUrl,
  } = await loadSourceToCanvas(imageSource, adjustments);
  const diagnostics = analyzeImageStageA(ocrCanvas);

  reportStage(
    'B',
    'Tahap B: Peningkatan Kualitas Citra Adaptif',
    `Menyiapkan salinan multi-varian (Natural Upscale, Background-Suppressed Morph, Stroke-Separated Crisp, ${
      diagnostics.dominantTheme === 'dark' ? 'Dark Polarity Invert' : 'Chromatic Contrast'
    }) sesuai karakteristik gambar...`,
    26
  );

  const { variants } = generateAdaptiveVariantsStageB(
    ocrCanvas,
    diagnostics,
    adjustments?.enhanceContrast
  );

  reportStage(
    'C',
    'Tahap C: Deteksi Wilayah Teks Menyeluruh (Full-Image)',
    `Mengidentifikasi ${diagnostics.candidateZones.length} kandidat zona tulisan (header, chat, gambar sisipan, dan tepi layar)...`,
    38
  );

  reportStage(
    'D',
    'Tahap D: Ekstraksi Teks Multi-Pass OCR & Vision AI',
    `Menjalankan pembacaan berlapis pada ${variants.length} varian citra dan memeriksa zona berisiko...`,
    48
  );

  const allPassLines: RawOcrLine[] = [];
  const passesExecuted: string[] = [];

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker('ind+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const subPct = Math.min(82, Math.max(48, 48 + Math.round(m.progress * 28)));
          reportStage(
            'D',
            'Tahap D: Ekstraksi Teks Multi-Pass OCR & Vision AI',
            `Membaca karakter dan geometri kata (${Math.round(m.progress * 100)}%)...`,
            subPct
          );
        }
      },
    });

    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const variant = variants[vIdx];
      await worker.setParameters({
        tessedit_pageseg_mode: variant.psm,
        preserve_interword_spaces: '1',
      });

      const ret = await worker.recognize(
        variant.dataUrl,
        {},
        { text: true, blocks: true }
      );
      const parsedLines = parseTesseractPageLines(
        ret.data,
        variant,
        diagnostics.width,
        diagnostics.height
      );
      allPassLines.push(...parsedLines);
      passesExecuted.push(variant.name);

      // If the primary natural pass succeeded with high confidence and sufficient text,
      // skip destructive morphological passes that degrade anti-aliased digital fonts,
      // UNLESS dark regions exist which require Dark-Polarity-Inverted pass for white text in dark bubbles.
      const hasDarkPassPending = variants.some((v, idx) => idx > vIdx && v.name.includes('Dark-Polarity'));
      if (!hasDarkPassPending && vIdx === 0 && parsedLines.length >= 6) {
        const avgPassConf =
          parsedLines.reduce((acc, l) => acc + l.confidence, 0) / parsedLines.length;
        if (avgPassConf >= 68) {
          // Excellent crisp reading obtained from natural image; preserve tokens cleanly.
          break;
        }
      }
    }

    const trulyMissedZones = diagnostics.candidateZones.filter((zone) => {
      const overlappingLines = allPassLines.filter(
        (l) => computeBoxOverlap(zone.bbox, l.bbox).iou > 0.08
      );
      return (
        overlappingLines.length === 0 &&
        zone.strokeDensity >= 9.0 &&
        zone.bbox.x1 - zone.bbox.x0 >= 36 &&
        zone.bbox.y1 - zone.bbox.y0 >= 12
      );
    });

    const targetedZones = trulyMissedZones.slice(0, 3);
    if (targetedZones.length > 0) {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      });

      for (const z of targetedZones) {
        const isDarkZone = z.meanLuminance < 118;
        const cropInfo = cropRegionFromCanvas(
          ocrCanvas,
          z.bbox,
          2.8,
          isDarkZone,
          8
        );
        const cropVariant: ImageVariant = {
          name: `Targeted-Crop-${z.zoneHint}`,
          dataUrl: cropInfo.dataUrl,
          scaleX: cropInfo.scale,
          scaleY: cropInfo.scale,
          offsetX: cropInfo.offsetX,
          offsetY: cropInfo.offsetY,
          psm: PSM.SINGLE_BLOCK,
        };
        const retCrop = await worker.recognize(
          cropVariant.dataUrl,
          {},
          { text: true, blocks: true }
        );
        const cropLines = parseTesseractPageLines(
          retCrop.data,
          cropVariant,
          diagnostics.width,
          diagnostics.height
        );
        allPassLines.push(...cropLines);
      }
      passesExecuted.push(`Targeted-Crop-ReCheck (${targetedZones.length} wilayah)`);
    }

    await worker.terminate();
    worker = null;
  } catch (err) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore termination error
      }
    }
    console.warn('[AI OCR Pipeline] Worker warning:', err);
  }

  const configuredApiKey =
    adjustments?.visionApiKey?.trim() ||
    (typeof window !== 'undefined' && (window as any).__DARADIK_GEMINI_KEY__) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY)) ||
    '';

  let privacyMode: AiScanAnalysisResult['privacyMode'] = 'local-browser';

  const shouldRunVision =
    adjustments?.enableVisionAi !== false &&
    (allPassLines.length === 0 || allPassLines.length < 8 || adjustments?.enableVisionAi === true || Boolean(configuredApiKey));

  if (shouldRunVision) {
    try {
      reportStage(
        'D',
        'Tahap D: Ekstraksi Teks Multi-Pass OCR & Vision AI',
        'Menyempurnakan pembacaan dengan Gemini Vision Multimodal...',
        75
      );
      const visionLines = await runOptionalVisionAiPass(
        processedPreviewDataUrl,
        configuredApiKey,
        diagnostics.width,
        diagnostics.height
      );
      if (visionLines.length > 0) {
        allPassLines.push(...visionLines);
        passesExecuted.push('Vision-AI-Gemini');
        privacyMode = 'hybrid-vision-ai';
      }
    } catch (visionErr) {
      console.warn('[AI OCR Pipeline] Vision AI pass skipped:', visionErr);
    }
  }

  reportStage(
    'E',
    'Tahap E: Rekonsiliasi Multi-Pass & Pemeriksaan Ulang',
    'Membandingkan hasil antar-metode, mendisambiguasi angka/karakter, dan menandai area meragukan...',
    88
  );

  const { reconciledLines, unreadRegions, reconciledDiffsCount } =
    reconcileMultiPassLinesStageE(
      allPassLines,
      diagnostics.candidateZones,
      ocrCanvas
    );

  reportStage(
    'F',
    'Tahap F: Penyusunan Urutan Baca & Struktur Percakapan',
    'Menyusun transkripsi sesuai tata letak visual dari atas ke bawah serta menyinkronkan data BOSP...',
    95
  );

  const { regions, fullStructuredTranscript, rawOcrText } =
    reconstructReadingOrderStageF(
      reconciledLines,
      unreadRegions,
      diagnostics,
      ocrCanvas
    );

  const uncertainRegionsCount = regions.filter(
    (r) => r.uncertaintyStatus === 'uncertain'
  ).length;
  const unreadableRegionsCount = regions.filter(
    (r) => r.uncertaintyStatus === 'unreadable'
  ).length;

  const semanticRegions = regions.filter(
    (r) =>
      r.uncertaintyStatus !== 'unreadable' &&
      r.category !== 'status_bar' &&
      r.category !== 'footer_interface'
  );

  const cleanBodyText = semanticRegions
    .map((r) => r.cleanText || r.text)
    .filter(Boolean)
    .join('\n\n')
    .trim();

  const semanticBodyText =
    semanticRegions.map((r) => r.text).join('\n\n').trim() || rawOcrText.trim();

  const finalRawText =
    rawOcrText.trim() ||
    '[tidak terbaca — tidak ditemukan teks yang dapat dikenali secara pasti pada gambar ini]';

  const schoolName = adjustments?.schoolName || 'SMK TI BAZMA';
  const studentCount = adjustments?.studentCount || 90;

  // Run comprehensive multi-tier analysis so no pungli signal in bubbles or headers is missed
  const primaryAnalysis = analyzeChatWithBospItems(
    cleanBodyText || semanticBodyText || finalRawText,
    bospItems,
    schoolName,
    studentCount,
    'screenshot',
    adjustments
  );

  let bospAnalysis = primaryAnalysis;

  // If primary analysis didn't flag danger, verify against finalRawText and fullStructuredTranscript
  if (bospAnalysis.statusType !== 'danger') {
    if (finalRawText && finalRawText !== cleanBodyText) {
      const fallbackAnalysis = analyzeChatWithBospItems(
        finalRawText,
        bospItems,
        schoolName,
        studentCount,
        'screenshot',
        adjustments
      );
      if (fallbackAnalysis.statusType === 'danger') {
        bospAnalysis = fallbackAnalysis;
      }
    }
    if (bospAnalysis.statusType !== 'danger' && fullStructuredTranscript) {
      const fullAnalysis = analyzeChatWithBospItems(
        fullStructuredTranscript,
        bospItems,
        schoolName,
        studentCount,
        'screenshot',
        adjustments
      );
      if (fullAnalysis.statusType === 'danger') {
        bospAnalysis = fullAnalysis;
      }
    }
  }

  const readableRegions = regions.filter((r) => r.uncertaintyStatus !== 'unreadable');
  const avgOcrConfidence =
    readableRegions.length > 0
      ? Math.round(
          readableRegions.reduce((acc, r) => acc + r.confidence, 0) /
            readableRegions.length
        )
      : 0;

  const blendedConfidence =
    avgOcrConfidence > 0
      ? Math.min(
          99,
          Math.max(
            bospAnalysis.matchedItem || bospAnalysis.statusType === 'danger' ? 88 : 75,
            Math.round(bospAnalysis.confidenceScore * 0.65 + avgOcrConfidence * 0.35)
          )
        )
      : bospAnalysis.confidenceScore;

  const evaluationMetrics = adjustments?.referenceGroundTruth
    ? evaluateOcrAccuracy(
        finalRawText,
        adjustments.referenceGroundTruth,
        regions
      )
    : undefined;

  reportStage(
    'F',
    'Selesai: Transkripsi & Verifikasi Siap',
    `Berhasil mendeteksi ${regions.length} wilayah teks (${passesExecuted.length} metode pemeriksaan).`,
    100
  );

  const baseResult: AiScanAnalysisResult = {
    ...bospAnalysis,
    rawOcrText: finalRawText,
    fullStructuredTranscript:
      fullStructuredTranscript.trim() || finalRawText,
    confidenceScore: blendedConfidence,
    diagnostics,
    regions,
    uncertainRegionsCount,
    unreadableRegionsCount,
    passesExecuted,
    reconciledDiffsCount,
    processedPreviewDataUrl,
    privacyMode,
    evaluationMetrics,
  };

  if (adjustments?.enableVisionAi !== false) {
    try {
      const fused = await enhanceWithAiJudgement(baseResult, {
        text: fullStructuredTranscript.trim() || finalRawText,
        imageDataUrl: processedPreviewDataUrl,
        bospItems,
        schoolName,
        studentCount,
        schoolContext: adjustments,
      });
      return fused;
    } catch {
      return baseResult;
    }
  }

  return baseResult;
}

export async function performImageOcr(
  imageSource: File | string,
  onProgress?: (progressPct: number) => void
): Promise<string> {
  const res = await runAdvancedWaOcrPipeline(
    imageSource,
    [],
    (info) => {
      if (onProgress) onProgress(info.progressPct);
    }
  );
  return res.rawOcrText;
}

