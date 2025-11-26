import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import http from 'http';
import { LingoDotDevEngine } from 'lingo.dev/sdk';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { Message } from './models.js';

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
  app.use((_, res) => {
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

const rooms = new Map(); // Keep for active sessions only (lightweight)
const translationCache = new Map(); // Cache translations

const roomMembers = (room) =>
  Array.from(io.sockets.adapter.rooms.get(room) ?? []).map((id) => ({
    id,
    username: rooms.get(id)?.username ?? 'Anonymous',
    lang: rooms.get(id)?.lang ?? 'en',
    status: 'online', // Add online status
  }));

const translateText = async (text, sourceLocale, targetLang) => {
  if (!lingo) {
    return { text, error: null, targetLocale: null };
  }

  const targetLocale = toLocale(targetLang, 'en');
  if (!targetLocale || targetLocale === sourceLocale) {
    return { text, error: null, targetLocale };
  }

  // Check cache first
  const cacheKey = `${text}:${targetLocale}`;
  if (translationCache.has(cacheKey)) {
    return { text: translationCache.get(cacheKey), error: null, targetLocale };
  }

  try {
    const output =
      (await lingo.localizeText(text, {
        sourceLocale,
        targetLocale,
        fast: true,
      })) || text;

    translationCache.set(cacheKey, output);
    if (translationCache.size > 1000) {
      // Limit cache size
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }

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
      status: 'online', // Add online status
    });

    const occupants = roomMembers(room);
    socket.emit('room_users', occupants);
    socket.to(room).emit('room_users', occupants);

    try {
      // Fetch last 50 messages from MongoDB
      const history = await Message.find({ room })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      if (history.length) {
        const targetLang = lang ?? 'en';

        // PARALLELIZED: Translate all missing translations at once
        const translationPromises = history.map(async (entry) => {
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
                `Translation unavailable. Showing original message.`
              );
            }
          }

          return {
            author: entry.author,
            message: entry.translations[targetLang] ?? entry.original,
            msgId: entry.msgId,
            time: entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          };
        });

        const translatedHistory = await Promise.all(translationPromises);
        socket.emit('room_history', translatedHistory.reverse());
      }
    } catch (error) {
      console.error('Error loading history:', error);
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
    if (!roomSockets) {
      console.warn(`Room ${room} not found`);
      socket.emit('message_status', {
        msgId,
        status: 'failed',
        error: 'Room not found',
      });
      return;
    }

    try {
      // Save to MongoDB (don't save time as it's a formatted string, use createdAt instead)
      const savedMessage = await Message.create({
        room,
        author: data.author,
        original: data.message,
        translations: {},
        sourceLocale,
        msgId,
        replyTo: data.replyTo || null,
      });

      console.log(`Message ${msgId} saved successfully`, savedMessage._id);

      // Emit status confirmation to the sender using socket.id
      socket.emit('message_status', {
        msgId,
        status: 'sent',
      });
    } catch (error) {
      console.error(`Error saving message ${msgId}:`, error.message, error.code);
      // Emit failed status to sender
      socket.emit('message_status', {
        msgId,
        status: 'failed',
        error: error.message || 'Failed to save message',
      });
      return;
    }

    // Group recipients by language for efficient translation
    const recipientsByLang = new Map();
    for (const recipientId of roomSockets) {
      const recipientLang = rooms.get(recipientId)?.lang || 'en';
      const targetLocale = toLocale(recipientLang);
      if (!recipientsByLang.has(targetLocale)) {
        recipientsByLang.set(targetLocale, []);
      }
      recipientsByLang.get(targetLocale).push(recipientId);
    }

    // PARALLELIZED: Translate once per unique language, then emit to all users with that language
    const translationPromises = Array.from(recipientsByLang.entries()).map(
      async ([targetLocale, recipients]) => {
        let translatedMessage = data.message;

        if (lingo && targetLocale) {
          try {
            const result = await translateText(
              data.message,
              sourceLocale,
              targetLocale.split('-')[0]
            );
            translatedMessage = result.text;
          } catch (err) {
            console.error('Translation failed:', err);
            recipients.forEach((recipientId) => {
              io.to(recipientId).emit(
                'translation_error',
                'Translation unavailable; showing original text.'
              );
            });
          }
        }

        return { targetLocale, recipients, translatedMessage };
      }
    );

    const results = await Promise.all(translationPromises);

    // Emit to all recipients with their translated message
    results.forEach(({ recipients, translatedMessage }) => {
      recipients.forEach((recipientId) => {
        io.to(recipientId).emit('receive_message', {
          author: data.author,
          message: translatedMessage,
          original: data.message,
          time: data.time,
          msgId: msgId,
          lang: data.targetLang || 'en',
          replyTo: data.replyTo || null,
        });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;

// Initialize DB and start server
if (process.env.NODE_ENV !== 'test') {
  await connectDB();
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
