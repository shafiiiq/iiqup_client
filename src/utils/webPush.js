import { API_URI } from '../constants';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] serviceWorker not supported');
    return null;
  }
  if (!('PushManager' in window)) {
    console.warn('[SW] PushManager not supported');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[SW] registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[SW] registration failed:', err);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const subscribeToPush = async (registration) => {
  return await registration.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
};

export const showNativeNotification = (title, body, data = {}) => {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body,
      icon:  '/logo192.png',
      badge: '/logo192.png',
      data,
    });
  });
};

export const saveSubscriptionToServer = async (subscription, uniqueCode) => {
  await fetch(`${API_URI}/webpush/subscribe`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ subscription, uniqueCode }),
  });
};