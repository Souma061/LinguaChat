# 🚀 LinguaChat

### _Translate together in real time — chat across languages effortlessly._

![Node](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express.js-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-blue)
![Lingo.dev](https://img.shields.io/badge/Lingo.dev-AI%20Translation-purple)
![Render](https://img.shields.io/badge/Deploy-Render-success)

---

## 🌍 Overview

**LinguaChat** is a real-time multilingual chat platform. Built with **Node.js**, **Express**, **Socket.IO**, and **Lingo.dev AI Translation**, it enables people speaking different languages to chat in the same room with automatic message translation.

---

## ✨ Features

- 🔗 Join rooms or share invite links using `?room=&username=`
- 🌐 Real-time translation to each user's preferred language
- 👥 Presence panel with usernames and language tags
- 🔄 Auto reconnection for stable chat sessions
- 💾 **Persistent message storage** with MongoDB integration
- 🔍 **Translation caching** for optimized performance
- 🕒 **Full message history** with room and timestamp indexing
- 🛠️ `/health` API route plus automated tests
- 🎨 Clean WhatsApp-style responsive UI

---

## 🧰 Tech Stack

**Backend:** Node.js, Express, Socket.IO, Lingo.dev SDK, dotenv
**Frontend:** React 19, Vite, Socket.IO client, CSS Modules
**Testing:** Node built-in test runner (`node --test`)
**Deployment:** Render Web Service

## 🔗 Live Demo

**[Visit LinguaChat Live](https://linguachat-mojs.onrender.com/)**

Try the demo or create your own room to see multilingual chat in action!

---

## 📁 Folder Structure

```
LinguaChat/
│
├── Backend/
│   ├── index.js              (main server & Socket.IO logic)
│   ├── db.js                 (MongoDB connection & utilities)
│   ├── models.js             (Mongoose schemas)
│   ├── constants.js          (configuration constants)
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── tests/
│   │   └── health.test.js
│   └── node_modules/
│
├── Frontend_React/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── Components/
│   │   │   ├── ChatPanel/
│   │   │   ├── LoginPanel/
│   │   │   ├── Composer/
│   │   │   ├── MessageBubble/
│   │   │   ├── UserList/
│   │   │   └── StatusBanner/
│   │   ├── context/
│   │   │   └── ChatContext.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   └── useChatContext.js
│   │   └── utils/
│   │       └── helper.js
│   ├── dist/ (production build)
│   ├── vite.config.js
│   ├── package.json
│   └── node_modules/
│
├── assets/
│   └── screenshots/
│       ├── Landing.png
│       ├── Demo_room.png
│       └── Multilingual_chat.png
│
└── README.md
```

---

## 🛠️ Local Setup

### Development Mode

1. **Install dependencies**
   ```bash
   cd Backend
   npm install
   cd ../Frontend_React
   npm install
   ```
2. **Configure environment variables** — create `Backend/.env`
   ```env
   LINGO_API_KEY="your_api_key_here"
   PORT=5000
   MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/LinguaChat"
   ```
3. **Start Backend** (in `Backend/` directory)
   ```bash
   npm run dev
   ```
4. **Start Frontend** (in `Frontend_React/` directory, new terminal)
   ```bash
   npm run dev
   ```
   - Backend runs on `http://localhost:5000`
   - Frontend dev server on `http://localhost:5173` with Vite proxy to `/socket.io`

### Production Mode (Build & Deploy)

1. **Build the React app**
   ```bash
   cd Frontend_React
   npm run build
   ```
   Creates optimized bundle in `Frontend_React/dist/`
2. **Start with production backend**
   ```bash
   cd Backend
   NODE_ENV=production npm start
   ```
   Backend serves React build from `dist/` on port 5000

---

## 🗄️ Database Architecture

### MongoDB Integration

LinguaChat uses **MongoDB** with Mongoose ODM for persistent message storage and caching optimization.

**Key Files:**

- `db.js` — Database connection with connection pooling (min: 2, max: 10)
- `models.js` — Mongoose message schema with optimization indexes
- `constants.js` — Application constants (DB name, etc.)

**Message Schema:**

```javascript
{
  room: String,           // Room identifier (indexed for fast queries)
  author: String,         // Message sender's username
  original: String,       // Original untranslated message
  translations: Map,      // Language-specific translations {langCode: translatedText}
  sourceLocale: String,   // Source language locale
  msgID: String,          // Unique message identifier
  time: Date,             // Message send time
  createdAt: Date         // Database record creation time (indexed)
}
```

**Indexes:**

- `room` — Fast room filtering
- `createdAt` — Time-based sorting
- Compound `{room, createdAt}` — Efficient room history retrieval

### Features

- ✅ Full message history with translations
- ✅ Translation result caching for performance
- ✅ Room-based message organization
- ✅ Automatic timestamp tracking
- ✅ Scalable connection pooling

---

## 🧪 Tests

```bash
npm test
```

Verifies the `/health` route responds with `{ "status": "ok" }`.

---

## ☁️ Deploying to Render

1. Push to the `main` branch.
2. Create a Render **Web Service** from the GitHub repo:
   - **Language:** Node
   - **Root Directory:** `.` (repository root)
   - **Build Command:**
     ```bash
     npm install --prefix Backend && npm install --prefix Frontend_React && npm run build --prefix Frontend_React
     ```
   - **Start Command:**
     ```bash
     NODE_ENV=production npm start --prefix Backend
     ```
3. Configure environment variables:
   - `LINGO_API_KEY` (your Lingo.dev API key)
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `PORT` (optional, defaults to 5000)
   - Optional: `LINGO_API_URL` (custom Lingo.dev endpoint)
4. Deploy 🚀

Render will:

- Clone your repo
- Install dependencies for both Backend and Frontend_React
- Build the React production bundle
- Start the backend server serving the built React app

**Live URL:** `https://your-service.onrender.com`

Shareable invite example:

```
https://linguachat-mojs.onrender.com?room=demo&username=YourName
```

---

## 📸 Screenshots

| Landing Screen                             | Demo Room                                      | Cross-Language Chat                                             |
| ------------------------------------------ | ---------------------------------------------- | --------------------------------------------------------------- |
| ![Landing](assets/screenshots/Landing.png) | ![Demo Room](assets/screenshots/Demo_room.png) | ![Multilingual Chat](assets/screenshots/Multillingual_chat.png) |

---

## 🚀 Future Improvements

- Typing indicators and read receipts
- Message reactions and emoji picker
- Light/dark theme toggle
- User authentication and profiles
- Analytics dashboard for room activity
- Message search and filtering
- Voice messages and file sharing

---

## 💬 Final Note

LinguaChat was built to make global communication effortless. Feel free to fork, extend, or use it as a starting point for your own multilingual chat experience.

Happy hacking! 🚀

## 📁 Video Demo

https://youtu.be/RAg2pKxgBnU
