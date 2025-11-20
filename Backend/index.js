import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import http from 'http';
import { LingoDotDevEngine } from 'lingo.dev/sdk';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(cors());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

const reactDistPath = path.join(__dirname, '../Frontend_React/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(reactDistPath)) {
  app.use(express.static(reactDistPath));
  app.get('/*', (_, res) => {
    res.sendFile(path.join(reactDistPath, 'index.html'));
  });
}

const localeMap = {
  en: 'en',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  bn: 'bn-IN',
};

const toLocale = (code, fallback = null) => {
  if (!code || code === 'auto') {
    return fallback;
  }
  return localeMap[code] ?? code ?? fallback;
};

export const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const lingo = process.env.LINGO_API_KEY
  ? new LingoDotDevEngine({
      apiKey: process.env.LINGO_API_KEY,
      apiUrl: process.env.LINGO_API_URL ?? 'https://engine.lingo.dev',
    })
  : null;

const rooms = new Map();
const messageHistory = new Map();
const HISTORY_LIMIT = 50;

const roomMembers = (room) =>
  Array.from(io.sockets.adapter.rooms.get(room) ?? []).map((id) => ({
    id,
    username: rooms.get(id)?.username ?? 'Anonymous',
    lang: rooms.get(id)?.lang ?? 'en',
  }));

const translateText = async (text, sourceLocale, targetLang) => {
  if (!lingo) {
    return { text, error: null, targetLocale: null };
  }

  const targetLocale = toLocale(targetLang, 'en');
  if (!targetLocale || targetLocale === sourceLocale) {
    return { text, error: null, targetLocale };
  }

  try {
    const output =
      (await lingo.localizeText(text, {
        sourceLocale,
        targetLocale,
        fast: true,
      })) || text;
    return { text: output, error: null, targetLocale };
  } catch (error) {
    console.error('Lingo.dev translation failed:', error);
    return { text, error, targetLocale };
  }
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async ({ room, lang }) => {
    socket.join(room);
    rooms.set(socket.id, {
      room,
      lang: lang ?? 'en',
      username: socket.data.username,
    });

    const occupants = roomMembers(room);
    socket.emit('room_users', occupants);
    socket.to(room).emit('room_users', occupants);

    const history = messageHistory.get(room) ?? [];
    if (history.length) {
      const targetLang = lang ?? 'en';
      const translatedHistory = [];

      for (const entry of history) {
        if (!entry.translations[targetLang]) {
          const result = await translateText(
            entry.original,
            entry.sourceLocale,
            targetLang
          );

          entry.translations[targetLang] = result.text;

          if (result.error) {
            socket.emit(
              'translation_error',
              `Translation unavailable for ${result.targetLocale}. Showing original message.`
            );
          }
        }

        translatedHistory.push({
          author: entry.author,
          message: entry.translations[targetLang] ?? entry.original,
          time: entry.time,
        });
      }

      socket.emit('room_history', translatedHistory);
    }
  });

  socket.on('set_username', ({ username }) => {
    socket.data.username = username;
  });

  socket.on('set_language', ({ room, lang }) => {
    const meta = rooms.get(socket.id);
    if (meta) {
      meta.lang = lang;
      rooms.set(socket.id, meta);
      const occupants = roomMembers(room);
      io.to(room).emit('room_users', occupants);
    }
  });

  socket.on('disconnect', () => {
    const meta = rooms.get(socket.id);
    if (meta) {
      rooms.delete(socket.id);
      const occupants = roomMembers(meta.room);
      socket.to(meta.room).emit('room_users', occupants);
    }
  });

  socket.on('send_message', async (data) => {
    data.sourceLang = data.sourceLang || 'auto';
    const sourceLocale = toLocale(data.sourceLang) ?? null;
    const room = data.room;
    const msgId = data.msgId || `${data.author}-${Date.now()}`;

    const roomSockets = io.sockets.adapter.rooms.get(room);
    if (!roomSockets) return;


    const history = messageHistory.get(room) || [];
    history.push({
      author: data.author,
      original: data.message,
      translations: {},
      time: data.time,
      sourceLocale: sourceLocale,
      msgId: msgId,
    });
    if (history.length > HISTORY_LIMIT) history.shift();
    messageHistory.set(room, history);


    for (const recipientId of roomSockets) {
      const recipientLang = rooms.get(recipientId)?.lang || 'en';
      const targetLocale = toLocale(recipientLang);

      let translatedMessage = data.message;

      if (lingo && targetLocale) {
        try {
          translatedMessage =
            (await lingo.localizeText(data.message, {
              sourceLocale: null,
              targetLocale,
              fast: true,
            })) || data.message;
        } catch (err) {
          console.error('Lingo.dev translation failed:', err);
          io.to(recipientId).emit(
            'translation_error',
            'Translation unavailable; showing original text.'
          );
        }
      }


      io.to(recipientId).emit('receive_message', {
        author: data.author,
        message: translatedMessage,
        original: data.message,
        time: data.time,
        msgId: msgId,
        lang: data.targetLang || 'en',
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
