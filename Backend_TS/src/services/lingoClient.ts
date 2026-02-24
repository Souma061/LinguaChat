/**
 * Custom Lingo.dev translation client using Node's native https module.
 *
 * Node.js v24's `fetch` (undici) and `node-fetch` both hang/drop connections
 * to Cloudflare-proxied APIs. The native `https` module works reliably.
 * This module provides the same translation interface the app needs
 * without depending on the SDK's internal fetch-based HTTP calls.
 */
import https from 'node:https';

const API_URL = 'https://engine.lingo.dev';

// Persistent HTTPS agent to reuse connections
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 5,
  timeout: 30_000,
});

let _apiKey: string | null = null;

/**
 * Call this once after dotenv loads to set the API key.
 */
export const initLingoClient = (apiKey: string) => {
  _apiKey = apiKey;
  console.log('[lingo-client] ✅ Initialized with API key');
};

/**
 * Make a POST request to the Lingo.dev /i18n endpoint using native https.
 */
const postI18n = (body: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!_apiKey) {
      reject(new Error('Lingo API key not initialized'));
      return;
    }

    const data = JSON.stringify(body);

    const req = https.request(
      `${API_URL}/i18n`,
      {
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${_apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 30_000,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseBody));
            } catch {
              reject(new Error(`Invalid JSON response: ${responseBody.slice(0, 200)}`));
            }
          } else if (res.statusCode && res.statusCode >= 500) {
            reject(new Error(`Server error (${res.statusCode}): ${responseBody.slice(0, 200)}`));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseBody.slice(0, 200)}`));
          }
        });
      },
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });

    req.write(data);
    req.end();
  });
};

/**
 * Translate text to a single target locale.
 */
export const localizeText = async (
  text: string,
  sourceLocale: string | null,
  targetLocale: string,
  fast = true,
): Promise<string> => {
  const result = await postI18n({
    params: { workflowId: `wf-${Date.now()}`, fast },
    locale: { source: sourceLocale ?? 'auto', target: targetLocale },
    data: { text },
  });
  return result?.data?.text || text;
};

/**
 * Translate text to multiple target locales sequentially (one API call each).
 * Returns an array of translated strings in the same order as targetLocales.
 */
export const batchLocalizeText = async (
  text: string,
  sourceLocale: string | null,
  targetLocales: string[],
  fast = true,
): Promise<string[]> => {
  const results: string[] = [];
  for (const targetLocale of targetLocales) {
    const translated = await localizeText(text, sourceLocale, targetLocale, fast);
    results.push(translated);
  }
  return results;
};
