const listeners = new Set();

export const notificationFeed = {
  subscribe: (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish: (event) => {
    listeners.forEach((listener) => listener(event));
  },
};