import React from 'react';
import { Lock, Paperclip, Send } from 'lucide-react';
import type {
  OfficerFullReportRow,
  OfficerInternalNoteRow,
  PublicReportMessageItem,
} from '@/types';
import { formatWibDateTime } from '@/utils/reportTracking';

interface ReportCommunicationTabProps {
  report: OfficerFullReportRow;
  messages: PublicReportMessageItem[];
  internalNotes: OfficerInternalNoteRow[];
  infoRequestMessage: string;
  onInfoRequestMessageChange: (value: string) => void;
  isSendingInfoRequest: boolean;
  onSendInfoRequest: (e: React.FormEvent) => void;
  newInternalNote: string;
  onNewInternalNoteChange: (value: string) => void;
  isSubmittingNote: boolean;
  onAddInternalNote: (e: React.FormEvent) => void;
}

export const ReportCommunicationTab: React.FC<ReportCommunicationTabProps> = ({
  report,
  messages,
  internalNotes,
  infoRequestMessage,
  onInfoRequestMessageChange,
  isSendingInfoRequest,
  onSendInfoRequest,
  newInternalNote,
  onNewInternalNoteChange,
  isSubmittingNote,
  onAddInternalNote,
}) => {
  return (
    <div className="space-y-6 animate-view-enter">
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
            Komunikasi Dua Arah dengan Pelapor Anonim
          </h3>
          <p className="text-xs text-[#475569]">
            Pesan pada kolom ini dapat dibaca oleh orang tua pemegang kode tiket untuk melengkapi bukti.
          </p>
        </div>

        {messages.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((m) => {
              const isOfficerMsg = m.sender_type === 'OFFICER';
              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isOfficerMsg
                      ? 'bg-[#EBF3F8] border-[#C9DFDC]'
                      : 'bg-[#FAF8F5] border-[#E4E0D8]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold ${
                        isOfficerMsg ? 'text-[#1D4F7A]' : 'text-[#1E293B]'
                      }`}
                    >
                      {isOfficerMsg
                        ? 'Petugas Dinas Pendidikan'
                        : 'Pelapor Anonim'}
                    </span>
                    <span className="font-mono text-[#475569] tabular-nums">
                      {formatWibDateTime(m.created_at)}
                    </span>
                  </div>
                  <p className="text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                    {m.message}
                  </p>
                  {m.attachments_json && m.attachments_json.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.attachments_json.map((att, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#C9DFDC] text-[11px] font-semibold text-[#2E6496]"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{att.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-4">
            Belum ada pesan komunikasi dengan pelapor pada laporan ini.
          </p>
        )}

        {report.status === 'PEMERIKSAAN_LANJUTAN' && (
          <form onSubmit={onSendInfoRequest} className="space-y-2.5 pt-2">
            <label
              htmlFor="officer-request-info-input"
              className="block text-xs font-bold text-[#1E293B]"
            >
              Kirim Permintaan Informasi / Bukti Tambahan kepada Pelapor:
            </label>
            <textarea
              id="officer-request-info-input"
              rows={3}
              value={infoRequestMessage}
              onChange={(e) => onInfoRequestMessageChange(e.target.value)}
              placeholder="Jelaskan keterangan atau bukti apa yang masih dibutuhkan dari pelapor..."
              className="w-full p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSendingInfoRequest}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSendingInfoRequest
                    ? 'Mengirim...'
                    : 'Kirim Permintaan & Pasang Status Menunggu'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="pt-5 border-t border-[#E4E0D8] space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#991B1B]" />
            <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
              Catatan Internal Petugas (Rahasia)
            </h3>
          </div>
          <p className="text-xs text-[#475569]">
            Catatan di bawah ini hanya dapat dibaca oleh aparatur dinas yang memiliki akses dan tidak pernah ditampilkan kepada pelapor.
          </p>
        </div>

        <form onSubmit={onAddInternalNote} className="space-y-2.5">
          <textarea
            rows={2}
            value={newInternalNote}
            onChange={(e) => onNewInternalNoteChange(e.target.value)}
            placeholder="Tuliskan catatan internal hasil koordinasi, rapat dinas, atau berkas rahasia..."
            className="w-full p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingNote || !newInternalNote.trim()}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span>Simpan Catatan Internal</span>
            </button>
          </div>
        </form>

        {internalNotes.length > 0 ? (
          <div className="space-y-2.5">
            {internalNotes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#1E293B]">
                    {note.officer_name}
                  </span>
                  <span className="font-mono text-[#475569] tabular-nums">
                    {formatWibDateTime(note.created_at)}
                  </span>
                </div>
                <p className="text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                  {note.note}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#475569]">
            Belum ada catatan internal pada laporan ini.
          </p>
        )}
      </div>
    </div>
  );
};
