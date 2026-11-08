// Utility helpers for client-side hashing, safe anonymous naming, and validation.
// All confidential report encryption is securely managed by the server using AES-256-GCM.

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
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

// One-way SHA-256 signal hash so plaintext ticket codes never appear on realtime channels.
export async function computeTicketSignalHash(ticketCode: string): Promise<string> {
  const clean = (ticketCode || '').trim();
  if (!clean) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(`daradik_rt_v2:${clean}`);
  const digestBuffer = await crypto.subtle.digest('SHA-256', data);
  return `sig_${bytesToHex(new Uint8Array(digestBuffer))}`;
}

// Generates anonymous sanitized filenames for evidence files to prevent path traversal and identity leaks.
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
