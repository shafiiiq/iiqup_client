import { stopBadgeSync } from '../count/badge.sync';
import { resetNotificationCounts } from '../count/notification.count.reset';
import { stopNotificationCatchUp } from '../catchup/notification.catchup';
import { forgetAllNotificationIds } from '../ingest/notification.ingest';
import { stopServiceWorkerListeners } from '../listeners/service.worker.listeners';
import { removeSocketNotificationListeners } from '../listeners/socket.notification.listeners';

export const cleanupNotificationService = () => {
  removeSocketNotificationListeners();
  stopServiceWorkerListeners();
  stopNotificationCatchUp();
  stopBadgeSync();
  forgetAllNotificationIds();
  resetNotificationCounts();
};