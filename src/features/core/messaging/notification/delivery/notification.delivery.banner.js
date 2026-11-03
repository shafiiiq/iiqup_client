import { scheduleLocalNotification } from '../local/local.notification.scheduler';

const PRESENTED_CHECK_DELAY_MS = 800;

const waitFor = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

export const showMissingBanners = async (pendingNotifications) => {
  await waitFor(PRESENTED_CHECK_DELAY_MS);
  const registration = await navigator.serviceWorker?.getRegistration();
  const presentedNotifications = registration ? await registration.getNotifications() : [];
  const presentedKeys = new Set(
    presentedNotifications.map((presented) => presented.data?.pushId ?? presented.data?.notificationId)
  );
  const missingNotifications = pendingNotifications.filter(
    (pendingNotification) => !presentedKeys.has(pendingNotification.pushId ?? pendingNotification.notificationId)
  );
  await Promise.all(
    missingNotifications.map((missingNotification) =>
      scheduleLocalNotification(missingNotification).catch(console.error)
    )
  );
};