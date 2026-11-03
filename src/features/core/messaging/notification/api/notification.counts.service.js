import { apiRequest } from '@/features/core/network/api/api.request';
import { activityCountStore } from '../count/activity.count.store';
import { unreadCountStore } from '../count/unread.count.store';
import { readResponseBody } from './notification.response';

const parseCounts = (data) => ({
  unread: data?.unread ?? data?.unreadCount ?? 0,
  mentionsUnread: data?.mentionsUnread ?? 0,
  repliesUnread: data?.repliesUnread ?? 0,
});

export const applyNotificationCounts = (counts) => {
  unreadCountStore.setUnreadCount(counts.unread);
  activityCountStore.setActivityCounts({ mentions: counts.mentionsUnread, replies: counts.repliesUnread });
};

export const fetchNotificationCounts = async () => {
  const body = await readResponseBody(await apiRequest('/notification/counts', 'GET'), 'Failed to load counts');
  const counts = parseCounts(body.data);
  applyNotificationCounts(counts);
  return counts;
};

export const markNotificationRead = async (notificationId) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/${notificationId}/read`, 'PUT'),
    'Failed to mark notification as read'
  );
  const counts = parseCounts(body.data);
  applyNotificationCounts(counts);
  return counts.unread;
};

export const markAllNotificationsRead = async () => {
  const body = await readResponseBody(
    await apiRequest('/notification/read-all', 'PUT'),
    'Failed to mark all as read'
  );
  const counts = parseCounts(body.data);
  applyNotificationCounts(counts);
  return counts.unread;
};