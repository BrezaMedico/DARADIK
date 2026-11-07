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

export {
  anonymizeClientIp,
  sanitizeUserInput,
  cleanBotTextForSpeechDisplay,
  synthesizeWithPiper,
  handleChatRequest,
  handleTtsRequest,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), camera=(), microphone=(), interest-cohort=()'
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

  app.use(express.json({ limit: '16kb' }));

  app.use(
    '/bosp-chatbot',
    express.static(path.resolve(__dirname, '..', 'public', 'bosp-chatbot'))
  );

  app.post('/api/chat', async (req, res) => {
    const maskedIp = anonymizeClientIp(
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'anonymous'
    );
    // Strip proxy IP headers immediately after hashing so downstream handlers never see raw IPs.
    delete req.headers['x-forwarded-for'];
    delete req.headers['cf-connecting-ip'];
    delete req.headers['x-real-ip'];
    const result = await handleChatRequest(req.body, maskedIp);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/tts', async (req, res) => {
    const maskedIp = anonymizeClientIp(
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'anonymous'
    );
    delete req.headers['x-forwarded-for'];
    delete req.headers['cf-connecting-ip'];
    delete req.headers['x-real-ip'];
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
