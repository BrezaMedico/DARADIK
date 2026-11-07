import { createClient } from '@supabase/supabase-js';
import type {
  InspectionMethodCode,
  ReportAttachmentMeta,
} from '@/types/report';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://eteimuixvdbcnzokckff.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable__L_ZAHdcCN9NXZn1myW90A_QfDZyD8J';

// Strips proxy IP headers and referrer metadata so client network identity is not leaked.
const privacyShieldFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers || {});
  headers.set('X-Client-Info', 'daradik-privacy-shield');
  headers.delete('X-Forwarded-For');
  headers.delete('CF-Connecting-IP');
  headers.delete('X-Real-IP');

  return fetch(input, {
    ...init,
    headers,
    referrerPolicy: 'no-referrer',
  });
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'daradik-privacy-shield',
    },
    fetch: privacyShieldFetch,
  },
});

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeAttachments(raw: unknown): ReportAttachmentMeta[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item: Record<string, unknown>) => ({
      name: String(item.name || 'Berkas Lampiran'),
      sizeFormatted: String(item.sizeFormatted || '-'),
      url: item.url ? String(item.url) : undefined,
      storagePath: item.storagePath ? String(item.storagePath) : undefined,
      mimeType: item.mimeType ? String(item.mimeType) : undefined,
      uploadedAt: item.uploadedAt ? String(item.uploadedAt) : undefined,
    }));
}

export function normalizeMethods(raw: unknown): InspectionMethodCode[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((x) => String(x) as InspectionMethodCode);
}

// Strips internal Postgres exception prefixes before surfacing RPC errors to the UI.
export function cleanRpcErrorMessage(rawMessage: string): string {
  const prefixes = [
    'CONFLICT_VERSION:',
    'UNAUTHORIZED:',
    'VALIDATION_ERROR:',
    'INVALID_TRANSITION:',
    'INVALID_STATE:',
    'NOT_FOUND:',
  ];
  for (const prefix of prefixes) {
    const idx = rawMessage.indexOf(prefix);
    if (idx >= 0) {
      return rawMessage.slice(idx + prefix.length).trim();
    }
  }
  return rawMessage;
}
