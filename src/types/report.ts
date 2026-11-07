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

export interface ResolutionOutcomeOption {
  code: ResolutionOutcomeCode;
  label: string;
  description: string;
  parentSummary: string;
}

export interface InspectionMethodOption {
  code: InspectionMethodCode;
  label: string;
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

export interface ReportAttachmentMeta {
  name: string;
  sizeFormatted: string;
  url?: string;
  storagePath?: string;
  mimeType?: string;
  uploadedAt?: string;
}

export interface OfficialSchoolIdentity {
  id: string;
  name: string;
  npsn: string;
  jenjang: string | null;
  schoolType: string | null;
  status: string | null;
  address: string | null;
  provinsi: string | null;
  kabupaten: string | null;
  kecamatan: string | null;
  principalName: string | null;
  treasurerName: string | null;
  studentCount: number | null;
  totalBosp: number | null;
  perStudentEstimate: number | null;
  regionCostZone: string | null;
}

export interface MasterSchoolSearchOption {
  id: string;
  name: string;
  npsn: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK';
  schoolType: 'Negeri' | 'Swasta';
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  address: string;
}

export interface OfficerProfileRecord {
  id: string;
  email: string;
  full_name: string;
  jabatan: string;
  unit_kerja: string;
  role: 'officer' | 'supervisor';
  is_active: boolean;
}

export interface PublicReportMessageItem {
  id: string;
  sender_type: 'OFFICER' | 'REPORTER';
  sender_label: string;
  message: string;
  attachments_json: ReportAttachmentMeta[];
  created_at: string;
}

export interface PublicReportTrackingDetail {
  id: string;
  ticket_code: string;
  school_id: string;
  school_name: string;
  school_npsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requester_role: string;
  notes: string;
  status: ReportInternalStatus;
  waiting_additional_info: boolean;
  is_forwarded: boolean;
  forwarded_to: string | null;
  rejection_reason: string | null;
  resolution_outcome: ResolutionOutcomeCode | null;
  public_resolution_note: string | null;
  skip_inspection_reason: string | null;
  field_inspection_conducted: boolean;
  inspection_methods: InspectionMethodCode[];
  attachment_count: number;
  attachments_json: ReportAttachmentMeta[];
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  resolved_at: string | null;
}

export interface PublicReportTrackingPayload {
  report: PublicReportTrackingDetail;
  history: PublicStatusHistoryItem[];
  messages: PublicReportMessageItem[];
}

export interface OfficerQueueReportRow {
  id: string;
  ticket_code: string;
  school_id: string;
  school_name: string;
  school_npsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requester_role: string;
  status: ReportInternalStatus;
  waiting_additional_info: boolean;
  is_forwarded: boolean;
  forwarded_to: string | null;
  resolution_outcome: ResolutionOutcomeCode | null;
  attachment_count: number;
  opened_at: string | null;
  opened_by_name: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface OfficerFullReportRow extends OfficerQueueReportRow {
  notes_encrypted: string;
  ocr_text: string | null;
  ocr_bosp_fact: string | null;
  rejection_reason: string | null;
  public_resolution_note: string | null;
  skip_inspection_reason: string | null;
  field_inspection_conducted: boolean;
  inspection_methods: InspectionMethodCode[];
  attachments_json: ReportAttachmentMeta[];
}

export interface OfficerStatusHistoryRow {
  id: string;
  report_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_uid: string | null;
  changed_by_name: string;
  note: string | null;
  is_internal: boolean;
  created_at: string;
}

export interface OfficerInternalNoteRow {
  id: string;
  report_id: string;
  officer_uid: string;
  officer_name: string;
  note: string;
  created_at: string;
}

export interface OfficerReportDetailBundle {
  report: OfficerFullReportRow;
  schoolIdentity: OfficialSchoolIdentity | null;
  history: OfficerStatusHistoryRow[];
  internalNotes: OfficerInternalNoteRow[];
  messages: PublicReportMessageItem[];
  autoTransitionedOnOpen: boolean;
}

export interface SubmitPublicReportInput {
  schoolId: string;
  schoolName: string;
  schoolNpsn: string;
  kabupaten: string;
  kecamatan: string;
  category: string;
  requesterRole: string;
  notes: string;
  attachments: ReportAttachmentMeta[];
  ocrText?: string | null;
  ocrBospFact?: string | null;
}

export interface SubmitPublicReportResult {
  id: string;
  ticket_code: string;
  school_name: string;
  school_npsn: string;
  category: string;
  status: ReportInternalStatus;
  created_at: string;
}

export type OfficerTransitionAction =
  | 'ACCEPT_FOR_FOLLOWUP'
  | 'REJECT_REPORT'
  | 'SAVE_INSPECTION_PROGRESS'
  | 'REQUEST_ADDITIONAL_INFO'
  | 'COMPLETE_REPORT';

export interface OfficerTransitionInput {
  reportId: string;
  expectedVersion: number;
  action: OfficerTransitionAction;
  rejectionReason?: string | null;
  resolutionOutcome?: ResolutionOutcomeCode | null;
  publicResolutionNote?: string | null;
  internalNote?: string | null;
  messageToReporter?: string | null;
  inspectionMethods?: InspectionMethodCode[] | null;
  isForwarded?: boolean | null;
  forwardedTo?: string | null;
  skipInspectionReason?: string | null;
}

