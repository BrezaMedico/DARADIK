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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 sm:pb-16 text-left">
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

          {/* Kolom 2: Layanan Pengaduan */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Layanan Pengaduan
            </span>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={onNavigateReport}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5 text-[#C24136]" />
                  <span>Kirim Laporan Baru</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateTracking}
                  className="text-[#475569] hover:text-[#2E6496] transition-colors text-left cursor-pointer"
                >
                  Cek Tindak Lanjut Aduan
                </button>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-[#059669] font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Jaminan 100% Tanpa Akun</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Landasan Hukum */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Dasar Regulasi
            </span>
            <div className="space-y-3 text-xs text-[#475569]">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#CBD5E1]/60">
                <span className="font-bold text-[#1E293B] block">
                  Permendikdasmen No. 8/2026
                </span>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                  Petunjuk Teknis Pengelolaan Dana Bantuan Operasional Satuan Pendidikan.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#CBD5E1]/60">
                <span className="font-bold text-[#1E293B] block">
                  Permendikbud No. 75/2016
                </span>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                  Komite Sekolah & larangan pungutan uang operasional kepada wali murid.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom 4: Kontak & Bantuan Langsung */}
          <div className="space-y-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1E293B] block font-mono">
              Bantuan Pengguna
            </span>
            <div className="space-y-2.5 text-xs">
              <a
                href="https://wa.me/6285714963093?text=Halo%20Admin%20DARADIK,%20saya%20ingin%20bertanya%20mengenai%20website"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1]/70 text-[#1E293B] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EBF3F8] flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-[#2E6496]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#64748B] block">WhatsApp Resmi</span>
                  <span className="font-semibold text-xs text-[#2E6496] truncate block">
                    +62 857-1496-3093
                  </span>
                </div>
              </a>

              <a
                href="mailto:brezamedico08@gmail.com"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1]/70 text-[#1E293B] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EBF3F8] flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#2E6496]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#64748B] block">Surel Tim Teknis</span>
                  <span className="font-semibold text-xs text-[#2E6496] truncate block">
                    brezamedico08@gmail.com
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* SECTION 2: COPYRIGHT & ACTION BUTTONS */}
        <div className="border-t border-[#E2E8F0] py-6 sm:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 text-xs text-[#64748B]">
            <p className="font-semibold text-[#1E293B]">
              &copy; 2026 DARADIK. Seluruh hak cipta dilindungi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
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

            <a
              href="mailto:brezamedico08@gmail.com"
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Kirim Email (brezamedico08@gmail.com)"
              aria-label="Email Dukungan"
            >
              <Mail className="w-4 h-4 text-[#2E6496]" />
            </a>

            <button
              type="button"
              onClick={onNavigateReport}
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Buat Laporan Dugaan Anonim"
              aria-label="Lapor Dugaan Anonim"
            >
              <Flag className="w-4 h-4 text-[#C24136]" />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#CBD5E1] text-[#475569] hover:text-[#2E6496] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Bagikan Tautan Situs DARADIK"
              aria-label="Bagikan Situs"
            >
              <Share2 className="w-4 h-4 text-[#2E6496]" />
            </button>

            <div
              className="w-10 h-10 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] text-[#2E6496] flex items-center justify-center shadow-2xs select-none"
              title="Kanal Pelaporan Terenkripsi & 100% Tanpa Identitas"
              aria-label="Keamanan Terjamin"
            >
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            </div>
          </div>
        </div>

        {/* SECTION 3: WORDMARK BESAR "DARADIK" */}
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

