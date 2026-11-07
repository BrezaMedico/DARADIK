import React, { useState } from 'react';
import { ArrowLeft, Search, X, Flag } from 'lucide-react';
import { KAMUS_BOSP_DATA } from '../data/schoolsData';

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

  const q = searchQuery.trim().toLowerCase();

  const filteredAllowed = KAMUS_BOSP_DATA.allowed.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q) ||
      item.ref.toLowerCase().includes(q)
  );

  const filteredProhibited = KAMUS_BOSP_DATA.prohibited.filter(
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 animate-view-enter">
      {/* Navigasi Kembali */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#2E6496] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali</span>
        </button>
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

          <div className="relative w-full sm:w-56">
            <Search
              className="w-4 h-4 text-[#64748B] absolute left-3 sm:left-0 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ketentuan..."
              aria-label="Cari ketentuan BOSP"
              className="w-full min-h-[42px] sm:min-h-0 pl-9 sm:pl-6 pr-8 sm:pr-6 py-2 sm:py-1 text-sm bg-[#FFFFFF] sm:bg-transparent border sm:border-0 sm:border-b border-[#C9DFDC] rounded-xl sm:rounded-none text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:border-[#2E6496]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 sm:right-0 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] p-1 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Isi Per Bagian (Tanpa Tabel / Kotak) */}
      {totalResults === 0 ? (
        <div className="py-12">
          <p className="text-sm text-[#475569]">
            Tidak ditemukan ketentuan untuk &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm font-semibold text-[#2E6496] hover:underline cursor-pointer"
          >
            Tampilkan semua
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {/* Batas Alokasi Penggunaan Dana BOSP 2026 */}
          {showAllowed && !q && (
            <section aria-labelledby="section-allocation-limits">
              <h2
                id="section-allocation-limits"
                className="text-lg sm:text-xl font-bold text-[#1E293B]"
              >
                Ketentuan Batas Alokasi Penggunaan BOSP 2026
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Batasan persentase penggunaan dana sesuai petunjuk teknis Kemendikdasmen untuk menjaga mutu pembelajaran dan sarana sekolah.
              </p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-[#C9DFDC]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#C9DFDC] text-[#475569]">
                      <th className="py-2.5 px-3.5 font-bold">Komponen</th>
                      <th className="py-2.5 px-3.5 font-bold">Ketentuan Kemendikdasmen 2026</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9DFDC]/60 bg-[#FFFFFF]">
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-[#1E293B]">
                        Pengembangan perpustakaan / buku
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#2E6496]">
                        Minimal 10%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-[#1E293B]">
                        Pemeliharaan sarana dan prasarana
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#475569]">
                        Maksimal 20%
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
  );
};
