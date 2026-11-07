import crypto from 'node:crypto';
import { MAX_INPUT_LENGTH } from './config.js';

const rateLimitStore = new Map();
const EPHEMERAL_IP_SALT = crypto.randomBytes(32).toString('hex');

// Key the HMAC with an in-memory salt and UTC date so raw client IPs are never stored.
export function anonymizeClientIp(rawIp = '') {
  const dayKey = new Date().toISOString().slice(0, 10);
  return crypto
    .createHmac('sha256', `${EPHEMERAL_IP_SALT}:${dayKey}`)
    .update(String(rawIp || 'anonymous'))
    .digest('hex')
    .slice(0, 24);
}

export function checkRateLimit(ip, bucket = 'chat', maxReq = 35, windowMs = 60_000) {
  const now = Date.now();
  const maskedToken = anonymizeClientIp(ip);
  const key = `${bucket}:${maskedToken}`;
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

export function sanitizeUserInput(raw = '') {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}

// Strip markdown symbols and emojis so TTS engines do not read punctuation aloud.
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
