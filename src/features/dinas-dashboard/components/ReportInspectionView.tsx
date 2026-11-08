import React from 'react';
import {
  Check,
  CheckCircle2,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { InspectionMethodCode, OfficerFullReportRow } from '@/types';
import {
  INSPECTION_METHOD_OPTIONS,
  formatWibDateTime,
  getResolutionOutcomeOption,
} from '@/utils/reportTracking';

interface ReportInspectionViewProps {
  report: OfficerFullReportRow;
  selectedMethods: InspectionMethodCode[];
  onToggleMethod: (code: InspectionMethodCode, checked: boolean) => void;
  isForwardedCheck: boolean;
  onForwardedCheckChange: (checked: boolean) => void;
  forwardedToInput: string;
  onForwardedToInputChange: (value: string) => void;
  onAcceptForFollowUp: () => void;
  onOpenRejectDialog: () => void;
  onOpenCompleteDialog: () => void;
  onSaveInspectionProgress: () => void;
}

export const ReportInspectionView: React.FC<ReportInspectionViewProps> = ({
  report,
  selectedMethods,
  onToggleMethod,
  isForwardedCheck,
  onForwardedCheckChange,
  forwardedToInput,
  onForwardedToInputChange,
  onAcceptForFollowUp,
  onOpenRejectDialog,
  onOpenCompleteDialog,
  onSaveInspectionProgress,
}) => {
  return (
    <div className="space-y-6 animate-view-enter">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
          <span className="text-[#475569] block">Kategori Dugaan:</span>
          <span className="font-bold text-[#1E293B] block">
            {report.category}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
          <span className="text-[#475569] block">Pihak yang Meminta:</span>
          <span className="font-bold text-[#1E293B] block">
            {report.requester_role}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
          <span className="text-[#475569] block">Jumlah Berkas Bukti:</span>
          <span className="font-bold text-[#1E293B] block tabular-nums">
            {report.attachment_count} berkas
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-bold text-[#1E293B] block">
          Kronologi / Uraian Pelapor:
        </span>
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
          {report.notes_encrypted ||
            'Tidak ada catatan kronologi tertulis.'}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-[#1E293B] block">
          Bukti Foto / Berkas Pelapor:
        </span>
        {report.attachment_count > 0 || (report.attachments_json && report.attachments_json.length > 0) ? (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#2E6496] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[#1E293B] block">
                  Foto / Dokumen Pelapor Terproteksi ({report.attachment_count || report.attachments_json?.length || 1} berkas terunggah)
                </span>
                <p className="text-[#475569] leading-relaxed">
                  Sesuai ketentuan keamanan dan perlindungan privasi pengaduan masyarakat DARADIK, seluruh berkas foto atau dokumen bukti yang diunggah oleh pelapor bersifat rahasia dan tidak dapat dibuka atau dilihat oleh pihak Dinas Pendidikan.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-3.5">
            Pelapor tidak melampirkan berkas gambar atau dokumen saat pengiriman awal.
          </p>
        )}
      </div>

      {report.ocr_text && (
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-2 text-xs">
          <span className="font-bold text-[#1E293B] block">
            Hasil Pembacaan Pemindai Pesan WhatsApp (OCR):
          </span>
          <p className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E4E0D8] text-[#1E293B] leading-relaxed">
            &ldquo;{report.ocr_text}&rdquo;
          </p>
          {report.ocr_bosp_fact && (
            <p className="text-[#475569]">
              Catatan pencocokan: {report.ocr_bosp_fact}
            </p>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-[#E4E0D8] space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2E6496] block">
          Tindakan Sesuai Status ({report.status})
        </span>

        {report.status === 'SEDANG_DITELAAH' && (
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1E293B]">
                Keputusan Penelaahan Awal
              </h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Tentukan apakah laporan memiliki informasi awal yang cukup untuk dilanjutkan ke pemeriksaan, atau tidak memenuhi syarat untuk ditindaklanjuti.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onAcceptForFollowUp}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Terima untuk Ditindaklanjuti</span>
              </button>

              <button
                type="button"
                onClick={onOpenRejectDialog}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FEF2F2] border border-[#FECACA] text-xs sm:text-sm font-bold text-[#991B1B] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Tolak Laporan</span>
              </button>

              <button
                type="button"
                onClick={onOpenCompleteDialog}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#C9DFDC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-semibold text-[#475569] cursor-pointer sm:ml-auto"
              >
                Selesaikan Langsung (Lewati Pemeriksaan)
              </button>
            </div>
          </div>
        )}

        {report.status === 'PEMERIKSAAN_LANJUTAN' && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#C9DFDC] space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1E293B]">
                  Kegiatan Pemeriksaan Lanjutan yang Dilakukan
                </h4>
                <p className="text-xs text-[#475569]">
                  Centang metode pemeriksaan yang nyata dilakukan agar pelapor tidak melihat seolah-olah dilakukan pemeriksaan lapangan jika kenyataannya hanya pemeriksaan dokumen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INSPECTION_METHOD_OPTIONS.map((method) => {
                  const isChecked = selectedMethods.includes(method.code);
                  return (
                    <label
                      key={method.code}
                      className={`min-h-[44px] p-3 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#EBF3F8] border-[#2E6496] font-semibold text-[#1E293B]'
                          : 'bg-[#FFFFFF] border-[#C9DFDC] text-[#475569]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onToggleMethod(method.code, e.target.checked)}
                        className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496]"
                      />
                      <span>{method.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#E4E0D8] space-y-2">
                <label className="text-xs flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isForwardedCheck}
                    onChange={(e) => onForwardedCheckChange(e.target.checked)}
                    className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496]"
                  />
                  <span className="font-semibold text-[#1E293B]">
                    Proses diteruskan ke instansi terkait
                  </span>
                </label>

                {isForwardedCheck && (
                  <div className="pl-6">
                    <input
                      type="text"
                      value={forwardedToInput}
                      onChange={(e) => onForwardedToInputChange(e.target.value)}
                      placeholder="Nama instansi (contoh: Inspektorat Daerah)..."
                      className="w-full sm:w-80 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#C9DFDC] text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onSaveInspectionProgress}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#2E6496]" />
                <span>Simpan Catatan Metode Pemeriksaan</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#EBF3F8]/50 border border-[#C9DFDC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#1E293B]">
                  Pemeriksaan Selesai Dilaksanakan?
                </h4>
                <p className="text-xs text-[#475569]">
                  Simpan kesimpulan dan catatan hasil penanganan akhir untuk pelapor.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenCompleteDialog}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-2 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan &amp; Simpan Hasil Penanganan</span>
              </button>
            </div>
          </div>
        )}

        {report.status === 'COMPLETED' && (
          <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="font-bold text-[#166534]">
                Hasil Pemeriksaan: {getResolutionOutcomeOption(report.resolution_outcome)?.label || 'Selesai'}
              </span>
              <span className="font-mono text-[#166534] tabular-nums">
                {formatWibDateTime(report.resolved_at)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#1E293B] bg-[#FFFFFF] p-3.5 rounded-xl border border-[#BBF7D0] leading-relaxed">
              {report.public_resolution_note}
            </p>
          </div>
        )}

        {report.status === 'TIDAK_DAPAT_DITINDAKLANJUTI' && (
          <div className="p-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="font-bold text-[#991B1B]">
                Laporan Tidak Dapat Ditindaklanjuti
              </span>
              <span className="font-mono text-[#991B1B] tabular-nums">
                {formatWibDateTime(report.resolved_at)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#1E293B] bg-[#FFFFFF] p-3.5 rounded-xl border border-[#FECACA] leading-relaxed">
              {report.rejection_reason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
