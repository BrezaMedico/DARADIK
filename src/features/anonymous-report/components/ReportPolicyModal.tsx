import React, { useRef } from 'react';
import { Cookie, FileCheck, X, ChevronRight } from 'lucide-react';

export interface CookieConsentBannerProps {
  hasCookieConsent: boolean;
  onAccept: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  hasCookieConsent,
  onAccept,
}) => {
  if (hasCookieConsent) return null;

  return (
    <aside
      role="region"
      aria-label="Pemberitahuan Persetujuan Cookie dan Penyimpanan Data"
      className="fixed bottom-[calc(var(--mobile-nav-h)+var(--safe-bottom)+0.75rem)] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-4 shadow-xl space-y-3 animate-view-enter"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] text-[#92400E] flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm font-bold text-[#1E293B]">
            Penyimpanan Data &amp; Cookie Lokal
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            DARADIK menggunakan cookie di perangkat Anda untuk menyimpan kode tiket pemantauan laporan secara anonim dan menjaga kuota pengiriman formulir. Kami tidak mengumpulkan data pribadi atau pelacak pihak ketiga.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E4E0D8]/60">
        <button
          type="button"
          onClick={onAccept}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer shadow-xs active:translate-y-[1px]"
        >
          Setujui Penyimpanan Data
        </button>
      </div>
    </aside>
  );
};

export interface ReportPolicyModalProps {
  isOpen: boolean;
  hasScrolledToBottom: boolean;
  isPolicyAgreed: boolean;
  isSubmitting: boolean;
  onReachBottom: () => void;
  onPolicyAgreedChange: (agreed: boolean) => void;
  onClose: () => void;
  onConfirmSubmit: () => void;
}

export const ReportPolicyModal: React.FC<ReportPolicyModalProps> = ({
  isOpen,
  hasScrolledToBottom,
  isPolicyAgreed,
  isSubmitting,
  onReachBottom,
  onPolicyAgreedChange,
  onClose,
  onConfirmSubmit,
}) => {
  const policyScrollContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handlePolicyScroll = () => {
    const el = policyScrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 25) {
      onReachBottom();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-modal-title"
        className="bg-[#FFFFFF] rounded-t-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border-t sm:border border-[#C9DFDC] flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D8] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#2E6496] flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="policy-modal-title"
                className="font-sturdy-heading text-sm sm:text-base font-bold text-[#1E293B]"
              >
                Kebijakan Pelaporan dan Privasi DARADIK
              </h3>
              <p className="text-[11px] text-[#475569]">
                Baca ketentuan berikut sebelum mengirim laporan resmi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#475569] hover:text-[#1E293B] cursor-pointer"
            aria-label="Tutup dialog kebijakan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={policyScrollContainerRef}
          onScroll={handlePolicyScroll}
          className="overflow-y-auto p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8] text-xs text-[#334155] space-y-4 leading-relaxed flex-1"
        >
          <p className="daradik-lead text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
            DARADIK adalah platform keterbukaan dana BOSP yang membantu orang tua memahami penggunaan dana sekolah dan melaporkan dugaan pungutan tidak sesuai ketentuan. Mohon baca kebijakan ini sebelum mengirim laporan.
          </p>

          <div>
            <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
              1. Peran DARADIK
            </div>
            <p>
              DARADIK adalah sarana penyampaian dan pemantauan laporan. DARADIK bukan lembaga penegak hukum dan tidak menjatuhkan putusan hukum. Laporan yang memenuhi syarat diperiksa oleh petugas Dinas Pendidikan dan dapat diteruskan kepada instansi terkait sesuai kewenangan.
            </p>
          </div>

          <div>
            <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
              2. Siapa yang Dapat Melapor
            </div>
            <p>
              Orang tua/wali, siswa, alumni, guru, dan masyarakat yang mengetahui, mengalami, atau memiliki bukti dugaan pungutan di satuan pendidikan.
            </p>
          </div>

          <div>
            <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
              3. Pernyataan Pelapor
            </div>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li>Laporan didasarkan pada kejadian nyata dan dapat dipertanggungjawabkan;</li>
              <li>Laporan tidak dibuat untuk memfitnah atau menyebarkan informasi palsu;</li>
              <li>Anda berhak membagikan bukti pendukung yang diunggah.</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
              4. Perlindungan Identitas Pribadi
            </div>
            <p>
              Jangan mencantumkan nama lengkap anak, NISN, alamat rumah, wajah anak yang dapat dikenali, NIK, atau nomor rekening pribadi. DARADIK tidak meminta akun, nama, nomor HP, atau email saat pelaporan. Satu-satunya akses pemantauan laporan adalah kode tiket unik Anda.
            </p>
          </div>

          <div>
            <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
              5. Bukti Pendukung dan Komunikasi Lanjutan
            </div>
            <p>
              Gambar bukti dikompresi ulang pada perangkat Anda untuk menghapus metadata lokasi GPS maupun perangkat kamera sebelum disimpan ke penyimpanan aman. Melalui kode tiket, Anda dapat melihat perkembangan 5 tahap pemeriksaan dan membalas permintaan informasi tambahan dari petugas tanpa membuka identitas pribadi.
            </p>
          </div>

          <div>
            <div className="font-bold text-[#1E293B] text-xs sm:text-sm mb-1">
              6. Penyimpanan Kode Tiket
            </div>
            <p>
              Simpan kode tiket Anda secara mandiri dan rahasia. Siapa pun yang memegang kode tiket dapat membaca perkembangan dan mengirim balasan tambahan pada laporan tersebut.
            </p>
          </div>
        </div>

        <div className="shrink-0 pt-1">
          <label
            className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-colors select-none ${
              hasScrolledToBottom
                ? 'bg-[#FFFFFF] border-[#2E6496] ring-1 ring-[#2E6496]/20 cursor-pointer'
                : 'bg-[#FAF8F5] border-[#E4E0D8] cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              disabled={!hasScrolledToBottom}
              checked={isPolicyAgreed}
              onChange={(e) => onPolicyAgreedChange(e.target.checked)}
              className="w-4 h-4 rounded border-[#C9DFDC] text-[#2E6496] focus:ring-[#2E6496] mt-0.5 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-xs space-y-0.5">
              <span
                className={
                  hasScrolledToBottom ? 'font-bold text-[#1E293B]' : 'text-[#475569]'
                }
              >
                Saya telah membaca dan menyetujui ketentuan pelaporan DARADIK di atas.
              </span>
              {!hasScrolledToBottom && (
                <div className="text-[11px] text-[#475569]">
                  Gulir kotak kebijakan hingga bagian bawah untuk mengaktifkan kotak persetujuan.
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E4E0D8] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2.5 rounded-xl border border-[#C9DFDC] text-xs font-bold text-[#475569] hover:text-[#1E293B] hover:bg-[#FAF8F5] cursor-pointer transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!isPolicyAgreed || isSubmitting}
            onClick={onConfirmSubmit}
            className={`min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
              isPolicyAgreed && !isSubmitting
                ? 'bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] cursor-pointer'
                : 'bg-[#E4E0D8] text-[#475569] cursor-not-allowed'
            }`}
          >
            <span>Lanjutkan &amp; Kirim Laporan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
