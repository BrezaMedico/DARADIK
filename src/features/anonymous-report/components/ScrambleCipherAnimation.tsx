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
    <div className="w-full text-center space-y-1.5 pt-1">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#2E6496]">
        <Lock className="w-3.5 h-3.5" />
        <span>{progressLabel}</span>
      </div>

      <div className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[#1E293B] select-none py-1">
        {displayText}
      </div>
    </div>
  );
};
