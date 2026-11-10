import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ReceiptText,
  ScanLine,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import { ScrollRevealOnce } from './ScrollRevealOnce';

interface CapabilityCardItem {
  num: string;
  title: string;
  desc: string;
  icon: typeof ReceiptText;
  action: () => void;
  actionLabel: string;
}

const CapabilityFeatureCard: React.FC<{
  card: CapabilityCardItem;
  idx: number;
  isGridVisible: boolean;
}> = ({ card, idx, isGridVisible }) => {
  const Icon = card.icon;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [boxSize, setBoxSize] = useState<{ w: number; h: number }>({ w: 420, h: 230 });

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const updateSize = () => {
      if (el.offsetWidth > 40 && el.offsetHeight > 40) {
        setBoxSize({ w: el.offsetWidth, h: el.offsetHeight });
      }
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = boxSize.w;
  const h = boxSize.h;
  // Stroke ditempatkan di luar frame kartu (jarak 3.5px dari sisi luar border 1px)
  const outset = 3.5;
  const svgPad = 7;
  const sw = w + svgPad * 2;
  const sh = h + svgPad * 2;
  const c = svgPad - outset;
  const cardRadius = Math.min(16, Math.floor(Math.min(w, h) / 4));
  const r = cardRadius + outset;
  const d = Number((r * (1 - Math.SQRT1_2)).toFixed(2));
  const sx = (c + d).toFixed(2);
  const sy = (c + d).toFixed(2);
  const ex = (sw - c - d).toFixed(2);
  const ey = (sh - c - d).toFixed(2);

  const topRightPath = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${c + r} ${c} L ${sw - c - r} ${c} A ${r} ${r} 0 0 1 ${sw - c} ${c + r} L ${sw - c} ${sh - c - r} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  const leftBottomPath = `M ${sx} ${sy} A ${r} ${r} 0 0 0 ${c} ${c + r} L ${c} ${sh - c - r} A ${r} ${r} 0 0 0 ${c + r} ${sh - c} L ${sw - c - r} ${sh - c} A ${r} ${r} 0 0 0 ${ex} ${ey}`;

  const staggerDelayClasses = [
    'card-stagger-1',
    'card-stagger-2',
    'card-stagger-3',
    'card-stagger-4',
  ];
  const mobileStackClass = `mobile-card-stack-${idx + 1}`;
  const gradId = `card-stroke-grad-${card.num}`;

  return (
    <div
      className={`scroll-reveal-slide-up mobile-card-stack-item ${mobileStackClass} h-full ${staggerDelayClasses[idx]} ${
        isGridVisible ? 'scroll-reveal-visible' : 'scroll-reveal-hidden'
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={card.action}
        aria-label={`${card.title} - ${card.actionLabel}`}
        className="group relative flex flex-col w-full text-left rounded-2xl border border-[#C9DFDC] bg-gradient-to-br from-[#F4F9FC]/90 via-[#FFFFFF] to-[#EAF3F8]/95 shadow-xs min-h-[210px] sm:min-h-[230px] h-full cursor-pointer daradik-feature-card"
      >
        <svg
          viewBox={`0 0 ${sw} ${sh}`}
          style={{
            left: `${-(svgPad + 1)}px`,
            top: `${-(svgPad + 1)}px`,
            width: `${sw}px`,
            height: `${sh}px`,
          }}
          className="daradik-card-stroke-svg"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66A3BF" />
              <stop offset="55%" stopColor="#2E6496" />
              <stop offset="100%" stopColor="#1D4F7A" />
            </linearGradient>
          </defs>
          <path
            d={topRightPath}
            pathLength={100}
            stroke={`url(#${gradId})`}
            strokeWidth={2.4}
            strokeLinecap="round"
            className="daradik-card-stroke-path"
          />
          <path
            d={leftBottomPath}
            pathLength={100}
            stroke={`url(#${gradId})`}
            strokeWidth={2.4}
            strokeLinecap="round"
            className="daradik-card-stroke-path"
          />
        </svg>

        <div className="relative flex-1 flex flex-col justify-between w-full p-5 sm:p-6 overflow-hidden rounded-[15px] daradik-card-glass-sweep">
          {/* Bagian Kiri Atas: Judul Diperbesar & Berwarna Biru Tua Senada Icon */}
          <div className="relative z-10 space-y-1.5">
            <h3 className="text-xl sm:text-[22px] font-extrabold text-[#2E6496] tracking-tight leading-snug">
              {card.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed pr-2">
              {card.desc}
            </p>
          </div>

          {/* Bagian Bawah: Nomor Ditempelkan ke Bawah Tanpa Jarak & Icon Tebal Senada Judul */}
          <div className="relative z-10 w-full mt-6 sm:mt-8 flex items-end justify-between -mb-5 sm:-mb-6">
            <div className="flex items-end">
              <span className="text-[76px] sm:text-[100px] font-black text-[#66A3BF]/30 tabular-nums tracking-tighter leading-[0.72] select-none pointer-events-none -ml-0.5">
                {card.num}
              </span>
            </div>

            <div className="pb-5 sm:pb-6">
              <Icon
                className="w-[52px] h-[52px] sm:w-16 sm:h-16 text-[#2E6496] stroke-[1.6] sm:stroke-[1.75] shrink-0 transition-transform duration-300 group-hover:scale-105"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

interface LandingFeaturesSectionProps {
  onOpenSearchPage: () => void;
  onOpenMessageScanner: () => void;
  onOpenAnonymousReport: () => void;
  onOpenLiveTracking: () => void;
  onOpenKamusModal: () => void;
}

export const LandingFeaturesSection: React.FC<LandingFeaturesSectionProps> = ({
  onOpenSearchPage,
  onOpenMessageScanner,
  onOpenAnonymousReport,
  onOpenLiveTracking,
  onOpenKamusModal,
}) => {
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;

    // Jika posisi scroll sudah berada di area seksi saat dimuat
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsGridVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsGridVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const capabilityCards = [
    {
      num: '1',
      title: 'Transparansi Sekolah',
      desc: 'Cari informasi alokasi dana BOSP sekolah, rincian kuitansi SIPLah resmi, dan dokumentasi bukti fisik lapangan secara terbuka.',
      icon: ReceiptText,
      action: onOpenSearchPage,
      actionLabel: 'Cari Data Sekolah',
    },
    {
      num: '2',
      title: 'Pemindai Pesan',
      desc: 'Periksa indikasi pungutan dari pesan WhatsApp wali murid secara otomatis untuk mencocokkan kewajaran dengan anggaran BOSP.',
      icon: ScanLine,
      action: onOpenMessageScanner,
      actionLabel: 'Buka Pemindai Pesan',
    },
    {
      num: '3',
      title: 'Laporan Anonim',
      desc: 'Kirim dugaan pelanggaran pungli melalui sistem laporan terenkripsi aman tanpa perlu khawatir identitas pribadi Anda terungkap.',
      icon: ShieldCheck,
      action: onOpenAnonymousReport,
      actionLabel: 'Buat Laporan',
    },
    {
      num: '4',
      title: 'Pelacakan Aduan',
      desc: 'Pantau perkembangan dan tindak lanjut laporan Anda bersama Dinas Pendidikan secara berkala cukup menggunakan kode tiket.',
      icon: SearchCheck,
      action: onOpenLiveTracking,
      actionLabel: 'Lacak Tiket',
    },
  ];

  const timelineSteps = [
    {
      step: '01',
      title: 'Temukan Informasi',
      desc: 'Cari sekolah tujuan dan telusuri pagu anggaran, pencairan dana BOSP, serta bukti pembelanjaan barang yang telah terverifikasi.',
    },
    {
      step: '02',
      title: 'Periksa dan Pahami',
      desc: 'Gunakan informasi data sekolah, regulasi juknis BOSP, dan bantuan analisis AI untuk membedakan iuran sukarela sah dari pungutan liar.',
    },
    {
      step: '03',
      title: 'Laporkan Temuan',
      desc: 'Kirim informasi pendukung atau foto kuitansi ke Inspektorat dan Dinas Pendidikan secara aman, terenkripsi, dan sepenuhnya anonim.',
    },
    {
      step: '04',
      title: 'Pantau Tindak Lanjut',
      desc: 'Gunakan nomor kode tiket rahasia untuk memantau status telaah, investigasi lapangan, hingga penyelesaian resmi dari petugas.',
    },
  ];

  return (
    <section className="w-full bg-[#FAF8F5] pt-10 sm:pt-14 pb-16 sm:pb-28 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* BAGIAN 1: GRID 2x2 CARD "Apa yang Bisa Dilakukan di DARADIK?" */}
        <ScrollRevealOnce className="mb-8 sm:mb-10 text-left">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496]">
            Fitur Utama Platform
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug mt-1">
            Apa yang Bisa Dilakukan di DARADIK?
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed max-w-2xl">
            Empat pilar utama untuk mengawal transparansi dana sekolah, memeriksa indikasi pungutan liar, dan melindungi hak pendidikan anak Anda.
          </p>
        </ScrollRevealOnce>

        {/* 2 x 2 Rectangular Cards Grid (Desktop) & Sticky Stacking Cards (Mobile) */}
        <div
          ref={gridContainerRef}
          className="mobile-card-stack-container grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pb-28 sm:pb-0"
        >
          {capabilityCards.map((card, idx) => (
            <CapabilityFeatureCard
              key={card.num}
              card={card}
              idx={idx}
              isGridVisible={isGridVisible}
            />
          ))}
        </div>

        {/* BAGIAN 2: TIMELINE VERTICAL ALUR KERJA (01, 02, 03, 04) */}
        <div className="mt-16 sm:mt-24 pt-10 sm:pt-14 border-t border-[#C9DFDC]">
          <ScrollRevealOnce className="mb-8 sm:mb-12 text-left">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496]">
              Alur Panduan Pengawasan
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug mt-1">
              Cara Kerja Kawal Dana Sekolah
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed max-w-2xl">
              Tahapan terstruktur dari menelusuri data awal sekolah hingga memantau penyelesaian resmi oleh Dinas Pendidikan.
            </p>
          </ScrollRevealOnce>

          <div className="relative pl-11 sm:pl-16">
            {/* Garis vertikal timeline yang menghubungkan titik tengah 01 hingga 04 secara konsisten */}
            <div
              className="absolute left-[15px] sm:left-[19px] top-4 sm:top-5 bottom-4 sm:bottom-5 w-[2px] bg-[#C9DFDC]"
              aria-hidden="true"
            />

            <div className="space-y-8 sm:space-y-11">
              {timelineSteps.map((stepItem, idx) => {
                return (
                  <ScrollRevealOnce
                    key={stepItem.step}
                    delayMs={idx * 60}
                    className="relative"
                  >
                    {/* Lingkaran nomor yang berada tepat di atas garis vertikal */}
                    <div className="absolute -left-11 sm:-left-16 top-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF8F5] border-2 border-[#2E6496] flex items-center justify-center font-bold text-xs sm:text-sm text-[#2E6496] shadow-sm select-none tabular-nums z-10">
                      {stepItem.step}
                    </div>

                    <div className="pt-0.5 max-w-2xl">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1E293B]">
                        {stepItem.title}
                      </h3>
                      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base text-[#475569] leading-relaxed">
                        {stepItem.desc}
                      </p>
                    </div>
                  </ScrollRevealOnce>
                );
              })}
            </div>
          </div>
        </div>

        {/* BAGIAN 3: REGULASI & PANDUAN HAK BELAJAR */}
        <ScrollRevealOnce delayMs={160} className="mt-14 sm:mt-20 pt-10 border-t border-[#C9DFDC]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496]">
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
