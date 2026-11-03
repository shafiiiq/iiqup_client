import { socketState } from './socket.state';

export const stopNetworkMonitoring = () => {
  socketState.stopNetworkMonitoring?.();
  socketState.stopNetworkMonitoring = null;
};

export const startNetworkMonitoring = (onNetworkRestored) => {
  stopNetworkMonitoring();

  const handleOnline = () => {
    socketState.isNetworkOnline = true;
    onNetworkRestored();
  };
  const handleOffline = () => {
    socketState.isNetworkOnline = false;
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  socketState.stopNetworkMonitoring = () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};