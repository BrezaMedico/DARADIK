import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { AiScanAnalysisResult, SchoolData, WaScenarioData } from '@/types';
import {
  analyzeDirectTextMessage,
  runAdvancedWaOcrPipeline,
} from './engine';
import { ScannerInputCard } from './components/ScannerInputCard';
import { ScannerPreviewPanel } from './components/ScannerPreviewPanel';
import { ScannerVerdictPanel } from './components/ScannerVerdictPanel';

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
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');

  const [ocrScanResult, setOcrScanResult] = useState<AiScanAnalysisResult | null>(null);
  const [activeSource, setActiveSource] = useState<File | string | HTMLCanvasElement | null>(null);
  const [displayedFileName, setDisplayedFileName] = useState<string>('');
  const [isScanningWa, setIsScanningWa] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [pastedText, setPastedText] = useState<string>('');

  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [rotationDeg, setRotationDeg] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          schoolType: school.schoolType,
          educationLevel: school.educationLevel || school.jenjang,
          totalBosp: school.totalBosp,
          compositions: school.compositions,
          tahap1Compositions: school.tahap1Compositions,
          tahap2Compositions: school.tahap2Compositions,
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
        school.studentCount,
        {
          schoolName: school.name,
          studentCount: school.studentCount,
          schoolType: school.schoolType,
          educationLevel: school.educationLevel || school.jenjang,
          totalBosp: school.totalBosp,
          compositions: school.compositions,
          tahap1Compositions: school.tahap1Compositions,
          tahap2Compositions: school.tahap2Compositions,
        }
      );
      setOcrScanResult(result);
    } catch (err: any) {
      setScanError(err?.message || 'Gagal menganalisis teks pesan.');
    } finally {
      setIsScanningWa(false);
    }
  };

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

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Let native text paste work normally when an input or textarea is focused.
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

  const handleRotateImage = () => {
    const nextRot = (rotationDeg + 90) % 360;
    setRotationDeg(nextRot);
    if (activeSource) {
      executePipeline(activeSource, displayedFileName || 'screenshot_wa.png', nextRot);
    }
  };

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
      statusType: isDanger ? 'danger' : 'safe',
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

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

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

      {!ocrScanResult && !isScanningWa && (
        <ScannerInputCard
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          onOpenFilePicker={() => fileInputRef.current?.click()}
          onDropFile={handleDrop}
          pastedText={pastedText}
          onPastedTextChange={setPastedText}
          onPasteFromClipboard={handlePasteFromClipboard}
          onAnalyzeDirectText={() => handleAnalyzeDirectText()}
        />
      )}

      {isScanningWa && (
        <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-10 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[260px] max-w-md mx-auto space-y-4 animate-view-enter">
          <div className="flex items-center justify-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-[#2E6496] animate-ai-dot-1" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#66A3BF] animate-ai-dot-2" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#2E6496] animate-ai-dot-3" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight">
              Memeriksa Pesan WhatsApp...
            </h3>
            <p className="text-xs text-[#64748B]">
              Mencocokkan kata kunci iuran dengan data pembelanjaan sekolah.
            </p>
          </div>
        </div>
      )}

      {ocrScanResult && !isScanningWa && (
        <div className="space-y-6 animate-school-item">
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-3 sm:p-3.5 shadow-xs">
            <button
              type="button"
              onClick={handleResetScan}
              className="school-btn-secondary min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
              <span>Periksa Screenshot / Teks Lain</span>
            </button>

            <span className="text-xs font-medium text-[#64748B] truncate max-w-full sm:max-w-[240px]">
              {displayedFileName || 'Pesan WhatsApp'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <ScannerPreviewPanel
              ocrScanResult={ocrScanResult}
              previewZoom={previewZoom}
              onToggleZoom={() => setPreviewZoom((z) => (z >= 1.25 ? 1 : 1.25))}
              onRotateImage={handleRotateImage}
            />

            <ScannerVerdictPanel
              ocrScanResult={ocrScanResult}
              schoolName={school.name}
              onReport={handleReport}
            />
          </div>
        </div>
      )}
    </div>
  );
};
