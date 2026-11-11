import crypto from 'node:crypto';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables strictly without relying on caller context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: ENV_FILE_PATH, override: false });
dotenv.config({ override: false });

/**
 * Validasi ketat kunci enkripsi master AES-256-GCM.
 * Menghapus seluruh fallback key default di source code.
 * Kunci WAJIB didefinisikan di environment variable REPORT_ENCRYPTION_KEY
 * dalam format Base64 (32 byte) atau Hex (64 karakter hexadecimal).
 */
export function parseEncryptionKey(rawKey, varName = 'REPORT_ENCRYPTION_KEY') {
  if (!rawKey || typeof rawKey !== 'string') {
    throw new Error(
      `[SECURITY ERROR] ${varName} wajib dikonfigurasi melalui environment variables. Sistem menolak berjalan tanpa kunci enkripsi rahasia!`
    );
  }
  const trimmed = rawKey.trim();
  if (!trimmed) {
    throw new Error(`[SECURITY ERROR] ${varName} tidak boleh kosong.`);
  }

  // Dukungan 64 hex characters (32 bytes)
  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // Dukungan Base64 dari 32 bytes
  const buf = Buffer.from(trimmed, 'base64');
  if (buf.length === 32 && (buf.toString('base64') === trimmed || trimmed.replace(/=+$/, '') === buf.toString('base64').replace(/=+$/, ''))) {
    return buf;
  }

  throw new Error(
    `[SECURITY ERROR] ${varName} harus berupa 32 byte (Base64 atau 64 karakter Hex). Ditemukan panjang: ${buf.length} byte.`
  );
}

/**
 * Vault Kunci dengan Dukungan Versioning & Rotasi Kunci
 * Memungkinkan dekripsi laporan lama saat kunci dirotasi di masa depan.
 */
function initReportKeyVault() {
  const activeKeyRaw = (process.env.REPORT_ENCRYPTION_KEY || '').trim();
  const activeKeyId = (process.env.REPORT_ENCRYPTION_ACTIVE_KEY_ID || 'k1').trim();

  const activeKeyBuffer = parseEncryptionKey(activeKeyRaw, 'REPORT_ENCRYPTION_KEY');
  const keyMap = new Map();
  keyMap.set(activeKeyId, activeKeyBuffer);

  // Dukungan rotasi kunci tambahan via REPORT_ENCRYPTION_KEYS (JSON: {"k1":"...", "k2":"..."})
  if (process.env.REPORT_ENCRYPTION_KEYS) {
    try {
      const parsed = JSON.parse(process.env.REPORT_ENCRYPTION_KEYS);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [kId, kVal] of Object.entries(parsed)) {
          if (!keyMap.has(kId) && typeof kVal === 'string' && kVal.trim()) {
            keyMap.set(kId, parseEncryptionKey(kVal, `REPORT_ENCRYPTION_KEYS[${kId}]`));
          }
        }
      }
    } catch (e) {
      console.warn('[SECURITY WARNING] Format JSON pada REPORT_ENCRYPTION_KEYS tidak valid:', e.message);
    }
  }

  return { activeKeyId, activeKeyBuffer, keyMap };
}

const VAULT = initReportKeyVault();

function getCaptchaSecret() {
  const envSecret = (process.env.CAPTCHA_SECRET || '').trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (!envSecret) {
    throw new Error(
      '[SECURITY ERROR] CAPTCHA_SECRET wajib dikonfigurasi melalui environment variables (minimal 16 karakter acak).'
    );
  }
  throw new Error(
    '[SECURITY ERROR] CAPTCHA_SECRET terlalu pendek. Gunakan minimal 16 karakter acak.'
  );
}

const CAPTCHA_SECRET = getCaptchaSecret();

export function encryptReportText(text, keyId = VAULT.activeKeyId) {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const key = VAULT.keyMap.get(keyId) || VAULT.activeKeyBuffer;
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const enc = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const nonceB64u = nonce.toString('base64url');
  const ctB64u = enc.toString('base64url');
  const tagB64u = tag.toString('base64url');

  return `dv1.${keyId}.${nonceB64u}.${ctB64u}.${tagB64u}`;
}

export function decryptReportText(envelope) {
  if (!envelope) return null;
  const str = String(envelope).trim();
  if (!str.startsWith('dv1.')) return str; // Return as-is if legacy unencrypted or already plaintext

  const parts = str.split('.');
  if (parts.length !== 5) {
    throw new Error('Format envelope terenkripsi tidak valid');
  }

  const [, keyId, nonceB64u, ctB64u, tagB64u] = parts;
  const key = VAULT.keyMap.get(keyId);
  if (!key) {
    throw new Error(
      `Kunci enkripsi versi "${keyId}" tidak ditemukan pada vault untuk mendekripsi laporan ini.`
    );
  }

  const nonce = Buffer.from(nonceB64u, 'base64url');
  const ct = Buffer.from(ctB64u, 'base64url');
  const tag = Buffer.from(tagB64u, 'base64url');

  if (nonce.length !== 12 || tag.length !== 16) {
    throw new Error('Parameter kriptografi envelope tidak valid');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec.toString('utf8');
}

export function generateTrackingSecret() {
  // 160 bits (20 bytes) of cryptographically secure random entropy
  const randomBytes = crypto.randomBytes(20);
  return `trk_${randomBytes.toString('base64url')}`;
}

export function hashTrackingToken(token) {
  const clean = String(token || '').trim();
  return crypto.createHash('sha256').update(clean, 'utf8').digest();
}

export function generateCaptchaChallenge() {
  const opChoice = Math.random();
  let num1, num2, op, answer;

  if (opChoice < 0.4) {
    num1 = Math.floor(Math.random() * 12) + 3;
    num2 = Math.floor(Math.random() * 11) + 2;
    op = '+';
    answer = num1 + num2;
  } else if (opChoice < 0.75) {
    num1 = Math.floor(Math.random() * 15) + 8;
    num2 = Math.floor(Math.random() * (num1 - 2)) + 1;
    op = '-';
    answer = num1 - num2;
  } else {
    num1 = Math.floor(Math.random() * 6) + 2;
    num2 = Math.floor(Math.random() * 4) + 2;
    op = '×';
    answer = num1 * num2;
  }

  const question = `${num1} ${op} ${num2} = ?`;
  const nonce = crypto.randomBytes(12).toString('hex');
  const exp = Date.now() + 10 * 60 * 1000; // 10 menit (selaras dengan batas 9 menit di UI)

  const payload = JSON.stringify({ a: answer, exp, n: nonce });
  const payloadB64u = Buffer.from(payload, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payloadB64u).digest('base64url');

  return {
    question,
    token: `${payloadB64u}.${hmac}`,
  };
}

export function verifyCaptchaAnswer(submittedAnswer, token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token verifikasi keamanan tidak ditemukan.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Format token verifikasi tidak valid.' };
  }

  const [payloadB64u, sigB64u] = parts;
  if (!payloadB64u || !sigB64u) {
    return { valid: false, reason: 'Komponen token verifikasi tidak lengkap.' };
  }

  const expectedSig = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payloadB64u)
    .digest('base64url');

  const givenBuf = Buffer.from(sigB64u, 'base64url');
  const expBuf = Buffer.from(expectedSig, 'base64url');

  if (givenBuf.length !== expBuf.length || !crypto.timingSafeEqual(givenBuf, expBuf)) {
    return { valid: false, reason: 'Tanda tangan token keamanan tidak sah.' };
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payloadB64u, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'Data token keamanan korup.' };
  }

  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Muatan token keamanan tidak valid.' };
  }

  if (typeof data.exp !== 'number' || Date.now() > data.exp) {
    return { valid: false, reason: 'Sesi verifikasi telah kedaluwarsa. Silakan muat ulang tantangan.' };
  }

  if (!data.n || typeof data.n !== 'string' || !data.n.trim()) {
    return { valid: false, reason: 'Nonce token keamanan tidak valid.' };
  }

  const cleanAns = String(submittedAnswer ?? '').trim();
  const expectedAns = String(data.a ?? '').trim();

  if (!cleanAns || cleanAns !== expectedAns) {
    return { valid: false, reason: 'Jawaban verifikasi keamanan tidak sesuai.' };
  }

  return { valid: true, nonce: data.n.trim() };
}

// Magic bytes validation for uploaded files
export function detectFileMimeAndValidate(buffer, claimedMime = '') {
  if (!Buffer.isBuffer(buffer)) {
    return { valid: false, reason: 'Data berkas tidak valid.' };
  }

  if (buffer.length < 4) {
    return { valid: false, reason: 'Ukuran berkas terlalu kecil.' };
  }

  if (buffer.length > 5 * 1024 * 1024) {
    return { valid: false, reason: 'Ukuran berkas melebihi batas 5MB.' };
  }

  let detectedMime = null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedMime = 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedMime = 'image/png';
  }
  // WebP: RIFF ... WEBP (starts with RIFF, bytes 8..11 are WEBP)
  else if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    detectedMime = 'image/webp';
  }
  // PDF: %PDF (25 50 44 46)
  else if (
    buffer.length >= 4 &&
    buffer.toString('ascii', 0, 4) === '%PDF'
  ) {
    detectedMime = 'application/pdf';
  }

  if (!detectedMime) {
    return {
      valid: false,
      reason: 'Format berkas tidak diizinkan. Hanya menerima format berkas JPG, PNG, WebP, atau PDF asli.',
    };
  }

  const cleanClaimed = String(claimedMime || '').toLowerCase();
  if (cleanClaimed && !cleanClaimed.includes(detectedMime.split('/')[1]) && cleanClaimed !== detectedMime) {
    // If user claimed a radically different mime type than actual magic bytes
    if (detectedMime === 'application/pdf' && !cleanClaimed.includes('pdf')) {
      return { valid: false, reason: 'Ekstensi atau tipe berkas tidak cocok dengan konten aslinya.' };
    }
  }

  return { valid: true, mimeType: detectedMime };
}

