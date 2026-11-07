import { PSM } from 'tesseract.js';
import type { ImageDiagnostics } from '@/types/scanner';
import type { ImageVariant } from './internalTypes';

export function applyUnsharpMask(
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

// Integral-image soft Sauvola normalization removes uneven lighting without destroying glyph anti-aliasing.
export function createAdaptiveSauvolaCanvas(
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

      // Soft slope around threshold keeps glyph strokes smooth for Tesseract's LSTM recognizer.
      const diff = val - threshold;
      let outVal: number;
      if (std < 7) {
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

// Isolate colored sender names and poster text that share luminance with patterned backgrounds.
export function createChromaticContrastCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
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

      const inkVal = Math.min(255, Math.max(0, Math.round(255 - maxDev * 3.1)));
      data[p4] = inkVal;
      data[p4 + 1] = inkVal;
      data[p4 + 2] = inkVal;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outCanvas;
}

// Suppress wallpaper doodles and watermarks while flipping polarity per 32x32 tile for mixed light/dark UI.
export function createBgSuppressedMorphCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
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

  // Smooth JPEG grain and screen moire with a 3x3 Gaussian kernel before background estimation.
  const fineR = new Float32Array(n);
  const fineG = new Float32Array(n);
  const fineB = new Float32Array(n);
  const fineL = new Float32Array(n);

  for (let y = 0; y < height; y++) {
    const ym = Math.max(0, y - 1) * width;
    const yc = y * width;
    const yp = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < width; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(width - 1, x + 1);

      const p00 = (ym + xm) * 4;
      const p01 = (ym + x) * 4;
      const p02 = (ym + xp) * 4;
      const p10 = (yc + xm) * 4;
      const p11 = (yc + x) * 4;
      const p12 = (yc + xp) * 4;
      const p20 = (yp + xm) * 4;
      const p21 = (yp + x) * 4;
      const p22 = (yp + xp) * 4;

      const idx = yc + x;
      const r =
        (data[p00] + 2 * data[p01] + data[p02] +
          2 * data[p10] + 4 * data[p11] + 2 * data[p12] +
          data[p20] + 2 * data[p21] + data[p22]) / 16;
      const g =
        (data[p00 + 1] + 2 * data[p01 + 1] + data[p02 + 1] +
          2 * data[p10 + 1] + 4 * data[p11 + 1] + 2 * data[p12 + 1] +
          data[p20 + 1] + 2 * data[p21 + 1] + data[p22 + 1]) / 16;
      const b =
        (data[p00 + 2] + 2 * data[p01 + 2] + data[p02 + 2] +
          2 * data[p10 + 2] + 4 * data[p11 + 2] + 2 * data[p12 + 2] +
          data[p20 + 2] + 2 * data[p21 + 2] + data[p22 + 2]) / 16;

      fineR[idx] = r;
      fineG[idx] = g;
      fineB[idx] = b;
      fineL[idx] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }

  const iw = width + 1;
  const ih = height + 1;
  const intR = new Float64Array(iw * ih);
  const intG = new Float64Array(iw * ih);
  const intB = new Float64Array(iw * ih);

  for (let y = 1; y <= height; y++) {
    let sR = 0;
    let sG = 0;
    let sB = 0;
    const sRow = (y - 1) * width;
    const iRow = y * iw;
    const pRow = (y - 1) * iw;
    for (let x = 1; x <= width; x++) {
      const idx = sRow + (x - 1);
      sR += fineR[idx];
      sG += fineG[idx];
      sB += fineB[idx];
      intR[iRow + x] = intR[pRow + x] + sR;
      intG[iRow + x] = intG[pRow + x] + sG;
      intB[iRow + x] = intB[pRow + x] + sB;
    }
  }

  const winR = Math.max(9, Math.min(22, Math.round(Math.min(width, height) / 40)));
  const dLumArr = new Float32Array(n);
  const cDistArr = new Float32Array(n);
  const bgLumArr = new Float32Array(n);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - winR);
    const y1 = Math.min(height - 1, y + winR);
    const r0 = y0 * iw;
    const r1 = (y1 + 1) * iw;
    const yOff = y * width;

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - winR);
      const x1 = Math.min(width - 1, x + winR);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const bgR = (intR[r1 + x1 + 1] - intR[r0 + x1 + 1] - intR[r1 + x0] + intR[r0 + x0]) / area;
      const bgG = (intG[r1 + x1 + 1] - intG[r0 + x1 + 1] - intG[r1 + x0] + intG[r0 + x0]) / area;
      const bgB = (intB[r1 + x1 + 1] - intB[r0 + x1 + 1] - intB[r1 + x0] + intB[r0 + x0]) / area;
      const bgL = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

      const idx = yOff + x;
      bgLumArr[idx] = bgL;
      dLumArr[idx] = fineL[idx] - bgL;
      cDistArr[idx] = Math.max(
        Math.abs(fineR[idx] - bgR),
        Math.abs(fineG[idx] - bgG),
        Math.abs(fineB[idx] - bgB)
      );
    }
  }

  const tileSize = 32;
  const tCols = Math.ceil(width / tileSize);
  const tRows = Math.ceil(height / tileSize);

  for (let tr = 0; tr < tRows; tr++) {
    const ty0 = tr * tileSize;
    const ty1 = Math.min(height, ty0 + tileSize);
    for (let tc = 0; tc < tCols; tc++) {
      const tx0 = tc * tileSize;
      const tx1 = Math.min(width, tx0 + tileSize);

      let maxDark = 0;
      let maxLight = 0;
      let maxChrom = 0;
      let sumBgL = 0;
      let count = 0;

      for (let y = ty0; y < ty1; y += 2) {
        const yOff = y * width;
        for (let x = tx0; x < tx1; x += 2) {
          const idx = yOff + x;
          const dl = dLumArr[idx];
          if (-dl > maxDark) maxDark = -dl;
          if (dl > maxLight) maxLight = dl;
          if (cDistArr[idx] > maxChrom) maxChrom = cDistArr[idx];
          sumBgL += bgLumArr[idx];
          count++;
        }
      }

      const avgBgL = count > 0 ? sumBgL / count : 200;
      const isPureBg = maxDark < 13 && maxLight < 13 && maxChrom < 18;

      if (isPureBg) {
        for (let y = ty0; y < ty1; y++) {
          const yOff = y * width;
          for (let x = tx0; x < tx1; x++) {
            const p4 = (yOff + x) * 4;
            data[p4] = 253;
            data[p4 + 1] = 253;
            data[p4 + 2] = 253;
            data[p4 + 3] = 255;
          }
        }
        continue;
      }

      const lightInkDominant = maxLight > maxDark * 1.22 && avgBgL < 150;
      const peakLumExcursion = lightInkDominant ? maxLight : maxDark;
      const tilePeak = Math.max(18, peakLumExcursion * 0.8 + maxChrom * 0.35);
      // Gate below 27% of local foreground peak to drop faint wallpaper icons and colliding watermarks.
      const floorGate = Math.max(8, tilePeak * 0.27);
      const gain = 245 / Math.max(12, tilePeak - floorGate);

      for (let y = ty0; y < ty1; y++) {
        const yOff = y * width;
        for (let x = tx0; x < tx1; x++) {
          const idx = yOff + x;
          const dl = dLumArr[idx];
          const primaryLum = lightInkDominant ? Math.max(0, dl) : Math.max(0, -dl);
          const fgStrength = primaryLum * 0.8 + cDistArr[idx] * 0.35;

          let outVal = 255;
          if (fgStrength > floorGate) {
            outVal = Math.max(0, Math.min(255, Math.round(255 - (fgStrength - floorGate) * gain)));
          }

          const p4 = idx * 4;
          data[p4] = outVal;
          data[p4 + 1] = outVal;
          data[p4 + 2] = outVal;
          data[p4 + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outCanvas;
}

// Open inter-character valleys so touching strokes (rn vs m, cl vs d, tight line leading) split cleanly.
export function createStrokeSeparatedCrispCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const sauvola = createAdaptiveSauvolaCanvas(sourceCanvas, false);
  const width = sauvola.width;
  const height = sauvola.height;
  const ctx = sauvola.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sauvola;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const n = width * height;
  const gray = new Float32Array(n);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = data[i];
  }

  const crisp = applyUnsharpMask(gray, width, height, 0.95);

  for (let y = 1; y < height - 1; y++) {
    const rOff = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rOff + x;
      let val = crisp[idx];

      if (val < 185) {
        const left = crisp[idx - 1];
        const right = crisp[idx + 1];
        const up = crisp[idx - width];
        const down = crisp[idx + width];

        if (val > left + 14 && val > right + 14 && left < 145 && right < 145) {
          val = Math.min(255, val + 62);
        } else if (
          val > up + 16 &&
          val > down + 16 &&
          up < 145 &&
          down < 145 &&
          (left + right) * 0.5 > 170
        ) {
          val = Math.min(255, val + 68);
        } else if (val < 135) {
          val = Math.max(0, val * 0.78);
        }
      } else {
        val = Math.min(255, val * 1.04);
      }

      const out = Math.round(val);
      const p4 = idx * 4;
      data[p4] = out;
      data[p4 + 1] = out;
      data[p4 + 2] = out;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return sauvola;
}

export function generateAdaptiveVariantsStageB(
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

  // Upscale narrow or soft images so cramped glyphs separate before binarization.
  let scale = 1;
  if (origW < 1050) {
    scale = Math.min(2.6, Math.max(1.6, 1480 / origW));
  } else if (diagnostics.sharpnessScore < 35 && origW < 1500) {
    scale = 1.45;
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

  variants.push({
    name: 'Natural-Original',
    dataUrl: scaledBaseCanvas.toDataURL('image/png'),
    scaleX: scale,
    scaleY: scale,
    offsetX: 0,
    offsetY: 0,
    psm: PSM.AUTO,
  });

  const bgSuppressedCanvas = createBgSuppressedMorphCanvas(scaledBaseCanvas);
  variants.push({
    name: 'Bg-Suppressed-Morph',
    dataUrl: bgSuppressedCanvas.toDataURL('image/png'),
    scaleX: scale,
    scaleY: scale,
    offsetX: 0,
    offsetY: 0,
    psm: PSM.SPARSE_TEXT,
  });

  const strokeCrispCanvas = createStrokeSeparatedCrispCanvas(scaledBaseCanvas);
  variants.push({
    name: 'Stroke-Separated-Crisp',
    dataUrl: strokeCrispCanvas.toDataURL('image/png'),
    scaleX: scale,
    scaleY: scale,
    offsetX: 0,
    offsetY: 0,
    psm: PSM.AUTO,
  });

  const hasDarkRegions =
    diagnostics.dominantTheme === 'dark' ||
    diagnostics.candidateZones.some((z) => z.meanLuminance < 118) ||
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

  if (
    diagnostics.dominantTheme === 'colored_or_patterned' ||
    diagnostics.backgroundComplexityScore > 24 ||
    diagnostics.contrastScore < 42
  ) {
    const chromaticCanvas = createChromaticContrastCanvas(scaledBaseCanvas);
    variants.push({
      name: 'Chromatic-Color-Separation',
      dataUrl: chromaticCanvas.toDataURL('image/png'),
      scaleX: scale,
      scaleY: scale,
      offsetX: 0,
      offsetY: 0,
      psm: PSM.SPARSE_TEXT,
    });
  }

  // Slice tall scrolling screenshots with 22% vertical overlap so split lines stay intact in at least one tile.
  if (diagnostics.isTallScreenshot && origH > 1350) {
    const tileHeight = Math.round(origH * 0.48);
    const stepY = Math.round(tileHeight * 0.78);
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
