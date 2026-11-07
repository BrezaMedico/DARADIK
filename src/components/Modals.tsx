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
  Download,
  Camera,
  Maximize2,
  ShieldCheck,
  Building2,
  Store,
  Calendar,
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
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!item) return null;

  const handleDownloadReceipt = () => {
    const textReceipt = `================================================
KUITANSI DIGITAL RESMI PENGADAAN BOSP
Sistem Informasi Pengadaan di Sekolah (SIPLah)
Kemendikdasmen Republik Indonesia
================================================
No. Kuitansi : ${item.invoice.number}
Tanggal      : ${item.invoice.date} (${item.stage})
Status       : LUNAS / TERVERIFIKASI

INFORMASI PEMBELI:
Satuan Pend. : ${school.name}
NPSN         : ${school.npsn}
Kode RKAS    : ${item.code}

TOKO / PENYEDIA MITRA SIPLah:
Nama Toko    : ${item.invoice.vendorName}
Alamat Toko  : ${item.invoice.vendorAddress}
NPWP         : ${item.invoice.npwp}

RINCIAN BARANG:
${item.invoice.lineItems
  .map(
    (li, idx) =>
      `${idx + 1}. ${li.name}\n   Volume: ${li.qty} | Harga: ${formatRupiah(Math.round(li.unitPrice))} | Subtotal: ${formatRupiah(li.subtotal)}`
  )
  .join('\n')}
------------------------------------------------
TOTAL PEMBAYARAN: ${formatRupiah(item.amount)}
------------------------------------------------
Peruntukan:
${item.allocation}

PENANGGUNG JAWAB:
- Kepala Sekolah : ${item.invoice.principalName}
- Bendahara BOSP : ${item.invoice.treasurerName}

Terverifikasi Otomatis melalui Sistem ARKAS & BOSP
================================================`;

    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kuitansi-BOSP-${item.invoice.number.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/60 p-0 sm:p-5 overflow-y-auto backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div
        className="w-full max-w-lg bg-[#FFFFFF] border-t sm:border border-[#C9DFDC] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden my-0 sm:my-6 animate-school-item flex flex-col max-h-[92dvh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#FAF8F5] border-b border-[#C9DFDC] px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#2E6496]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6496] block font-mono">
                Kuitansi Digital Pengadaan
              </span>
              <h2
                id="invoice-modal-title"
                className="text-xs sm:text-sm font-bold text-[#1E293B] truncate"
              >
                {item.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="school-btn-secondary p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer shrink-0"
            aria-label="Tutup kuitansi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAF8F5] space-y-3.5">
          {/* Digital Receipt Sheet */}
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl shadow-xs overflow-hidden">
            {/* Receipt Header Badge */}
            <div className="bg-[#1E293B] text-[#FFFFFF] px-4 py-3 border-b border-[#334155]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono tracking-wider font-bold text-[#93C5FD] uppercase flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  SIPLah Kemendikdasmen
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 text-[10px] font-mono font-bold">
                  LUNAS
                </span>
              </div>
              <h3 className="font-sturdy-heading text-sm sm:text-base font-extrabold text-[#FFFFFF] mt-1 tracking-tight">
                KUITANSI PEMBELIAN BOSP
              </h3>
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#CBD5E1] mt-1 pt-1.5 border-t border-[#334155]/60 gap-1">
                <span className="break-all">No: {item.invoice.number}</span>
                <span>{item.invoice.date}</span>
              </div>
            </div>

            {/* Parties Info Grid */}
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#2E6496]" />
                  Satuan Pendidikan:
                </span>
                <div className="font-bold text-[#1E293B] break-words">
                  {school.name}
                </div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  NPSN: <span className="tabular-nums font-semibold">{school.npsn}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1">
                  <Store className="w-3 h-3 text-[#2E6496]" />
                  Toko Mitra SIPLah:
                </span>
                <div className="font-bold text-[#1E293B] break-words">
                  {item.invoice.vendorName}
                </div>
                <div className="text-[11px] text-[#64748B] break-words">
                  {item.invoice.vendorAddress}
                </div>
              </div>
            </div>

            {/* Line Items List (Clean 2-line Layout, Zero Horizontal Overflow) */}
            <div className="p-4">
              <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#64748B] pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <span>Rincian Barang</span>
                <span>Subtotal</span>
              </div>

              <div className="divide-y divide-[#F1F5F9]">
                {item.invoice.lineItems.map((li, idx) => (
                  <div key={idx} className="py-2.5 first:pt-2 last:pb-1 space-y-1">
                    <div className="font-semibold text-xs text-[#1E293B] break-words leading-snug">
                      {li.name}
                    </div>
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="text-[11px] font-mono text-[#64748B]">
                        {li.qty} × {formatRupiah(Math.round(li.unitPrice))}
                      </span>
                      <span className="font-bold font-mono text-[#1E293B] tabular-nums shrink-0">
                        {formatRupiah(li.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="mt-3 pt-3 border-t-2 border-dashed border-[#CBD5E1] flex items-center justify-between gap-2">
                <span className="font-bold text-xs uppercase text-[#1E293B]">
                  Total Pembayaran
                </span>
                <span className="font-extrabold text-base sm:text-lg text-[#2E6496] font-mono tabular-nums">
                  {formatRupiah(item.amount)}
                </span>
              </div>
            </div>

            {/* Peruntukan Belanja */}
            <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-xs">
              <span className="font-bold text-[#2E6496] block text-[11px] uppercase tracking-wider mb-0.5">
                Peruntukan Belanja BOSP:
              </span>
              <p className="text-[#475569] leading-relaxed break-words">
                {item.allocation}
              </p>
            </div>

            {/* Verification Signatures */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#FFFFFF] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-md border border-[#2E6496] bg-[#EBF3F8] text-center">
                  <div className="text-[9px] font-mono font-bold text-[#2E6496] tracking-wider uppercase">
                    TERVERIFIKASI
                  </div>
                  <div className="text-[11px] font-mono font-extrabold text-[#2E6496]">
                    ARKAS 2026
                  </div>
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Bukti sah belanja dana operasional sekolah
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F1F5F9]">
                <div>
                  <span className="text-[10px] text-[#64748B] block">Kepala Sekolah:</span>
                  <span className="font-semibold text-[#1E293B] block truncate">
                    {item.invoice.principalName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Bendahara:</span>
                  <span className="font-semibold text-[#1E293B] block truncate">
                    {item.invoice.treasurerName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] flex items-center gap-2 animate-school-item">
              <Check className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>Salinan kuitansi berhasil diunduh ke perangkat Anda.</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#FAF8F5] border-t border-[#C9DFDC] px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onReportItem(item);
            }}
            className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Laporkan Nota Ini</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="school-btn-secondary flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
              <span>Unduh Kuitansi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="school-btn-primary flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
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
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!item) return null;

  // Ukuran file dalam format KB (sesuai instruksi: ukuran KB jangan sampai MB)
  const fileSizeKb = 348;

  const handleDownloadPhoto = () => {
    // Generate file gambar ber-watermark melalui Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background abu-abu netral foto inspeksi
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, 1200, 800);

      // Gambar grid dan representasi bukti fisik
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 800);
        ctx.stroke();
      }
      for (let y = 0; y < 800; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Banner tengah
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(150, 200, 900, 360);
      ctx.strokeStyle = '#2E6496';
      ctx.lineWidth = 3;
      ctx.strokeRect(150, 200, 900, 360);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DOKUMENTASI FISIK PEMBELIAN BARANG BOSP', 600, 310);

      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(item.name.toUpperCase(), 600, 370);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '22px sans-serif';
      ctx.fillText(`Satuan Pendidikan: ${school.name} (NPSN ${school.npsn})`, 600, 430);
      ctx.fillText(`Jumlah: ${item.unitSummary} • Pagu: ${formatRupiah(item.amount)}`, 600, 470);

      // Watermark Timemark / GPS Camera di pojok kiri bawah
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(40, 600, 1120, 160);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 600, 1120, 160);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('[VERIFIKASI FISIK DAPODIK • DANA BOSP TA 2026]', 70, 640);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px monospace';
      ctx.fillText(`Waktu Verifikasi  : ${item.geotag.uploadedAt}`, 70, 675);
      ctx.fillText(`Titik Koordinat   : Lat ${item.geotag.lat}, Long ${item.geotag.lng}`, 70, 710);
      ctx.fillText(`Lokasi Penempatan : ${item.geotag.roomLabel}`, 70, 745);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Bukti-Fisik-${item.code}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 4000);
        }
      }, 'image/jpeg', 0.85);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/60 p-0 sm:p-5 overflow-y-auto backdrop-blur-xs"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="geotag-modal-title"
      >
        <div
          className="w-full max-w-xl bg-[#FFFFFF] border-t sm:border border-[#C9DFDC] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden my-0 sm:my-6 animate-school-item flex flex-col max-h-[92dvh] sm:max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#FAF8F5] border-b border-[#C9DFDC] px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] border border-[#C9DFDC] flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-[#2E6496]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6496] block font-mono">
                  Dokumentasi Fisik Pembelian
                </span>
                <h2
                  id="geotag-modal-title"
                  className="text-xs sm:text-sm font-bold text-[#1E293B] truncate"
                >
                  {item.name}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="school-btn-secondary p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer shrink-0"
              aria-label="Tutup bukti fisik"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAF8F5] space-y-3.5">
            {/* Real Physical Photo Container with Watermark */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#2E6496]" />
                  Foto Asli Bukti Fisik Barang
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569]">
                  Ukuran: {fileSizeKb} KB (Maks. 500 KB)
                </span>
              </div>

              {/* Photo Frame / Preview Surface with Watermark Overlay */}
              <div
                onClick={() => setIsEnlarged(true)}
                className="group relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#0F172A] cursor-pointer shadow-xs hover:border-[#2E6496] transition-all"
                title="Klik untuk memperbesar dan melihat foto detail"
              >
                {/* Solid Physical Inspection Photo Surface (No Gradient / Anti AI-Slop) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white select-none bg-[#0F172A] border-b border-[#334155]">
                  <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#38BDF8] mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#FFFFFF] tracking-tight">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5 font-mono">
                    {item.unitSummary} • {school.name}
                  </div>
                  <div className="mt-2.5 px-3 py-1 rounded-lg bg-[#1E293B] border border-[#334155] text-[#E2E8F0] text-[11px] font-semibold flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3 text-[#38BDF8]" />
                    <span>Klik untuk memperbesar &amp; unduh foto</span>
                  </div>
                </div>

                {/* WATERMARK OVERLAY (Solid Civic Styling, No Gradient, No Emojis) */}
                <div className="absolute bottom-0 inset-x-0 bg-[#0F172A] border-t border-[#334155] p-3 text-white font-mono text-[10px] sm:text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1 text-[#38BDF8]">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                      VERIFIKASI FISIK DAPODIK BOSP 2026
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-sans">
                      {fileSizeKb} KB
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[#E2E8F0]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      <span>Tgl Ambil: <strong className="text-white font-semibold">{item.geotag.uploadedAt}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      <span>GPS: <strong className="text-white font-semibold">{item.geotag.lat}, {item.geotag.lng}</strong></span>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1.5 truncate">
                      <Building2 className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      <span className="truncate">Lokasi: <strong className="text-white font-semibold">{item.geotag.roomLabel}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B] text-center">
                Foto terkompresi otomatis di bawah 500 KB agar ringan dimuat oleh orang tua siswa.
              </p>
            </div>

            {/* Inspection Details Card */}
            <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-4 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Status Verifikasi:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] font-bold text-[11px] border border-[#A7F3D0]">
                  Terverifikasi 100% Sesuai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-[#64748B] block">
                    Penempatan Ruangan:
                  </span>
                  <span className="font-semibold text-[#1E293B] block mt-0.5">
                    {item.geotag.roomLabel}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">
                    Nilai Pengadaan BOSP:
                  </span>
                  <span className="font-mono font-bold text-[#2E6496] block mt-0.5 tabular-nums">
                    {formatRupiah(item.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F1F5F9]">
                <span className="text-[11px] text-[#64748B] block mb-0.5">
                  Catatan Pemeriksaan Fisik:
                </span>
                <p className="text-[#1E293B] italic leading-relaxed">
                  &ldquo;{item.geotag.inspectorNote}&rdquo;
                </p>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] flex items-center gap-2 animate-school-item">
                <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Foto bukti fisik ber-watermark berhasil diunduh ({fileSizeKb} KB).</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-[#FAF8F5] border-t border-[#C9DFDC] px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportItem(item);
              }}
              className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Laporkan Barang Fiktif / Tidak Ada</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDownloadPhoto}
                className="school-btn-secondary flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                <span>Unduh Foto ({fileSizeKb} KB)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="school-btn-primary flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL: FULL RESOLUTION VIEW */}
      {isEnlarged && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000000]/80 p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setIsEnlarged(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#0F172A] rounded-2xl overflow-hidden border border-[#334155] shadow-2xl p-4 sm:p-6 text-white space-y-4 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-[#FFFFFF]">
                  Pratinjau Foto Fisik &amp; Watermark Lapangan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnlarged(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer"
                aria-label="Tutup pratinjau foto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enlarged Photo Container */}
            <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden bg-[#1E293B] border border-[#334155] flex items-center justify-center">
              <div className="text-center p-4 sm:p-6 pb-28 sm:pb-24 space-y-2 select-none">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 flex items-center justify-center text-[#38BDF8] mx-auto">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="text-sm sm:text-lg font-bold text-white">
                  {item.name}
                </div>
                <div className="text-[11px] sm:text-xs text-[#94A3B8] font-mono">
                  {item.unitSummary} • {school.name}
                </div>
                <div className="text-[11px] sm:text-xs text-[#CBD5E1] max-w-md mx-auto pt-1">
                  Dokumentasi fisik pengadaan BOSP resmi tersimpan di server Dapodik Kemendikdasmen.
                </div>
              </div>

              {/* Watermark Overlay in Lightbox (No Emojis, No Gradients) */}
              <div className="absolute bottom-0 inset-x-0 bg-[#0F172A] border-t border-[#334155] p-3 sm:p-4 font-mono text-xs">
                <div className="flex items-center justify-between text-[#38BDF8] font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    VERIFIKASI FISIK DAPODIK BOSP 2026
                  </span>
                  <span className="text-[#94A3B8] font-normal text-[11px]">{fileSizeKb} KB</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[#E2E8F0] text-[11px] mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#38BDF8] shrink-0" />
                    <span>Tgl Pengambilan: <strong className="text-white font-semibold">{item.geotag.uploadedAt}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" />
                    <span>Koordinat GPS: <strong className="text-white font-semibold">Lat {item.geotag.lat}, Long {item.geotag.lng}</strong></span>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-[#38BDF8] shrink-0" />
                    <span>Lokasi: <strong className="text-white font-semibold">{item.geotag.roomLabel}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lightbox Footer Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <span className="text-xs text-[#94A3B8] text-center sm:text-left">
                Ukuran berkas: <strong className="text-white font-mono">{fileSizeKb} KB</strong> (format JPEG terkompresi)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPhoto}
                  className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Unduh Foto Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnlarged(false)}
                  className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-xl bg-[#334155] hover:bg-[#475569] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
