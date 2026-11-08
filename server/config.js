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

export const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

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
