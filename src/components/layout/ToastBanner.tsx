import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div
      className="fixed left-3 right-3 bottom-[calc(var(--mobile-nav-h)+var(--safe-bottom)+0.75rem)] sm:left-auto sm:right-5 sm:bottom-5 z-[56] sm:max-w-md bg-[#1E293B] text-[#FAF8F5] border border-[#2E6496] rounded-lg px-4 py-3 shadow-lg flex items-center justify-between gap-3 animate-view-enter"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
        <CheckCircle2 className="w-4 h-4 text-[#C9DFDC] shrink-0" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[#C9DFDC] hover:text-[#FFFFFF] p-2.5 -m-1.5 shrink-0"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

