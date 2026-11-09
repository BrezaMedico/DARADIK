import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_ORIGINS, GEMINI_MODEL, PORT, getAiClient } from './config.js';
import {
  anonymizeClientIp,
  cleanBotTextForSpeechDisplay,
  sanitizeUserInput,
} from './security.js';
import { handleTtsRequest, synthesizeWithPiper } from './ttsService.js';
import { handleChatRequest } from './chatService.js';
import {
  handleGetCaptcha,
  handleUploadEvidence,
  handleSubmitReport,
  handleTrackReport,
  handleReplyReport,
} from './reportService.js';
import { handleScanJudge } from './scanJudgeService.js';

export async function handleScanVision(body) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = body || {};
    if (!imageBase64) {
      return { status: 400, payload: { error: 'Gambar tidak ditemukan.' } };
    }
    const aiClient = getAiClient();
    if (!aiClient) {
      return { status: 503, payload: { error: 'AI Client tidak tersedia.' } };
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL || 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType, data: cleanBase64 } },
            {
              text:
                'Transkripsikan seluruh isi teks dalam gambar screenshot percakapan atau pengumuman WhatsApp ini secara lengkap dan persis kata demi kata tanpa ada yang terlewat, termasuk pengumuman nominal uang, nama kegiatan/barang, tanggal batas waktu, dan pihak yang memungut/bendahara.',
            },
          ],
        },
      ],
    });
    const transcribedText = response?.text || '';
    return { status: 200, payload: { text: transcribedText } };
  } catch (err) {
    console.warn('[Vision API] Error:', err?.message || err);
    return { status: 500, payload: { error: 'Gagal memproses Vision AI.' } };
  }
}

export {
  anonymizeClientIp,
  sanitizeUserInput,
  cleanBotTextForSpeechDisplay,
  synthesizeWithPiper,
  handleChatRequest,
  handleTtsRequest,
  handleGetCaptcha,
  handleUploadEvidence,
  handleSubmitReport,
  handleTrackReport,
  handleReplyReport,
  handleScanJudge,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), camera=(), microphone=(), interest-cohort=()'
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://*.ytimg.com https://img.youtube.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com; media-src 'self' blob: data:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';"
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          ALLOWED_ORIGINS.includes('*') ||
          ALLOWED_ORIGINS.includes(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
          /^https?:\/\/([a-z0-9-]+\.)*(vercel\.app|onrender\.com)$/i.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  app.use(
    ['/api/scan-vision', '/api/scanner/vision', '/api/scan-judge', '/api/scanner/judge'],
    express.json({ limit: '10mb' })
  );
  app.use('/api/reports/upload', express.json({ limit: '10mb' }));
  app.use(express.json({ limit: '256kb' }));

  app.use(
    '/bosp-chatbot',
    express.static(path.resolve(__dirname, '..', 'public', 'bosp-chatbot'))
  );

  const getMaskedIp = (req) => {
    const raw =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'anonymous';
    delete req.headers['x-forwarded-for'];
    delete req.headers['cf-connecting-ip'];
    delete req.headers['x-real-ip'];
    return anonymizeClientIp(raw);
  };

  app.post(['/api/scan-vision', '/api/scanner/vision'], async (req, res) => {
    const result = await handleScanVision(req.body);
    res.status(result.status).json(result.payload);
  });

  app.post(['/api/scan-judge', '/api/scanner/judge'], async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleScanJudge(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/chat', async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleChatRequest(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/tts', async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleTtsRequest(req.body, maskedIp);

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

  // Endpoints pengaduan terenkripsi & terproteksi
  app.get('/api/reports/captcha', async (_req, res) => {
    const result = await handleGetCaptcha();
    res.status(result.status).json(result.payload);
  });

  app.post('/api/reports/upload', async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleUploadEvidence(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/reports/submit', async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleSubmitReport(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/reports/track', async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleTrackReport(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/reports/reply', async (req, res) => {
    const maskedIp = getMaskedIp(req);
    const result = await handleReplyReport(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  // Sajikan berkas statis produksi frontend (Single Page Application fallback)
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/bosp-chatbot')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next();
    });
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
