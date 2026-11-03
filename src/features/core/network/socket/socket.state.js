export const socketState = {
  socket: null,
  isConnecting: false,
  isNetworkOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  manualReconnectAttempts: 0,
  stopNetworkMonitoring: null,
  stopVisibilityMonitoring: null,
};