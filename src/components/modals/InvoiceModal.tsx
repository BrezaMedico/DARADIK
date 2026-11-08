import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  AlertTriangle,
  FileText,
  FileCheck2,
  Download,
  Building2,
  Store,
  Check,
  Loader2,
} from 'lucide-react';
import type { BospRealizationItem, SchoolData } from '@/types/school';
import { formatRupiah } from '@/utils';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptSheetRef = useRef<HTMLDivElement>(null);

  if (!item) return null;

  const handleDownloadReceipt = async () => {
    if (!receiptSheetRef.current || isDownloading) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(receiptSheetRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Kuitansi-BOSP-${item.invoice.number.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Gagal membuat gambar kuitansi PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-[#0F172A]/60 p-0 sm:p-5 overflow-y-auto backdrop-blur-xs"
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
          <div
            ref={receiptSheetRef}
            className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl shadow-xs overflow-hidden"
          >
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

            {/* Line Items List */}
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
              disabled={isDownloading}
              onClick={handleDownloadReceipt}
              className="school-btn-secondary flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-[#2E6496] animate-spin shrink-0" />
                  <span>Membuat PNG...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                  <span>Unduh Kuitansi (.png)</span>
                </>
              )}
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

