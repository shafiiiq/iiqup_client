const listeners = new Set();

export const notificationArrival = {
  subscribe: (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish: (payload) => {
    listeners.forEach((listener) => listener(payload));
  },
};