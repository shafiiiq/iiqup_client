import { socketState } from './socket.state';

export const stopVisibilityMonitoring = () => {
  socketState.stopVisibilityMonitoring?.();
  socketState.stopVisibilityMonitoring = null;
};

export const startVisibilityMonitoring = (onPageVisible) => {
  stopVisibilityMonitoring();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') onPageVisible();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  socketState.stopVisibilityMonitoring = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};