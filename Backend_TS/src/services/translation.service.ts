import { LingoDotDevEngine } from "lingo.dev/sdk";

// ── Lazy-initialized SDK ──
// With ESM, all imports are resolved before any module code runs, so
// `process.env.LINGO_API_KEY` is undefined at import-time.
// We create the engine on first use, by which time dotenv.config() will
// have executed in server.ts.
let _lingo: LingoDotDevEngine | null = null;
let _lingoInitAttempted = false;

const getLingo = (): LingoDotDevEngine | null => {
  if (!_lingoInitAttempted) {
    _lingoInitAttempted = true;

    const apiKey = process.env.LINGO_API_KEY;
    if (apiKey) {
      _lingo = new LingoDotDevEngine({
        apiKey,
        apiUrl: process.env.LINGO_API_URL ?? 'https://engine.lingo.dev',
      });
      console.log('[translation] ✅ Lingo SDK initialized successfully');
    } else {
      console.error('[translation] ❌ LINGO_API_KEY not found in environment — translations disabled');
    }
  }
  return _lingo;
};

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

const getCachedOrTranslate = async (
  text: string,
  sourceLocale: string | null,
  targetLocale: string,
): Promise<string> => {
  const lingo = getLingo();
  if (!lingo) return text;

  const cacheKey = `${text}:${sourceLocale ?? 'auto'}:${targetLocale}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    if (Date.now() < cached.expiresAt) return cached.value;
    translationCache.delete(cacheKey);
  }

  console.time(`[translation-api] ${targetLocale}`);
  const translated = await lingo.localizeText(text, {
    sourceLocale,
    targetLocale,
    fast: true,
  });
  console.timeEnd(`[translation-api] ${targetLocale}`);

  const result = translated || text;

  // Evict oldest entry if cache is full
  translationCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  if (translationCache.size > MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }

  return result;
};

/**
 * Translate `text` from `sourceLang` into every language in `targetLangs`.
 * Returns a Map<langCode, translatedText>.
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLangs: string[],
  onChunk?: (lang: string, translated: string) => void
): Promise<Map<string, string>> => {
  const translations = new Map<string, string>();
  const lingo = getLingo();

  if (!lingo) {
    console.warn('[translation] Lingo SDK not initialized — returning empty translations');
    return translations;
  }

  // sourceLocale: null tells Lingo to auto-detect the language
  const sourceLocale = toLocale(sourceLang, null);
  console.log(`[translation] sourceLocale resolved: "${sourceLang}" → ${sourceLocale ?? 'null (auto-detect)'}`);

  const promises = targetLangs.map(async (lang) => {
    const targetLocale = toLocale(lang, null) ?? lang;
    if (targetLocale === sourceLocale) {
      return;
    }

    try {
      const translated = await getCachedOrTranslate(text, sourceLocale, targetLocale);
      if (translated) {
        translations.set(lang, translated);
        if (onChunk) {
          onChunk(lang, translated);
        }
      }
    } catch (error) {
      console.error(`[translation] Error translating to ${lang} (${targetLocale}):`, error);
    }
  });

  await Promise.all(promises);
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
  const lingo = getLingo();
  if (!lingo) return text;

  const sourceLocale = toLocale(sourceLang, null);
  const targetLocale = toLocale(targetLang, null) ?? targetLang;

  if (!targetLocale || targetLocale === sourceLocale) {
    return text;
  }

  try {
    return await getCachedOrTranslate(text, sourceLocale, targetLocale);
  } catch (error) {
    console.error(`[translation] Single translate error:`, error);
    return text;
  }
};
