import React, { useState } from 'react';
import {
  Camera,
  ClipboardPaste,
  FileText,
  Lock,
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
  schoolSelectorSlot?: React.ReactNode;
  isLocked?: boolean;
  lockedMessage?: string;
  headingAs?: 'h1' | 'h2';
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
  schoolSelectorSlot,
  isLocked = false,
  lockedMessage = 'Pilih sekolah terlebih dahulu di atas untuk mengaktifkan pemindai pesan.',
  headingAs = 'h2',
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const HeadingTag = headingAs;

  return (
    <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6 w-full">
      <div className="space-y-2">
        <HeadingTag className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
          Pemindai Pesan &amp; Iuran Sekolah
        </HeadingTag>
        <p className="daradik-lead text-xs sm:text-sm text-[#475569] leading-relaxed">
          Periksa tangkapan layar chat atau teks pengumuman untuk mengetahui apakah iuran termasuk pungli atau sudah dibiayai dana BOSP.
        </p>
      </div>

      {schoolSelectorSlot && (
        <div className="pt-4 border-t border-[#C9DFDC]/60">
          {schoolSelectorSlot}
        </div>
      )}

      {isLocked && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] text-xs sm:text-sm text-[#334155] font-medium"
        >
          <Lock className="w-4 h-4 text-[#475569] shrink-0" aria-hidden="true" />
          <span>{lockedMessage}</span>
        </div>
      )}

      <div className="flex justify-center">
        <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto p-1 bg-[#FAF8F5] border border-[#C9DFDC] rounded-xl shadow-xs gap-1">
          <button
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onInputModeChange('upload')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${
              isLocked
                ? 'cursor-not-allowed text-[#475569] bg-[#E2E8F0]'
                : inputMode === 'upload'
                ? 'cursor-pointer bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                : 'cursor-pointer text-[#475569] hover:text-[#1E293B]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Unggah Foto</span>
          </button>

          <button
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onInputModeChange('text')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${
              isLocked
                ? 'cursor-not-allowed text-[#475569] bg-[#F1F5F9]'
                : inputMode === 'text'
                ? 'cursor-pointer bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                : 'cursor-pointer text-[#475569] hover:text-[#1E293B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Tempel Teks Pesan</span>
          </button>
        </div>
      </div>

      {inputMode === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => {
              if (!isLocked) onOpenFilePicker();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isLocked) setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              if (!isLocked) onDropFile(e);
            }}
            aria-disabled={isLocked}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 group space-y-3 ${
              isLocked
                ? 'border-[#CBD5E1] bg-[#F1F5F9] cursor-not-allowed select-none'
                : isDraggingOver
                ? 'border-[#2E6496] bg-[#EBF3F8]/60 cursor-pointer'
                : 'border-[#2E6496]/35 hover:border-[#2E6496] bg-[#FAF8F5] hover:bg-[#EBF3F8]/30 cursor-pointer'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto shadow-xs transition-colors ${
                isLocked
                  ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#475569]'
                  : 'bg-[#EBF3F8] group-hover:bg-[#FFFFFF] border-[#C9DFDC] text-[#2E6496]'
              }`}
            >
              <Upload className="w-6 h-6" aria-hidden="true" />
            </div>

            <div>
              <div
                className={`text-sm sm:text-base font-bold ${
                  isLocked ? 'text-[#334155]' : 'text-[#1E293B]'
                }`}
              >
                Masukkan Foto atau Tangkapan Layar Pesan
              </div>
              <p className="text-xs text-[#475569] mt-1">
                Seret dan lepas gambar ke sini, tekan{' '}
                <kbd
                  className={`font-bold px-1.5 py-0.5 rounded ${
                    isLocked
                      ? 'bg-[#E2E8F0] text-[#334155]'
                      : 'bg-[#EBF3F8] text-[#2E6496]'
                  }`}
                >
                  Ctrl+V
                </kbd>
                , atau cari berkas dari perangkat Anda.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                disabled={isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked) onOpenFilePicker();
                }}
                className={
                  isLocked
                    ? 'w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 bg-[#E2E8F0] text-[#475569] border border-[#CBD5E1] cursor-not-allowed'
                    : 'school-btn-primary w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer'
                }
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>Cari Berkas Gambar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {inputMode === 'text' && (
        <div
          className={`border rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs ${
            isLocked
              ? 'bg-[#F1F5F9] border-[#CBD5E1]'
              : 'bg-[#FAF8F5] border-[#C9DFDC]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="scanner-pasted-text"
              className="text-xs font-bold text-[#1E293B]"
            >
              Teks Pesan Chat atau Pengumuman
            </label>
            <button
              type="button"
              disabled={isLocked}
              onClick={onPasteFromClipboard}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                isLocked
                  ? 'bg-[#E2E8F0] text-[#475569] border border-[#CBD5E1] cursor-not-allowed'
                  : 'school-btn-secondary cursor-pointer'
              }`}
            >
              <ClipboardPaste
                className={`w-3.5 h-3.5 ${
                  isLocked ? 'text-[#475569]' : 'text-[#2E6496]'
                }`}
                aria-hidden="true"
              />
              <span>Tempel Teks</span>
            </button>
          </div>

          <textarea
            id="scanner-pasted-text"
            rows={4}
            disabled={isLocked}
            value={pastedText}
            onChange={(e) => onPastedTextChange(e.target.value)}
            placeholder="Tempelkan isi pesan atau pengumuman iuran dari grup chat di sini..."
            className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed resize-none focus:outline-none ${
              isLocked
                ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#475569] placeholder-[#64748B] cursor-not-allowed'
                : 'bg-[#FFFFFF] border-[#C9DFDC] text-[#1E293B] placeholder-[#64748B] focus:border-[#2E6496]'
            }`}
          />

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              disabled={isLocked || !pastedText.trim()}
              onClick={onAnalyzeDirectText}
              className={
                isLocked
                  ? 'w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#E2E8F0] text-[#475569] border border-[#CBD5E1] cursor-not-allowed'
                  : 'school-btn-primary w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-40'
              }
            >
              <span>Periksa Teks Pesan</span>
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-[#475569] pt-1">
        <ShieldCheck className="w-4 h-4 text-[#2E6496] shrink-0" aria-hidden="true" />
        <span>Privasi terjaga: Gambar dan teks dianalisis langsung dengan aman.</span>
      </div>
    </div>
  );
};
