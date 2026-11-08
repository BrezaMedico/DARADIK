import React, { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { ScrollRevealOnce } from './ScrollRevealOnce';

export const LandingVideoSection: React.FC = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  return (
    <section className="w-full bg-[#FAF8F5] pt-2 sm:pt-4 pb-12 sm:pb-16 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <ScrollRevealOnce>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2E6496] block mb-1">
                Video Perkenalan DARADIK
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                Mengenal Cara Kerja Pengawasan Dana Sekolah
              </h2>
              <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm md:text-base text-[#475569] max-w-2xl leading-relaxed">
                Tonton penjelasan singkat bagaimana DARADIK membantu orang tua, siswa, dan masyarakat memantau penggunaan dana BOSP secara terbuka.
              </p>
            </div>

            <a
              href="https://youtu.be/2TfgFusfSWQ?si=psa3osKWhADjRxYY"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#FFFFFF] border border-[#C9DFDC] hover:border-[#2E6496] text-[11px] sm:text-xs font-bold text-[#2E6496] shadow-xs transition-all shrink-0"
            >
              <span>Buka di YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] p-2.5 sm:p-3.5 shadow-md">
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-[#0F172A] border border-[#C9DFDC]/60">
              {isVideoPlaying ? (
                <iframe
                  src="https://www.youtube.com/embed/2TfgFusfSWQ?autoplay=1&rel=0&modestbranding=1"
                  title="Video Perkenalan DARADIK"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(true)}
                  className="group relative w-full h-full block text-left focus:outline-none cursor-pointer overflow-hidden"
                  aria-label="Putar Video Perkenalan DARADIK"
                >
                  <img
                    src="https://i.ytimg.com/vi/2TfgFusfSWQ/hqdefault.jpg"
                    alt="Thumbnail Video Perkenalan DARADIK"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#1A3D66]/35 to-[#0F172A]/20 transition-opacity duration-300 group-hover:opacity-90"
                    aria-hidden="true"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFFFFF]/90 group-hover:bg-[#FFFFFF] text-[#2E6496] flex items-center justify-center shadow-xl border border-white/80 transition-all duration-300 group-hover:scale-110">
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-[#2E6496] text-[#2E6496] ml-1" />
                    </div>
                    <span className="mt-3.5 px-3.5 py-1 rounded-full bg-[#0F172A]/65 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-[#FFFFFF]">
                      Putar Video Perkenalan
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex items-end justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold text-[#C9DFDC] block">
                        DARADIK — Transparansi Dana BOSP
                      </span>
                      <p className="text-sm sm:text-base font-bold text-[#FFFFFF] mt-0.5">
                        Pengenalan Platform &amp; Panduan Penggunaan untuk Publik
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </ScrollRevealOnce>
      </div>
    </section>
  );
};
