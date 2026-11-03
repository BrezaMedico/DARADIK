import React, { useState, useCallback, useEffect } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  X,
  MessageSquare,
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
import { AnonymousReportPage } from './components/AnonymousReportPage';
import { LiveTrackingPage } from './components/LiveTrackingPage';
import { KamusBospPage } from './components/KamusBospPage';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import {
  GeotagModal,
  InvoiceModal,
} from './components/Modals';

export type AppView =
  | 'landing'
  | 'school-profile'
  | 'anonymous-report'
  | 'live-tracking'
  | 'kamus-bosp';

export function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [previousView, setPreviousView] = useState<AppView>('landing');

  const [selectedSchool, setSelectedSchool] = useState<SchoolData>(
    SCHOOLS_DATABASE[0]
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>('summary');

  // Pastikan saat refresh atau load awal selalu mulai dari paling atas layar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const handleIntroFinish = useCallback(() => {
    setShowIntro(false);
  }, []);

  // Supabase Sync: Mengambil data sekolah dari Supabase jika database aktif
  useEffect(() => {
    async function loadSchoolFromSupabase() {
      try {
        const remote = await fetchSchoolFromSupabase('smk-ti-bazma');
        if (remote) {
          setSelectedSchool(remote);
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

  // Anonymous Report Prefill State
  const [reportCategoryPrefill, setReportCategoryPrefill] = useState<string>(
    'Iuran Kipas Angin (Tumpang Tindih dengan Dana BOSP Rp 35.000.000)'
  );
  const [reportAttachmentPrefill, setReportAttachmentPrefill] =
    useState<string>('1 Foto Screenshot WA (Tersensor Otomatis)');

  // Live Tracking Ticket State
  const [activeTicketCode, setActiveTicketCode] =
    useState<string>('CHK-2026-8849-BGR');
  const [submittedReporterNote, setSubmittedReporterNote] =
    useState<string>('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const navigateTo = (view: AppView) => {
    setPreviousView(currentView);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        // Fallback ke data lokal terverifikasi
      });
  };

  const handleReportFromItem = (item: BospRealizationItem) => {
    setReportCategoryPrefill(
      `Kejanggalan / Pungutan ${item.name} (Anggaran BOSP ${formatRupiah(
        item.amount
      )} - ${item.stage})`
    );
    setReportAttachmentPrefill(
      `Arsip Nota ${item.invoice.number} & Data Geotagging (${item.geotag.lat}, ${item.geotag.lng})`
    );
    navigateTo('anonymous-report');
  };

  const handleReportFromWaScenario = (scenario: WaScenarioData) => {
    setReportCategoryPrefill(scenario.reportCategoryPrefill);
    setReportAttachmentPrefill(scenario.attachmentLabel);
    navigateTo('anonymous-report');
  };

  const handleOpenReportFromHeader = () => {
    setReportCategoryPrefill('');
    setReportAttachmentPrefill('');
    navigateTo('anonymous-report');
  };

  const handleOpenLiveTrackingFromHeader = () => {
    setActiveTicketCode('');
    navigateTo('live-tracking');
  };

  const handleReportSubmitted = (
    ticketCode: string,
    notes: string,
    finalCategory: string
  ) => {
    setActiveTicketCode(ticketCode);
    setSubmittedReporterNote(notes);
    setReportCategoryPrefill(finalCategory);
    navigateTo('live-tracking');
    showToast(`Laporan anonim terkirim! Kode Tiket Anda: ${ticketCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E293B]">
      {showIntro && (
        <IntroSplashScreen onFinish={handleIntroFinish} />
      )}

      {/* =====================================================================
          WHITE LIQUID GLASS NAVBAR (TRANSPARANSI TIPIS, NEMBUS DIKIT)
         ===================================================================== */}
      <header className="fixed top-2 sm:top-3 left-0 right-0 z-50 px-2 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto h-14 sm:h-16 px-3 sm:px-6 rounded-xl liquid-glass-nav-white flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Official DARADIK Logo */}
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group shrink-0"
            aria-label="Beranda DARADIK"
          >
            <img
              src="/logo-daradik.png"
              alt="Logo DARADIK"
              className="h-5 sm:h-7 w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
            />
          </button>

          {/* Right: 2 Clean Menus (Kamus BOSP & Lacak Lapor) + 1 CTA Button (Lapor) */}
          <nav
            className="flex items-center gap-1 sm:gap-2.5"
            aria-label="Navigasi Utama DARADIK"
          >
            {/* Menu 1: Kamus BOSP */}
            <button
              type="button"
              onClick={() => navigateTo('kamus-bosp')}
              className={`nav-link-interactive px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                currentView === 'kamus-bosp'
                  ? 'text-[#2E6496] bg-[#C9DFDC]/55'
                  : 'text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35'
              }`}
            >
              <BookOpen className="w-4 h-4 hidden sm:inline text-[#2E6496]" />
              <span>Kamus BOSP</span>
            </button>

            {/* Menu 2: Lacak Lapor */}
            <button
              type="button"
              onClick={handleOpenLiveTrackingFromHeader}
              className={`nav-link-interactive px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                currentView === 'live-tracking'
                  ? 'text-[#2E6496] bg-[#C9DFDC]/55'
                  : 'text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35'
              }`}
            >
              <Search className="w-4 h-4 hidden sm:inline text-[#2E6496]" />
              <span>Lacak Lapor</span>
            </button>

            {/* Primary CTA Button: Lapor */}
            <button
              type="button"
              onClick={handleOpenReportFromHeader}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg daradik-cta-subtle text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px] flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span>Lapor</span>
            </button>
          </nav>
        </div>
      </header>

      {/* =====================================================================
          TOAST NOTIFICATION BANNER
         ===================================================================== */}
      {toastMessage && (
        <div
          className="fixed bottom-5 right-5 z-50 max-w-md bg-[#1E293B] text-[#FAF8F5] border border-[#2E6496] rounded-lg px-4 py-3 shadow-lg flex items-center justify-between gap-3 animate-view-enter"
          role="status"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#C9DFDC] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#C9DFDC] hover:text-[#FFFFFF]"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          MAIN VIEW CONTENT
         ===================================================================== */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            selectedSchool={selectedSchool}
            onSelectSchoolAndOpenProfile={handleSelectSchoolAndOpenProfile}
            onOpenAnonymousReport={handleOpenReportFromHeader}
            onOpenLiveTracking={handleOpenLiveTrackingFromHeader}
            onOpenKamusModal={() => navigateTo('kamus-bosp')}
            isIntroActive={showIntro}
          />
        )}

        {currentView === 'school-profile' && (
          <div className="pt-20">
            <SchoolProfilePage
              school={selectedSchool}
              activeTab={profileTab}
              onTabChange={setProfileTab}
              onBackToLanding={() => navigateTo('landing')}
              onOpenKamusModal={() => navigateTo('kamus-bosp')}
              onOpenInvoiceModal={(item) => setActiveInvoiceItem(item)}
              onOpenGeotagModal={(item) => setActiveGeotagItem(item)}
              onReportFromItem={handleReportFromItem}
              onReportFromWaScenario={handleReportFromWaScenario}
              onOpenAnonymousReport={handleOpenReportFromHeader}
              onShowToast={showToast}
            />
          </div>
        )}

        {currentView === 'anonymous-report' && (
          <div className="pt-20">
            <AnonymousReportPage
              selectedSchool={selectedSchool}
              onChangeSchool={setSelectedSchool}
              prefilledCategory={reportCategoryPrefill}
              prefilledAttachment={reportAttachmentPrefill}
              onCancel={() =>
                navigateTo(
                  previousView === 'anonymous-report'
                    ? 'school-profile'
                    : previousView
                )
              }
              onSubmitSuccess={handleReportSubmitted}
            />
          </div>
        )}

        {currentView === 'live-tracking' && (
          <div className="pt-20">
            <LiveTrackingPage
              ticketCode={activeTicketCode}
              school={selectedSchool}
              reportCategory={reportCategoryPrefill}
              reporterNote={submittedReporterNote}
              onBackToHome={() => navigateTo('landing')}
              onBackToSchoolProfile={() => navigateTo('school-profile')}
              onShowToast={showToast}
            />
          </div>
        )}

        {currentView === 'kamus-bosp' && (
          <div className="pt-20">
            <KamusBospPage
              onBack={() =>
                navigateTo(
                  previousView === 'kamus-bosp' ? 'landing' : previousView
                )
              }
              onReportNow={handleOpenReportFromHeader}
            />
          </div>
        )}
      </main>

      {/* =====================================================================
          SIMPLE & MODERN CIVIC FOOTER (SESUAI HALAMAN WEBSITE DARADIK)
         ===================================================================== */}
      <footer className="bg-[#F2EFE8] border-t border-[#C9DFDC] pt-10 sm:pt-12 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="max-w-6xl mx-auto">
          {/* Main Content: Brand & Navigation */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 sm:gap-10 pb-8 sm:pb-10 border-b border-[#C9DFDC]">
            {/* Left Column: Brand & Concise Mission */}
            <div className="max-w-md space-y-3">
              <button
                type="button"
                onClick={() => navigateTo('landing')}
                className="focus:outline-none group text-left inline-block"
                aria-label="DARADIK Beranda"
              >
                <img
                  src="/logo-daradik.png"
                  alt="Logo DARADIK"
                  className="h-7 w-auto object-contain select-none transition-opacity group-hover:opacity-85"
                />
              </button>

              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Platform keterbukaan data alokasi dan realisasi dana Bantuan Operasional Satuan Pendidikan (BOSP) serta kanal pelaporan warga yang aman dan independen.
              </p>
            </div>

            {/* Right Column: Real Navigable Pages on DARADIK */}
            <div className="flex flex-wrap sm:flex-nowrap gap-10 sm:gap-16">
              {/* Navigasi Utama */}
              <div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496] block mb-3 font-mono">
                  Navigasi
                </span>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateTo('landing')}
                      className="text-[#475569] hover:text-[#2E6496] transition-colors text-left"
                    >
                      Beranda
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateTo('kamus-bosp')}
                      className="text-[#475569] hover:text-[#2E6496] transition-colors text-left"
                    >
                      Kamus BOSP
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleOpenLiveTrackingFromHeader}
                      className="text-[#475569] hover:text-[#2E6496] transition-colors text-left"
                    >
                      Lacak Lapor
                    </button>
                  </li>
                </ul>
              </div>

              {/* Layanan Publik */}
              <div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496] block mb-3 font-mono">
                  Layanan Publik
                </span>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileTab('summary');
                        navigateTo('school-profile');
                      }}
                      className="text-[#475569] hover:text-[#2E6496] transition-colors text-left"
                    >
                      Profil Data Sekolah
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleOpenReportFromHeader}
                      className="inline-flex items-center gap-1.5 font-bold text-[#2E6496] hover:text-[#245385] transition-colors text-left"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Kirim Laporan Anonim</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Verified Badge */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[#64748B]">
            <div className="flex items-center gap-2 tabular-nums font-mono">
              <span>© 2026 DARADIK.</span>
              <span>•</span>
              <span className="font-sans">Transparansi Dana Pendidikan Indonesia</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
              <span>Kanal Pelaporan Terlindungi &amp; 100% Tanpa Identitas</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MODALS
         ===================================================================== */}
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
