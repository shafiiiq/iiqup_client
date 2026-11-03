import { NOTIFICATION_SERVICE_WORKER_PATH } from '../constant/notification.constant';
import { readNotificationPermission, requestNotificationPermission } from '../permissions/notification.permissions';
import { registerWebPushSubscription, removeWebPushSubscription } from './push.token.service';
import { convertVapidKeyToBytes } from './webpush.key';

const isWebPushSupported = () => !['insecure', 'unsupported'].includes(readNotificationPermission());

const readVapidPublicKey = () => {
  const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) throw new Error('REACT_APP_VAPID_PUBLIC_KEY is not set');
  return vapidPublicKey;
};

const resolveSubscription = async (registration) => {
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) return existingSubscription;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertVapidKeyToBytes(readVapidPublicKey()),
  });
};

export const registerWebPush = async () => {
  if (!isWebPushSupported() || Notification.permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.register(NOTIFICATION_SERVICE_WORKER_PATH);
  await navigator.serviceWorker.ready;

  const subscription = await resolveSubscription(registration);
  await registerWebPushSubscription(subscription.toJSON());
  return true;
};

export const enableWebPush = async () => {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return false;
  return registerWebPush();
};

export const unregisterWebPush = async () => {
  try {
    if (!isWebPushSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await removeWebPushSubscription(subscription.endpoint).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    return;
  }
};