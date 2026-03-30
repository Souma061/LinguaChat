/**
 * Translation service using a custom Lingo.dev client (native https).
 *
 * The Lingo.dev SDK uses `fetch()` internally, which is broken in Node.js v24
 * when connecting to Cloudflare-proxied APIs (TypeError: terminated).
 * We use our own client that calls the same /i18n API via Node's `https` module.
 */
import * as lingoClient from './lingoClient.ts';

// ── Lazy init ──
let _initialized = false;

const initClient = () => {
  if (_initialized) return;
  _initialized = true;

  const apiKey = process.env.LINGO_API_KEY;
  if (apiKey) {
    lingoClient.initLingoClient(apiKey);
    console.log('[translation] ✅ Translation service initialized');
  } else {
    console.error('[translation] ❌ LINGO_API_KEY not found — translations disabled');
  }
};

// ── Locale mapping ──
const localeMap: Record<string, string> = {
  en: 'en',
  hi: 'hi-IN',
  bn: 'bn-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
};

const toLocale = (code: string, fallback: string | null = null): string | null => {
  if (!code || code === 'auto') return fallback;
  return localeMap[code] ?? code;
};

// ── Translation cache ──
interface CacheEntry {
  value: string;
  expiresAt: number;
}
const translationCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 1000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const cacheTranslation = (text: string, sourceLocale: string | null, targetLocale: string, translated: string) => {
  const cacheKey = `${text}:${sourceLocale ?? 'auto'}:${targetLocale}`;
  translationCache.set(cacheKey, { value: translated, expiresAt: Date.now() + CACHE_TTL_MS });
  if (translationCache.size > MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
};

const getCached = (text: string, sourceLocale: string | null, targetLocale: string): string | null => {
  const cacheKey = `${text}:${sourceLocale ?? 'auto'}:${targetLocale}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    if (Date.now() < cached.expiresAt) return cached.value;
    translationCache.delete(cacheKey);
  }
  return null;
};

// ── Retry configuration ──
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (err: unknown): boolean => {
  const msg = (err as Error)?.message ?? '';
  if (msg.includes('terminated') || msg.includes('timed out') || msg.includes('ECONNRESET')) return true;
  const cause = (err as any)?.cause;
  if (cause?.code === 'UND_ERR_SOCKET' || cause?.code === 'ECONNRESET' || cause?.code === 'ETIMEDOUT') return true;
  return false;
};

/**
 * Translate `text` from `sourceLang` into every language in `targetLangs`.
 * Returns a Map<langCode, translatedText>.
 *
 * Translations run sequentially to avoid overwhelming the API.
 * Each call uses Node's native https module.
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLangs: string[],
  onChunk?: (lang: string, translated: string) => void
): Promise<Map<string, string>> => {
  initClient();
  const translations = new Map<string, string>();

  const sourceLocale = toLocale(sourceLang, null);
  console.log(`[translation] sourceLocale resolved: "${sourceLang}" → ${sourceLocale ?? 'null (auto-detect)'}`);

  for (const lang of targetLangs) {
    const targetLocale = toLocale(lang, null) ?? lang;
    if (targetLocale === sourceLocale) continue;

    // Check cache
    const cached = getCached(text, sourceLocale, targetLocale);
    if (cached) {
      translations.set(lang, cached);
      if (onChunk) onChunk(lang, cached);
      console.log(`[translation] ✅ ${lang} — cache hit`);
      continue;
    }

    // Translate with retry
    let lastError: unknown;
    let success = false;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const callId = Math.random().toString(36).slice(2, 7);
        console.time(`[translation] ${lang}#${callId}`);
        const translated = await lingoClient.localizeText(text, sourceLocale, targetLocale, true);
        console.timeEnd(`[translation] ${lang}#${callId}`);

        translations.set(lang, translated);
        cacheTranslation(text, sourceLocale, targetLocale, translated);
        if (onChunk) onChunk(lang, translated);
        success = true;
        break;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES && isRetryableError(err)) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[translation] ⚠️  ${lang} attempt ${attempt + 1} failed (retrying in ${delay}ms):`, (err as Error).message);
          await sleep(delay);
        }
      }
    }
    if (!success) {
      console.error(`[translation] ❌ Failed ${lang} after ${MAX_RETRIES} retries:`, (lastError as Error).message);
    }
  }

  return translations;
};

/**
 * Translate a single text from sourceLang to targetLang.
 * Used for on-the-fly translation of room history.
 */
export const translateSingle = async (
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> => {
  initClient();

  const sourceLocale = toLocale(sourceLang, null);
  const targetLocale = toLocale(targetLang, null) ?? targetLang;

  if (!targetLocale || targetLocale === sourceLocale) return text;

  const cached = getCached(text, sourceLocale, targetLocale);
  if (cached) return cached;

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const translated = await lingoClient.localizeText(text, sourceLocale, targetLocale, true);
      cacheTranslation(text, sourceLocale, targetLocale, translated);
      return translated;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[translation] ⚠️  ${targetLocale} attempt ${attempt + 1} failed (retrying):`, (err as Error).message);
        await sleep(delay);
      }
    }
  }

  console.error(`[translation] Single translate failed:`, (lastError as Error).message);
  return text;
};
