import React, { useState, useEffect } from 'react';
import { Search, X, Flag } from 'lucide-react';
import { KAMUS_BOSP_DATA, type KamusBospItem } from '@/data';
import { fetchKamusBospFromSupabase } from '@/services/supabase';
import { BackButton } from '@/components/common/BackButton';

interface KamusBospPageProps {
  onBack: () => void;
  onReportNow: () => void;
}

type CategoryFilter = 'all' | 'allowed' | 'prohibited';

export const KamusBospPage: React.FC<KamusBospPageProps> = ({
  onBack,
  onReportNow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [kamusData, setKamusData] = useState<{
    allowed: KamusBospItem[];
    prohibited: KamusBospItem[];
  }>(KAMUS_BOSP_DATA);

  useEffect(() => {
    let cancelled = false;
    fetchKamusBospFromSupabase()
      .then((remote) => {
        if (!cancelled && remote) {
          setKamusData(remote);
        }
      })
      .catch(() => {
        // fallback to embedded data
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = searchQuery.trim().toLowerCase();

  const filteredAllowed = kamusData.allowed.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q) ||
      item.ref.toLowerCase().includes(q)
  );

  const filteredProhibited = kamusData.prohibited.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q) ||
      item.ref.toLowerCase().includes(q)
  );

  const totalResults = filteredAllowed.length + filteredProhibited.length;
  const showAllowed = activeCategory === 'all' || activeCategory === 'allowed';
  const showProhibited =
    activeCategory === 'all' || activeCategory === 'prohibited';

  return (
    <div className="w-full py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-view-enter">
        {/* Navigasi Kembali */}
        <div className="flex items-center justify-between gap-3">
          <BackButton onClick={onBack} label="Kembali ke Beranda" />
        </div>

      {/* Header Halaman */}
      <header className="pb-8 border-b border-[#C9DFDC]">
        <p className="text-xs sm:text-sm text-[#64748B]">
          Permendikdasmen No. 8 Tahun 2026 &amp; Petunjuk Teknis BOSP
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mt-1.5">
          Kamus BOSP
        </h1>
        <p className="text-sm sm:text-base text-[#475569] mt-2 leading-relaxed max-w-2xl">
          Batas kebutuhan operasional sekolah negeri yang dibiayai dana BOSP dan jenis pembiayaan yang tidak ditanggung sekolah.
        </p>

        {/* Filter & Pencarian Sederhana */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:gap-5"
            role="tablist"
            aria-label="Filter bagian regulasi"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              className={`min-h-[38px] text-xs sm:text-sm transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'text-[#1E293B] font-bold underline underline-offset-8 decoration-2 decoration-[#2E6496]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'allowed'}
              onClick={() => setActiveCategory('allowed')}
              className={`min-h-[38px] text-xs sm:text-sm transition-colors cursor-pointer ${
                activeCategory === 'allowed'
                  ? 'text-[#2E6496] font-bold underline underline-offset-8 decoration-2 decoration-[#2E6496]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Ditanggung BOSP
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'prohibited'}
              onClick={() => setActiveCategory('prohibited')}
              className={`min-h-[38px] text-xs sm:text-sm transition-colors cursor-pointer ${
                activeCategory === 'prohibited'
                  ? 'text-[#C24136] font-bold underline underline-offset-8 decoration-2 decoration-[#C24136]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Tidak Ditanggung BOSP
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari regulasi..."
              aria-label="Cari kata kunci regulasi BOSP"
              className="w-full pl-9 pr-8 py-2 text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-lg text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2E6496]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Konten Regulasi */}
      {totalResults === 0 ? (
        <div className="py-16 text-center text-[#64748B] text-sm">
          Tidak ditemukan ketentuan yang cocok dengan &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {/* Batasan Honorarium BOSP 2026 */}
          {activeCategory === 'all' && !q && (
            <section
              aria-labelledby="section-limit-heading"
              className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC]"
            >
              <h2
                id="section-limit-heading"
                className="text-sm sm:text-base font-bold text-[#1E293B]"
              >
                Ketentuan Batas Alokasi Honor Guru &amp; Tenaga Kependidikan (BOSP 2026)
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                Pasal 40 ayat (1) &amp; (2) Permendikdasmen No. 8 Tahun 2026:
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-[#C9DFDC] bg-[#FFFFFF]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <tbody className="divide-y divide-[#C9DFDC]">
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-[#1E293B]">
                        Komponen pembelajaran &amp; ekstrakurikuler
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#475569]">
                        Prioritas utama
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-[#1E293B]">
                        Pembayaran honor sekolah negeri
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#475569]">
                        Maksimal 20%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-[#1E293B]">
                        Pembayaran honor sekolah swasta
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#475569]">
                        Maksimal 40%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-[#1E293B]">
                        Komponen lainnya
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#475569]">
                        Sesuai kebutuhan dan ketentuan
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Bagian 1: Ditanggung Dana BOSP */}
          {showAllowed && filteredAllowed.length > 0 && (
            <section aria-labelledby="section-allowed-heading">
              <h2
                id="section-allowed-heading"
                className="text-lg sm:text-xl font-bold text-[#2E6496]"
              >
                Ditanggung Dana BOSP
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Kebutuhan berikut dibiayai dari dana BOSP, sehingga sekolah negeri tidak boleh memungutnya dari siswa.
              </p>

              <div className="mt-6 space-y-6">
                {filteredAllowed.map((item, idx) => (
                  <div key={idx}>
                    <h3 className="text-base font-semibold text-[#1E293B]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                    {item.ref && (
                      <p className="text-xs text-[#64748B] mt-1">
                        {item.ref}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bagian 2: Tidak Ditanggung Dana BOSP */}
          {showProhibited && filteredProhibited.length > 0 && (
            <section
              aria-labelledby="section-prohibited-heading"
              className={
                showAllowed && filteredAllowed.length > 0
                  ? 'pt-10 border-t border-[#C9DFDC]'
                  : ''
              }
            >
              <h2
                id="section-prohibited-heading"
                className="text-lg sm:text-xl font-bold text-[#C24136]"
              >
                Tidak Ditanggung Dana BOSP
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Hal berikut tidak boleh dibiayai dari BOSP, atau memang bukan tanggungan sekolah. Biayanya berasal dari sumber lain atau ditanggung orang tua.
              </p>

              <div className="mt-6 space-y-6">
                {filteredProhibited.map((item, idx) => (
                  <div key={idx}>
                    <h3 className="text-base font-semibold text-[#1E293B]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                    {item.ref && (
                      <p className="text-xs text-[#64748B] mt-1">
                        {item.ref}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Bagian Bawah: Pelaporan */}
      <div className="mt-14 pt-8 border-t border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#475569]">
          Menemukan tarikan iuran yang melanggar ketentuan di atas?
        </p>
        <button
          type="button"
          onClick={onReportNow}
          className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Flag className="w-4 h-4" aria-hidden="true" />
          <span>Buat Laporan Anonim</span>
        </button>
      </div>
      </div>
    </div>
  );
};

