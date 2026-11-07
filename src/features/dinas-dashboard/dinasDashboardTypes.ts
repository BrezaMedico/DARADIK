import type { ResolutionOutcomeCode } from '@/types';

export interface DinasDashboardPageProps {
  onBackToHome: () => void;
  onShowToast: (message: string) => void;
}

export type QueueCategoryTab =
  | 'ALL'
  | 'UNOPENED'
  | 'REVIEW'
  | 'INSPECTION'
  | 'WAITING_INFO'
  | 'COMPLETED'
  | 'REJECTED';

export type DetailActiveSection =
  | 'pemeriksaan'
  | 'sekolah'
  | 'komunikasi'
  | 'riwayat';

export interface QueueCounters {
  totalMasuk: number;
  belumDibuka: number;
  sedangDiproses: number;
  menungguInfo: number;
  selesai: number;
}

export interface LightboxMeta {
  url: string;
  title: string;
}

export const RECOMMENDED_RESOLUTION_NOTES: Record<ResolutionOutcomeCode, string[]> = {
  HAS_INDICATION: [
    'Ditemukan indikasi ketidaksesuaian alokasi BOSP. Dinas Pendidikan telah menerbitkan surat peringatan dan instruksi pengembalian dana kepada pihak sekolah.',
    'Pemeriksaan dokumen membuktikan adanya pungutan di luar ketentuan Juknis BOSP. Sekolah diinstruksikan menghentikan pungutan dan mengembalikan biaya kepada orang tua siswa.',
  ],
  NO_INDICATION: [
    'Pemeriksaan SPJ dan klarifikasi membuktikan alokasi BOSP telah sesuai ketentuan peraturan perundang-undangan dan tidak ditemukan indikasi pelanggaran.',
    'Dokumen pertanggungjawaban sekolah lengkap dan sah. Dugaan dalam laporan telah diklarifikasi sesuai prosedur pengelolaan BOSP.',
  ],
  INCONCLUSIVE: [
    'Bukti dan keterangan yang dihimpun belum cukup membuktikan dugaan. Laporan dicatat dalam arsip pengawasan berkala Dinas Pendidikan.',
    'Dokumen pendukung yang tersedia belum memadai untuk disimpulkan. Pengawasan tindak lanjut akan dimasukkan dalam jadwal audit berkala dinas.',
  ],
};
