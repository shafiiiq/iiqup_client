import { useSyncExternalStore } from 'react';

let activityCounts = { mentions: 0, replies: 0 };
const listeners = new Set();

const normalizeCount = (count) => (Number.isFinite(count) && count > 0 ? Math.floor(count) : 0);

const subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const activityCountStore = {
  getActivityCounts: () => activityCounts,
  setActivityCounts: (nextCounts) => {
    const mentions = normalizeCount(nextCounts.mentions);
    const replies = normalizeCount(nextCounts.replies);
    if (mentions === activityCounts.mentions && replies === activityCounts.replies) return;
    activityCounts = { mentions, replies };
    listeners.forEach((listener) => listener());
  },
  subscribe,
};

export const useActivityCounts = () => useSyncExternalStore(subscribe, activityCountStore.getActivityCounts);