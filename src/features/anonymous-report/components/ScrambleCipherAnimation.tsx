import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export interface ScrambleToAsteriskCipherProps {
  progressLabel: string;
}

export const ScrambleToAsteriskCipher: React.FC<ScrambleToAsteriskCipherProps> = ({
  progressLabel,
}) => {
  const initialText = 'LAPORAN_ANONIM_DARADIK';
  const [displayText, setDisplayText] = useState<string>(initialText);

  useEffect(() => {
    const glitchChars = '#$%*+0123456789ABCDEF';
    const len = initialText.length;
    let ticks = 0;
    let asterisksCount = 0;

    const timer = setInterval(() => {
      ticks++;
      if (ticks <= 4) {
        const scrambled = initialText
          .split('')
          .map((c) =>
            c === '_' ? '_' : glitchChars[Math.floor(Math.random() * glitchChars.length)]
          )
          .join('');
        setDisplayText(scrambled);
      } else if (asterisksCount < len) {
        asterisksCount = Math.min(len, asterisksCount + 2);
        const masked = initialText
          .split('')
          .map((c, i) => {
            if (i < asterisksCount) return '*';
            return c === '_'
              ? '_'
              : glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join('');
        setDisplayText(masked);
      } else {
        setDisplayText('*'.repeat(len));
        clearInterval(timer);
      }
    }, 110);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#FAF8F5] rounded-xl p-3 border border-[#E4E0D8] text-left space-y-2">
      <div className="flex items-center justify-between text-[11px] text-[#475569]">
        <span className="flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-[#2E6496]" />
          <span>Pengiriman Terlindungi</span>
        </span>
        <span className="text-[#475569] font-medium text-[11px]">
          {progressLabel}
        </span>
      </div>

      <div className="py-2 px-3 rounded-lg bg-[#F1EFEA] text-xs font-mono font-bold tracking-widest text-[#1E293B] text-center select-none border border-[#E4E0D8]">
        {displayText}
      </div>
    </div>
  );
};
