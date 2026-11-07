import React from 'react';
import {
  MessageSquare,
  Paperclip,
  Upload,
  Send,
  X,
} from 'lucide-react';
import type { PublicReportMessageItem } from '@/types';
import { formatWibDateTime } from '@/utils/reportTracking';
import type { PendingReplyFile } from '../trackingCookieUtils';

export interface TrackingTwoWayChatProps {
  messages: PublicReportMessageItem[];
  canReplyAdditionalInfo: boolean;
  replyMessage: string;
  replyFiles: PendingReplyFile[];
  isCompressingReply: boolean;
  isSendingReply: boolean;
  replyError: string | null;
  replyFileInputRef: React.RefObject<HTMLInputElement>;
  onReplyMessageChange: (value: string) => void;
  onReplyFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReplyFile: (id: string) => void;
  onSendAdditionalInfo: (e: React.FormEvent) => void;
  onPreviewAttachment: (image: { url: string; title: string }) => void;
}

export const TrackingTwoWayChat: React.FC<TrackingTwoWayChatProps> = ({
  messages,
  canReplyAdditionalInfo,
  replyMessage,
  replyFiles,
  isCompressingReply,
  isSendingReply,
  replyError,
  replyFileInputRef,
  onReplyMessageChange,
  onReplyFileSelect,
  onRemoveReplyFile,
  onSendAdditionalInfo,
  onPreviewAttachment,
}) => {
  if (messages.length === 0 && !canReplyAdditionalInfo) {
    return null;
  }

  return (
    <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#2E6496]" />
          <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
            Komunikasi Pemeriksaan Anonim
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#475569]">
          Riwayat pesan klarifikasi dan bukti tambahan antara petugas Dinas Pendidikan dan pelapor tanpa menampilkan identitas pribadi.
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isOfficer = msg.sender_type === 'OFFICER';
            return (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border space-y-2 ${
                  isOfficer
                    ? 'bg-[#EBF3F8]/60 border-[#C9DFDC]'
                    : 'bg-[#FAF8F5] border-[#E4E0D8]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span
                    className={`font-bold ${
                      isOfficer ? 'text-[#1D4F7A]' : 'text-[#1E293B]'
                    }`}
                  >
                    {msg.sender_label}
                  </span>
                  <span className="font-mono text-[11px] text-[#475569] tabular-nums">
                    {formatWibDateTime(msg.created_at)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>

                {msg.attachments_json && msg.attachments_json.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-2">
                    {msg.attachments_json.map((att, i) =>
                      att.url ? (
                        <button
                          key={`${msg.id}-att-${i}`}
                          type="button"
                          onClick={() =>
                            onPreviewAttachment({
                              url: att.url!,
                              title: att.name,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-xs font-semibold text-[#2E6496] hover:bg-[#EBF3F8] cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{att.name}</span>
                        </button>
                      ) : (
                        <span
                          key={`${msg.id}-att-${i}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E4E0D8] text-xs text-[#475569]"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{att.name}</span>
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[#475569] bg-[#FAF8F5] border border-[#E4E0D8] rounded-xl p-4">
          Belum ada pesan komunikasi pada laporan ini.
        </p>
      )}

      {canReplyAdditionalInfo && (
        <form
          onSubmit={onSendAdditionalInfo}
          className="pt-4 border-t border-[#E4E0D8] space-y-3"
        >
          <label
            htmlFor="reporter-reply-textarea"
            className="block text-xs sm:text-sm font-bold text-[#1E293B]"
          >
            Balas Pesan atau Tambah Bukti Pendukung Secara Anonim
          </label>

          {replyError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#991B1B]"
            >
              {replyError}
            </div>
          )}

          <textarea
            id="reporter-reply-textarea"
            rows={3}
            value={replyMessage}
            onChange={(e) => onReplyMessageChange(e.target.value)}
            placeholder="Tuliskan informasi tambahan untuk membantu pemeriksaan petugas (hindari menuliskan nama pribadi atau nomor HP)..."
            className="w-full p-3.5 rounded-xl bg-[#FAF8F5] focus:bg-[#FFFFFF] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
          />

          {replyFiles.length > 0 && (
            <div className="space-y-2">
              {replyFiles.map((rf) => (
                <div
                  key={rf.id}
                  className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-[#2E6496] shrink-0" />
                    <span className="font-semibold text-[#1E293B] truncate">
                      {rf.name}
                    </span>
                    <span className="text-[#475569] shrink-0">
                      ({rf.sizeFormatted})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveReplyFile(rf.id)}
                    className="p-1 text-[#475569] hover:text-[#991B1B] cursor-pointer"
                    aria-label={`Hapus berkas ${rf.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={replyFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={onReplyFileSelect}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => replyFileInputRef.current?.click()}
              disabled={isCompressingReply || replyFiles.length >= 3 || isSendingReply}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-bold text-[#1E293B] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-[#2E6496]" />
              <span>
                {isCompressingReply
                  ? 'Memproses Berkas...'
                  : `Unggah Bukti Tambahan (${replyFiles.length}/3)`}
              </span>
            </button>

            <button
              type="submit"
              disabled={isSendingReply || isCompressingReply}
              className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSendingReply ? 'Mengirim Balasan...' : 'Kirim Informasi Tambahan'}
              </span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
