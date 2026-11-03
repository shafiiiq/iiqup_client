import { clearBadgeCount } from '../local/notification.badge.service';
import { activityCountStore } from './activity.count.store';
import { documentUnseenStore } from './document.unseen.store';
import { unreadCountStore } from './unread.count.store';

export const resetNotificationCounts = () => {
  unreadCountStore.setUnreadCount(0);
  activityCountStore.setActivityCounts({ mentions: 0, replies: 0 });
  documentUnseenStore.reset();
  clearBadgeCount();
};