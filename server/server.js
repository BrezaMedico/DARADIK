/**
 * BACKEND PROXY SERVER - AI CHATBOT ASISTEN BOSP (DARADIK)
 * Menyediakan endpoint:
 * - POST /api/chat : Proxy aman ke Google Gemini (@google/genai Interactions API) + fallback instan
 * - POST /api/tts  : Sintesis suara Bahasa Indonesia via Piper TTS (id_ID-news_tts-medium) + cache WAV
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import {
  FINAL_SYSTEM_PROMPT,
  getLocalKnowledgeReply,
} from './knowledgeBase.js';
import { normalizeIndonesianTextForTts } from './textNormalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: ENV_FILE_PATH, override: true });
dotenv.config({ override: true });

const PORT = Number(process.env.PORT || 3001);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const RAW_MODEL_ENV = (
  process.env.GEMINI_MODEL || 'gemini-3.8-flash'
).trim();
const GEMINI_MODEL = RAW_MODEL_ENV || 'gemini-3.8-flash';

const PIPER_BINARY_PATH = (process.env.PIPER_BINARY_PATH || 'piper').trim();
const PIPER_MODEL_PATH = (
  process.env.PIPER_MODEL_PATH ||
  path.resolve(__dirname, 'models', 'id_ID-news_tts-medium.onnx')
).trim();

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const MAX_INPUT_LENGTH = 300;
const VALID_EMOTIONS = new Set([
  'senang',
  'netral',
  'bingung',
  'semangat',
  'empati',
  'berpikir',
]);

function getAiClient() {
  dotenv.config({ path: ENV_FILE_PATH, override: true });
  const key = (process.env.GEMINI_API_KEY || GEMINI_API_KEY || '').trim();
  if (!key || key.startsWith('[ISI_')) return null;
  return new GoogleGenAI({ apiKey: key });
}

// ============================================================================
// RATE LIMITER SEDERHANA PER IP (IN-MEMORY)
// ============================================================================
const rateLimitStore = new Map();

function checkRateLimit(ip, bucket = 'chat', maxReq = 35, windowMs = 60_000) {
  const now = Date.now();
  const key = `${bucket}:${ip || 'unknown'}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.start > windowMs) {
    rateLimitStore.set(key, { start: now, count: 1 });
    return true;
  }

  if (entry.count >= maxReq) {
    return false;
  }

  entry.count += 1;
  return true;
}

// ============================================================================
// SANITASI INPUT & PEMBERSIH OUTPUT SUARA
// ============================================================================
export function sanitizeUserInput(raw = '') {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}

export function cleanBotTextForSpeechDisplay(raw = '') {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[*_~`#>|•●]/g, '')
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// CACHE AUDIO TTS (LRU SEDERHANA DI MEMORI)
// ============================================================================
const ttsWavCache = new Map();
const MAX_TTS_CACHE_ITEMS = 60;

function setTtsCache(key, wavBuffer) {
  if (ttsWavCache.size >= MAX_TTS_CACHE_ITEMS) {
    const oldestKey = ttsWavCache.keys().next().value;
    if (oldestKey) ttsWavCache.delete(oldestKey);
  }
  ttsWavCache.set(key, wavBuffer);
}

export function synthesizeWithPiper(normalizedText) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(PIPER_MODEL_PATH)) {
      return reject(
        new Error(`Model Piper tidak ditemukan di: ${PIPER_MODEL_PATH}`)
      );
    }

    const args = ['--model', PIPER_MODEL_PATH, '--output_file', '-'];
    const proc = spawn(PIPER_BINARY_PATH, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const stdoutChunks = [];
    const stderrChunks = [];

    const timeoutId = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Piper TTS timeout'));
    }, 10_000);

    proc.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
    proc.stderr.on('data', (chunk) => stderrChunks.push(chunk));

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      const wavBuffer = Buffer.concat(stdoutChunks);
      if (code === 0 && wavBuffer.length > 44) {
        resolve(wavBuffer);
      } else {
        const errMsg = Buffer.concat(stderrChunks).toString('utf8').trim();
        reject(new Error(errMsg || `Piper keluar dengan kode ${code}`));
      }
    });

    proc.stdin.write(normalizedText + '\n', 'utf8');
    proc.stdin.end();
  });
}

// ============================================================================
// HANDLER INTI: POST /api/chat
// ============================================================================
export async function handleChatRequest(body = {}, clientIp = '127.0.0.1') {
  console.log('[handleChatRequest start] IP:', clientIp, 'message:', body.message);
  if (!checkRateLimit(clientIp, 'chat', 35, 60_000)) {
    return {
      status: 429,
      payload: {
        teks: 'Maaf, kamu mengirim pesan terlalu cepat. Tunggu sebentar lalu coba lagi ya.',
        emosi: 'netral',
      },
    };
  }

  const message = sanitizeUserInput(body.message || '');
  if (!message) {
    return {
      status: 400,
      payload: {
        teks: 'Silakan ketik pertanyaan kamu soal dana BOSP atau cara pakai aplikasi ini ya.',
        emosi: 'netral',
      },
    };
  }

  const rawHistory = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const previousInteractionId =
    typeof body.previousInteractionId === 'string' &&
    body.previousInteractionId.trim()
      ? body.previousInteractionId.trim()
      : undefined;

  const aiClient = getAiClient();
  if (!aiClient) {
    const localReply = getLocalKnowledgeReply(message, rawHistory);
    return {
      status: 200,
      payload: {
        teks: cleanBotTextForSpeechDisplay(localReply.teks),
        emosi: VALID_EMOTIONS.has(localReply.emosi)
          ? localReply.emosi
          : 'netral',
      },
    };
  }

  let contextualInput = message;
  if (rawHistory.length > 0) {
    const formattedHistory = rawHistory
      .map((item) => {
        const role = item?.role === 'bot' ? 'Asisten BOSP' : 'Pengguna';
        const text = sanitizeUserInput(item?.text || '');
        return text ? `${role}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');

    if (formattedHistory) {
      contextualInput = `Konteks percakapan sebelumnya:\n${formattedHistory}\n\nPertanyaan terbaru Pengguna: ${message}`;
    }
  }

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
    GEMINI_MODEL,
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let rawOutput = '';
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const genConfig = {
        systemInstruction: FINAL_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            teks: {
              type: 'string',
              description:
                'Jawaban bahasa Indonesia maksimal 2-4 kalimat tanpa markdown, simbol, atau emoji. Angka ditulis dengan kata.',
            },
            emosi: {
              type: 'string',
              enum: [
                'senang',
                'netral',
                'bingung',
                'semangat',
                'empati',
                'berpikir',
              ],
            },
          },
          required: ['teks', 'emosi'],
        },
        temperature: 0.7,
        maxOutputTokens: 1000,
      };

      const response = await Promise.race([
        aiClient.models.generateContent({
          model: modelName,
          contents: contextualInput,
          config: genConfig,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model timeout')), 3_500)
        ),
      ]);

      rawOutput = (response?.text || '').trim();
      console.log(`[handleChatRequest Gemini ${modelName} returned]:`, rawOutput);
      let parsed = null;
      try {
        parsed = JSON.parse(rawOutput);
      } catch {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {}
        }
      }

      if (parsed && typeof parsed.teks === 'string' && parsed.teks.trim().length > 3) {
        const cleanTeks = cleanBotTextForSpeechDisplay(parsed.teks);
        const cleanEmosi = VALID_EMOTIONS.has(parsed.emosi)
          ? parsed.emosi
          : 'netral';

        return {
          status: 200,
          payload: {
            teks: cleanTeks,
            emosi: cleanEmosi,
          },
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[BOSP-Chatbot] Model ${modelName} gagal:`, err?.status || err?.message);
    }
  }

  console.error('[BOSP-Chatbot] Semua model Gemini gagal:', lastError?.message);
  const fallbackReply = getLocalKnowledgeReply(message, rawHistory);
  return {
    status: 200,
    payload: {
      teks: cleanBotTextForSpeechDisplay(fallbackReply.teks),
      emosi: VALID_EMOTIONS.has(fallbackReply.emosi)
        ? fallbackReply.emosi
        : 'netral',
    },
  };
}

// ============================================================================
// HANDLER INTI: POST /api/tts
// ============================================================================
export async function handleTtsRequest(body = {}, clientIp = '127.0.0.1') {
  if (!checkRateLimit(clientIp, 'tts', 45, 60_000)) {
    return {
      status: 429,
      isAudio: false,
      payload: { error: 'Terlalu banyak permintaan suara.' },
    };
  }

  const rawText = typeof body.text === 'string' ? body.text.slice(0, 600) : '';
  const normalizedText = normalizeIndonesianTextForTts(rawText);

  if (!normalizedText) {
    return {
      status: 400,
      isAudio: false,
      payload: { error: 'Teks kosong.' },
    };
  }

  if (ttsWavCache.has(normalizedText)) {
    return {
      status: 200,
      isAudio: true,
      cached: true,
      wavBuffer: ttsWavCache.get(normalizedText),
      normalizedText,
    };
  }

  try {
    const wavBuffer = await synthesizeWithPiper(normalizedText);
    setTtsCache(normalizedText, wavBuffer);
    return {
      status: 200,
      isAudio: true,
      cached: false,
      wavBuffer,
      normalizedText,
    };
  } catch (err) {
    return {
      status: 503,
      isAudio: false,
      payload: {
        fallback: 'webspeech',
        normalizedText,
        reason: err?.message || 'Piper TTS unavailable',
      },
    };
  }
}

// ============================================================================
// EXPRESS APPLICATION
// ============================================================================
export function createExpressApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          ALLOWED_ORIGINS.includes('*') ||
          ALLOWED_ORIGINS.includes(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin tidak diizinkan oleh CORS'));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  app.use(express.json({ limit: '16kb' }));

  app.use(
    '/bosp-chatbot',
    express.static(path.resolve(__dirname, '..', 'public', 'bosp-chatbot'))
  );

  app.post('/api/chat', async (req, res) => {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const result = await handleChatRequest(req.body, ip);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/tts', async (req, res) => {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const result = await handleTtsRequest(req.body, ip);

    if (result.isAudio && result.wavBuffer) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-TTS-Cache', result.cached ? 'HIT' : 'MISS');
      res.setHeader(
        'X-Normalized-Text',
        encodeURIComponent(result.normalizedText || '')
      );
      return res.status(200).send(result.wavBuffer);
    }

    return res.status(result.status).json(result.payload);
  });

  return app;
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  const app = createExpressApp();
  app.listen(PORT, () => {
    console.log(
      `[BOSP-Chatbot Server] Aktif di http://localhost:${PORT} (Model: ${GEMINI_MODEL})`
    );
  });
}
