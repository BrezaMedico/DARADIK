import React from 'react';
import { BookOpen, Flag, ScanLine } from 'lucide-react';
import type { AppView } from '@/types/school';

interface AppHeaderProps {
  currentView: AppView;
  onNavigateHome: () => void;
  onNavigateKamus: () => void;
  onNavigateScanner: () => void;
  onNavigateReport: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigateHome,
  onNavigateKamus,
  onNavigateScanner,
  onNavigateReport,
}) => {
  return (
    <header className="app-header-fixed fixed left-0 right-0 z-50 px-2 sm:pl-6 sm:pr-16 lg:pl-8 lg:pr-20 xl:px-8">
      <div className="max-w-6xl mx-auto h-14 sm:h-16 px-3 sm:px-6 rounded-xl liquid-glass-nav-white flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group shrink-0 min-h-[44px]"
            aria-label="Beranda DARADIK"
          >
            <img
              src="/logo-daradik.png"
              alt="Logo DARADIK"
              className="h-6 sm:h-7 w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
            />
          </button>

          {currentView === 'school-profile' && (
            <div
              title="Halaman ini menampilkan data contoh (sample data) untuk simulasi BOSP"
              className="h-9 sm:h-9 px-3 rounded-full border-2 border-[#2E6496] text-[#2E6496] bg-white/80 hover:bg-white shadow-xs backdrop-blur-xs flex items-center gap-1.5 font-bold text-xs select-none shrink-0 transition-all duration-300"
            >
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shrink-0" aria-hidden="true" />
              <span className="tracking-wide">Sample Data</span>
            </div>
          )}
        </div>

        <nav
          className="hidden sm:flex items-center gap-1 sm:gap-2"
          aria-label="Navigasi Utama DARADIK"
        >
          <button
            type="button"
            data-tour-id="tour-kamus-bosp"
            onClick={onNavigateKamus}
            className={`nav-link-interactive px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${
              currentView === 'kamus-bosp'
                ? 'text-[#2E6496] bg-[#C9DFDC]/55'
                : 'text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35'
            }`}
          >
            <BookOpen className="w-4 h-4 hidden sm:inline text-[#2E6496]" />
            <span>Kamus BOSP</span>
          </button>

          <button
            type="button"
            data-tour-id="tour-pemindai-pesan"
            onClick={onNavigateScanner}
            className={`nav-link-interactive px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${
              currentView === 'message-scanner'
                ? 'text-[#2E6496] bg-[#C9DFDC]/55'
                : 'text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35'
            }`}
          >
            <ScanLine className="w-4 h-4 hidden sm:inline text-[#2E6496]" aria-hidden="true" />
            <span>Pemindai Pesan</span>
          </button>

          <button
            type="button"
            data-tour-id="tour-lapor"
            onClick={onNavigateReport}
            className="px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-lg daradik-cta-subtle text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px] flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span>Lapor</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

