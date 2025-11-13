const socket = io(window.location.origin);
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const login = document.getElementById('login');
const chat = document.getElementById('chat');
const joinButton = document.getElementById('joinButton');
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
    chat.style.display = 'block';

    const url = new URL(window.location.href);
    url.searchParams.set('room', room);
    url.searchParams.set('username', username);
    window.history.replaceState({}, '', url);

    shareLink.hidden = false;
    shareLinkHeader.hidden = false;
    const shortUrl = `${window.location.origin}?room=${room}&username=${username}`;
    shareLinkHeader.innerHTML = `📤 Share: <a href="${url}" target="_blank">${shortUrl}</a>`;

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
    const data = {
      room,
      author: username,
      message: msg,
      time: new Date().toLocaleTimeString(),
      targetLang: langSelect.value,
      sourceLang,
    };

    socket.emit('send_message', data);
    messageInput.value = '';
    setStatus('');
  }
};

const appendMessage = (data) => {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (data.author === username) {
    bubble.classList.add('me');
  }

  const meta = document.createElement('div');
  meta.className = 'meta';
  const authorEl = document.createElement('span');
  authorEl.textContent = data.author;
  const timeEl = document.createElement('span');
  timeEl.className = 'time';
  timeEl.textContent = data.time;
  meta.append(authorEl, timeEl);

  const textEl = document.createElement('div');
  textEl.className = 'text';
  textEl.textContent = data.message;

  bubble.append(meta, textEl);
  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  setStatus('');
};

socket.on('receive_message', appendMessage);

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

socket.on('connect_error', () => {
  setStatus('Connection error. Retrying…', 'error');
});
