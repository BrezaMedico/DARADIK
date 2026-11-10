import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Kembali ke Beranda',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 ${className}`.trim()}
    >
      <ArrowLeft className="w-4 h-4 text-[#2E6496] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};

