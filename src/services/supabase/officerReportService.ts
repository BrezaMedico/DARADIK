import {
  supabase,
  cleanRpcErrorMessage,
  normalizeAttachments,
  normalizeMethods,
} from './client';
import { fetchOfficialSchoolIdentityByNpsn } from './schoolService';
import type {
  OfficerFullReportRow,
  OfficerInternalNoteRow,
  OfficerProfileRecord,
  OfficerQueueReportRow,
  OfficerReportDetailBundle,
  OfficerTransitionInput,
  ReportInternalStatus,
  ResolutionOutcomeCode,
} from '@/types/report';

export class ReportVersionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportVersionConflictError';
  }
}

export async function getActiveOfficerSession(): Promise<OfficerProfileRecord | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('officer_profiles')
    .select('id, email, full_name, jabatan, unit_kerja, role, is_active')
    .eq('id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return profile as OfficerProfileRecord;
}

export async function signInOfficerWithPassword(
  emailOrUsername: string,
  password: string
): Promise<OfficerProfileRecord> {
  const cleanInput = emailOrUsername.trim().toLowerCase();
  const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@daradik.id`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    throw new Error('Username atau kata sandi administrator tidak sesuai.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('officer_profiles')
    .select('id, email, full_name, jabatan, unit_kerja, role, is_active')
    .eq('id', data.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error(
      'Akun Anda tidak terdaftar sebagai administrator aktif Dinas Pendidikan pada sistem DARADIK.'
    );
  }

  return profile as OfficerProfileRecord;
}

export async function signOutOfficer(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchOfficerReportsQueue(): Promise<OfficerQueueReportRow[]> {
  const { data, error } = await supabase.rpc('officer_get_reports_queue');

  if (error) {
    throw new Error(
      `Gagal memuat antrean laporan dari Supabase: ${cleanRpcErrorMessage(error.message)}`
    );
  }

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: Record<string, unknown>) => ({
    id: String(r.id || ''),
    ticket_code: String(r.ticket_code || ''),
    school_id: String(r.school_id || ''),
    school_name: String(r.school_name || ''),
    school_npsn: String(r.school_npsn || ''),
    kabupaten: String(r.kabupaten || ''),
    kecamatan: String(r.kecamatan || ''),
    category: String(r.category || ''),
    requester_role: String(r.requester_role || ''),
    status: (String(r.status || 'QUEUED') as ReportInternalStatus),
    waiting_additional_info: Boolean(r.waiting_additional_info),
    is_forwarded: Boolean(r.is_forwarded),
    forwarded_to: r.forwarded_to ? String(r.forwarded_to) : null,
    resolution_outcome: r.resolution_outcome
      ? (String(r.resolution_outcome) as ResolutionOutcomeCode)
      : null,
    attachment_count: Number(r.attachment_count || 0),
    opened_at: r.opened_at ? String(r.opened_at) : null,
    opened_by_name: r.opened_by_name ? String(r.opened_by_name) : null,
    resolved_at: r.resolved_at ? String(r.resolved_at) : null,
    resolved_by_name: r.resolved_by_name ? String(r.resolved_by_name) : null,
    version: Number(r.version || 1),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  }));
}

export async function fetchOfficerReportDetailSnapshot(
  reportId: string,
  autoTransitionedOnOpen: boolean = false
): Promise<OfficerReportDetailBundle> {
  const { data, error } = await supabase.rpc('officer_get_report_detail_bundle', {
    p_report_id: reportId,
  });

  if (error || !data || typeof data !== 'object') {
    throw new Error(
      error ? cleanRpcErrorMessage(error.message) : 'Detail laporan tidak ditemukan di basis data.'
    );
  }

  const bundle = data as Record<string, unknown>;
  const r = (bundle.report || {}) as Record<string, unknown>;
  const rawHistory = Array.isArray(bundle.history) ? bundle.history : [];
  const rawInternal = Array.isArray(bundle.internal_notes) ? bundle.internal_notes : [];
  const rawMessages = Array.isArray(bundle.messages) ? bundle.messages : [];

  const schoolNpsn = String(r.school_npsn || '');
  const schoolIdentity = await fetchOfficialSchoolIdentityByNpsn(schoolNpsn);

  const rawAttachments = normalizeAttachments(r.attachments_json);
  const resolvedAttachments = await Promise.all(
    rawAttachments.map(async (att) => {
      let finalUrl = att.url || '';
      if (!finalUrl && att.storagePath) {
        try {
          const { data: signed } = await supabase.storage
            .from('report-evidence')
            .createSignedUrl(att.storagePath, 3600);
          if (signed?.signedUrl) {
            finalUrl = signed.signedUrl;
          }
        } catch {}

        if (!finalUrl) {
          try {
            const { data: pub } = supabase.storage
              .from('report-evidence')
              .getPublicUrl(att.storagePath);
            if (pub?.publicUrl) {
              finalUrl = pub.publicUrl;
            }
          } catch {}
        }
      }
      return {
        ...att,
        url: finalUrl || undefined,
      };
    })
  );

  const fullReport: OfficerFullReportRow = {
    id: String(r.id || ''),
    ticket_code: String(r.ticket_code || ''),
    school_id: String(r.school_id || ''),
    school_name: String(r.school_name || ''),
    school_npsn: schoolNpsn,
    kabupaten: String(r.kabupaten || ''),
    kecamatan: String(r.kecamatan || ''),
    category: String(r.category || ''),
    requester_role: String(r.requester_role || ''),
    notes_encrypted: String(r.notes_encrypted || ''),
    status: (String(r.status || 'QUEUED') as ReportInternalStatus),
    waiting_additional_info: Boolean(r.waiting_additional_info),
    is_forwarded: Boolean(r.is_forwarded),
    forwarded_to: r.forwarded_to ? String(r.forwarded_to) : null,
    ocr_text: r.ocr_text ? String(r.ocr_text) : null,
    ocr_bosp_fact: r.ocr_bosp_fact ? String(r.ocr_bosp_fact) : null,
    rejection_reason: r.rejection_reason ? String(r.rejection_reason) : null,
    resolution_outcome: r.resolution_outcome
      ? (String(r.resolution_outcome) as ResolutionOutcomeCode)
      : null,
    public_resolution_note: r.public_resolution_note
      ? String(r.public_resolution_note)
      : null,
    skip_inspection_reason: r.skip_inspection_reason
      ? String(r.skip_inspection_reason)
      : null,
    field_inspection_conducted: Boolean(r.field_inspection_conducted),
    inspection_methods: normalizeMethods(r.inspection_methods),
    attachment_count: Number(r.attachment_count || resolvedAttachments.length || 0),
    attachments_json: resolvedAttachments,
    opened_at: r.opened_at ? String(r.opened_at) : null,
    opened_by_name: r.opened_by_name ? String(r.opened_by_name) : null,
    resolved_at: r.resolved_at ? String(r.resolved_at) : null,
    resolved_by_name: r.resolved_by_name ? String(r.resolved_by_name) : null,
    version: Number(r.version || 1),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  };

  return {
    report: fullReport,
    schoolIdentity,
    history: rawHistory.map((h: Record<string, unknown>) => ({
      id: String(h.id || ''),
      report_id: String(h.report_id || reportId),
      previous_status: h.previous_status ? String(h.previous_status) : null,
      new_status: String(h.new_status || ''),
      changed_by_uid: h.changed_by_uid ? String(h.changed_by_uid) : null,
      changed_by_name: String(h.changed_by_name || 'Sistem DARADIK'),
      note: h.note ? String(h.note) : null,
      is_internal: Boolean(h.is_internal),
      created_at: String(h.created_at || ''),
    })),
    internalNotes: rawInternal.map((n: Record<string, unknown>) => ({
      id: String(n.id || ''),
      report_id: String(n.report_id || reportId),
      officer_uid: String(n.officer_uid || ''),
      officer_name: String(n.officer_name || ''),
      note: String(n.note || ''),
      created_at: String(n.created_at || ''),
    })),
    messages: rawMessages.map((m: Record<string, unknown>) => ({
      id: String(m.id || ''),
      sender_type: String(m.sender_type) === 'OFFICER' ? 'OFFICER' : 'REPORTER',
      sender_label: String(m.sender_label || ''),
      message: String(m.message || ''),
      attachments_json: normalizeAttachments(m.attachments_json),
      created_at: String(m.created_at || ''),
    })),
    autoTransitionedOnOpen,
  };
}

// Automatically advances a QUEUED report to SEDANG_DITELAAH on the first officer open.
export async function openReportDetailByOfficer(
  reportId: string
): Promise<OfficerReportDetailBundle> {
  const { data, error } = await supabase.rpc('officer_open_report_detail', {
    p_report_id: reportId,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  const rpcRes = (data || {}) as Record<string, unknown>;
  const transitioned = Boolean(rpcRes.transitioned);

  return fetchOfficerReportDetailSnapshot(reportId, transitioned);
}

export async function transitionReportByOfficerRpc(
  input: OfficerTransitionInput
): Promise<{ status: ReportInternalStatus; version: number; updated_at: string }> {
  const { data, error } = await supabase.rpc('officer_transition_report', {
    p_report_id: input.reportId,
    p_expected_version: input.expectedVersion,
    p_action: input.action,
    p_rejection_reason: input.rejectionReason ?? null,
    p_resolution_outcome: input.resolutionOutcome ?? null,
    p_public_resolution_note: input.publicResolutionNote ?? null,
    p_internal_note: input.internalNote ?? null,
    p_message_to_reporter: input.messageToReporter ?? null,
    p_inspection_methods: input.inspectionMethods ?? null,
    p_is_forwarded: input.isForwarded ?? null,
    p_forwarded_to: input.forwardedTo ?? null,
    p_skip_inspection_reason: input.skipInspectionReason ?? null,
  });

  if (error) {
    if (error.message.includes('CONFLICT_VERSION:')) {
      throw new ReportVersionConflictError(cleanRpcErrorMessage(error.message));
    }
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  const res = (data || {}) as Record<string, unknown>;
  return {
    status: (String(res.status || 'SEDANG_DITELAAH') as ReportInternalStatus),
    version: Number(res.version || input.expectedVersion + 1),
    updated_at: String(res.updated_at || new Date().toISOString()),
  };
}

export async function addOfficerInternalNoteRpc(
  reportId: string,
  note: string
): Promise<OfficerInternalNoteRow> {
  const { data, error } = await supabase.rpc('officer_add_internal_note', {
    p_report_id: reportId,
    p_note: note,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  const r = (data || {}) as Record<string, unknown>;
  return {
    id: String(r.id || ''),
    report_id: String(r.report_id || reportId),
    officer_uid: String(r.officer_uid || ''),
    officer_name: String(r.officer_name || ''),
    note: String(r.note || note),
    created_at: String(r.created_at || new Date().toISOString()),
  };
}
