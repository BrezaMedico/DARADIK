import {
  supabase,
  cleanRpcErrorMessage,
  normalizeAttachments,
  normalizeMethods,
} from './client';
import {
  encryptClientPayload,
  generateAnonymousEvidencePath,
} from '@/utils/cryptoSecurity';
import type {
  PublicReportTrackingPayload,
  ReportAttachmentMeta,
  ReportInternalStatus,
  ResolutionOutcomeCode,
  SubmitPublicReportInput,
  SubmitPublicReportResult,
} from '@/types/report';

// Uses randomized storage paths so the reporter's original device filename is never persisted.
export async function uploadReportEvidenceFile(
  blobOrFile: Blob | File,
  _originalFileName: string,
  folder: 'initial' | 'followup' = 'initial'
): Promise<ReportAttachmentMeta> {
  const mimeType = blobOrFile.type || 'image/jpeg';
  const { storagePath, maskedDisplayName } = generateAnonymousEvidencePath(
    folder,
    mimeType
  );

  const { error: uploadError } = await supabase.storage
    .from('report-evidence')
    .upload(storagePath, blobOrFile, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah berkas bukti terenkripsi: ${uploadError.message}`);
  }

  const { data: pubData } = supabase.storage
    .from('report-evidence')
    .getPublicUrl(storagePath);

  const sizeKb = Math.max(1, Math.round(blobOrFile.size / 1024));

  return {
    name: maskedDisplayName,
    sizeFormatted: `${sizeKb} KB`,
    url: pubData.publicUrl,
    storagePath,
    mimeType,
    uploadedAt: new Date().toISOString(),
  };
}

export async function submitPublicReportRpc(
  input: SubmitPublicReportInput
): Promise<SubmitPublicReportResult> {
  const encryptedEnvelope = await encryptClientPayload({
    schoolId: input.schoolId,
    schoolName: input.schoolName,
    schoolNpsn: input.schoolNpsn,
    kabupaten: input.kabupaten,
    kecamatan: input.kecamatan,
    category: input.category,
    requesterRole: input.requesterRole,
    notes: input.notes,
    attachments: input.attachments,
    ocrText: input.ocrText || null,
    ocrBospFact: input.ocrBospFact || null,
  });

  const { data, error } = await supabase.rpc('submit_public_report_encrypted', {
    p_envelope: encryptedEnvelope,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Sistem gagal menerbitkan tiket laporan. Silakan coba kembali.');
  }

  const res = data as Record<string, unknown>;
  return {
    id: String(res.id || ''),
    ticket_code: String(res.ticket_code || ''),
    school_name: String(res.school_name || input.schoolName),
    school_npsn: String(res.school_npsn || input.schoolNpsn),
    category: String(res.category || input.category),
    status: (String(res.status || 'QUEUED') as ReportInternalStatus),
    created_at: String(res.created_at || new Date().toISOString()),
  };
}

// Ticket lookup is case-sensitive to preserve full entropy of the anonymous access token.
export async function fetchPublicReportTrackingRpc(
  ticketCode: string
): Promise<PublicReportTrackingPayload | null> {
  const cleanCode = ticketCode.trim();
  if (!cleanCode) return null;

  const { data, error } = await supabase.rpc('get_public_report_tracking', {
    p_ticket_code: cleanCode,
  });

  if (error) {
    throw new Error(`Gagal memuat data pelacakan dari server: ${cleanRpcErrorMessage(error.message)}`);
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const rawPayload = data as Record<string, unknown>;
  const r = (rawPayload.report || {}) as Record<string, unknown>;
  const rawHistory = Array.isArray(rawPayload.history) ? rawPayload.history : [];
  const rawMessages = Array.isArray(rawPayload.messages) ? rawPayload.messages : [];

  return {
    report: {
      id: String(r.id || ''),
      ticket_code: String(r.ticket_code || cleanCode),
      school_id: String(r.school_id || ''),
      school_name: String(r.school_name || ''),
      school_npsn: String(r.school_npsn || ''),
      kabupaten: String(r.kabupaten || ''),
      kecamatan: String(r.kecamatan || ''),
      category: String(r.category || ''),
      requester_role: String(r.requester_role || ''),
      notes: String(r.notes || ''),
      status: (String(r.status || 'QUEUED') as ReportInternalStatus),
      waiting_additional_info: Boolean(r.waiting_additional_info),
      is_forwarded: Boolean(r.is_forwarded),
      forwarded_to: r.forwarded_to ? String(r.forwarded_to) : null,
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
      attachment_count: Number(r.attachment_count || 0),
      attachments_json: normalizeAttachments(r.attachments_json),
      created_at: String(r.created_at || ''),
      updated_at: String(r.updated_at || ''),
      opened_at: r.opened_at ? String(r.opened_at) : null,
      resolved_at: r.resolved_at ? String(r.resolved_at) : null,
    },
    history: rawHistory.map((item: Record<string, unknown>) => ({
      id: String(item.id || ''),
      previous_status: item.previous_status ? String(item.previous_status) : null,
      new_status: String(item.new_status || ''),
      actor_label: String(item.actor_label || 'Sistem DARADIK'),
      note: item.note ? String(item.note) : null,
      created_at: String(item.created_at || ''),
    })),
    messages: rawMessages.map((m: Record<string, unknown>) => ({
      id: String(m.id || ''),
      sender_type: String(m.sender_type) === 'OFFICER' ? 'OFFICER' : 'REPORTER',
      sender_label: String(m.sender_label || 'Pelapor Anonim'),
      message: String(m.message || ''),
      attachments_json: normalizeAttachments(m.attachments_json),
      created_at: String(m.created_at || ''),
    })),
  };
}

export async function submitReporterAdditionalInfoRpc(
  ticketCode: string,
  message: string,
  attachments: ReportAttachmentMeta[] = []
): Promise<void> {
  const encryptedEnvelope = await encryptClientPayload({
    ticketCode: ticketCode.trim(),
    message,
    attachments,
  });

  const { error } = await supabase.rpc('submit_reporter_additional_info_encrypted', {
    p_envelope: encryptedEnvelope,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }
}
