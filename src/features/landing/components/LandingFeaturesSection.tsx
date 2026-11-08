import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ReceiptText,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { ScrollRevealOnce } from './ScrollRevealOnce';

interface LandingFeaturesSectionProps {
  onOpenAnonymousReport: () => void;
  onOpenLiveTracking: () => void;
  onOpenKamusModal: () => void;
}

export const LandingFeaturesSection: React.FC<LandingFeaturesSectionProps> = ({
  onOpenAnonymousReport,
  onOpenLiveTracking,
  onOpenKamusModal,
}) => {
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);

  return (
    <section className="w-full bg-[#FAF8F5] pt-6 sm:pt-10 pb-16 sm:pb-28 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <ScrollRevealOnce className="mb-8 sm:mb-14 text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
            Satu tempat untuk tahu ke mana dana sekolah mengalir.
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed max-w-2xl">
            Tanpa istilah akuntansi yang rumit. Tiga fitur utama untuk memantau realisasi dana BOSP, memvalidasi bukti belanja fisik, dan melindungi hak siswa secara terbuka.
          </p>
        </ScrollRevealOnce>

        <div className="space-y-0">
          <ScrollRevealOnce delayMs={0} className="relative">
            <div className="flex items-start gap-3 sm:gap-6">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums">
                  01
                </div>
                <div className="w-[2px] bg-[#C9DFDC] flex-1 my-1.5 sm:my-2 min-h-[56px] sm:min-h-[80px]" />
              </div>

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
              </div>
            </div>
          </ScrollRevealOnce>

          <ScrollRevealOnce delayMs={60} className="relative">
            <div className="flex items-start gap-3 sm:gap-6">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums">
                  02
                </div>
                <div className="w-[2px] bg-[#C9DFDC] flex-1 my-1.5 sm:my-2 min-h-[56px] sm:min-h-[80px]" />
              </div>

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
              </div>
            </div>
          </ScrollRevealOnce>

          <ScrollRevealOnce delayMs={120} className="relative">
            <div className="flex items-start gap-3 sm:gap-6">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums">
                  03
                </div>
              </div>

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

        <ScrollRevealOnce delayMs={180} className="mt-16 sm:mt-20 pt-10 border-t border-[#C9DFDC]">
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
  );
};
