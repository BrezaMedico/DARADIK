import React from 'react';
import { Cookie, X } from 'lucide-react';

export interface CookieConsentBannerProps {
  hasCookieConsent: boolean;
  onAccept: () => void;
  onDismiss?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  hasCookieConsent,
  onAccept,
  onDismiss,
}) => {
  if (hasCookieConsent) return null;

  return (
    <aside
      role="region"
      aria-label="Pemberitahuan Persetujuan Cookie dan Penyimpanan Data"
      className="fixed bottom-[calc(var(--mobile-nav-h)+var(--safe-bottom)+0.75rem)] left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-md z-[995] bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 shadow-xl space-y-3 animate-view-enter"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#92400E] flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
            Penyimpanan Data &amp; Cookie Lokal
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            DARADIK menggunakan cookie di perangkat Anda untuk menyimpan kode tiket pemantauan laporan secara anonim dan menjaga kuota pengiriman formulir. Kami tidak mengumpulkan data pribadi atau pelacak pihak ketiga.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF8F5] transition-colors cursor-pointer shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E4E0D8]/60">
        <button
          type="button"
          onClick={onAccept}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer shadow-xs active:translate-y-[1px]"
        >
          Setujui Penyimpanan Data
        </button>
      </div>
    </aside>
  );
};

