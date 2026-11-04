import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  AlertCircle,
  X,
  BookOpen,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Play,
  ExternalLink,
} from 'lucide-react';
import {
  REGION_HIERARCHY,
  SCHOOLS_DATABASE,
  SMK_TI_BAZMA,
  SchoolData,
} from '../data/schoolsData';
import { Phone3DCanvas } from './Phone3DCanvas';

interface ScrollRevealOnceProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Triggers the entrance animation (blur + rise + zoom-in) ONLY ONCE when scrolled into view.
 * Slower, gentle duration (~1150ms) and never re-animates once revealed.
 */
const ScrollRevealOnce: React.FC<ScrollRevealOnceProps> = ({
  children,
  className = '',
  delayMs = 0,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        animationDelay: `${delayMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
      className={`scroll-reveal-once ${
        isVisible ? 'scroll-reveal-visible' : 'scroll-reveal-hidden'
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface LandingPageProps {
  selectedSchool: SchoolData;
  onSelectSchoolAndOpenProfile: (
    school: SchoolData,
    initialTab?: 'summary' | 'items-ai' | 'wa-scanner'
  ) => void;
  onOpenAnonymousReport: () => void;
  onOpenLiveTracking: () => void;
  onOpenKamusModal: () => void;
  isIntroActive?: boolean;
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

// Kotak-kotak kecil (42x42px) pada grid background yang bergerak/berkilau halus secara mandiri
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

export const LandingPage: React.FC<LandingPageProps> = ({
  selectedSchool,
  onSelectSchoolAndOpenProfile,
  onOpenAnonymousReport,
  onOpenLiveTracking,
  onOpenKamusModal,
  isIntroActive = false,
}) => {
  // Interactive Mouse-Following Grid & 3D Phone Parallax State
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [mousePos, setMousePos] = useState<{
    x: number;
    y: number;
    active: boolean;
    normX: number;
    normY: number;
  }>({
    x: 500,
    y: 320,
    active: false,
    normX: 0,
    normY: 0,
  });

  // Search Box States — EMPTY by default
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chosenSchool, setChosenSchool] = useState<SchoolData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState<boolean>(false);

  // Region Filters
  const [provinsi, setProvinsi] = useState<string>('');
  const [kabupaten, setKabupaten] = useState<string>('');
  const [kecamatan, setKecamatan] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Progressive disclosure ("Lihat Selengkapnya") for bottom summary
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);

  // Intro Video Player State (YouTube: u_KJPfVgRUE)
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  useEffect(() => {
    // Pastikan selalu mulai dari paling atas layar saat landing page dimuat/refresh
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroSectionRef.current) return;
    const rect = heroSectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized coordinates from -1 to 1 for 3D parallax
    const normX = (x - rect.width / 2) / (rect.width / 2);
    const normY = (y - rect.height / 2) / (rect.height / 2);

    setMousePos({
      x,
      y,
      active: true,
      normX: Math.max(-1, Math.min(1, normX)),
      normY: Math.max(-1, Math.min(1, normY)),
    });
  };

  const handleHeroMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false, normX: 0, normY: 0 }));
  };

  const kabupatenOptions = useMemo(() => {
    if (!provinsi || !REGION_HIERARCHY[provinsi]) return [];
    return Object.keys(REGION_HIERARCHY[provinsi]);
  }, [provinsi]);

  const kecamatanOptions = useMemo(() => {
    if (
      !provinsi ||
      !kabupaten ||
      !REGION_HIERARCHY[provinsi] ||
      !REGION_HIERARCHY[provinsi][kabupaten]
    ) {
      return [];
    }
    return REGION_HIERARCHY[provinsi][kabupaten];
  }, [provinsi, kabupaten]);

  const handleProvinsiChange = (newProv: string) => {
    setProvinsi(newProv);
    setKabupaten('');
    setKecamatan('');
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const handleKabupatenChange = (newKab: string) => {
    setKabupaten(newKab);
    setKecamatan('');
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const handleKecamatanChange = (newKec: string) => {
    setKecamatan(newKec);
    setValidationError(null);
    setIsDropdownOpen(true);
  };

  const filteredSchools = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    // Jika input sama persis dengan format pilihan sekolah saat ini, anggap belum mengetik kueri baru
    const isFormattedSelection =
      chosenSchool &&
      rawQuery ===
        `${chosenSchool.name} (npsn: ${chosenSchool.npsn})`.toLowerCase();
    const q = isFormattedSelection ? '' : rawQuery;

    // Ketika input search ditekan tanpa mengetik huruf/kata dan tanpa filter wilayah:
    // HANYA tampilkan SMK TI BAZMA saja
    if (!q && !provinsi && !kabupaten && !kecamatan) {
      return [SMK_TI_BAZMA];
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    const scored: { school: SchoolData; score: number }[] = [];

    for (const s of SCHOOLS_DATABASE) {
      if (provinsi && s.provinsi !== provinsi) continue;
      if (kabupaten && s.kabupaten !== kabupaten) continue;
      if (kecamatan && s.kecamatan !== kecamatan) continue;

      if (!q) {
        scored.push({
          school: s,
          score: s.id === SMK_TI_BAZMA.id ? 1000 : 10,
        });
        continue;
      }

      const nameLower = s.name.toLowerCase();
      const npsnLower = s.npsn.toLowerCase();
      const kecLower = s.kecamatan.toLowerCase();
      const kabLower = s.kabupaten.toLowerCase();
      const combined = `${nameLower} ${npsnLower} ${kecLower} ${kabLower}`;

      let score = 0;

      if (nameLower === q || npsnLower === q) {
        score += 200;
      } else if (nameLower.startsWith(q) || npsnLower.startsWith(q)) {
        score += 140;
      } else if (nameLower.includes(q) || npsnLower.includes(q)) {
        score += 100;
      } else if (kecLower.includes(q) || kabLower.includes(q)) {
        score += 75;
      }

      // Pencocokan kata per kata (tokens)
      if (tokens.length > 0) {
        let matchedTokens = 0;
        for (const tk of tokens) {
          if (combined.includes(tk)) {
            matchedTokens++;
            score += 30;
          }
        }
        if (matchedTokens === tokens.length) {
          score += 45;
        }
      }

      // Pencocokan huruf-huruf yang mendekati (subsequence / kemiripan karakter)
      if (score === 0 && q.length >= 2) {
        let qIdx = 0;
        for (let i = 0; i < nameLower.length && qIdx < q.length; i++) {
          if (nameLower[i] === q[qIdx]) qIdx++;
        }
        const ratio = qIdx / q.length;
        if (ratio >= 0.75) {
          score += Math.round(ratio * 35);
        }
      }

      if (score > 0) {
        if (s.id === SMK_TI_BAZMA.id) score += 500;
        scored.push({ school: s, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((item) => item.school);
  }, [provinsi, kabupaten, kecamatan, searchQuery, chosenSchool]);

  const handleSelectSchool = (school: SchoolData) => {
    setChosenSchool(school);
    setSearchQuery(`${school.name} (NPSN: ${school.npsn})`);
    setIsDropdownOpen(false);
    setValidationError(null);
  };

  const handleClearSearch = () => {
    setChosenSchool(null);
    setSearchQuery('');
    setValidationError(null);
    setIsDropdownOpen(true);
    searchInputRef.current?.focus();
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const target = chosenSchool || filteredSchools[0] || SMK_TI_BAZMA;
    onSelectSchoolAndOpenProfile(target, 'summary');
  };

  // Subtle 3D Parallax Tilt Values (sedikit saja efeknya)
  const phoneRotateY = (mousePos.normX * 6.5).toFixed(2);
  const phoneRotateX = (-mousePos.normY * 5.5).toFixed(2);
  const phoneTranslateX = (mousePos.normX * 8).toFixed(1);
  const phoneTranslateY = (mousePos.normY * 8).toFixed(1);

  // Kotak-kotak kecil grid (42x42px) di sekitar kursor yang menyala seperti kaca mengkilat saat didekati
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
    <div className="w-full animate-view-enter overflow-x-hidden">
      {/* =====================================================================
          HERO SECTION — 1 FULL VIEWPORT + LONG SMOOTH BOTTOM GRADIENT TRANSITION
         ===================================================================== */}
      <section
        ref={heroSectionRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full min-h-[92vh] sm:min-h-[100vh] lg:min-h-[108vh] daradik-hero-blue-gradient flex flex-col justify-between pt-20 sm:pt-24 overflow-hidden"
      >
        {/* 1. Very Thin Base Grid (42px x 42px) */}
        <div
          className="absolute inset-0 daradik-grid-base pointer-events-none"
          aria-hidden="true"
        />

        {/* 1B. Kotak-Kotak Kecil Grid Background yang Bergerak/Berkilau Kaca Secara Mandiri */}
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

        {/* 1C. Kotak-Kotak Kecil Grid Background yang Menyala Mengkilat Seperti Kaca Saat Kursor Mendekat */}
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

        {/* Decorative White Stroke Rectangle Shapes — Asymmetrical & Not Parallel ("Tinggi Sebelah") */}
        {/* Sisi Kiri: Diposisikan Jauh Lebih Tinggi (Area Atas Hero) */}
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

        {/* Sisi Kanan: Diposisikan Jauh Lebih Rendah (Area Tengah & Bawah Hero — Tinggi Sebelah) */}
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

        {/* 2. Subtle Thin Interactive Grid Revealed Only Around Cursor */}
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

        {/* Main Hero Content Container */}
        <div className="relative lg:-translate-y-12 max-w-6xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 my-auto pt-2 sm:pt-4 pb-8 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT COLUMN: Sturdy Font Headline on 1 line, Sub-headline, & Empty-Default Search Box */}
            <div className="relative z-30 lg:col-span-7 flex flex-col items-start">
              {/* Headline: Transparansi Dana Sekolah (dengan huruf sambung pada kata 'Sekolah' dalam 1 baris) */}
              <h1 className="mt-2 sm:mt-6 lg:mt-8 mb-4 sm:mb-6 text-[24px] sm:text-4xl lg:text-[44px] xl:text-[48px] font-extrabold text-[#FFFFFF] tracking-tight leading-[1.12] sm:leading-[1.10] drop-shadow-sm">
                <span className="block whitespace-normal sm:whitespace-nowrap">
                  Transparansi Dana{' '}
                  <span className="font-script-sekolah text-[1.32em] sm:text-[1.5em] text-[#DCEFEA] px-1.5 sm:px-2 font-normal tracking-wide inline-block drop-shadow-sm select-none">
                    Sekolah
                  </span>
                </span>
                <span className="block mt-0.5 sm:mt-1">yang Jelas &amp; Terbuka.</span>
              </h1>

              {/* Calm Sub-headline with comfortable vertical breathing space */}
              <p className="mb-5 sm:mb-8 text-xs sm:text-sm text-[#FFFFFF]/85 max-w-[48ch] leading-[1.65] sm:leading-[1.7] font-normal text-left">
                Pantau langsung dana BOSP Tahap 1 &amp; 2, validasi bukti belanja fisik sekolah, dan deteksi indikasi pungutan liar secara anonim.
              </p>

              {/* SCHOOL SEARCH CARD — EMPTY BY DEFAULT */}
              <form
                data-tour-id="tour-search-box"
                onSubmit={handleSubmitSearch}
                className="w-full bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <label
                    htmlFor="school-search-field"
                    className="text-xs font-semibold text-[#2E6496]"
                  >
                    Cari Nama Sekolah atau NPSN
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsRegionFilterOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E6496] hover:text-[#1E293B] hover:bg-[#C9DFDC]/40 bg-[#F2EFE8] px-2.5 py-1 rounded-md border border-[#C9DFDC] transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>
                      {provinsi
                        ? `${provinsi}${kabupaten ? ` • ${kabupaten}` : ''}`
                        : 'Filter Wilayah'}
                    </span>
                    {isRegionFilterOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isRegionFilterOpen && (
                  <div className="mb-3.5 p-3.5 rounded-lg bg-[#F2EFE8]/80 border border-[#C9DFDC] grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-view-enter">
                    <div>
                      <label
                        htmlFor="hero-prov"
                        className="block text-[11px] text-[#475569] font-semibold mb-1"
                      >
                        Provinsi
                      </label>
                      <select
                        id="hero-prov"
                        value={provinsi}
                        onChange={(e) => handleProvinsiChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-md text-[#1E293B] font-medium focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
                      >
                        <option value="">Semua Provinsi</option>
                        {Object.keys(REGION_HIERARCHY).map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="hero-kab"
                        className="block text-[11px] text-[#475569] font-semibold mb-1"
                      >
                        Kota / Kabupaten
                      </label>
                      <select
                        id="hero-kab"
                        value={kabupaten}
                        onChange={(e) => handleKabupatenChange(e.target.value)}
                        disabled={!provinsi}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-md text-[#1E293B] font-medium disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
                      >
                        <option value="">Semua Kota/Kab.</option>
                        {kabupatenOptions.map((kab) => (
                          <option key={kab} value={kab}>
                            {kab}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="hero-kec"
                        className="block text-[11px] text-[#475569] font-semibold mb-1"
                      >
                        Kecamatan
                      </label>
                      <select
                        id="hero-kec"
                        value={kecamatan}
                        onChange={(e) => handleKecamatanChange(e.target.value)}
                        disabled={!kabupaten}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-md text-[#1E293B] font-medium disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#2E6496]"
                      >
                        <option value="">Semua Kecamatan</option>
                        {kecamatanOptions.map((kec) => (
                          <option key={kec} value={kec}>
                            {kec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Search Input Field (Starts Empty!) */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    id="school-search-field"
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setChosenSchool(null);
                      setIsDropdownOpen(true);
                      setValidationError(null);
                    }}
                    placeholder="Nama sekolah atau NPSN..."
                    className="w-full pl-10 pr-10 py-3 text-base sm:text-sm bg-[#F2EFE8]/45 border border-[#C9DFDC] rounded-lg text-[#1E293B] font-medium placeholder:text-[#475569]/75 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/30 focus:border-[#2E6496]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#475569] hover:text-[#1E293B]"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List: Hanya menampilkan Nama Sekolah dan NPSN */}
                {isDropdownOpen && (
                  <div className="mt-2 border border-[#C9DFDC] rounded-lg bg-[#FFFFFF] divide-y divide-[#C9DFDC]/50 max-h-52 overflow-y-auto shadow-sm animate-view-enter">
                    <div className="px-3.5 py-1.5 bg-[#F2EFE8] flex items-center justify-between text-[11px] text-[#475569]">
                      <span className="font-semibold text-[#2E6496]">Daftar Sekolah</span>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-[#2E6496] font-semibold hover:underline"
                      >
                        Tutup
                      </button>
                    </div>
                    {filteredSchools.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSchool(s)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#C9DFDC]/35 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xs sm:text-sm font-bold text-[#1E293B]">
                            {s.name}
                          </span>
                          <span className="text-xs text-[#475569] tabular-nums">
                            NPSN: {s.npsn}
                          </span>
                        </div>
                        <span className="text-xs text-[#2E6496] font-semibold shrink-0">
                          Pilih →
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {validationError && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#1E293B] bg-[#F2EFE8] px-3 py-1.5 rounded-md border border-[#C9DFDC]">
                    <AlertCircle className="w-4 h-4 text-[#2E6496] shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* CTA Button with Glass Sheen Shimmer Reflection on Hover ("effect kaca mengkilat") */}
                <div className="mt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-lg daradik-cta-subtle btn-glass-sheen text-[#FFFFFF] font-bold text-sm sm:text-base active:translate-y-[1px] flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <span className="relative z-10">
                      {chosenSchool
                        ? `Cek Transparansi ${chosenSchool.name}`
                        : 'Cek Transparansi Sekolah'}
                    </span>
                    <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Real Interactive 3D iPhone 16 Pro Max Model */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end mt-2 sm:mt-6 lg:mt-0 lg:translate-x-2 xl:translate-x-4">
              <div className="relative w-full max-w-[250px] sm:max-w-[280px] lg:max-w-[400px] xl:max-w-[430px] mx-auto lg:mr-0 flex items-center justify-center -mb-8 sm:-mb-14 lg:-mb-24 lg:-mt-16 z-10">
                <div className="absolute inset-x-[8%] top-[18%] bottom-[12%] rounded-full bg-[radial-gradient(closest-side,rgba(201,223,220,0.38),rgba(102,163,191,0.12)_60%,transparent)] blur-2xl pointer-events-none" aria-hidden="true" />
                <Phone3DCanvas
                  isIntroActive={isIntroActive}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gradasi Asli Latar Landing Page: Lapisan putih di atas menimpa bagian bawah HP */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 sm:h-44 bg-gradient-to-b from-transparent via-[#e6ece8]/80 to-[#FAF8F5] pointer-events-none z-20"
          aria-hidden="true"
        />
      </section>

      {/* =====================================================================
          VIDEO PERKENALAN DARADIK SECTION
         ===================================================================== */}
      <section className="w-full bg-[#FAF8F5] pt-2 sm:pt-4 pb-12 sm:pb-16 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ScrollRevealOnce>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496] block mb-1">
                  Video Perkenalan DARADIK
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                  Mengenal Cara Kerja Pengawasan Dana Sekolah
                </h2>
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm md:text-base text-[#475569] max-w-2xl leading-relaxed">
                  Tonton penjelasan singkat bagaimana DARADIK membantu orang tua, siswa, dan masyarakat memantau penggunaan dana BOSP secara terbuka.
                </p>
              </div>

              <a
                href="https://youtu.be/2TfgFusfSWQ?si=psa3osKWhADjRxYY"
                target="_blank"
                rel="noopener noreferrer"
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#FFFFFF] border border-[#C9DFDC] hover:border-[#2E6496] text-[11px] sm:text-xs font-bold text-[#2E6496] shadow-xs transition-all shrink-0"
              >
                <span>Buka di YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Framed Video Player Container */}
            <div className="rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] p-2.5 sm:p-3.5 shadow-md">
              <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-[#0F172A] border border-[#C9DFDC]/60">
                {isVideoPlaying ? (
                  <iframe
                    src="https://www.youtube.com/embed/2TfgFusfSWQ?autoplay=1&rel=0&modestbranding=1&vq=hd1080"
                    title="Video Perkenalan DARADIK"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsVideoPlaying(true)}
                    className="group relative w-full h-full block text-left focus:outline-none cursor-pointer overflow-hidden"
                    aria-label="Putar Video Perkenalan DARADIK"
                  >
                    {/* YouTube High-Res Thumbnail */}
                    <img
                      src="https://i.ytimg.com/vi/2TfgFusfSWQ/maxresdefault.jpg"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('hqdefault.jpg')) {
                          target.src =
                            'https://i.ytimg.com/vi/2TfgFusfSWQ/hqdefault.jpg';
                        }
                      }}
                      alt="Thumbnail Video Perkenalan DARADIK"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />

                    {/* Subtle Coastal Blue Gradient Overlay */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#1A3D66]/35 to-[#0F172A]/20 transition-opacity duration-300 group-hover:opacity-90"
                      aria-hidden="true"
                    />

                    {/* Center Glassmorphic Play Button */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFFFFF]/90 group-hover:bg-[#FFFFFF] text-[#2E6496] flex items-center justify-center shadow-xl border border-white/80 transition-all duration-300 group-hover:scale-110">
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-[#2E6496] text-[#2E6496] ml-1" />
                      </div>
                      <span className="mt-3.5 px-3.5 py-1 rounded-full bg-[#0F172A]/65 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-[#FFFFFF]">
                        Putar Video Perkenalan
                      </span>
                    </div>

                    {/* Bottom Info Bar Inside Player */}
                    <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex items-end justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-semibold text-[#C9DFDC] block">
                          DARADIK — Transparansi Dana BOSP
                        </span>
                        <p className="text-sm sm:text-base font-bold text-[#FFFFFF] mt-0.5">
                          Pengenalan Platform &amp; Panduan Penggunaan untuk Publik
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </ScrollRevealOnce>
        </div>
      </section>

      {/* =====================================================================
          VERTICAL 3-POINT FLOW (No Boxes, No Table, Animated 1-by-1)
         ===================================================================== */}
      <section className="w-full bg-[#FAF8F5] pt-6 sm:pt-10 pb-16 sm:pb-28 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Section Heading */}
          <ScrollRevealOnce className="mb-8 sm:mb-14 text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              Satu tempat untuk tahu ke mana dana sekolah mengalir.
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed max-w-2xl">
              Tanpa istilah akuntansi yang rumit. Tiga fitur utama untuk memantau realisasi dana BOSP, memvalidasi bukti belanja fisik, dan melindungi hak siswa secara terbuka.
            </p>
          </ScrollRevealOnce>

          {/* Vertical Track with 3 Core Features (Only Point Numbers 01, 02, 03) */}
          <div className="space-y-0">
            {/* FITUR 01 */}
            <ScrollRevealOnce delayMs={0} className="relative">
              <div className="flex items-start gap-3 sm:gap-6">
                {/* Node & Connecting Line Column */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums">
                    01
                  </div>
                  <div className="w-[2px] bg-[#C9DFDC] flex-1 my-1.5 sm:my-2 min-h-[56px] sm:min-h-[80px]" />
                </div>

                {/* Content Column */}
                <div className="pt-0.5 pb-8 sm:pb-12 max-w-2xl flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1E293B]">
                      Transparansi Dana &amp; Bukti Belanja BOSP
                    </h3>
                    <ReceiptText className="w-6 h-6 sm:w-8 sm:h-8 text-[#2E6496] shrink-0 stroke-[1.75]" aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed">
                    Pantau langsung pencairan dana BOSP Tahap 1 &amp; 2 lengkap dengan arsip nota kuitansi, rincian belanja barang, serta titik koordinat bukti fisik (geotagging) di ruang kelas.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectSchoolAndOpenProfile(
                        chosenSchool || selectedSchool,
                        'items-ai'
                      )
                    }
                    className="mt-3 inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#2E6496] hover:text-[#1E293B] group transition-colors cursor-pointer"
                  >
                    <span>Lihat rincian dana &amp; bukti nota</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </ScrollRevealOnce>

            {/* FITUR 02 */}
            <ScrollRevealOnce delayMs={150} className="relative">
              <div className="flex items-start gap-3 sm:gap-6">
                {/* Node & Connecting Line Column */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums">
                    02
                  </div>
                  <div className="w-[2px] bg-[#C9DFDC] flex-1 my-1.5 sm:my-2 min-h-[56px] sm:min-h-[80px]" />
                </div>

                {/* Content Column */}
                <div className="pt-0.5 pb-8 sm:pb-12 max-w-2xl flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1E293B]">
                      Pemindai Iuran Grup WhatsApp
                    </h3>
                    <ScanLine className="w-6 h-6 sm:w-8 sm:h-8 text-[#2E6496] shrink-0 stroke-[1.75]" aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed">
                    Unggah screenshot pengumuman iuran dari grup WhatsApp wali murid untuk mencocokkan otomatis dengan anggaran BOSP dan mendeteksi indikasi tumpang tindih biaya.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectSchoolAndOpenProfile(
                        chosenSchool || selectedSchool,
                        'wa-scanner'
                      )
                    }
                    className="mt-3 inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#2E6496] hover:text-[#1E293B] group transition-colors cursor-pointer"
                  >
                    <span>Coba pemindai screenshot WA</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </ScrollRevealOnce>

            {/* FITUR 03 */}
            <ScrollRevealOnce delayMs={300} className="relative">
              <div className="flex items-start gap-3 sm:gap-6">
                {/* Node Column (No trailing line on final step) */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums">
                    03
                  </div>
                </div>

                {/* Content Column */}
                <div className="pt-0.5 max-w-2xl flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-[#1E293B]">
                      Pelaporan Anonim &amp; Lacak Tiket Aduan
                    </h3>
                    <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-[#2E6496] shrink-0 stroke-[1.75]" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm sm:text-base text-[#475569] leading-relaxed">
                    Laporkan temuan indikasi pungutan liar ke Inspektorat dan Dinas Pendidikan secara terenkripsi tanpa menyertakan identitas pribadi, serta pantau status tindak lanjutnya melalui kode tiket.
                  </p>
                  <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={onOpenAnonymousReport}
                      className="inline-flex items-center gap-2 font-bold text-[#2E6496] hover:text-[#1E293B] group transition-colors cursor-pointer"
                    >
                      <span>Buat laporan anonim</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <span className="text-[#C9DFDC]">•</span>
                    <button
                      type="button"
                      onClick={onOpenLiveTracking}
                      className="font-semibold text-[#475569] hover:text-[#2E6496] transition-colors cursor-pointer"
                    >
                      Lacak status tiket aduan
                    </button>
                  </div>
                </div>
              </div>
            </ScrollRevealOnce>
          </div>

          {/* INFORMASI DI BAWAH (NO TABLE, NO BOXES — Pure Clean Editorial Format) */}
          <ScrollRevealOnce delayMs={450} className="mt-16 sm:mt-20 pt-10 border-t border-[#C9DFDC]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E6496]">
                  Panduan Hak Belajar &amp; Regulasi
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#1E293B] mt-1">
                  Ketahui Hak Siswa &amp; Batas Larangan Pungutan Sekolah
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                  Sesuai Permendikdasmen No. 8 Tahun 2026, seluruh operasional dasar dan perlengkapan sarana prasarana sekolah negeri telah dialokasikan melalui BOSP.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreInfo((prev) => !prev)}
                className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496] hover:text-[#1E293B] transition-colors cursor-pointer"
              >
                <span>{showMoreInfo ? 'Tutup Rincian' : 'Lihat Rincian Regulasi'}</span>
                {showMoreInfo ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Seamless, Non-Tabular Expandable Editorial Notes */}
            {showMoreInfo && (
              <div className="mt-6 space-y-5 animate-view-enter text-xs sm:text-sm text-[#475569] leading-relaxed">
                <div className="border-l-2 border-[#2E6496] pl-4 py-1">
                  <div className="font-bold text-[#1E293B] mb-1">
                    Wajib Ditanggung Negara Melalui Dana BOSP:
                  </div>
                  <p>
                    Buku teks kurikulum &amp; perpustakaan, perbaikan sarana ruang kelas (kipas angin dinding, bangku kursi, cat dinding, kebersihan sanitasi), tagihan daya listrik/air/internet, dan biaya asesmen pembelajaran.
                  </p>
                </div>

                <div className="border-l-2 border-[#66A3BF] pl-4 py-1">
                  <div className="font-bold text-[#1E293B] mb-1">
                    Dilarang Dibebankan Wajib ke Wali Murid di Sekolah Negeri:
                  </div>
                  <p>
                    Menetapkan iuran wajib bertarget nominal dan tenggat waktu, menarik kas untuk fasilitas yang sudah tercantum di RKAS BOSP, atau mewajibkan pembelian lembar kerja siswa (LKS) dan seragam tertentu.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-[#64748B]">
                    Dasar Regulasi: Permendikdasmen No. 8 Tahun 2026
                  </span>
                  <button
                    type="button"
                    onClick={onOpenKamusModal}
                    className="inline-flex items-center gap-1.5 font-bold text-[#2E6496] hover:underline cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buka Kamus Juknis BOSP Lengkap →</span>
                  </button>
                </div>
              </div>
            )}
          </ScrollRevealOnce>
        </div>
      </section>
    </div>
  );
};
