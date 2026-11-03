import socketService from '@/features/core/network/socket/socket.service';
import { fetchDocumentUnseen } from '../api/notification.documents.service';
import { activityCountStore } from '../count/activity.count.store';
import { unreadCountStore } from '../count/unread.count.store';
import { notificationFeed } from '../feed/notification.feed';
import { ingestIncomingNotification } from '../ingest/notification.ingest';
import { publishNotificationTyping } from '../typing/notification.typing';

let unsubscribers = [];

const handleNewNotification = (payload) => {
  if (payload?.kind === 'notification') ingestIncomingNotification(payload, 'socket').catch(console.error);
};

const handleNotificationCounts = (payload) => {
  unreadCountStore.setUnreadCount(Number(payload.unreadCount));
  activityCountStore.setActivityCounts({
    mentions: Number(payload.mentionsUnread),
    replies: Number(payload.repliesUnread),
  });
  fetchDocumentUnseen().catch(console.error);
};

const handleNotificationTyping = (payload) => {
  publishNotificationTyping({
    notificationId: String(payload.notificationId),
    uniqueCode: String(payload.uniqueCode),
    name: String(payload.name),
    isTyping: Boolean(payload.isTyping),
  });
};

const handleNotificationActivity = (payload) => {
  notificationFeed.publish({ notificationId: payload.notificationId ?? null, replyId: payload.replyId ?? null });
};

export const removeSocketNotificationListeners = () => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
};

export const registerSocketNotificationListeners = () => {
  removeSocketNotificationListeners();
  unsubscribers = [
    socketService.on('new_notification', handleNewNotification),
    socketService.on('notification_counts', handleNotificationCounts),
    socketService.on('notification_typing', handleNotificationTyping),
    socketService.on('notification_activity', handleNotificationActivity),
  ];
};