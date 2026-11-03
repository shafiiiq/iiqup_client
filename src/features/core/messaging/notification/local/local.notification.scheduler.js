import { NOTIFICATION_ICON_PATH } from '../constant/notification.constant';

const isLocalNotificationSupported = () => 'Notification' in window && 'serviceWorker' in navigator;

export const scheduleLocalNotification = async (payload) => {
  if (!isLocalNotificationSupported() || Notification.permission !== 'granted') return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  await registration.showNotification(payload.title || 'New Notification', {
    body: payload.body || payload.message || '',
    tag: payload.notificationId,
    icon: NOTIFICATION_ICON_PATH,
    badge: NOTIFICATION_ICON_PATH,
    data: {
      notificationId: payload.notificationId,
      pushId: payload.pushId || null,
      primaryAction: payload.primaryAction || null,
    },
  });
};