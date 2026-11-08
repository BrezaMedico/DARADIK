import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_ORIGINS, GEMINI_MODEL, PORT } from './config.js';
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
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin tidak diizinkan oleh CORS'));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
    })
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

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/bosp-chatbot')) {
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
