import React from 'react';
import {
  Camera,
  ClipboardPaste,
  FileText,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import type { WaSampleScenario } from '../sampleScenarios';

interface ScannerInputCardProps {
  inputMode: 'upload' | 'text';
  onInputModeChange: (mode: 'upload' | 'text') => void;
  onOpenFilePicker: () => void;
  onDropFile: (e: React.DragEvent<HTMLDivElement>) => void;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  onPasteFromClipboard: () => void;
  onAnalyzeDirectText: () => void;
  onLoadSampleImage?: (scenario: WaSampleScenario) => void;
  onLoadSampleText?: (text: string) => void;
}

export const ScannerInputCard: React.FC<ScannerInputCardProps> = ({
  inputMode,
  onInputModeChange,
  onOpenFilePicker,
  onDropFile,
  pastedText,
  onPastedTextChange,
  onPasteFromClipboard,
  onAnalyzeDirectText,
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
          Verifikasi Iuran Grup WhatsApp
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B]">
          AI Scanner cerdas untuk mendeteksi apakah iuran sekolah termasuk pungli atau sudah didanai BOSP.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto p-1 bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl shadow-xs gap-1">
          <button
            type="button"
            onClick={() => onInputModeChange('upload')}
            className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              inputMode === 'upload'
                ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Screenshot Gambar</span>
          </button>

          <button
            type="button"
            onClick={() => onInputModeChange('text')}
            className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              inputMode === 'text'
                ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Tempel Teks Pesan</span>
          </button>
        </div>
      </div>

      {inputMode === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={onOpenFilePicker}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropFile}
            className="border-2 border-dashed border-[#2E6496]/35 hover:border-[#2E6496] bg-[#FAF8F5] hover:bg-[#EBF3F8]/30 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-[#EBF3F8] group-hover:bg-[#FFFFFF] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center mx-auto shadow-xs transition-colors">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <div className="text-sm sm:text-base font-bold text-[#1E293B]">
                Pilih Screenshot WhatsApp
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Ketuk untuk memilih gambar atau tekan <kbd className="font-bold bg-[#EBF3F8] px-1.5 py-0.5 rounded text-[#2E6496]">Ctrl+V</kbd>
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFilePicker();
                }}
                className="school-btn-primary w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Berkas Gambar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {inputMode === 'text' && (
        <div className="bg-[#FAF8F5] border border-[#C9DFDC] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#1E293B]">Teks Pesan Chat</span>
            <button
              type="button"
              onClick={onPasteFromClipboard}
              className="school-btn-secondary min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-[#2E6496]" />
              <span>Tempel</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={pastedText}
            onChange={(e) => onPastedTextChange(e.target.value)}
            placeholder="Tempelkan pesan atau pengumuman iuran dari grup chat di sini untuk memeriksa keselarasan dengan data BOSP..."
            className="w-full p-3.5 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E6496] leading-relaxed resize-none"
          />

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              disabled={!pastedText.trim()}
              onClick={onAnalyzeDirectText}
              className="school-btn-primary w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-40"
            >
              <span>Periksa Teks Pesan</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] pt-1">
        <ShieldCheck className="w-4 h-4 text-[#2E6496] shrink-0" />
        <span>Privasi terjaga: Gambar &amp; teks dianalisis langsung di perangkat Anda secara aman.</span>
      </div>
    </div>
  );
};
