import React from 'react';
import { Lock } from 'lucide-react';
import type { OfficerInternalNoteRow } from '@/types';
import { formatWibDateTime } from '@/utils/reportTracking';

interface ReportCommunicationTabProps {
  internalNotes: OfficerInternalNoteRow[];
  newInternalNote: string;
  onNewInternalNoteChange: (value: string) => void;
  isSubmittingNote: boolean;
  onAddInternalNote: (e: React.FormEvent) => void;
}

export const ReportCommunicationTab: React.FC<ReportCommunicationTabProps> = ({
  internalNotes,
  newInternalNote,
  onNewInternalNoteChange,
  isSubmittingNote,
  onAddInternalNote,
}) => {
  return (
    <div className="space-y-6 animate-view-enter">
      <div className="space-y-4">
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
            rows={3}
            value={newInternalNote}
            onChange={(e) => onNewInternalNoteChange(e.target.value)}
            placeholder="Tuliskan catatan internal hasil koordinasi, rapat dinas, atau verifikasi lapangan..."
            className="w-full p-3.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingNote || !newInternalNote.trim()}
              className="min-h-[38px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span>{isSubmittingNote ? 'Menyimpan...' : 'Simpan Catatan Internal'}</span>
            </button>
          </div>
        </form>

        {internalNotes.length > 0 ? (
          <div className="space-y-2.5 pt-2">
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
          <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-4">
            Belum ada catatan internal pada laporan ini.
          </p>
        )}
      </div>
    </div>
  );
};
