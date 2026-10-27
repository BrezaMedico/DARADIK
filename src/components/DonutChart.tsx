import React, { useState } from 'react';
import { BudgetComposition, formatRupiah } from '../data/schoolsData';

interface DonutChartProps {
  compositions: BudgetComposition[];
  totalAmount: number;
}

export const InteractiveDonutChart: React.FC<DonutChartProps> = ({
  compositions,
  totalAmount,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const size = 220;
  const strokeWidth = 28;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const activeItem =
    activeIndex !== null ? compositions[activeIndex] : null;

  return (
    <div className="flex flex-col items-center">
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          role="img"
          aria-label="Grafik Lingkaran Komposisi Penggunaan Dana BOSP"
        >
          {/* Base Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F4F1EA"
            strokeWidth={strokeWidth}
          />
          {compositions.map((comp, idx) => {
            const strokeDasharray = `${
              (comp.percentage / 100) * circumference
            } ${circumference}`;
            const strokeDashoffset = -(cumulativePercent / 100) * circumference;
            cumulativePercent += comp.percentage;
            const isSelected = activeIndex === idx;

            return (
              <circle
                key={comp.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={comp.color}
                strokeWidth={isSelected ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="cursor-pointer transition-all duration-150"
                style={{
                  opacity:
                    activeIndex === null || activeIndex === idx ? 1 : 0.45,
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          {activeItem ? (
            <>
              <span className="font-mono text-2xl font-bold text-[#1E293B] tabular-nums">
                {activeItem.percentage}%
              </span>
              <span className="text-[11px] font-semibold text-[#475569] leading-tight mt-0.5 line-clamp-2">
                {activeItem.label}
              </span>
              <span className="font-mono text-xs font-bold text-[#2E6496] mt-1 tabular-nums">
                {formatRupiah(activeItem.amount)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#475569]">
                TOTAL REALISASI
              </span>
              <span className="font-mono text-base font-bold text-[#1E293B] mt-0.5 tabular-nums">
                100% PAGU
              </span>
              <span className="font-mono text-xs font-semibold text-[#2E6496] mt-0.5 tabular-nums">
                {formatRupiah(totalAmount)}
              </span>
            </>
          )}
        </div>
      </div>

      <p className="text-xs font-mono text-[#475569] mt-2">
        Arahkan kursor atau klik segmen grafik untuk melihat rincian alokasi
      </p>

      {/* Clean Legend with Hairline Dividers */}
      <div className="w-full mt-5 border border-[#E4E0D8] rounded-md divide-y divide-[#E4E0D8] bg-[#FFFFFF]">
        {compositions.map((comp, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={comp.id}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
              className={`w-full text-left p-3.5 transition-colors duration-150 flex flex-col gap-1.5 ${
                isSelected ? 'bg-[#FAF8F5]' : 'bg-[#FFFFFF] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: comp.color }}
                  />
                  <span className="text-sm font-bold text-[#1E293B]">
                    {comp.label}{' '}
                    <span className="font-mono text-xs font-semibold text-[#475569] tabular-nums">
                      ({comp.percentage}%)
                    </span>
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-[#1E293B] tabular-nums whitespace-nowrap">
                  {formatRupiah(comp.amount)}
                </span>
              </div>

              {/* Proportional Bar */}
              <div className="w-full h-1.5 bg-[#F4F1EA] rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${comp.percentage}%`,
                    backgroundColor: comp.color,
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
