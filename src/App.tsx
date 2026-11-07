import React, { useState, useCallback, useEffect } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  X,
  Flag,
} from 'lucide-react';
import {
  BospRealizationItem,
  SCHOOLS_DATABASE,
  SchoolData,
  WaScenarioData,
  formatRupiah,
} from './data/schoolsData';
import { fetchSchoolFromSupabase } from './lib/supabase';
import { LandingPage } from './components/LandingPage';
import {
  ProfileTab,
  SchoolProfilePage,
} from './components/SchoolProfilePage';
import {
  SchoolSearchPage,
  SchoolSearchFilterState,
  parseSchoolSearchUrlParams,
  buildSchoolSearchUrl,
} from './components/SchoolSearchPage';
import { AnonymousReportPage } from './components/AnonymousReportPage';
import { LiveTrackingPage } from './components/LiveTrackingPage';
import { KamusBospPage } from './components/KamusBospPage';
import { DinasDashboardPage } from './components/DinasDashboardPage';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { OnboardingTour } from './components/OnboardingTour';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  GeotagModal,
  InvoiceModal,
} from './components/Modals';

export type AppView =
  | 'landing'
  | 'school-search'
  | 'school-profile'
  | 'anonymous-report'
  | 'live-tracking'
  | 'kamus-bosp'
  | 'dinas-dashboard';

function detectInitialAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    pathname === '/admin' ||
    pathname === '/admin/' ||
    window.location.hash === '#admin' ||
    params.get('admin') === 'true' ||
    params.get('view') === 'dinas' ||
    params.get('dinas') === 'true'
  );
}

function detectInitialSearchRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    pathname === '/search' ||
    pathname === '/search/' ||
    params.get('view') === 'search' ||
    params.has('province') ||
    params.has('city') ||
    params.has('level') ||
    params.has('status') ||
    params.has('search')
  );
}

export function App() {
  const [showIntro, setShowIntro] = useState<boolean>(
    () => !detectInitialAdminRoute() && !detectInitialSearchRoute()
  );
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (detectInitialAdminRoute()) return 'dinas-dashboard';
    if (detectInitialSearchRoute()) return 'school-search';
    return 'landing';
  });
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const [searchPageFilters, setSearchPageFilters] = useState<
    Partial<SchoolSearchFilterState>
  >(() =>
    typeof window !== 'undefined'
      ? parseSchoolSearchUrlParams(window.location.search)
      : {}
  );
  const [searchPageResetKey, setSearchPageResetKey] = useState<number>(0);

  const [selectedSchool, setSelectedSchool] = useState<SchoolData>(
    SCHOOLS_DATABASE[0]
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>('summary');

  const isAdminRoute = currentView === 'dinas-dashboard';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAdminRoute) {
      document.body.classList.add('is-admin-route');
      setIsTourOpen(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      document.title = 'Dashboard Petugas Dinas Pendidikan | DARADIK';
    } else {
      document.body.classList.remove('is-admin-route');
      if (currentView === 'live-tracking') {
        document.title = 'Lacak Status Laporan | DARADIK';
      } else if (currentView === 'anonymous-report') {
        document.title = 'Kirim Laporan Anonim | DARADIK';
      } else if (currentView === 'school-search') {
        document.title = 'Pencarian Sekolah | DARADIK';
      } else {
        document.title = 'DARADIK | Transparansi Dana Pendidikan Indonesia';
      }
    }
  }, [isAdminRoute, currentView]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const npsnParam = params.get('npsn');
      const ticketParam = params.get('ticket');

      if (detectInitialAdminRoute()) {
        setCurrentView('dinas-dashboard');
        setShowIntro(false);
      } else if (detectInitialSearchRoute()) {
        setSearchPageFilters(parseSchoolSearchUrlParams(window.location.search));
        setCurrentView('school-search');
        setShowIntro(false);
      } else if (ticketParam) {
        setActiveTicketCode(ticketParam.trim().toUpperCase());
        setCurrentView('live-tracking');
        setShowIntro(false);
      } else if (npsnParam) {
        const matched = SCHOOLS_DATABASE.find(
          (s) => s.npsn.toLowerCase() === npsnParam.trim().toLowerCase()
        );
        if (matched) {
          setSelectedSchool(matched);
          setCurrentView('school-profile');
        }
      }
    }

    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const handleIntroFinish = useCallback(() => {
    setShowIntro(false);
  }, []);

  useEffect(() => {
    async function loadSchoolFromSupabase() {
      try {
        const remote = await fetchSchoolFromSupabase('smk-ti-bazma');
        if (remote) {
          setSelectedSchool((prev) =>
            prev.id === 'smk-ti-bazma' ? remote : prev
          );
        }
      } catch (err) {
        console.info('[Supabase] Menggunakan data lokal terverifikasi:', err);
      }
    }
    loadSchoolFromSupabase();
  }, []);

  // Modals State
  const [activeInvoiceItem, setActiveInvoiceItem] =
    useState<BospRealizationItem | null>(null);
  const [activeGeotagItem, setActiveGeotagItem] =
    useState<BospRealizationItem | null>(null);

  // Anonymous Report Prefill & Reset State
  const [reportCategoryPrefill, setReportCategoryPrefill] =
    useState<string>('');
  const [reportAttachmentPrefill, setReportAttachmentPrefill] =
    useState<string>('');
  const [reportOcrTextPrefill, setReportOcrTextPrefill] =
    useState<string>('');
  const [reportOcrBospFactPrefill, setReportOcrBospFactPrefill] =
    useState<string>('');
  const [preselectReportSchool, setPreselectReportSchool] =
    useState<boolean>(false);
  const [reportFormResetKey, setReportFormResetKey] = useState<number>(0);

  // Live Tracking Ticket State
  const [activeTicketCode, setActiveTicketCode] = useState<string>('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Scroll untuk Adaptasi Warna Tombol Bantuan (?) sesuai Background
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 90);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDarkBackground = currentView === 'landing' && !isScrolled;

  // Keyboard virtual HP: saat field teks fokus, lepas elemen fixed bawah
  // (bottom nav, chatbot) agar input dan tombol kirim tidak tertutup.
  useEffect(() => {
    const isTextField = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.tagName === 'TEXTAREA') return true;
      if (target.tagName === 'INPUT') {
        const type = (target as HTMLInputElement).type;
        return !['checkbox', 'radio', 'file', 'button', 'submit', 'range', 'color'].includes(type);
      }
      return target.isContentEditable;
    };
    const handleFocusIn = (e: FocusEvent) => {
      if (isTextField(e.target)) document.body.classList.add('kb-open');
    };
    const handleFocusOut = () => document.body.classList.remove('kb-open');

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.body.classList.remove('kb-open');
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      if (detectInitialAdminRoute()) {
        setCurrentView('dinas-dashboard');
        setShowIntro(false);
      } else if (detectInitialSearchRoute()) {
        setSearchPageFilters(parseSchoolSearchUrlParams(window.location.search));
        setCurrentView('school-search');
        setShowIntro(false);
      } else {
        const pathname = window.location.pathname.toLowerCase();
        if (pathname === '/' || pathname === '') {
          setCurrentView('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.toLowerCase();
      if (view === 'dinas-dashboard') {
        if (currentPath !== '/admin') {
          window.history.pushState(null, '', '/admin');
        }
      } else if (view === 'school-search') {
        if (currentPath !== '/search' && currentPath !== '/search/') {
          window.history.pushState(null, '', '/search');
        }
      } else if (
        currentPath === '/admin' ||
        currentPath === '/admin/' ||
        currentPath === '/search' ||
        currentPath === '/search/' ||
        window.location.search !== ''
      ) {
        window.history.pushState(null, '', '/');
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSearchPage = useCallback(
    (filters?: Partial<SchoolSearchFilterState>) => {
      const normalized: SchoolSearchFilterState = {
        province: filters?.province || '',
        city: filters?.city || '',
        level: filters?.level || '',
        status: filters?.status || '',
        search: filters?.search || '',
        page: filters?.page && filters.page > 0 ? filters.page : 1,
      };
      setSearchPageFilters(normalized);
      setSearchPageResetKey((k) => k + 1);
      setCurrentView('school-search');

      if (typeof window !== 'undefined') {
        const targetUrl = buildSchoolSearchUrl(normalized);
        window.history.pushState(null, '', targetUrl);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleGoBack = useCallback(() => {
    handleOpenSearchPage();
  }, [handleOpenSearchPage]);

  const handleSelectSchoolAndOpenProfile = (
    school: SchoolData,
    initialTab: ProfileTab = 'summary'
  ) => {
    setSelectedSchool(school);
    setProfileTab(initialTab);
    navigateTo('school-profile');

    fetchSchoolFromSupabase(school.id)
      .then((remote) => {
        if (remote && remote.id === school.id) {
          setSelectedSchool(remote);
        }
      })
      .catch(() => {
        // Pertahankan data lokal terverifikasi
      });
  };

  const handleReportFromItem = (item: BospRealizationItem) => {
    setPreselectReportSchool(true);
    setReportCategoryPrefill(
      `Kejanggalan / Pungutan ${item.name} (Anggaran BOSP ${formatRupiah(
        item.amount
      )} - ${item.stage})`
    );
    setReportAttachmentPrefill(
      `Arsip Nota ${item.invoice.number} & Data Geotagging (${item.geotag.lat}, ${item.geotag.lng})`
    );
    setReportOcrTextPrefill('');
    setReportOcrBospFactPrefill('');
    setReportFormResetKey((k) => k + 1);
    navigateTo('anonymous-report');
  };

  const handleReportFromWaScenario = (scenario: WaScenarioData) => {
    setPreselectReportSchool(true);
    setReportCategoryPrefill(scenario.reportCategoryPrefill);
    setReportAttachmentPrefill(scenario.attachmentLabel);
    setReportOcrTextPrefill(scenario.ocrQuote || '');
    setReportOcrBospFactPrefill(scenario.bospFact || '');
    setReportFormResetKey((k) => k + 1);
    navigateTo('anonymous-report');
  };

  const handleOpenReportFromHeader = () => {
    setPreselectReportSchool(false);
    setReportCategoryPrefill('');
    setReportAttachmentPrefill('');
    setReportOcrTextPrefill('');
    setReportOcrBospFactPrefill('');
    setReportFormResetKey((k) => k + 1);
    navigateTo('anonymous-report');
  };

  const handleOpenReportFromSchoolProfile = () => {
    setPreselectReportSchool(true);
    setReportCategoryPrefill('');
    setReportAttachmentPrefill('');
    setReportOcrTextPrefill('');
    setReportOcrBospFactPrefill('');
    setReportFormResetKey((k) => k + 1);
    navigateTo('anonymous-report');
  };

  const handleOpenLiveTrackingFromHeader = () => {
    setActiveTicketCode('');
    navigateTo('live-tracking');
  };

  const handleStartOnboardingTour = () => {
    if (currentView !== 'landing') {
      navigateTo('landing');
    }
    setIsTourOpen(true);
  };

  const handleReportSubmitted = (ticketCode: string) => {
    setActiveTicketCode(ticketCode);
    navigateTo('live-tracking');
    showToast(`Laporan terkirim. Kode tiket Anda: ${ticketCode}`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E293B] ${
        isAdminRoute ? '' : 'has-mobile-nav'
      }`}
    >
      {!isAdminRoute && showIntro && (
        <IntroSplashScreen onFinish={handleIntroFinish} />
      )}

      {/* Navbar publik disembunyikan pada halaman /admin.
          Di HP (<640px) header hanya memuat logo; menu utama ada di bottom nav. */}
      {!isAdminRoute && (
        <header className="app-header-fixed fixed left-0 right-0 z-50 px-2 sm:pl-6 sm:pr-16 lg:pl-8 lg:pr-20 xl:px-8">
          <div className="max-w-6xl mx-auto h-14 sm:h-16 px-3 sm:px-6 rounded-xl liquid-glass-nav-white flex items-center justify-between gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group shrink-0 min-h-[44px]"
              aria-label="Beranda DARADIK"
            >
              <img
                src="/logo-daradik.png"
                alt="Logo DARADIK"
                className="h-6 sm:h-7 w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
              />
            </button>

            <nav
              className="hidden sm:flex items-center gap-1 sm:gap-2"
              aria-label="Navigasi Utama DARADIK"
            >
              <button
                type="button"
                data-tour-id="tour-kamus-bosp"
                onClick={() => navigateTo('kamus-bosp')}
                className={`nav-link-interactive px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'kamus-bosp'
                    ? 'text-[#2E6496] bg-[#C9DFDC]/55'
                    : 'text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35'
                }`}
              >
                <BookOpen className="w-4 h-4 hidden sm:inline text-[#2E6496]" />
                <span>Kamus BOSP</span>
              </button>

              <button
                type="button"
                data-tour-id="tour-lacak-lapor"
                onClick={handleOpenLiveTrackingFromHeader}
                className={`nav-link-interactive px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'live-tracking'
                    ? 'text-[#2E6496] bg-[#C9DFDC]/55'
                    : 'text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35'
                }`}
              >
                <Search className="w-4 h-4 hidden sm:inline text-[#2E6496]" />
                <span>Lacak Lapor</span>
              </button>

              <button
                type="button"
                data-tour-id="tour-lapor"
                onClick={handleOpenReportFromHeader}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-lg daradik-cta-subtle text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px] flex items-center gap-1 sm:gap-1.5 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span>Lapor</span>
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Tombol panduan (?) disembunyikan sepenuhnya pada halaman /admin */}
      {!isAdminRoute && (
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
            onClick={handleStartOnboardingTour}
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
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className="fixed left-3 right-3 bottom-[calc(var(--mobile-nav-h)+var(--safe-bottom)+0.75rem)] sm:left-auto sm:right-5 sm:bottom-5 z-[56] sm:max-w-md bg-[#1E293B] text-[#FAF8F5] border border-[#2E6496] rounded-lg px-4 py-3 shadow-lg flex items-center justify-between gap-3 animate-view-enter"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#C9DFDC] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#C9DFDC] hover:text-[#FFFFFF] p-2.5 -m-1.5 shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Content */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            selectedSchool={selectedSchool}
            onSelectSchoolAndOpenProfile={handleSelectSchoolAndOpenProfile}
            onOpenSearchPage={handleOpenSearchPage}
            onOpenAnonymousReport={handleOpenReportFromHeader}
            onOpenLiveTracking={handleOpenLiveTrackingFromHeader}
            onOpenKamusModal={() => navigateTo('kamus-bosp')}
            isIntroActive={showIntro}
          />
        )}

        {currentView === 'school-search' && (
          <div className="app-top-offset">
            <SchoolSearchPage
              key={searchPageResetKey}
              initialFilters={searchPageFilters}
              onBackToLanding={() => navigateTo('landing')}
              onSelectSchool={(school) =>
                handleSelectSchoolAndOpenProfile(school, 'summary')
              }
            />
          </div>
        )}

        {currentView === 'school-profile' && (
          <div className="app-top-offset">
            <SchoolProfilePage
              school={selectedSchool}
              activeTab={profileTab}
              onTabChange={setProfileTab}
              onBackToLanding={() => handleOpenSearchPage()}
              onOpenKamusModal={() => navigateTo('kamus-bosp')}
              onOpenInvoiceModal={(item) => setActiveInvoiceItem(item)}
              onOpenGeotagModal={(item) => setActiveGeotagItem(item)}
              onReportFromItem={handleReportFromItem}
              onReportFromWaScenario={handleReportFromWaScenario}
              onOpenAnonymousReport={handleOpenReportFromSchoolProfile}
              onShowToast={showToast}
            />
          </div>
        )}

        {currentView === 'anonymous-report' && (
          <div className="app-top-offset">
            <AnonymousReportPage
              key={reportFormResetKey}
              selectedSchool={selectedSchool}
              preselectSchool={preselectReportSchool}
              onChangeSchool={setSelectedSchool}
              prefilledCategory={reportCategoryPrefill}
              prefilledAttachment={reportAttachmentPrefill}
              prefilledOcrText={reportOcrTextPrefill}
              prefilledOcrBospFact={reportOcrBospFactPrefill}
              onCancel={handleGoBack}
              onBackToHome={() => handleOpenSearchPage()}
              onSubmitSuccess={handleReportSubmitted}
            />
          </div>
        )}

        {currentView === 'live-tracking' && (
          <div className="app-top-offset">
            <LiveTrackingPage
              ticketCode={activeTicketCode}
              onBackToHome={() => handleOpenSearchPage()}
              onOpenAnonymousReport={handleOpenReportFromHeader}
              onShowToast={showToast}
            />
          </div>
        )}

        {currentView === 'dinas-dashboard' && (
          <DinasDashboardPage
            onBackToHome={() => handleOpenSearchPage()}
            onShowToast={showToast}
          />
        )}

        {currentView === 'kamus-bosp' && (
          <div className="app-top-offset">
            <KamusBospPage
              onBack={handleGoBack}
              onReportNow={handleOpenReportFromHeader}
            />
          </div>
        )}
      </main>

      {/* Footer publik disembunyikan pada halaman /admin */}
      {!isAdminRoute && (
        <Footer
          onNavigateHome={() => navigateTo('landing')}
          onNavigateSearch={() => handleOpenSearchPage()}
          onNavigateKamus={() => navigateTo('kamus-bosp')}
          onNavigateTracking={handleOpenLiveTrackingFromHeader}
          onNavigateReport={handleOpenReportFromHeader}
          onStartTour={handleStartOnboardingTour}
          onShowToast={showToast}
        />
      )}

      {!isAdminRoute && (
        <MobileBottomNav
          currentView={currentView}
          onHome={() => navigateTo('landing')}
          onSearch={() => handleOpenSearchPage()}
          onReport={handleOpenReportFromHeader}
          onTracking={handleOpenLiveTrackingFromHeader}
          onKamus={() => navigateTo('kamus-bosp')}
        />
      )}

      {!isAdminRoute && (
        <OnboardingTour
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
        />
      )}

      <InvoiceModal
        item={activeInvoiceItem}
        school={selectedSchool}
        onClose={() => setActiveInvoiceItem(null)}
        onReportItem={handleReportFromItem}
      />

      <GeotagModal
        item={activeGeotagItem}
        school={selectedSchool}
        onClose={() => setActiveGeotagItem(null)}
        onReportItem={handleReportFromItem}
      />
    </div>
  );
}

export default App;
