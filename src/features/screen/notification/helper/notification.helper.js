export const getStoredUniqueCode = () => {
  try {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return userData.uniqueCode || '';
  } catch {
    return '';
  }
};

export const formatCategoryLabel = (category) => {
  if (!category) return 'General';
  return String(category).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const normalizeNotification = (raw, uniqueCode, readOverrides) => {
  const readByServer = Array.isArray(raw.readBy) && raw.readBy.some((r) => r.uniqueCode === uniqueCode);
  const readLocally = readOverrides?.has(raw._id);

  return {
    ...raw,
    type: raw.type || 'normal',
    category: raw.category || 'general',
    read: Boolean(readByServer || readLocally),
  };
};

export const getNotificationColor = (notification) => {
  switch (notification.priority) {
    case 'high':   return '#ef4444';
    case 'medium': return '#f97316';
    case 'low':    return '#10b981';
    default:       return '#64748b';
  }
};

export const getNotificationTitle = (notification) => notification.title || 'Notification';

export const getNotificationMessage = (notification) => {
  const { description, message } = notification;
  if (typeof description === 'string') return description;
  if (description && typeof description === 'object') {
    return description.message || JSON.stringify(description);
  }
  if (message) return message;
  return 'No description available';
};

export const formatNotificationTime = (notification) => {
  const raw = notification.time || notification.createdAt;
  if (!raw) return 'Recently';

  const diffSec = Math.floor((Date.now() - new Date(raw).getTime()) / 1000);
  if (diffSec < 60) return diffSec <= 1 ? 'just now' : `${diffSec} sec ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin === 1 ? '1 min ago' : `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;

  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 4) return diffWk === 1 ? '1 week ago' : `${diffWk} weeks ago`;

  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return diffMo === 1 ? '1 month ago' : `${diffMo} months ago`;

  const diffYr = Math.floor(diffMo / 12);
  return diffYr === 1 ? '1 year ago' : `${diffYr} years ago`;
};

export const NOTIFICATION_DATE_GROUPS = ['Just Now', 'Today', 'Yesterday', 'Last Week', 'Last Month', 'Older'];

export const resolveNotificationDateGroup = (rawDate) => {
  const date = new Date(rawDate);
  const now = new Date();
  const diffMinutes = (now - date) / 60000;

  if (diffMinutes < 60) return 'Just Now';

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfLastWeek = new Date(startOfToday);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const startOfLastMonth = new Date(startOfToday);
  startOfLastMonth.setDate(startOfLastMonth.getDate() - 30);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfLastWeek) return 'Last Week';
  if (date >= startOfLastMonth) return 'Last Month';
  return 'Older';
};

export const groupNotificationsByDate = (items) => {
  const buckets = new Map(NOTIFICATION_DATE_GROUPS.map((group) => [group, []]));

  items.forEach((item) => {
    const group = resolveNotificationDateGroup(item.time || item.createdAt);
    buckets.get(group).push(item);
  });

  return NOTIFICATION_DATE_GROUPS
    .map((label) => ({ label, items: buckets.get(label) }))
    .filter((section) => section.items.length > 0);
};

export const buildNotificationRows = (items) =>
  groupNotificationsByDate(items).flatMap((section) => [
    { kind: 'label', key: `label-${section.label}`, label: section.label },
    ...section.items.map((notification) => ({ kind: 'notification', key: notification._id, notification })),
  ]);