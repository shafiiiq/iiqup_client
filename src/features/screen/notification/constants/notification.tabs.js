export const ALL_NOTIFICATION_TAB = { id: 'all', tab: 'all', label: 'All', pendingCount: 0 };

export const DEFAULT_NOTIFICATION_TABS = [
  ALL_NOTIFICATION_TAB,
  { id: 'unread', tab: 'unread', label: 'Unread', pendingCount: 0 },
  { id: 'mentions', tab: 'mentions', label: 'Mentions', pendingCount: 0 },
];

export const NOTIFICATION_TAB_ICONS = {
  all: 'IconlyNotification',
  unread: 'IconlyMailUnread',
  mentions: 'IconlyMention',
};

export const DEFAULT_CATEGORY_ICON = 'FolderIcon';

export const NOTIFICATION_VIEW_MODES = {
  NOTIFICATION: 'notification',
  CATEGORY: 'category',
  PERSON: 'person',
};

export const NOTIFICATION_VIEW_MODE_OPTIONS = [
  { label: 'View as notification', value: NOTIFICATION_VIEW_MODES.NOTIFICATION, icon: 'IconlyNotification' },
  { label: 'View as category', value: NOTIFICATION_VIEW_MODES.CATEGORY, icon: 'IconlyCategory' },
];