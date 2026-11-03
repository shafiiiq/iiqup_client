import { routeNotificationClick } from './notification.tap.router';

let stopListening = null;

export const stopServiceWorkerListeners = () => {
  stopListening?.();
  stopListening = null;
};

export const startServiceWorkerListeners = () => {
  stopServiceWorkerListeners();
  if (!('serviceWorker' in navigator)) return;

  const handleMessage = (event) => {
    if (event.data?.type === 'notification_click') routeNotificationClick(event.data);
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);
  stopListening = () => navigator.serviceWorker.removeEventListener('message', handleMessage);
};