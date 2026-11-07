import React, { useMemo } from 'react';

export interface HeroMousePosition {
  x: number;
  y: number;
  active: boolean;
  normX: number;
  normY: number;
}

interface HeroAmbientBackgroundProps {
  mousePos: HeroMousePosition;
}

const GRID_CELL_SIZE = 42;
const GRID_CELL_VARIANTS = [
  'grid-cell-v1',
  'grid-cell-v2',
  'grid-cell-v3',
  'grid-cell-v4',
] as const;

interface AmbientGridCell {
  col: number;
  row: number;
  variant: (typeof GRID_CELL_VARIANTS)[number];
  animClass: 'grid-cell-anim-a' | 'grid-cell-anim-b';
  delay: string;
}

const AMBIENT_GRID_GLASS_CELLS: AmbientGridCell[] = [
  { col: 2, row: 2, variant: 'grid-cell-v1', animClass: 'grid-cell-anim-a', delay: '0s' },
  { col: 5, row: 3, variant: 'grid-cell-v2', animClass: 'grid-cell-anim-b', delay: '-1.4s' },
  { col: 3, row: 6, variant: 'grid-cell-v3', animClass: 'grid-cell-anim-a', delay: '-2.8s' },
  { col: 7, row: 5, variant: 'grid-cell-v4', animClass: 'grid-cell-anim-b', delay: '-0.7s' },
  { col: 4, row: 10, variant: 'grid-cell-v2', animClass: 'grid-cell-anim-a', delay: '-3.5s' },
  { col: 9, row: 2, variant: 'grid-cell-v3', animClass: 'grid-cell-anim-b', delay: '-2.1s' },
  { col: 12, row: 4, variant: 'grid-cell-v1', animClass: 'grid-cell-anim-a', delay: '-4.2s' },
  { col: 15, row: 3, variant: 'grid-cell-v4', animClass: 'grid-cell-anim-b', delay: '-1.1s' },
  { col: 18, row: 2, variant: 'grid-cell-v2', animClass: 'grid-cell-anim-a', delay: '-3.0s' },
  { col: 21, row: 4, variant: 'grid-cell-v1', animClass: 'grid-cell-anim-b', delay: '-0.5s' },
  { col: 24, row: 3, variant: 'grid-cell-v3', animClass: 'grid-cell-anim-a', delay: '-2.4s' },
  { col: 19, row: 7, variant: 'grid-cell-v4', animClass: 'grid-cell-anim-b', delay: '-4.6s' },
  { col: 23, row: 8, variant: 'grid-cell-v1', animClass: 'grid-cell-anim-a', delay: '-1.8s' },
  { col: 16, row: 11, variant: 'grid-cell-v2', animClass: 'grid-cell-anim-b', delay: '-3.3s' },
  { col: 26, row: 6, variant: 'grid-cell-v3', animClass: 'grid-cell-anim-a', delay: '-0.9s' },
  { col: 28, row: 10, variant: 'grid-cell-v4', animClass: 'grid-cell-anim-b', delay: '-2.7s' },
  { col: 8, row: 12, variant: 'grid-cell-v1', animClass: 'grid-cell-anim-a', delay: '-1.5s' },
  { col: 21, row: 12, variant: 'grid-cell-v2', animClass: 'grid-cell-anim-b', delay: '-3.8s' },
];

export const HeroAmbientBackground: React.FC<HeroAmbientBackgroundProps> = ({
  mousePos,
}) => {
  const hoveredGridCells = useMemo(() => {
    if (!mousePos.active) return [];
    const centerCol = Math.floor(mousePos.x / GRID_CELL_SIZE);
    const centerRow = Math.floor(mousePos.y / GRID_CELL_SIZE);
    const cells: {
      key: string;
      col: number;
      row: number;
      intensity: number;
      variant: (typeof GRID_CELL_VARIANTS)[number];
    }[] = [];

    const radius = 175;
    for (let dRow = -4; dRow <= 4; dRow++) {
      for (let dCol = -4; dCol <= 4; dCol++) {
        const col = centerCol + dCol;
        const row = centerRow + dRow;
        if (col < 0 || row < 0) continue;

        const cellCenterX = col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
        const cellCenterY = row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
        const dist = Math.hypot(
          mousePos.x - cellCenterX,
          mousePos.y - cellCenterY
        );

        if (dist < radius) {
          const raw = 1 - dist / radius;
          const intensity = Math.pow(raw, 1.35);
          const variantIdx = Math.abs(col * 7 + row * 13) % 4;
          cells.push({
            key: `${col}-${row}`,
            col,
            row,
            intensity,
            variant: GRID_CELL_VARIANTS[variantIdx],
          });
        }
      }
    }
    return cells;
  }, [mousePos.active, mousePos.x, mousePos.y]);

  return (
    <>
      <div
        className="absolute inset-0 daradik-grid-base pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {AMBIENT_GRID_GLASS_CELLS.map((cell, idx) => (
          <div
            key={idx}
            className={`absolute grid-glass-cell ${cell.variant} ${cell.animClass}`}
            style={{
              left: `${cell.col * GRID_CELL_SIZE}px`,
              top: `${cell.row * GRID_CELL_SIZE}px`,
              animationDelay: cell.delay,
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                'inset 0 1px 1px rgba(255, 255, 255, 0.28), inset 1px 0 1px rgba(255, 255, 255, 0.12)',
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {hoveredGridCells.map((cell) => {
          const borderAlpha = (0.12 + cell.intensity * 0.36).toFixed(2);
          const topGloss = (0.18 + cell.intensity * 0.48).toFixed(2);
          const leftGloss = (0.1 + cell.intensity * 0.28).toFixed(2);
          return (
            <div
              key={cell.key}
              className={`absolute grid-glass-cell ${cell.variant}`}
              style={{
                left: `${cell.col * GRID_CELL_SIZE}px`,
                top: `${cell.row * GRID_CELL_SIZE}px`,
                opacity: Number((cell.intensity * 0.85).toFixed(2)),
                border: `1px solid rgba(255, 255, 255, ${borderAlpha})`,
                boxShadow: `inset 0 1px 1.5px rgba(255, 255, 255, ${topGloss}), inset 1px 0 1px rgba(255, 255, 255, ${leftGloss})`,
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute -left-10 lg:-left-16 top-8 sm:top-10 lg:top-14 w-52 h-36 sm:w-64 sm:h-44 rounded-2xl border-[1.5px] border-white/30 -rotate-6 pointer-events-none transition-transform duration-700 ease-out hidden sm:block"
        style={{
          transform: mousePos.active
            ? `rotate(-6deg) translate3d(${mousePos.normX * -10}px, ${mousePos.normY * -10}px, 0)`
            : 'rotate(-6deg)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute left-6 lg:left-14 top-48 sm:top-52 lg:top-56 w-36 h-24 sm:w-44 sm:h-28 rounded-xl border-[1.5px] border-white/20 rotate-12 pointer-events-none hidden md:block"
        style={{
          transform: mousePos.active
            ? `rotate(12deg) translate3d(${mousePos.normX * 8}px, ${mousePos.normY * 8}px, 0)`
            : 'rotate(12deg)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -left-8 sm:left-2 top-[52%] w-40 h-28 sm:w-48 sm:h-32 rounded-2xl border-[1.5px] border-white/15 -rotate-3 pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute -right-10 lg:-right-14 top-[56%] lg:top-[52%] w-52 h-36 sm:w-64 sm:h-44 rounded-2xl border-[1.5px] border-white/30 rotate-6 pointer-events-none transition-transform duration-700 ease-out hidden sm:block"
        style={{
          transform: mousePos.active
            ? `rotate(6deg) translate3d(${mousePos.normX * 12}px, ${mousePos.normY * 12}px, 0)`
            : 'rotate(6deg)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute right-8 lg:right-16 bottom-36 lg:bottom-40 w-40 h-24 sm:w-48 sm:h-32 rounded-xl border-[1.5px] border-white/20 -rotate-12 pointer-events-none hidden md:block"
        style={{
          transform: mousePos.active
            ? `rotate(-12deg) translate3d(${mousePos.normX * -8}px, ${mousePos.normY * -8}px, 0)`
            : 'rotate(-12deg)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -right-6 sm:right-6 bottom-10 lg:bottom-12 w-36 h-24 sm:w-44 sm:h-28 rounded-2xl border-[1.5px] border-white/15 rotate-3 pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 daradik-grid-spotlight pointer-events-none transition-opacity duration-200"
        style={{
          opacity: mousePos.active ? 1 : 0,
          maskImage: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{
          opacity: mousePos.active ? 1 : 0,
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.08), transparent 75%)`,
        }}
        aria-hidden="true"
      />
    </>
  );
};
