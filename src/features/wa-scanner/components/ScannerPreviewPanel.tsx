import React from 'react';
import { MessageSquare, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { AiScanAnalysisResult } from '@/types';

interface ScannerPreviewPanelProps {
  ocrScanResult: AiScanAnalysisResult;
  previewZoom: number;
  onToggleZoom: () => void;
  onRotateImage: () => void;
}

export const ScannerPreviewPanel: React.FC<ScannerPreviewPanelProps> = ({
  ocrScanResult,
  previewZoom,
  onToggleZoom,
  onRotateImage,
}) => {
  return (
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
              onClick={onRotateImage}
              className="school-btn-secondary p-1 rounded-md text-xs cursor-pointer"
              title="Putar 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#2E6496]" />
            </button>
            <button
              type="button"
              onClick={onToggleZoom}
              className="school-btn-secondary px-2 py-0.5 rounded-md text-xs cursor-pointer"
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
              &ldquo;{ocrScanResult.rawOcrText}&rdquo;
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
  );
};
