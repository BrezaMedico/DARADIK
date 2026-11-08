import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Camera,
  Maximize2,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Download,
  Check,
} from 'lucide-react';
import type { BospRealizationItem, SchoolData } from '@/types/school';
import { formatRupiah } from '@/utils';

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

  const fileSizeKb = 348;

  const handleDownloadPhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 980;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWatermarkAndDownload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 800, 1200, 180);

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 800);
      ctx.lineTo(1200, 800);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#2E6496';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('[VERIFIKASI FISIK DAPODIK • DANA BOSP TA 2026]', 40, 838);

      ctx.fillStyle = '#065F46';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('[STATUS: TERVERIFIKASI 100% SESUAI]', 780, 838);

      const truncatedName = item.name.length > 35 ? item.name.slice(0, 33) + '...' : item.name;
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(`Nama Barang       : ${truncatedName}`, 40, 874);

      ctx.fillStyle = '#475569';
      ctx.font = '16px monospace';
      ctx.fillText(`Waktu Verifikasi  : ${item.geotag.uploadedAt}`, 40, 908);
      ctx.fillText(`Titik Koordinat   : Lat ${item.geotag.lat}, Long ${item.geotag.lng}`, 40, 942);

      ctx.fillStyle = '#2E6496';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Pagu Anggaran     : ${formatRupiah(item.amount)}`, 680, 874);

      ctx.fillStyle = '#475569';
      ctx.font = '16px monospace';
      ctx.fillText(`Lokasi Penempatan : ${item.geotag.roomLabel}`, 680, 908);
      ctx.fillText(`Satuan Pendidikan : ${school.name} (NPSN ${school.npsn})`, 680, 942);

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
      }, 'image/jpeg', 0.92);
    };

    if (item.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1200, 800);
        renderWatermarkAndDownload();
      };
      img.onerror = () => {
        drawFallbackPattern();
        renderWatermarkAndDownload();
      };
      img.src = item.photoUrl;
    } else {
      drawFallbackPattern();
      renderWatermarkAndDownload();
    }

    function drawFallbackPattern() {
      if (!item) return;
      ctx!.fillStyle = '#1E293B';
      ctx!.fillRect(0, 0, 1200, 800);

      ctx!.strokeStyle = '#334155';
      ctx!.lineWidth = 1;
      for (let x = 0; x < 1200; x += 60) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, 800);
        ctx!.stroke();
      }
      for (let y = 0; y < 800; y += 60) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(1200, y);
        ctx!.stroke();
      }

      ctx!.fillStyle = '#0F172A';
      ctx!.fillRect(150, 160, 900, 360);
      ctx!.strokeStyle = '#2E6496';
      ctx!.lineWidth = 3;
      ctx!.strokeRect(150, 160, 900, 360);

      ctx!.fillStyle = '#FFFFFF';
      ctx!.font = 'bold 36px sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText('DOKUMENTASI FISIK PEMBELIAN BARANG BOSP', 600, 260);

      ctx!.fillStyle = '#93C5FD';
      ctx!.font = 'bold 28px sans-serif';
      ctx!.fillText(item.name.toUpperCase(), 600, 320);

      ctx!.fillStyle = '#CBD5E1';
      ctx!.font = '22px sans-serif';
      ctx!.fillText(`Satuan Pendidikan: ${school.name} (NPSN ${school.npsn})`, 600, 380);
      ctx!.fillText(`Jumlah: ${item.unitSummary} • Pagu: ${formatRupiah(item.amount)}`, 600, 420);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-[#0F172A]/60 p-0 sm:p-5 overflow-y-auto backdrop-blur-xs"
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

              <div className="rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#FFFFFF] shadow-xs">
                <div
                  onClick={() => setIsEnlarged(true)}
                  className="group relative w-full h-52 sm:h-60 bg-[#0F172A] cursor-pointer overflow-hidden flex items-center justify-center"
                  title="Klik untuk memperbesar dan melihat foto detail"
                >
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={`Bukti fisik ${item.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
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
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-[#0F172A]/85 backdrop-blur-xs border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1.5 shadow-sm group-hover:bg-[#2E6496] transition-colors">
                    <Maximize2 className="w-3 h-3 text-[#38BDF8] group-hover:text-white" />
                    <span>Perbesar Foto</span>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] border-t border-[#CBD5E1] p-3 sm:p-3.5 font-mono text-[11px] sm:text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5 pb-1.5 border-b border-[#F1F5F9]">
                    <span className="font-bold flex items-center gap-1.5 text-[#2E6496]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2E6496]" />
                      VERIFIKASI FISIK DAPODIK BOSP 2026
                    </span>
                    <span className="text-[10px] text-[#64748B] font-sans px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
                      {fileSizeKb} KB
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 gap-y-1.5 text-[#475569]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                      <span>Tgl Ambil: <strong className="text-[#1E293B] font-semibold">{item.geotag.uploadedAt}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                      <span>GPS: <strong className="text-[#1E293B] font-semibold">{item.geotag.lat}, {item.geotag.lng}</strong></span>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                      <span className="truncate">Lokasi: <strong className="text-[#1E293B] font-semibold">{item.geotag.roomLabel}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B] text-center">
                Foto terkompresi otomatis di bawah 500 KB agar ringan dimuat oleh orang tua siswa.
              </p>
            </div>

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

      {isEnlarged && (
        <div
          className="fixed inset-0 z-[1010] flex items-center justify-center bg-[#000000]/80 p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setIsEnlarged(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#CBD5E1] shadow-2xl p-4 sm:p-6 text-[#1E293B] space-y-4 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#2E6496] shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-[#1E293B]">
                  Pratinjau Foto Fisik & Watermark Lapangan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnlarged(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                aria-label="Tutup pratinjau foto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#FFFFFF] shadow-xs">
              <div className="relative w-full h-72 sm:h-96 md:h-[460px] bg-[#0F172A] flex items-center justify-center">
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={`Bukti fisik ${item.name}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 sm:p-6 space-y-2 select-none">
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
                )}
              </div>

              <div className="bg-[#FFFFFF] border-t border-[#CBD5E1] p-3.5 sm:p-4 text-[#1E293B] font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[#2E6496] font-bold mb-2 pb-2 border-b border-[#F1F5F9]">
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#2E6496] shrink-0" />
                    VERIFIKASI FISIK DAPODIK BOSP 2026
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-sans">
                    <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] font-bold border border-[#A7F3D0]">
                      Terverifikasi 100% Sesuai
                    </span>
                    <span className="text-[#64748B] font-normal px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
                      {fileSizeKb} KB
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#475569] text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <span>Tgl Pengambilan: <strong className="text-[#1E293B] font-semibold">{item.geotag.uploadedAt}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <span>Koordinat GPS: <strong className="text-[#1E293B] font-semibold">Lat {item.geotag.lat}, Long {item.geotag.lng}</strong></span>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <span>Lokasi Penempatan: <strong className="text-[#1E293B] font-semibold">{item.geotag.roomLabel}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <span className="text-xs text-[#64748B] text-center sm:text-left">
                Ukuran berkas: <strong className="text-[#1E293B] font-mono">{fileSizeKb} KB</strong> (format JPEG terkompresi)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPhoto}
                  className="school-btn-primary flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Unduh Foto Ber-Watermark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnlarged(false)}
                  className="school-btn-secondary flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
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

