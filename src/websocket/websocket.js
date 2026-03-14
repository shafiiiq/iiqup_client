// src/websocket/websocket.js
// ─────────────────────────────────────────────────────────────────────────────
// WebSocket Singleton Service
// One connection for the entire app lifetime.
// Started in App.jsx on login, torn down on logout.
//
// Backend authenticate handler only requires uniqueCode + userId.
// sessionToken is optional on the server — we do not send it.
// ─────────────────────────────────────────────────────────────────────────────

import io from 'socket.io-client';
import { END_POINT } from '../constants';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RECONNECT_DELAY_MS = 3_000;
const RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS   = 30_000;
const SOCKET_TIMEOUT_MS  = 20_000;

// ─────────────────────────────────────────────────────────────────────────────
// Internal State
// ─────────────────────────────────────────────────────────────────────────────

let socket         = null;
let pingIntervalId = null;
let isConnecting   = false;

// External listeners: Map<eventName, Set<handlerFn>>
const listeners = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Private Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Forwards a socket event to all registered external listeners. */
const _dispatch = (event, data) => {
  const handlers = listeners.get(event);
  if (!handlers) return;
  handlers.forEach(fn => {
    try { fn(data); } catch (err) {
      console.error(`[WebSocket] listener error on "${event}":`, err);
    }
  });
};

const _startPing = () => {
  _stopPing();
  pingIntervalId = setInterval(() => {
    if (socket?.connected) socket.emit('ping');
  }, PING_INTERVAL_MS);
};

const _stopPing = () => {
  if (pingIntervalId) { clearInterval(pingIntervalId); pingIntervalId = null; }
};

/** Binds all socket-level event handlers after connection. */
const _bindSocketEvents = (uniqueCode) => {

  socket.onAny((event, data) => {
  console.log('[WS EVENT]', event, data);
});

  // ── Connection ────────────────────────────────────────────────────────────
  socket.on('connect', () => {
    console.log(`[WebSocket] connected — socket: ${socket.id}`);
    isConnecting = false;

    // Backend expects uniqueCode and userId — sessionToken is optional, not sent
    socket.emit('authenticate', { uniqueCode, userId: uniqueCode });
    _startPing();
  });

  // ── Authenticated ─────────────────────────────────────────────────────────
  socket.on('authenticated', (data) => {
    console.log('[WebSocket] authenticated:', data.message);
    _dispatch('authenticated', data);
  });

  // ── Session invalid — disconnect, let App.jsx handle re-login ─────────────
  socket.on('session_invalid', (data) => {
    console.warn('[WebSocket] session_invalid:', data.message);
    _dispatch('session_invalid', data);
    WebSocketService.disconnect();
  });

  // ── Disconnect (Socket.IO reconnects silently) ────────────────────────────
  socket.on('disconnect', (reason) => {
    console.warn(`[WebSocket] disconnected — reason: ${reason}`);
    _stopPing();
    _dispatch('disconnect', { reason });
  });

  // ── Connection error (Socket.IO retries automatically) ────────────────────
  socket.on('connect_error', (error) => {
    console.error('[WebSocket] connect_error:', error.message);
  });

  socket.on('pong', () => { /* keep-alive confirmed */ });

  // ── Notification events ───────────────────────────────────────────────────
  socket.on('new_notification', (data) => _dispatch('new_notification', data));
  socket.on('notification',     (data) => _dispatch('new_notification', data)); // server alias

  // ── Chat events ───────────────────────────────────────────────────────────
  socket.on('new_message',           (data) => _dispatch('new_message',           data));
  socket.on('message_sent',          (data) => _dispatch('message_sent',          data));
  socket.on('message_error',         (data) => _dispatch('message_error',         data));
  socket.on('message_status_update', (data) => _dispatch('message_status_update', data));
  socket.on('user_typing',           (data) => _dispatch('user_typing',           data));

  // ── Call events ───────────────────────────────────────────────────────────
  socket.on('incoming_call', (data) => _dispatch('incoming_call', data));
  socket.on('call_answered', (data) => _dispatch('call_answered', data));
  socket.on('call_rejected', (data) => _dispatch('call_rejected', data));
  socket.on('call_ended',    (data) => _dispatch('call_ended',    data));

  // ── WebRTC events ─────────────────────────────────────────────────────────
  socket.on('webrtc_offer',         (data) => _dispatch('webrtc_offer',         data));
  socket.on('webrtc_answer',        (data) => _dispatch('webrtc_answer',        data));
  socket.on('webrtc_ice_candidate', (data) => _dispatch('webrtc_ice_candidate', data));
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const WebSocketService = {

  /**
   * Creates and connects the socket.
   * No-ops if already connected or connecting.
   * @param {string} uniqueCode
   */
  connect(uniqueCode) {
    if (socket?.connected || isConnecting) return;
    if (!uniqueCode) {
      console.warn('[WebSocket] connect() called without uniqueCode — aborting');
      return;
    }

    isConnecting = true;
    console.log(`[WebSocket] connecting — uniqueCode: ${uniqueCode}`);

    socket = io(END_POINT, {
      transports:           ['websocket'],
      reconnection:         true,
      reconnectionDelay:    RECONNECT_DELAY_MS,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      timeout:              SOCKET_TIMEOUT_MS,
    });

    _bindSocketEvents(uniqueCode);
  },

  /** Tears down socket and clears all timers. Call on logout. */
  disconnect() {
    _stopPing();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    isConnecting = false;
    console.log('[WebSocket] disconnected and cleaned up');
  },

  /** Emits an event to the server. */
  emit(event, data) {
    if (!socket?.connected) {
      console.warn(`[WebSocket] emit("${event}") skipped — not connected`);
      return;
    }
    socket.emit(event, data);
  },

  /**
   * Registers a listener for a socket event.
   * Returns an unsubscribe function — use as useEffect cleanup.
   * @param   {string}   event
   * @param   {Function} handler
   * @returns {Function} unsubscribe
   */
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => WebSocketService.off(event, handler);
  },

  /** Removes a listener. */
  off(event, handler) {
    listeners.get(event)?.delete(handler);
  },

  get isConnected() {
    return socket?.connected ?? false;
  },
};

export default WebSocketService;