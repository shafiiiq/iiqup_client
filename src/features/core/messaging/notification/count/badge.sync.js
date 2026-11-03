import { setBadgeCount } from '../local/notification.badge.service';
import { readTotalCount, subscribeToTotalCount } from './total.count.store';

let unsubscribeFromTotalCount = null;

const syncBadge = () => {
  setBadgeCount(readTotalCount());
};

export const stopBadgeSync = () => {
  unsubscribeFromTotalCount?.();
  unsubscribeFromTotalCount = null;
};

export const startBadgeSync = () => {
  stopBadgeSync();
  syncBadge();
  unsubscribeFromTotalCount = subscribeToTotalCount(syncBadge);
};