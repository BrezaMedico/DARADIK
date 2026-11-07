import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  renderMathCaptchaToCanvas,
  type MathChallengeState,
} from '../reportFormUtils';

export interface MathCaptchaSectionProps {
  mathChallenge: MathChallengeState;
  mathInput: string;
  onMathInputChange: (value: string) => void;
  onRegenerate: () => void;
}

export const MathCaptchaSection: React.FC<MathCaptchaSectionProps> = ({
  mathChallenge,
  mathInput,
  onMathInputChange,
  onRegenerate,
}) => {
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mathCanvasRef.current) {
      renderMathCaptchaToCanvas(mathCanvasRef.current, mathChallenge.textToDraw);
    }
  }, [mathChallenge]);

  return (
    <div className="space-y-3 pt-2 text-center flex flex-col items-center">
      <label
        htmlFor="math-captcha-input"
        className="text-xs sm:text-sm font-semibold text-[#1E293B]"
      >
        Hitung soal berikut untuk verifikasi pengiriman manusia
        <span className="text-[#991B1B] font-bold ml-1">*</span>
      </label>

      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-3.5 max-w-sm w-full mx-auto flex flex-col items-center">
        <div className="flex items-center justify-center gap-2.5 w-full">
          <div className="rounded-xl overflow-hidden border border-[#C9DFDC] bg-white shrink-0 select-none max-w-[180px] sm:max-w-[210px]">
            <canvas
              ref={mathCanvasRef}
              width={210}
              height={62}
              className="block pointer-events-none w-full h-auto"
              title="Soal Verifikasi Matematika"
            />
          </div>

          <button
            type="button"
            onClick={onRegenerate}
            className="w-11 h-11 rounded-xl bg-white hover:bg-[#EBF3F8] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Ganti Soal Baru"
            aria-label="Ganti Soal Matematika"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full space-y-1">
          <input
            id="math-captcha-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={mathInput}
            onChange={(e) => {
              onMathInputChange(e.target.value.replace(/[^0-9]/g, ''));
            }}
            placeholder="Ketik hasil angka..."
            className="w-full min-h-[44px] text-center px-4 py-2.5 text-sm font-mono font-bold tracking-wider bg-white border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
          />
          <p className="text-[11px] text-[#475569] text-center">
            Masukkan hasil hitungan angka di atas
          </p>
        </div>
      </div>
    </div>
  );
};
