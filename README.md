# 🌐 LinguaChat

### _Break language barriers — chat across languages in real time._

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?logo=mongodb&logoColor=white)
![Lingo.dev](https://img.shields.io/badge/Lingo.dev-AI%20Translation-7c3aed)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46e3b7?logo=render&logoColor=white)

---

## 🔗 Live Demo

| Service  | URL                                                                                  |
| -------- | ------------------------------------------------------------------------------------ |
| Frontend | **[lingua-chat.vercel.app](https://lingua-chat.vercel.app)**                         |
| Backend  | **[linguachat-frmz.onrender.com](https://linguachat-frmz.onrender.com/healthcheck)** |

> Create an account, join or create a room, and start chatting — messages are translated automatically for every participant.

---

## 🌍 Overview

**LinguaChat** is a full-stack, real-time multilingual chat application. Users speaking different languages can join the same room and communicate effortlessly — every message is automatically translated into each participant's preferred language using the **Lingo.dev AI** translation engine.

Built with a modern TypeScript stack: **React 19 + Vite** on the frontend and **Node.js + Express + Socket.IO** on the backend, backed by **MongoDB Atlas** for persistent storage.

---

## ✨ Features

### 💬 Core Chat

- **Real-time messaging** via Socket.IO with instant delivery
- **Automatic translation** to 7 languages (English, Hindi, Bengali, Spanish, French, German, Japanese)
- **Two-phase message delivery** — original text appears instantly, translations arrive asynchronously
- **Translation caching** — repeated phrases are served instantly from an in-memory cache

### � Room System

- **Create & join rooms** — public rooms with admin controls
- **Global / Native mode** — admins can toggle between translated (Global) and untranslated (Native) modes per room
- **Online presence** — see who's in the room with live user lists and language tags
- **Room history** — last 50 messages loaded on join with on-the-fly translation for missing languages

### 💅 Rich Chat Experience

- **Emoji picker** — inline emoji selection in the message composer
- **Message reactions** — react to messages with emojis (toggle on/off)
- **Reply threads** — reply to specific messages with a preview bar and scroll-to-message navigation
- **Typing indicators** — see when others are composing a message
- **Date separators** — messages grouped by Today / Yesterday / date labels
- **Auto-resize composer** — textarea grows with input, supports Shift+Enter for newlines

### 🔐 Authentication & Security

- **JWT-based auth** with access + refresh tokens
- **Session management** — view active sessions, logout individual or all sessions
- **Rate limiting** — per-route and per-socket rate limits to prevent abuse
- **Input validation** with Zod schemas
- **Socket authentication middleware** — only authenticated users can connect

### 🌐 Deployment

- **Frontend** deployed on **Vercel** (SPA with client-side routing)
- **Backend** deployed on **Render** (Node.js Web Service)
- **Database** on **MongoDB Atlas** (cloud-hosted)

---

## 🧰 Tech Stack

| Layer        | Technologies                                                   |
| ------------ | -------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, Socket.IO Client |
| **Backend**  | Node.js, Express 5, TypeScript, Socket.IO 4, Mongoose          |
| **AI**       | Lingo.dev SDK — AI-powered translation engine                  |
| **Database** | MongoDB Atlas with Mongoose ODM                                |
| **Auth**     | JWT (access + refresh tokens), bcrypt password hashing         |
| **Testing**  | Jest, Supertest, MongoDB Memory Server                         |
| **Deploy**   | Vercel (frontend), Render (backend)                            |

---

## 📁 Project Structure

```
LinguaChat/
│
├── Backend_TS/                    # Node.js + Express + Socket.IO server
│   ├── src/
│   │   ├── server.ts              # Entry point — HTTP server + Socket.IO setup
│   │   ├── app.ts                 # Express app — CORS, rate limiting, routes
│   │   ├── config/
│   │   │   └── db.ts              # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts # Register, login, token refresh, sessions
│   │   │   └── roomControllers.ts # Room CRUD operations
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # JWT authentication for REST routes
│   │   │   └── socketAuth.middleware.ts  # JWT authentication for sockets
│   │   ├── models/
│   │   │   ├── user.model.ts      # User schema (username, email, password, role)
│   │   │   ├── message.model.ts   # Message schema (translations, reactions, replies)
│   │   │   ├── room.model.ts      # Room schema (owner, admins, mode)
│   │   │   └── userSession.model.ts  # Session tracking
│   │   ├── routes/
│   │   │   ├── auth.routes.ts     # /api/auth/* endpoints
│   │   │   └── room.routes.ts     # /api/rooms/* endpoints
│   │   ├── services/
│   │   │   ├── auth.services.ts   # Auth business logic
│   │   │   ├── chat.service.ts    # Message save, translate, history
│   │   │   ├── rom.service.ts     # Room business logic
│   │   │   └── translation.service.ts  # Lingo.dev SDK integration + cache
│   │   ├── sockets/
│   │   │   └── chat.socket.ts     # All real-time event handlers
│   │   └── types/
│   │       └── socket.d.ts        # Socket.IO type definitions
│   ├── tests/                     # Jest test suites
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend_TS/                   # React 19 + Vite SPA
│   ├── src/
│   │   ├── main.tsx               # App entry point
│   │   ├── App.tsx                # Router setup (login, register, home, room)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # Auth state + token management
│   │   │   └── chatContext.tsx     # Socket.IO connection management
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx   # Chat message with reactions & replies
│   │   │   ├── EmojiPicker.tsx     # Emoji selection component
│   │   │   └── ProtectedRoute.tsx  # Auth guard for protected pages
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── Dashboard/
│   │   │   │   └── HomePage.tsx    # Room list, create/join rooms
│   │   │   └── Chat/
│   │   │       └── RoomPage.tsx    # Full chat interface
│   │   ├── services/
│   │   │   └── api.ts             # Axios instance with auth interceptor
│   │   └── types/
│   │       └── socket.ts          # Shared socket event types
│   ├── vercel.json                # SPA rewrite rules for Vercel
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🛠️ Local Development

### Prerequisites

- **Node.js** 18+ (recommended: 22)
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **Lingo.dev API Key** — get one at [lingo.dev](https://lingo.dev)

---

### 🐳 Option A — Run with Docker (Recommended)

The fastest way to get everything running. Only requires **Docker** installed.

#### 1. Clone the repository

```bash
git clone https://github.com/Souma061/LinguaChat.git
cd LinguaChat
```

#### 2. Create the backend `.env` file

```bash
cp Backend_TS/.env.example Backend_TS/.env
```

Edit `Backend_TS/.env` and fill in your credentials:

```env
LINGO_API_KEY=your_lingo_api_key
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=http://localhost
```

> **Need API keys?**
>
> - Lingo.dev — sign up at [lingo.dev](https://lingo.dev) (free tier available)
> - MongoDB Atlas — create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
> - Cloudinary — sign up at [cloudinary.com](https://cloudinary.com) (free tier)

#### 3. Build and run

```bash
docker compose up --build -d
```

#### 4. Open in browser

| Service  | URL                                                |
| -------- | -------------------------------------------------- |
| Frontend | **[http://localhost](http://localhost)**           |
| Backend  | **[http://localhost:5000](http://localhost:5000)** |

#### Stop / restart

```bash
docker compose down       # stop
docker compose up -d      # restart (without rebuilding)
docker compose up --build -d  # restart with rebuild
```

---

### 🖥️ Option B — Run without Docker

#### Prerequisites

- **Node.js** 18+ (recommended: 22)
- **npm** (comes with Node.js)

#### 1. Clone the repository

```bash
git clone https://github.com/Souma061/LinguaChat.git
cd LinguaChat
```

#### 2. Backend Setup

```bash
cd Backend_TS
npm install
```

Create a `.env` file:

```env
LINGO_API_KEY=your_lingo_api_key
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

Start the development server:

```bash
npm run dev
```

> Backend runs on `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd Frontend_TS
npm install
```

Create a `.env` file:

```env
VITE_BACKEND_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

> Frontend runs on `http://localhost:5173`

---

## 🧪 Testing

```bash
cd Backend_TS
npm test
```

Tests use **Jest** with **MongoDB Memory Server** for isolated database testing and **Supertest** for HTTP endpoint validation.

---

## 🗄️ Database Architecture

### Models

| Model           | Purpose                                             |
| --------------- | --------------------------------------------------- |
| **User**        | Username, email, hashed password, role              |
| **Room**        | Name, owner, admins, members, mode (Global/Native)  |
| **Message**     | Original text, translations map, reactions, replies |
| **UserSession** | JWT session tracking for multi-device logout        |

### Message Schema

```typescript
{
  room: string;           // Room identifier (indexed)
  author: string;         // Sender's username
  original: string;       // Original untranslated message
  translations: Map;      // { langCode: translatedText }
  sourceLocale: string;   // Detected source language
  msgId: string;          // Unique message identifier
  reactions: Map;         // { emoji: [username1, username2] }
  replyTo?: {             // Optional reply reference
    msgId: string;
    author: string;
    message: string;
  };
  createdAt: Date;        // Auto-managed timestamp
}
```

### Indexes

- `room` — fast room filtering
- `{ room, createdAt }` — compound index for efficient history retrieval
- `msgId` — unique constraint for deduplication

---

## 🔄 Translation Architecture

LinguaChat uses a **two-phase message delivery** pattern for optimal UX:

1. **Phase 1 — Instant delivery**: Message is saved to MongoDB and broadcast to all room members immediately with the original text.
2. **Phase 2 — Async translation**: Translations are generated in the background via Lingo.dev SDK, then pushed to all clients via a `translations_ready` socket event.

This ensures messages appear instantly while translations arrive within seconds.

### Supported Languages

| Code | Language |
| ---- | -------- |
| `en` | English  |
| `hi` | Hindi    |
| `bn` | Bengali  |
| `es` | Spanish  |
| `fr` | French   |
| `de` | German   |
| `ja` | Japanese |

---

## ☁️ Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `Backend_TS`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `LINGO_API_KEY`, `CORS_ORIGINS`)

### Frontend → Vercel

1. Import the repository on [Vercel](https://vercel.com)
2. Set **Root Directory** to `Frontend_TS`
3. Add environment variables:
   - `VITE_BACKEND_URL` = `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://your-backend.onrender.com`
4. Deploy — Vercel auto-detects Vite and builds accordingly

> **Important**: Add your Vercel domain to `CORS_ORIGINS` in the Render environment variables after deployment.

---

## 🔒 API Endpoints

### Authentication

| Method | Endpoint                   | Description            | Auth |
| ------ | -------------------------- | ---------------------- | ---- |
| POST   | `/api/auth/register`       | Create a new account   | ❌   |
| POST   | `/api/auth/login`          | Login & receive tokens | ❌   |
| POST   | `/api/auth/refresh-token`  | Refresh access token   | ❌   |
| POST   | `/api/auth/logout-session` | Logout current session | ✅   |
| POST   | `/api/auth/logout-all`     | Logout all sessions    | ✅   |
| GET    | `/api/auth/sessions`       | List active sessions   | ✅   |
| GET    | `/api/auth/profile`        | Get user profile       | ✅   |

### Rooms

| Method | Endpoint     | Description       | Auth |
| ------ | ------------ | ----------------- | ---- |
| GET    | `/api/rooms` | List public rooms | ✅   |
| POST   | `/api/rooms` | Create a new room | ✅   |

### Socket Events

| Event                | Direction       | Description                            |
| -------------------- | --------------- | -------------------------------------- |
| `join_Room`          | Client → Server | Join a chat room                       |
| `send_message`       | Client → Server | Send a message to the room             |
| `set_language`       | Client → Server | Change preferred language              |
| `create_room`        | Client → Server | Create a new room                      |
| `update_room_mode`   | Client → Server | Toggle Global/Native mode (admin only) |
| `add_reaction`       | Client → Server | React to a message with an emoji       |
| `typing_start`       | Client → Server | Notify typing started                  |
| `typing_stop`        | Client → Server | Notify typing stopped                  |
| `receive_message`    | Server → Client | New message received                   |
| `translations_ready` | Server → Client | Translations available for a message   |
| `room_history`       | Server → Client | Room message history on join           |
| `room_users`         | Server → Client | Updated list of online users           |
| `room_info`          | Server → Client | Room mode and admin status             |
| `reaction_update`    | Server → Client | Updated reactions for a message        |
| `user_typing`        | Server → Client | Typing indicator from another user     |
| `error_event`        | Server → Client | Error notification                     |

---

## 📸 Screenshots

| Landing Screen                             | Demo Room                                      | Cross-Language Chat                                       |
| ------------------------------------------ | ---------------------------------------------- | --------------------------------------------------------- |
| ![Landing](assets/screenshots/Landing.jpg) | ![Demo Room](assets/screenshots/Demo_Room.jpg) | ![Multilingual Chat](assets/screenshots/multilingual.jpg) |

---

## 🎥 Video Demo

[![Watch on YouTube](https://img.shields.io/badge/YouTube-Watch%20Demo-red?logo=youtube&logoColor=white)](https://youtu.be/RAg2pKxgBnU)

---

## 📄 License

This project is open source under the [ISC License](https://opensource.org/licenses/ISC).

---

_Built with ❤️ for the Lingo.dev Hackathon — making global communication effortless._
