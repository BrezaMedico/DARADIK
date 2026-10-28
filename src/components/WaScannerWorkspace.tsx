import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  FileText,
  ClipboardPaste,
  Send,
  Building2,
  Scale,
  MessageSquare,
} from 'lucide-react';
import {
  SchoolData,
  WaScenarioData,
  formatRupiah,
} from '../data/schoolsData';
import {
  runAdvancedWaOcrPipeline,
  analyzeDirectTextMessage,
  AiScanAnalysisResult,
} from '../lib/aiWaScanner';

interface WaScannerWorkspaceProps {
  school: SchoolData;
  onReportFromWaScenario: (scenario: WaScenarioData) => void;
  onShowToast: (message: string) => void;
}

export const WaScannerWorkspace: React.FC<WaScannerWorkspaceProps> = ({
  school,
  onReportFromWaScenario,
  onShowToast,
}) => {
  // Input mode: upload screenshot or paste text
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');

  // Core Scan State
  const [ocrScanResult, setOcrScanResult] = useState<AiScanAnalysisResult | null>(null);
  const [activeSource, setActiveSource] = useState<File | string | HTMLCanvasElement | null>(null);
  const [displayedFileName, setDisplayedFileName] = useState<string>('');
  const [isScanningWa, setIsScanningWa] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Direct text state
  const [pastedText, setPastedText] = useState<string>('');

  // Image preview controls
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [rotationDeg, setRotationDeg] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Run pipeline for screenshot image
  const executePipeline = async (
    source: File | string | HTMLCanvasElement,
    fileName: string,
    rotation: number = 0
  ) => {
    setScanError(null);
    setIsScanningWa(true);
    setActiveSource(source);
    setDisplayedFileName(fileName);
    setRotationDeg(rotation);
    setPreviewZoom(1);

    try {
      const result = await runAdvancedWaOcrPipeline(
        source,
        school.items,
        undefined,
        {
          rotationDeg: rotation,
          schoolName: school.name,
          studentCount: school.studentCount,
        }
      );
      setOcrScanResult(result);
    } catch (err: any) {
      setScanError(
        err?.message ||
          'Gagal membaca gambar. Pastikan gambar screenshot jelas dan berformat PNG, JPG, atau WebP.'
      );
    } finally {
      setIsScanningWa(false);
    }
  };

  // Run analysis for pasted text
  const handleAnalyzeDirectText = async (textToAnalyze?: string) => {
    const text = (textToAnalyze !== undefined ? textToAnalyze : pastedText).trim();
    if (!text) {
      setScanError('Silakan tempel atau ketik teks pesan chat terlebih dahulu.');
      return;
    }

    setScanError(null);
    setIsScanningWa(true);
    setActiveSource(null);
    setDisplayedFileName('Teks Obrolan WhatsApp');

    try {
      await new Promise((resolve) => setTimeout(resolve, 550));
      const result = analyzeDirectTextMessage(
        text,
        school.items,
        school.name,
        school.studentCount
      );
      setOcrScanResult(result);
    } catch (err: any) {
      setScanError(err?.message || 'Gagal menganalisis teks pesan.');
    } finally {
      setIsScanningWa(false);
    }
  };

  // File upload change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanError('Format berkas tidak didukung. Harap pilih gambar PNG, JPG, atau WebP.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setScanError('Ukuran gambar melebihi batas 25 MB.');
      return;
    }

    executePipeline(file, file.name, 0);
  };

  // Drag & drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('Format tidak didukung. Harap pilih berkas gambar.');
      return;
    }
    executePipeline(file, file.name, 0);
  };

  // Clipboard Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'INPUT'
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            executePipeline(blob, `Screenshot_${Date.now()}.png`, 0);
            onShowToast('Screenshot dari clipboard dimuat.');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [school.items]);

  // Paste text from clipboard into textarea
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPastedText(text);
          onShowToast('Teks berhasil ditempel.');
        } else {
          onShowToast('Tidak ada teks di clipboard.');
        }
      }
    } catch {
      onShowToast('Gunakan pintasan Ctrl+V pada kotak teks.');
    }
  };

  // Preset sample texts
  const handleLoadSample = (sampleType: 'kipas' | 'kaos') => {
    if (sampleType === 'kipas') {
      const s = `Bapak/ibu wali murid, karena ruang kelas panas, disepakati iuran Rp 50.000 per siswa untuk beli kipas angin dinding kelas. Mohon ditransfer paling lambat hari Jumat ke rekening bendahara.`;
      setPastedText(s);
      handleAnalyzeDirectText(s);
    } else {
      const s = `Selamat siang bapak/ibu wali murid. Untuk pembuatan kaos kelas dan seragam angkatan, diwajibkan membayar uang kas Rp 150.000 per anak sebelum tanggal 15.`;
      setPastedText(s);
      handleAnalyzeDirectText(s);
    }
  };

  // Reset view
  const handleResetScan = () => {
    setOcrScanResult(null);
    setActiveSource(null);
    setDisplayedFileName('');
    setScanError(null);
    setRotationDeg(0);
    setPreviewZoom(1);
    setPastedText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Rotate image
  const handleRotateImage = () => {
    const nextRot = (rotationDeg + 90) % 360;
    setRotationDeg(nextRot);
    if (activeSource) {
      executePipeline(activeSource, displayedFileName || 'screenshot_wa.png', nextRot);
    }
  };

  // Trigger report flow
  const handleReport = () => {
    if (!ocrScanResult) return;
    const isDanger = ocrScanResult.statusType === 'danger';
    const scenarioData: WaScenarioData = {
      id: isDanger ? 'scenario-a' : 'scenario-b',
      buttonLabel: ocrScanResult.statusTitle,
      shortTitle:
        ocrScanResult.detectedItemKeyword || (isDanger ? 'Pungutan Kelas' : 'Iuran Siswa'),
      fileName: displayedFileName || 'screenshot_wa.png',
      groupName: 'Grup WhatsApp Wali Murid',
      timestamp: 'Terkini',
      statusType: ocrScanResult.statusType,
      statusHeader: isDanger
        ? 'STATUS AI: TERDETEKSI INDIKASI TUMPANG TINDIH'
        : 'STATUS AI: TIDAK ADA DI PENGAJUAN BOSP',
      ocrQuote: ocrScanResult.detectedQuote,
      bospFact: ocrScanResult.bospFact,
      reportCategoryPrefill: `Iuran ${
        ocrScanResult.detectedItemKeyword || 'Sekolah'
      } (${isDanger ? `Tumpang Tindih BOSP ${school.name}` : `Non-RKAS ${school.name}`})`,
      attachmentLabel: `Verifikasi Chat (${displayedFileName || 'screenshot_wa.png'})`,
      primaryButtonLabel: isDanger
        ? 'Kirim Laporan Anonim Sekarang'
        : 'Tetap Laporkan jika Ada Paksaan',
    };
    onReportFromWaScenario(scenarioData);
  };

  const isDanger = ocrScanResult?.statusType === 'danger';
  const comp = ocrScanResult?.threeWayComparison;

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Error notification banner */}
      {scanError && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-[#DC2626]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanError(null)}
            className="text-xs font-bold underline shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* =====================================================================
          STATE 1: CLEAN INPUT (TAB TOGGLE: SCREENSHOT VS TEKS)
         ===================================================================== */}
      {!ocrScanResult && !isScanningWa && (
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-10 shadow-xs space-y-6 max-w-2xl mx-auto">
          {/* Header Ringkas */}
          <div className="text-center space-y-1.5">
            <h2 className="font-sturdy-heading text-xl sm:text-2xl font-bold text-[#1E293B]">
              Cek Iuran Grup WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Cari tahu apakah iuran sekolah ini termasuk pungli atau sudah didanai BOSP.
            </p>
          </div>

          {/* Segmented Control (Pilihan: Screenshot atau Teks) */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  inputMode === 'upload'
                    ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Screenshot Gambar</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  inputMode === 'text'
                    ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tempel Teks Pesan</span>
              </button>
            </div>
          </div>

          {/* OPSI A: UNGGAH GAMBAR */}
          {inputMode === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#2E6496]/35 hover:border-[#2E6496] bg-[#FAF8F5] hover:bg-[#EBF3F8]/30 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all group space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EBF3F8] group-hover:bg-[#FFFFFF] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <div className="text-sm sm:text-base font-bold text-[#1E293B]">
                  Pilih Screenshot WhatsApp
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Klik untuk memilih gambar atau tekan <kbd className="font-mono font-bold bg-[#EBF3F8] px-1 py-0.5 rounded text-[#2E6496]">Ctrl+V</kbd>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="school-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Berkas Gambar</span>
                </button>
              </div>
            </div>
          )}

          {/* OPSI B: TEMPEL TEKS CHAT */}
          {inputMode === 'text' && (
            <div className="bg-[#FAF8F5] border border-[#C9DFDC] rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">Teks Pesan Chat:</span>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="school-btn-secondary px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-[#2E6496]" />
                  <span>Tempel</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Tempel pesan dari guru di sini (misal: 'Mohon transfer iuran kipas angin Rp 50.000 paling lambat hari Jumat...')"
                className="w-full p-3 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E6496] leading-relaxed resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                  <span>Contoh:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('kipas')}
                    className="px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#C9DFDC] text-[#2E6496] hover:bg-[#EBF3F8] font-medium cursor-pointer"
                  >
                    Kipas Angin (Rp 50rb)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('kaos')}
                    className="px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#C9DFDC] text-[#475569] hover:bg-[#FAF8F5] font-medium cursor-pointer"
                  >
                    Kaos Kelas (Rp 150rb)
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!pastedText.trim()}
                  onClick={() => handleAnalyzeDirectText()}
                  className="school-btn-primary px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <span>Periksa Teks</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Privacy badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] pt-1">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>Privasi terjaga: Gambar &amp; teks dianalisis langsung di perangkat Anda.</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 2: LOADING (3 LINGKARAN BERSIH)
         ===================================================================== */}
      {isScanningWa && (
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[300px] max-w-md mx-auto space-y-5">
          <div className="flex items-center justify-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-[#2E6496] animate-ai-dot-1" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#66A3BF] animate-ai-dot-2" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#2E6496] animate-ai-dot-3" />
          </div>

          <div className="space-y-1">
            <h3 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
              Memeriksa Pesan...
            </h3>
            <p className="text-xs text-[#64748B]">
              Mencocokkan dengan data realisasi BOSP {school.name}.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 3: HASIL VERIFIKASI BERSIH, MODERN & TIDAK DESAK-DESAKAN
         ===================================================================== */}
      {ocrScanResult && !isScanningWa && (
        <div className="space-y-6">
          {/* Bar Aksi Atas */}
          <div className="flex items-center justify-between gap-3 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-3.5 shadow-xs">
            <button
              type="button"
              onClick={handleResetScan}
              className="school-btn-secondary px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2E6496]" />
              <span>Periksa Screenshot / Teks Lain</span>
            </button>

            <span className="text-xs font-mono text-[#64748B] bg-[#FAF8F5] border border-[#C9DFDC] px-3 py-1 rounded-lg truncate max-w-[240px]">
              {displayedFileName || 'Pesan WhatsApp'}
            </span>
          </div>

          {/* Grid 2 Kolom Bersih */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ===============================================================
                KOLOM KIRI (5 Kolom): BUKTI PESAN / GAMBAR
               =============================================================== */}
            <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#C9DFDC] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">
                  {ocrScanResult.sourceType === 'direct_text'
                    ? 'Pesan Obrolan'
                    : 'Screenshot Asli'}
                </span>

                {ocrScanResult.sourceType !== 'direct_text' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRotateImage}
                      className="school-btn-secondary p-1 rounded-md text-xs cursor-pointer"
                      title="Putar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#2E6496]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => (z >= 1.25 ? 1 : 1.25))}
                      className="school-btn-secondary px-2 py-0.5 rounded-md text-xs font-mono cursor-pointer"
                    >
                      {previewZoom > 1 ? (
                        <ZoomOut className="w-3.5 h-3.5 text-[#2E6496]" />
                      ) : (
                        <ZoomIn className="w-3.5 h-3.5 text-[#2E6496]" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {ocrScanResult.sourceType === 'direct_text' ? (
                <div className="p-5 bg-[#FAF8F5]">
                  <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2E6496]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Pesan Guru / Wali Kelas</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                      "{ocrScanResult.rawOcrText}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#0F172A]/5 max-h-[460px] overflow-auto flex justify-center">
                  <img
                    src={ocrScanResult.processedPreviewDataUrl}
                    alt="Screenshot WhatsApp"
                    style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }}
                    className="w-full h-auto block rounded-lg border border-[#C9DFDC] shadow-xs transition-transform"
                  />
                </div>
              )}
            </div>

            {/* ===============================================================
                KOLOM KANAN (7 Kolom): VONIS & KOMPARASI 3 PILAR RINGKAS
               =============================================================== */}
            <div className="lg:col-span-7 space-y-5">
              {/* KARTU 1: VONIS UTAMA */}
              <div
                className={`rounded-2xl p-5 sm:p-6 shadow-xs border-2 space-y-2 ${
                  isDanger
                    ? 'border-[#EF4444] bg-[#FEF2F2]/60'
                    : 'border-[#2E6496]/35 bg-[#EBF3F8]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isDanger ? (
                      <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-[#2E6496] shrink-0" />
                    )}
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                        isDanger
                          ? 'bg-[#FFFFFF] text-[#DC2626] border-[#FECACA]'
                          : 'bg-[#FFFFFF] text-[#2E6496] border-[#C9DFDC]'
                      }`}
                    >
                      {isDanger ? 'Terindikasi Pungli' : 'Bukan Dana BOSP'}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#64748B]">
                    Akurasi {ocrScanResult.confidenceScore}%
                  </span>
                </div>

                <h3
                  className={`font-sturdy-heading text-lg sm:text-xl font-extrabold ${
                    isDanger ? 'text-[#991B1B]' : 'text-[#1E293B]'
                  }`}
                >
                  {isDanger
                    ? 'Terindikasi Tumpang Tindih dengan Dana BOSP'
                    : 'Bukan Pengadaan dari Anggaran Resmi BOSP'}
                </h3>

                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isDanger ? 'text-[#7F1D1D]' : 'text-[#475569]'
                  }`}
                >
                  {isDanger
                    ? `Barang ini sudah dibiayai oleh dana BOSP resmi pemerintah di ${school.name}. Sekolah dilarang menarik iuran dari orang tua murid.`
                    : `Kegiatan ini tidak termasuk belanja wajib BOSP. Kendati demikian, sumbangan wali murid tetap wajib bersifat sukarela tanpa paksaan.`}
                </p>
              </div>

              {/* KARTU 2: KOMPARASI 3 PILAR BERSIH & TIDAK BERTELE-TELE */}
              <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-bold text-[#475569] uppercase tracking-wider block">
                  Perbandingan 3 Sisi:
                </span>

                <div className="space-y-3 text-xs">
                  {/* Baris 1: Teks Guru */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#2E6496] shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#64748B] block">1. Pesan Guru:</span>
                        <span className="font-bold text-[#1E293B] text-xs sm:text-sm capitalize">
                          {comp?.teacherText.detectedItem || 'Iuran Kelas'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:text-right">
                      <span className="font-mono font-bold text-[#1E293B]">
                        {comp?.teacherText.detectedAmount
                          ? formatRupiah(comp.teacherText.detectedAmount)
                          : 'Nominal tidak tertera'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          comp?.teacherText.isMandatory
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-[#EBF3F8] text-[#2E6496]'
                        }`}
                      >
                        {comp?.teacherText.isMandatory ? 'Wajib/Menagih' : 'Sukarela'}
                      </span>
                    </div>
                  </div>

                  {/* Baris 2: Data Anggaran Sekolah */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#2E6496] shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#64748B] block">2. Anggaran Sekolah ({school.name}):</span>
                        <span className="font-bold text-[#1E293B] text-xs sm:text-sm">
                          {comp?.schoolBudget.isFundedByBosp
                            ? 'Sudah Dibiayai BOSP Negara'
                            : 'Di Luar Pagu BOSP (Non-RKAS)'}
                        </span>
                      </div>
                    </div>
                    <div className="sm:text-right font-mono">
                      <span className="font-bold text-[#1E293B] block">
                        {comp?.schoolBudget.allocatedAmount
                          ? formatRupiah(comp.schoolBudget.allocatedAmount)
                          : '-'}
                      </span>
                      {comp?.schoolBudget.itemCode && (
                        <span className="text-[10px] text-[#64748B]">
                          Kode: {comp.schoolBudget.itemCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Baris 3: Aturan Resmi BOSP */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#2E6496] shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#64748B] block">3. Aturan Kemendikbudristek:</span>
                        <span className="font-semibold text-[#1E293B] text-xs">
                          {isDanger
                            ? 'Permendikbudristek 63/2023 Pasal 61'
                            : 'Permendikbud 75/2016 Pasal 10 & 12'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                        isDanger
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                          : 'bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC]'
                      }`}
                    >
                      {isDanger ? 'Melanggar Regulasi' : 'Sesuai Ketentuan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* KARTU 3: TOMBOL AKSI UTAMA */}
              {isDanger ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleReport}
                    className="w-full py-3.5 px-5 rounded-xl school-btn-danger font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Kirim Laporan Anonim ke Inspektorat</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-[#64748B]">
                    Laporan dikirim secara anonim tanpa mencantumkan nama atau nomor HP Anda.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleReport}
                  className="w-full py-3 px-5 rounded-xl school-btn-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Tetap Laporkan jika Mengalami Pemaksaan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
