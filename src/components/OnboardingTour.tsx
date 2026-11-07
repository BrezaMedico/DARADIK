import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  BookOpen,
  Flag,
  HelpCircle,
  Sparkles,
  Scale,
  Package,
  ScanLine,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string;
  stepNum: string;
  title: string;
  description: string;
  tip?: string;
  icon: 'search' | 'kamus' | 'lacak' | 'lapor' | 'ai' | 'summary' | 'items' | 'wa';
}

const LANDING_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-search',
    targetSelector: '[data-tour-id="tour-search-box"]',
    stepNum: '1 dari 5',
    title: 'Cari Transparansi Sekolah',
    description:
      'Ketik nama sekolah atau NPSN untuk melihat rincian belanja BOSP Tahap 1 & 2, kuitansi realisasi fisik, dan cek kwitansi.',
    tip: 'Gunakan Filter Wilayah jika ingin menyaring provinsi, kota, atau kecamatan.',
    icon: 'search',
  },
  {
    id: 'step-kamus',
    targetSelector: '[data-tour-id="tour-kamus-bosp"]',
    stepNum: '2 dari 5',
    title: 'Kamus BOSP',
    description:
      'Pedoman Permendikdasmen untuk membedakan kebutuhan yang wajib ditanggung dana sekolah dan pungutan yang dilarang.',
    tip: 'Cari kata kunci seperti buku paket, seragam, atau uang gedung.',
    icon: 'kamus',
  },
  {
    id: 'step-lacak',
    targetSelector: '[data-tour-id="tour-lacak-lapor"]',
    stepNum: '3 dari 5',
    title: 'Lacak Lapor',
    description:
      'Pantau progres verifikasi aduan di Inspektorat lewat kode tiket dan kirim pesan balasan dua arah secara anonim.',
    tip: 'Riwayat tiket Anda tersimpan otomatis di perangkat ini.',
    icon: 'lacak',
  },
  {
    id: 'step-lapor',
    targetSelector: '[data-tour-id="tour-lapor"]',
    stepNum: '4 dari 5',
    title: 'Lapor Pungutan Liar',
    description:
      'Sampaikan dugaan pungutan tanpa akun atau nomor HP. Metadata lokasi dan perangkat pada foto bukti dibersihkan otomatis.',
    tip: 'Simpan kode tiket setelah kirim untuk memantau status aduan.',
    icon: 'lapor',
  },
  {
    id: 'step-tanya-bos',
    targetSelector: '[data-tour-id="tour-tanya-bos"], #bosp-chat-fab',
    stepNum: '5 dari 5',
    title: 'Tanya BOS',
    description:
      'Asisten interaktif cerdas untuk bertanya apa saja seputar alokasi dana BOSP, aturan pendidikan resmi, atau cara menggunakan fitur DARADIK.',
    tip: 'Bisa ditanya via ketikan teks maupun tombol suara mikrofon!',
    icon: 'ai',
  },
];

const PROFILE_TOUR_STEPS: TourStep[] = [
  {
    id: 'step-profile-summary',
    targetSelector: '[data-tour-id="tour-profile-summary"]',
    stepNum: '1 dari 3',
    title: 'Ringkasan Dana',
    description:
      'Lihat total pagu dana BOSP tahun berjalan, pencairan dana Tahap 1 dan Tahap 2, serta diagram persentase komposisi belanja sekolah.',
    tip: 'Informasi ini mempermudah memantau sisa pagu dan serapan anggaran sekolah.',
    icon: 'summary',
  },
  {
    id: 'step-profile-items',
    targetSelector: '[data-tour-id="tour-profile-items"]',
    stepNum: '2 dari 3',
    title: 'Hasil Belanja',
    description:
      'Daftar bukti riil pengeluaran BOSP sekolah, dilengkapi pencarian semantik item belanja, arsip foto fisik barang, dan dokumen nota kuitansi.',
    tip: 'Klik Lihat Bukti Fisik pada tiap item untuk memeriksa foto barang belanjaan asli.',
    icon: 'items',
  },
  {
    id: 'step-profile-wa',
    targetSelector: '[data-tour-id="tour-profile-wa"]',
    stepNum: '3 dari 3',
    title: 'Verifikasi Iuran WA',
    description:
      'Pindai dan verifikasi pesan tagihan atau iuran di grup WhatsApp sekolah untuk mencocokkan apakah pengeluaran tersebut sesuai aturan BOSP atau indikasi pungli.',
    tip: 'Cukup salin teks pesan WA atau unggah tangkapan layar chat grup komite.',
    icon: 'wa',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  tourType?: 'landing' | 'school-profile';
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Ambil elemen target pertama yang benar-benar terlihat. Satu langkah tour bisa
 * memiliki dua elemen (menu header di tablet/desktop, bottom nav di HP) dan
 * hanya salah satunya yang tampil pada ukuran layar tertentu.
 */
function findVisibleTarget(selector: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(selector)
  );
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return nodes[0] ?? null;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  tourType = 'landing',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const steps = tourType === 'school-profile' ? PROFILE_TOUR_STEPS : LANDING_TOUR_STEPS;
  const currentStep = steps[currentStepIndex];

  // Reset ke langkah pertama setiap kali tour dibuka atau berganti halaman
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen, tourType]);

  const updateSpotlightPosition = useCallback(() => {
    if (!isOpen) return;
    const step = steps[currentStepIndex];
    if (!step) return;

    const el = findVisibleTarget(step.targetSelector);
    setViewportSize({
      w: window.innerWidth,
      h: window.innerHeight,
    });

    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = step.id === 'step-search' ? 8 : 6;

    setTargetRect({
      top: Math.max(4, rect.top - pad),
      left: Math.max(4, rect.left - pad),
      width: Math.min(window.innerWidth - 8, rect.width + pad * 2),
      height: rect.height + pad * 2,
    });
  }, [isOpen, currentStepIndex, steps]);

  // Scroll otomatis ke elemen target saat langkah berubah
  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStepIndex];
    if (!step) return;

    const timer = setTimeout(() => {
      const el = findVisibleTarget(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const isInMobileBottomNav = Boolean(el.closest('.mobile-nav'));
        if (step.id === 'step-search') {
          // Posisikan kotak pencarian di area atas-tengah layar agar terlihat jelas berdampingan dengan kartu di kanan
          const desiredTop = window.innerWidth < 768 ? 72 : 130;
          const scrollTarget = window.scrollY + rect.top - desiredTop;
          window.scrollTo({
            top: Math.max(0, scrollTarget),
            behavior: 'smooth',
          });
        } else if (!isInMobileBottomNav) {
          // Untuk tombol di navbar atas desktop atau tab profil, sesuaikan posisi
          if (step.targetSelector.includes('tour-profile')) {
            el.click();
            const scrollTarget = window.scrollY + rect.top - 120;
            window.scrollTo({
              top: Math.max(0, scrollTarget),
              behavior: 'smooth',
            });
          } else if (window.scrollY > 80 && !step.targetSelector.includes('#bosp-chat-fab')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
      updateSpotlightPosition();
    }, 60);

    // Perbarui posisi beberapa kali selama animasi scroll berlangsung
    const interval = setInterval(updateSpotlightPosition, 80);
    const stopInterval = setTimeout(() => clearInterval(interval), 650);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearTimeout(stopInterval);
    };
  }, [isOpen, currentStepIndex, updateSpotlightPosition, steps]);

  // Pantau scroll & resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateSpotlightPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateSpotlightPosition]);

  // Navigasi keyboard (Esc, Panah Kanan/Kiri)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose, steps]);

  if (!isOpen || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const renderStepIcon = (iconType: TourStep['icon']) => {
    const cls = 'w-4 h-4 text-[#2E6496]';
    switch (iconType) {
      case 'search':
        return <Search className={cls} />;
      case 'kamus':
        return <BookOpen className={cls} />;
      case 'lacak':
        return <Search className={cls} />;
      case 'lapor':
        return <Flag className={cls} />;
      case 'ai':
        return <Sparkles className={cls} />;
      case 'summary':
        return <Scale className={cls} />;
      case 'items':
        return <Package className={cls} />;
      case 'wa':
        return <ScanLine className={cls} />;
      default:
        return <HelpCircle className={cls} />;
    }
  };

  // Hitung posisi kartu penjelasan agar selalu dekat dengan elemen yang disorot dan tidak menimpa elemen target
  const computeCardStyle = (): React.CSSProperties => {
    const isMobile = viewportSize.w < 640;
    const cardMaxWidth = isMobile ? viewportSize.w - 24 : 360;

    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${cardMaxWidth}px`,
      };
    }

    const estimatedCardHeight = cardRef.current?.offsetHeight || 220;
    const gap = 16;

    // Khusus langkah pertama (step-search): Pengguna meminta ditaruh di sebelah KANAN
    // agar kotak/tabel pencarian sekolah di sebelah kiri tidak tertimpa/tertutup kartu penjelasan.
    const spaceRight = viewportSize.w - (targetRect.left + targetRect.width);
    const canFitOnRight = (viewportSize.w >= 768 && spaceRight >= 300) || viewportSize.w >= 1024;

    if (currentStep.id === 'step-search' && canFitOnRight) {
      // Posisikan di sebelah kanan target
      let leftPos = targetRect.left + targetRect.width + gap;
      if (leftPos + cardMaxWidth > viewportSize.w - 16) {
        leftPos = viewportSize.w - cardMaxWidth - 20;
      }

      // Sejajarkan vertikal dengan target
      let topPos = targetRect.top;
      if (topPos + estimatedCardHeight > viewportSize.h - 16) {
        topPos = Math.max(80, viewportSize.h - estimatedCardHeight - 16);
      } else {
        topPos = Math.max(80, topPos);
      }

      return {
        top: `${Math.round(topPos)}px`,
        left: `${Math.round(leftPos)}px`,
        width: `${cardMaxWidth}px`,
      };
    }

    // Untuk langkah lainnya (Navbar buttons) atau fallback layar sangat kecil
    let leftPos = targetRect.left;
    if (currentStep.id !== 'step-search') {
      // Untuk tombol di kanan atas navbar, sejajarkan ke sisi kanan elemen atau tengah
      leftPos = targetRect.left + targetRect.width / 2 - cardMaxWidth / 2;
    }
    // Jaga agar tidak keluar batas kiri/kanan layar
    leftPos = Math.max(12, Math.min(leftPos, viewportSize.w - cardMaxWidth - 12));

    // Vertical alignment: utamakan di bawah elemen jika cukup ruang
    const spaceBelow = viewportSize.h - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;

    let topPos = targetRect.top + targetRect.height + gap;

    if (currentStep.id === 'step-search') {
      // Pada mobile sempit, pastikan kartu berada persis di bawah target (jangan pernah menimpa ke atas target)
      topPos = targetRect.top + targetRect.height + gap;
    } else if (spaceBelow < estimatedCardHeight + 20 && spaceAbove > spaceBelow) {
      // Letakkan di atas elemen jika ruang di bawah sempit
      topPos = Math.max(12, targetRect.top - estimatedCardHeight - gap);
    } else if (topPos + estimatedCardHeight > viewportSize.h - 12) {
      // Clamp agar bagian bawah kartu tetap terlihat di layar kecil
      topPos = Math.max(12, viewportSize.h - estimatedCardHeight - 12);
    }

    return {
      top: `${Math.round(topPos)}px`,
      left: `${Math.round(leftPos)}px`,
      width: `${cardMaxWidth}px`,
    };
  };

  // Panah penunjuk kecil menuju tombol di navbar / bottom nav
  const computeArrowLeftOffset = (): number | null => {
    if (!targetRect) return null;
    const isMobile = viewportSize.w < 640;
    const cardMaxWidth = isMobile ? viewportSize.w - 24 : 360;
    let cardLeft = targetRect.left;
    if (currentStep.id !== 'step-search') {
      cardLeft = targetRect.left + targetRect.width / 2 - cardMaxWidth / 2;
    }
    cardLeft = Math.max(12, Math.min(cardLeft, viewportSize.w - cardMaxWidth - 12));

    const targetCenter = targetRect.left + targetRect.width / 2;
    const arrowOffset = targetCenter - cardLeft;
    return Math.max(20, Math.min(cardMaxWidth - 20, arrowOffset));
  };

  const arrowLeft = computeArrowLeftOffset();
  const cardStyle = computeCardStyle();
  const cardLeftNum = Number(String(cardStyle.left).replace('px', ''));
  const cardTopNum = Number(String(cardStyle.top).replace('px', ''));

  const isCardRightOfTarget =
    targetRect !== null &&
    currentStep.id === 'step-search' &&
    cardLeftNum >= targetRect.left + targetRect.width - 20;

  const isCardBelowTarget =
    targetRect !== null &&
    !isCardRightOfTarget &&
    cardTopNum >= targetRect.top + targetRect.height - 10;

  const isCardAboveTarget =
    targetRect !== null &&
    !isCardRightOfTarget &&
    !isCardBelowTarget &&
    cardTopNum < targetRect.top;

  return (
    <div
      className="fixed inset-0 z-[10000] select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Penggunaan DARADIK"
    >
      {/* 1. SVG Dark Backdrop dengan Cutout Lubang Sorotan (Gelapkan Semua Layar Kecuali Tombol/Elemen Target) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      >
        <defs>
          <mask id="daradik-onboarding-spotlight-mask">
            {/* Putih = Gelapkan layar */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Hitam = Lubang transparan tepat pada elemen yang sedang dijelaskan */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx={14}
                ry={14}
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.76)"
          mask="url(#daradik-onboarding-spotlight-mask)"
        />
      </svg>

      {/* 2. Bingkai Sorotan (Highlight Ring) di Sekeliling Elemen Target */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
          className="fixed z-[10001] rounded-[14px] border-2 border-[#FFFFFF] ring-4 ring-[#2E6496]/60 shadow-[0_0_24px_rgba(46,100,150,0.45)] pointer-events-none transition-all duration-300 ease-out"
          aria-hidden="true"
        />
      )}

      {/* 3. Kartu Penjelasan Singkat (Popover Non-Slop) */}
      <div
        ref={cardRef}
        style={cardStyle}
        className="fixed z-[10002] bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 transition-all duration-300 ease-out animate-view-enter"
      >
        {/* Panah Penunjuk ke Elemen Target */}
        {isCardRightOfTarget ? (
          <div
            className="absolute -left-2 top-7 w-3.5 h-3.5 bg-[#FFFFFF] border-l border-b border-[#C9DFDC] rotate-45 pointer-events-none"
            aria-hidden="true"
          />
        ) : isCardBelowTarget && arrowLeft !== null ? (
          <div
            style={{ left: `${arrowLeft - 7}px` }}
            className="absolute -top-2 w-3.5 h-3.5 bg-[#FFFFFF] border-l border-t border-[#C9DFDC] rotate-45 pointer-events-none"
            aria-hidden="true"
          />
        ) : isCardAboveTarget && arrowLeft !== null ? (
          <div
            style={{ left: `${arrowLeft - 7}px` }}
            className="absolute -bottom-2 w-3.5 h-3.5 bg-[#FFFFFF] border-r border-b border-[#C9DFDC] rotate-45 pointer-events-none"
            aria-hidden="true"
          />
        ) : null}

        {/* Baris Atas: Langkah & Tombol Tutup */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6496]">
            {renderStepIcon(currentStep.icon)}
            <span>Langkah {currentStep.stepNum}</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Tutup panduan"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Judul & Penjelasan */}
        <div>
          <h3 className="text-base sm:text-[17px] font-extrabold text-[#1E293B] tracking-tight leading-snug">
            {currentStep.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mt-1">
            {currentStep.description}
          </p>
        </div>

        {/* Tips Singkat Praktis */}
        {currentStep.tip && (
          <div className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[11px] sm:text-xs text-[#475569] flex items-center gap-2">
            <span className="font-bold text-[#2E6496] shrink-0">Tips:</span>
            <span className="leading-normal">{currentStep.tip}</span>
          </div>
        )}

        {/* Footer Navigasi: Lewati, Indikator Titik, & Lanjut */}
        <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
          >
            Lewati
          </button>

          {/* Indikator Titik Langkah */}
          <div className="flex items-center gap-1" aria-hidden="true">
            {steps.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-4 bg-[#2E6496]'
                    : 'w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                }`}
                aria-label={`Ke langkah ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#475569] hover:text-[#1E293B] text-xs font-medium transition-colors cursor-pointer"
                aria-label="Langkah sebelumnya"
                title="Sebelumnya"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:translate-y-[1px]"
            >
              {isLastStep ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </>
              ) : (
                <>
                  <span>Lanjut</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

