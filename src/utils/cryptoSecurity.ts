export interface EncryptedClientEnvelope {
  v: 2;
  alg: 'AES-256-CBC+HMAC-SHA256';
  iv: string;
  s: string;
  ct: string;
  mac: string;
}

const TRANSPORT_ENVELOPE_SECRET =
  'DARADIK_E2EE_TRANSPORT_SHIELD_2026_v2_8a4f9c2e7b1d6a3f5c8e0b9d4a2f7e1c';

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function getRandomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
    return arr;
  }
  for (let i = 0; i < length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

// Encrypts report fields via AES-256-CBC + HMAC-SHA256 before leaving the browser.
export async function encryptClientPayload(
  payload: Record<string, unknown>
): Promise<EncryptedClientEnvelope> {
  const encoder = new TextEncoder();
  const ivBytes = getRandomBytes(16);
  const saltBytes = getRandomBytes(16);
  const ivHex = bytesToHex(ivBytes);
  const saltHex = bytesToHex(saltBytes);

  const encMaterial = encoder.encode(`${TRANSPORT_ENVELOPE_SECRET}:${saltHex}:enc`);
  const macMaterial = encoder.encode(`${TRANSPORT_ENVELOPE_SECRET}:${saltHex}:mac`);

  const [encKeyDigest, macKeyDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encMaterial),
    crypto.subtle.digest('SHA-256', macMaterial),
  ]);

  const [aesKey, hmacKey] = await Promise.all([
    crypto.subtle.importKey('raw', encKeyDigest, { name: 'AES-CBC' }, false, ['encrypt']),
    crypto.subtle.importKey(
      'raw',
      macKeyDigest,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
  ]);

  const plainBytes = encoder.encode(JSON.stringify(payload));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBytes as BufferSource },
    aesKey,
    plainBytes as BufferSource
  );

  const ctBase64 = bytesToBase64(new Uint8Array(cipherBuffer));
  const macInput = encoder.encode(`${ivHex}:${saltHex}:${ctBase64}`);
  const macBuffer = await crypto.subtle.sign('HMAC', hmacKey, macInput as BufferSource);
  const macHex = bytesToHex(new Uint8Array(macBuffer));

  return {
    v: 2,
    alg: 'AES-256-CBC+HMAC-SHA256',
    iv: ivHex,
    s: saltHex,
    ct: ctBase64,
    mac: macHex,
  };
}

// One-way SHA-256 signal hash so plaintext ticket codes never appear on realtime channels.
export async function computeTicketSignalHash(ticketCode: string): Promise<string> {
  const clean = (ticketCode || '').trim();
  if (!clean) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(`daradik_rt_v2:${clean}`);
  const digestBuffer = await crypto.subtle.digest('SHA-256', data);
  return `sig_${bytesToHex(new Uint8Array(digestBuffer))}`;
}

// Strips original device filenames to protect reporter anonymity in object storage.
export function generateAnonymousEvidencePath(
  folder: 'initial' | 'followup',
  mimeType: string
): { storagePath: string; maskedDisplayName: string } {
  const token = bytesToHex(getRandomBytes(18));
  const lowerMime = (mimeType || '').toLowerCase();
  let ext = 'jpg';
  let label = 'Bukti_Foto_Anonim';

  if (lowerMime.includes('pdf')) {
    ext = 'pdf';
    label = 'Dokumen_Bukti_Anonim';
  } else if (lowerMime.includes('png')) {
    ext = 'png';
  } else if (lowerMime.includes('webp')) {
    ext = 'webp';
  }

  const shortTag = token.slice(0, 6).toUpperCase();
  return {
    storagePath: `${folder}/${token}.${ext}`,
    maskedDisplayName: `${label}_${shortTag}.${ext}`,
  };
}

export function isValidTicketCodeFormat(code: string): boolean {
  const clean = (code || '').trim();
  return /^CHK-[A-Za-z0-9]{4,8}-[A-Za-z0-9]{4,8}-[A-Za-z0-9]{3,6}$/.test(clean);
}

