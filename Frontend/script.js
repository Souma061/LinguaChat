const socket = io(window.location.origin);
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const login = document.getElementById('login');
const chat = document.getElementById('chat');
const shell = document.querySelector('.shell');
const joinButton = document.getElementById('joinButton');
const demoButton = document.getElementById('demoButton');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('message');
const messagesDiv = document.getElementById('messages');
const langSelect = document.getElementById('language');
const shareLink = document.getElementById('shareLink');
const shareLinkHeader = document.getElementById('shareLinkHeader');
const roomInfo = document.getElementById('roomInfo');
const roomUsersPanel = document.getElementById('roomUsers');
const statusText = document.getElementById('status');

let username = '';
let room = '';
let sourceLang = 'auto';

// Demo configuration
const DEMO_ROOM = 'Demo-Room';
const DEMO_MESSAGES = [
  {
    author: 'Adam',
    message: 'Hello everyone! Welcome to LinguaChat 👋',
    lang: 'en',
  },
  { author: 'Ram', message: 'नमस्ते! यह बहुत बढ़िया है 😊', lang: 'hi' },
  {
    author: 'Christopher',
    message: '¡Hola! ¿Cómo estás? Esto es increíble',
    lang: 'es',
  },
  { author: 'Sophie', message: "Bonjour! C'est magnifique, non?", lang: 'fr' },
  {
    author: 'Souma',
    message: 'আমরা সবাই বিভিন্ন ভাষায় কথা বলছি!',
    lang: 'bn',
  },
];

const params = new URLSearchParams(window.location.search);
const presetRoom = params.get('room');
const presetUser = params.get('username');

if (presetRoom) {
  roomInput.value = presetRoom;
}

if (presetUser) {
  usernameInput.value = presetUser;
}

const setStatus = (text, tone = 'info') => {
  if (!statusText) return;
  statusText.textContent = text;
  if (tone === 'info') {
    delete statusText.dataset.tone;
  } else {
    statusText.dataset.tone = tone;
  }
};

// Detect and keep track of the language the user types in so recipients can request translations reliably.
const detectSourceLanguage = (text) => {
  // Very naive detection: stop gap until backend recognition is wired.
  const patterns = {
    hi: /[\u0900-\u097f]/,
    es: /[ñáéíóúü]/i,
    fr: /[àâçéèêëîïôûùüÿœæ]/i,
  };
  return (
    Object.entries(patterns).find(([, regex]) => regex.test(text))?.[0] ??
    'auto'
  );
};

const joinRoom = () => {
  username = usernameInput.value.trim();
  room = roomInput.value.trim();

  if (username && room) {
    messagesDiv.innerHTML = '';
    socket.emit('set_username', { username });
    socket.emit('join_room', { room, lang: langSelect.value });
    login.style.display = 'none';
    chat.style.display = 'flex';
    document.body.classList.add('joined');
    shell?.classList.add('chat-only');

    const url = new URL(window.location.href);
    url.searchParams.set('room', room);
    url.searchParams.set('username', username);
    window.history.replaceState({}, '', url);

    const shortUrl = `${window.location.origin}?room=${room}&username=${username}`;
    shareLink.hidden = false;
    shareLink.innerHTML = `📤 Share this room:<br /><a href="${url}" target="_blank" rel="noopener">${shortUrl}</a>`;
    shareLinkHeader.hidden = false;
    shareLinkHeader.innerHTML = `📤 <a href="${url}" target="_blank" rel="noopener" title="${shortUrl}">Open link</a>`;

    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();

    if (roomInfo) {
      roomInfo.textContent = `Room: ${room}`;
    }

    setStatus(`You joined ${room}. Waiting for messages…`, 'success');
  }
};

const sendMessage = () => {
  const msg = messageInput.value;

  if (msg.trim() !== '') {
    const msgId = `${username}-${Date.now()}`; // ✅ Generate matching ID
    const time = new Date().toLocaleTimeString();
    const data = {
      room,
      author: username,
      message: msg,
      time: time,
      targetLang: langSelect.value,
      sourceLang,
      msgId: msgId, // ✅ SEND THE SAME ID TO SERVER
    };

    // ✅ Show message immediately (optimistic UI)
    const bubble = document.createElement('div');
    bubble.className = 'bubble me new';
    bubble.id = `msg-${msgId}`; // ✅ Use msgId

    const meta = document.createElement('div');
    meta.className = 'meta';

    const authorEl = document.createElement('span');
    authorEl.textContent = username;

    const langBadgeEl = document.createElement('span');
    langBadgeEl.className = 'lang-badge';
    langBadgeEl.textContent = langSelect.value.toUpperCase();

    const timeEl = document.createElement('span');
    timeEl.className = 'time';
    timeEl.textContent = time;

    const statusEl = document.createElement('span');
    statusEl.className = 'send-status';
    statusEl.textContent = '⏳';

    meta.append(authorEl, langBadgeEl, timeEl, statusEl);

    const textEl = document.createElement('div');
    textEl.className = 'text';
    textEl.textContent = msg;

    bubble.append(meta, textEl);
    messagesDiv.appendChild(bubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    messageInput.value = '';
    setStatus('');

    socket.emit('send_message', data);
  }
};

const appendMessage = (data) => {
  const bubble = document.createElement('div');
  bubble.className = 'bubble new';
  if (data.author === username) {
    bubble.classList.add('me');
  }


  if (data.msgId) {
    bubble.id = `msg-${data.msgId}`;
  }

  const meta = document.createElement('div');
  meta.className = 'meta';

  const authorEl = document.createElement('span');
  authorEl.textContent = data.author;

  // ✅ Add language badge if available
  let langBadgeEl = null;
  if (data.lang) {
    langBadgeEl = document.createElement('span');
    langBadgeEl.className = 'lang-badge';
    langBadgeEl.textContent = data.lang.toUpperCase();
  }

  const timeEl = document.createElement('span');
  timeEl.className = 'time';
  timeEl.textContent = data.time;

  meta.append(authorEl);
  if (langBadgeEl) meta.append(langBadgeEl);
  meta.append(timeEl);

  const textEl = document.createElement('div');
  textEl.className = 'text';
  textEl.textContent = data.message;

  bubble.append(meta, textEl);
  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  setStatus('');
};

socket.on('receive_message', (data) => {
  console.log('Received message:', data);


  if (data.author === username && data.msgId) {
    console.log('Checking for msgId:', `msg-${data.msgId}`); // ✅ Debug log
    const sentMsg = messagesDiv.querySelector(`#msg-${data.msgId}`);

    if (sentMsg) {

      // ✅ DELETE the temporary optimistic message
      sentMsg.remove();

      // ✅ Show the confirmed message from server
      appendMessage(data);
      return; // ✅ EXIT - don't duplicate
    } else {
      console.log('Message ID not found');
    }
  }

  // ✅ For OTHER users' messages
  appendMessage(data);
});

socket.on('room_history', (history) => {
  history.forEach((entry) => appendMessage(entry));
  if (history.length) {
    setStatus(`Loaded ${history.length} earlier messages.`, 'info');
    setTimeout(() => {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 100);
  }
});

socket.on('room_users', (users) => {
  if (!roomUsersPanel) {
    return;
  }

  if (!users.length) {
    roomUsersPanel.innerHTML =
      '<strong>People</strong><p class="hint">Waiting for others to join…</p>';
    return;
  }

  const listItems = users.map((u) => {
    const label = u.username === username ? `${u.username} (you)` : u.username;
    return `<li>${label} <span class="lang">${u.lang}</span></li>`;
  });
  roomUsersPanel.innerHTML = `<strong>People</strong><ul>${listItems.join('')}</ul>`;

  if (room) {
    shareLink.hidden = false;
  }
});

socket.on('translation_error', (message) => {
  const notification = document.createElement('p');
  notification.className = 'system';
  notification.textContent = message;
  messagesDiv.appendChild(notification);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  setStatus(message, 'warning');
});

joinButton.addEventListener('click', joinRoom);
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

langSelect.addEventListener('change', () => {
  if (room) {
    socket.emit('set_language', { room, lang: langSelect.value });
  }
});

messageInput.addEventListener('input', () => {
  sourceLang = detectSourceLanguage(messageInput.value);
});

// Demo Mode
const startDemo = () => {
  usernameInput.value = `Visitor_${Math.floor(Math.random() * 10000)}`;
  roomInput.value = DEMO_ROOM;
  langSelect.value = 'en';
  joinRoom();

  // Auto-load demo messages with staggered timing
  setTimeout(() => {
    DEMO_MESSAGES.forEach((msg, index) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble new';
        if (msg.author === usernameInput.value) {
          bubble.classList.add('me');
        }

        const meta = document.createElement('div');
        meta.className = 'meta';
        const langBadgeEl = document.createElement('span');
        langBadgeEl.className = 'lang-badge';
        langBadgeEl.textContent = msg.lang.toUpperCase();

        const authorEl = document.createElement('span');
        authorEl.textContent = msg.author;

        const timeEl = document.createElement('span');
        timeEl.className = 'time';
        timeEl.textContent = new Date().toLocaleTimeString();

        meta.append(authorEl, langBadgeEl, timeEl);

        const textEl = document.createElement('div');
        textEl.className = 'text';
        textEl.textContent = msg.message;

        bubble.append(meta, textEl);
        messagesDiv.appendChild(bubble);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }, index * 900);
    });
  }, 1200);
};

demoButton.addEventListener('click', startDemo);

socket.on('connect', () => {
  if (room) {
    socket.emit('set_username', { username });
    socket.emit('join_room', { room, lang: langSelect.value });
    sendButton.disabled = false;
    messageInput.disabled = false;
    setStatus(`Reconnected to ${room}`, 'success');
  } else {
    setStatus('Connected to LinguaChat', 'success');
  }
});

socket.on('disconnect', () => {
  setStatus('Disconnected. Attempting to reconnect…', 'warning');
  sendButton.disabled = true;
  messageInput.disabled = true;
});

socket.io.on('reconnect_attempt', () => {
  setStatus('Reconnecting…', 'warning');
});


socket.on('connection_error', () => {
  setStatus('Connection error. Retrying…', 'error');
})






// socket.on('connect_error', () => {
//   setStatus('Connection error. Retrying…', 'error');
// });
