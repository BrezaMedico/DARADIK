import React, { useState, useCallback, useEffect } from 'react';
import type {
  AppView,
  BospRealizationItem,
  SchoolData,
  WaScenarioData,
} from '@/types/school';
import { SMK_TI_BAZMA } from '@/data';
import { formatRupiah } from '@/utils/formatters';
import { fetchSchoolFromSupabase } from '@/services/supabase';
import {
  AppHeader,
  Footer,
  MobileBottomNav,
  ToastBanner,
  TourFloatingButton,
  CookieConsentBanner,
} from '@/components/layout';
import { GeotagModal, InvoiceModal } from '@/components/modals';
import { IntroSplashScreen, OnboardingTour } from '@/components/onboarding';
import { LandingPage } from '@/features/landing';
import {
  SchoolSearchPage,
  SchoolSearchFilterState,
  parseSchoolSearchUrlParams,
  buildSchoolSearchUrl,
} from '@/features/school-search';
import { ProfileTab, SchoolProfilePage } from '@/features/school-profile';
import { AnonymousReportPage } from '@/features/anonymous-report';
import { LiveTrackingPage } from '@/features/live-tracking';
import { KamusBospPage } from '@/features/kamus-bosp';
import { DinasDashboardPage } from '@/features/dinas-dashboard';
import {
  detectInitialAdminRoute,
  detectInitialSearchRoute,
  syncBrowserHistoryForView,
} from './routeUtils';

export type { AppView };

const COOKIE_CONSENT_KEY = 'daradik_cookie_consent';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
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

  const [selectedSchool, setSelectedSchool] = useState<SchoolData>(SMK_TI_BAZMA);
  const [profileTab, setProfileTab] = useState<ProfileTab>('summary');

  const [activeInvoiceItem, setActiveInvoiceItem] =
    useState<BospRealizationItem | null>(null);
  const [activeGeotagItem, setActiveGeotagItem] =
    useState<BospRealizationItem | null>(null);

  const [reportCategoryPrefill, setReportCategoryPrefill] = useState<string>('');
  const [reportAttachmentPrefill, setReportAttachmentPrefill] = useState<string>('');
  const [reportOcrTextPrefill, setReportOcrTextPrefill] = useState<string>('');
  const [reportOcrBospFactPrefill, setReportOcrBospFactPrefill] = useState<string>('');
  const [preselectReportSchool, setPreselectReportSchool] = useState<boolean>(false);
  const [reportFormResetKey, setReportFormResetKey] = useState<number>(0);

  const [activeTicketCode, setActiveTicketCode] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const [hasCookieConsent, setHasCookieConsent] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    const rawCookie = getCookie(COOKIE_CONSENT_KEY);
    const rawStorage =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(COOKIE_CONSENT_KEY)
        : null;
    return rawCookie === 'true' || rawStorage === 'true';
  });

  const handleAcceptCookieConsent = useCallback(() => {
    setCookie(COOKIE_CONSENT_KEY, 'true', 365);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    }
    setHasCookieConsent(true);
  }, []);

  const isAdminRoute = currentView === 'dinas-dashboard';
  const isDarkBackground = currentView === 'landing' && !isScrolled;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAdminRoute) {
      document.body.classList.add('is-admin-route');
      setIsTourOpen(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      document.body.classList.remove('is-admin-route');
    }
    document.title = 'DARADIK';
  }, [isAdminRoute, currentView]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('is-intro-active', showIntro);
    }
  }, [showIntro]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('is-tour-active', isTourOpen);
    }
  }, [isTourOpen]);

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
        setActiveTicketCode(ticketParam.trim());
        setCurrentView('live-tracking');
        setShowIntro(false);
      } else if (npsnParam) {
        const cleanNpsn = npsnParam.trim();
        setCurrentView('school-profile');
        setShowIntro(false);
        fetchSchoolFromSupabase(cleanNpsn)
          .then((remote) => {
            if (remote) setSelectedSchool(remote);
          })
          .catch(() => {});
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 90);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Releases fixed bottom chrome (mobile nav & chatbot) while soft keyboards are open on phones.
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
    syncBrowserHistoryForView(view);
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

  const handleBackToLanding = useCallback(() => {
    setShowIntro(false);
    navigateTo('landing');
  }, [navigateTo]);

  useEffect(() => {
    const handleNavEvent = (e: any) => {
      const detail = e.detail || {};
      const view = detail.view as AppView;
      if (!view) return;
      setShowIntro(false);
      if (view === 'school-search') {
        handleOpenSearchPage(detail.searchFilters);
      } else if (view === 'school-profile') {
        if (detail.tab) setProfileTab(detail.tab);
        navigateTo('school-profile');
      } else {
        navigateTo(view);
      }
    };

    window.addEventListener('daradik-navigate', handleNavEvent as any);
    (window as any).__DARADIK_NAVIGATE__ = (view: AppView, options?: any) => {
      handleNavEvent({ detail: { view, ...options } });
    };

    return () => {
      window.removeEventListener('daradik-navigate', handleNavEvent as any);
      delete (window as any).__DARADIK_NAVIGATE__;
    };
  }, [navigateTo, handleOpenSearchPage]);

  const handleSelectSchoolAndOpenProfile = (
    school: SchoolData,
    initialTab: ProfileTab = 'summary'
  ) => {
    setSelectedSchool(school);
    setProfileTab(initialTab);
    navigateTo('school-profile');

    fetchSchoolFromSupabase(school.id || school.npsn, school.jenjang)
      .then((remote) => {
        if (remote && (remote.id === school.id || remote.npsn === school.npsn)) {
          setSelectedSchool(remote);
        }
      })
      .catch(() => {});
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
    if (currentView !== 'landing' && currentView !== 'school-profile') {
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

      {!isAdminRoute && (
        <AppHeader
          currentView={currentView}
          onNavigateHome={() => navigateTo('landing')}
          onNavigateKamus={() => navigateTo('kamus-bosp')}
          onNavigateTracking={handleOpenLiveTrackingFromHeader}
          onNavigateReport={handleOpenReportFromHeader}
        />
      )}

      {!isAdminRoute &&
        (currentView === 'landing' || currentView === 'school-profile') && (
          <TourFloatingButton
            isDarkBackground={isDarkBackground}
            onStartTour={handleStartOnboardingTour}
          />
        )}

      <ToastBanner
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

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
              onBackToLanding={handleBackToLanding}
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
              onBackToLanding={handleBackToLanding}
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
              onCancel={handleBackToLanding}
              onBackToHome={handleBackToLanding}
              onSubmitSuccess={handleReportSubmitted}
            />
          </div>
        )}

        {currentView === 'live-tracking' && (
          <div className="app-top-offset">
            <LiveTrackingPage
              ticketCode={activeTicketCode}
              onBackToHome={handleBackToLanding}
              onOpenAnonymousReport={handleOpenReportFromHeader}
              onShowToast={showToast}
            />
          </div>
        )}

        {currentView === 'dinas-dashboard' && (
          <DinasDashboardPage
            onBackToHome={handleBackToLanding}
            onShowToast={showToast}
          />
        )}

        {currentView === 'kamus-bosp' && (
          <div className="app-top-offset">
            <KamusBospPage
              onBack={handleBackToLanding}
              onReportNow={handleOpenReportFromHeader}
            />
          </div>
        )}
      </main>

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
          tourType={currentView === 'school-profile' ? 'school-profile' : 'landing'}
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

      {!isAdminRoute && currentView !== 'anonymous-report' && (
        <CookieConsentBanner
          hasCookieConsent={hasCookieConsent}
          onAccept={handleAcceptCookieConsent}
        />
      )}
    </div>
  );
}

export default App;

