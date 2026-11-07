export type ReportInternalStatus =
  | 'SUBMITTED'
  | 'QUEUED'
  | 'SEDANG_DITELAAH'
  | 'PEMERIKSAAN_LANJUTAN'
  | 'TIDAK_DAPAT_DITINDAKLANJUTI'
  | 'COMPLETED';

export type ResolutionOutcomeCode =
  | 'HAS_INDICATION'
  | 'NO_INDICATION'
  | 'INCONCLUSIVE';

export type InspectionMethodCode =
  | 'PEMERIKSAAN_DOKUMEN'
  | 'PENCOCOKAN_SPJ'
  | 'KLARIFIKASI_SEKOLAH'
  | 'PEMERIKSAAN_INVENTARIS'
  | 'PEMERIKSAAN_LAPANGAN';

export interface MainTrackingStage {
  step: number;
  statusKey: ReportInternalStatus;
  label: string;
  parentDescription: string;
  officerLabel: string;
}

export const REPORT_MAIN_STAGES: MainTrackingStage[] = [
  {
    step: 1,
    statusKey: 'SUBMITTED',
    label: 'Laporan Terkirim',
    parentDescription:
      'Laporan kamu berhasil dikirim dan telah diterima oleh sistem DARADIK. Laporan akan masuk ke antrean pemeriksaan petugas.',
    officerLabel: 'Laporan Terkirim',
  },
  {
    step: 2,
    statusKey: 'QUEUED',
    label: 'Menunggu Pemeriksaan',
    parentDescription:
      'Laporan kamu telah masuk ke antrean Dinas Pendidikan dan sedang menunggu untuk diperiksa oleh petugas.',
    officerLabel: 'Belum Dibuka',
  },
  {
    step: 3,
    statusKey: 'SEDANG_DITELAAH',
    label: 'Sedang Ditelaah',
    parentDescription:
      'Petugas sedang memeriksa isi laporan dan bukti pendukung yang kamu kirimkan untuk menentukan apakah laporan dapat ditindaklanjuti.',
    officerLabel: 'Sedang Ditelaah',
  },
  {
    step: 4,
    statusKey: 'PEMERIKSAAN_LANJUTAN',
    label: 'Pemeriksaan Lanjutan',
    parentDescription:
      'Laporan kamu telah diterima untuk ditindaklanjuti. Petugas sedang melakukan pemeriksaan lebih lanjut terhadap informasi dan bukti yang tersedia.',
    officerLabel: 'Pemeriksaan Lanjutan',
  },
  {
    step: 5,
    statusKey: 'COMPLETED',
    label: 'Hasil Penanganan',
    parentDescription:
      'Proses pemeriksaan laporan telah selesai. Berikut merupakan hasil penanganan dan keterangan dari petugas Dinas Pendidikan.',
    officerLabel: 'Selesai',
  },
];

export const REJECTION_QUICK_REASONS: string[] = [
  'Informasi laporan tidak cukup.',
  'Bukti tidak relevan dengan laporan.',
  'Laporan berada di luar kewenangan Dinas Pendidikan.',
  'Laporan merupakan duplikasi.',
  'Alasan lainnya.',
];

export interface ResolutionOutcomeOption {
  code: ResolutionOutcomeCode;
  label: string;
  description: string;
  parentSummary: string;
}

export const RESOLUTION_OUTCOME_OPTIONS: ResolutionOutcomeOption[] = [
  {
    code: 'HAS_INDICATION',
    label: 'Ditemukan Indikasi Permasalahan',
    description:
      'Digunakan ketika hasil pemeriksaan menemukan indikasi masalah yang sesuai dengan laporan.',
    parentSummary:
      'Pemeriksaan petugas menemukan adanya indikasi permasalahan yang sesuai dengan isi laporan dan telah ditindaklanjuti sesuai kewenangan Dinas Pendidikan.',
  },
  {
    code: 'NO_INDICATION',
    label: 'Tidak Ditemukan Indikasi Permasalahan',
    description:
      'Digunakan ketika pemeriksaan tidak menemukan bukti yang mendukung dugaan dalam laporan.',
    parentSummary:
      'Berdasarkan pemeriksaan atas dokumen dan keterangan yang tersedia, tidak ditemukan indikasi permasalahan yang mendukung dugaan pada laporan.',
  },
  {
    code: 'INCONCLUSIVE',
    label: 'Belum Dapat Disimpulkan',
    description:
      'Digunakan ketika bukti atau informasi yang tersedia belum cukup untuk menentukan hasil pemeriksaan.',
    parentSummary:
      'Bukti atau informasi yang tersedia saat ini belum cukup untuk menyimpulkan hasil pemeriksaan secara pasti.',
  },
];

export interface InspectionMethodOption {
  code: InspectionMethodCode;
  label: string;
}

export const INSPECTION_METHOD_OPTIONS: InspectionMethodOption[] = [
  {
    code: 'PEMERIKSAAN_DOKUMEN',
    label: 'Pemeriksaan dokumen pendukung',
  },
  {
    code: 'PENCOCOKAN_SPJ',
    label: 'Pencocokan data laporan dengan dokumen anggaran atau SPJ yang sah',
  },
  {
    code: 'KLARIFIKASI_SEKOLAH',
    label: 'Klarifikasi kepada pihak sekolah',
  },
  {
    code: 'PEMERIKSAAN_INVENTARIS',
    label: 'Pemeriksaan barang inventaris atau fasilitas sekolah',
  },
  {
    code: 'PEMERIKSAAN_LAPANGAN',
    label: 'Pemeriksaan lapangan',
  },
];

export function normalizeReportStatus(raw?: string | null): ReportInternalStatus {
  const s = (raw || '').trim().toUpperCase();
  if (s === 'SUBMITTED') return 'SUBMITTED';
  if (s === 'QUEUED') return 'QUEUED';
  if (s === 'SEDANG_DITELAAH') return 'SEDANG_DITELAAH';
  if (s === 'PEMERIKSAAN_LANJUTAN') return 'PEMERIKSAAN_LANJUTAN';
  if (s === 'TIDAK_DAPAT_DITINDAKLANJUTI') return 'TIDAK_DAPAT_DITINDAKLANJUTI';
  if (s === 'COMPLETED') return 'COMPLETED';
  return 'QUEUED';
}

export function getParentStatusLabel(
  statusRaw?: string | null,
  waitingAdditionalInfo?: boolean
): string {
  const status = normalizeReportStatus(statusRaw);
  if (status === 'TIDAK_DAPAT_DITINDAKLANJUTI') {
    return 'Tidak Dapat Ditindaklanjuti';
  }
  if (status === 'PEMERIKSAAN_LANJUTAN' && waitingAdditionalInfo) {
    return 'Pemeriksaan Lanjutan (Perlu Informasi Tambahan)';
  }
  const found = REPORT_MAIN_STAGES.find((st) => st.statusKey === status);
  return found ? found.label : 'Menunggu Pemeriksaan';
}

export function getOfficerStatusLabel(
  statusRaw?: string | null,
  waitingAdditionalInfo?: boolean,
  openedAt?: string | null
): string {
  const status = normalizeReportStatus(statusRaw);
  if (status === 'SUBMITTED' || (status === 'QUEUED' && !openedAt)) {
    return 'Belum Dibuka';
  }
  if (status === 'QUEUED') return 'Menunggu Pemeriksaan';
  if (status === 'SEDANG_DITELAAH') return 'Sedang Ditelaah';
  if (status === 'PEMERIKSAAN_LANJUTAN') {
    return waitingAdditionalInfo
      ? 'Menunggu Informasi Tambahan'
      : 'Pemeriksaan Lanjutan';
  }
  if (status === 'TIDAK_DAPAT_DITINDAKLANJUTI') {
    return 'Tidak Dapat Ditindaklanjuti';
  }
  if (status === 'COMPLETED') return 'Selesai';
  return 'Belum Dibuka';
}

export function getResolutionOutcomeOption(
  code?: string | null
): ResolutionOutcomeOption | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return RESOLUTION_OUTCOME_OPTIONS.find((o) => o.code === upper) || null;
}

export function getInspectionMethodLabel(code: string): string {
  const found = INSPECTION_METHOD_OPTIONS.find((m) => m.code === code);
  return found ? found.label : code;
}

/**
 * Mengonversi nilai ISO/UTC timestamp dari database menjadi waktu WIB yang konsisten.
 * Contoh keluaran: "7 November 2026 • 04:44 WIB"
 */
export function formatWibDateTime(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return 'Data belum tersedia';

  let parsed: Date;
  if (isoOrDate instanceof Date) {
    parsed = isoOrDate;
  } else {
    const raw = String(isoOrDate).trim();
    if (!raw) return 'Data belum tersedia';
    const hasExplicitTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
    const normalizedIso =
      !hasExplicitTz && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw)
        ? `${raw.replace(' ', 'T')}Z`
        : raw;
    parsed = new Date(normalizedIso);
  }

  if (Number.isNaN(parsed.getTime())) {
    return 'Data belum tersedia';
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(parsed);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour').padStart(2, '0');
  const minute = getPart('minute').padStart(2, '0');

  return `${day} ${month} ${year} • ${hour}:${minute} WIB`;
}

/**
 * Menghasilkan tanggal lokal YYYY-MM-DD dalam zona waktu Asia/Jakarta untuk pencocokan filter tanggal.
 */
export function toWibDateInputString(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return '';
  const raw = isoOrDate instanceof Date ? isoOrDate.toISOString() : String(isoOrDate).trim();
  const hasExplicitTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  const normalizedIso =
    !hasExplicitTz && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw)
      ? `${raw.replace(' ', 'T')}Z`
      : raw;
  const parsed = new Date(normalizedIso);
  if (Number.isNaN(parsed.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(parsed);
}

export interface TimelineStageView {
  step: number;
  statusKey: ReportInternalStatus;
  label: string;
  description: string;
  state: 'done' | 'current' | 'pending' | 'skipped' | 'stopped';
  stateLabel: string;
  timestampWib: string | null;
}

export interface PublicStatusHistoryItem {
  id: string;
  previous_status: string | null;
  new_status: string;
  actor_label: string;
  note: string | null;
  created_at: string;
}

export function buildParentTimelineStages(
  statusRaw: string | null | undefined,
  createdAt: string | null | undefined,
  openedAt: string | null | undefined,
  resolvedAt: string | null | undefined,
  skipInspectionReason: string | null | undefined,
  history: PublicStatusHistoryItem[]
): TimelineStageView[] {
  const status = normalizeReportStatus(statusRaw);

  const findFirstHistoryTime = (targetStatus: string): string | null => {
    const found = history.find((h) => h.new_status === targetStatus);
    return found?.created_at || null;
  };

  const submittedTime = findFirstHistoryTime('SUBMITTED') || createdAt || null;
  const queuedTime = findFirstHistoryTime('QUEUED') || createdAt || null;
  const reviewTime = findFirstHistoryTime('SEDANG_DITELAAH') || openedAt || null;
  const inspectionTime = findFirstHistoryTime('PEMERIKSAAN_LANJUTAN');
  const completedTime =
    findFirstHistoryTime('COMPLETED') ||
    findFirstHistoryTime('TIDAK_DAPAT_DITINDAKLANJUTI') ||
    resolvedAt ||
    null;

  return REPORT_MAIN_STAGES.map((stage) => {
    // 1. Jika laporan ditolak pada tahap Sedang Ditelaah (TIDAK_DAPAT_DITINDAKLANJUTI)
    if (status === 'TIDAK_DAPAT_DITINDAKLANJUTI') {
      if (stage.step === 1) {
        return {
          step: stage.step,
          statusKey: stage.statusKey,
          label: stage.label,
          description: stage.parentDescription,
          state: 'done',
          stateLabel: 'Selesai',
          timestampWib: submittedTime ? formatWibDateTime(submittedTime) : null,
        };
      }
      if (stage.step === 2) {
        return {
          step: stage.step,
          statusKey: stage.statusKey,
          label: stage.label,
          description: stage.parentDescription,
          state: 'done',
          stateLabel: 'Selesai',
          timestampWib: queuedTime ? formatWibDateTime(queuedTime) : null,
        };
      }
      if (stage.step === 3) {
        return {
          step: stage.step,
          statusKey: stage.statusKey,
          label: stage.label,
          description: stage.parentDescription,
          state: 'stopped',
          stateLabel: 'Tidak Dapat Ditindaklanjuti',
          timestampWib: completedTime
            ? formatWibDateTime(completedTime)
            : reviewTime
            ? formatWibDateTime(reviewTime)
            : null,
        };
      }
      return {
        step: stage.step,
        statusKey: stage.statusKey,
        label: stage.label,
        description: stage.parentDescription,
        state: 'pending',
        stateLabel: 'Tidak Dilanjutkan',
        timestampWib: null,
      };
    }

    // 2. Alur normal 5 tahap (termasuk jika tahap 4 dilewati dengan alasan resmi)
    const activeStepMap: Record<ReportInternalStatus, number> = {
      SUBMITTED: 1,
      QUEUED: 2,
      SEDANG_DITELAAH: 3,
      PEMERIKSAAN_LANJUTAN: 4,
      TIDAK_DAPAT_DITINDAKLANJUTI: 3,
      COMPLETED: 5,
    };
    const activeStep = activeStepMap[status] || 2;

    const stageTimestampRaw =
      stage.step === 1
        ? submittedTime
        : stage.step === 2
        ? queuedTime
        : stage.step === 3
        ? reviewTime
        : stage.step === 4
        ? inspectionTime
        : completedTime;

    if (
      status === 'COMPLETED' &&
      stage.step === 4 &&
      !inspectionTime &&
      skipInspectionReason
    ) {
      return {
        step: stage.step,
        statusKey: stage.statusKey,
        label: stage.label,
        description:
          'Tahap pemeriksaan lanjutan tidak diperlukan karena informasi dan dokumen awal telah mencukupi untuk menyusun hasil penanganan.',
        state: 'skipped',
        stateLabel: 'Dilewati',
        timestampWib: completedTime ? formatWibDateTime(completedTime) : null,
      };
    }

    if (stage.step < activeStep || (stage.step === 5 && status === 'COMPLETED')) {
      return {
        step: stage.step,
        statusKey: stage.statusKey,
        label: stage.label,
        description: stage.parentDescription,
        state: 'done',
        stateLabel: 'Selesai',
        timestampWib: stageTimestampRaw ? formatWibDateTime(stageTimestampRaw) : null,
      };
    }

    if (stage.step === activeStep) {
      return {
        step: stage.step,
        statusKey: stage.statusKey,
        label: stage.label,
        description: stage.parentDescription,
        state: 'current',
        stateLabel: 'Sedang Berlangsung',
        timestampWib: stageTimestampRaw ? formatWibDateTime(stageTimestampRaw) : null,
      };
    }

    return {
      step: stage.step,
      statusKey: stage.statusKey,
      label: stage.label,
      description: stage.parentDescription,
      state: 'pending',
      stateLabel: 'Belum Dimulai',
      timestampWib: null,
    };
  });
}

