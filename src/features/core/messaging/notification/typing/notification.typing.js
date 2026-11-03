import { useSyncExternalStore } from 'react';
import socketService from '@/features/core/network/socket/socket.service';

const TYPING_EXPIRY_MS = 4000;
const TYPING_EMIT_INTERVAL_MS = 2000;
const TYPING_IDLE_STOP_MS = 3000;

const EMPTY_NAMES = [];
const typingByNotification = new Map();
const namesSnapshots = new Map();
const listeners = new Set();

const refreshSnapshot = (notificationId) => {
  const entries = typingByNotification.get(notificationId);
  namesSnapshots.set(
    notificationId,
    entries && entries.size > 0 ? [...entries.values()].map((entry) => entry.name) : EMPTY_NAMES
  );
  listeners.forEach((listener) => listener());
};

const removeTypist = (notificationId, uniqueCode) => {
  const entries = typingByNotification.get(notificationId);
  const entry = entries?.get(uniqueCode);
  if (!entries || !entry) return;
  clearTimeout(entry.timerId);
  entries.delete(uniqueCode);
  refreshSnapshot(notificationId);
};

export const publishNotificationTyping = ({ notificationId, uniqueCode, name, isTyping }) => {
  if (!isTyping) {
    removeTypist(notificationId, uniqueCode);
    return;
  }
  const entries = typingByNotification.get(notificationId) ?? new Map();
  const existingEntry = entries.get(uniqueCode);
  if (existingEntry) clearTimeout(existingEntry.timerId);
  entries.set(uniqueCode, {
    name,
    timerId: setTimeout(() => removeTypist(notificationId, uniqueCode), TYPING_EXPIRY_MS),
  });
  typingByNotification.set(notificationId, entries);
  refreshSnapshot(notificationId);
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useNotificationTypingNames = (notificationId) =>
  useSyncExternalStore(subscribe, () =>
    notificationId ? namesSnapshots.get(notificationId) ?? EMPTY_NAMES : EMPTY_NAMES
  );

let lastEmitAt = 0;
let idleTimerId = null;
let typingNotificationId = null;

const emitTyping = (notificationId, isTyping) => {
  socketService.emit('notification_typing', { notificationId, isTyping });
};

export const stopNotificationTyping = () => {
  if (idleTimerId) clearTimeout(idleTimerId);
  idleTimerId = null;
  if (typingNotificationId) emitTyping(typingNotificationId, false);
  typingNotificationId = null;
  lastEmitAt = 0;
};

export const notifyNotificationTyping = (notificationId) => {
  const now = Date.now();
  if (typingNotificationId && typingNotificationId !== notificationId) stopNotificationTyping();
  typingNotificationId = notificationId;
  if (now - lastEmitAt >= TYPING_EMIT_INTERVAL_MS) {
    emitTyping(notificationId, true);
    lastEmitAt = now;
  }
  if (idleTimerId) clearTimeout(idleTimerId);
  idleTimerId = setTimeout(stopNotificationTyping, TYPING_IDLE_STOP_MS);
};