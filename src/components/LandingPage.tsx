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
  MapPin,
  Building2,
} from 'lucide-react';
import {
  REGION_HIERARCHY,
  SCHOOLS_DATABASE,
  SchoolData,
} from '../data/schoolsData';

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
}

export const LandingPage: React.FC<LandingPageProps> = ({
  selectedSchool,
  onSelectSchoolAndOpenProfile,
  onOpenAnonymousReport,
  onOpenLiveTracking,
  onOpenKamusModal,
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
    const q = searchQuery
      .replace(/\(NPSN:.*?\)/i, '')
      .trim()
      .toLowerCase();

    return SCHOOLS_DATABASE.filter((s) => {
      const matchesRegion =
        (!provinsi || s.provinsi === provinsi) &&
        (!kabupaten || s.kabupaten === kabupaten) &&
        (!kecamatan || s.kecamatan === kecamatan);

      if (!q) return matchesRegion;

      return (
        matchesRegion &&
        (s.name.toLowerCase().includes(q) ||
          s.npsn.toLowerCase().includes(q) ||
          s.sampleNisn.toLowerCase().includes(q) ||
          s.kecamatan.toLowerCase().includes(q) ||
          s.kabupaten.toLowerCase().includes(q) ||
          s.provinsi.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, provinsi, kabupaten, kecamatan]);

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

    if (chosenSchool) {
      setValidationError(null);
      onSelectSchoolAndOpenProfile(chosenSchool, 'summary');
      return;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setValidationError(
        'Silakan ketik atau pilih nama sekolah terlebih dahulu.'
      );
      setIsDropdownOpen(true);
      searchInputRef.current?.focus();
      return;
    }

    if (filteredSchools.length > 0) {
      setValidationError(null);
      onSelectSchoolAndOpenProfile(filteredSchools[0], 'summary');
      return;
    }

    setValidationError(
      'Nama sekolah tidak ditemukan. Silakan pilih dari daftar rekomendasi di bawah.'
    );
    setIsDropdownOpen(true);
  };

  // Subtle 3D Parallax Tilt Values (sedikit saja efeknya)
  const phoneRotateY = (mousePos.normX * 6.5).toFixed(2);
  const phoneRotateX = (-mousePos.normY * 5.5).toFixed(2);
  const phoneTranslateX = (mousePos.normX * 8).toFixed(1);
  const phoneTranslateY = (mousePos.normY * 8).toFixed(1);

  return (
    <div className="w-full animate-view-enter">
      {/* =====================================================================
          HERO SECTION — 1 FULL VIEWPORT + LONG SMOOTH BOTTOM GRADIENT TRANSITION
         ===================================================================== */}
      <section
        ref={heroSectionRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full min-h-[108vh] daradik-hero-blue-gradient flex flex-col justify-between pt-24 overflow-hidden"
      >
        {/* 1. Very Thin Base Grid */}
        <div
          className="absolute inset-0 daradik-grid-base pointer-events-none"
          aria-hidden="true"
        />

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
        <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 my-auto pt-4 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LEFT COLUMN: Sturdy Font Headline on 1 line, Sub-headline, & Empty-Default Search Box */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Headline: Transparansi Dana Sekolah (dengan huruf sambung pada kata 'Sekolah' dalam 1 baris) */}
              <h1 className="mt-4 sm:mt-6 lg:mt-8 mb-5 sm:mb-6 text-[28px] sm:text-4xl lg:text-[44px] xl:text-[48px] font-extrabold text-[#FFFFFF] tracking-tight leading-[1.08] sm:leading-[1.10] drop-shadow-sm">
                <span className="block whitespace-nowrap">
                  Transparansi Dana{' '}
                  <span className="font-script-sekolah text-[1.42em] text-[#C9DFDC] px-2.5 font-normal tracking-wide inline-block drop-shadow-sm">
                    Sekolah
                  </span>
                </span>
                <span className="block mt-0.5 sm:mt-1">yang Jelas &amp; Terbuka.</span>
              </h1>

              {/* Calm Sub-headline with comfortable vertical breathing space */}
              <p className="mb-7 sm:mb-8 text-xs sm:text-sm text-[#FFFFFF]/85 max-w-[48ch] leading-[1.7] font-normal text-left">
                Pantau langsung dana BOSP Tahap 1 &amp; 2, validasi bukti belanja fisik sekolah, dan deteksi indikasi pungutan liar secara anonim.
              </p>

              {/* SCHOOL SEARCH CARD — EMPTY BY DEFAULT */}
              <form
                onSubmit={handleSubmitSearch}
                className="w-full bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl shadow-lg p-5 sm:p-6"
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
                    placeholder="Ketik nama sekolah atau NPSN terlebih dahulu..."
                    className="w-full pl-10 pr-10 py-3 text-sm bg-[#F2EFE8]/45 border border-[#C9DFDC] rounded-lg text-[#1E293B] font-medium placeholder:text-[#475569]/75 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/30 focus:border-[#2E6496]"
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

                {/* Selected School Confirmation Pill (ONLY Name & Region, NO Budget) */}
                {chosenSchool && (
                  <div className="mt-2.5 px-3.5 py-2.5 rounded-lg bg-[#F2EFE8] border border-[#C9DFDC] flex items-center justify-between gap-2 text-xs animate-view-enter">
                    <div className="flex items-center gap-2 text-[#1E293B]">
                      <Building2 className="w-4 h-4 text-[#2E6496] shrink-0" />
                      <span>
                        Sekolah terpilih: <strong>{chosenSchool.name}</strong> •{' '}
                        <span className="text-[#475569]">
                          Kec. {chosenSchool.kecamatan}, {chosenSchool.kabupaten}, {chosenSchool.provinsi}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-[#475569] hover:text-[#1E293B] text-xs underline font-medium shrink-0"
                    >
                      Ganti
                    </button>
                  </div>
                )}

                {/* Autocomplete Dropdown List: Displays ONLY School Name & Region (No budget) */}
                {isDropdownOpen && (
                  <div className="mt-2 border border-[#C9DFDC] rounded-lg bg-[#FFFFFF] divide-y divide-[#C9DFDC]/50 max-h-52 overflow-y-auto shadow-sm animate-view-enter">
                    <div className="px-3.5 py-1.5 bg-[#F2EFE8] flex items-center justify-between text-[11px] text-[#475569]">
                      <span>Pilih sekolah ({filteredSchools.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-[#2E6496] font-semibold hover:underline"
                      >
                        Tutup
                      </button>
                    </div>
                    {filteredSchools.length === 0 ? (
                      <div className="p-3.5 text-center text-xs text-[#475569]">
                        Tidak ada sekolah yang cocok dengan "{searchQuery}".
                      </div>
                    ) : (
                      filteredSchools.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSchool(s)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#C9DFDC]/35 transition-colors flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-[#475569] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#66A3BF] shrink-0" />
                              <span>
                                Kec. {s.kecamatan}, {s.kabupaten}, {s.provinsi} • NPSN: {s.npsn}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-[#2E6496] font-semibold shrink-0">
                            Pilih →
                          </span>
                        </button>
                      ))
                    )}
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
                    className="w-full py-3.5 px-6 rounded-lg daradik-cta-subtle btn-glass-sheen text-[#FFFFFF] font-bold text-sm sm:text-base active:translate-y-[1px] flex items-center justify-center gap-2.5"
                  >
                    <span>
                      {chosenSchool
                        ? `Cek Transparansi ${chosenSchool.name}`
                        : 'Cek Transparansi Sekolah'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: 3D Mouse Parallax Tilt Phone Mockup */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="parallax-phone-container relative w-full max-w-[390px] mx-auto flex items-center justify-center">
                <img
                  src="/phone-prototype.png?v=3"
                  alt="Prototype Tampilan Mobile DARADIK"
                  style={{
                    transform: mousePos.active
                      ? `rotateX(${phoneRotateX}deg) rotateY(${phoneRotateY}deg) translate3d(${phoneTranslateX}px, ${phoneTranslateY}px, 0)`
                      : 'rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)',
                  }}
                  className="parallax-phone-target relative z-10 w-full max-h-[460px] object-contain drop-shadow-xl select-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Long, Smooth Gradient Transition into the Bottom Section */}
        <div
          className="relative z-10 w-full h-32 sm:h-44 bg-gradient-to-b from-transparent via-[#e6ece8]/75 to-[#FAF8F5] pointer-events-none"
          aria-hidden="true"
        />
      </section>

      {/* =====================================================================
          CONCISE, HUMAN-WRITTEN SECTION BELOW HERO
          (Zero AI-Slop, Slower Smooth Entrance, No Red/Green Distractions)
         ===================================================================== */}
      <section className="w-full bg-[#FAF8F5] pt-4 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Short, Punchy Editorial Heading */}
          <ScrollRevealOnce className="max-w-xl mb-10">
            <h2 className="font-sturdy-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              Satu tempat untuk tahu ke mana dana sekolah mengalir.
            </h2>
            <p className="mt-2 text-sm text-[#475569] leading-relaxed">
              Tanpa istilah akuntansi yang rumit. Pilih sekolah, cek bukti belanjanya, atau laporkan pungutan dengan tenang.
            </p>
          </ScrollRevealOnce>

          {/* 3 Clean Minimalist Cards (Short Copy, Direct Action Links) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollRevealOnce
              delayMs={0}
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-6 shadow-sm hover:border-[#66A3BF] transition-colors flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  Cek Dana &amp; Nota Belanja
                </h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Lihat berapa dana BOSP yang cair tahun ini beserta foto kwitansi dan barang yang terpasang di kelas.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSelectSchoolAndOpenProfile(
                    chosenSchool || selectedSchool,
                    'items-ai'
                  )
                }
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496] hover:text-[#1E293B] transition-colors self-start group"
              >
                <span>Lihat bukti belanja sekolah</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </ScrollRevealOnce>

            <ScrollRevealOnce
              delayMs={120}
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-6 shadow-sm hover:border-[#66A3BF] transition-colors flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  Pindai Iuran Grup WA
                </h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Unggah screenshot pengumuman iuran kelas untuk mengecek apakah barangnya sebenarnya sudah dibiayai negara.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSelectSchoolAndOpenProfile(
                    chosenSchool || selectedSchool,
                    'wa-scanner'
                  )
                }
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496] hover:text-[#1E293B] transition-colors self-start group"
              >
                <span>Coba pemindai screenshot</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </ScrollRevealOnce>

            <ScrollRevealOnce
              delayMs={240}
              className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-6 shadow-sm hover:border-[#66A3BF] transition-colors flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  Lapor Tanpa Identitas
                </h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Sampaikan temuan ke Dinas Pendidikan tanpa perlu mencantumkan nama maupun nomor telepon Anda.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenAnonymousReport}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496] hover:text-[#1E293B] transition-colors group"
                >
                  <span>Buat laporan</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <span className="text-[#C9DFDC]">•</span>
                <button
                  type="button"
                  onClick={onOpenLiveTracking}
                  className="text-xs font-semibold text-[#475569] hover:text-[#2E6496] transition-colors"
                >
                  Lacak kode tiket
                </button>
              </div>
            </ScrollRevealOnce>
          </div>

          {/* Single Progressive-Disclosure Strip ("Lihat Selengkapnya") with Neutral / Civic Colors (No AI-slop Green/Red) */}
          <ScrollRevealOnce delayMs={320} className="mt-8">
            <div className="bg-[#F2EFE8] border border-[#C9DFDC] rounded-xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                    Ingin tahu biaya apa saja yang sudah gratis ditanggung BOSP?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    Kenali batas antara kebutuhan sekolah yang wajib dibiayai negara dan pungutan yang dilarang.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMoreInfo((prev) => !prev)}
                  className="self-start sm:self-center shrink-0 px-4 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#2E6496] text-[#2E6496] hover:text-[#FFFFFF] border border-[#C9DFDC] text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {showMoreInfo ? 'Tutup Ringkasan' : 'Lihat Selengkapnya'}
                  </span>
                  {showMoreInfo ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded Concise Summary (Neutral, Authentic Civic Design without AI-slop green/red) */}
              {showMoreInfo && (
                <div className="mt-5 pt-5 border-t border-[#C9DFDC] space-y-4 animate-view-enter">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                    <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC]">
                      <div className="font-bold text-[#1E293B] mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2E6496]" />
                        <span>Kewajiban Ditanggung Negara (BOSP):</span>
                      </div>
                      <p className="text-[#475569] leading-relaxed">
                        Buku paket kurikulum &amp; perpustakaan, perawatan ruang kelas (kipas angin dinding, cat kelas, meja kursi siswa, sanitasi), tagihan listrik/air/internet, serta kegiatan ujian sekolah.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC]">
                      <div className="font-bold text-[#1E293B] mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#66A3BF]" />
                        <span>Dilarang Dibebankan Wajib ke Wali Murid:</span>
                      </div>
                      <p className="text-[#475569] leading-relaxed">
                        Meminta uang patungan untuk barang yang sudah tercantum di RKAS BOSP, menentukan nominal iuran wajib dengan batas waktu di sekolah negeri, atau mewajibkan pembelian LKS/atribut.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#475569]">
                      Dasar Hukum: Permendikbudristek No. 63/2023 &amp; Permendikbud No. 75/2016
                    </span>
                    <button
                      type="button"
                      onClick={onOpenKamusModal}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496] hover:underline"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Buka Kamus Juknis BOSP Lengkap →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ScrollRevealOnce>
        </div>
      </section>
    </div>
  );
};
