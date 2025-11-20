import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useSocket = (handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Keep handler callbacks always fresh (avoid stale closures)
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Initialize socket once
    socketRef.current = io(window.location.origin, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      pingInterval: 25000,
    });

    const socket = socketRef.current;

    // --- Core Connection Events ---
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      handlersRef.current.onConnect?.(socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      handlersRef.current.onDisconnect?.(reason);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      handlersRef.current.onReconnectAttempt?.(attempt);
    });

    socket.io.on('reconnect', (attempt) => {
      handlersRef.current.onReconnect?.(attempt);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      handlersRef.current.onConnectionError?.(err);
    });

    // --- App Events ---
    socket.on('receive_message', (data) => {
      handlersRef.current.onReceiveMessage?.(data);
    });

    socket.on('room_history', (history) => {
      handlersRef.current.onRoomHistory?.(history);
    });

    socket.on('room_users', (users) => {
      handlersRef.current.onRoomUsers?.(users);
    });

    socket.on('translation_error', (msg) => {
      handlersRef.current.onTranslationError?.(msg);
    });

    // --- Cleanup ---
    return () => {
      if (!socketRef.current) return;

      // Remove listeners safely
      socket.off('receive_message');
      socket.off('room_history');
      socket.off('room_users');
      socket.off('translation_error');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect');

      socket.disconnect();
    };
  }, []);

  // --- Emitting helpers ---
  const emit = useCallback((event, payload = {}) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit(event, payload);
  }, []);

  const setUsername = useCallback((username) => {
    emit('set_username', { username });
  }, [emit]);

  const joinRoom = useCallback((room, lang) => {
    emit('join_room', { room, lang });
  }, [emit]);

  const sendMessage = useCallback((message) => {
    emit('send_message', message);
  }, [emit]);

  const setLanguage = useCallback((room, lang) => {
    emit('set_language', { room, lang });
  }, [emit]);

  return {
    getSocket: () => socketRef.current,
    emit,
    setUsername,
    joinRoom,
    sendMessage,
    setLanguage,
  };
};

export default useSocket;
