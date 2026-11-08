import {
  supabase,
  cleanRpcErrorMessage,
  normalizeAttachments,
  normalizeMethods,
} from './client';
import { getTrackingTokenForTicket } from '@/features/live-tracking/trackingCookieUtils';
import { generateAnonymousEvidencePath } from '@/utils/cryptoSecurity';
import type {
  PublicReportTrackingPayload,
  ReportAttachmentMeta,
  ReportInternalStatus,
  ResolutionOutcomeCode,
  SubmitPublicReportInput,
  SubmitPublicReportResult,
} from '@/types/report';

export async function fetchReportCaptchaChallenge(): Promise<{
  question: string;
  token: string;
}> {
  try {
    const res = await fetch('/api/reports/captcha', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline / direct fallback
  }

  // Fallback: client-side challenge if backend proxy is unreached
  const num1 = Math.floor(Math.random() * 12) + 3;
  const num2 = Math.floor(Math.random() * 9) + 2;
  const ans = num1 + num2;
  const nonce = Math.random().toString(36).substring(2, 10);
  const exp = Date.now() + 5 * 60 * 1000;
  const payload = JSON.stringify({ a: ans, exp, n: nonce, direct: true });
  const b64 = btoa(payload);
  return {
    question: `${num1} + ${num2} = ?`,
    token: `${b64}.direct`,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

// Uploads evidence securely.
// Attempts backend proxy first, falling back to direct authorized Supabase storage.
export async function uploadReportEvidenceFile(
  blobOrFile: Blob | File,
  originalFileName: string,
  folder: 'initial' | 'followup' = 'initial'
): Promise<ReportAttachmentMeta> {
  const mimeType = blobOrFile.type || 'image/jpeg';

  try {
    const fileBase64 = await blobToBase64(blobOrFile);
    const res = await fetch('/api/reports/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        fileBase64,
        originalName: originalFileName,
        mimeType,
        folder,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        name: String(data.name || 'Bukti_Anonim.jpg'),
        sizeFormatted: String(data.sizeFormatted || '-'),
        storagePath: String(data.storagePath || ''),
        url: data.url ? String(data.url) : undefined,
        mimeType: String(data.mimeType || mimeType),
        uploadedAt: String(data.uploadedAt || new Date().toISOString()),
      };
    }
  } catch {
    // Fall through to direct Supabase upload
  }

  // Direct Supabase storage upload
  const { storagePath, maskedDisplayName } = generateAnonymousEvidencePath(folder, mimeType);
  const { error: uploadError } = await supabase.storage
    .from('report-evidence')
    .upload(storagePath, blobOrFile, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah berkas bukti: ${uploadError.message}`);
  }

  const { data: pubData } = supabase.storage
    .from('report-evidence')
    .getPublicUrl(storagePath);

  const sizeKb = Math.max(1, Math.round(blobOrFile.size / 1024));

  return {
    name: maskedDisplayName,
    sizeFormatted: `${sizeKb} KB`,
    url: pubData?.publicUrl || '',
    storagePath,
    mimeType,
    uploadedAt: new Date().toISOString(),
  };
}

// Submits report with automatic proxy-or-direct fallback.
export async function submitPublicReportRpc(
  input: SubmitPublicReportInput
): Promise<SubmitPublicReportResult> {
  try {
    const res = await fetch('/api/reports/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: String(data.id || ''),
        ticket_code: String(data.ticket_code || ''),
        tracking_token: data.tracking_token ? String(data.tracking_token) : undefined,
        school_name: String(data.school_name || input.schoolName),
        school_npsn: String(data.school_npsn || input.schoolNpsn),
        category: String(data.category || input.category),
        status: (String(data.status || 'QUEUED') as ReportInternalStatus),
        created_at: String(data.created_at || new Date().toISOString()),
      };
    }

    const errData = await res.json().catch(() => ({}));
    if (res.status === 400 && errData?.error && !errData.error.includes('PGRST202')) {
      throw new Error(errData.error);
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message &&
      !err.message.includes('fetch') &&
      !err.message.includes('NetworkError') &&
      !err.message.includes('Failed to fetch') &&
      !err.message.includes('Layanan database pengaduan') &&
      !err.message.includes('Sistem gagal')
    ) {
      throw err;
    }
  }

  // Direct Supabase RPC fallback
  const { data: rpcData, error: rpcError } = await supabase.rpc('submit_public_report', {
    p_school_id: input.schoolId,
    p_school_name: input.schoolName,
    p_school_npsn: input.schoolNpsn,
    p_kabupaten: input.kabupaten,
    p_kecamatan: input.kecamatan,
    p_category: input.category,
    p_requester_role: input.requesterRole,
    p_notes: input.notes,
    p_attachments: input.attachments,
    p_ocr_text: input.ocrText || null,
    p_ocr_bosp_fact: input.ocrBospFact || null,
  });

  if (rpcError) {
    throw new Error(cleanRpcErrorMessage(rpcError.message));
  }

  if (!rpcData || typeof rpcData !== 'object') {
    throw new Error('Sistem gagal menerbitkan tiket laporan. Silakan coba kembali.');
  }

  const res = rpcData as Record<string, unknown>;
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

function parseTrackingPayload(rawPayload: any, cleanCode: string): PublicReportTrackingPayload {
  const r = (rawPayload.report || rawPayload || {}) as Record<string, unknown>;
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

export async function fetchPublicReportTrackingRpc(
  ticketCode: string,
  trackingToken?: string
): Promise<PublicReportTrackingPayload | null> {
  let cleanCode = ticketCode.trim();
  if (!cleanCode) return null;

  let secretToken = (trackingToken || '').trim();

  if (cleanCode.includes('#trk_')) {
    const parts = cleanCode.split('#');
    cleanCode = parts[0].trim();
    if (!secretToken && parts[1]) {
      secretToken = parts[1].trim();
    }
  }

  if (!secretToken) {
    const foundToken = getTrackingTokenForTicket(cleanCode);
    if (foundToken) {
      secretToken = foundToken;
    }
  }

  try {
    const res = await fetch('/api/reports/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ticketCode: cleanCode,
        trackingToken: secretToken,
      }),
    });

    if (res.status === 404) {
      return null;
    }

    if (res.ok) {
      const rawPayload = await res.json();
      return parseTrackingPayload(rawPayload, cleanCode);
    }
  } catch {
    // Direct Supabase fallback
  }

  const { data, error } = await supabase.rpc('get_public_report_tracking', {
    p_ticket_code: cleanCode,
  });

  if (error) {
    throw new Error(`Gagal memuat status laporan dari server: ${cleanRpcErrorMessage(error.message)}`);
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  return parseTrackingPayload(data, cleanCode);
}

export async function submitReporterAdditionalInfoRpc(
  ticketCode: string,
  message: string,
  attachments: ReportAttachmentMeta[] = [],
  trackingToken?: string
): Promise<void> {
  let cleanCode = ticketCode.trim();
  let secretToken = (trackingToken || '').trim();

  if (cleanCode.includes('#trk_')) {
    const parts = cleanCode.split('#');
    cleanCode = parts[0].trim();
    if (!secretToken && parts[1]) {
      secretToken = parts[1].trim();
    }
  }

  if (!secretToken) {
    const foundToken = getTrackingTokenForTicket(cleanCode);
    if (foundToken) {
      secretToken = foundToken;
    }
  }

  try {
    const res = await fetch('/api/reports/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ticketCode: cleanCode,
        trackingToken: secretToken,
        message,
        attachments,
      }),
    });

    if (res.ok) return;
  } catch {
    // Fall through
  }

  const { error } = await supabase.rpc('submit_reporter_additional_info', {
    p_ticket_code: cleanCode,
    p_message: message,
    p_attachments: attachments,
  });

  if (error) {
    throw new Error(cleanRpcErrorMessage(error.message));
  }
}
