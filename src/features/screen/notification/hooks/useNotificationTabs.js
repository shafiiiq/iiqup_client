import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActivityCounts } from '@/features/core/messaging/notification/count/activity.count.store';
import { useUnreadCount } from '@/features/core/messaging/notification/count/unread.count.store';
import { notificationFeed } from '@/features/core/messaging/notification/feed/notification.feed';
import { ALL_NOTIFICATION_TAB, DEFAULT_NOTIFICATION_TABS } from '../constants/notification.tabs';
import { fetchNotificationTabs } from '../services/notification.list.service';

const TAB_RELOAD_DEBOUNCE_MS = 400;

export const useNotificationTabs = () => {
  const unreadCount = useUnreadCount();
  const activityCounts = useActivityCounts();
  const [tabs, setTabs] = useState(DEFAULT_NOTIFICATION_TABS);
  const [selectedTabId, setSelectedTabId] = useState(ALL_NOTIFICATION_TAB.id);
  const reloadTimerRef = useRef(null);

  const reloadTabs = useCallback(async () => {
    try {
      setTabs(await fetchNotificationTabs());
    } catch (error) {
      console.error('fetchNotificationTabs:', error);
    }
  }, []);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(reloadTabs, TAB_RELOAD_DEBOUNCE_MS);
  }, [reloadTabs]);

  useEffect(() => {
    reloadTabs();
    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [reloadTabs]);

  useEffect(() => notificationFeed.subscribe(scheduleReload), [scheduleReload]);

  useEffect(() => {
    scheduleReload();
  }, [unreadCount, activityCounts.mentions, activityCounts.replies, scheduleReload]);

  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.id === selectedTabId) ?? ALL_NOTIFICATION_TAB,
    [tabs, selectedTabId]
  );

  return { tabs, selectedTab, selectTab: setSelectedTabId, reloadTabs };
};