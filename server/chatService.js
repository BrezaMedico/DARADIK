import { GEMINI_MODEL, VALID_EMOTIONS, getAiClient } from './config.js';
import {
  checkRateLimit,
  cleanBotTextForSpeechDisplay,
  sanitizeUserInput,
} from './security.js';
import {
  FINAL_SYSTEM_PROMPT,
  getLocalKnowledgeReply,
  getActionButtonsForQuery,
} from './knowledgeBase.js';

export async function handleChatRequest(body = {}, clientIp = 'anonymous') {
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
  void previousInteractionId;

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
        const role = item?.role === 'bot' ? 'Bos' : 'Pengguna';
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
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
  ];

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
                'marah',
                'sedih',
                'kaget',
              ],
            },
            tombol: {
              type: 'array',
              description:
                'Tombol aksi cepat navigasi ke halaman fitur website DARADIK jika relevan (maksimal 3 tombol).',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  target: {
                    type: 'string',
                    enum: [
                      'lapor-anonim',
                      'pantau-tiket',
                      'cek-iuran-wa',
                      'kamus-bosp',
                      'cari-sekolah',
                      'profil-sekolah',
                      'beranda',
                    ],
                  },
                },
                required: ['label', 'target'],
              },
            },
          },
          required: ['teks', 'emosi'],
        },
        temperature: 0.7,
        maxOutputTokens: 500,
      };

      const response = await Promise.race([
        aiClient.models.generateContent({
          model: modelName,
          contents: contextualInput,
          config: genConfig,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model timeout')), 12_000)
        ),
      ]);

      rawOutput = (response?.text || '').trim();
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

        let tombolList =
          Array.isArray(parsed.tombol) && parsed.tombol.length > 0
            ? parsed.tombol.slice(0, 3)
            : getActionButtonsForQuery(message, cleanTeks);

        return {
          status: 200,
          payload: {
            teks: cleanTeks,
            emosi: cleanEmosi,
            tombol: tombolList,
          },
        };
      }
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || '';
      console.warn(`[BOSP-Chatbot] Model ${modelName} gagal:`, err?.status || errMsg);
      // Jika kuota habis atau error rate limit, langsung pakai local fallback tanpa menunda pengguna
      if (err?.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        break;
      }
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
      tombol: fallbackReply.tombol || getActionButtonsForQuery(message, fallbackReply.teks),
    },
  };
}
