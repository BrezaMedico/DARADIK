import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BudgetComposition } from '@/types/school';
import { formatRupiah } from '@/utils';

interface DonutChartProps {
  compositions: BudgetComposition[];
  totalAmount: number;
  centerSubtitle?: string;
  badgeLabel?: string;
}

const SEGMENT_COLORS = ['#2E6496', '#4B83B1', '#66A3BF', '#8CBCCF', '#A7D0DC'];

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function createAnnularWedgePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const clampedEnd =
    endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;

  const startOuter = polarToCartesian(cx, cy, outerRadius, clampedEnd);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, clampedEnd);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    'L',
    endInner.x,
    endInner.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    startInner.x,
    startInner.y,
    'Z',
  ].join(' ');
}

function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `Rp ${Number.isInteger(jt) ? jt : jt.toFixed(2).replace('.', ',')} Jt`;
  }
  return formatRupiah(amount);
}

export const InteractiveDonutChart: React.FC<DonutChartProps> = ({
  compositions,
  totalAmount,
  centerSubtitle = 'Total Pagu',
  badgeLabel = '100% RKAS',
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasMoreToScroll, setHasMoreToScroll] = useState<boolean>(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      setHasMoreToScroll(scrollTop + clientHeight < scrollHeight - 12);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 150);
    return () => clearTimeout(timer);
  }, [compositions]);

  const handleScrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 110, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setActiveIndex(null);
  }, [compositions]);

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

  let currentAngle = 0;
  const gapDegrees = 2.4;

  const slices = compositions.map((comp, idx) => {
    const fullSweep = (comp.percentage / 100) * 360;
    const sweepAngle = Math.max(fullSweep - gapDegrees, 1) * animProgress;
    const startAngle = currentAngle + gapDegrees / 2;
    const endAngle = startAngle + sweepAngle;
    const midAngle = startAngle + sweepAngle / 2;
    currentAngle += fullSweep;

    return {
      ...comp,
      idx,
      color: comp.color || SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
      startAngle,
      endAngle,
      midAngle,
    };
  });

  const activeItem = activeIndex !== null ? slices[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* LEFT 5 COLS: Full 360° Circle Donut Chart */}
      <div className="md:col-span-5 flex flex-col items-center">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg
            viewBox="0 0 280 280"
            className="w-full h-full transform transition-transform duration-300"
          >
            <circle
              cx="140"
              cy="140"
              r="105"
              fill="none"
              stroke="#FAF8F5"
              strokeWidth="38"
            />

            {slices.map((slice) => {
              const isSelected = activeIndex === slice.idx;
              const pathD = createAnnularWedgePath(
                140,
                140,
                isSelected ? 128 : 124,
                isSelected ? 82 : 86,
                slice.startAngle,
                slice.endAngle
              );

              return (
                <path
                  key={slice.id}
                  d={pathD}
                  fill={slice.color}
                  opacity={
                    activeIndex === null || activeIndex === slice.idx ? 1 : 0.4
                  }
                  onMouseEnter={() => setActiveIndex(slice.idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() =>
                    setActiveIndex(activeIndex === slice.idx ? null : slice.idx)
                  }
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    filter: isSelected
                      ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))'
                      : 'none',
                  }}
                />
              );
            })}
          </svg>

          {/* Central Summary Data Ring Inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            {activeItem ? (
              <div className="animate-school-item">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#64748B] block truncate max-w-[130px]">
                  {activeItem.label}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tabular-nums block font-mono mt-0.5">
                  {activeItem.percentage}%
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#2E6496] tabular-nums block mt-0.5">
                  {formatShortRupiah(activeItem.amount)}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  {centerSubtitle}
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-[#1E293B] tabular-nums block font-mono mt-0.5">
                  {formatShortRupiah(totalAmount)}
                </span>
                {badgeLabel && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[10px] font-bold text-[#2E6496]">
                    {badgeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-[#64748B] text-center mt-2">
          Klik bagian lingkaran untuk melihat rincian tiap komponen
        </p>
      </div>

      {/* RIGHT 7 COLS: Clean, Scrollable List */}
      <div className="md:col-span-7 flex flex-col justify-start relative">
        <div className="flex items-center justify-between text-[11px] text-[#64748B] font-medium mb-1.5 px-0.5">
          <span>{slices.length} Komponen Penggunaan</span>
          <span className="hidden md:inline text-[#2E6496] font-semibold">Dapat digulir / scroll</span>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="max-h-none overflow-visible md:max-h-[305px] md:overflow-y-auto md:pr-1.5 space-y-2.5 sm:space-y-2 school-custom-scroll md:pb-6"
        >
          {slices.map((comp) => {
            const isSelected = activeIndex === comp.idx;
            return (
              <div
                key={comp.id}
                onMouseEnter={() => setActiveIndex(comp.idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() =>
                  setActiveIndex(activeIndex === comp.idx ? null : comp.idx)
                }
                className={`p-3 sm:p-3.5 rounded-xl border transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EBF3F8]/50 border-[#2E6496]'
                    : 'bg-[#FFFFFF] border-[#C9DFDC]/80 hover:border-[#66A3BF]'
                }`}
              >
                <div className="sm:hidden space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[#FFFFFF] text-xs font-extrabold shrink-0 tabular-nums"
                      style={{ backgroundColor: comp.color }}
                    >
                      {comp.percentage}%
                    </span>
                    <span className="text-xs font-mono font-extrabold text-[#1E293B] tabular-nums">
                      {formatRupiah(Math.round(comp.amount * animProgress))}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E293B] leading-snug">
                      {comp.label}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-[#64748B] leading-relaxed">
                      {comp.description}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="px-2 py-0.5 rounded-md text-[#FFFFFF] text-xs font-extrabold shrink-0 tabular-nums mt-0.5"
                      style={{ backgroundColor: comp.color }}
                    >
                      {comp.percentage}%
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1E293B] leading-snug">
                        {comp.label}
                      </h4>
                      <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                        {comp.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 tabular-nums">
                    <span className="text-sm font-extrabold text-[#1E293B] block">
                      {formatRupiah(Math.round(comp.amount * animProgress))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasMoreToScroll && (
          <button
            type="button"
            onClick={handleScrollDown}
            className="hidden md:flex absolute bottom-0 left-0 right-1.5 pt-5 pb-1 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/90 to-transparent items-center justify-center gap-1 text-[11px] font-bold text-[#2E6496] hover:text-[#1E293B] cursor-pointer transition-colors z-10"
          >
            <span>Gulir ke bawah untuk rincian lainnya</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        )}
      </div>
    </div>
  );
};

