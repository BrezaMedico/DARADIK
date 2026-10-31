import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Printer,
  Flag,
  BookOpen,
  Search,
  Check,
  Navigation,
  FileCheck2,
} from 'lucide-react';
import {
  BospRealizationItem,
  KAMUS_BOSP_DATA,
  SchoolData,
  formatRupiah,
} from '../data/schoolsData';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kamus-bosp-title"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#FAF8F5] border border-[#C9DFDC] rounded-2xl shadow-xl overflow-hidden my-auto animate-school-item"
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
        <div className="bg-[#FAF8F5] border-t border-[#C9DFDC] px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[#475569] text-center sm:text-left">
            Menemukan tarikan iuran sekolah yang bertentangan dengan ketentuan di atas?
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="school-btn-secondary px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportNow();
              }}
              className="school-btn-danger px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Flag className="w-4 h-4" aria-hidden="true" />
              <span>Lapor Pungutan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InvoiceModalProps {
  item: BospRealizationItem | null;
  school: SchoolData;
  onClose: () => void;
  onReportItem: (item: BospRealizationItem) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  item,
  school,
  onClose,
  onReportItem,
}) => {
  const [printedNotice, setPrintedNotice] = useState(false);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/60 p-4 overflow-y-auto backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xl overflow-hidden my-8 animate-school-item"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="bg-[#FAF8F5] border-b border-[#C9DFDC] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#2E6496]" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] block font-semibold">
                Arsip Bukti Nota SIPLah
              </span>
              <h2 id="invoice-modal-title" className="text-base font-bold text-[#1E293B]">
                {item.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="school-btn-secondary p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
            aria-label="Tutup modal bukti nota"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper Surface */}
        <div className="p-6 bg-[#FAF8F5]">
          <div className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-xl p-6 shadow-xs">
            {/* Vendor & Invoice Number Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#C9DFDC]/60">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#EBF3F8] text-[#2E6496] border border-[#C9DFDC] mb-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#2E6496]" />
                  Bukti Lunas SIPLah
                </span>
                <h3 className="text-base font-bold text-[#1E293B]">
                  {item.invoice.vendorName}
                </h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  {item.invoice.vendorAddress}
                </p>
                <p className="text-xs font-mono text-[#475569] mt-1 tabular-nums">
                  NPWP: {item.invoice.npwp}
                </p>
              </div>
              <div className="sm:text-right font-mono">
                <div className="text-[11px] text-[#475569]">NO. INVOICE</div>
                <div className="text-sm font-bold text-[#1E293B] tabular-nums">
                  {item.invoice.number}
                </div>
                <div className="text-[11px] text-[#475569] mt-2">TANGGAL</div>
                <div className="text-xs font-semibold text-[#1E293B] tabular-nums">
                  {item.invoice.date} ({item.stage})
                </div>
              </div>
            </div>

            {/* Buyer School Info */}
            <div className="py-3 border-b border-[#C9DFDC]/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#475569] block">Satuan Pendidikan Penerima:</span>
                <span className="font-bold text-[#1E293B]">
                  {school.name} (NPSN <span className="font-mono tabular-nums">{school.npsn}</span>)
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[#475569] block">Kode Anggaran RKAS:</span>
                <span className="font-mono font-semibold text-[#2E6496] tabular-nums">
                  {item.code}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#C9DFDC] text-[11px] font-mono uppercase text-[#475569]">
                    <th className="py-2 pr-3">Uraian Barang / Pekerjaan</th>
                    <th className="py-2 px-3 text-right">Volume</th>
                    <th className="py-2 px-3 text-right">Harga Satuan</th>
                    <th className="py-2 pl-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9DFDC]/40 text-xs">
                  {item.invoice.lineItems.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-3 font-medium text-[#1E293B]">
                        {line.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#475569] tabular-nums whitespace-nowrap">
                        {line.qty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#475569] tabular-nums whitespace-nowrap">
                        {formatRupiah(Math.round(line.unitPrice))}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono font-semibold text-[#1E293B] tabular-nums whitespace-nowrap">
                        {formatRupiah(line.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#1E293B] bg-[#FAF8F5]">
                    <td
                      colSpan={3}
                      className="py-3 px-3 text-xs font-bold uppercase text-[#1E293B]"
                    >
                      Total Realisasi BOSP ({item.stage})
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base font-bold text-[#2E6496] tabular-nums whitespace-nowrap">
                      {formatRupiah(item.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Stamp & Signatures */}
            <div className="mt-6 pt-4 border-t border-[#C9DFDC]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-28 h-14 shrink-0"
                  viewBox="0 0 180 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="4"
                    y="4"
                    width="172"
                    height="72"
                    rx="6"
                    stroke="#2E6496"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="160"
                    height="60"
                    rx="4"
                    stroke="#2E6496"
                    strokeWidth="1"
                  />
                  <text
                    x="90"
                    y="36"
                    textAnchor="middle"
                    fill="#2E6496"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    fontSize="16"
                    letterSpacing="2"
                  >
                    LUNAS BOSP
                  </text>
                  <text
                    x="90"
                    y="54"
                    textAnchor="middle"
                    fill="#2E6496"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    fontSize="10"
                  >
                    TERVERIFIKASI ARKAS 2026
                  </text>
                </svg>
                <div className="text-xs text-[#475569]">
                  <div className="font-semibold text-[#1E293B]">
                    Peruntukan Fisik:
                  </div>
                  <div>{item.allocation}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-l border-[#C9DFDC] pl-4 shrink-0">
                <div>
                  <span className="text-[#475569] block">Bendahara BOSP</span>
                  <span className="font-semibold text-[#1E293B] mt-2 block">
                    {item.invoice.treasurerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#475569] block">Kepala Sekolah</span>
                  <span className="font-semibold text-[#1E293B] mt-2 block">
                    {item.invoice.principalName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {printedNotice && (
            <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] text-xs text-[#2E6496] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E6496]" />
              <span>
                Salinan arsip nota {item.invoice.number} siap dicetak / diunduh sebagai bukti audit wali murid.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#FAF8F5] border-t border-[#C9DFDC] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onReportItem(item);
            }}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl hover:bg-[#FEE2E2] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Laporkan Kejanggalan Nota Ini</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setPrintedNotice(true)}
              className="school-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#2E6496]" />
              <span>Unduh Salinan Nota</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="school-btn-primary px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GeotagModalProps {
  item: BospRealizationItem | null;
  school: SchoolData;
  onClose: () => void;
  onReportItem: (item: BospRealizationItem) => void;
}

export const GeotagModal: React.FC<GeotagModalProps> = ({
  item,
  school,
  onClose,
  onReportItem,
}) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/60 p-4 overflow-y-auto backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="geotag-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xl overflow-hidden my-8 animate-school-item"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FAF8F5] border-b border-[#C9DFDC] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#2E6496]" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] block font-semibold">
                Bukti Fisik &amp; Geotagging Ruang Kelas
              </span>
              <h2 id="geotag-modal-title" className="text-base font-bold text-[#1E293B]">
                {item.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="school-btn-secondary p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
            aria-label="Tutup modal bukti fisik dan geotagging"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Inspection Schematic + Geotag Telemetry Overlay */}
        <div className="p-6 bg-[#FAF8F5]">
          <div className="border border-[#C9DFDC] rounded-xl overflow-hidden bg-[#FFFFFF] shadow-xs">
            <div className="relative bg-[#1E293B] p-5 text-[#FFFFFF]">
              {/* Top Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#475569]/60 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#C9DFDC]">
                  <Navigation className="w-3.5 h-3.5 text-[#66A3BF]" />
                  <span className="tabular-nums">
                    GPS: Lat {item.geotag.lat}, Long {item.geotag.lng}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#2E6496] text-[#FFFFFF] text-[11px] font-semibold">
                  Terverifikasi Dapodik
                </span>
              </div>

              {/* Architectural SVG Classroom Diagram */}
              <div className="bg-[#FAF8F5] rounded-xl p-4 text-[#1E293B] border border-[#C9DFDC]">
                <svg
                  className="w-full h-52"
                  viewBox="0 0 600 210"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="600" height="210" rx="4" fill="#FAF8F5" />
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#C9DFDC" strokeWidth="1" />
                  <line x1="0" y1="165" x2="600" y2="165" stroke="#C9DFDC" strokeWidth="1.5" />
                  <line x1="120" y1="0" x2="120" y2="165" stroke="#C9DFDC" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="480" y1="0" x2="480" y2="165" stroke="#C9DFDC" strokeWidth="1" strokeDasharray="4 4" />

                  <rect
                    x="185"
                    y="62"
                    width="230"
                    height="76"
                    rx="4"
                    fill="#FFFFFF"
                    stroke="#2E6496"
                    strokeWidth="2"
                  />
                  <rect x="193" y="70" width="214" height="60" fill="#EBF3F8" />
                  <text
                    x="300"
                    y="96"
                    textAnchor="middle"
                    fill="#1E293B"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                    fontSize="12"
                  >
                    {item.geotag.roomLabel.toUpperCase()}
                  </text>
                  <text
                    x="300"
                    y="114"
                    textAnchor="middle"
                    fill="#2E6496"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    fontSize="10"
                  >
                    INVENTARIS BOSP: {item.code} ({item.unitSummary})
                  </text>

                  {[
                    { cx: 80, cy: 88, tag: 'UNIT #01 (BARAT)' },
                    { cx: 300, cy: 26, tag: 'UNIT #02 (TENGAH)' },
                    { cx: 520, cy: 88, tag: 'UNIT #03 (TIMUR)' },
                  ].map((pos, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pos.cx}
                        cy={pos.cy}
                        r="22"
                        fill="#FFFFFF"
                        stroke="#2E6496"
                        strokeWidth="2"
                      />
                      <circle
                        cx={pos.cx}
                        cy={pos.cy}
                        r="16"
                        fill="#EBF3F8"
                        stroke="#66A3BF"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                      <path
                        d={`M ${pos.cx} ${pos.cy - 12} L ${pos.cx} ${pos.cy + 12} M ${pos.cx - 12} ${pos.cy} L ${pos.cx + 12} ${pos.cy}`}
                        stroke="#2E6496"
                        strokeWidth="2.5"
                      />
                      <circle cx={pos.cx} cy={pos.cy} r="4" fill="#66A3BF" />
                      <rect
                        x={pos.cx - 46}
                        y={pos.cy + 25}
                        width="92"
                        height="16"
                        rx="3"
                        fill="#2E6496"
                      />
                      <text
                        x={pos.cx}
                        y={pos.cy + 36}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="600"
                        fontSize="8.5"
                      >
                        {pos.tag}
                      </text>
                    </g>
                  ))}

                  <text
                    x="20"
                    y="190"
                    fill="#475569"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fontWeight="600"
                  >
                    DOKUMENTASI FISIK INSPEKTORAT DAERAH • {school.name.toUpperCase()}
                  </text>
                  <text
                    x="580"
                    y="190"
                    textAnchor="end"
                    fill="#2E6496"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fontWeight="700"
                  >
                    STATUS: TERPASANG 100%
                  </text>
                </svg>
              </div>

              {/* Geotagging Metadata Overlay Box */}
              <div className="mt-3 p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] font-mono text-xs text-[#FAF8F5]">
                <div className="flex items-center gap-2 text-[#C9DFDC] font-semibold">
                  <MapPin className="w-4 h-4 shrink-0 text-[#66A3BF]" />
                  <span className="tabular-nums">
                    Lat: {item.geotag.lat}, Long: {item.geotag.lng} • {item.geotag.roomLabel} • {item.geotag.uploadedAt}
                  </span>
                </div>
                <p className="text-[11px] text-[#FAF8F5]/80 mt-1.5 font-sans">
                  Catatan Inspektorat: {item.geotag.inspectorNote}
                </p>
              </div>
            </div>

            {/* Metadata Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#C9DFDC]/60 bg-[#FFFFFF] text-xs">
              <div className="p-4">
                <span className="text-[#475569] block">Lokasi Ruangan</span>
                <span className="font-bold text-[#1E293B] mt-0.5 block">
                  {item.geotag.roomLabel}
                </span>
              </div>
              <div className="p-4">
                <span className="text-[#475569] block">Waktu Verifikasi</span>
                <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block tabular-nums">
                  {item.geotag.uploadedAt}
                </span>
              </div>
              <div className="p-4">
                <span className="text-[#475569] block">Nilai Pengadaan BOSP</span>
                <span className="font-mono font-bold text-[#2E6496] mt-0.5 block tabular-nums">
                  {formatRupiah(item.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#C9DFDC] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#475569]">
            Apakah barang ini tidak ditemukan secara fisik di kelas?
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportItem(item);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl hover:bg-[#FEE2E2] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Laporkan Barang Fiktif / Rusak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="school-btn-primary px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
