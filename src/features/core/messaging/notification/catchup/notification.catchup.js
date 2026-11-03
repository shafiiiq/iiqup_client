import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';
import { fetchNotificationCounts } from '../api/notification.counts.service';
import { fetchDocumentUnseen } from '../api/notification.documents.service';
import { syncPendingNotifications } from '../delivery/notification.delivery.sync';
import { notificationFeed } from '../feed/notification.feed';

let stopListening = null;
let activeCatchUp = null;
let isCatchUpQueued = false;

export const refreshUnreadCount = async () => {
  if (!readStoredUserData()?.uniqueCode) return;
  await fetchNotificationCounts();
};

export const refreshDocumentUnseen = async () => {
  if (!readStoredUserData()?.uniqueCode) return;
  await fetchDocumentUnseen();
};

const runCatchUp = async () => {
  const results = await Promise.allSettled([
    syncPendingNotifications(),
    refreshUnreadCount(),
    refreshDocumentUnseen(),
  ]);
  results.forEach((result) => {
    if (result.status === 'rejected') console.error('Notification catch-up failed:', result.reason);
  });
  notificationFeed.publish({ notificationId: null });
};

export const catchUpNotifications = async () => {
  if (activeCatchUp) {
    isCatchUpQueued = true;
    return activeCatchUp;
  }
  try {
    do {
      isCatchUpQueued = false;
      activeCatchUp = runCatchUp();
      await activeCatchUp;
    } while (isCatchUpQueued);
  } catch (error) {
    console.error('Notification catch-up failed:', error);
  } finally {
    activeCatchUp = null;
  }
};

export const stopNotificationCatchUp = () => {
  stopListening?.();
  stopListening = null;
};

export const startNotificationCatchUp = () => {
  stopNotificationCatchUp();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') catchUpNotifications();
  };
  const handleOnline = () => {
    catchUpNotifications();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);

  stopListening = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
  };
};