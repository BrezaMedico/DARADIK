import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });
dotenv.config({ override: true });
import {
  encryptReportText,
  decryptReportText,
  generateTrackingSecret,
  hashTrackingToken,
  generateCaptchaChallenge,
  verifyCaptchaAnswer,
  detectFileMimeAndValidate,
} from './reportCrypto.js';

export const EVIDENCE_SIGNED_URL_TTL_SECONDS = 300; // 5 menit

let defaultSupabaseClient = null;

function sanitizeAttachmentMetadata(att) {
  const rawPath = String(att?.storagePath || '')
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .trim()
    .slice(0, 260);
  const sizeFormatted = String(
    att?.sizeFormatted || (rawPath ? '-' : 'Referensi Data')
  ).slice(0, 20);
  return {
    name: String(att?.name || 'Berkas Lampiran').slice(0, 120),
    sizeFormatted,
    storagePath: rawPath || null,
    mimeType: String(att?.mimeType || '').slice(0, 60),
    uploadedAt: String(att?.uploadedAt || new Date().toISOString()).slice(0, 40),
  };
}

async function signAuthorizedReportAttachments({ supabase, ticketCode, tokenHashHex, attachments }) {
  if (!Array.isArray(attachments)) return attachments;
  return Promise.all(
    attachments.map(async (att) => {
      if (!att || typeof att !== 'object') return att;
      const { url: _ignoredUrl, ...safeAtt } = att;
      const storagePath = String(safeAtt.storagePath || '').trim();
      if (!storagePath || storagePath.includes('..') || storagePath.startsWith('/')) {
        return safeAtt;
      }
      try {
        const { data: authorized, error: authError } = await supabase.rpc(
          'svc_authorize_report_evidence',
          {
            p_ticket_code: ticketCode,
            p_token_hash: tokenHashHex,
            p_storage_path: storagePath,
          }
        );
        if (authError || authorized !== true) {
          return safeAtt;
        }
        const { data: signed } = await supabase.storage
          .from('report-evidence')
          .createSignedUrl(storagePath, EVIDENCE_SIGNED_URL_TTL_SECONDS);
        return signed?.signedUrl ? { ...safeAtt, url: signed.signedUrl } : safeAtt;
      } catch {
        return safeAtt;
      }
    })
  );
}

export function getServiceSupabaseClient(overrideClient = null) {
  if (overrideClient) return overrideClient;
  if (defaultSupabaseClient) return defaultSupabaseClient;

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Konfigurasi Supabase server belum lengkap: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi.'
    );
  }

  defaultSupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return defaultSupabaseClient;
}

export function setServiceSupabaseClient(client) {
  defaultSupabaseClient = client;
}

function hashForRateLimit(val) {
  return crypto.createHash('sha256').update(String(val || 'anon')).digest('hex').slice(0, 32);
}

const consumedNonces = new Map();
function consumeMemoryNonce(nonce, ttlSeconds) {
  const now = Date.now();
  if (consumedNonces.has(nonce)) {
    const exp = consumedNonces.get(nonce);
    if (now < exp) return false;
  }
  consumedNonces.set(nonce, now + ttlSeconds * 1000);
  return true;
}

// In-memory rate limiter fallback if DB rate limiting is unavailable
const memoryRateLimits = new Map();
function checkMemoryRateLimit(bucket, key, max, windowSeconds) {
  const fullKey = `${bucket}:${key}`;
  const now = Date.now();
  const entry = memoryRateLimits.get(fullKey) || { start: now, hits: 0 };
  if (now - entry.start > windowSeconds * 1000) {
    entry.start = now;
    entry.hits = 1;
  } else {
    entry.hits += 1;
  }
  memoryRateLimits.set(fullKey, entry);
  const allowed = entry.hits <= max;
  const retryAfter = Math.max(1, Math.ceil((entry.start + windowSeconds * 1000 - now) / 1000));
  return { allowed, hits: entry.hits, retry_after: retryAfter };
}

async function enforceRateLimit(supabase, bucket, key, max, windowSeconds) {
  const keyHash = hashForRateLimit(key);
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('svc_rate_limit', {
        p_bucket: bucket,
        p_key_hash: keyHash,
        p_max: max,
        p_window_seconds: windowSeconds,
        p_increment: true,
      });
      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to memory
    }
  }
  return checkMemoryRateLimit(bucket, keyHash, max, windowSeconds);
}

export async function handleGetCaptcha() {
  const challenge = generateCaptchaChallenge();
  return {
    status: 200,
    payload: challenge,
  };
}

export async function handleUploadEvidence(body, maskedIp, customClient = null) {
  let supabase;
  try {
    supabase = getServiceSupabaseClient(customClient);
  } catch (err) {
    return {
      status: 500,
      payload: { error: err.message || 'Layanan penyimpanan berkas belum terkonfigurasi.' },
    };
  }
  if (!supabase) {
    return { status: 500, payload: { error: 'Layanan penyimpanan berkas belum terkonfigurasi.' } };
  }

  const { fileBase64, originalName, mimeType, folder = 'initial' } = body || {};
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return { status: 400, payload: { error: 'Data berkas base64 diperlukan.' } };
  }

  // Rate limit uploads: 20 per 10 minutes per IP
  const rl = await enforceRateLimit(supabase, 'report_upload', maskedIp, 20, 600);
  if (!rl.allowed) {
    return {
      status: 429,
      payload: {
        error: `Batas pengunggahan berkas tercapai. Silakan coba kembali dalam ${rl.retry_after} detik.`,
      },
    };
  }

  const buffer = Buffer.from(fileBase64, 'base64');
  const validation = detectFileMimeAndValidate(buffer, mimeType);
  if (!validation.valid) {
    return { status: 400, payload: { error: validation.reason } };
  }

  const detectedMime = validation.mimeType;
  let ext = 'jpg';
  let label = 'Bukti_Foto_Anonim';
  if (detectedMime === 'application/pdf') {
    ext = 'pdf';
    label = 'Dokumen_Bukti_Anonim';
  } else if (detectedMime === 'image/png') {
    ext = 'png';
  } else if (detectedMime === 'image/webp') {
    ext = 'webp';
  }

  const token = crypto.randomBytes(18).toString('hex');
  const targetFolder = folder === 'followup' ? 'followup' : 'initial';
  const storagePath = `${targetFolder}/${token}.${ext}`;
  const shortTag = token.slice(0, 6).toUpperCase();
  const maskedDisplayName = `${label}_${shortTag}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('report-evidence')
    .upload(storagePath, buffer, {
      contentType: detectedMime,
      upsert: false,
    });

  if (uploadError) {
    return {
      status: 500,
      payload: { error: `Gagal menyimpan berkas ke repositori aman: ${uploadError.message}` },
    };
  }

  const sizeKb = Math.max(1, Math.round(buffer.length / 1024));

  return {
    status: 200,
    payload: {
      name: maskedDisplayName,
      sizeFormatted: `${sizeKb} KB`,
      storagePath,
      mimeType: detectedMime,
      uploadedAt: new Date().toISOString(),
    },
  };
}

export async function handleSubmitReport(body, maskedIp, customClient = null) {
  let supabase;
  try {
    supabase = getServiceSupabaseClient(customClient);
  } catch (err) {
    return {
      status: 500,
      payload: { error: err.message || 'Layanan database pengaduan belum terkonfigurasi.' },
    };
  }
  if (!supabase) {
    return { status: 500, payload: { error: 'Layanan database pengaduan belum terkonfigurasi.' } };
  }

  const {
    schoolId,
    schoolName,
    schoolNpsn,
    kabupaten,
    kecamatan,
    category,
    requesterRole,
    notes,
    attachments,
    ocrText,
    ocrBospFact,
    captchaAnswer,
    captchaToken,
  } = body || {};

  // 1. Validasi CAPTCHA di server
  const captchaCheck = verifyCaptchaAnswer(captchaAnswer, captchaToken);
  if (!captchaCheck.valid) {
    return {
      status: 400,
      payload: { error: captchaCheck.reason || 'Verifikasi keamanan tidak valid.' },
    };
  }

  // 2. Anti-replay nonce: cegah pengiriman ulang hanya jika sudah pernah berhasil diproses
  if (captchaCheck.nonce && consumedNonces.has(captchaCheck.nonce)) {
    const exp = consumedNonces.get(captchaCheck.nonce);
    if (!exp || Date.now() < exp) {
      return {
        status: 400,
        payload: { error: 'Soal verifikasi ini sudah pernah digunakan. Silakan muat ulang tantangan baru di bawah.' },
      };
    }
  }

  // 3. Rate limiting pengiriman laporan: 5 per jam per IP
  const rl = await enforceRateLimit(supabase, 'report_submit', maskedIp, 5, 3600);
  if (!rl.allowed) {
    return {
      status: 429,
      payload: {
        error: `Batas pengiriman laporan tercapai untuk alamat Anda. Silakan coba kembali dalam ${rl.retry_after} detik.`,
      },
    };
  }

  // 4. Validasi input dasar
  const cleanSchoolName = String(schoolName || '').trim().slice(0, 200);
  const cleanNpsn = String(schoolNpsn || '').trim();
  const cleanCategory = String(category || '').trim().slice(0, 300);
  const cleanRole = String(requesterRole || '').trim().slice(0, 120);
  const cleanNotes = String(notes || '').trim();
  const cleanOcrText = ocrText ? String(ocrText).trim().slice(0, 12000) : null;
  const cleanOcrFact = ocrBospFact ? String(ocrBospFact).trim().slice(0, 12000) : null;

  if (!cleanSchoolName || !cleanNpsn) {
    return { status: 400, payload: { error: 'Sekolah tujuan dan NPSN wajib diisi.' } };
  }
  if (!cleanCategory) {
    return { status: 400, payload: { error: 'Kategori laporan wajib dipilih.' } };
  }
  if (!cleanRole) {
    return { status: 400, payload: { error: 'Pihak yang meminta pungutan wajib dipilih.' } };
  }
  if (!cleanNotes || cleanNotes.length < 10) {
    return { status: 400, payload: { error: 'Uraian kejadian minimal 10 karakter.' } };
  }
  if (cleanNotes.length > 5000) {
    return { status: 400, payload: { error: 'Uraian kejadian melebihi batas 5.000 karakter.' } };
  }

  // 5. Enkripsi server-side (AES-256-GCM)
  const notesEncrypted = encryptReportText(cleanNotes);
  const ocrTextEncrypted = cleanOcrText ? encryptReportText(cleanOcrText) : null;
  const ocrBospFactEncrypted = cleanOcrFact ? encryptReportText(cleanOcrFact) : null;

  // 6. Buat identitas dan secret token
  const reportId = crypto.randomUUID();
  const trackingSecret = generateTrackingSecret();
  const tokenHash = hashTrackingToken(trackingSecret);
  const tokenHashHex = `\\x${tokenHash.toString('hex')}`;

  // 7. Bersihkan metadata lampiran (tanpa menyimpan URL publik)
  const cleanAttachments = Array.isArray(attachments)
    ? attachments.slice(0, 5).map(sanitizeAttachmentMetadata)
    : [];

  if (!notesEncrypted || !notesEncrypted.startsWith('dv1.')) {
    return {
      status: 500,
      payload: {
        error: 'Enkripsi laporan gagal dijalankan. Pengiriman dihentikan demi keamanan data.',
      },
    };
  }

  const rpcPayload = {
    p_id: reportId,
    p_token_hash: tokenHashHex,
    p_school_id: String(schoolId || cleanNpsn).trim(),
    p_school_name: cleanSchoolName,
    p_school_npsn: cleanNpsn,
    p_kabupaten: String(kabupaten || 'Data belum tersedia').trim(),
    p_kecamatan: String(kecamatan || 'Data belum tersedia').trim(),
    p_category: cleanCategory,
    p_requester_role: cleanRole,
    p_notes_encrypted: notesEncrypted,
    p_attachments: cleanAttachments,
    p_ocr_text_encrypted: ocrTextEncrypted,
    p_ocr_bosp_fact_encrypted: ocrBospFactEncrypted,
    p_encryption_algorithm: 'AES-256-GCM/dv1',
  };

  let { data, error } = await supabase.rpc('svc_submit_report', rpcPayload);

  // Kompatibilitas aman jika DB target masih memblokir lampiran referensi tanpa file fisik:
  // pindahkan label 'Referensi Data' ke catatan terenkripsi dan pertahankan hanya lampiran berkas valid.
  const referenceOnlyItems = cleanAttachments.filter(
    (att) => !att.storagePath && att.sizeFormatted === 'Referensi Data'
  );
  const fileAttachments = cleanAttachments.filter((att) => Boolean(att.storagePath));
  const hasUnbackedNonReference = cleanAttachments.some(
    (att) => !att.storagePath && att.sizeFormatted !== 'Referensi Data'
  );

  if (
    error &&
    error.message?.includes('Jalur berkas lampiran tidak valid') &&
    referenceOnlyItems.length > 0 &&
    !hasUnbackedNonReference
  ) {
    const refText = referenceOnlyItems.map((att) => att.name).join('; ');
    const notesWithRef = `${cleanNotes}\n\n[Referensi Data Terlampir]: ${refText}`.slice(0, 8000);
    const notesWithRefEncrypted = encryptReportText(notesWithRef);
    const retryRes = await supabase.rpc('svc_submit_report', {
      ...rpcPayload,
      p_notes_encrypted: notesWithRefEncrypted,
      p_attachments: fileAttachments,
    });
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error || !data) {
    const isMissingRpc =
      error?.code === 'PGRST202' ||
      error?.code === '42883' ||
      Boolean(error?.message?.includes('PGRST202'));
    return {
      status: isMissingRpc ? 500 : 400,
      payload: {
        error: isMissingRpc
          ? 'Layanan pengiriman terenkripsi tidak tersedia di basis data. Pengiriman dibatalkan.'
          : `Gagal menyimpan laporan terenkripsi ke basis data: ${error?.message || 'Respons kosong'}`,
      },
    };
  }

  // Tandai nonce sebagai telah terpakai HANYA setelah laporan berhasil disimpan
  if (captchaCheck.nonce) {
    consumedNonces.set(captchaCheck.nonce, Date.now() + 600000);
    try {
      await supabase.rpc('svc_consume_nonce', {
        p_nonce: captchaCheck.nonce,
        p_ttl_seconds: 600,
      });
    } catch {
      // Nonce table optional
    }
  }

  return {
    status: 200,
    payload: {
      id: reportId,
      ticket_code: data.ticket_code,
      tracking_token: trackingSecret,
      school_name: data.school_name,
      school_npsn: data.school_npsn,
      category: data.category,
      status: data.status,
      created_at: data.created_at,
    },
  };
}

export async function handleTrackReport(body, maskedIp, customClient = null) {
  let supabase;
  try {
    supabase = getServiceSupabaseClient(customClient);
  } catch (err) {
    return {
      status: 500,
      payload: { error: err.message || 'Layanan database pengaduan belum terkonfigurasi.' },
    };
  }
  if (!supabase) {
    return { status: 500, payload: { error: 'Layanan database pengaduan belum terkonfigurasi.' } };
  }

  const { ticketCode, trackingToken } = body || {};
  const cleanCode = String(ticketCode || '').trim();
  const cleanToken = String(trackingToken || '').trim();

  if (!cleanCode) {
    return { status: 400, payload: { error: 'Nomor tiket pelacakan wajib diisi.' } };
  }
  if (!cleanToken) {
    return { status: 400, payload: { error: 'Kunci rahasia pelacakan (token) wajib disertakan.' } };
  }

  // Rate limiting pencarian status: 60 per menit per IP
  const rl = await enforceRateLimit(supabase, 'report_track', maskedIp, 60, 60);
  if (!rl.allowed) {
    return {
      status: 429,
      payload: {
        error: `Batas pencarian status tercapai. Silakan coba kembali dalam ${rl.retry_after} detik.`,
      },
    };
  }

  const tokenHash = hashTrackingToken(cleanToken);
  const tokenHashHex = `\\x${tokenHash.toString('hex')}`;

  const { data, error } = await supabase.rpc('svc_get_report_tracking', {
    p_ticket_code: cleanCode,
    p_token_hash: tokenHashHex,
  });

  if (error) {
    const isMissingRpc =
      error.code === 'PGRST202' ||
      error.code === '42883' ||
      Boolean(error.message?.includes('PGRST202'));
    return {
      status: isMissingRpc ? 500 : 400,
      payload: { error: `Gagal memverifikasi status laporan: ${error.message}` },
    };
  }

  if (!data || !data.report) {
    return {
      status: 404,
      payload: {
        error:
          'Laporan tidak ditemukan atau kombinasi nomor tiket dan kunci rahasia tidak cocok.',
      },
    };
  }

  const report = data.report;
  let decryptedNotes = '';
  if (report.notes_encrypted) {
    try {
      decryptedNotes = decryptReportText(report.notes_encrypted);
    } catch {
      decryptedNotes = '[Teks terenkripsi tidak dapat didekripsi]';
    }
  }
  delete report.notes_encrypted;
  report.notes = decryptedNotes;

  // Siapkan signed URL 5 menit setelah verifikasi otorisasi path milik laporan ini
  if (Array.isArray(report.attachments_json)) {
    report.attachments_json = await signAuthorizedReportAttachments({
      supabase,
      ticketCode: cleanCode,
      tokenHashHex,
      attachments: report.attachments_json,
    });
  }

  // Siapkan pesan dan signed URL 5 menit untuk lampiran pesan terotorisasi
  const rawMessages = Array.isArray(data.messages) ? data.messages : [];
  const processedMessages = await Promise.all(
    rawMessages.map(async (m) => {
      let messageText = m.message;
      if (typeof messageText === 'string' && messageText.startsWith('dv1.')) {
        try {
          messageText = decryptReportText(messageText);
        } catch {
          messageText = '[Pesan terenkripsi tidak dapat didekripsi]';
        }
      }

      const atts = await signAuthorizedReportAttachments({
        supabase,
        ticketCode: cleanCode,
        tokenHashHex,
        attachments: m.attachments_json,
      });

      return {
        ...m,
        message: messageText,
        attachments_json: atts,
      };
    })
  );

  return {
    status: 200,
    payload: {
      report,
      history: Array.isArray(data.history) ? data.history : [],
      messages: processedMessages,
    },
  };
}

export async function handleReplyReport(body, maskedIp, customClient = null) {
  let supabase;
  try {
    supabase = getServiceSupabaseClient(customClient);
  } catch (err) {
    return {
      status: 500,
      payload: { error: err.message || 'Layanan database pengaduan belum terkonfigurasi.' },
    };
  }
  if (!supabase) {
    return { status: 500, payload: { error: 'Layanan database pengaduan belum terkonfigurasi.' } };
  }

  const { ticketCode, trackingToken, message, attachments } = body || {};
  const cleanCode = String(ticketCode || '').trim();
  const cleanToken = String(trackingToken || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!cleanCode) {
    return { status: 400, payload: { error: 'Nomor tiket pelacakan wajib diisi.' } };
  }
  if (!cleanToken) {
    return { status: 400, payload: { error: 'Kunci rahasia pelacakan wajib disertakan.' } };
  }
  if (!cleanMessage && (!attachments || attachments.length === 0)) {
    return { status: 400, payload: { error: 'Pesan balasan atau berkas lampiran wajib diisi.' } };
  }
  if (cleanMessage.length > 5000) {
    return { status: 400, payload: { error: 'Pesan balasan melebihi batas 5.000 karakter.' } };
  }

  // Rate limit balasan: 10 per jam per IP
  const rl = await enforceRateLimit(supabase, 'report_reply', maskedIp, 10, 3600);
  if (!rl.allowed) {
    return {
      status: 429,
      payload: {
        error: `Batas pengiriman balasan tercapai. Silakan coba kembali dalam ${rl.retry_after} detik.`,
      },
    };
  }

  const tokenHash = hashTrackingToken(cleanToken);
  const tokenHashHex = `\\x${tokenHash.toString('hex')}`;
  const encryptedMessage = encryptReportText(cleanMessage || '(Lampiran dikirimkan)');

  if (!encryptedMessage || !encryptedMessage.startsWith('dv1.')) {
    return {
      status: 500,
      payload: { error: 'Enkripsi balasan gagal dijalankan. Pengiriman dihentikan.' },
    };
  }

  const cleanAttachments = Array.isArray(attachments)
    ? attachments.slice(0, 3).map(sanitizeAttachmentMetadata)
    : [];

  const { data, error } = await supabase.rpc('svc_add_reporter_message', {
    p_ticket_code: cleanCode,
    p_token_hash: tokenHashHex,
    p_message_encrypted: encryptedMessage,
    p_attachments: cleanAttachments,
  });

  if (error) {
    const isMissingRpc =
      error.code === 'PGRST202' ||
      error.code === '42883' ||
      Boolean(error.message?.includes('PGRST202'));
    return {
      status: isMissingRpc ? 500 : 400,
      payload: { error: `Gagal mengirim balasan: ${error.message}` },
    };
  }

  return {
    status: 200,
    payload: { success: true, updated_at: data?.updated_at || new Date().toISOString() },
  };
}

async function authenticateOfficerRequest(authHeader, supabaseClient = null) {
  let supabase;
  try {
    supabase = getServiceSupabaseClient(supabaseClient);
  } catch (err) {
    return { ok: false, status: 503, payload: { error: err.message } };
  }

  const rawAuth = String(authHeader || '').trim();
  const bearerMatch = rawAuth.match(/^Bearer\s+(.+)$/i);
  const accessToken = bearerMatch ? bearerMatch[1].trim() : '';
  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      payload: { error: 'UNAUTHORIZED: Token sesi petugas tidak ditemukan.' },
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user?.id) {
    return {
      ok: false,
      status: 401,
      payload: { error: 'UNAUTHORIZED: Sesi petugas tidak valid atau telah kedaluwarsa.' },
    };
  }

  const officerUid = userData.user.id;
  const { data: officerProfile, error: profileError } = await supabase
    .from('officer_profiles')
    .select('id, role, is_active')
    .eq('id', officerUid)
    .maybeSingle();

  const isAuthorizedRole =
    officerProfile?.is_active === true &&
    (officerProfile.role === 'officer' || officerProfile.role === 'supervisor');

  if (profileError || !isAuthorizedRole) {
    return {
      ok: false,
      status: 403,
      payload: {
        error: 'UNAUTHORIZED: Hanya petugas Dinas Pendidikan aktif berwenang yang dapat mengakses data pengaduan.',
      },
    };
  }

  return { ok: true, supabase, officerUid };
}

function safeDecryptTextField(value) {
  if (value === null || value === undefined) return null;
  const str = String(value);
  if (!str) return '';
  if (!str.trim().startsWith('dv1.')) return str;
  try {
    return decryptReportText(str);
  } catch {
    return '[Teks terenkripsi tidak dapat didekripsi]';
  }
}

/**
 * Handler penerbitan Signed URL singkat (5 menit) khusus Petugas Dinas Pendidikan terautentikasi.
 * Identitas dan role diverifikasi ulang dari JWT Supabase + tabel officer_profiles (tidak pernah percaya role frontend).
 */
export async function handleGetOfficerEvidenceUrls(
  body,
  authHeader,
  maskedIp = 'anonymous',
  supabaseClient = null
) {
  const auth = await authenticateOfficerRequest(authHeader, supabaseClient);
  if (!auth.ok) {
    return { status: auth.status, payload: auth.payload };
  }
  const { supabase, officerUid } = auth;

  const rl = await enforceRateLimit(supabase, 'officer_evidence', `${officerUid}:${maskedIp}`, 120, 60);
  if (!rl.allowed) {
    return {
      status: 429,
      payload: { error: `Batas permintaan akses bukti tercapai. Coba lagi dalam ${rl.retry_after} detik.` },
    };
  }

  const reportId = String(body?.reportId || '').trim();
  const rawPaths = Array.isArray(body?.storagePaths) ? body.storagePaths : [];
  if (!reportId || rawPaths.length === 0) {
    return { status: 200, payload: { signedUrls: {}, expiresIn: EVIDENCE_SIGNED_URL_TTL_SECONDS } };
  }

  const uniquePaths = Array.from(
    new Set(
      rawPaths
        .map((p) => String(p || '').trim())
        .filter((p) => p && p.length <= 260 && !p.includes('..') && !p.startsWith('/'))
    )
  ).slice(0, 25);

  const signedUrls = {};
  await Promise.all(
    uniquePaths.map(async (storagePath) => {
      try {
        const { data: authorized, error: authErr } = await supabase.rpc(
          'svc_authorize_officer_evidence',
          {
            p_officer_uid: officerUid,
            p_report_id: reportId,
            p_storage_path: storagePath,
          }
        );
        if (authErr || authorized !== true) return;

        const { data: signed } = await supabase.storage
          .from('report-evidence')
          .createSignedUrl(storagePath, EVIDENCE_SIGNED_URL_TTL_SECONDS);
        if (signed?.signedUrl) {
          signedUrls[storagePath] = signed.signedUrl;
        }
      } catch {
        // Otorisasi atau signing gagal -> path tidak diterbitkan URL
      }
    })
  );

  return {
    status: 200,
    payload: {
      signedUrls,
      expiresIn: EVIDENCE_SIGNED_URL_TTL_SECONDS,
    },
  };
}

/**
 * Handler dekripsi isi laporan & pesan terenkripsi khusus Petugas Dinas Pendidikan aktif.
 * Kunci enkripsi tetap berada di server; client hanya mengirim reportId terotorisasi (bukan ciphertext sembarang).
 */
export async function handleDecryptOfficerReport(
  body,
  authHeader,
  maskedIp = 'anonymous',
  supabaseClient = null
) {
  const auth = await authenticateOfficerRequest(authHeader, supabaseClient);
  if (!auth.ok) {
    return { status: auth.status, payload: auth.payload };
  }
  const { supabase, officerUid } = auth;

  const rl = await enforceRateLimit(supabase, 'officer_decrypt', `${officerUid}:${maskedIp}`, 120, 60);
  if (!rl.allowed) {
    return {
      status: 429,
      payload: { error: `Batas permintaan dekripsi tercapai. Coba lagi dalam ${rl.retry_after} detik.` },
    };
  }

  const reportId = String(body?.reportId || '').trim();
  if (!reportId) {
    return { status: 400, payload: { error: 'Identitas laporan diperlukan.' } };
  }

  const { data: reportRow, error: reportError } = await supabase
    .from('anonymous_reports')
    .select('id, notes_encrypted, ocr_text, ocr_bosp_fact')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError) {
    return {
      status: 500,
      payload: { error: `Gagal memuat isi laporan terenkripsi: ${reportError.message}` },
    };
  }
  if (!reportRow) {
    return { status: 404, payload: { error: 'Data laporan tidak ditemukan.' } };
  }

  const { data: msgRows } = await supabase
    .from('report_messages')
    .select('id, message')
    .eq('report_id', reportId);

  const decryptedMessages = {};
  if (Array.isArray(msgRows)) {
    for (const m of msgRows) {
      if (m?.id) {
        decryptedMessages[String(m.id)] = safeDecryptTextField(m.message) || '';
      }
    }
  }

  return {
    status: 200,
    payload: {
      notes: safeDecryptTextField(reportRow.notes_encrypted) || '',
      ocrText: safeDecryptTextField(reportRow.ocr_text),
      ocrBospFact: safeDecryptTextField(reportRow.ocr_bosp_fact),
      messages: decryptedMessages,
    },
  };
}

