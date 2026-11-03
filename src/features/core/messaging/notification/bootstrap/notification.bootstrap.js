import { startBadgeSync } from '../count/badge.sync';
import { catchUpNotifications, startNotificationCatchUp } from '../catchup/notification.catchup';
import { startServiceWorkerListeners } from '../listeners/service.worker.listeners';
import { registerSocketNotificationListeners } from '../listeners/socket.notification.listeners';

export const initializeNotificationService = async () => {
  registerSocketNotificationListeners();
  startServiceWorkerListeners();
  startNotificationCatchUp();
  await catchUpNotifications();
  startBadgeSync();
};