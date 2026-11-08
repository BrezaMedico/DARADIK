import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { PIPER_BINARY_PATH, PIPER_MODEL_PATH } from './config.js';
import { checkRateLimit } from './security.js';
import { normalizeIndonesianTextForTts } from './textNormalizer.js';

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

    const args = [
      '--model',
      PIPER_MODEL_PATH,
      '--output_file',
      '-',
      '--length_scale',
      '0.88',
    ];
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
      // Reject empty WAV outputs that contain only the 44-byte RIFF header.
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
