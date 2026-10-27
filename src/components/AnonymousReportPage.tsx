import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Lock,
  Paperclip,
  Send,
  CheckCircle2,
  Plus,
  X,
  EyeOff,
  Building2,
  FileWarning,
  RefreshCw,
} from 'lucide-react';
import { SCHOOLS_DATABASE, SchoolData } from '../data/schoolsData';

interface AnonymousReportPageProps {
  selectedSchool: SchoolData;
  onChangeSchool: (school: SchoolData) => void;
  prefilledCategory: string;
  prefilledAttachment: string;
  onCancel: () => void;
  onSubmitSuccess: (ticketCode: string, notes: string, category: string) => void;
}

const PRESET_CATEGORIES = [
  'Iuran Kipas Angin (Tumpang Tindih dengan Dana BOSP Rp 35.000.000)',
  'Iuran Cat Kelas & Renovasi (Tumpang Tindih dengan Dana BOSP Rp 12.500.000)',
  'Kewajiban Beli Buku / LKS (Tumpang Tindih dengan Buku BOSP Rp 40.000.000)',
  'Kejanggalan Fisik Proyektor Kelas (Anggaran BOSP Rp 28.000.000)',
  'Iuran Perbaikan Kamar Mandi / Sanitasi (Anggaran BOSP Rp 18.500.000)',
  'Laporan Pungutan Mengikat di Luar RKAS (Pentas Seni & Kaos Kelas Rp 35.000/siswa)',
];

export const AnonymousReportPage: React.FC<AnonymousReportPageProps> = ({
  selectedSchool,
  onChangeSchool,
  prefilledCategory,
  prefilledAttachment,
  onCancel,
  onSubmitSuccess,
}) => {
  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [category, setCategory] = useState<string>(
    prefilledCategory || PRESET_CATEGORIES[0]
  );
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [extraAttachments, setExtraAttachments] = useState<string[]>([]);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtraAttachments((prev) => [
      ...prev,
      `${file.name} (Metadata EXIF Dihapus)`,
    ]);
  };

  const handleAddSimulatedAttachment = () => {
    const sampleName = `Bukti_Tambahan_${extraAttachments.length + 1}_Tersensor.jpg`;
    setExtraAttachments((prev) => [...prev, sampleName]);
  };

  const handleRemoveExtra = (index: number) => {
    setExtraAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEncrypting(true);

    // 1-second encryption simulation, then show ticket code CHK-2026-8849-BGR and transition to Page 5
    setTimeout(() => {
      setIsEncrypting(false);
      const ticket = 'CHK-2026-8849-BGR';
      setGeneratedTicket(ticket);

      setTimeout(() => {
        onSubmitSuccess(ticket, additionalNotes, category);
      }, 950);
    }, 950);
  };

  return (
    <div className="w-full py-8 px-4 sm:px-6 animate-view-enter">
      {/* 1 CENTRAL CARD CONTAINER (max-w-[640px] per specification) */}
      <div className="max-w-[640px] mx-auto">
        {/* 1. Top Navigation */}
        <div className="pb-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E0D8] text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F4F1EA] active:translate-y-[1px] transition-all duration-150 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E6496]" />
            <span>Batal / Kembali</span>
          </button>
        </div>

        {/* 2. Security Header */}
        <div className="bg-[#1E293B] text-[#FAF8F5] border border-[#1E293B] rounded-t-lg p-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C8DFDC] font-semibold">
            <Lock className="w-4 h-4 text-[#C8DFDC]" />
            <span>PROTOKOL ZERO-KNOWLEDGE WHISTLEBLOWING</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] mt-1.5 flex items-center gap-2.5">
            <span>Kirim Laporan 100% Anonim</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#C8DFDC] mt-1.5 leading-relaxed max-w-[65ch]">
            Identitas, IP Address, lokasi perangkat, dan nomor HP Anda dienkripsi dan TIDAK direkam oleh sistem.
          </p>
        </div>

        {/* 3. Main Card: RINGKASAN LAPORAN OTOMATIS */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFFFF] border-x border-b border-[#E4E0D8] rounded-b-lg shadow-sm divide-y divide-[#E4E0D8]"
        >
          <div className="px-6 py-3.5 bg-[#FAF8F5] flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#2E6496]">
              RINGKASAN LAPORAN OTOMATIS
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2E7D32] font-semibold">
              <EyeOff className="w-3.5 h-3.5" />
              Enkripsi End-to-End Aktif
            </span>
          </div>

          {/* Field 1: Sekolah */}
          <div className="p-6">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-mono uppercase text-[#475569] font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#2E6496]" />
                <span>Sekolah Tujuan Audit</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSchool((prev) => !prev)}
                className="text-xs font-mono font-semibold text-[#2E6496] hover:underline"
              >
                {isEditingSchool ? 'Selesai Ubah' : 'Ubah Sekolah'}
              </button>
            </div>

            {isEditingSchool ? (
              <select
                value={selectedSchool.id}
                onChange={(e) => {
                  const found = SCHOOLS_DATABASE.find(
                    (s) => s.id === e.target.value
                  );
                  if (found) onChangeSchool(found);
                  setIsEditingSchool(false);
                }}
                className="w-full mt-1 px-3 py-2 text-sm bg-[#FAF8F5] border border-[#E4E0D8] rounded-md text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
              >
                {SCHOOLS_DATABASE.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (NPSN: {s.npsn}) — {s.kabupaten}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3.5 rounded-md bg-[#FAF8F5] border border-[#E4E0D8] flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#1E293B]">
                    {selectedSchool.name}{' '}
                    <span className="font-mono text-xs sm:text-sm font-semibold text-[#2E6496] tabular-nums">
                      (NPSN: {selectedSchool.npsn})
                    </span>
                  </div>
                  <div className="text-xs text-[#475569] mt-0.5">
                    Kec. {selectedSchool.kecamatan}, {selectedSchool.kabupaten},{' '}
                    {selectedSchool.provinsi}
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#2E7D32] border border-[#2E7D32]/30 shrink-0">
                  Terverifikasi
                </span>
              </div>
            )}
          </div>

          {/* Field 2: Kategori Temuan */}
          <div className="p-6">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-mono uppercase text-[#475569] font-semibold flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-[#D9534F]" />
                <span>Kategori Temuan (Terisi Otomatis oleh AI)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingCategory((prev) => !prev)}
                className="text-xs font-mono font-semibold text-[#2E6496] hover:underline"
              >
                {isEditingCategory ? 'Selesai' : 'Sesuaikan Kategori'}
              </button>
            </div>

            {isEditingCategory ? (
              <div className="space-y-2 mt-1">
                <select
                  value={
                    PRESET_CATEGORIES.includes(category) ? category : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E4E0D8] rounded-md text-[#1E293B] font-medium focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FFFFFF] border border-[#E4E0D8] rounded-md text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
                  placeholder="Atau ketik kategori temuan spesifik..."
                />
              </div>
            ) : (
              <div className="p-3.5 rounded-md bg-[#FDF2F2] border border-[#F5C6CB] text-sm font-bold text-[#D9534F]">
                {category}
              </div>
            )}
          </div>

          {/* Field 3: Lampiran Bukti */}
          <div className="p-6">
            <span className="text-xs font-mono uppercase text-[#475569] font-semibold block mb-2">
              Lampiran Bukti Terenkripsi
            </span>

            <div className="space-y-2">
              {/* Primary Prefilled Attachment Badge */}
              <div className="p-3 rounded-md bg-[#C8DFDC]/40 border border-[#629BB5]/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1E293B]">
                  <Paperclip className="w-4 h-4 text-[#2E6496] shrink-0" />
                  <span>{prefilledAttachment}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#C8DFDC] text-[#2E7D32] font-semibold shrink-0">
                  Siap Kirim
                </span>
              </div>

              {/* Extra Optional Attachments */}
              {extraAttachments.map((att, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md bg-[#FAF8F5] border border-[#E4E0D8] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 font-mono text-[#1E293B]">
                    <Paperclip className="w-3.5 h-3.5 text-[#2E6496]" />
                    <span>{att}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtra(idx)}
                    className="text-[#475569] hover:text-[#D9534F]"
                    aria-label="Hapus lampiran tambahan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleAddAttachment}
              className="hidden"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md bg-[#FAF8F5] hover:bg-[#F4F1EA] border border-[#E4E0D8] text-xs font-semibold text-[#2E6496] active:translate-y-[1px] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Lampiran Opsional (File)</span>
              </button>
              <button
                type="button"
                onClick={handleAddSimulatedAttachment}
                className="px-3 py-1.5 rounded-md bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#E4E0D8] text-xs font-mono text-[#475569] hover:text-[#1E293B]"
              >
                + Simulasi Lampirkan Bukti Kwitansi/Foto
              </button>
            </div>
          </div>

          {/* Field 4: Catatan Tambahan (Opsional) */}
          <div className="p-6">
            <label
              htmlFor="report-notes"
              className="block text-xs font-mono uppercase text-[#475569] font-semibold mb-2"
            >
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              id="report-notes"
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Contoh: Diminta kumpul paling lambat hari Sabtu melalui bendahara kelas..."
              className="w-full p-3 text-sm bg-[#FFFFFF] border border-[#E4E0D8] rounded-md text-[#1E293B] placeholder:text-[#475569]/70 focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
            />
          </div>

          {/* Encryption / Ticket Confirmation Banner if Submitting */}
          {generatedTicket && (
            <div className="p-5 bg-[#EBF7EE] border-t border-[#2E7D32]/30 flex items-center justify-between gap-3 animate-view-enter">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#2E7D32] shrink-0" />
                <div>
                  <div className="text-xs font-mono uppercase font-bold text-[#2E7D32]">
                    LAPORAN TERENKRIPSI BERHASIL DIKIRIM!
                  </div>
                  <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                    Kode Tiket Pelacakan Anda:{' '}
                    <span className="font-mono text-[#2E6496] underline tabular-nums">
                      {generatedTicket}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#475569]">
                Mengarahkan ke Live Tracking...
              </span>
            </div>
          )}

          {/* Field 5: Submit Action Button */}
          <div className="p-6 bg-[#FAF8F5] rounded-b-lg">
            <button
              type="submit"
              disabled={isEncrypting || !!generatedTicket}
              className="w-full py-3.5 px-6 rounded-md bg-[#2E6496] hover:bg-[#24507a] disabled:bg-[#629BB5] text-[#FFFFFF] font-bold text-sm sm:text-base shadow-sm active:translate-y-[1px] transition-all duration-150 flex items-center justify-center gap-2.5"
            >
              {isEncrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="font-mono text-sm">
                    Mengenkripsi Laporan & Menghapus Jejak IP...
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim ke Dinas Pendidikan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
