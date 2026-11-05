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

function bospChatbotMiddlewarePlugin(): Plugin {
  const attachMiddleware = (middlewares: any) => {
    middlewares.use(async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') return next();
      const url = (req.url || '').split('?')[0];
      if (url !== '/api/chat' && url !== '/api/tts') return next();

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const body = rawBody ? JSON.parse(rawBody) : {};
        const clientIp = req.socket?.remoteAddress || '127.0.0.1';

        const serverMod = await getServerModule();

        if (url === '/api/chat') {
          const result = await serverMod.handleChatRequest(body, clientIp);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(result.payload));
          return;
        }

        if (url === '/api/tts') {
          const result = await serverMod.handleTtsRequest(body, clientIp);
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
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            teks: 'Halo! Aku siap bantu jelaskan aturan dana BOSP tahun dua ribu dua puluh enam atau cara pakai website ini.',
            emosi: 'senang',
          })
        );
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
});
