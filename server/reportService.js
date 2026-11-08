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

let defaultSupabaseClient = null;

export function getServiceSupabaseClient(overrideClient = null) {
  if (overrideClient) return overrideClient;
  if (defaultSupabaseClient) return defaultSupabaseClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  defaultSupabaseClient = createClient(url, key, {
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
  const supabase = getServiceSupabaseClient(customClient);
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
  const supabase = getServiceSupabaseClient(customClient);
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
  const cleanSchoolName = String(schoolName || '').trim();
  const cleanNpsn = String(schoolNpsn || '').trim();
  const cleanCategory = String(category || '').trim();
  const cleanRole = String(requesterRole || '').trim();
  const cleanNotes = String(notes || '').trim();

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
  const ocrTextEncrypted = ocrText ? encryptReportText(String(ocrText)) : null;
  const ocrBospFactEncrypted = ocrBospFact ? encryptReportText(String(ocrBospFact)) : null;

  // 6. Buat identitas dan secret token
  const reportId = crypto.randomUUID();
  const trackingSecret = generateTrackingSecret();
  const tokenHash = hashTrackingToken(trackingSecret);
  const tokenHashHex = `\\x${tokenHash.toString('hex')}`;

  // 7. Bersihkan lampiran: pastikan hanya metadata aman yang dikirim ke database
  const cleanAttachments = Array.isArray(attachments)
    ? attachments.map((att) => ({
        name: String(att.name || 'Berkas Lampiran').slice(0, 120),
        sizeFormatted: String(att.sizeFormatted || '-').slice(0, 20),
        storagePath: String(att.storagePath || ''),
        mimeType: String(att.mimeType || '').slice(0, 60),
        uploadedAt: String(att.uploadedAt || new Date().toISOString()).slice(0, 40),
      }))
    : [];

  let { data, error } = await supabase.rpc('svc_submit_report', {
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
  });

  // Fallback jika database Supabase target masih berjalan pada migrasi sebelumnya
  if (error && (error.code === 'PGRST202' || error.message?.includes('PGRST202') || error.code === '42883')) {
    const legacy = await supabase.rpc('submit_public_report', {
      p_school_id: String(schoolId || cleanNpsn).trim(),
      p_school_name: cleanSchoolName,
      p_school_npsn: cleanNpsn,
      p_kabupaten: String(kabupaten || 'Data belum tersedia').trim(),
      p_kecamatan: String(kecamatan || 'Data belum tersedia').trim(),
      p_category: cleanCategory,
      p_requester_role: cleanRole,
      p_notes: cleanNotes,
      p_attachments: cleanAttachments,
      p_ocr_text: ocrText || null,
      p_ocr_bosp_fact: ocrBospFact || null,
    });
    if (!legacy.error && legacy.data) {
      data = legacy.data;
      error = null;
    }
  }

  if (error) {
    return {
      status: 400,
      payload: { error: `Gagal menyimpan laporan ke basis data: ${error.message}` },
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
  const supabase = getServiceSupabaseClient(customClient);
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

  let { data, error } = await supabase.rpc('svc_get_report_tracking', {
    p_ticket_code: cleanCode,
    p_token_hash: tokenHashHex,
  });

  if (error && (error.code === 'PGRST202' || error.message?.includes('PGRST202') || error.code === '42883')) {
    const legacy = await supabase.rpc('get_public_report_tracking', {
      p_ticket_code: cleanCode,
    });
    if (!legacy.error && legacy.data) {
      data = legacy.data;
      error = null;
    }
  }

  if (error) {
    return {
      status: 400,
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

  // Siapkan signed URL untuk berkas lampiran laporan
  if (Array.isArray(report.attachments_json)) {
    const signedList = await Promise.all(
      report.attachments_json.map(async (att) => {
        if (!att.storagePath) return att;
        try {
          const { data: signed } = await supabase.storage
            .from('report-evidence')
            .createSignedUrl(att.storagePath, 600); // 10 menit
          return { ...att, url: signed?.signedUrl || '' };
        } catch {
          return att;
        }
      })
    );
    report.attachments_json = signedList;
  }

  // Siapkan pesan dan signed URL untuk lampiran pesan
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

      let atts = m.attachments_json;
      if (Array.isArray(atts)) {
        atts = await Promise.all(
          atts.map(async (a) => {
            if (!a.storagePath) return a;
            try {
              const { data: s } = await supabase.storage
                .from('report-evidence')
                .createSignedUrl(a.storagePath, 600);
              return { ...a, url: s?.signedUrl || '' };
            } catch {
              return a;
            }
          })
        );
      }

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
  const supabase = getServiceSupabaseClient(customClient);
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

  const cleanAttachments = Array.isArray(attachments)
    ? attachments.map((att) => ({
        name: String(att.name || 'Berkas Lampiran').slice(0, 120),
        sizeFormatted: String(att.sizeFormatted || '-').slice(0, 20),
        storagePath: String(att.storagePath || ''),
        mimeType: String(att.mimeType || '').slice(0, 60),
        uploadedAt: String(att.uploadedAt || new Date().toISOString()).slice(0, 40),
      }))
    : [];

  let { data, error } = await supabase.rpc('svc_add_reporter_message', {
    p_ticket_code: cleanCode,
    p_token_hash: tokenHashHex,
    p_message_encrypted: encryptedMessage,
    p_attachments: cleanAttachments,
  });

  if (error && (error.code === 'PGRST202' || error.message?.includes('PGRST202') || error.code === '42883')) {
    const legacy = await supabase.rpc('submit_reporter_additional_info', {
      p_ticket_code: cleanCode,
      p_message: cleanMessage || '(Lampiran dikirimkan)',
      p_attachments: cleanAttachments,
    });
    if (!legacy.error) {
      data = { updated_at: new Date().toISOString() };
      error = null;
    }
  }

  if (error) {
    return {
      status: 400,
      payload: { error: `Gagal mengirim balasan: ${error.message}` },
    };
  }

  return {
    status: 200,
    payload: { success: true, updated_at: data?.updated_at || new Date().toISOString() },
  };
}

