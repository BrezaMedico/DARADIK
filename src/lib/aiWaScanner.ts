import { createWorker, PSM } from 'tesseract.js';
import { BospRealizationItem } from '../data/schoolsData';

// ============================================================================
// INTERFACES & TYPES FOR 6-STAGE ADVANCED OCR + VISION AI PIPELINE
// ============================================================================

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type RiskZoneType =
  | 'small_text'
  | 'low_contrast'
  | 'complex_background'
  | 'compressed_or_blurry'
  | 'edge_proximity'
  | 'overlapping_ui';

export interface RiskZone {
  id: string;
  type: RiskZoneType;
  label: string;
  bbox: BoundingBox;
  normBbox: { x: number; y: number; w: number; h: number };
  severity: 'low' | 'medium' | 'high';
}

export interface CandidateTextZone {
  id: string;
  bbox: BoundingBox;
  normBbox: { x: number; y: number; w: number; h: number };
  strokeDensity: number;
  localContrast: number;
  meanLuminance: number;
  zoneHint:
    | 'status_bar'
    | 'header'
    | 'chat_body'
    | 'embedded_media'
    | 'edge_margin'
    | 'footer';
  isLowContrastOrBlurry: boolean;
}

export interface ImageDiagnostics {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  isTallScreenshot: boolean;
  isLowResolution: boolean;
  meanBrightness: number;
  contrastScore: number;
  sharpnessScore: number;
  compressionArtifactScore: number;
  backgroundComplexityScore: number;
  dominantTheme: 'light' | 'dark' | 'colored_or_patterned';
  qualityWarnings: string[];
  structuralZones: {
    headerBandY: number;
    footerBandY: number;
    hasEmbeddedMedia: boolean;
    embeddedMediaBoxes: BoundingBox[];
  };
  riskZones: RiskZone[];
  candidateZones: CandidateTextZone[];
}

export interface ImagePreprocessAdjustments {
  rotationDeg?: number; // 0, 90, 180, 270
  deskewDeg?: number; // -15 to +15
  cropRect?: { x: number; y: number; width: number; height: number } | null; // 0..1 normalized
  enhanceContrast?: boolean;
  enableVisionAi?: boolean;
  visionApiKey?: string;
  referenceGroundTruth?: string;
  schoolName?: string;
  studentCount?: number;
}

export type RegionCategory =
  | 'status_bar'
  | 'header'
  | 'date_separator'
  | 'quoted_reply'
  | 'message_incoming'
  | 'message_outgoing'
  | 'embedded_media_text'
  | 'footer_interface'
  | 'edge_or_floating'
  | 'detected_text';

export type UncertaintyStatus = 'certain' | 'uncertain' | 'unreadable';

export interface OcrWordDetail {
  text: string;
  rawText: string;
  confidence: number;
  bbox: BoundingBox;
  uncertaintyStatus: UncertaintyStatus;
  alternatives: string[];
  passSource: string;
}

export interface DetectedTextRegion {
  id: string;
  orderIndex: number;
  category: RegionCategory;
  categoryLabel: string;
  senderName: string | null;
  timestamp: string | null;
  quotedText: string | null;
  text: string;
  cleanText: string;
  confidence: number;
  uncertaintyStatus: UncertaintyStatus;
  uncertaintyNotes: string[];
  alternatives: string[];
  passSources: string[];
  bbox: BoundingBox;
  normBbox: { x: number; y: number; w: number; h: number };
  cropDataUrl?: string;
  words: OcrWordDetail[];
}

export interface OcrPipelineProgressInfo {
  stage: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  stageTitle: string;
  stageDetail: string;
  progressPct: number;
}

export interface OcrEvaluationMetrics {
  cer: number; // Character Error Rate (0..1)
  wer: number; // Word Error Rate (0..1)
  characterAccuracyPct: number; // 0..100
  wordAccuracyPct: number; // 0..100
  regionCompletenessPct: number; // 0..100
  missedWordsCount: number;
  missedWordsSample: string[];
  missedLinesCount: number;
  readingOrderScorePct: number; // 0..100
  uncertaintyMarkingValid: boolean;
  evaluationSummary: string;
}

export interface FinancialComparisonData {
  nominalPerStudent: number | null;
  totalCollectedEstimate: number | null;
  bospAllocatedAmount: number | null;
  itemCode: string | null;
  disbursedPeriod: string | null;
  disbursedDate: string | null;
  discrepancyVerdict: string;
}

export interface PolicyRuleCheck {
  id: string;
  ruleTitle: string;
  regulation: string;
  status: 'violation' | 'warning' | 'compliant';
  verdictLabel: string;
  explanation: string;
}

export interface ThreeWayComparison {
  teacherText: {
    sourceType: 'screenshot' | 'direct_text';
    quote: string;
    detectedItem: string;
    detectedAmount: number | null;
    isMandatory: boolean;
    toneLabel: string;
  };
  schoolBudget: {
    schoolName: string;
    isFundedByBosp: boolean;
    itemCode: string | null;
    allocatedAmount: number | null;
    stage: string | null;
    factText: string;
  };
  bospPolicy: {
    verdictType: 'PUNGLI_BOSP' | 'PUNGLI_PEMAKSAAN' | 'SUMBANGAN_SUKARELA_SAH' | 'BELUM_TERIDENTIFIKASI';
    verdictTitle: string;
    policySummary: string;
    rules: PolicyRuleCheck[];
  };
}

export interface AiScanAnalysisResult {
  rawOcrText: string;
  fullStructuredTranscript: string;
  detectedQuote: string;
  detectedAmount: number | null;
  detectedItemKeyword: string | null;
  isMandatoryTone: boolean;
  statusType: 'danger' | 'safe' | 'neutral';
  statusTitle: string;
  bospFact: string;
  matchedItem: BospRealizationItem | null;
  legalNote: string;
  confidenceScore: number;
  financialComparison: FinancialComparisonData;
  sourceType?: 'screenshot' | 'direct_text';
  threeWayComparison?: ThreeWayComparison;
  // Advanced OCR + Vision AI Pipeline Data
  diagnostics: ImageDiagnostics;
  regions: DetectedTextRegion[];
  uncertainRegionsCount: number;
  unreadableRegionsCount: number;
  passesExecuted: string[];
  reconciledDiffsCount: number;
  processedPreviewDataUrl: string;
  privacyMode: 'local-browser' | 'hybrid-vision-ai';
  evaluationMetrics?: OcrEvaluationMetrics;
}

// Internal types for multi-pass reconciliation
interface RawOcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  passName: string;
  alternatives: string[];
}

interface RawOcrLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: RawOcrWord[];
  passName: string;
}

interface ImageVariant {
  name: string;
  dataUrl: string;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  psm: PSM;
}

// ============================================================================
// HELPER: LOAD IMAGE INTO HTML CANVAS (PRESERVING ORIGINAL FIDELITY)
// ============================================================================

async function loadSourceToCanvas(
  imageSource: File | string | HTMLCanvasElement,
  adjustments?: ImagePreprocessAdjustments
): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
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

  // Apply crop if specified
  const crop = adjustments?.cropRect;
  const cropX = crop ? Math.max(0, Math.round(crop.x * srcW)) : 0;
  const cropY = crop ? Math.max(0, Math.round(crop.y * srcH)) : 0;
  const cropW = crop ? Math.max(32, Math.min(srcW - cropX, Math.round(crop.width * srcW))) : srcW;
  const cropH = crop ? Math.max(32, Math.min(srcH - cropY, Math.round(crop.height * srcH))) : srcH;

  const rotDeg = ((adjustments?.rotationDeg || 0) % 360 + 360) % 360;
  const deskewDeg = adjustments?.deskewDeg || 0;
  const totalAngleRad = ((rotDeg + deskewDeg) * Math.PI) / 180;

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

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
  };
}

// ============================================================================
// TAHAP A: ANALISIS GAMBAR AWAL (DIMENSI, KUALITAS, STRUKTUR & ZONA RISIKO)
// ============================================================================

export function analyzeImageStageA(canvas: HTMLCanvasElement): ImageDiagnostics {
  const width = canvas.width;
  const height = canvas.height;
  const aspectRatio = Number((height / Math.max(1, width)).toFixed(2));
  const orientation: ImageDiagnostics['orientation'] =
    Math.abs(width - height) < Math.min(width, height) * 0.1
      ? 'square'
      : height > width
      ? 'portrait'
      : 'landscape';

  const isTallScreenshot = aspectRatio > 2.15 || height > 1650;
  const isLowResolution = width < 550 || height < 400;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      width,
      height,
      aspectRatio,
      orientation,
      isTallScreenshot,
      isLowResolution,
      meanBrightness: 128,
      contrastScore: 50,
      sharpnessScore: 50,
      compressionArtifactScore: 10,
      backgroundComplexityScore: 20,
      dominantTheme: 'light',
      qualityWarnings: [],
      structuralZones: {
        headerBandY: Math.round(height * 0.12),
        footerBandY: Math.round(height * 0.92),
        hasEmbeddedMedia: false,
        embeddedMediaBoxes: [],
      },
      riskZones: [],
      candidateZones: [],
    };
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // 1. Compute luminance array, brightness, histogram, and color saturation statistics
  const lum = new Float32Array(totalPixels);
  const sat = new Float32Array(totalPixels);
  const hist = new Uint32Array(256);
  let sumLum = 0;
  let darkPixelCount = 0;
  let lightPixelCount = 0;
  let coloredPixelCount = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[p] = l;
    sumLum += l;
    const bin = Math.min(255, Math.max(0, Math.round(l)));
    hist[bin]++;

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const cDelta = maxC - minC;
    sat[p] = cDelta;

    if (l < 65) darkPixelCount++;
    else if (l > 195) lightPixelCount++;
    if (cDelta > 42) coloredPixelCount++;
  }

  const meanBrightness = Math.round(sumLum / Math.max(1, totalPixels));

  // RMS contrast & percentile spread
  let sumSqDiff = 0;
  for (let p = 0; p < totalPixels; p++) {
    const d = lum[p] - meanBrightness;
    sumSqDiff += d * d;
  }
  const stdLum = Math.sqrt(sumSqDiff / Math.max(1, totalPixels));
  const contrastScore = Math.min(100, Math.max(5, Math.round((stdLum / 78) * 100)));

  // 2. Sharpness (Laplacian edge variance) & 8x8 JPEG Blockiness estimation
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let lapCount = 0;
  let blockBoundaryDiff = 0;
  let blockInteriorDiff = 0;
  let blockChecks = 0;

  const step = width > 1200 ? 2 : 1;
  for (let y = 2; y < height - 2; y += step) {
    const rowOffset = y * width;
    for (let x = 2; x < width - 2; x += step) {
      const idx = rowOffset + x;
      const c = lum[idx];
      const lap =
        4 * c -
        lum[idx - 1] -
        lum[idx + 1] -
        lum[idx - width] -
        lum[idx + width];
      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      lapCount++;

      if (x % 8 === 0 && x + 1 < width) {
        blockBoundaryDiff += Math.abs(lum[idx] - lum[idx - 1]);
        blockInteriorDiff += Math.abs(lum[idx + 1] - lum[idx]);
        blockChecks++;
      }
    }
  }

  const meanLap = laplacianSum / Math.max(1, lapCount);
  const lapVar = laplacianSqSum / Math.max(1, lapCount) - meanLap * meanLap;
  const sharpnessScore = Math.min(100, Math.max(5, Math.round(Math.sqrt(Math.max(0, lapVar)) * 2.2)));

  const avgBoundary = blockBoundaryDiff / Math.max(1, blockChecks);
  const avgInterior = blockInteriorDiff / Math.max(1, blockChecks);
  const blockRatio = avgInterior > 0.5 ? avgBoundary / avgInterior : 1;
  const compressionArtifactScore = Math.min(
    100,
    Math.max(0, Math.round((blockRatio - 0.95) * 85))
  );

  // 3. Dominant Theme & Background Complexity
  const darkRatio = darkPixelCount / Math.max(1, totalPixels);
  const coloredRatio = coloredPixelCount / Math.max(1, totalPixels);

  // Measure background texture complexity by checking local variance in non-text-like mid-tone blocks
  const cellW = Math.max(12, Math.round(width / 32));
  const cellH = Math.max(8, Math.round(height / 48));
  const gridCols = Math.ceil(width / cellW);
  const gridRows = Math.ceil(height / cellH);

  let noisyBgCells = 0;
  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const x0 = gx * cellW;
      const y0 = gy * cellH;
      const x1 = Math.min(width, x0 + cellW);
      const y1 = Math.min(height, y0 + cellH);
      let cSum = 0;
      let sSum = 0;
      let count = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const p = y * width + x;
          cSum += lum[p];
          sSum += sat[p];
          count++;
        }
      }
      const avgS = sSum / Math.max(1, count);
      if (avgS > 38) noisyBgCells++;
    }
  }
  const backgroundComplexityScore = Math.min(
    100,
    Math.round((noisyBgCells / Math.max(1, gridCols * gridRows)) * 115)
  );

  let dominantTheme: ImageDiagnostics['dominantTheme'] = 'light';
  if (darkRatio > 0.45 || meanBrightness < 95) {
    dominantTheme = 'dark';
  } else if (coloredRatio > 0.32 || backgroundComplexityScore > 38) {
    dominantTheme = 'colored_or_patterned';
  }

  // 4. Stage C Integration: Detect Candidate Text Zones & Risk Zones across the full image
  const { candidateZones, riskZones, embeddedMediaBoxes } =
    detectCandidateTextAndRiskZones(data, lum, sat, width, height);

  // 5. Generate human-readable quality warnings
  const qualityWarnings: string[] = [];
  if (isLowResolution) {
    qualityWarnings.push(
      `Resolusi gambar rendah (${width}×${height}px). Sistem mengaktifkan upscaling adaptif 2x–3x untuk memperjelas huruf kecil.`
    );
  }
  if (sharpnessScore < 28) {
    qualityWarnings.push(
      'Gambar terdeteksi agak buram / kurang tajam. Sistem mengaktifkan penajaman (Unsharp Masking) dan pemeriksaan ulang per wilayah.'
    );
  }
  if (contrastScore < 32) {
    qualityWarnings.push(
      'Kontras gambar secara umum rendah. Sistem mengaktifkan binarisasi lokal adaptif (Sauvola) dan normalisasi pencahayaan.'
    );
  }
  if (compressionArtifactScore > 45) {
    qualityWarnings.push(
      'Terdeteksi artefak kompresi pada gambar. Sistem mengaktifkan peredam noise sebelum ekstraksi karakter.'
    );
  }
  if (dominantTheme === 'dark') {
    qualityWarnings.push(
      'Mode Gelap (Dark Mode) terdeteksi. Sistem menjalankan pembalikan polaritas (Inverted Polarity OCR) agar teks putih terbaca optimal.'
    );
  } else if (dominantTheme === 'colored_or_patterned') {
    qualityWarnings.push(
      'Latar belakang berwarna / wallpaper berpola terdeteksi. Sistem mengaktifkan pemisahan kanal warna (Chromatic Separation) dan binarisasi lokal.'
    );
  }

  return {
    width,
    height,
    aspectRatio,
    orientation,
    isTallScreenshot,
    isLowResolution,
    meanBrightness,
    contrastScore,
    sharpnessScore,
    compressionArtifactScore,
    backgroundComplexityScore,
    dominantTheme,
    qualityWarnings,
    structuralZones: {
      headerBandY: Math.round(height * 0.13),
      footerBandY: Math.round(height * 0.91),
      hasEmbeddedMedia: embeddedMediaBoxes.length > 0,
      embeddedMediaBoxes,
    },
    riskZones,
    candidateZones,
  };
}

// ============================================================================
// TAHAP C: DETEKSI WILAYAH TEKS SECARA MENYELURUH (FULL-IMAGE STROKE DETECTOR)
// ============================================================================

function detectCandidateTextAndRiskZones(
  rgba: Uint8ClampedArray,
  lum: Float32Array,
  sat: Float32Array,
  width: number,
  height: number
): {
  candidateZones: CandidateTextZone[];
  riskZones: RiskZone[];
  embeddedMediaBoxes: BoundingBox[];
} {
  // Grid cell size (~10x6px) to capture horizontal text strokes including tiny timestamps & edge text
  const cellW = Math.max(6, Math.min(14, Math.round(width / 75)));
  const cellH = Math.max(4, Math.min(10, Math.round(height / 110)));
  const cols = Math.ceil(width / cellW);
  const rows = Math.ceil(height / cellH);

  const strokeEnergy = new Float32Array(cols * rows);
  const cellContrast = new Float32Array(cols * rows);
  const cellMeanLum = new Float32Array(cols * rows);
  const cellMeanSat = new Float32Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    const yStart = r * cellH;
    const yEnd = Math.min(height - 1, yStart + cellH);
    for (let c = 0; c < cols; c++) {
      const xStart = c * cellW;
      const xEnd = Math.min(width - 1, xStart + cellW);

      let gradSum = 0;
      let minL = 255;
      let maxL = 0;
      let sumL = 0;
      let sumS = 0;
      let count = 0;

      for (let y = yStart; y < yEnd; y++) {
        const rowIdx = y * width;
        for (let x = xStart; x < xEnd; x++) {
          const p = rowIdx + x;
          const l = lum[p];
          sumL += l;
          sumS += sat[p];
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;

          if (x > 0 && x < width - 1) {
            const p4 = p * 4;
            const dr = Math.abs(rgba[p4 + 4] - rgba[p4 - 4]);
            const dg = Math.abs(rgba[p4 + 5] - rgba[p4 - 3]);
            const db = Math.abs(rgba[p4 + 6] - rgba[p4 - 2]);
            const maxGrad = Math.max(dr, dg, db);
            // Horizontal stroke transition typical of characters
            if (maxGrad > 14) {
              gradSum += maxGrad;
            }
          }
          count++;
        }
      }

      const cellIdx = r * cols + c;
      strokeEnergy[cellIdx] = count > 0 ? gradSum / count : 0;
      cellContrast[cellIdx] = maxL - minL;
      cellMeanLum[cellIdx] = count > 0 ? sumL / count : 128;
      cellMeanSat[cellIdx] = count > 0 ? sumS / count : 0;
    }
  }

  // Morphological horizontal dilation to group character strokes into text line/block masks
  const activeMask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      // Even low-contrast text (contrast >= 18 and strokeEnergy >= 5.5) gets flagged!
      if (strokeEnergy[idx] >= 6.0 && cellContrast[idx] >= 18) {
        activeMask[idx] = 1;
      }
    }
  }

  // Dilate horizontally by 2 cells and vertically by 1 cell to bridge word gaps
  const dilated = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let on = 0;
      for (let dr = -1; dr <= 1 && !on; dr++) {
        const nr = r + dr;
        if (nr < 0 || nr >= rows) continue;
        for (let dc = -2; dc <= 2; dc++) {
          const nc = c + dc;
          if (nc >= 0 && nc < cols && activeMask[nr * cols + nc]) {
            on = 1;
            break;
          }
        }
      }
      dilated[r * cols + c] = on;
    }
  }

  // Connected-components labeling on dilated grid
  const visited = new Uint8Array(cols * rows);
  const candidateZones: CandidateTextZone[] = [];
  const riskZones: RiskZone[] = [];
  const embeddedMediaBoxes: BoundingBox[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const startIdx = r * cols + c;
      if (!dilated[startIdx] || visited[startIdx]) continue;

      const queue: number[] = [startIdx];
      visited[startIdx] = 1;

      let minC = c;
      let maxC = c;
      let minR = r;
      let maxR = r;
      let sumStroke = 0;
      let sumContrast = 0;
      let sumLum = 0;
      let sumSat = 0;
      let activeCells = 0;

      while (queue.length > 0) {
        const curr = queue.pop()!;
        const cr = Math.floor(curr / cols);
        const cc = curr % cols;

        if (cc < minC) minC = cc;
        if (cc > maxC) maxC = cc;
        if (cr < minR) minR = cr;
        if (cr > maxR) maxR = cr;

        if (activeMask[curr]) {
          sumStroke += strokeEnergy[curr];
          sumContrast += cellContrast[curr];
          sumLum += cellMeanLum[curr];
          sumSat += cellMeanSat[curr];
          activeCells++;
        }

        const neighbors = [
          cr > 0 ? (cr - 1) * cols + cc : -1,
          cr + 1 < rows ? (cr + 1) * cols + cc : -1,
          cc > 0 ? cr * cols + (cc - 1) : -1,
          cc + 1 < cols ? cr * cols + (cc + 1) : -1,
        ];
        for (const nb of neighbors) {
          if (nb >= 0 && dilated[nb] && !visited[nb]) {
            visited[nb] = 1;
            queue.push(nb);
          }
        }
      }

      if (activeCells < 2) continue;

      const bbox: BoundingBox = {
        x0: Math.max(0, minC * cellW - 4),
        y0: Math.max(0, minR * cellH - 3),
        x1: Math.min(width, (maxC + 1) * cellW + 4),
        y1: Math.min(height, (maxR + 1) * cellH + 3),
      };
      const bw = bbox.x1 - bbox.x0;
      const bh = bbox.y1 - bbox.y0;
      if (bw < 14 || bh < 6) continue;

      const avgStroke = sumStroke / activeCells;
      const avgContrast = sumContrast / activeCells;
      const avgLum = sumLum / activeCells;
      const avgSat = sumSat / activeCells;

      const normBbox = {
        x: Number(((bbox.x0 / width) * 100).toFixed(2)),
        y: Number(((bbox.y0 / height) * 100).toFixed(2)),
        w: Number(((bw / width) * 100).toFixed(2)),
        h: Number(((bh / height) * 100).toFixed(2)),
      };

      let zoneHint: CandidateTextZone['zoneHint'] = 'chat_body';
      if (bbox.y1 <= height * 0.065) {
        zoneHint = 'status_bar';
      } else if (bbox.y0 <= height * 0.14) {
        zoneHint = 'header';
      } else if (bbox.y0 >= height * 0.91) {
        zoneHint = 'footer';
      } else if (
        bbox.x0 <= width * 0.025 ||
        bbox.x1 >= width * 0.975 ||
        bbox.y1 >= height * 0.975
      ) {
        zoneHint = 'edge_margin';
      } else if (bh > height * 0.18 && avgSat > 45) {
        zoneHint = 'embedded_media';
        embeddedMediaBoxes.push(bbox);
      }

      const isLowContrastOrBlurry = avgContrast < 48 || avgStroke < 11;

      candidateZones.push({
        id: `cand-zone-${candidateZones.length + 1}`,
        bbox,
        normBbox,
        strokeDensity: Number(avgStroke.toFixed(1)),
        localContrast: Number(avgContrast.toFixed(1)),
        meanLuminance: Number(avgLum.toFixed(1)),
        zoneHint,
        isLowContrastOrBlurry,
      });

      // Record specific risk zones for Stage A diagnostics
      if (avgContrast < 42) {
        riskZones.push({
          id: `risk-${riskZones.length + 1}`,
          type: 'low_contrast',
          label: 'Wilayah Teks Kontras Rendah',
          bbox,
          normBbox,
          severity: avgContrast < 28 ? 'high' : 'medium',
        });
      } else if (bh < 16) {
        riskZones.push({
          id: `risk-${riskZones.length + 1}`,
          type: 'small_text',
          label: 'Teks Berukuran Sangat Kecil / Tipis',
          bbox,
          normBbox,
          severity: 'medium',
        });
      } else if (avgSat > 52) {
        riskZones.push({
          id: `risk-${riskZones.length + 1}`,
          type: 'complex_background',
          label: 'Teks di Atas Latar Berwarna / Berpola',
          bbox,
          normBbox,
          severity: 'medium',
        });
      } else if (zoneHint === 'edge_margin') {
        riskZones.push({
          id: `risk-${riskZones.length + 1}`,
          type: 'edge_proximity',
          label: 'Tulisan Dekat Tepi Gambar',
          bbox,
          normBbox,
          severity: 'low',
        });
      }
    }
  }

  return { candidateZones, riskZones, embeddedMediaBoxes };
}

// ============================================================================
// TAHAP B: PENINGKATAN KUALITAS GAMBAR ADAPTIF (MULTI-VARIANT PREPROCESSING)
// ============================================================================

function applyUnsharpMask(
  lumData: Float32Array,
  width: number,
  height: number,
  amount: number = 0.55
): Float32Array {
  const out = new Float32Array(lumData.length);
  for (let y = 0; y < height; y++) {
    const rOff = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rOff + x;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        out[idx] = lumData[idx];
        continue;
      }
      const blur =
        (lumData[idx - width - 1] +
          2 * lumData[idx - width] +
          lumData[idx - width + 1] +
          2 * lumData[idx - 1] +
          4 * lumData[idx] +
          2 * lumData[idx + 1] +
          lumData[idx + width - 1] +
          2 * lumData[idx + width] +
          lumData[idx + width + 1]) /
        16;
      const sharpened = lumData[idx] + amount * (lumData[idx] - blur);
      out[idx] = Math.min(255, Math.max(0, sharpened));
    }
  }
  return out;
}

/**
 * Integral-Image Soft Sauvola Local Adaptive Normalization:
 * Menangani bayangan, latar berpola, gradasi, dan kontras rendah tanpa merusak
 * anti-aliasing huruf.
 */
function createAdaptiveSauvolaCanvas(
  sourceCanvas: HTMLCanvasElement,
  invertFirst: boolean = false
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !srcCtx) return sourceCanvas;

  const imgData = srcCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const n = width * height;
  const rawLum = new Float32Array(n);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    rawLum[p] = invertFirst ? 255 - l : l;
  }

  const sharpened = applyUnsharpMask(rawLum, width, height, 0.65);

  // Build integral images (width + 1) x (height + 1)
  const iw = width + 1;
  const ih = height + 1;
  const integral = new Float64Array(iw * ih);
  const integralSq = new Float64Array(iw * ih);

  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    let rowSumSq = 0;
    const srcRow = (y - 1) * width;
    const intRow = y * iw;
    const prevIntRow = (y - 1) * iw;
    for (let x = 1; x <= width; x++) {
      const val = sharpened[srcRow + (x - 1)];
      rowSum += val;
      rowSumSq += val * val;
      integral[intRow + x] = integral[prevIntRow + x] + rowSum;
      integralSq[intRow + x] = integralSq[prevIntRow + x] + rowSumSq;
    }
  }

  const winR = Math.max(14, Math.min(36, Math.round(Math.min(width, height) / 28)));
  const k = 0.16;
  const R = 128;

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - winR);
    const y1 = Math.min(height - 1, y + winR);
    const r0 = y0 * iw;
    const r1 = (y1 + 1) * iw;

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - winR);
      const x1 = Math.min(width - 1, x + winR);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const sum =
        integral[r1 + (x1 + 1)] -
        integral[r0 + (x1 + 1)] -
        integral[r1 + x0] +
        integral[r0 + x0];
      const sumSq =
        integralSq[r1 + (x1 + 1)] -
        integralSq[r0 + (x1 + 1)] -
        integralSq[r1 + x0] +
        integralSq[r0 + x0];

      const mean = sum / area;
      const variance = Math.max(0, sumSq / area - mean * mean);
      const std = Math.sqrt(variance);

      const threshold = mean * (1 + k * (std / R - 1));
      const val = sharpened[y * width + x];

      // Soft transition around threshold so glyph edges stay smooth for LSTM OCR
      const diff = val - threshold;
      let outVal: number;
      if (std < 7) {
        // Uniform background region -> pure white
        outVal = 250;
      } else {
        outVal = Math.min(255, Math.max(0, 175 + diff * 3.2));
      }

      const idx4 = (y * width + x) * 4;
      data[idx4] = outVal;
      data[idx4 + 1] = outVal;
      data[idx4 + 2] = outVal;
      data[idx4 + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outCanvas;
}

/**
 * Chromatic Maximum Deviation Filter:
 * Memisahkan teks berwarna di atas latar berwarna/berpola (contoh: teks merah/kuning/hijau
 * di atas poster atau nama pengirim berwarna di grup WA).
 */
function createChromaticContrastCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !srcCtx) return sourceCanvas;

  const imgData = srcCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const iw = width + 1;
  const ih = height + 1;
  const intR = new Float64Array(iw * ih);
  const intG = new Float64Array(iw * ih);
  const intB = new Float64Array(iw * ih);

  for (let y = 1; y <= height; y++) {
    let sR = 0;
    let sG = 0;
    let sB = 0;
    const srcRow = (y - 1) * width;
    const iRow = y * iw;
    const pRow = (y - 1) * iw;
    for (let x = 1; x <= width; x++) {
      const p4 = (srcRow + (x - 1)) * 4;
      sR += data[p4];
      sG += data[p4 + 1];
      sB += data[p4 + 2];
      intR[iRow + x] = intR[pRow + x] + sR;
      intG[iRow + x] = intG[pRow + x] + sG;
      intB[iRow + x] = intB[pRow + x] + sB;
    }
  }

  const winR = Math.max(12, Math.min(28, Math.round(Math.min(width, height) / 32)));
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - winR);
    const y1 = Math.min(height - 1, y + winR);
    const r0 = y0 * iw;
    const r1 = (y1 + 1) * iw;

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - winR);
      const x1 = Math.min(width - 1, x + winR);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const mR = (intR[r1 + x1 + 1] - intR[r0 + x1 + 1] - intR[r1 + x0] + intR[r0 + x0]) / area;
      const mG = (intG[r1 + x1 + 1] - intG[r0 + x1 + 1] - intG[r1 + x0] + intG[r0 + x0]) / area;
      const mB = (intB[r1 + x1 + 1] - intB[r0 + x1 + 1] - intB[r1 + x0] + intB[r0 + x0]) / area;

      const p4 = (y * width + x) * 4;
      const dR = Math.abs(data[p4] - mR);
      const dG = Math.abs(data[p4 + 1] - mG);
      const dB = Math.abs(data[p4 + 2] - mB);
      const maxDev = Math.max(dR, dG, dB);

      // High deviation from local background becomes dark ink (0), uniform background becomes white (255)
      const inkVal = Math.min(255, Math.max(0, Math.round(255 - maxDev * 3.1)));
      data[p4] = inkVal;
      data[p4 + 1] = inkVal;
      data[p4 + 2] = inkVal;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outCanvas;
}

function generateAdaptiveVariantsStageB(
  baseCanvas: HTMLCanvasElement,
  diagnostics: ImageDiagnostics,
  forceHighContrast?: boolean
): {
  scaledBaseCanvas: HTMLCanvasElement;
  scaleX: number;
  scaleY: number;
  variants: ImageVariant[];
} {
  const origW = baseCanvas.width;
  const origH = baseCanvas.height;

  // Determine optimal working scale (upscale small images so small text is >= 20px tall)
  let scale = 1;
  if (origW < 950) {
    scale = Math.min(2.4, Math.max(1.5, 1350 / origW));
  } else if (origW > 2200) {
    scale = 2000 / origW;
  }

  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  const scaledBaseCanvas = document.createElement('canvas');
  scaledBaseCanvas.width = targetW;
  scaledBaseCanvas.height = targetH;
  const sCtx = scaledBaseCanvas.getContext('2d', { willReadFrequently: true });
  if (sCtx) {
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(baseCanvas, 0, 0, targetW, targetH);
  }

  const variants: ImageVariant[] = [];

  // 1. Primary Source: Natural Original (Upscaled if small) — preserves original pixel fidelity
  variants.push({
    name: 'Natural-Original',
    dataUrl: scaledBaseCanvas.toDataURL('image/png'),
    scaleX: scale,
    scaleY: scale,
    offsetX: 0,
    offsetY: 0,
    psm: PSM.AUTO,
  });

  // 2. Adaptive Sauvola Local Contrast + Sparse Text Detection (finds small timestamps, headers, edge text, low contrast)
  const sauvolaCanvas = createAdaptiveSauvolaCanvas(scaledBaseCanvas, false);
  variants.push({
    name: 'Adaptive-Sauvola-Sparse',
    dataUrl: sauvolaCanvas.toDataURL('image/png'),
    scaleX: scale,
    scaleY: scale,
    offsetX: 0,
    offsetY: 0,
    psm: PSM.SPARSE_TEXT,
  });

  // 3. Inverted Polarity Variant: Essential for Dark Mode, WhatsApp dark-green headers, status bars, and dark posters
  const hasDarkRegions =
    diagnostics.dominantTheme === 'dark' ||
    diagnostics.candidateZones.some((z) => z.meanLuminance < 115) ||
    forceHighContrast;

  if (hasDarkRegions) {
    const invertedCanvas = createAdaptiveSauvolaCanvas(scaledBaseCanvas, true);
    variants.push({
      name: 'Dark-Polarity-Inverted',
      dataUrl: invertedCanvas.toDataURL('image/png'),
      scaleX: scale,
      scaleY: scale,
      offsetX: 0,
      offsetY: 0,
      psm: PSM.SPARSE_TEXT,
    });
  }

  // 4. Chromatic Max Deviation Variant: When background is patterned/colored or low-contrast risk zones exist
  if (
    diagnostics.dominantTheme === 'colored_or_patterned' ||
    diagnostics.backgroundComplexityScore > 30 ||
    diagnostics.contrastScore < 38
  ) {
    const chromaticCanvas = createChromaticContrastCanvas(scaledBaseCanvas);
    variants.push({
      name: 'Chromatic-Color-Separation',
      dataUrl: chromaticCanvas.toDataURL('image/png'),
      scaleX: scale,
      scaleY: scale,
      offsetX: 0,
      offsetY: 0,
      psm: PSM.AUTO,
    });
  }

  // 5. Overlapping Tiles for Tall / High-Res Screenshots (Stage C requirement)
  if (diagnostics.isTallScreenshot && origH > 1350) {
    const tileHeight = Math.round(origH * 0.48);
    const stepY = Math.round(tileHeight * 0.78); // 22% vertical overlap!
    for (let y0 = 0; y0 < origH; y0 += stepY) {
      const h = Math.min(tileHeight, origH - y0);
      if (h < 120) break;
      const tileCanvas = document.createElement('canvas');
      const tileScale = origW < 1000 ? 1.75 : 1.25;
      tileCanvas.width = Math.round(origW * tileScale);
      tileCanvas.height = Math.round(h * tileScale);
      const tCtx = tileCanvas.getContext('2d');
      if (tCtx) {
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(
          baseCanvas,
          0,
          y0,
          origW,
          h,
          0,
          0,
          tileCanvas.width,
          tileCanvas.height
        );
        variants.push({
          name: `Tile-Overlap-Y${y0}`,
          dataUrl: tileCanvas.toDataURL('image/png'),
          scaleX: tileScale,
          scaleY: tileScale,
          offsetX: 0,
          offsetY: y0,
          psm: PSM.AUTO,
        });
      }
      if (y0 + h >= origH) break;
    }
  }

  return {
    scaledBaseCanvas,
    scaleX: scale,
    scaleY: scale,
    variants,
  };
}

// ============================================================================
// TAHAP D: EKSTRAKSI TEKS MULTI-PASS OCR & TARGETED REGION RE-INSPECTION
// ============================================================================

function parseTesseractPageLines(
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
    // Fallback if blocks were not populated
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

/**
 * Helper: Crop a specific bounding box from canvas for targeted re-reading or visual verification
 */
function cropRegionFromCanvas(
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

/**
 * Optional Hybrid Vision AI Pass (if Gemini API Key is explicitly provided/configured)
 */
async function runOptionalVisionAiPass(
  imageDataUrl: string,
  apiKey: string,
  imgWidth: number,
  imgHeight: number
): Promise<RawOcrLine[]> {
  try {
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data) return [];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    'Baca seluruh teks yang terlihat pada gambar screenshot WhatsApp ini secara lengkap dan setia pada sumber dari atas ke bawah. ' +
                    'Jangan mengarang kata dan jangan memperbaiki ejaan/singkatan. Jika ada kata yang buram/meragukan tulis [teks tidak pasti: ...]. ' +
                    'Keluarkan hanya baris-baris teks sesuai urutan vertikal.',
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) return [];
    const json = await response.json();
    const rawText: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
        confidence: 92,
        bbox: { x0: 24, y0, x1: imgWidth - 24, y1 },
        words: tokens.map((tok: string, tIdx: number) => ({
          text: tok,
          confidence: 92,
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

// ============================================================================
// TAHAP E: REKONSILIASI, PEMERIKSAAN ULANG & DISAMBIGUASI KARAKTER
// ============================================================================

function computeBoxOverlap(a: BoundingBox, b: BoundingBox): {
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

/**
 * Evaluates whether an OCR word token looks like real human text/numbers/symbols
 * vs pure border/wallpaper noise (e.g. "|||", "~_~", ";;;").
 */
function computeTokenPlausibilityScore(token: string): number {
  const trimmed = token.trim();
  if (!trimmed) return -50;

  // Count alphanumeric + common Indonesian/currency/time punctuation
  const alnumMatches = trimmed.match(/[a-zA-Z0-9]/g);
  const alnumCount = alnumMatches ? alnumMatches.length : 0;

  if (alnumCount === 0) {
    // Allow standalone common symbols like "+", "-", "/", "&", "%" if single
    if (/^[+\-&/%✓✔]+$/.test(trimmed)) return 0;
    return -35;
  }

  const ratio = alnumCount / trimmed.length;
  let bonus = ratio * 18;

  // Bonus for recognizable Indonesian/WhatsApp tokens, currency, timestamps, dates
  if (/^(rp\.?|idr|\d{1,3}([.,]\d{3})+|\d{1,2}[:.]\d{2}|wib|wita|wit)$/i.test(trimmed)) {
    bonus += 16;
  }
  if (/^[A-Za-z]{3,}$/.test(trimmed)) {
    bonus += 10;
  }
  // Penalize chaotic symbol mixes like "a|1~`"
  if (/[|~^`\\§¤¨°]{1,}/.test(trimmed)) {
    bonus -= 22;
  }

  return bonus;
}

/**
 * Disambiguates commonly confused OCR characters (O vs 0, I/l vs 1, S vs 5)
 * ONLY in unambiguous numeric/currency/timestamp contexts, preserving all slang & spelling.
 */
function disambiguateConfusedCharacters(
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
    prevLower === 'idr' ||
    /^rp\.?/i.test(token);

  const isBeforeUnit =
    /^(rb|ribu|jt|juta|siswa|murid|anak|bulan|unit|paket)$/i.test(nextLower) ||
    /\/(siswa|murid|bln|bulan|orang)$/i.test(token);

  // Case 1: Monetary amount context (e.g., "5O.O0O", "I50.000", "Rp5O.000/siswa")
  if (
    isAfterCurrency ||
    isBeforeUnit ||
    /^[0-9OIl]{1,3}\.[0-9OIl]{3}(\.[0-9OIl]{3})?(\/[a-zA-Z]+)?$/.test(token)
  ) {
    out = out.replace(
      /([0-9OIl.,]{3,})/g,
      (numPart) =>
        numPart
          .replace(/O/g, '0')
          .replace(/[Il]/g, '1')
    );
  }

  // Case 2: Timestamp context (e.g., "O8:14", "19.2O", "O7:3O")
  if (/^[0-2OIl][0-9OIl][:.][0-5OIl][0-9OIl]$/.test(token)) {
    out = token
      .replace(/O/g, '0')
      .replace(/[Il]/g, '1');
  }

  // Case 3: Phone number / NPSN context (+62 or 8 digits)
  if (/^(\+62|08)[0-9OIl\-]{6,}$/.test(token)) {
    out = token
      .replace(/O/g, '0')
      .replace(/[Il]/g, '1');
  }

  return {
    corrected: out,
    wasDisambiguated: out !== token,
  };
}

interface ReconciledLine {
  bbox: BoundingBox;
  words: OcrWordDetail[];
  text: string;
  cleanText: string;
  confidence: number;
  uncertaintyStatus: UncertaintyStatus;
  uncertaintyNotes: string[];
  alternatives: string[];
  passSources: string[];
}

function reconcileMultiPassLinesStageE(
  allPassLines: RawOcrLine[],
  candidateZones: CandidateTextZone[],
  baseCanvas: HTMLCanvasElement
): {
  reconciledLines: ReconciledLine[];
  unreadRegions: DetectedTextRegion[];
  reconciledDiffsCount: number;
} {
  // 1. Filter out extreme noise lines
  const validRawLines = allPassLines.filter((line) => {
    const clean = line.text.trim();
    if (!clean) return false;
    const alnum = (clean.match(/[a-zA-Z0-9]/g) || []).length;
    if (alnum === 0 && line.confidence < 65) return false;
    if (clean.length === 1 && alnum === 0) return false;
    if (line.confidence < 26 && alnum < 2) return false;
    return true;
  });

  // 2. Group RawOcrLines across passes into Spatial Line Clusters
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

      // Same line if vertical overlap is strong AND horizontal ranges intersect or align
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

  // 3. Reconcile each Spatial Line Cluster word-by-word
  for (const cluster of clusters) {
    const passSources = Array.from(new Set(cluster.map((c) => c.passName)));

    // Sort candidate lines in cluster by composite quality
    const scoredLines = cluster.map((c) => {
      const tokenScore =
        c.words.reduce((acc, w) => acc + computeTokenPlausibilityScore(w.text), 0) /
        Math.max(1, c.words.length);
      // Natural-Original gets a slight tie-breaker bonus to avoid unnecessary threshold artifacts
      const passBonus = c.passName === 'Natural-Original' ? 4 : 0;
      return {
        line: c,
        totalScore: c.confidence + tokenScore + passBonus,
      };
    });
    scoredLines.sort((a, b) => b.totalScore - a.totalScore);

    // Collect all words from cluster and group into horizontal word slots
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

    // Sort word slots left-to-right
    wordSlots.sort((a, b) => a[0].bbox.x0 - b[0].bbox.x0);

    // Pick best word per slot and check cross-pass differences
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

    // Filter out single-word low-confidence noise lines that came only from auxiliary passes
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

  // 4. Identify Visually Detected Candidate Text Zones that yielded ZERO readable text
  const unreadRegions: DetectedTextRegion[] = [];
  const imgW = baseCanvas.width;
  const imgH = baseCanvas.height;

  for (const zone of candidateZones) {
    // Check if any reconciled line overlaps this candidate text zone
    const isCovered = reconciledLines.some((rl) => {
      const { iou, vOverlapRatio, hOverlapRatio } = computeBoxOverlap(zone.bbox, rl.bbox);
      return iou > 0.08 || (vOverlapRatio > 0.35 && hOverlapRatio > 0.25);
    });

    const zw = zone.bbox.x1 - zone.bbox.x0;
    const zh = zone.bbox.y1 - zone.bbox.y0;

    // Only flag genuine text-like unread regions (strong stroke density, reasonable dimensions)
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

// ============================================================================
// TAHAP F: PENYUSUNAN URUTAN TEKS & REKONSTRUKSI STRUKTUR PERCAKAPAN WHATSAPP
// ============================================================================

const CATEGORY_LABELS: Record<RegionCategory, string> = {
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

function classifyRegionStructure(
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

  // Extract trailing timestamp if present (e.g., "08:14", "19.20 WIB", "10:05 AM")
  let timestamp: string | null = null;
  const timeMatch = combinedClean.match(
    /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s?(?:WIB|WITA|WIT|AM|PM))?\b/i
  );
  if (timeMatch) {
    timestamp = timeMatch[0];
  }

  // 1. Check top phone status bar
  if (bbox.y1 <= imgH * 0.058 && lines.length === 1) {
    return {
      category: 'status_bar',
      senderName: null,
      timestamp,
      quotedText: null,
    };
  }

  // 2. Check WhatsApp Top Header (Group Name / Contact Name / Participants)
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

  // 3. Check Date Separator or System Encryption Badge
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

  // 4. Check Footer Input Bar
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

  // 5. Check Embedded Media / Poster inside chat
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

  // 6. Check Edge / Floating text
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

  // 7. Determine Incoming vs Outgoing Chat Bubble by horizontal offset & local green tint
  let senderName: string | null = null;
  let quotedText: string | null = null;

  if (lines.length >= 2) {
    const firstLine = lines[0].cleanText.trim();
    // Sender header pattern in WhatsApp group (e.g. "+62 812-xxxx ~ Bendahara Komite" or "Ibu Rina (Bendahara)" or "~ Ketua Paguyuban")
    if (
      firstLine.length <= 48 &&
      (/^(\+62|08|~|[A-Z][a-z]+\s+[A-Z][a-z]+)/.test(firstLine) ||
        /bendahara|komite|wali kelas|ketua|paguyuban|admin|kepsek|guru/i.test(firstLine)) &&
      !/assalamualaikum|selamat|bapak\/ibu|dimohon|pengumuman/i.test(firstLine)
    ) {
      senderName = firstLine;
    }
  }

  // Sample pixel color inside bbox to detect green outgoing bubble (#D9FDD3 light or #005C4B dark)
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

function reconstructReadingOrderStageF(
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

  // Sort reconciled lines top-to-bottom, then left-to-right for lines on the same horizontal row
  const sortedLines = [...reconciledLines].sort((a, b) => {
    const midYa = (a.bbox.y0 + a.bbox.y1) / 2;
    const midYb = (b.bbox.y0 + b.bbox.y1) / 2;
    const avgH = Math.max(10, (a.bbox.y1 - a.bbox.y0 + (b.bbox.y1 - b.bbox.y0)) / 2);
    if (Math.abs(midYa - midYb) <= avgH * 0.55) {
      return a.bbox.x0 - b.bbox.x0;
    }
    return a.bbox.y0 - b.bbox.y0;
  });

  // Group lines into logical visual regions (paragraphs / bubbles / headers)
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

    // Separate header from chat body
    const crossesHeaderBoundary =
      prevLine.bbox.y1 <= imgH * 0.145 && line.bbox.y0 > imgH * 0.145;

    // Group together if vertically close and horizontally aligned within the same bubble/block
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

    // Generate zoomed visual crop for uncertain regions or all regions so user can verify pixels directly
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

  // Merge unread regions into reading order by Y coordinate
  const allOrderedRegions = [...regions, ...unreadRegions].sort(
    (a, b) => a.bbox.y0 - b.bbox.y0
  );
  allOrderedRegions.forEach((reg, idx) => {
    reg.orderIndex = idx + 1;
  });

  // Build structured transcript & verbatim raw text
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

    structuredBlocks.push(`[${metaParts.join(' • ')}]\n${reg.text}`);
    rawBlocks.push(reg.text);
  }

  return {
    regions: allOrderedRegions,
    fullStructuredTranscript: structuredBlocks.join('\n\n'),
    rawOcrText: rawBlocks.join('\n\n'),
  };
}

// ============================================================================
// SECTION 11: EVALUASI AKURASI (CER, WER, KELENGKAPAN, URUTAN BACA)
// ============================================================================

function levenshteinDistance<T>(a: T[], b: T[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Uint32Array(n + 1);
  let curr = new Uint32Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
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
  // Strip uncertainty meta-brackets when comparing pure character content against ground truth
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

  // Missed words & missed lines calculation
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

  // Reading order accuracy (pair-wise concordant order check)
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

// ============================================================================
// MAIN FULL-PIPELINE ENTRY POINT (TAHAP A -> F + BOSP CROSS-CHECK)
// ============================================================================

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

  // TAHAP A: Analisis Gambar Awal
  reportStage(
    'A',
    'Tahap A: Analisis Kualitas & Struktur Gambar',
    'Memeriksa dimensi, resolusi, ketajaman, tingkat kompresi, pencahayaan, dan memetakan zona risiko teks...',
    12
  );

  const { canvas: baseCanvas, dataUrl: processedPreviewDataUrl } =
    await loadSourceToCanvas(imageSource, adjustments);
  const diagnostics = analyzeImageStageA(baseCanvas);

  // TAHAP B: Peningkatan Kualitas Gambar Adaptif
  reportStage(
    'B',
    'Tahap B: Peningkatan Kualitas Citra Adaptif',
    `Menyiapkan salinan multi-varian (Natural Upscale, Adaptive Sauvola, ${
      diagnostics.dominantTheme === 'dark' ? 'Dark Polarity Invert' : 'Chromatic Contrast'
    }) sesuai karakteristik gambar...`,
    26
  );

  const { variants } = generateAdaptiveVariantsStageB(
    baseCanvas,
    diagnostics,
    adjustments?.enhanceContrast
  );

  // TAHAP C: Deteksi Wilayah Teks Menyeluruh
  reportStage(
    'C',
    'Tahap C: Deteksi Wilayah Teks Menyeluruh (Full-Image)',
    `Mengidentifikasi ${diagnostics.candidateZones.length} kandidat zona tulisan (header, chat, gambar sisipan, dan tepi layar)...`,
    38
  );

  // TAHAP D: Ekstraksi Teks Multi-Pass OCR & Vision AI
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
    }

    // Targeted Crop Re-Read for any candidate text zone missed or with low confidence (< 72%)
    const missedOrWeakZones = diagnostics.candidateZones.filter((zone) => {
      const overlappingLines = allPassLines.filter(
        (l) => computeBoxOverlap(zone.bbox, l.bbox).iou > 0.1
      );
      if (overlappingLines.length === 0) {
        return (
          zone.strokeDensity >= 9.5 &&
          zone.bbox.x1 - zone.bbox.x0 >= 36 &&
          zone.bbox.y1 - zone.bbox.y0 >= 10
        );
      }
      const maxConf = Math.max(...overlappingLines.map((l) => l.confidence));
      return maxConf < 72;
    });

    const targetedZones = missedOrWeakZones.slice(0, 6);
    if (targetedZones.length > 0) {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      });

      for (const z of targetedZones) {
        const isDarkZone = z.meanLuminance < 112;
        const cropInfo = cropRegionFromCanvas(
          baseCanvas,
          z.bbox,
          2.5,
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

  // Optional Hybrid Vision AI pass if explicitly enabled & configured
  const configuredApiKey =
    adjustments?.visionApiKey?.trim() ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';
  let privacyMode: AiScanAnalysisResult['privacyMode'] = 'local-browser';

  if (adjustments?.enableVisionAi && configuredApiKey) {
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
  }

  // TAHAP E: Rekonsiliasi & Pemeriksaan Ulang
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
      baseCanvas
    );

  // TAHAP F: Penyusunan Urutan Teks & Struktur Visual
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
      baseCanvas
    );

  const uncertainRegionsCount = regions.filter(
    (r) => r.uncertaintyStatus === 'uncertain'
  ).length;
  const unreadableRegionsCount = regions.filter(
    (r) => r.uncertaintyStatus === 'unreadable'
  ).length;

  // Never fabricate text if image has no readable text!
  const finalRawText =
    rawOcrText.trim() ||
    '[tidak terbaca — tidak ditemukan teks yang dapat dikenali secara pasti pada gambar ini]';

  // Run BOSP Financial Cross-Check on the extracted text
  const schoolName = adjustments?.schoolName || 'SMK TI BAZMA';
  const studentCount = adjustments?.studentCount || 90;
  const bospAnalysis = analyzeChatWithBospItems(
    finalRawText,
    bospItems,
    schoolName,
    studentCount,
    'screenshot'
  );

  // Compute overall OCR confidence from actual detected regions
  const readableRegions = regions.filter((r) => r.uncertaintyStatus !== 'unreadable');
  const avgOcrConfidence =
    readableRegions.length > 0
      ? Math.round(
          readableRegions.reduce((acc, r) => acc + r.confidence, 0) /
            readableRegions.length
        )
      : 0;

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

  return {
    ...bospAnalysis,
    rawOcrText: finalRawText,
    fullStructuredTranscript:
      fullStructuredTranscript.trim() || finalRawText,
    confidenceScore: avgOcrConfidence > 0 ? avgOcrConfidence : bospAnalysis.confidenceScore,
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
}

/**
 * Backwards-compatible wrapper for performImageOcr:
 * Runs the real multi-pass OCR pipeline and returns the verbatim extracted text
 * (never fabricates fake text).
 */
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

// ============================================================================
// FINANCIAL ENTITY EXTRACTOR & BOSP CROSS-CHECK ENGINE
// ============================================================================

function extractMonetaryAmounts(text: string): number | null {
  // 1. Format dengan imbuhan Rp/IDR: Rp 50.000, Rp. 50.000, Rp50000
  const rpRegex = /(?:rp\.?|idr)\s*([\d.,]+)/i;
  const matchRp = text.match(rpRegex);
  if (matchRp) {
    const clean = matchRp[1].replace(/[.,]/g, '');
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val >= 1000) return val;
  }

  // 2. Format singkatan ribu: 50rb, 50 rb, 50 ribu, 50k
  const shortRegex = /(\d+)\s*(?:rb|ribu|k)\b/i;
  const matchShort = text.match(shortRegex);
  if (matchShort) {
    const val = parseInt(matchShort[1], 10);
    if (!isNaN(val) && val > 0) return val * 1000;
  }

  // 3. Format angka ribuan standar: 50.000, 150.000, 25.000
  const standardNumRegex = /\b(\d{1,3}(?:\.\d{3})+)\b/;
  const matchStd = text.match(standardNumRegex);
  if (matchStd) {
    const clean = matchStd[1].replace(/\./g, '');
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val >= 1000) return val;
  }

  return null;
}

export function analyzeChatWithBospItems(
  ocrText: string,
  bospItems: BospRealizationItem[],
  schoolName: string = 'SMK TI BAZMA',
  studentCount: number = 90,
  sourceType: 'screenshot' | 'direct_text' = 'screenshot'
): AiScanAnalysisResult {
  const cleanText = ocrText.toLowerCase();

  // 1. Ekstrak Nominal Uang
  const detectedAmount = extractMonetaryAmounts(ocrText);

  // 2. Deteksi nada bahasa (Memaksa / Menagih vs Sukarela)
  const mandatoryKeywords = [
    'wajib',
    'harus',
    'transfer',
    'denda',
    'paling lambat',
    'tagihan',
    'tunggakan',
    'segera lunasi',
    'jatuh tempo',
    'rekening',
    'bayar',
    'lunas',
    'batas akhir',
    'ditunggu sampai',
  ];
  const hasWholePhrase = (haystack: string, phrase: string): boolean => {
    const escaped = phrase.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return false;
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(haystack);
  };

  const isMandatoryTone = mandatoryKeywords.some((kw) => hasWholePhrase(cleanText, kw));

  // 3. Pencocokan Cerdas dengan Database Realisasi BOSP Sekolah
  let matchedItem: BospRealizationItem | null = null;
  let detectedItemKeyword: string | null = null;

  const synonymDictionary: Record<string, string[]> = {
    'item-bazma-kipas-01': [
      'kipas',
      'kipas angin',
      'exhaust',
      'exhaust fan',
      'ventilasi',
      'sirkulasi',
      'gerah',
      'panas',
      'pendingin',
      'ac lab',
      'blower',
      'dinding',
      'ruang lab',
    ],
    'item-bazma-switch-02': [
      'switch',
      'hub',
      'kabel',
      'kabel utp',
      'lan',
      'konektor',
      'rj45',
      'mikrotik',
      'router',
      'jaringan',
      'patch cord',
      'crimping',
      'access point',
    ],
    'item-bazma-modul-03': [
      'modul',
      'modul ajar',
      'buku',
      'lks',
      'fotokopi',
      'praktikum',
      'cloud',
      'linux',
      'kurikulum',
      'buku kejuruan',
      'materi sija',
    ],
    'item-bazma-proyektor-04': [
      'proyektor',
      'infocus',
      'infokus',
      'projector',
      'layar proyektor',
      'kabel hdmi',
      'bracket',
      'presentasi',
      'lcd',
    ],
    'item-bazma-sanitasi-05': [
      'toilet',
      'wc',
      'kamar mandi',
      'wastafel',
      'air bersih',
      'toren',
      'tandon',
      'keran',
      'sabun',
      'sanitasi',
      'pipa',
      'pompa air',
    ],
    'item-bazma-meja-06': [
      'meja',
      'kursi',
      'bangku',
      'mebel',
      'meubel',
      'meja lab',
      'kursi lab',
      'meja komputer',
      'kursi komputer',
      'meubelair',
    ],
    'item-bazma-internet-07': [
      'internet',
      'wifi',
      'kuota',
      'indihome',
      'fiber optik',
      'bandwidth',
      'isp',
      'dedicated',
      'langganan internet',
    ],
  };

  for (const item of bospItems) {
    const synonyms = synonymDictionary[item.id] || item.keywords;
    const foundKeyword = synonyms.find((syn) => hasWholePhrase(cleanText, syn));
    if (foundKeyword) {
      matchedItem = item;
      detectedItemKeyword = foundKeyword;
      break;
    }
  }

  const nonRkasKeywords = [
    'kaos',
    'kaos kelas',
    'jaket',
    'seragam angkatan',
    'pentas seni',
    'pensi',
    'perpisahan',
    'wisuda',
    'outing',
    'tour',
    'study tour',
    'piknik',
    'jalan-jalan',
    'rekreasi',
    'kas kelas',
    'kas paguyuban',
    'kenang-kenangan',
    'baju kelas',
  ];
  const foundNonRkas = nonRkasKeywords.find((kw) => hasWholePhrase(cleanText, kw));

  const lines = ocrText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const detectedQuote =
    lines.slice(0, 6).join(' ') || '[tidak terbaca]';

  const totalCollectedEstimate = detectedAmount ? detectedAmount * studentCount : null;

  const formatRp = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

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

  const itemKeyword =
    detectedItemKeyword || (matchedItem ? matchedItem.name : foundNonRkas || 'Umum / Operasional');

  // Komparasi 3 Pilar: [1] Teks Guru/Chat vs [2] Anggaran Sekolah vs [3] Kebijakan & Aturan BOSP
  const threeWayComparison: ThreeWayComparison = {
    teacherText: {
      sourceType,
      quote: detectedQuote,
      detectedItem: itemKeyword,
      detectedAmount,
      isMandatory: isMandatoryTone,
      toneLabel: isMandatoryTone
        ? 'Wajib / Ada Batas Waktu Menagih'
        : 'Himbauan / Sukarela',
    },
    schoolBudget: {
      schoolName,
      isFundedByBosp: !!matchedItem,
      itemCode: matchedItem ? matchedItem.code : 'NON-RKAS',
      allocatedAmount: matchedItem ? matchedItem.amount : 0,
      stage: matchedItem ? matchedItem.stage : null,
      factText: matchedItem
        ? `${schoolName} telah mencairkan anggaran BOSP resmi sebesar ${formatRp(matchedItem.amount)} untuk "${matchedItem.name}" pada ${matchedItem.stage} (${matchedItem.date}) dengan Kode RKAS: ${matchedItem.code}.`
        : `Kegiatan atau barang ini tidak terdaftar dalam pagu RKAS belanja wajib BOSP ${schoolName}.`,
    },
    bospPolicy: {
      verdictType: matchedItem
        ? 'PUNGLI_BOSP'
        : isMandatoryTone
        ? 'PUNGLI_PEMAKSAAN'
        : foundNonRkas
        ? 'SUMBANGAN_SUKARELA_SAH'
        : 'BELUM_TERIDENTIFIKASI',
      verdictTitle: matchedItem
        ? 'Terindikasi Pungutan Liar (Tumpang Tindih BOSP)'
        : isMandatoryTone
        ? 'Terindikasi Pelanggaran Pemaksaan Iuran'
        : foundNonRkas
        ? 'Sumbangan Non-BOSP Sah (Jika Sukarela Murni)'
        : 'Informasi Belum Menunjukkan Pungli Spesifik',
      policySummary: matchedItem
        ? `Permendikbudristek No. 63/2023 Pasal 61 secara tegas melarang sekolah memungut biaya dari peserta didik/wali murid untuk barang atau kegiatan yang sudah didanai BOSP resmi negara.`
        : isMandatoryTone
        ? `Permendikbud No. 75/2016 Pasal 10 & 12 melarang komite sekolah atau guru memungut iuran wajib, membatasi tenggat waktu pelunasan, atau memberikan konsekuensi bagi peserta didik.`
        : `Sesuai Permendikbud No. 75/2016, sumbangan paguyuban diperbolehkan HANYA bila bersifat sukarela murni, tidak mengikat, dan tidak menetapkan besaran nominal wajib.`,
      rules: [
        {
          id: 'rule-double-funding',
          ruleTitle: 'Larangan Pendanaan Ganda / Tumpang Tindih BOSP',
          regulation: 'Permendikbudristek No. 63/2023 Pasal 61',
          status: matchedItem ? 'violation' : 'compliant',
          verdictLabel: matchedItem ? 'Melanggar Aturan' : 'Sesuai',
          explanation: matchedItem
            ? `Pengadaan "${matchedItem.name}" telah ditanggung 100% oleh dana BOSP negara senilai ${formatRp(matchedItem.amount)}. Penarikan iuran kepada siswa dilarang keras.`
            : 'Belanja ini tidak menggunakan pos pendanaan ganda dari BOSP sekolah.',
        },
        {
          id: 'rule-voluntary-nature',
          ruleTitle: 'Ketentuan Sumbangan Sukarela Tanpa Paksaan',
          regulation: 'Permendikbud No. 75/2016 Pasal 10 & 12',
          status: isMandatoryTone ? 'violation' : 'compliant',
          verdictLabel: isMandatoryTone ? 'Melanggar Aturan' : 'Sesuai',
          explanation: isMandatoryTone
            ? 'Pesan mengandung kata menagih, wajib, atau batas waktu transfer. Segala bentuk sumbangan di sekolah wajib bersifat sukarela tanpa batas waktu.'
            : 'Pesan bersifat himbauan sukarela tanpa ancaman sanksi dan keharusan mengikat.',
        },
        {
          id: 'rule-academic-rights',
          ruleTitle: 'Perlindungan Hak Belajar Peserta Didik',
          regulation: 'UU Sisdiknas No. 20/2003 Pasal 34',
          status: matchedItem || isMandatoryTone ? 'warning' : 'compliant',
          verdictLabel: matchedItem || isMandatoryTone ? 'Perhatian Khusus' : 'Terjaga',
          explanation:
            'Peserta didik berhak mendapatkan fasilitas belajar tanpa diskriminasi atau hambatan akademik akibat iuran.',
        },
      ],
    },
  };

  if (matchedItem) {
    const itemAmountStr = formatRp(matchedItem.amount);
    const tarikanStr = detectedAmount ? formatRp(detectedAmount) : 'nominal tertentu';
    const totalTarikanStr = totalCollectedEstimate
      ? formatRp(totalCollectedEstimate)
      : 'tidak tertera';

    return {
      rawOcrText: ocrText,
      fullStructuredTranscript: ocrText,
      detectedQuote,
      detectedAmount,
      detectedItemKeyword: detectedItemKeyword || matchedItem.name,
      isMandatoryTone,
      statusType: 'danger',
      statusTitle: 'Terdeteksi Indikasi Tumpang Tindih (Sudah Dibiayai BOSP)',
      bospFact: `${schoolName} telah merealisasikan pengadaan "${matchedItem.name}" senilai ${itemAmountStr} pada ${matchedItem.stage} (${matchedItem.date}) dengan Kode RKAS: ${matchedItem.code}. Penarikan iuran sebesar ${tarikanStr}/siswa (estimasi total ${totalTarikanStr} untuk ${studentCount} siswa) terindikasi tumpang tindih anggaran 100%.`,
      matchedItem,
      legalNote:
        'Sesuai Permendikbudristek No. 63/2023 Pasal 61 dan Permendikbud No. 75/2016 Pasal 12, sekolah dan komite dilarang memungut biaya untuk sarana prasarana yang sudah dibiayai dana BOSP.',
      confidenceScore: 96,
      financialComparison: {
        nominalPerStudent: detectedAmount,
        totalCollectedEstimate,
        bospAllocatedAmount: matchedItem.amount,
        itemCode: matchedItem.code,
        disbursedPeriod: matchedItem.stage,
        disbursedDate: matchedItem.date,
        discrepancyVerdict:
          'TUMPANG TINDIH 100% — Pengadaan sarana telah ditanggung negara melalui BOSP.',
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
  } else if (foundNonRkas) {
    return {
      rawOcrText: ocrText,
      fullStructuredTranscript: ocrText,
      detectedQuote,
      detectedAmount,
      detectedItemKeyword: foundNonRkas,
      isMandatoryTone,
      statusType: isMandatoryTone ? 'danger' : 'safe',
      statusTitle: isMandatoryTone
        ? 'Terindikasi Pemaksaan Iuran Non-BOSP'
        : 'Tidak Tercantum di RKAS BOSP (Kegiatan Non-Operasional)',
      bospFact: `Kegiatan "${foundNonRkas}" tidak terdaftar dalam pagu RKAS BOSP ${schoolName} tahun berjalan. Ini merupakan kegiatan inisiatif siswa/paguyuban di luar belanja wajib BOSP.`,
      matchedItem: null,
      legalNote: isMandatoryTone
        ? 'Perhatian: Berdasarkan Permendikbud No. 75/2016, iuran non-RKAS TIDAK BOLEH dipaksakan, mengikat, atau diberi tenggat sanksi. Jika ada paksaan, Anda berhak melapor.'
        : 'Sesuai regulasi Permendikbud No. 75/2016, sumbangan sukarela paguyuban hanya sah bila tidak mengikat dan tidak menentukan hak akademik siswa.',
      confidenceScore: 91,
      financialComparison: {
        nominalPerStudent: detectedAmount,
        totalCollectedEstimate,
        bospAllocatedAmount: 0,
        itemCode: 'NON-RKAS',
        disbursedPeriod: '-',
        disbursedDate: '-',
        discrepancyVerdict:
          'NON-BOSP — Pengeluaran di luar anggaran sekolah, wajib bersifat sukarela murni.',
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
  } else {
    return {
      rawOcrText: ocrText,
      fullStructuredTranscript: ocrText,
      detectedQuote,
      detectedAmount,
      detectedItemKeyword: null,
      isMandatoryTone,
      statusType: 'neutral',
      statusTitle: 'Teks Terbaca: Tidak Ditemukan Tumpang Tindih Spesifik',
      bospFact:
        `AI telah menganalisis isi pesan dan tidak menemukan kesamaan kata kunci langsung dengan barang belanja BOSP aktif di ${schoolName}.`,
      matchedItem: null,
      legalNote:
        'Jika Anda menduga adanya pungutan tidak resmi lainnya, Anda tetap dapat mengirimkan laporan anonim kepada inspektorat daerah.',
      confidenceScore: 85,
      financialComparison: {
        nominalPerStudent: detectedAmount,
        totalCollectedEstimate,
        bospAllocatedAmount: null,
        itemCode: null,
        disbursedPeriod: null,
        disbursedDate: null,
        discrepancyVerdict: 'Tidak terindikasi duplikasi belanja operasional BOSP.',
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
}

export function analyzeDirectTextMessage(
  text: string,
  bospItems: BospRealizationItem[],
  schoolName: string = 'SMK TI BAZMA',
  studentCount: number = 90
): AiScanAnalysisResult {
  return analyzeChatWithBospItems(text, bospItems, schoolName, studentCount, 'direct_text');
}
