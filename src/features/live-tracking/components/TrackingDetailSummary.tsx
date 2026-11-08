import React from 'react';
import {
  Building2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  Paperclip,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import type {
  PublicReportTrackingDetail,
  PublicStatusHistoryItem,
  ResolutionOutcomeOption,
} from '@/types';
import {
  formatWibDateTime,
  getParentStatusLabel,
} from '@/utils/reportTracking';

export interface TrackingDetailSummaryProps {
  report: PublicReportTrackingDetail;
  history: PublicStatusHistoryItem[];
  outcomeOption: ResolutionOutcomeOption | null;
  isRealtimeSubscribed: boolean;
  copiedTicket: boolean;
  onCopyTicket: (code: string) => void;
  onPreviewAttachment: (image: { url: string; title: string }) => void;
  children?: React.ReactNode;
}

export const TrackingDetailSummary: React.FC<TrackingDetailSummaryProps> = ({
  report,
  history,
  outcomeOption,
  isRealtimeSubscribed,
  copiedTicket,
  onCopyTicket,
  onPreviewAttachment,
  children,
}) => {
  return (
    <div className="space-y-6">
      <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E4E0D8]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Kode Tiket Laporan
              </span>
              {isRealtimeSubscribed && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#166534]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
                  <span>Pembaruan Langsung Aktif</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-lg sm:text-2xl font-extrabold text-[#2E6496] tabular-nums break-all">
                {report.ticket_code}
              </span>
              <button
                type="button"
                onClick={() => onCopyTicket(report.ticket_code)}
                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedTicket ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#166534]" />
                    <span className="text-[#166534]">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="self-start">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${
                report.status === 'COMPLETED'
                  ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                  : report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                  ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  : report.waiting_additional_info
                  ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                  : 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
              }`}
            >
              {getParentStatusLabel(report.status, report.waiting_additional_info)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-[11px] font-medium text-[#475569] block">
              Sekolah yang Dilaporkan
            </span>
            <div className="font-bold text-[#1E293B] flex items-start gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0 mt-0.5" />
              <span>{report.school_name}</span>
            </div>
            <span className="font-mono text-[11px] text-[#475569] tabular-nums block">
              NPSN: {report.school_npsn}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-[11px] font-medium text-[#475569] block">
              Kategori Laporan
            </span>
            <span className="font-bold text-[#1E293B] block">
              {report.category}
            </span>
            <span className="text-[11px] text-[#475569] block">
              Pihak terkait: {report.requester_role}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-[11px] font-medium text-[#475569] block">
              Waktu Pengiriman
            </span>
            <span className="font-mono font-bold text-[#1E293B] tabular-nums block">
              {formatWibDateTime(report.created_at)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-[11px] font-medium text-[#475569] block">
              Terakhir Diperbarui
            </span>
            <span className="font-mono font-bold text-[#1E293B] tabular-nums block">
              {formatWibDateTime(report.updated_at)}
            </span>
          </div>
        </div>
      </section>

      {report.waiting_additional_info && report.status === 'PEMERIKSAAN_LANJUTAN' && (
        <section
          aria-label="Permintaan Informasi Tambahan"
          className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5 sm:p-6 space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#92400E]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Perlu Informasi Tambahan</span>
          </div>
          <h2 className="text-base font-bold text-[#1E293B]">
            Petugas Membutuhkan Keterangan atau Bukti Tambahan dari Kamu
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Baca pesan petugas pada bagian Komunikasi Pemeriksaan di bawah ini, lalu kirimkan penjelasan atau unggah bukti tambahan tanpa perlu mencantumkan identitas pribadi.
          </p>
        </section>
      )}

      {report.is_forwarded && (
        <section className="bg-[#EBF3F8] border border-[#C9DFDC] rounded-2xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#1D4F7A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#1E293B]">
              Proses Diteruskan ke Instansi Terkait
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Laporan ini sedang dikoordinasikan atau diteruskan kepada{' '}
              <strong className="text-[#1E293B]">
                {report.forwarded_to || 'instansi pengawasan terkait'}
              </strong>{' '}
              sesuai kewenangan pemeriksaan.
            </p>
          </div>
        </section>
      )}

      {report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI' && (
        <section className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
              Status Akhir Laporan: Tidak Dapat Ditindaklanjuti
            </span>
            {report.resolved_at && (
              <span className="font-mono text-xs text-[#991B1B] tabular-nums">
                {formatWibDateTime(report.resolved_at)}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#1E293B]">
            Keterangan dari Petugas Dinas Pendidikan
          </h2>
          <p className="text-xs sm:text-sm text-[#1E293B] bg-[#FFFFFF] border border-[#FECACA] rounded-xl p-4 leading-relaxed">
            {report.rejection_reason ||
              'Laporan belum memenuhi persyaratan informasi awal untuk dilanjutkan ke tahap pemeriksaan.'}
          </p>
          <p className="text-xs text-[#475569]">
            Apabila kamu memiliki bukti atau rincian informasi baru yang lebih lengkap, kamu tetap dapat mengirimkan laporan baru melalui kanal pelaporan DARADIK.
          </p>
        </section>
      )}

      {report.status === 'COMPLETED' && (
        <section className="bg-[#FFFFFF] border-2 border-[#2E6496] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E4E0D8]">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E6496]">
                Tahap 5 • Hasil Penanganan Dinas Pendidikan
              </span>
              <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
                {outcomeOption?.label || 'Pemeriksaan Selesai'}
              </h2>
            </div>

            {report.resolved_at && (
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1E293B] bg-[#FAF8F5] border border-[#E4E0D8] px-3 py-1.5 rounded-lg tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#2E6496]" />
                <span>{formatWibDateTime(report.resolved_at)}</span>
              </div>
            )}
          </div>

          {outcomeOption && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
                outcomeOption.code === 'HAS_INDICATION'
                  ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                  : outcomeOption.code === 'NO_INDICATION'
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                  : 'bg-[#FAF8F5] border-[#C9DFDC] text-[#1E293B]'
              }`}
            >
              {outcomeOption.parentSummary}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#1E293B] block">
              Catatan Hasil Penanganan untuk Pelapor:
            </span>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
              {report.public_resolution_note ||
                'Pemeriksaan atas laporan telah diselesaikan oleh petugas Dinas Pendidikan.'}
            </div>
          </div>

          <p className="text-[11px] text-[#475569] leading-relaxed">
            Catatan: Hasil penanganan di atas merupakan kesimpulan pemeriksaan administratif Dinas Pendidikan sesuai kewenangannya, bukan merupakan putusan pengadilan atau penegakan hukum pidana.
          </p>
        </section>
      )}

      {children}

      <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2E6496]" />
          <h2 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
            Arsip Kronologi &amp; Bukti yang Kamu Kirimkan
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
          {report.notes}
        </div>

        {report.attachments_json && report.attachments_json.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#475569] block">
                Lampiran Bukti ({report.attachments_json.length} berkas):
              </span>
              <span className="text-[11px] text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full font-semibold">
                Privat (Tidak dapat dilihat oleh Dinas Pendidikan)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {report.attachments_json.map((att, idx) => (
                <div
                  key={`rep-att-${idx}`}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-[#1E293B] block truncate">
                        {att.name}
                      </span>
                      <span className="text-[11px] text-[#475569]">
                        {att.sizeFormatted}
                      </span>
                    </div>
                  </div>

                  {att.url && (
                    <button
                      type="button"
                      onClick={() =>
                        onPreviewAttachment({ url: att.url!, title: att.name })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-[#2E6496] font-semibold hover:bg-[#EBF3F8] inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Lihat</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-sturdy-heading text-base sm:text-lg font-bold text-[#1E293B]">
            Catatan Waktu Perubahan Status
          </h2>

          <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] rounded-xl overflow-hidden">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#1E293B] flex items-center gap-2 flex-wrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <span>{getParentStatusLabel(h.new_status)}</span>
                    <span className="text-[11px] font-normal text-[#475569]">
                      • {h.actor_label}
                    </span>
                  </div>
                  {h.note && (
                    <p className="text-[#475569] pl-5 leading-relaxed">{h.note}</p>
                  )}
                </div>

                <span className="font-mono text-[11px] text-[#475569] tabular-nums pl-5 sm:pl-0 shrink-0">
                  {formatWibDateTime(h.created_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export interface TrackingAttachmentModalProps {
  lightboxImage: { url: string; title: string } | null;
  onClose: () => void;
}

export const TrackingAttachmentModal: React.FC<TrackingAttachmentModalProps> = ({
  lightboxImage,
  onClose,
}) => {
  if (!lightboxImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D8]">
          <span className="text-sm font-bold text-[#1E293B] truncate">
            {lightboxImage.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
            aria-label="Tutup pratinjau berkas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2">
          {lightboxImage.url.toLowerCase().endsWith('.pdf') ? (
            <a
              href={lightboxImage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#2E6496] text-[#FFFFFF] text-xs font-bold inline-flex items-center gap-2"
            >
              <span>Buka Dokumen PDF di Tab Baru</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[65vh] w-auto object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
};
