const listenersByEvent = new Map();

export const removeSocketListener = (eventName, handler) => {
  listenersByEvent.get(eventName)?.delete(handler);
};

export const addSocketListener = (eventName, handler) => {
  if (!listenersByEvent.has(eventName)) listenersByEvent.set(eventName, new Set());
  listenersByEvent.get(eventName).add(handler);
  return () => removeSocketListener(eventName, handler);
};

export const dispatchSocketEvent = (eventName, payload) => {
  listenersByEvent.get(eventName)?.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      return;
    }
  });
};