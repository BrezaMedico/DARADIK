import React, { useEffect, useRef, useState } from 'react';
import type { SchoolData } from '@/types';
import {
  HeroAmbientBackground,
  type HeroMousePosition,
} from './components/HeroAmbientBackground';
import { Phone3DCanvas } from './components/Phone3DCanvas';
import { HeroSchoolSearchBox } from './components/HeroSchoolSearchBox';
import { LandingVideoSection } from './components/LandingVideoSection';
import { LandingFeaturesSection } from './components/LandingFeaturesSection';

export interface LandingPageProps {
  selectedSchool: SchoolData;
  onSelectSchoolAndOpenProfile: (
    school: SchoolData,
    initialTab?: 'summary' | 'items-ai' | 'wa-scanner'
  ) => void;
  onOpenSearchPage: (filters?: {
    province?: string;
    city?: string;
    level?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => void;
  onOpenAnonymousReport: () => void;
  onOpenMessageScanner: () => void;
  onOpenLiveTracking: () => void;
  onOpenKamusModal: () => void;
  isIntroActive?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectSchoolAndOpenProfile,
  onOpenSearchPage,
  onOpenAnonymousReport,
  onOpenMessageScanner,
  onOpenLiveTracking,
  onOpenKamusModal,
  isIntroActive = false,
}) => {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const [mousePos, setMousePos] = useState<HeroMousePosition>({
    x: 500,
    y: 320,
    active: false,
    normX: 0,
    normY: 0,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroSectionRef.current) return;
    const rect = heroSectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

  return (
    <div className="w-full animate-view-enter overflow-x-clip">
      <section
        ref={heroSectionRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full min-h-0 sm:min-h-[100vh] lg:min-h-[100vh] daradik-hero-blue-gradient flex flex-col justify-center pt-16 sm:pt-32 pb-14 sm:pb-28 lg:pt-16 lg:pb-12 overflow-hidden"
      >
        <HeroAmbientBackground mousePos={mousePos} />

        <div className="relative lg:translate-y-0 max-w-6xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 my-0 lg:my-auto pt-1 sm:pt-8 pb-10 sm:pb-20 lg:pt-8 lg:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Negative bottom margin on mobile lets the headline overlap the lower half of the 3D phone. */}
            <div className="order-first lg:order-last lg:col-span-5 flex items-center justify-center lg:justify-end -mt-3 sm:mt-2 lg:mt-0 lg:translate-x-2 xl:translate-x-4">
              <div className="relative w-full max-w-[270px] sm:max-w-[310px] lg:max-w-[340px] xl:max-w-[360px] mx-auto lg:mr-0 flex items-center justify-center -mb-[85px] sm:-mb-[105px] lg:mb-0 lg:mt-0 z-10">
                <div
                  className="absolute inset-x-[8%] top-[18%] bottom-[12%] rounded-full bg-[radial-gradient(closest-side,rgba(201,223,220,0.38),rgba(102,163,191,0.12)_60%,transparent)] blur-2xl pointer-events-none"
                  aria-hidden="true"
                />
                <Phone3DCanvas
                  isIntroActive={isIntroActive}
                  className="w-full"
                />
              </div>
            </div>

            <div className="relative z-20 order-last lg:order-first lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="relative w-full flex flex-col items-center lg:items-start">
                <div
                  className="lg:hidden absolute -top-12 -bottom-4 left-1/2 -translate-x-1/2 w-screen max-w-none bg-gradient-to-b from-transparent via-[#255486]/70 via-45% to-transparent pointer-events-none -z-10"
                  aria-hidden="true"
                />

                <h1 className="mt-0 lg:mt-8 mb-3.5 sm:mb-4 text-[clamp(1.45rem,6.8vw,2.15rem)] sm:text-4xl lg:text-[44px] xl:text-[48px] font-extrabold text-[#FFFFFF] tracking-tight leading-[1.14] sm:leading-[1.10] drop-shadow-[0_2px_10px_rgba(10,25,50,0.9)]">
                  <span className="block whitespace-normal sm:whitespace-nowrap">
                    Transparansi Dana{' '}
                    <span className="font-script-sekolah text-[1.3em] sm:text-[1.5em] text-[#DCEFEA] px-1 sm:px-2 font-normal tracking-wide inline-block drop-shadow-sm select-none">
                      Sekolah
                    </span>
                  </span>
                  <span className="block mt-0.5 sm:mt-1">yang Jelas &amp; Terbuka.</span>
                </h1>
              </div>

              <p className="mb-4 sm:mb-8 text-xs sm:text-sm text-[#FFFFFF]/90 max-w-[48ch] leading-[1.6] sm:leading-[1.7] font-normal text-center lg:text-left">
                Pantau langsung dana BOSP Tahap 1 &amp; 2, validasi bukti belanja fisik sekolah, dan deteksi indikasi pungutan liar secara anonim.
              </p>

              <HeroSchoolSearchBox
                onSelectSchoolAndOpenProfile={onSelectSchoolAndOpenProfile}
                onOpenSearchPage={onOpenSearchPage}
              />
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-16 sm:h-28 bg-gradient-to-b from-transparent via-[#e6ece8]/60 to-[#FAF8F5] pointer-events-none z-20"
          aria-hidden="true"
        />
      </section>

      <LandingVideoSection />

      <LandingFeaturesSection
        onOpenSearchPage={() => onOpenSearchPage()}
        onOpenMessageScanner={onOpenMessageScanner}
        onOpenAnonymousReport={onOpenAnonymousReport}
        onOpenLiveTracking={onOpenLiveTracking}
        onOpenKamusModal={onOpenKamusModal}
      />
    </div>
  );
};
