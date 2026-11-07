import React from 'react';
import {
  ShieldCheck,
  Flag,
  HelpCircle,
  Mail,
  Phone,
  Search,
  BookOpen,
  Share2,
  Lock,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

export interface FooterProps {
  onNavigateHome: () => void;
  onNavigateSearch: () => void;
  onNavigateKamus: () => void;
  onNavigateTracking: () => void;
  onNavigateReport: () => void;
  onStartTour: () => void;
  onShowToast?: (msg: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onNavigateSearch,
  onNavigateKamus,
  onNavigateTracking,
  onNavigateReport,
  onStartTour,
  onShowToast,
}) => {
  const handleShare = async () => {
    const shareData = {
      title: 'DARADIK — Transparansi Dana BOSP Sekolah',
      text: 'Pantau alokasi, pencairan tahap 1 & 2, serta laporkan dugaan penyimpangan dana BOSP secara 100% anonim di DARADIK.',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        onShowToast?.('Tautan situs DARADIK berhasil disalin ke papan klip.');
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#E2E8F0] pt-14 sm:pt-18 pb-2 sm:pb-4 px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* ===================================================================
            SECTION 1: 5-COLUMN NAVIGATION & ESSENTIAL INFORMATION GRID
           =================================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 sm:pb-16 text-left">
          {/* Kolom 1: Navigasi Platform */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Navigasi Platform
            </span>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Beranda Utama</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateSearch}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Pencarian Sekolah</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateKamus}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Kamus Aturan BOSP</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateTracking}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Lacak Status Tiket</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onStartTour}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#2E6496]" />
                  <span>Tur Panduan Fitur</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Kolom 2: Transparansi BOSP (Tautan Umum, Tanpa Mengarah ke Sekolah Tertentu) */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Transparansi BOSP
            </span>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={onNavigateSearch}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Cari Data BOSP Sekolah
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateKamus}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Pagu &amp; Alokasi per Siswa
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateKamus}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Aturan Belanja Pengadaan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onStartTour}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Panduan Cek Kuitansi &amp; Fisik
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateReport}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Kriteria Pelanggaran Dana
                </button>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Layanan Pelapor */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Layanan Pelapor
            </span>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={onNavigateReport}
                  className="font-bold text-[#2E6496] hover:text-[#245385] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Buat Laporan Anonim</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateTracking}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Cek Respon Laporan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateKamus}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Panduan Dugaan Penyimpangan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateReport}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-[#15803D]" />
                  <span>Jaminan Privasi Pelapor</span>
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/6285714963093?text=Halo%20Admin%20DARADIK,%20saya%20butuh%20pendampingan%20terkait%20dugaan%20pungli%20sekolah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Pendampingan Pelapor</span>
                  <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Regulasi & Kebijakan */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Regulasi &amp; Kebijakan
            </span>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="https://jdih.kemdikbud.go.id/detail_peraturan?main=3254"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left inline-flex items-center gap-1"
                >
                  <span>Permendikbudristek No. 63</span>
                  <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateKamus}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Juknis Penggunaan BOSP
                </button>
              </li>
              <li>
                <div className="text-[#475569] text-xs">
                  <span className="font-semibold text-[#1E293B] block">Jaminan Kerahasiaan</span>
                  <span className="text-[11px] text-[#64748B]">Bebas pelacakan IP &amp; data pribadi</span>
                </div>
              </li>
              <li>
                <div className="text-[#475569] text-xs">
                  <span className="font-semibold text-[#1E293B] block">Audit Trail Digital</span>
                  <span className="text-[11px] text-[#64748B]">Kuitansi SIPLah &amp; Bukti Geotag</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Kolom 5: Kontak & Pengaduan */}
          <div className="col-span-2 sm:col-span-1 space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Kontak &amp; Pengaduan
            </span>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li>
                <a
                  href="mailto:brezamedico08@gmail.com?subject=Konsultasi%20/%20Pengaduan%20BOSP%20DARADIK"
                  className="group block text-[#475569] hover:text-[#2E6496] transition-colors"
                >
                  <span className="text-[11px] text-[#64748B] block font-mono">Email:</span>
                  <span className="font-semibold text-[#1E293B] group-hover:text-[#2E6496] break-all">
                    brezamedico08@gmail.com
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/6285714963093?text=Halo%20Admin%20DARADIK,%20saya%20ingin%20berkonsultasi%20terkait%20dana%20BOSP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block text-[#475569] hover:text-[#2E6496] transition-colors"
                >
                  <span className="text-[11px] text-[#64748B] block font-mono">No:</span>
                  <span className="font-semibold text-[#1E293B] group-hover:text-[#2E6496] tabular-nums font-mono">
                    +6285714963093
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ===================================================================
            SECTION 2: HORIZONTAL DIVIDER, COPYRIGHT STANDAR & CC KELOMPOK VIOLET
           =================================================================== */}
        <div className="pt-8 pb-6 sm:pb-8 border-t border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          {/* Sisi Kiri: Copyright Standar & cc Kelompok VIOLET */}
          <div className="space-y-1 text-xs text-[#64748B]">
            <p className="font-semibold text-[#1E293B]">
              &copy; 2026 DARADIK. Seluruh hak cipta dilindungi.
            </p>
            <p className="text-[11px] text-[#64748B]">
              cc Kelompok VIOLET
            </p>
          </div>

          {/* Sisi Kanan: Action & Social Icon Buttons (Mengikuti Tata Letak Referensi) */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            {/* WhatsApp */}
            <a
              href="https://wa.me/6285714963093?text=Halo%20Admin%20DARADIK,%20saya%20ingin%20bertanya%20mengenai%20website"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Hubungi WhatsApp (+6285714963093)"
              aria-label="WhatsApp Hotline"
            >
              <Phone className="w-4 h-4 text-[#2E6496]" />
            </a>

            {/* Email */}
            <a
              href="mailto:brezamedico08@gmail.com"
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Kirim Email (brezamedico08@gmail.com)"
              aria-label="Email Dukungan"
            >
              <Mail className="w-4 h-4 text-[#2E6496]" />
            </a>

            {/* Lapor Cepat */}
            <button
              type="button"
              onClick={onNavigateReport}
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Buat Laporan Dugaan Anonim"
              aria-label="Lapor Dugaan Anonim"
            >
              <Flag className="w-4 h-4 text-[#C24136]" />
            </button>

            {/* Share Platform */}
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Bagikan Tautan Situs DARADIK"
              aria-label="Bagikan Situs"
            >
              <Share2 className="w-4 h-4 text-[#2E6496]" />
            </button>

            {/* Keamanan Terjamin */}
            <div
              className="w-10 h-10 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center shadow-2xs select-none"
              title="Kanal Pelaporan Terenkripsi & 100% Tanpa Identitas"
              aria-label="Keamanan Terjamin"
            >
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 3: WORDMARK BESAR "DARADIK" — SVG INLINE
            Teks sans-serif gagah, baseline di bawah viewBox supaya hanya
            bagian atas huruf yang terlihat. Gradasi memudar halus ke bawah.
           =================================================================== */}
        <div
          aria-hidden="true"
          className="w-full overflow-hidden select-none pointer-events-none"
          style={{ lineHeight: 0 }}
        >
          <svg
            viewBox="0 0 1200 190"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            className="w-full block"
            style={{
              display: 'block',
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.42) 28%, rgba(0,0,0,0.16) 62%, rgba(0,0,0,0) 92%)',
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.42) 28%, rgba(0,0,0,0.16) 62%, rgba(0,0,0,0) 92%)',
            }}
          >
            <text
              x="50%"
              y="180"
              textAnchor="middle"
              dominantBaseline="auto"
              fontFamily="'Arial Black', 'Arial', 'Helvetica Neue', sans-serif"
              fontWeight="900"
              fontSize="240"
              letterSpacing="-4"
              fill="#2E6496"
            >
              DARADIK
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
};
