# LinguaChat Architecture (Current State)

This document reflects the implementation currently in this repository (`Backend_TS` + `Frontend_TS`), not an aspirational design.

## 1. System Overview

LinguaChat is a real-time multilingual chat app with:

- JWT-authenticated REST APIs for auth and room metadata
- JWT-authenticated Socket.IO for room chat and live presence
- MongoDB persistence for users, sessions, rooms, and messages
- Lingo.dev translation engine for asynchronous multilingual delivery
- Optional profile image upload at registration (Cloudinary)
- Optional image upload endpoint (local disk under `/uploads`)

High-level runtime:

```
React SPA (Vite, Tailwind, Router)
        |
        | REST (Axios + Bearer token)
        v
Express 5 app ---------------------> MongoDB (Mongoose)
        |
        | Socket.IO (auth middleware + typed events)
        v
Socket handlers (rooms, messaging, reactions, typing)
        |
        | async translation calls
        v
Lingo.dev SDK (cached with TTL in-memory)
```

## 2. Repository Architecture

```
.
├── Backend_TS/
│   ├── src/
│   │   ├── server.ts                    # dotenv + DB connect + HTTP + Socket.IO bootstrap
│   │   ├── app.ts                       # Express middleware, routes, /api/health
│   │   ├── config/
│   │   │   ├── db.ts                    # Mongoose connection helpers
│   │   │   ├── cors.ts                  # Shared CORS origin resolution
│   │   │   ├── cloudinary.ts            # Cloudinary config for profile uploads
│   │   │   └── multer.config.ts         # Disk upload config for /api/upload
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── roomControllers.ts
│   │   │   └── upload.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── socketAuth.middleware.ts
│   │   │   └── uploadMiddleware.ts      # Cloudinary multer middleware
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── userSession.model.ts
│   │   │   ├── room.model.ts
│   │   │   └── message.model.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── room.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── services/
│   │   │   ├── auth.services.ts
│   │   │   ├── room.service.ts
│   │   │   ├── chat.service.ts
│   │   │   └── translation.service.ts
│   │   ├── sockets/chat.socket.ts
│   │   └── types/socket.d.ts
│   └── tests/                           # Jest + Supertest + socket integration tests
├── Frontend_TS/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                      # Routes + providers
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── chatContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/
│   │   │   ├── Auth/LoginPage.tsx
│   │   │   ├── Auth/RegisterPage.tsx
│   │   │   ├── Dashboard/HomePage.tsx
│   │   │   └── Chat/RoomPage.tsx
│   │   ├── components/                  # Message bubble, emoji picker, protected route, etc.
│   │   ├── services/api.ts              # Axios instance + auth header interceptor
│   │   └── types/socket.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml                   # production-like local run
└── docker-compose.dev.yml               # live-reload dev run
```

## 3. Backend Architecture

### 3.1 Express API Layer

`Backend_TS/src/app.ts`:

- Enables CORS using `corsOrigins` from `config/cors.ts`
- Parses JSON request bodies
- Applies global rate limiting (skipped for test env)
- Mounts route groups:
  - `/api/auth`
  - `/api/rooms`
  - `/api/upload`
- Serves static uploaded files from `/uploads`
- Exposes health endpoint at `/api/health`

### 3.2 Auth + Session Model

Auth flow uses:

- Access token: JWT (`24h`, `JWT_SECRET`)
- Refresh token: JWT (`7d`, `JWT_REFRESH_SECRET`)
- Refresh sessions stored in `UserSession` with:
  - `hashedRefreshToken` (bcrypt hash)
  - `tokenId` (`jti`) for direct lookup
  - `device`, `ip`, `expiresAt`
- Session cleanup via Mongo TTL index on `expiresAt`

`refreshAccessToken` uses:

- Fast path: lookup by `jti` (`tokenId`) + bcrypt verify
- Legacy fallback: compare against sessions without `tokenId`

### 3.3 Room + Messaging Model

- Rooms have owner/admin/member relationships and mode:
  - `Global`: async translation pipeline enabled
  - `Native`: messages delivered without translation enrichment
- Messages store:
  - `original` text
  - `sourceLocale`
  - `translations` map
  - `reactions` map (`emoji -> usernames[]`)
  - optional `replyTo`
  - unique `msgId` (client-generated)

### 3.4 Socket Layer

`Backend_TS/src/server.ts`:

- Creates HTTP server from Express app
- Initializes Socket.IO with CORS + credentials
- Applies `socketAuthMiddleware` (JWT validation)
- Registers all handlers via `initializeChatSocket`

`Backend_TS/src/sockets/chat.socket.ts` behavior:

- Loads user identity (`username`, `profilePicture`) on connect
- Maintains per-socket rate limit buckets in memory
- Periodic cleanup sweep of rate-limit map every 5 minutes
- Sanitizes incoming message text before persistence
- Handles room join/leave, room creation, mode updates, messaging, reactions, typing

## 4. Frontend Architecture

### 4.1 App Shell

`Frontend_TS/src/App.tsx` wraps providers in this order:

1. `ThemeProvider`
2. `AuthProvider`
3. `ChatProvider`
4. Router (`/login`, `/register`, `/`, `/room/:roomId`)

Protected routes use `ProtectedRoute`.

### 4.2 Auth State

`AuthContext` responsibilities:

- Stores `user`, `accessToken`, and `refreshToken` in localStorage
- Exposes `login`, `logout`, `isAuthenticated`
- Refreshes access token every 23 hours via `/auth/refresh-token`

### 4.3 Socket State

`chatContext`:

- Opens socket only when user + access token are present
- Authenticates with `auth: { token }`
- Tracks `isConnected` and `connectionError`
- Disconnects socket on cleanup/auth change

### 4.4 Feature Pages

- `RegisterPage`: multipart registration with optional profile image
- `LoginPage`: username/password login
- `HomePage`: fetch/search/list rooms, create room, join by room id/name, manage room mode/delete for authorized users
- `RoomPage`: room chat UI (history, streaming translations, reactions, replies, typing indicators, language switching, sound toggle, participant list)

## 5. API Surface (Implemented)

### 5.1 REST Endpoints

Auth:

- `POST /api/auth/register` (multipart; optional `profilePicture`)
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout-session` (auth required)
- `POST /api/auth/logout-all` (auth required)
- `GET /api/auth/sessions` (auth required)
- `GET /api/auth/profile` (auth required)

Rooms:

- `GET /api/rooms` (auth required)
- `GET /api/rooms/search?q=...` (auth required)
- `GET /api/rooms/:id` (auth required; accepts room ObjectId or room name)
- `PATCH /api/rooms/:id/mode` (auth required; owner/admin)
- `DELETE /api/rooms/:id` (auth required; owner only)

Uploads:

- `POST /api/upload` (auth required; `image` field; returns `/uploads/<filename>`)

Infra:

- `GET /api/health`

### 5.2 Socket Events

Client -> Server:

- `join_Room`
- `leave_room`
- `set_language`
- `create_room`
- `update_room_mode`
- `send_message`
- `add_reaction`
- `typing_start`
- `typing_stop`

Server -> Client:

- `room_history`
- `receive_message`
- `translations_ready` (chunked async translations)
- `message_status` (`sent`/`failed`)
- `reaction_update`
- `room_users`
- `room_info`
- `room_created`
- `user_typing`
- `user_joined`
- `error_event`

## 6. Core Runtime Flows

### 6.1 Registration/Login

1. Frontend submits credentials (`register` supports optional image).
2. Backend validates payload (Zod), hashes password, creates user.
3. Backend issues access + refresh tokens and creates session record.
4. Frontend stores tokens/user and initializes socket connection.

### 6.2 Join Room

1. Client emits `join_Room({ room, lang })`.
2. Server leaves previous room if needed, then joins target room.
3. Server upserts persistent room membership (`$addToSet`).
4. Server emits room metadata (`room_info`) and room history (`room_history`).
5. Server emits current live occupants as `room_users`.

### 6.3 Message Delivery (Global Mode)

1. Client emits `send_message`.
2. Server sanitizes text and persists message immediately with empty translations.
3. Server broadcasts `receive_message` immediately.
4. Server runs translation in background (Lingo SDK) and emits `translations_ready` chunks per language.
5. Server updates stored message translations in MongoDB.

Native mode skips background translation.

## 7. Data Model Summary

- `User`: identity, credentials, role, profilePicture
- `UserSession`: refresh-token session metadata + TTL expiry
- `Room`: room metadata, owner/admins/members, visibility, translation mode
- `Message`: immutable message id, original text, translation map, reaction map, optional reply linkage

Indexes present:

- `User.username` unique
- `User.email` unique
- `Room.name` unique
- `Message.msgId` unique
- `Message` compound index (`room`, `createdAt`)
- `UserSession.expiresAt` TTL
- `UserSession.tokenId` indexed

## 8. Deployment and Operations

- `docker-compose.yml` runs:
  - backend (`:5000`) with health check on `/api/health`
  - frontend (`:80`) with backend dependency
- `docker-compose.dev.yml` runs hot-reload Node containers for backend and frontend
- CORS origins are centrally derived in `Backend_TS/src/config/cors.ts`

Environment variables are defined in `Backend_TS/.env.example`:

- DB: `MONGODB_URI`
- Auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Translation: `LINGO_API_KEY`, optional `LINGO_API_URL`
- Media: `CLOUDINARY_*`
- CORS: `CORS_ORIGINS`

## 9. Testing Status

Backend includes Jest suites for:

- Auth route coverage (`tests/auth.test.ts`)
- Socket chat flows (`tests/chat.test.ts`)

No frontend automated tests are currently present in this repository.

## 10. Current Technical Notes

- There are two upload paths:
  - Cloudinary upload during registration (`profilePicture`)
  - Local disk upload endpoint (`/api/upload`)
- Translation cache is in-memory and process-local (not shared across backend replicas).
- Socket rate limits are in-memory and per-node (not globally distributed).
