import React from 'react';

interface TourFloatingButtonProps {
  isDarkBackground: boolean;
  onStartTour: () => void;
}

export const TourFloatingButton: React.FC<TourFloatingButtonProps> = ({
  isDarkBackground,
  onStartTour,
}) => {
  return (
    <div className="app-header-fixed fixed right-3.5 sm:right-3.5 lg:right-5 h-14 sm:h-16 flex items-center z-[60] pointer-events-none group">
      <div
        role="tooltip"
        className={`mr-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover:translate-x-0 relative flex items-center select-none ${
          isDarkBackground
            ? 'bg-[#1E293B] text-[#FFFFFF] border border-[#334155]'
            : 'bg-[#FFFFFF] text-[#1E293B] border border-[#C9DFDC] shadow-md'
        }`}
      >
        <span>Panduan</span>
        <div
          className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${
            isDarkBackground
              ? 'bg-[#1E293B] border-r border-t border-[#334155]'
              : 'bg-[#FFFFFF] border-r border-t border-[#C9DFDC]'
          }`}
          aria-hidden="true"
        />
      </div>

      <button
        type="button"
        onClick={onStartTour}
        title="Panduan Fitur"
        aria-label="Buka panduan penggunaan fitur"
        className={`pointer-events-auto w-10 h-10 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm sm:text-base leading-none select-none transition-all duration-300 cursor-pointer shrink-0 active:scale-95 ${
          isDarkBackground
            ? 'border-[#FFFFFF] text-[#FFFFFF] bg-transparent hover:border-white hover:text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]'
            : 'border-[#2E6496] text-[#2E6496] bg-white/80 hover:bg-white hover:border-[#1E293B] hover:text-[#1E293B] shadow-xs backdrop-blur-xs'
        }`}
      >
        ?
      </button>
    </div>
  );
};

