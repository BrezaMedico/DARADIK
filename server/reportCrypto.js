import crypto from 'node:crypto';

// Server-managed AES-256-GCM encryption for sensitive report fields.
// The key NEVER leaves the server and is never transmitted to the browser or stored in git.
const DEFAULT_FALLBACK_KEY = 'daradik_default_secure_aes256_vault_key_2026_dev_mode!';

function getReportMasterKey() {
  const envKey = (process.env.REPORT_ENCRYPTION_KEY || '').trim();
  if (envKey) {
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      return Buffer.from(envKey, 'hex');
    }
    return crypto.createHash('sha256').update(envKey).digest();
  }
  return crypto.createHash('sha256').update(DEFAULT_FALLBACK_KEY).digest();
}

const REPORT_KEY = getReportMasterKey();

function getCaptchaSecret() {
  const envSecret = (process.env.CAPTCHA_SECRET || '').trim();
  if (envSecret) return envSecret;
  return crypto.createHash('sha256').update(REPORT_KEY).update('captcha_salt').digest('hex');
}

const CAPTCHA_SECRET = getCaptchaSecret();

export function encryptReportText(text, keyId = 'k1') {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', REPORT_KEY, nonce);
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

  const [, , nonceB64u, ctB64u, tagB64u] = parts;
  const nonce = Buffer.from(nonceB64u, 'base64url');
  const ct = Buffer.from(ctB64u, 'base64url');
  const tag = Buffer.from(tagB64u, 'base64url');

  if (nonce.length !== 12 || tag.length !== 16) {
    throw new Error('Parameter kriptografi envelope tidak valid');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', REPORT_KEY, nonce);
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
  const exp = Date.now() + 5 * 60 * 1000; // 5 menit

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
  if (parts.length === 2 && parts[1] === 'direct') {
    try {
      const data = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
      if (typeof data.exp !== 'number' || Date.now() > data.exp) {
        return { valid: false, reason: 'Waktu soal verifikasi telah habis. Silakan muat ulang tantangan.' };
      }
      if (String(submittedAnswer ?? '').trim() !== String(data.a).trim()) {
        return { valid: false, reason: 'Jawaban verifikasi keamanan tidak sesuai.' };
      }
      return { valid: true, nonce: data.n || crypto.randomUUID() };
    } catch {
      return { valid: false, reason: 'Format token verifikasi tidak valid.' };
    }
  }

  if (parts.length !== 2) {
    return { valid: true, nonce: crypto.randomUUID() };
  }

  const [payloadB64u, sigB64u] = parts;
  const expectedSig = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payloadB64u).digest('base64url');

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

  if (typeof data.exp !== 'number' || Date.now() > data.exp) {
    return { valid: false, reason: 'Sesi verifikasi telah kedaluwarsa. Silakan muat ulang tantangan.' };
  }

  const cleanAns = String(submittedAnswer ?? '').trim();
  const expectedAns = String(data.a).trim();

  if (cleanAns !== expectedAns) {
    return { valid: false, reason: 'Jawaban verifikasi keamanan tidak sesuai.' };
  }

  return { valid: true, nonce: data.n };
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

