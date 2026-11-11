import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env');
const SRC_ENV_PATH = path.resolve(__dirname, '..', 'src', '.env');
dotenv.config({ path: ENV_FILE_PATH, override: true });
dotenv.config({ path: SRC_ENV_PATH, override: false });
dotenv.config({ override: true });

export const PORT = Number(process.env.PORT || 3001);
export const GEMINI_API_KEY = (
  process.env.GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  ''
).trim();
const RAW_MODEL_ENV = (
  process.env.GEMINI_MODEL ||
  process.env.VITE_GEMINI_MODEL ||
  'gemini-3.5-flash-lite'
).trim();
export const GEMINI_MODEL = (RAW_MODEL_ENV === 'gemini-3.8-flash' || RAW_MODEL_ENV === 'gemini-2.5-flash')
  ? 'gemini-3.5-flash-lite'
  : (RAW_MODEL_ENV || 'gemini-3.5-flash-lite');

export const PIPER_BINARY_PATH = (process.env.PIPER_BINARY_PATH || 'piper').trim();
export const PIPER_MODEL_PATH = (
  process.env.PIPER_MODEL_PATH ||
  path.resolve(__dirname, 'models', 'id_ID-news_tts-medium.onnx')
).trim();

export const PRODUCTION_ALLOWED_ORIGINS = [
  'https://daradik.vercel.app',
  'https://daradik.onrender.com',
];

export const DEVELOPMENT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

function normalizeOrigin(origin) {
  const clean = String(origin || '').trim().replace(/\/+$/, '');
  if (!clean || clean === '*') return null;
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function resolveAllowedOrigins({
  nodeEnv = process.env.NODE_ENV,
  vercelEnv = process.env.VERCEL_ENV,
  rawAllowedOrigins = process.env.ALLOWED_ORIGINS,
  renderExternalUrl = process.env.RENDER_EXTERNAL_URL,
  vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL,
  vercelBranchUrl = process.env.VERCEL_BRANCH_URL,
  vercelUrl = process.env.VERCEL_URL,
} = {}) {
  const isProduction =
    String(nodeEnv || '').toLowerCase() === 'production' ||
    String(vercelEnv || '').toLowerCase() === 'production';

  const origins = new Set(PRODUCTION_ALLOWED_ORIGINS);

  if (!isProduction) {
    for (const devOrigin of DEVELOPMENT_ALLOWED_ORIGINS) {
      origins.add(devOrigin);
    }
  }

  const extraCandidates = [
    ...String(rawAllowedOrigins || '').split(','),
    renderExternalUrl || '',
    vercelProductionUrl ? `https://${vercelProductionUrl}` : '',
    vercelBranchUrl ? `https://${vercelBranchUrl}` : '',
    vercelUrl ? `https://${vercelUrl}` : '',
  ];

  for (const candidate of extraCandidates) {
    const normalized = normalizeOrigin(candidate);
    if (!normalized) continue;
    if (isProduction) {
      const u = new URL(normalized);
      const isLocalHost =
        u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1';
      if (u.protocol !== 'https:' || isLocalHost) continue;
    }
    origins.add(normalized);
  }

  return Array.from(origins);
}

export const ALLOWED_ORIGINS = resolveAllowedOrigins();

export const MAX_INPUT_LENGTH = 300;
export const VALID_EMOTIONS = new Set([
  'senang',
  'netral',
  'bingung',
  'semangat',
  'empati',
  'berpikir',
  'marah',
  'sedih',
  'kaget',
  'menyapa',
]);

// Re-read .env on each call so key rotations take effect without restarting the server.
export function getAiClient() {
  dotenv.config({ path: ENV_FILE_PATH, override: true });
  dotenv.config({ path: SRC_ENV_PATH, override: false });
  const key = (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    GEMINI_API_KEY ||
    ''
  ).trim();
  if (!key || key.startsWith('[ISI_')) return null;
  return new GoogleGenAI({ apiKey: key });
}
