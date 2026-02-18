# 🏗️ LinguaChat — Architecture & Bug Report

## 📖 What Is This?

**LinguaChat** is a full-stack, real-time multilingual chat application built for the **Lingo.dev Hackathon**. Users speaking different languages can join the same room and communicate effortlessly — every message is automatically translated into each participant's preferred language using the **Lingo.dev AI** translation engine.

**Live Demo:** [lingua-chat.vercel.app](https://lingua-chat.vercel.app)

---

## 🧰 Tech Stack

| Layer        | Technologies                                                    |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, Socket.IO Client |
| **Backend**  | Node.js, Express 5, TypeScript, Socket.IO 4, Mongoose 9        |
| **AI**       | Lingo.dev SDK — AI-powered translation engine                   |
| **Database** | MongoDB Atlas with Mongoose ODM                                 |
| **Auth**     | JWT (access + refresh tokens), bcrypt password hashing          |
| **Validation** | Zod schemas (server-side)                                     |
| **Testing**  | Jest, Supertest, MongoDB Memory Server                          |
| **Deploy**   | Vercel (frontend), Render (backend)                             |

---

## 🏛️ High-Level Architecture

```
┌──────────────────────────┐         ┌──────────────────────────────────┐
│      Frontend (SPA)      │         │        Backend (Node.js)         │
│   React 19 + Vite 7      │◄──────►│   Express 5 + Socket.IO 4        │
│   Tailwind CSS 4          │  REST   │                                  │
│   Socket.IO Client        │◄──────►│   JWT Auth Middleware             │
│                            │ WS     │   Rate Limiting                  │
│   Deployed: Vercel         │        │   Deployed: Render               │
└──────────────────────────┘         └────────────┬─────────────────────┘
                                                  │
                                     ┌────────────▼─────────────────────┐
                                     │        MongoDB Atlas              │
                                     │   Users, Rooms, Messages,         │
                                     │   Sessions                        │
                                     └────────────┬─────────────────────┘
                                                  │
                                     ┌────────────▼─────────────────────┐
                                     │        Lingo.dev SDK              │
                                     │   AI Translation Engine           │
                                     │   (with in-memory cache)          │
                                     └──────────────────────────────────┘
```

---

## 📁 Project Structure

```
LinguaChat/
├── Backend_TS/                     # Node.js + Express + Socket.IO server
│   ├── src/
│   │   ├── server.ts               # Entry point — HTTP server + Socket.IO setup
│   │   ├── app.ts                  # Express app — CORS, rate limiting, routes
│   │   ├── config/
│   │   │   ├── db.ts               # MongoDB connection (Mongoose)
│   │   │   ├── env.ts              # dotenv loader (unused — see bugs)
│   │   │   └── multer.config.ts    # File upload config (dead code — see bugs)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts  # Register, login, token refresh, sessions
│   │   │   ├── roomControllers.ts  # Room CRUD (list, search, mode update, delete)
│   │   │   └── upload.controller.ts# Image upload handler (dead code — see bugs)
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts   # JWT auth for REST routes
│   │   │   └── socketAuth.middleware.ts # JWT auth for WebSocket connections
│   │   ├── models/
│   │   │   ├── user.model.ts       # User schema (username, email, password, role)
│   │   │   ├── room.model.ts       # Room schema (owner, admins, members, mode)
│   │   │   ├── message.model.ts    # Message schema (translations, reactions, replies)
│   │   │   └── userSession.model.ts# Session tracking (hashed refresh tokens, TTL)
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # /api/auth/* endpoints + per-route rate limits
│   │   │   ├── room.routes.ts      # /api/rooms/* endpoints
│   │   │   └── upload.routes.ts    # /api/upload endpoint (never registered — see bugs)
│   │   ├── services/
│   │   │   ├── auth.services.ts    # Auth business logic (register, login, sessions)
│   │   │   ├── chat.service.ts     # Message save, translate, history retrieval
│   │   │   ├── rom.service.ts      # Room business logic (typo — see bugs)
│   │   │   └── translation.service.ts # Lingo.dev SDK integration + in-memory cache
│   │   ├── sockets/
│   │   │   └── chat.socket.ts      # All real-time event handlers + per-socket rate limits
│   │   └── types/
│   │       └── socket.d.ts         # Socket.IO type definitions (backend)
│   ├── tests/                      # Jest test suites
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend_TS/                    # React 19 + Vite SPA
│   ├── src/
│   │   ├── main.tsx                # App entry point (StrictMode + root render)
│   │   ├── App.tsx                 # BrowserRouter + route definitions
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth state, token management, auto-refresh
│   │   │   └── chatContext.tsx      # Socket.IO connection lifecycle management
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx    # Chat message bubble with reactions & replies
│   │   │   ├── EmojiPicker.tsx      # Emoji selection component + quick reactions
│   │   │   └── ProtectedRoute.tsx   # Auth guard (redirects to /login if not authed)
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx    # Login form with validation
│   │   │   │   └── RegisterPage.tsx # Registration form with validation
│   │   │   ├── Dashboard/
│   │   │   │   └── HomePage.tsx     # Room list, create/join/delete/share rooms
│   │   │   └── Chat/
│   │   │       └── RoomPage.tsx     # Full chat interface (messages, typing, reactions)
│   │   ├── services/
│   │   │   └── api.ts              # Axios instance with auth interceptor
│   │   └── types/
│   │       └── socket.ts           # Socket.IO event type definitions (frontend)
│   ├── vercel.json                 # SPA rewrite rules for Vercel deployment
│   ├── vite.config.ts
│   └── package.json
│
├── architecture.md                 # ← You are here
└── README.md
```

---

## 🔄 Core Data Flows

### Authentication Flow

```
Client                          Server                         MongoDB
  │                                │                              │
  │── POST /auth/register ────────►│                              │
  │                                │── Check username unique ────►│
  │                                │◄── Result ──────────────────│
  │                                │── bcrypt.hash(password) ───►│ (CPU)
  │                                │── Create User ──────────────►│
  │                                │── Generate JWT pair          │
  │                                │── bcrypt.hash(refreshToken)─►│ (CPU)
  │                                │── Create UserSession ───────►│
  │◄── { accessToken,             │                              │
  │      refreshToken, user } ────│                              │
  │                                │                              │
  │   (stored in localStorage)     │                              │
```

- **Access token**: JWT, 24h expiry, signed with `JWT_SECRET`
- **Refresh token**: JWT, 7d expiry, signed with `JWT_REFRESH_SECRET`, bcrypt-hashed in DB
- **Auto-refresh**: Frontend runs a 23-hour interval to refresh the access token

### Two-Phase Message Delivery

```
Sender          Socket.IO Server         Lingo.dev API        MongoDB
  │                    │                       │                  │
  │── send_message ───►│                       │                  │
  │                    │── Save (empty         │                  │
  │                    │   translations) ─────────────────────────►│
  │                    │                       │                  │
  │                    │── PHASE 1: Broadcast  │                  │
  │◄── receive_message │   original text to    │                  │
  │   (instant)        │   all room members    │                  │
  │                    │                       │                  │
  │                    │── PHASE 2: Translate ─►│                  │
  │                    │   to all 7 languages   │                  │
  │                    │◄── translations ──────│                  │
  │                    │── Update DB ─────────────────────────────►│
  │                    │                       │                  │
  │◄── translations_   │                       │                  │
  │    ready (async)   │                       │                  │
```

### Room Join Flow

1. Client emits `join_Room` with `{ room, lang }`
2. Server joins the socket to the room via `socket.join(room)`
3. Server fetches room info from DB → emits `room_info` (mode, isAdmin)
4. Server fetches last 50 messages → translates on-the-fly for missing languages → emits `room_history`
5. Server broadcasts updated `room_users` list to all members

---

## 🗄️ Database Models

| Model           | Key Fields                                                    | Indexes                                         |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| **User**        | `username` (unique), `email` (unique), `password`, `role`     | `username`, `email` (unique)                     |
| **Room**        | `name` (unique), `owner`, `admins[]`, `members[]`, `mode`     | `name` (unique)                                  |
| **Message**     | `room`, `author`, `original`, `translations`, `msgId`, `reactions`, `replyTo` | `room`, `{room, createdAt}` (compound), `msgId` (unique) |
| **UserSession** | `userId`, `hashedRefreshToken`, `device`, `ip`, `expiresAt`   | `expiresAt` (TTL auto-delete)                    |

---

## 🔌 Socket Events

| Event                | Direction       | Purpose                                    |
| -------------------- | --------------- | ------------------------------------------ |
| `join_Room`          | Client → Server | Join a chat room                           |
| `send_message`       | Client → Server | Send a message to the room                 |
| `set_language`       | Client → Server | Change preferred display language           |
| `create_room`        | Client → Server | Create a new room                          |
| `update_room_mode`   | Client → Server | Toggle Global/Native mode (admin only)     |
| `add_reaction`       | Client → Server | React to a message with an emoji           |
| `typing_start`       | Client → Server | Notify typing started                      |
| `typing_stop`        | Client → Server | Notify typing stopped                      |
| `receive_message`    | Server → Client | New message received (original text)       |
| `translations_ready` | Server → Client | Translations available for a message       |
| `room_history`       | Server → Client | Last 50 messages on room join              |
| `room_users`         | Server → Client | Updated list of online users               |
| `room_info`          | Server → Client | Room mode and admin status                 |
| `reaction_update`    | Server → Client | Updated reactions for a message            |
| `user_typing`        | Server → Client | Typing indicator from another user         |
| `error_event`        | Server → Client | Error notification                         |

---

## 🔐 Security Measures

- **JWT Authentication** on all REST routes and socket connections
- **Per-route rate limiting** (Express `express-rate-limit`)
- **Per-socket rate limiting** (custom in-memory rate limiter in `chat.socket.ts`)
- **Zod schema validation** on registration/login input
- **bcrypt password hashing** (cost factor 10)
- **Refresh tokens hashed before storage** (bcrypt)
- **Session TTL auto-delete** via MongoDB TTL index

---

## 🐛 Bug Report

### 🔴 Major Bugs (Functionality-Breaking / Security)

#### 1. Upload Feature Is Entirely Dead Code
- **Files affected:** `upload.routes.ts`, `upload.controller.ts`, `multer.config.ts`, `app.ts`
- **Issue:** Upload routes are defined in `upload.routes.ts` but **never registered** in `app.ts` (no `app.use('/api/upload', uploadRoutes)`). Additionally, there is no `express.static` middleware serving the `/uploads` directory, so even if uploads were registered, uploaded files could never be served back to clients.
- **Impact:** The entire file upload pipeline is dead code.

#### 2. No Room Leave — Cross-Room Message Pollution
- **Files affected:** `chat.socket.ts`, `RoomPage.tsx`
- **Issue:** When a user navigates from Room A to Room B, the socket calls `socket.join(roomB)` but **never leaves Room A**. Since `receive_message` payloads do not include a `room` field for filtering, the `onReceiveMessage` handler in Room B will add Room A's incoming messages to Room B's message list. The `leave_room` event is commented out in `socket.ts` types, confirming this was a known gap.
- **Impact:** Users see messages from other rooms they previously visited. This is a significant data integrity and UX bug.

#### 3. `isSoundEnabled` Stale Closure in RoomPage
- **File affected:** `RoomPage.tsx`
- **Issue:** The `onReceiveMessage` handler inside the main `useEffect` captures `isSoundEnabled` in a closure, but `isSoundEnabled` is **not** listed in the `useEffect` dependency array (`[myLang, roomId, scrollToBottom, socket, user, isConnected]`). Once the effect is set up, toggling the sound setting has no effect — the handler always uses the initial value.
- **Impact:** Sound toggle is broken after initial mount until the user changes language or reconnects.

#### 4. Room `members` Array Never Updated on Join
- **Files affected:** `chat.socket.ts`, `rom.service.ts`, `room.model.ts`
- **Issue:** When users join a room via the `join_Room` socket event, the `Room.members` array in MongoDB is **never updated** — it only contains the creator (set at room creation time). The dashboard's "X members" count shown on room cards is always wrong (shows 1).
- **Impact:** Persistent member tracking is broken. The online user list (via socket adapter) works for real-time presence, but the DB member count is inaccurate.

#### 5. Refresh Token Validation Is O(n) bcrypt — DoS Vector
- **File affected:** `auth.services.ts`
- **Issue:** `refreshAccessToken` iterates **all** sessions for a user and runs `bcrypt.compare()` on each until it finds a match. Each bcrypt comparison takes ~100ms. A user with 10 sessions would require ~1 second of CPU time per refresh request.
- **Impact:** An attacker could create many sessions and spam refresh requests to exhaust server CPU. This is a denial-of-service vector.

#### 6. `user_joined` Event Emitted to Self
- **File affected:** `chat.socket.ts`
- **Issue:** `io.to(data.room).emit("user_joined", ...)` includes the joining socket itself. The user sees their own "X joined the room" system message.
- **Fix:** Should use `socket.to(data.room).emit(...)` to broadcast to everyone **except** the sender.

---

### 🟡 Minor Bugs (Code Quality / DRY Violations / Non-Critical)

#### 7. `rom.service.ts` Filename Typo
- **File:** `Backend_TS/src/services/rom.service.ts`
- **Issue:** Should be `room.service.ts`. Every import references it as `rom.service.ts` which is confusing.

#### 8. `(req as any).user?.id` Instead of Typed Request
- **Files affected:** `auth.controller.ts`, `roomControllers.ts`
- **Issue:** The `AuthenticationRequest` interface is defined in `auth.middleware.ts` with a properly typed `user` field, but controllers cast `req as any` instead of using `req as AuthenticationRequest`. This defeats TypeScript's type safety.

#### 9. Duplicate Email Gives Raw MongoDB Error
- **File affected:** `auth.services.ts`
- **Issue:** Registration checks username uniqueness at the service level but not email. A duplicate email triggers a raw MongoDB unique index error instead of a user-friendly message like "Email already in use".

#### 10. CORS Origins Duplicated in Two Files
- **Files affected:** `server.ts`, `app.ts`
- **Issue:** The identical CORS origin array (`defaultOrigins`, `envOrigins`, `corsOrigins`) is defined independently in both files. This is a DRY violation — changes in one file may not be reflected in the other.
- **Fix:** Extract to a shared config module.

#### 11. Misleading Error Message in `db.ts`
- **File affected:** `config/db.ts`
- **Issue:** Error message says `"MONGO_URI is not defined"` but the actual environment variable checked is `MONGODB_URI`.

#### 12. `config/env.ts` Is Dead Code
- **File affected:** `config/env.ts`
- **Issue:** This file calls `dotenv.config()` and logs a message, but it is **never imported** anywhere. `server.ts` calls `dotenv.config()` directly at the top.

#### 13. Profile Endpoint Missing Username
- **File affected:** `auth.routes.ts`
- **Issue:** `GET /api/auth/profile` returns `{ id, role }` but not `username`. The JWT payload contains `username`, but it's not included in the response.

#### 14. Translation Cache Has No TTL
- **File affected:** `translation.service.ts`
- **Issue:** The in-memory translation cache has a max size of 1000 entries but no time-to-live. Stale translations persist until evicted by newer entries. Low risk given the size cap but could serve outdated translations.

#### 15. Test Dependencies in Production `dependencies`
- **File affected:** `Backend_TS/package.json`
- **Issue:** `jest`, `supertest`, and `socket.io-client` are listed under `dependencies` instead of `devDependencies`. This unnecessarily bloats the production install.

#### 16. No Server-Side XSS Sanitization on Messages
- **File affected:** `chat.socket.ts`
- **Issue:** Message content is stored as-is in MongoDB without any sanitization. While React auto-escapes text in the UI (mitigating direct XSS), the raw content in the DB could be exploited if consumed by other clients, admin tools, or APIs.

#### 17. `createSession` Redundant Database Query
- **File affected:** `auth.services.ts`
- **Issue:** `createSession(userId, ...)` calls `User.findById(userId)` even though the callers (`registerUser`/`loginUser`) already have the full user object available. This results in an unnecessary extra DB query on every login/registration.

#### 18. No Password Confirmation on Registration
- **Files affected:** `RegisterPage.tsx`, `auth.controller.ts`
- **Issue:** Registration has no "confirm password" field, making it easy for users to set an unintended password due to typos.

#### 19. Potential Duplicate Messages on Reconnect
- **File affected:** `RoomPage.tsx`
- **Issue:** If the socket disconnects and reconnects within the same `RoomPage` mount, `room_history` resets the messages list via `setMessages(history)`. However, any messages received between the old connection's teardown and the new `room_history` emission could briefly appear duplicated. Low probability but possible.

#### 20. `perSocketRate` Map Potential Unbounded Growth
- **File affected:** `chat.socket.ts`
- **Issue:** The `perSocketRate` map is cleaned up on socket `disconnect`, but if disconnect events fail to fire (network issues), entries accumulate in memory. Low risk given Socket.IO's heartbeat mechanism, but there's no periodic cleanup sweep.

---

## 📊 Bug Severity Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 Major | 6 | Dead upload feature, cross-room message leak, stale sound closure, broken member tracking, refresh DoS vector, self-join notification |
| 🟡 Minor | 14 | Filename typo, type safety bypasses, DRY violations, dead code, missing sanitization, redundant queries |

---

## 🗺️ Suggested Improvements

1. **Implement `leave_room`** — Leave the previous room before joining a new one to prevent cross-room message pollution.
2. **Register upload routes** — Add `app.use('/api/upload', uploadRoutes)` and `express.static` middleware, or remove the dead upload code.
3. **Fix `isSoundEnabled` dependency** — Add it to the `useEffect` dependency array or use a `useRef` to track the current value.
4. **Update room members on join** — Push the user's ID into `Room.members` when they join via socket.
5. **Optimize refresh token lookup** — Store a token identifier (jti) alongside the hashed token, or index sessions differently to avoid O(n) bcrypt comparisons.
6. **Extract shared CORS config** — Create a `config/cors.ts` module imported by both `server.ts` and `app.ts`.
7. **Add server-side message sanitization** — Use a library like `DOMPurify` or `sanitize-html` before storing messages.
8. **Rename `rom.service.ts`** → `room.service.ts`.
9. **Move test deps to `devDependencies`**.
10. **Use `AuthenticationRequest` type** in controllers instead of `(req as any)`.
