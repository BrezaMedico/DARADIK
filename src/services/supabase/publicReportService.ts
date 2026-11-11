import {
  normalizeAttachments,
  normalizeMethods,
} from './client';
import { getTrackingTokenForTicket } from '@/features/live-tracking/trackingCookieUtils';
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
  const res = await fetch('/api/reports/captcha', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Layanan verifikasi keamanan server tidak tersedia.');
  }

  const data = await res.json();
  if (!data?.question || !data?.token) {
    throw new Error('Respons verifikasi keamanan server tidak valid.');
  }

  return {
    question: String(data.question),
    token: String(data.token),
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

// Uploads evidence strictly through the protected server endpoint (never direct public Storage).
export async function uploadReportEvidenceFile(
  blobOrFile: Blob | File,
  originalFileName: string,
  folder: 'initial' | 'followup' = 'initial'
): Promise<ReportAttachmentMeta> {
  const mimeType = blobOrFile.type || 'image/jpeg';
  const fileBase64 = await blobToBase64(blobOrFile);

  const res = await fetch('/api/reports/upload', {
    method: 'POST',
    credentials: 'include',
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.storagePath) {
    if (res.status === 413) {
      throw new Error('Ukuran berkas bukti terlalu besar. Gunakan foto atau dokumen maksimal 3 MB.');
    }
    throw new Error(
      String(data?.error || 'Gagal mengunggah berkas bukti ke server aman.')
    );
  }

  return {
    name: String(data.name || 'Bukti_Anonim.jpg'),
    sizeFormatted: String(data.sizeFormatted || '-'),
    storagePath: String(data.storagePath),
    mimeType: String(data.mimeType || mimeType),
    uploadedAt: String(data.uploadedAt || new Date().toISOString()),
  };
}

// Submits report strictly through the encrypted backend endpoint (never plain-text fallback RPC).
export async function submitPublicReportRpc(
  input: SubmitPublicReportInput
): Promise<SubmitPublicReportResult> {
  const res = await fetch('/api/reports/submit', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      String(
        data?.error ||
          'Gagal mengirim laporan terenkripsi ke server. Pengiriman dihentikan demi menjaga kerahasiaan data.'
      )
    );
  }

  if (!data?.ticket_code || !data?.tracking_token) {
    throw new Error('Sistem gagal menerbitkan tiket laporan terenkripsi. Silakan coba kembali.');
  }

  return {
    id: String(data.id || ''),
    ticket_code: String(data.ticket_code),
    tracking_token: String(data.tracking_token),
    school_name: String(data.school_name || input.schoolName),
    school_npsn: String(data.school_npsn || input.schoolNpsn),
    category: String(data.category || input.category),
    status: (String(data.status || 'QUEUED') as ReportInternalStatus),
    created_at: String(data.created_at || new Date().toISOString()),
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

  const res = await fetch('/api/reports/track', {
    method: 'POST',
    credentials: 'include',
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

  const rawPayload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      String(
        rawPayload?.error ||
          'Gagal memuat status laporan terenkripsi dari server.'
      )
    );
  }

  return parseTrackingPayload(rawPayload, cleanCode);
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

  const res = await fetch('/api/reports/reply', {
    method: 'POST',
    credentials: 'include',
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

  const data = await res.json().catch(() => ({}));
  throw new Error(
    String(
      data?.error ||
        'Gagal mengirim balasan terenkripsi ke server. Pengiriman dihentikan.'
    )
  );
}
