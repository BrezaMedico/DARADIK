import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BudgetComposition, formatRupiah } from '../data/schoolsData';

interface DonutChartProps {
  compositions: BudgetComposition[];
  totalAmount: number;
}

const SEGMENT_COLORS = ['#2E6496', '#528AB4', '#8CBCCF', '#C9DFDC'];

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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
      {/* LEFT 5 COLS: Full 360° Circle Donut Chart with Modern Dashboard Card Styling */}
      <div className="md:col-span-5 flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl bg-[#FAF8F5]/75 border border-[#C9DFDC]/80">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center select-none">
          <svg
            viewBox="0 0 240 240"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="Grafik lingkaran proporsi penggunaan dana BOSP"
          >
            {/* Subtle Background Ring Track */}
            <circle
              cx="120"
              cy="120"
              r="81"
              fill="none"
              stroke="#EBF3F8"
              strokeWidth="28"
            />

            {slices.map((slice) => {
              const isSelected = activeIndex === slice.idx;
              const isDimmed = activeIndex !== null && !isSelected;

              const offsetDistance = isSelected ? 4 : 0;
              const offsetRad = ((slice.midAngle - 90) * Math.PI) / 180;
              const dx = Math.cos(offsetRad) * offsetDistance;
              const dy = Math.sin(offsetRad) * offsetDistance;

              const outerR = isSelected ? 100 : 95;
              const innerR = 66;

              const d = createAnnularWedgePath(
                120,
                120,
                outerR,
                innerR,
                slice.startAngle,
                slice.endAngle
              );

              return (
                <g
                  key={slice.id}
                  style={{
                    transform: `translate(${dx}px, ${dy}px)`,
                    transition:
                      'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
                    opacity: isDimmed ? 0.38 : 1,
                  }}
                  onMouseEnter={() => setActiveIndex(slice.idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() =>
                    setActiveIndex(activeIndex === slice.idx ? null : slice.idx)
                  }
                  className="cursor-pointer outline-none"
                >
                  <path
                    d={d}
                    fill={slice.color}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    style={{
                      filter: isSelected
                        ? 'drop-shadow(0 6px 12px rgba(46, 100, 150, 0.24))'
                        : 'none',
                    }}
                  />
                </g>
              );
            })}

            {/* Inner Soft Circle */}
            <circle
              cx="120"
              cy="120"
              r="59"
              fill="#FFFFFF"
              stroke="#C9DFDC"
              strokeWidth="1"
            />
          </svg>

          {/* Center Readout Inside Circle Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-7">
            {activeItem ? (
              <div className="animate-school-header flex flex-col items-center">
                <span className="px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-extrabold text-[#2E6496] tabular-nums">
                  {activeItem.percentage}% Porsi
                </span>
                <span className="text-[11px] font-bold text-[#1E293B] leading-tight line-clamp-2 mt-1 max-w-[112px]">
                  {activeItem.label}
                </span>
                <span className="text-xs font-extrabold text-[#2E6496] mt-1 tabular-nums">
                  {formatShortRupiah(activeItem.amount)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[#64748B] font-semibold">
                  Total Pagu
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-[#1E293B] mt-0.5 tabular-nums tracking-tight">
                  {formatShortRupiah(Math.round(totalAmount * animProgress))}
                </span>
                <span className="inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[10px] font-bold text-[#2E6496]">
                  <span>100% RKAS</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Mini Summary Pills Under Circle */}
        <div className="w-full grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#C9DFDC]/60">
          <div className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC]/70 flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-medium text-[#64748B]">
              Pos RKAS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#1E293B] text-[#FFFFFF] text-[10px] font-bold tabular-nums">
              {compositions.length} Komponen
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC]/70 flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-medium text-[#64748B]">
              Alokasi
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#2E6496] text-[#FFFFFF] text-[10px] font-bold tabular-nums">
              100% Aktif
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT 7 COLS: 3 Interactive RKAS Component Breakdown Cards (Modern Dashboard Style) */}
      <div className="md:col-span-7 space-y-3">
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
              className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-[#EBF3F8]/60 border-[#2E6496] shadow-xs'
                  : 'bg-[#FAF8F5]/65 border-[#C9DFDC]/80 hover:border-[#66A3BF] hover:bg-[#FFFFFF]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#FFFFFF] text-xs font-extrabold shrink-0 shadow-xs tabular-nums"
                    style={{ backgroundColor: comp.color }}
                  >
                    {comp.percentage}%
                  </div>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-[#1E293B] tracking-tight leading-snug">
                    {comp.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto pl-9 sm:pl-0 shrink-0 tabular-nums">
                  <span className="text-xs sm:text-sm md:text-base font-extrabold text-[#1E293B]">
                    {formatRupiah(Math.round(comp.amount * animProgress))}
                  </span>
                </div>
              </div>

              <p className="mt-2.5 text-xs text-[#64748B] leading-relaxed">
                {comp.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
