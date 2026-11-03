import { acknowledgeDeliveredNotifications } from '../api/notification.delivery.service';
import { fetchDocumentUnseen } from '../api/notification.documents.service';
import { activityCountStore } from '../count/activity.count.store';
import { unreadCountStore } from '../count/unread.count.store';
import { notificationArrival } from '../arrival/notification.arrival';
import { notificationFeed } from '../feed/notification.feed';
import { scheduleLocalNotification } from '../local/local.notification.scheduler';
import { MAX_REMEMBERED_NOTIFICATION_IDS } from '../constant/notification.constant';

const rememberedNotificationIds = new Set();

const rememberNotificationId = (notificationId) => {
  rememberedNotificationIds.add(notificationId);
  if (rememberedNotificationIds.size <= MAX_REMEMBERED_NOTIFICATION_IDS) return;
  const oldestId = rememberedNotificationIds.values().next().value;
  if (oldestId) rememberedNotificationIds.delete(oldestId);
};

export const ingestIncomingNotification = async (payload, arrivalChannel) => {
  const { notificationId } = payload;
  const dedupeKey = payload.pushId || notificationId;
  if (!notificationId || !dedupeKey || rememberedNotificationIds.has(dedupeKey)) return;
  rememberNotificationId(dedupeKey);
  if (payload.pushId) acknowledgeDeliveredNotifications([payload.pushId]).catch(console.error);

  const serverUnreadCount = Number(payload.unreadCount);
  if (Number.isFinite(serverUnreadCount)) unreadCountStore.setUnreadCount(serverUnreadCount);
  else unreadCountStore.incrementUnreadCount();

  const mentionsUnread = Number(payload.mentionsUnread);
  const repliesUnread = Number(payload.repliesUnread);
  if (Number.isFinite(mentionsUnread) && Number.isFinite(repliesUnread)) {
    activityCountStore.setActivityCounts({ mentions: mentionsUnread, replies: repliesUnread });
  }

  notificationFeed.publish({ notificationId });
  fetchDocumentUnseen().catch(console.error);

  if (document.visibilityState === 'visible') {
    notificationArrival.publish(payload);
    return;
  }
  await scheduleLocalNotification({ ...payload, arrivalChannel }).catch((error) =>
    console.error('Failed to schedule local notification:', error)
  );
};

export const forgetAllNotificationIds = () => {
  rememberedNotificationIds.clear();
};