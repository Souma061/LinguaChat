import { LingoDotDevEngine } from "lingo.dev/sdk";
import { text } from "node:stream/consumers";

const lingo = process.env.LINGO_API_KEY ? new LingoDotDevEngine({
  apiKey: process.env.LINGO_API_KEY,

}) : null;

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string[]
): Promise<Map<string, string>>  => {
  const translations = new Map<string, string>();

  if (!lingo) {
    throw new Error("Lingo API key is not configured");
  }

  const promises = targetLang.map(async (targetLang) => {
    if(sourceLang === targetLang) {
      return;
    }
    try {
      const translated = await lingo.localizeText(text, {
      sourceLocale: sourceLang,
      targetLocale: targetLang,
      });
      if(translated) {
        translations.set(targetLang, translated);
      }
    } catch (error) {
      console.error(`Error translating to ${targetLang}:`, error);
    }

  })
  await Promise.all(promises);
  return translations;
}
