import { formatNotificationCount } from '../count/notification.count.format';

const TITLE_COUNT_PREFIX_PATTERN = /^\(\d+\+?\)\s/;

const applyDocumentTitleCount = (count) => {
  const baseTitle = document.title.replace(TITLE_COUNT_PREFIX_PATTERN, '');
  document.title = count > 0 ? `(${formatNotificationCount(count)}) ${baseTitle}` : baseTitle;
};

const applyAppIconBadge = async (count) => {
  try {
    if (count > 0 && navigator.setAppBadge) await navigator.setAppBadge(count);
    else if (navigator.clearAppBadge) await navigator.clearAppBadge();
  } catch {
    return;
  }
};

export const setBadgeCount = async (count) => {
  applyDocumentTitleCount(count);
  await applyAppIconBadge(count);
};

export const clearBadgeCount = () => setBadgeCount(0);