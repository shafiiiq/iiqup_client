import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';
import {
  acknowledgeDeliveredNotifications,
  fetchPendingNotifications,
} from '../api/notification.delivery.service';
import { showMissingBanners } from './notification.delivery.banner';

export const syncPendingNotifications = async () => {
  if (!readStoredUserData()?.uniqueCode) return;
  const pendingNotifications = await fetchPendingNotifications();
  if (pendingNotifications.length === 0) return;

  if (document.visibilityState !== 'visible') await showMissingBanners(pendingNotifications);

  const pendingPushIds = pendingNotifications
    .map((pendingNotification) => pendingNotification.pushId)
    .filter(Boolean);
  await acknowledgeDeliveredNotifications(pendingPushIds);
};