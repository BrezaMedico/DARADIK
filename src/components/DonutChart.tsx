import React, { useState, useEffect, useMemo } from 'react';
import { BudgetComposition, formatRupiah } from '../data/schoolsData';

interface DonutChartProps {
  compositions: BudgetComposition[];
  totalAmount: number;
}

const PALETTE_FALLBACKS = ['#2E6496', '#66A3BF', '#90B6C8', '#4A7C99'];

/**
 * Calculates cartesian coordinates from polar angle (in radians) and radius.
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Generates an SVG Annular Wedge path (donut segment) from startAngle to endAngle.
 * Angles in radians, starting from -PI/2 (12 o'clock).
 */
function createAnnularWedgePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
  gapAngle: number = 0.02
): string {
  // Apply a small gap between segments for crisp separation
  const effectiveStart = startAngle + gapAngle;
  const effectiveEnd = endAngle - gapAngle;

  if (effectiveEnd <= effectiveStart) {
    return '';
  }

  const p1 = polarToCartesian(cx, cy, outerRadius, effectiveStart);
  const p2 = polarToCartesian(cx, cy, outerRadius, effectiveEnd);
  const p3 = polarToCartesian(cx, cy, innerRadius, effectiveEnd);
  const p4 = polarToCartesian(cx, cy, innerRadius, effectiveStart);

  const angleDelta = effectiveEnd - effectiveStart;
  const largeArcFlag = angleDelta > Math.PI ? 1 : 0;

  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
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
    const duration = 650;
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

  // Geometry dimensions
  const viewBoxSize = 260;
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const baseOuterRadius = 112;
  const activeOuterRadius = 118;
  const innerRadius = 76; // Inner diameter 152px -> spacious center hole

  // Compute exact non-overlapping angles for each segment
  const segmentAngles = useMemo(() => {
    let currentAngle = -Math.PI / 2; // Start from 12 o'clock
    const totalPercentage = compositions.reduce((sum, c) => sum + c.percentage, 0) || 100;

    return compositions.map((comp) => {
      const fraction = comp.percentage / totalPercentage;
      const angleSweep = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSweep;
      const midAngle = startAngle + angleSweep / 2;
      currentAngle = endAngle;

      return {
        comp,
        startAngle,
        endAngle,
        midAngle,
        fraction,
      };
    });
  }, [compositions]);

  const activeItem = activeIndex !== null ? compositions[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
      {/* Left Column: Mathematically Exact Donut Chart */}
      <div className="md:col-span-5 flex flex-col items-center justify-center">
        <div className="relative w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] flex items-center justify-center select-none">
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="Grafik donat alokasi komponen anggaran BOSP"
          >
            {/* Background Base Ring */}
            <circle
              cx={cx}
              cy={cy}
              r={(baseOuterRadius + innerRadius) / 2}
              fill="none"
              stroke="#EBF3F8"
              strokeWidth={baseOuterRadius - innerRadius}
              className="opacity-60"
            />

            {/* True Geometric Annular Wedge Paths (Disjoint Polygons, Zero Click Interception Conflicts) */}
            {segmentAngles.map((seg, idx) => {
              const isSelected = activeIndex === idx;
              const isDimmed = activeIndex !== null && !isSelected;
              const segColor = seg.comp.color || PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length];

              // Animate sweep smoothly from 0 to full angle
              const animatedSweep = (seg.endAngle - seg.startAngle) * animProgress;
              const animatedEnd = seg.startAngle + animatedSweep;

              const outerR = isSelected ? activeOuterRadius : baseOuterRadius;
              const pathD = createAnnularWedgePath(
                cx,
                cy,
                outerR,
                innerRadius,
                seg.startAngle,
                animatedEnd,
                compositions.length > 1 ? 0.025 : 0
              );

              if (!pathD) return null;

              return (
                <path
                  key={seg.comp.id}
                  d={pathD}
                  fill={segColor}
                  tabIndex={0}
                  role="button"
                  aria-label={`${seg.comp.label}: ${seg.comp.percentage}% (${formatRupiah(seg.comp.amount)})`}
                  aria-pressed={isSelected}
                  className="cursor-pointer transition-[opacity,transform,filter] duration-200 outline-none focus-visible:opacity-100"
                  style={{
                    opacity: isDimmed ? 0.32 : 1,
                    filter: isSelected ? 'drop-shadow(0 4px 8px rgba(46, 100, 150, 0.28))' : 'none',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIndex(activeIndex === idx ? null : idx);
                    }
                  }}
                />
              );
            })}
          </svg>

          {/* Center Readout Overlay: Guaranteed Centered, No Text Clipping, Pointer Events Disabled */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-5"
            style={{ width: '100%', height: '100%' }}
          >
            <div className="w-[128px] max-w-[136px] flex flex-col items-center justify-center overflow-hidden">
              {activeItem ? (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#475569] font-bold">
                    Komponen 0{(activeIndex ?? 0) + 1}
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-[#1E293B] tabular-nums mt-0.5 leading-none">
                    {activeItem.percentage}%
                  </span>
                  <span className="text-[11px] font-semibold text-[#475569] leading-tight line-clamp-2 mt-1 px-1 max-w-[124px]">
                    {activeItem.label}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#2E6496] mt-0.5 tabular-nums">
                    {formatRupiah(activeItem.amount)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#475569] font-bold">
                    Total Realisasi
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-[#2E6496] tabular-nums mt-0.5 leading-none">
                    100%
                  </span>
                  <span className="text-[11px] font-medium text-[#475569] mt-0.5">
                    Dana Pagu BOSP
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1E293B] mt-0.5 tabular-nums">
                    {formatRupiah(totalAmount)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#475569] mt-2.5 text-center">
          Pilih segmen atau daftar rincian untuk menyorot alokasi
        </p>
      </div>

      {/* Right Column: Clean Interactive Allocation Breakdown */}
      <div className="md:col-span-7 space-y-2.5">
        {compositions.map((comp, idx) => {
          const isSelected = activeIndex === idx;
          const segColor = comp.color || PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length];
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
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6496] cursor-pointer ${
                isSelected
                  ? 'bg-[#FAF8F5] border-[#2E6496] shadow-xs translate-x-1'
                  : 'bg-[#FFFFFF] border-[#C9DFDC] hover:bg-[#FAF8F5]/70 hover:border-[#66A3BF]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-[#FFFFFF] shrink-0 tabular-nums shadow-xs"
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
