import { useSyncExternalStore } from 'react';
import { activityCountStore } from './activity.count.store';
import { documentUnseenStore } from './document.unseen.store';
import { unreadCountStore } from './unread.count.store';

export const readTotalCount = () => {
  const { mentions, replies } = activityCountStore.getActivityCounts();
  return unreadCountStore.getUnreadCount() + mentions + replies + documentUnseenStore.getTotal();
};

export const subscribeToTotalCount = (listener) => {
  const unsubscribeFromUnread = unreadCountStore.subscribe(listener);
  const unsubscribeFromActivity = activityCountStore.subscribe(listener);
  const unsubscribeFromDocuments = documentUnseenStore.subscribe(listener);
  return () => {
    unsubscribeFromUnread();
    unsubscribeFromActivity();
    unsubscribeFromDocuments();
  };
};

export const useTotalNotificationCount = () => useSyncExternalStore(subscribeToTotalCount, readTotalCount);