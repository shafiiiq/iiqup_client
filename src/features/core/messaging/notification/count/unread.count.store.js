import { useSyncExternalStore } from 'react';

let unreadCount = 0;
const listeners = new Set();

const normalizeCount = (count) => (Number.isFinite(count) && count > 0 ? Math.floor(count) : 0);

const subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const unreadCountStore = {
  getUnreadCount: () => unreadCount,
  setUnreadCount: (count) => {
    const nextCount = normalizeCount(count);
    if (nextCount === unreadCount) return;
    unreadCount = nextCount;
    listeners.forEach((listener) => listener());
  },
  incrementUnreadCount: () => unreadCountStore.setUnreadCount(unreadCount + 1),
  subscribe,
};

export const useUnreadCount = () => useSyncExternalStore(subscribe, unreadCountStore.getUnreadCount);