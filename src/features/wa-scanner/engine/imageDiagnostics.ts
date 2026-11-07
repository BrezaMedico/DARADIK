import type {
  BoundingBox,
  CandidateTextZone,
  ImageDiagnostics,
  ImagePreprocessAdjustments,
  RiskZone,
} from '@/types/scanner';

// Straighten slightly crooked phone captures (-8°..+8°) via horizontal edge-projection variance.
export function estimateAutoDeskewAngle(sourceCanvas: HTMLCanvasElement): number {
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

  // Vertical-gradient edges isolate horizontal text baselines from background fill.
  const edgeX: number[] = [];
  const edgeY: number[] = [];
  const edgeMag: number[] = [];
  const cx = sampleW / 2;
  const cy = sampleH / 2;

  for (let y = 2; y < sampleH - 2; y++) {
    const rOff = y * sampleW;
    for (let x = 4; x < sampleW - 4; x++) {
      const gy = Math.abs(lum[rOff + sampleW + x] - lum[rOff - sampleW + x]);
      if (gy >= 20) {
        edgeX.push(x - cx);
        edgeY.push(y - cy);
        edgeMag.push(gy);
      }
    }
  }

  if (edgeX.length < 120) return 0;

  const evalAngleVariance = (deg: number): number => {
    const rad = (deg * Math.PI) / 180;
    const sinA = Math.sin(rad);
    const cosA = Math.cos(rad);
    const bins = new Float64Array(sampleH);
    for (let i = 0; i < edgeX.length; i++) {
      const ry = Math.round(edgeX[i] * sinA + edgeY[i] * cosA + cy);
      if (ry >= 0 && ry < sampleH) {
        bins[ry] += edgeMag[i];
      }
    }
    let mean = 0;
    for (let r = 0; r < sampleH; r++) mean += bins[r];
    mean /= sampleH;
    let sq = 0;
    for (let r = 0; r < sampleH; r++) {
      const d = bins[r] - mean;
      sq += d * d;
    }
    return sq / sampleH;
  };

  const zeroVar = evalAngleVariance(0);
  if (zeroVar <= 0) return 0;

  let bestDeg = 0;
  let bestVar = zeroVar;
  for (let deg = -7; deg <= 7; deg += 1) {
    if (deg === 0) continue;
    const v = evalAngleVariance(deg);
    if (v > bestVar) {
      bestVar = v;
      bestDeg = deg;
    }
  }

  const coarseCenter = bestDeg;
  for (let step = -0.75; step <= 0.75; step += 0.25) {
    const deg = coarseCenter + step;
    if (Math.abs(deg) > 8) continue;
    const v = evalAngleVariance(deg);
    if (v > bestVar) {
      bestVar = v;
      bestDeg = deg;
    }
  }

  // Require >= 0.75° skew and >13% variance gain to avoid resampling already straight screenshots.
  if (Math.abs(bestDeg) >= 0.75 && bestVar > zeroVar * 1.13) {
    return -bestDeg;
  }
  return 0;
}

export async function loadSourceToCanvas(
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

  // Keep user-facing preview unskewed while straightening the OCR working canvas when needed.
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

  let sumSqDiff = 0;
  for (let p = 0; p < totalPixels; p++) {
    const d = lum[p] - meanBrightness;
    sumSqDiff += d * d;
  }
  const stdLum = Math.sqrt(sumSqDiff / Math.max(1, totalPixels));
  const contrastScore = Math.min(100, Math.max(5, Math.round((stdLum / 78) * 100)));

  // Estimate sharpness via Laplacian variance and 8x8 JPEG block boundary discontinuities.
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

  const darkRatio = darkPixelCount / Math.max(1, totalPixels);
  const coloredRatio = coloredPixelCount / Math.max(1, totalPixels);

  // Sample local saturation across grid cells to detect patterned chat wallpapers.
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

  const { candidateZones, riskZones, embeddedMediaBoxes } =
    detectCandidateTextAndRiskZones(data, lum, sat, width, height);

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

export function detectCandidateTextAndRiskZones(
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
  // Small cells (~10x6px) capture fine horizontal strokes in timestamps and edge labels.
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

  // Low thresholds (contrast >= 18, strokeEnergy >= 6.0) retain faint text for targeted re-reads.
  const activeMask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (strokeEnergy[idx] >= 6.0 && cellContrast[idx] >= 18) {
        activeMask[idx] = 1;
      }
    }
  }

  // Dilate 2x1 cells to bridge inter-word gaps before connected-component labeling.
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
