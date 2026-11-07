import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Search,
} from 'lucide-react';
import { KAMUS_BOSP_DATA } from '@/data';

interface KamusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportNow: () => void;
}

type KamusCategory = 'all' | 'allowed' | 'prohibited';

export const KamusBospModal: React.FC<KamusModalProps> = ({
  isOpen,
  onClose,
  onReportNow,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<KamusCategory>('all');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = filterQuery.trim().toLowerCase();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/50 p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kamus-bosp-title"
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col bg-[#FAF8F5] border-t sm:border border-[#C9DFDC] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden my-0 sm:my-auto animate-school-item"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FAF8F5] border-b border-[#C9DFDC] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="kamus-bosp-title"
                className="font-sturdy-heading text-lg sm:text-xl font-bold text-[#1E293B]"
              >
                Kamus Regulasi BOSP
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC]">
                Permendikdasmen No. 8 Tahun 2026
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
              Panduan operasional bebas biaya dan batasan larangan pungutan di sekolah negeri.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="school-btn-secondary p-2 rounded-xl text-[#475569] hover:text-[#1E293B] cursor-pointer"
            aria-label="Tutup Kamus BOSP"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls: Segmented Tabs & Search */}
        <div className="px-5 sm:px-6 py-3 bg-[#FAF8F5] border-b border-[#C9DFDC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Segmented Control */}
          <div
            className="flex items-center p-1 bg-[#E8E4DC]/60 border border-[#C9DFDC] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Kategori Ketentuan"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-[#FFFFFF] text-[#1E293B] shadow-xs'
                  : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              Semua ({totalResults})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'allowed'}
              onClick={() => setActiveCategory('allowed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'allowed'
                  ? 'bg-[#FFFFFF] text-[#2E6496] shadow-xs'
                  : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#2E6496]" aria-hidden="true" />
              <span>Ditanggung BOSP ({filteredAllowed.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'prohibited'}
              onClick={() => setActiveCategory('prohibited')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'prohibited'
                  ? 'bg-[#FFFFFF] text-[#C24136] shadow-xs'
                  : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#C24136]" aria-hidden="true" />
              <span>Tidak Ditanggung BOSP ({filteredProhibited.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cari ketentuan..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] p-0.5 cursor-pointer"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF8F5]">
          {totalResults === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#475569]">
                Tidak ditemukan ketentuan dengan kata kunci &ldquo;{filterQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-[#2E6496] bg-[#EBF3F8] border border-[#C9DFDC] rounded-lg hover:bg-[#E0EDF5] cursor-pointer"
              >
                Reset pencarian
              </button>
            </div>
          ) : activeCategory === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Allowed Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#C9DFDC]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E6496]" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E6496]">
                      Ditanggung Dana BOSP
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-[#475569]">
                    Bebas Biaya
                  </span>
                </div>

                <div className="space-y-2.5">
                  {filteredAllowed.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl hover:border-[#A8C8C4] transition-colors"
                    >
                      <div className="font-semibold text-xs sm:text-sm text-[#1E293B]">
                        {item.title}
                      </div>
                      <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                      <div className="mt-2 text-[11px] text-[#64748B]">
                        {item.ref}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prohibited Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#C9DFDC]">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#C24136]" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#C24136]">
                      Tidak Ditanggung Dana BOSP
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-[#C24136]">
                    Bukan BOSP
                  </span>
                </div>

                <div className="space-y-2.5">
                  {filteredProhibited.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#FFFFFF] border border-[#FECACA]/70 rounded-xl hover:border-[#FECACA] transition-colors"
                    >
                      <div className="font-semibold text-xs sm:text-sm text-[#1E293B]">
                        {item.title}
                      </div>
                      <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                      <div className="mt-2 text-[11px] text-[#C24136]/90">
                        {item.ref}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeCategory === 'allowed' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredAllowed.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl hover:border-[#A8C8C4] transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs sm:text-sm text-[#1E293B]">
                        {item.title}
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#C9DFDC]/40 text-[11px] text-[#64748B]">
                    {item.ref}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredProhibited.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#FFFFFF] border border-[#FECACA]/70 rounded-xl hover:border-[#FECACA] transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs sm:text-sm text-[#1E293B]">
                        {item.title}
                      </div>
                      <AlertTriangle className="w-4 h-4 text-[#C24136] shrink-0 mt-0.5" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#FECACA]/40 text-[11px] text-[#C24136]/90">
                    {item.ref}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#C9DFDC] px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[#475569] text-center sm:text-left">
            Menemukan tarikan iuran sekolah yang bertentangan dengan ketentuan di atas?
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="school-btn-secondary flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportNow();
              }}
              className="school-btn-danger flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Lapor Pungutan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

