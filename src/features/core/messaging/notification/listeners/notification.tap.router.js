import { navigateToScreen, openNotificationsTab } from '@/features/core/platform/navigation/screen.router';
import { markNotificationRead } from '../api/notification.counts.service';

const DUPLICATE_TAP_WINDOW_MS = 3000;

let lastRoutedTapKey = '';
let lastRoutedTapAt = 0;

const isDuplicateTap = (data) => {
  const tapKey = data?.pushId || data?.notificationId;
  if (!tapKey) return false;
  const now = Date.now();
  const isDuplicate = tapKey === lastRoutedTapKey && now - lastRoutedTapAt < DUPLICATE_TAP_WINDOW_MS;
  lastRoutedTapKey = tapKey;
  lastRoutedTapAt = now;
  return isDuplicate;
};

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parsePrimaryAction = (value) => {
  const candidate = typeof value === 'string' ? parseJson(value) : value;
  return candidate?.screenKey && candidate?.documentId ? candidate : null;
};

export const routeNotificationClick = (data) => {
  if (isDuplicateTap(data)) return;
  if (data.notificationId) markNotificationRead(data.notificationId).catch(console.error);
  const primaryAction = parsePrimaryAction(data.primaryAction);
  if (primaryAction && navigateToScreen(primaryAction)) return;
  openNotificationsTab(data.notificationId);
};