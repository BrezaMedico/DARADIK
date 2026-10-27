import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Calendar,
  Building2,
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

export const KamusBospModal: React.FC<KamusModalProps> = ({
  isOpen,
  onClose,
  onReportNow,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/60 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kamus-bosp-title"
    >
      <div
        className="w-full max-w-4xl bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-lg overflow-hidden my-8 animate-view-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#F4F1EA] border-b border-[#E4E0D8] px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#2E6496] font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>REFERENSI HUKUM // PERMENDIKBUDRISTEK NO. 63 TAHUN 2023 & PERMENDIKBUD 75/2016</span>
            </div>
            <h2
              id="kamus-bosp-title"
              className="text-xl font-bold text-[#1E293B] mt-1"
            >
              Kamus Panduan Juknis BOSP untuk Orang Tua Murid
            </h2>
            <p className="text-sm text-[#475569] mt-0.5 max-w-[65ch]">
              Pahami batas jelas antara kebutuhan sekolah yang wajib ditanggung negara melalui dana BOSP dan praktik pungutan yang dilarang di Sekolah Negeri.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md border border-[#E4E0D8] bg-[#FFFFFF] text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5] active:translate-y-[1px] transition-all duration-150"
            aria-label="Tutup modal Kamus BOSP"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter Bar inside Kamus */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#E4E0D8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cari aturan (contoh: kipas angin, buku, LKS, seragam, sumbangan)..."
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-[#FFFFFF] border border-[#E4E0D8] rounded-md text-[#1E293B] placeholder:text-[#475569]/70 focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#475569] hover:text-[#1E293B]"
              >
                Reset
              </button>
            )}
          </div>
          <span className="text-xs font-mono text-[#475569] tabular-nums">
            Menampilkan {filteredAllowed.length + filteredProhibited.length} ketentuan resmi
          </span>
        </div>

        {/* Two Columns Hairline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E4E0D8] max-h-[62vh] overflow-y-auto">
          {/* Column 1: ALLOWED */}
          <div className="p-6 bg-[#FFFFFF]">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md bg-[#EBF7EE] border border-[#2E7D32]/30 text-[#2E7D32] mb-4">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs font-mono uppercase tracking-wider block font-semibold">
                  01 / KOMPONEN RESMI BOSP
                </span>
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Yang BOLEH & WAJIB Dibiayai Dana BOSP
                </h3>
              </div>
            </div>

            {filteredAllowed.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#475569]">
                Tidak ada kata kunci yang cocok pada daftar komponen wajib BOSP.
              </div>
            ) : (
              <div className="divide-y divide-[#E4E0D8]">
                {filteredAllowed.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                        <span className="font-mono text-xs text-[#2E7D32] tabular-nums">
                          0{idx + 1}.
                        </span>
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E4E0D8] text-[#475569]">
                      Dasar: {item.ref}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: PROHIBITED */}
          <div className="p-6 bg-[#FFFFFF]">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md bg-[#FDF2F2] border border-[#F5C6CB] text-[#D9534F] mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs font-mono uppercase tracking-wider block font-semibold">
                  02 / LARANGAN & INDIKASI PUNGLI
                </span>
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Yang DILARANG Dibebankan ke Wali Murid
                </h3>
              </div>
            </div>

            {filteredProhibited.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#475569]">
                Tidak ada kata kunci yang cocok pada daftar larangan pungutan.
              </div>
            ) : (
              <div className="divide-y divide-[#E4E0D8]">
                {filteredProhibited.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-1 last:pb-1">
                    <h4 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                      <span className="font-mono text-xs text-[#D9534F] tabular-nums">
                        0{idx + 1}.
                      </span>
                      {item.title}
                    </h4>
                    <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FDF2F2] border border-[#F5C6CB] text-[#D9534F]">
                      Status: {item.ref}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F4F1EA] border-t border-[#E4E0D8] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#475569]">
            Menemukan tarikan iuran di sekolah yang melanggar ketentuan di atas?
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#1E293B] bg-[#FFFFFF] border border-[#E4E0D8] rounded-md hover:bg-[#FAF8F5] active:translate-y-[1px] transition-all duration-150"
            >
              Tutup Panduan
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportNow();
              }}
              className="px-4 py-2 text-sm font-semibold text-[#FFFFFF] bg-[#D9534F] border border-[#D9534F] rounded-md hover:bg-[#c5423e] active:translate-y-[1px] transition-all duration-150 flex items-center gap-2"
            >
              <Flag className="w-4 h-4" />
              <span>Buat Laporan Anonim</span>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/60 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-lg overflow-hidden my-8 animate-view-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="bg-[#F4F1EA] border-b border-[#E4E0D8] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#2E6496]" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] block font-semibold">
                DOKUMEN REALISASI // ARSIP BUKTI NOTA SIPLAH BOSP
              </span>
              <h2 id="invoice-modal-title" className="text-base font-bold text-[#1E293B]">
                Bukti Nota & Kwitansi Pembelian — {item.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md border border-[#E4E0D8] bg-[#FFFFFF] text-[#475569] hover:text-[#1E293B] active:translate-y-[1px] transition-all"
            aria-label="Tutup modal bukti nota"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper Surface */}
        <div className="p-6 bg-[#FAF8F5]">
          <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-md p-6">
            {/* Vendor & Invoice Number Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E4E0D8]">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#EBF7EE] text-[#2E7D32] border border-[#2E7D32]/25 mb-2">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  FAKTUR PAJAK & BUKTI LUNAS SIPLAH
                </span>
                <h3 className="text-base font-bold text-[#1E293B]">
                  {item.invoice.vendorName}
                </h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  {item.invoice.vendorAddress}
                </p>
                <p className="text-xs font-mono text-[#475569] mt-1 tabular-nums">
                  NPWP Penyedia: {item.invoice.npwp}
                </p>
              </div>
              <div className="sm:text-right font-mono">
                <div className="text-xs text-[#475569]">NO. KWITANSI / INVOICE</div>
                <div className="text-sm font-bold text-[#1E293B] tabular-nums">
                  {item.invoice.number}
                </div>
                <div className="text-xs text-[#475569] mt-2">TANGGAL TRANSAKSI</div>
                <div className="text-xs font-semibold text-[#1E293B] tabular-nums">
                  {item.invoice.date} ({item.stage})
                </div>
              </div>
            </div>

            {/* Buyer School Info */}
            <div className="py-3 border-b border-[#E4E0D8] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#475569] block">Satuan Pendidikan Penerima:</span>
                <span className="font-bold text-[#1E293B]">
                  {school.name} (NPSN: <span className="font-mono tabular-nums">{school.npsn}</span>)
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[#475569] block">Kode Anggaran RKAS:</span>
                <span className="font-mono font-semibold text-[#2E6496] tabular-nums">
                  {item.code} — {item.category}
                </span>
              </div>
            </div>

            {/* Line Items Table (Right-aligned numeric columns per rules/Larangan.md) */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E0D8] text-[11px] font-mono uppercase text-[#475569]">
                    <th className="py-2 pr-3">Uraian Barang / Pekerjaan</th>
                    <th className="py-2 px-3 text-right">Volume</th>
                    <th className="py-2 px-3 text-right">Harga Satuan</th>
                    <th className="py-2 pl-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D8] text-xs">
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
                      TOTAL REALISASI DANA BOSP ({item.stage})
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base font-bold text-[#2E6496] tabular-nums whitespace-nowrap">
                      {formatRupiah(item.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Stamp & Signatures */}
            <div className="mt-6 pt-4 border-t border-[#E4E0D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Crisp Architectural SVG Stamp */}
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
                    stroke="#2E7D32"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="160"
                    height="60"
                    rx="4"
                    stroke="#2E7D32"
                    strokeWidth="1"
                  />
                  <text
                    x="90"
                    y="36"
                    textAnchor="middle"
                    fill="#2E7D32"
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
                    fill="#2E7D32"
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

              <div className="grid grid-cols-2 gap-4 text-xs border-l border-[#E4E0D8] pl-4 shrink-0">
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
            <div className="mt-3 px-3.5 py-2 rounded-md bg-[#EBF7EE] border border-[#2E7D32]/30 text-xs text-[#2E7D32] flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>
                Salinan arsip nota {item.invoice.number} siap dicetak / diunduh sebagai bukti audit wali murid.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F4F1EA] border-t border-[#E4E0D8] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onReportItem(item);
            }}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-[#D9534F] bg-[#FDF2F2] border border-[#F5C6CB] rounded-md hover:bg-[#f9e2e2] active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Laporkan Kejanggalan Nota Ini</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setPrintedNotice(true)}
              className="px-3.5 py-2 text-xs font-semibold text-[#1E293B] bg-[#FFFFFF] border border-[#E4E0D8] rounded-md hover:bg-[#FAF8F5] active:translate-y-[1px] transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#2E6496]" />
              <span>Unduh Salinan Nota</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#2E6496] rounded-md hover:bg-[#24507a] active:translate-y-[1px] transition-all"
            >
              Tutup Bukti Nota
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/60 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="geotag-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-lg overflow-hidden my-8 animate-view-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F4F1EA] border-b border-[#E4E0D8] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#2E6496]" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] block font-semibold">
                VERIFIKASI LAPANGAN // BUKTI FISIK & GEOTAGGING RUANG KELAS
              </span>
              <h2 id="geotag-modal-title" className="text-base font-bold text-[#1E293B]">
                Bukti Fisik Terpasang — {item.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md border border-[#E4E0D8] bg-[#FFFFFF] text-[#475569] hover:text-[#1E293B] active:translate-y-[1px] transition-all"
            aria-label="Tutup modal bukti fisik dan geotagging"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Inspection Schematic + Geotag Telemetry Overlay */}
        <div className="p-6 bg-[#FAF8F5]">
          <div className="border border-[#E4E0D8] rounded-md overflow-hidden bg-[#FFFFFF]">
            {/* Architectural Classroom Inspection Graphic */}
            <div className="relative bg-[#1E293B] p-5 text-[#FFFFFF]">
              {/* Top Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#475569]/50 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#C8DFDC]">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="tabular-nums">
                    GPS LOCK: Lat {item.geotag.lat}, Long {item.geotag.lng}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#2E7D32] text-[#FFFFFF] text-[11px] font-semibold">
                  TERVERIFIKASI DAPODIK
                </span>
              </div>

              {/* Custom Architectural SVG Classroom Diagram */}
              <div className="bg-[#FAF8F5] rounded-md p-4 text-[#1E293B] border border-[#C8DFDC]">
                <svg
                  className="w-full h-52"
                  viewBox="0 0 600 210"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Classroom Architectural Grid Background */}
                  <rect width="600" height="210" rx="4" fill="#F4F1EA" />
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#E4E0D8" strokeWidth="1" />
                  <line x1="0" y1="165" x2="600" y2="165" stroke="#E4E0D8" strokeWidth="1.5" />
                  <line x1="120" y1="0" x2="120" y2="165" stroke="#E4E0D8" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="480" y1="0" x2="480" y2="165" stroke="#E4E0D8" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Chalkboard / Whiteboard in Center */}
                  <rect
                    x="185"
                    y="62"
                    width="230"
                    height="76"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#2E6496"
                    strokeWidth="2"
                  />
                  <rect x="193" y="70" width="214" height="60" fill="#EBF7EE" />
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

                  {/* Highlighted Installed Units (3 Wall Mounts with Rotating Fan Blades / Asset Markers) */}
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
                        fill="#C8DFDC"
                        stroke="#629BB5"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                      {/* Fan blades / Equipment crosshair */}
                      <path
                        d={`M ${pos.cx} ${pos.cy - 12} L ${pos.cx} ${pos.cy + 12} M ${pos.cx - 12} ${pos.cy} L ${pos.cx + 12} ${pos.cy}`}
                        stroke="#2E6496"
                        strokeWidth="2.5"
                      />
                      <circle cx={pos.cx} cy={pos.cy} r="4" fill="#2E7D32" />
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

                  {/* Bottom Floor Label */}
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
                    fill="#2E7D32"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fontWeight="700"
                  >
                    STATUS: TERPASANG 100%
                  </text>
                </svg>
              </div>

              {/* Mandatory Geotagging Metadata Overlay Box */}
              <div className="mt-3 p-3.5 rounded-md bg-[#18181B] border border-[#475569] font-mono text-xs text-[#FAF8F5]">
                <div className="flex items-center gap-2 text-[#C8DFDC] font-semibold">
                  <MapPin className="w-4 h-4 shrink-0 text-[#629BB5]" />
                  <span className="tabular-nums">
                    Lat: {item.geotag.lat}, Long: {item.geotag.lng} • {item.geotag.roomLabel} • Diunggah: {item.geotag.uploadedAt}
                  </span>
                </div>
                <p className="text-[11px] text-[#C8DFDC]/80 mt-1.5 font-sans">
                  Catatan Verifikasi: {item.geotag.inspectorNote}
                </p>
              </div>
            </div>

            {/* Metadata Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E0D8] bg-[#FFFFFF] text-xs">
              <div className="p-3.5">
                <span className="text-[#475569] block">Lokasi Ruangan</span>
                <span className="font-bold text-[#1E293B] mt-0.5 block">
                  {item.geotag.roomLabel}
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-[#475569] block">Waktu Unggah Bukti</span>
                <span className="font-mono font-semibold text-[#1E293B] mt-0.5 block tabular-nums">
                  {item.geotag.uploadedAt}
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-[#475569] block">Nilai Pengadaan BOSP</span>
                <span className="font-mono font-bold text-[#2E6496] mt-0.5 block tabular-nums">
                  {formatRupiah(item.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F4F1EA] border-t border-[#E4E0D8] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#475569]">
            Apakah barang ini tidak ditemukan secara fisik di kelas anak Anda?
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportItem(item);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#D9534F] bg-[#FDF2F2] border border-[#F5C6CB] rounded-md hover:bg-[#f9e2e2] active:translate-y-[1px] transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Laporkan Barang Fiktif / Rusak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#2E6496] rounded-md hover:bg-[#24507a] active:translate-y-[1px] transition-all"
            >
              Tutup Geotagging
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
