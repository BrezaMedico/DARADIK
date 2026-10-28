import React, { useState, useEffect } from 'react';
import { BudgetComposition, formatRupiah } from '../data/schoolsData';

interface DonutChartProps {
  compositions: BudgetComposition[];
  totalAmount: number;
}

const PALETTE_FALLBACKS = ['#2E6496', '#66A3BF', '#90B6C8'];

export const InteractiveDonutChart: React.FC<DonutChartProps> = ({
  compositions,
  totalAmount,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState<number>(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimProgress(1);
      return;
    }

    let frameId: number;
    const duration = 680;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      if (t < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    setAnimProgress(0);
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [compositions, totalAmount]);

  const size = 224;
  const strokeWidth = 26;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const activeItem =
    activeIndex !== null ? compositions[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
      {/* Left Column: Interactive Donut Ring */}
      <div className="md:col-span-5 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 select-none"
            role="img"
            aria-label="Grafik komposisi alokasi dana BOSP berdasarkan komponen utama"
          >
            {/* Base Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#EBF3F8"
              strokeWidth={strokeWidth}
            />
            {compositions.map((comp, idx) => {
              const segColor = comp.color || PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length];
              const animatedPct = comp.percentage * animProgress;
              const segLength = Math.max(0, (animatedPct / 100) * circumference - 2);
              const strokeDasharray = `${segLength} ${circumference}`;
              const strokeDashoffset =
                -((cumulativePercent * animProgress) / 100) * circumference;
              cumulativePercent += comp.percentage;
              const isSelected = activeIndex === idx;

              return (
                <circle
                  key={comp.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={segColor}
                  strokeWidth={isSelected ? strokeWidth + 5 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer transition-[stroke-width,opacity] duration-200"
                  style={{
                    opacity:
                      activeIndex === null || activeIndex === idx ? 1 : 0.35,
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() =>
                    setActiveIndex(activeIndex === idx ? null : idx)
                  }
                />
              );
            })}
          </svg>

          {/* Center Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-7 pointer-events-none">
            {activeItem ? (
              <>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#475569]">
                  Komponen 0{(activeIndex ?? 0) + 1}
                </span>
                <span className="font-mono text-2xl font-extrabold text-[#1E293B] tabular-nums mt-0.5">
                  {activeItem.percentage}%
                </span>
                <span className="text-xs font-semibold text-[#475569] leading-snug mt-0.5 line-clamp-2">
                  {activeItem.label}
                </span>
                <span className="font-mono text-xs font-bold text-[#2E6496] mt-1 tabular-nums">
                  {formatRupiah(activeItem.amount)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#475569]">
                  Total Pagu
                </span>
                <span className="font-mono text-xl font-extrabold text-[#1E293B] mt-0.5 tabular-nums">
                  100%
                </span>
                <span className="font-mono text-xs font-bold text-[#2E6496] mt-1 tabular-nums">
                  {formatRupiah(totalAmount)}
                </span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-[#475569] mt-2 text-center">
          Pilih segmen atau rincian untuk menyorot alokasi
        </p>
      </div>

      {/* Right Column: Clean Interactive Allocation Breakdown */}
      <div className="md:col-span-7 space-y-2.5">
        {compositions.map((comp, idx) => {
          const isSelected = activeIndex === idx;
          const segColor = PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length];
          return (
            <button
              key={comp.id}
              type="button"
              aria-pressed={isSelected}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(idx)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6496] cursor-pointer ${
                isSelected
                  ? 'bg-[#FAF8F5] border-[#2E6496] shadow-xs'
                  : 'bg-[#FFFFFF] border-[#C9DFDC] hover:bg-[#FAF8F5]/70 hover:border-[#66A3BF]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-[#FFFFFF] shrink-0 tabular-nums"
                    style={{ backgroundColor: segColor }}
                  >
                    0{idx + 1}
                  </span>
                  <span className="text-sm font-bold text-[#1E293B] truncate">
                    {comp.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] font-mono text-xs font-semibold text-[#2E6496] tabular-nums shrink-0">
                    {comp.percentage}%
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-[#1E293B] tabular-nums whitespace-nowrap">
                  {formatRupiah(comp.amount)}
                </span>
              </div>

              {/* Animated Proportional Bar */}
              <div className="w-full h-2 bg-[#FAF8F5] border border-[#C9DFDC] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-150"
                  style={{
                    width: `${comp.percentage * animProgress}%`,
                    backgroundColor: segColor,
                  }}
                />
              </div>

              <p className="text-xs text-[#475569] leading-relaxed">
                {comp.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
