export const detectSourceLanguage = (text) => {
  if (!text || typeof text !== "string") return "auto";

  const patterns = {
    // Script-based detection
    hi: /[\u0900-\u097F]/,       // Hindi (Devanagari)
    bn: /[\u0980-\u09FF]/,       // Bengali script
    ta: /[\u0B80-\u0BFF]/,       // Tamil
    te: /[\u0C00-\u0C7F]/,       // Telugu
    kn: /[\u0C80-\u0CFF]/,       // Kannada
    ml: /[\u0D00-\u0D7F]/,       // Malayalam

    // Latin-based detection (accent clues)
    es: /[ñáéíóúü¡¿]/i,          // Spanish
    fr: /[àâçéèêëîïôûùüÿœæ]/i,   // French
    pt: /[ãõáâçéêíóôú]/i,        // Portuguese
    de: /[äöüß]/i,               // German
  };

  for (const [lang, regex] of Object.entries(patterns)) {
    if (regex.test(text)) return lang;
  }

  return "auto";
};


export const formatTime = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

};

export const generateMessageid = (username) => {
  return `${username}-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
};

export const parseUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    room: (params.get('room') || '').trim(),
    username: (params.get('username') || '').trim(),

  };
};

export const updateUrlParams = (room, username) => {

  const url = new URL(window.location.href);
  url.searchParams.set('room', room);
  url.searchParams.set('username', username);
  window.history.replaceState({}, '', url);
};

export const generateShareLink = (room, username) => {
  return `${window.location.origin}?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
};

export const DEMO_ROOM = 'Demo-Room';
export const DEMO_MESSAGES = [
  {
    author: 'Adam',
    message: 'Hello everyone! Welcome to LinguaChat 👋',
    lang: 'en',
  },
  {
    author: 'Ram',
    message: 'नमस्ते! यह बहुत बढ़िया है 😊',
    lang: 'hi'
  },
  {
    author: 'Christopher',
    message: '¡Hola! ¿Cómo estás? Esto es increíble',
    lang: 'es',
  },
  {
    author: 'Sophie',
    message: "Bonjour! C'est magnifique, non?",
    lang: 'fr'
  },
  {
    author: 'Souma',
    message: 'আমরা সবাই বিভিন্ন ভাষায় কথা বলছি!',
    lang: 'bn',
  },
];

/**
 * Available languages
 */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
];
