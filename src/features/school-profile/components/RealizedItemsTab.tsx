import React, { useState } from 'react';
import {
  Search,
  X,
  Loader2,
  Info,
  Calendar,
  MapPin,
  ChevronDown,
  FileText,
  Camera,
  AlertTriangle,
  Wind,
  Paintbrush,
  BookMarked,
  Monitor,
  Droplets,
  Armchair,
  CheckCircle2,
} from 'lucide-react';
import type { BospRealizationItem } from '@/types/school';
import type { SemanticSearchResultItem } from '@/utils';
import { formatRupiah } from '@/utils';

const QUICK_CHIPS = [
  'buku pelajaran',
  'kertas & atk',
  'toilet & sanitasi',
  'meja kursi',
  'kipas angin',
  'wifi & internet',
  'proyektor',
];

interface RealizedItemsTabProps {
  currentItems: BospRealizationItem[];
  committedQuery: string;
  searchResult: {
    results: SemanticSearchResultItem[];
    totalFound: number;
  };
  expandedItemId: string;
  setExpandedItemId: (id: string) => void;
  onExecuteSearch: (query?: string) => void;
  onClearSearch: () => void;
  onOpenInvoiceModal: (item: BospRealizationItem) => void;
  onOpenGeotagModal: (item: BospRealizationItem) => void;
  onReportFromItem: (item: BospRealizationItem) => void;
}

export const RealizedItemsTab: React.FC<RealizedItemsTabProps> = ({
  currentItems,
  committedQuery,
  searchResult,
  expandedItemId,
  setExpandedItemId,
  onExecuteSearch,
  onClearSearch,
  onOpenInvoiceModal,
  onOpenGeotagModal,
  onReportFromItem,
}) => {
  const [searchInput, setSearchInput] = useState<string>(committedQuery);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      onExecuteSearch(searchInput);
      setIsSearching(false);
    }, 180);
  };

  const handleSelectQuickChip = (chip: string) => {
    setSearchInput(chip);
    setIsSearching(true);
    setTimeout(() => {
      onExecuteSearch(chip);
      setIsSearching(false);
    }, 180);
  };

  const handleResetSearch = () => {
    setSearchInput('');
    onClearSearch();
  };

  const renderItemIcon = (type: BospRealizationItem['iconType']) => {
    const iconProps = { className: 'w-5 h-5 text-[#2E6496] shrink-0' };
    switch (type) {
      case 'fan':
        return <Wind {...iconProps} />;
      case 'paint':
        return <Paintbrush {...iconProps} />;
      case 'book':
        return <BookMarked {...iconProps} />;
      case 'projector':
        return <Monitor {...iconProps} />;
      case 'sanitation':
        return <Droplets {...iconProps} />;
      case 'desk':
        return <Armchair {...iconProps} />;
    }
  };

  const renderMatchBadge = (res: SemanticSearchResultItem) => {
    switch (res.matchCategory) {
      case 'exact':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-semibold text-[#2E6496]">
            <CheckCircle2 className="w-3 h-3 text-[#2E6496]" />
            <span>Cocok Persis</span>
          </span>
        );
      case 'synonym':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-medium text-[#2E6496]">
            Istilah Serupa
          </span>
        );
      case 'fuzzy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[11px] font-medium text-[#B45309]">
            Koreksi Ejaan
          </span>
        );
      case 'semantic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[11px] font-medium text-[#2E6496]">
            Kategori Terkait
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Quick Filter Card */}
      <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-3xl p-5 sm:p-6 shadow-xs animate-school-item">
        <div className="mb-3.5">
          <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] tracking-tight">
            Daftar Realisasi Pembelanjaan BOSP (TA 2026)
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Periksa bukti nota kuitansi dan lokasi fisik barang yang dibeli sekolah menggunakan dana BOSP.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#2E6496] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari barang BOSP: buku pelajaran, kertas atk, toilet, meja kursi, kipas angin, wifi..."
              className="w-full pl-11 pr-9 py-3 text-sm bg-[#FAF8F5] border border-[#C9DFDC] rounded-full text-[#1E293B] font-medium placeholder:text-[#94A3B8] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496] transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#1E293B] rounded-full cursor-pointer"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 rounded-full bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-sm font-bold shadow-xs active:translate-y-[1px] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-[#FFFFFF]" />
                <span>Cari Barang</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Chips */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#64748B] mr-1 font-medium">
            Pencarian cepat:
          </span>
          {QUICK_CHIPS.map((chip) => {
            const isActive =
              committedQuery.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleSelectQuickChip(chip)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#2E6496] text-[#FFFFFF] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#475569] border border-[#C9DFDC] hover:bg-[#EBF3F8] hover:text-[#1E293B]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {committedQuery && (
          <div className="mt-4 pt-3 border-t border-[#C9DFDC]/60 flex items-center justify-between text-xs text-[#475569]">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#2E6496]" />
              <span>
                Hasil pencarian:{' '}
                <strong className="text-[#1E293B]">
                  &ldquo;{committedQuery}&rdquo;
                </strong>{' '}
                ({searchResult.totalFound} barang ditemukan)
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetSearch}
              className="font-bold text-[#2E6496] hover:underline cursor-pointer"
            >
              Tampilkan Semua
            </button>
          </div>
        )}
      </div>

      {/* Item Cards List */}
      <div
        className="space-y-3 animate-school-item"
        style={{ animationDelay: '90ms' }}
      >
        {searchResult.results.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#C9DFDC] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1E293B]">
                Barang Tidak Ditemukan
              </h4>
              <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto mt-1 leading-relaxed">
                Barang dengan kata kunci{' '}
                <strong className="text-[#1E293B]">
                  &ldquo;{committedQuery}&rdquo;
                </strong>{' '}
                tidak tercatat dalam pembelanjaan BOSP tahun 2026.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSearch}
              className="school-btn-secondary px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
            >
              Tampilkan Semua Barang ({currentItems.length})
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResult.results.map((res) => {
              const item = res.item;
              const isExpanded = expandedItemId === item.id;
              const cleanRoomLabel = item.geotag?.roomLabel
                ? item.geotag.roomLabel
                    .split('\u2014')[0]
                    .split(' - ')[0]
                    .trim()
                : 'Ruang Kelas';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 ease-out overflow-hidden ${
                    isExpanded
                      ? 'bg-[#FFFFFF] border-[#2E6496] shadow-xs'
                      : 'bg-[#FFFFFF] border-[#C9DFDC] hover:border-[#66A3BF]'
                  }`}
                >
                  <div
                    onClick={() =>
                      setExpandedItemId(isExpanded ? '' : item.id)
                    }
                    className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-full bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-[#2E6496]">
                        {renderItemIcon(item.iconType)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E293B] leading-snug tracking-tight">
                            {item.name}
                          </h3>
                          {committedQuery && renderMatchBadge(res)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-[#475569]">
                          <span className="font-semibold text-[#1E293B]">
                            {item.unitSummary}
                          </span>
                          <span
                            className="text-[#CBD5E1]"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>{item.date}</span>
                          </span>
                          <span
                            className="text-[#CBD5E1]"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#2E6496] font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#2E6496]" />
                            <span>{cleanRoomLabel}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#C9DFDC]/50 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-[#64748B] block font-medium">
                          Total Biaya
                        </span>
                        <div className="text-base sm:text-lg font-extrabold text-[#2E6496] tabular-nums tracking-tight">
                          {formatRupiah(item.amount)}
                        </div>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-200 ${
                          isExpanded
                            ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                            : 'bg-[#FAF8F5] border-[#C9DFDC] text-[#475569]'
                        }`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ease-out ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3.5 sm:px-5 pb-4 sm:pb-5 pt-3 bg-[#FAF8F5] border-t border-[#C9DFDC]/60 space-y-3.5 sm:space-y-4 text-xs sm:text-sm school-expand-panel">
                      <div className="rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] divide-y divide-[#C9DFDC]/60 overflow-hidden">
                        <div className="p-3.5 sm:p-4">
                          <span className="text-xs font-bold text-[#2E6496] block mb-1">
                            Tujuan Penggunaan
                          </span>
                          <p className="text-[#1E293B] leading-relaxed">
                            {item.allocation}
                          </p>
                        </div>

                        {item.invoice?.lineItems && item.invoice.lineItems.length > 0 && (
                          <div className="p-3.5 sm:p-4 space-y-2">
                            <span className="text-xs font-bold text-[#475569] block">
                              Rincian Barang yang Dibeli
                            </span>
                            <div className="divide-y divide-[#C9DFDC]/40">
                              {item.invoice.lineItems.map((li, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between py-2 first:pt-1 last:pb-0 gap-1 sm:gap-3"
                                >
                                  <div className="flex items-start sm:items-center gap-2 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6496] shrink-0 mt-1.5 sm:mt-0" />
                                    <span className="font-medium text-[#1E293B] break-words sm:truncate">
                                      {li.name}
                                    </span>
                                    <span className="text-xs text-[#64748B] shrink-0 tabular-nums">
                                      ({li.qty})
                                    </span>
                                  </div>
                                  <span className="font-bold font-mono text-[#2E6496] tabular-nums shrink-0 pl-3.5 sm:pl-0">
                                    {formatRupiah(li.subtotal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-3.5 sm:p-4 flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-bold text-[#1E293B] block">
                              Lokasi Ruangan:{' '}
                              {item.geotag?.roomLabel
                                ? item.geotag.roomLabel.replace('\u2014', '-')
                                : '-'}
                            </span>
                            <p className="text-[#475569] mt-0.5">
                              Catatan pemeriksaan: &ldquo;
                              {item.geotag?.inspectorNote || 'Pemeriksaan fisik sesuai pembelanjaan'}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-0.5">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenInvoiceModal(item)}
                            className="min-h-[42px] school-btn-secondary px-3 sm:px-4 py-2 rounded-full text-xs font-semibold text-[#2E6496] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                            <span>Lihat Kuitansi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenGeotagModal(item)}
                            className="min-h-[42px] school-btn-secondary px-3 sm:px-4 py-2 rounded-full text-xs font-semibold text-[#2E6496] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                            <span>Lihat Bukti Fisik</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onReportFromItem(item)}
                          className="min-h-[42px] px-4 py-2 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-xs font-bold text-[#DC2626] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                          <span>Laporkan Jika Tidak Ada</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

