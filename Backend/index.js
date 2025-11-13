import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
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

app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

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
    const members = roomMembers(data.room);
    if (!members.length) {
      return;
    }

    const translationCache = new Map();
    const sourceLocale = toLocale(data.sourceLang) ?? null;

    const translateFor = (lang) => {
      if (translationCache.has(lang)) {
        return translationCache.get(lang);
      }

      const job = translateText(data.message, sourceLocale, lang);
      translationCache.set(lang, job);
      return job;
    };

    const deliveries = await Promise.all(
      members.map(async (member) => {
        const result = await translateFor(member.lang);

        if (result.error) {
          io.to(member.id).emit(
            'translation_error',
            `Translation unavailable for ${result.targetLocale}. Showing original message.`
          );
        }

        return {
          id: member.id,
          lang: member.lang,
          payload: {
            author: data.author,
            message: result.text,
            time: data.time,
          },
        };
      })
    );

    for (const delivery of deliveries) {
      io.to(delivery.id).emit('receive_message', delivery.payload);
    }

    const historyEntry = {
      author: data.author,
      original: data.message,
      time: data.time,
      sourceLocale,
      translations: {},
    };

    deliveries.forEach((delivery) => {
      historyEntry.translations[delivery.lang] = delivery.payload.message;
    });

    const history = messageHistory.get(data.room) ?? [];
    history.push(historyEntry);
    if (history.length > HISTORY_LIMIT) {
      history.shift();
    }
    messageHistory.set(data.room, history);
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
