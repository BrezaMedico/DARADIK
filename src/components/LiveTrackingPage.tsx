import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Search,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Lock,
  PlusCircle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { SchoolData } from '../data/schoolsData';

interface ChatMessage {
  id: string;
  sender: 'dinas' | 'reporter';
  senderLabel: string;
  timestamp: string;
  text: string;
}

interface LiveTrackingPageProps {
  ticketCode: string;
  school: SchoolData;
  reportCategory: string;
  reporterNote: string;
  onBackToHome: () => void;
  onBackToSchoolProfile: () => void;
  onShowToast: (message: string) => void;
}

export const LiveTrackingPage: React.FC<LiveTrackingPageProps> = ({
  ticketCode,
  school,
  reportCategory,
  reporterNote,
  onBackToHome,
  onBackToSchoolProfile,
  onShowToast,
}) => {
  const [ticketInput, setTicketInput] = useState<string>(
    ticketCode || 'CHK-2026-8849-BGR'
  );
  const [activeTicket, setActiveTicket] = useState<string>(
    ticketCode || 'CHK-2026-8849-BGR'
  );
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState<boolean>(false);

  // Simulation state for "Selesai / Tuntas"
  const [isSimulatedComplete, setIsSimulatedComplete] =
    useState<boolean>(false);

  // Anonymous Two-Way Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial: ChatMessage[] = [
      {
        id: 'msg-dinas-1',
        sender: 'dinas',
        senderLabel: 'Tim Verifikator Inspektorat & Dinas Pendidikan',
        timestamp: '27 Okt 2026, 10:35 WIB',
        text: 'Halo Pelapor Anonim, kami telah menegur pihak sekolah. Apakah saat ini iuran di grup WhatsApp kelas sudah resmi dibatalkan oleh pihak sekolah?',
      },
    ];
    if (reporterNote.trim()) {
      initial.unshift({
        id: 'msg-initial-note',
        sender: 'reporter',
        senderLabel: 'Anda (Anonim Terenkripsi — Catatan Awal)',
        timestamp: '25 Okt 2026, 09:15 WIB',
        text: reporterNote.trim(),
      });
    }
    return initial;
  });

  const [replyInput, setReplyInput] = useState<string>('');
  const [replyError, setReplyError] = useState<string | null>(null);

  const handleCheckTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = ticketInput.trim().toUpperCase();
    if (!cleaned) {
      setTicketError('Masukkan kode tiket pelacakan (contoh: CHK-2026-8849-BGR).');
      return;
    }
    if (!cleaned.startsWith('CHK-')) {
      setTicketError(
        'Format tiket tidak dikenali. Gunakan format resmi CHK-2026-XXXX-BGR.'
      );
      return;
    }
    setTicketError(null);
    setActiveTicket(cleaned);
    onShowToast(`Menampilkan status terbaru untuk tiket ${cleaned}`);
  };

  const handleCopyTicket = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeTicket);
      }
    } catch {
      // ignore clipboard permission fallback
    }
    setCopiedTicket(true);
    onShowToast(`Kode tiket ${activeTicket} berhasil disalin.`);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyInput.trim();
    if (!trimmed) {
      setReplyError('Silakan ketik isi pesan balasan sebelum menekan Kirim.');
      return;
    }
    setReplyError(null);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'reporter',
      senderLabel: 'Anda (Anonim Terenkripsi)',
      timestamp: `Hari ini, ${hours}:${mins} WIB`,
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyInput('');
  };

  return (
    <div className="w-full py-8 px-4 sm:px-6 animate-view-enter">
      {/* 1 CENTRAL COLUMN CONTAINER (max-w-[680px] per specification) */}
      <div className="max-w-[680px] mx-auto space-y-6">
        {/* 1. Top Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E0D8]">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all duration-150 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={onBackToSchoolProfile}
            className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#2E6496] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all duration-150 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-[#2E6496]" />
            <span>Kembali ke Profil Sekolah</span>
          </button>
        </div>

        {/* 2. Ticket Code Search Card */}
        <div className="bg-[#FFFFFF] border border-[#C8DFDC] rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="ticket-search-input"
              className="text-xs font-mono uppercase tracking-wider font-bold text-[#2E6496]"
            >
              LACAK KODE TIKET PELAPORAN ANONIM
            </label>
            <span className="text-xs font-mono text-[#2E7D32] font-semibold">
              Terhubung ke Inspektorat Daerah
            </span>
          </div>

          <form
            onSubmit={handleCheckTicket}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#2E6496] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="ticket-search-input"
                type="text"
                value={ticketInput}
                onChange={(e) => {
                  setTicketInput(e.target.value);
                  setTicketError(null);
                }}
                className="w-full pl-10 pr-3 py-2.5 text-sm font-mono font-bold bg-[#FAF8F5] border border-[#E4E0D8] rounded-md text-[#1E293B] uppercase tabular-nums focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-md bg-[#2E6496] hover:bg-[#24507a] text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px] transition-all"
              >
                Cek Status
              </button>

              <button
                type="button"
                onClick={handleCopyTicket}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-md bg-[#FAF8F5] hover:bg-[#F4F1EA] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#1E293B] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
              >
                {copiedTicket ? (
                  <>
                    <Check className="w-4 h-4 text-[#2E7D32]" />
                    <span className="text-[#2E7D32]">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#2E6496]" />
                    <span>Salin Kode Tiket</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {ticketError && (
            <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-[#D9534F] bg-[#FDF2F2] border border-[#F5C6CB] px-3 py-2 rounded-md">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ticketError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTicketInput('CHK-2026-8849-BGR');
                  setActiveTicket('CHK-2026-8849-BGR');
                  setTicketError(null);
                }}
                className="font-mono font-bold underline shrink-0"
              >
                Gunakan CHK-2026-8849-BGR
              </button>
            </div>
          )}

          {/* Ticket Context Summary */}
          <div className="mt-4 pt-3.5 border-t border-[#E4E0D8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
            <div>
              Objek Audit:{' '}
              <strong className="text-[#1E293B]">{school.name}</strong> (NPSN:{' '}
              <span className="font-mono tabular-nums">{school.npsn}</span>)
            </div>
            <div className="font-mono text-[#2E6496] font-semibold truncate max-w-full">
              Temuan: {reportCategory}
            </div>
          </div>
        </div>

        {/* 3. Card: PROGRES PENANGANAN DINAS PENDIDIKAN (Vertical Timeline) */}
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
          <div className="px-6 py-4 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6496] font-bold block">
                LIVE TRACKING // TIKET #{activeTicket}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B]">
                PROGRES PENANGANAN DINAS PENDIDIKAN
              </h2>
            </div>

            {/* Presenter Simulation Button */}
            <button
              type="button"
              onClick={() => {
                setIsSimulatedComplete((prev) => !prev);
                onShowToast(
                  !isSimulatedComplete
                    ? 'Simulasi aktif: Status laporan diperbarui menjadi Selesai / Tuntas!'
                    : 'Simulasi dikembalikan ke tahap Ditindaklanjuti.'
                );
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all active:translate-y-[1px] flex items-center gap-1.5 self-start sm:self-auto ${
                isSimulatedComplete
                  ? 'bg-[#FAF8F5] border-[#E4E0D8] text-[#475569] hover:text-[#1E293B]'
                  : 'bg-[#EBF7EE] border-[#2E7D32]/40 text-[#2E7D32] hover:bg-[#dcf2e1]'
              }`}
            >
              {isSimulatedComplete ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Simulasi Status</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Simulasikan Update Status Selesai</span>
                </>
              )}
            </button>
          </div>

          {/* Vertical Timeline Container */}
          <div className="p-6 bg-[#FFFFFF]">
            <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#C8DFDC]">
              {/* Optional Simulated Step 4: SELESAI / TUNTAS */}
              {isSimulatedComplete && (
                <div className="relative animate-view-enter">
                  {/* Active Timeline Node */}
                  <span className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-[#2E7D32] border-4 border-[#EBF7EE] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#FFFFFF]" />
                  </span>

                  <div className="p-4 rounded-md bg-[#EBF7EE] border border-[#2E7D32]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[#2E7D32]">
                        Selesai / Tuntas (28 Okt, 15:20 WIB)
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#2E7D32] text-[#FFFFFF] font-semibold">
                        KASUS DITUTUP TUNTAS
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#1E293B] mt-1.5 leading-relaxed">
                      Pihak sekolah telah resmi membatalkan pungutan di grup WhatsApp kelas dan mengembalikan 100% dana yang sempat terkumpul kepada wali murid. Berita Acara Pemeriksaan (BAP) telah diverifikasi Inspektorat Daerah.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: DITINDAKLANJUTI (Active by default) */}
              <div className="relative">
                <span
                  className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                    !isSimulatedComplete
                      ? 'bg-[#2E7D32] border-4 border-[#C8DFDC]'
                      : 'bg-[#2E7D32] border-2 border-[#FFFFFF]'
                  }`}
                >
                  <Check className="w-3 h-3 text-[#FFFFFF]" />
                </span>

                <div
                  className={`p-4 rounded-md border ${
                    !isSimulatedComplete
                      ? 'bg-[#EBF7EE] border-[#2E7D32]/50 shadow-sm'
                      : 'bg-[#FAF8F5] border-[#E4E0D8]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#1E293B]">
                      Ditindaklanjuti (Saat Ini —{' '}
                      <span className="font-mono tabular-nums">
                        27 Okt, 10:30 WIB
                      </span>
                      )
                    </span>
                    {!isSimulatedComplete && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#2E7D32] text-[#FFFFFF] font-semibold">
                        STATUS AKTIF
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
                    Dinas Pendidikan {school.kabupaten} telah memanggil pihak sekolah dan menginstruksikan pembatalan iuran wali murid serta pengembalian dana yang sudah terkumpul.
                  </p>
                </div>
              </div>

              {/* Step 2: DIVERIFIKASI */}
              <div className="relative">
                <span className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-[#2E7D32] border-2 border-[#FFFFFF] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#FFFFFF]" />
                </span>

                <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#E4E0D8]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#1E293B]">
                      Diverifikasi (
                      <span className="font-mono tabular-nums">
                        26 Okt, 14:00 WIB
                      </span>
                      )
                    </span>
                    <span className="text-[11px] font-mono text-[#2E7D32] font-semibold">
                      Bukti Valid
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                    Bukti screenshot WA terbukti cocok dan tumpang tindih dengan pencairan data BOSP Tahap 2 (Peralatan Kipas Angin{' '}
                    <span className="font-mono font-semibold text-[#1E293B] tabular-nums">
                      Rp 35.000.000
                    </span>
                    ).
                  </p>
                </div>
              </div>

              {/* Step 1: LAPORAN DITERIMA */}
              <div className="relative">
                <span className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-[#2E7D32] border-2 border-[#FFFFFF] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#FFFFFF]" />
                </span>

                <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#E4E0D8]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#1E293B]">
                      Laporan Diterima (
                      <span className="font-mono tabular-nums">
                        25 Okt, 09:15 WIB
                      </span>
                      )
                    </span>
                    <span className="text-[11px] font-mono text-[#475569]">
                      Terenkripsi SHA-256
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                    Laporan terenkripsi masuk ke sistem pengawasan Inspektorat & Dinas Pendidikan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Card: KOMUNIKASI DUA ARAH ANONIM ("Pesan dari Dinas Pendidikan") */}
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] rounded-lg shadow-sm overflow-hidden divide-y divide-[#E4E0D8]">
          <div className="px-6 py-4 bg-[#FAF8F5] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2E6496]" />
              <h3 className="text-sm sm:text-base font-extrabold text-[#1E293B]">
                Pesan dari Dinas Pendidikan (Komunikasi 2 Arah Anonim)
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2E7D32] font-semibold">
              <Lock className="w-3 h-3" />
              Identitas Terlindungi
            </span>
          </div>

          {/* Chat History Stream */}
          <div className="p-6 bg-[#FFFFFF] space-y-4 max-h-80 overflow-y-auto">
            {messages.map((msg) => {
              const isDinas = msg.sender === 'dinas';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isDinas ? 'items-start' : 'items-end'
                  } animate-view-enter`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-[#475569]">
                    <span className="font-semibold text-[#1E293B]">
                      {msg.senderLabel}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[90%] sm:max-w-[82%] p-3.5 rounded-md text-xs sm:text-sm leading-relaxed border ${
                      isDinas
                        ? 'bg-[#F4F1EA] border-[#C8DFDC] text-[#1E293B]'
                        : 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Input Box */}
          <form
            onSubmit={handleSendReply}
            className="p-4 bg-[#FAF8F5] space-y-2.5"
          >
            {/* Quick Suggestion Chips for Fast Demo */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#475569]">
                Balasan cepat:
              </span>
              {[
                'Sudah dibatalkan hari ini oleh wali kelas, terima kasih.',
                'Masih diminta dikumpulkan paling lambat besok pagi.',
              ].map((quickText) => (
                <button
                  key={quickText}
                  type="button"
                  onClick={() => {
                    setReplyInput(quickText);
                    setReplyError(null);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-[#2E6496] hover:bg-[#C8DFDC]/30 transition-colors"
                >
                  "{quickText}"
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => {
                  setReplyInput(e.target.value);
                  setReplyError(null);
                }}
                placeholder="Ketik balasan anonim..."
                className="flex-1 px-3.5 py-2.5 text-sm bg-[#FFFFFF] border border-[#E4E0D8] rounded-md text-[#1E293B] placeholder:text-[#475569]/70 focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-md bg-[#2E6496] hover:bg-[#24507a] text-[#FFFFFF] text-xs sm:text-sm font-bold active:translate-y-[1px] transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Kirim</span>
              </button>
            </div>

            {replyError && (
              <div className="text-xs text-[#D9534F] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{replyError}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
