import React, { useState, useCallback, useEffect } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  X,
  ArrowUpRight,
  Globe,
  Mail,
  MessageSquare,
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
import {
  GeotagModal,
  InvoiceModal,
  KamusBospModal,
} from './components/Modals';

export type AppView =
  | 'landing'
  | 'school-profile'
  | 'anonymous-report'
  | 'live-tracking';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [previousView, setPreviousView] = useState<AppView>('landing');

  const [selectedSchool, setSelectedSchool] = useState<SchoolData>(
    SCHOOLS_DATABASE[0]
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>('summary');

  // Supabase Sync: Mengambil data sekolah dari Supabase jika database aktif
  useEffect(() => {
    async function loadSchoolFromSupabase() {
      try {
        const remote = await fetchSchoolFromSupabase('69994998');
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
  const [isKamusOpen, setIsKamusOpen] = useState<boolean>(false);
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
    setReportCategoryPrefill(
      'Iuran Kipas Angin (Tumpang Tindih dengan Dana BOSP Rp 35.000.000)'
    );
    setReportAttachmentPrefill('1 Foto Screenshot WA (Tersensor Otomatis)');
    navigateTo('anonymous-report');
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
      {/* =====================================================================
          WHITE LIQUID GLASS NAVBAR (TRANSPARANSI TIPIS, NEMBUS DIKIT)
         ===================================================================== */}
      <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 rounded-xl liquid-glass-nav-white flex items-center justify-between gap-4">
          {/* Left: Official DARADIK Logo */}
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-3 text-left focus:outline-none group"
            aria-label="Beranda DARADIK"
          >
            <img
              src="/logo-daradik.png"
              alt="Logo DARADIK"
              className="h-6 sm:h-7 w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
            />
          </button>

          {/* Right: 2 Clean Menus (Kamus BOSP & Lacak Lapor) + 1 CTA Button (Lapor) */}
          <nav
            className="flex items-center gap-2 sm:gap-3"
            aria-label="Navigasi Utama DARADIK"
          >
            {/* Menu 1: Kamus BOSP */}
            <button
              type="button"
              onClick={() => setIsKamusOpen(true)}
              className="nav-link-interactive px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#1E293B] hover:text-[#2E6496] hover:bg-[#C9DFDC]/35 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 hidden sm:inline text-[#2E6496]" />
              <span>Kamus BOSP</span>
            </button>

            {/* Menu 2: Lacak Lapor */}
            <button
              type="button"
              onClick={() => navigateTo('live-tracking')}
              className={`nav-link-interactive px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
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
              className="px-5 py-2 rounded-lg daradik-cta-subtle text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px]"
            >
              Lapor
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
            onOpenLiveTracking={() => navigateTo('live-tracking')}
            onOpenKamusModal={() => setIsKamusOpen(true)}
          />
        )}

        {currentView === 'school-profile' && (
          <div className="pt-20">
            <SchoolProfilePage
              school={selectedSchool}
              activeTab={profileTab}
              onTabChange={setProfileTab}
              onBackToLanding={() => navigateTo('landing')}
              onOpenKamusModal={() => setIsKamusOpen(true)}
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
      </main>

      {/* =====================================================================
          COMPREHENSIVE CIVIC FOOTER (LEBIH BERISI DENGAN HALAMAN & LAYANAN)
         ===================================================================== */}
      <footer className="bg-[#F2EFE8] border-t border-[#C9DFDC] pt-14 pb-10 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-6xl mx-auto">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-[#C9DFDC]">
            {/* Col 1: Brand & Purpose (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <button
                type="button"
                onClick={() => navigateTo('landing')}
                className="focus:outline-none group text-left"
                aria-label="DARADIK Beranda"
              >
                <img
                  src="/logo-daradik.png"
                  alt="Logo DARADIK"
                  className="h-7 w-auto object-contain select-none transition-opacity group-hover:opacity-85"
                />
              </button>

              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-[36ch]">
                Platform pengawasan independen dan transparansi dana Bantuan Operasional Satuan Pendidikan (BOSP) berbasis data terbuka dan pelaporan 100% anonim.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-mono text-[#2E6496]">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                <span>Status: Sistem Terhubung &amp; Terverifikasi</span>
              </div>
            </div>

            {/* Col 2: Navigasi Layanan Utama (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#1E293B] font-bold">
                Layanan &amp; Fitur
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-[#475569]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileTab('summary');
                      navigateTo('school-profile');
                    }}
                    className="hover:text-[#2E6496] transition-colors text-left"
                  >
                    Ringkasan Pagu &amp; Pencairan BOSP
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileTab('items-ai');
                      navigateTo('school-profile');
                    }}
                    className="hover:text-[#2E6496] transition-colors text-left"
                  >
                    Validasi Nota &amp; Geotagging Kelas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileTab('wa-scanner');
                      navigateTo('school-profile');
                    }}
                    className="hover:text-[#2E6496] transition-colors text-left"
                  >
                    Pemindai Iuran Grup WhatsApp (AI)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenReportFromHeader}
                    className="hover:text-[#2E6496] transition-colors text-left font-medium"
                  >
                    Kirim Laporan Whistleblowing (Anonim)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateTo('live-tracking')}
                    className="hover:text-[#2E6496] transition-colors text-left"
                  >
                    Pelacakan Tiket Laporan &amp; Chat Petugas
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Regulasi & Acuan Juknis (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#1E293B] font-bold">
                Regulasi Resmi
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-[#475569]">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsKamusOpen(true)}
                    className="hover:text-[#2E6496] transition-colors text-left font-medium"
                  >
                    Kamus Juknis BOSP
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsKamusOpen(true)}
                    className="hover:text-[#2E6496] transition-colors text-left"
                  >
                    Permendikbud 63/2023
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsKamusOpen(true)}
                    className="hover:text-[#2E6496] transition-colors text-left"
                  >
                    Permendikbud 75/2016
                  </button>
                </li>
                <li>
                  <span className="text-[#475569]/80 block text-xs">
                    UU KIP No. 14/2008
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 4: Bantuan & Kontak Publik (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#1E293B] font-bold">
                Kontak &amp; Verifikasi
              </h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Saluran pengaduan terenkripsi diawasi langsung oleh Inspektorat Daerah dan Dinas Pendidikan.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Surel resmi pelaporan disalin: lapor@daradik.id'
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#2E6496] hover:bg-[#2E6496] hover:text-[#FFFFFF] hover:border-[#2E6496] transition-all flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">lapor@daradik.id</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Kanal sosial media resmi disalin: @daradik.id'
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-medium text-[#2E6496] hover:bg-[#2E6496] hover:text-[#FFFFFF] hover:border-[#2E6496] transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>Instagram &amp; X: @daradik.id</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Guarantee Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono tabular-nums">
                © 2026 DARADIK. Hak Cipta Dilindungi.
              </span>
              <span>•</span>
              <span>Enkripsi Zero-Knowledge Whistleblowing Aktif</span>
            </div>

            <div className="flex items-center gap-4 font-medium">
              <button
                type="button"
                onClick={() => navigateTo('landing')}
                className="hover:text-[#2E6496] transition-colors"
              >
                Beranda
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsKamusOpen(true)}
                className="hover:text-[#2E6496] transition-colors"
              >
                Kamus BOSP
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigateTo('live-tracking')}
                className="hover:text-[#2E6496] transition-colors"
              >
                Lacak Lapor
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleOpenReportFromHeader}
                className="hover:text-[#2E6496] transition-colors text-[#2E6496] font-bold"
              >
                Lapor
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MODALS
         ===================================================================== */}
      <KamusBospModal
        isOpen={isKamusOpen}
        onClose={() => setIsKamusOpen(false)}
        onReportNow={handleOpenReportFromHeader}
      />

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
