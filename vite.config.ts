import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

let cachedServerMod: any = null;
let lastMtime = 0;

async function getServerModule() {
  const filePath = path.resolve('./server/server.js');
  const stats = fs.statSync(filePath);
  if (!cachedServerMod || stats.mtimeMs > lastMtime) {
    lastMtime = stats.mtimeMs;
    const fileUrl = `${pathToFileURL(filePath).href}?v=${stats.mtimeMs}`;
    cachedServerMod = await import(fileUrl);
  }
  return cachedServerMod;
}

function readStreamBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof req.body === 'string') return resolve(req.body);
    if (req.body && typeof req.body === 'object') return resolve(JSON.stringify(req.body));
    const chunks: Buffer[] = [];
    req.on('data', (chunk: any) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err: any) => {
      reject(err);
    });
  });
}

function bospChatbotMiddlewarePlugin(): Plugin {
  const attachMiddleware = (middlewares: any) => {
    middlewares.use(async (req: any, res: any, next: any) => {
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), camera=(), microphone=(), interest-cohort=()'
      );

      if (req.method !== 'POST') return next();
      const url = (req.url || '').split('?')[0];
      if (url !== '/api/chat' && url !== '/api/tts') return next();

      try {
        const rawBody = await readStreamBody(req);
        const body = rawBody ? JSON.parse(rawBody) : {};
        const serverMod = await getServerModule();
        const maskedIp = serverMod.anonymizeClientIp
          ? serverMod.anonymizeClientIp(req.socket?.remoteAddress || 'anonymous')
          : 'anonymous';

        if (url === '/api/chat') {
          const result = await serverMod.handleChatRequest(body, maskedIp);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(result.payload));
          return;
        }

        if (url === '/api/tts') {
          const result = await serverMod.handleTtsRequest(body, maskedIp);
          if (result.isAudio && result.wavBuffer) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('X-TTS-Cache', result.cached ? 'HIT' : 'MISS');
            res.end(result.wavBuffer);
            return;
          }
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(result.payload));
          return;
        }
      } catch (err: any) {
        fs.appendFileSync(path.resolve(__dirname, 'server-error.log'), `[${new Date().toISOString()}] ${err?.stack || err}\n`);
        try {
          const serverMod = await getServerModule();
          const fallback = serverMod.handleChatRequest ? await serverMod.handleChatRequest({ message: 'halo' }) : null;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(fallback?.payload || {
            teks: 'Halo! Aku Bos, siap membantu menjawab pertanyaan seputar dana BOSP dan penggunaan website DARADIK.',
            emosi: 'senang',
          }));
        } catch {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              teks: 'Halo! Aku Bos, siap membantu menjawab pertanyaan seputar dana BOSP dan penggunaan website DARADIK.',
              emosi: 'senang',
            })
          );
        }
      }
    });
  };

  return {
    name: 'bosp-chatbot-api-middleware-v2',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

export default defineConfig({
  plugins: [react(), bospChatbotMiddlewarePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
