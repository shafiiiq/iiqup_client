import { useCallback, useEffect, useRef, useState } from 'react';
import { useActivityCounts } from '@/features/core/messaging/notification/count/activity.count.store';
import { useUnreadCount } from '@/features/core/messaging/notification/count/unread.count.store';
import { notificationFeed } from '@/features/core/messaging/notification/feed/notification.feed';
import { NOTIFICATION_VIEW_MODES } from '../constants/notification.tabs';
import { fetchCategorySummaries, fetchPersonSummaries } from '../services/notification.summary.service';

const SUMMARY_RELOAD_DEBOUNCE_MS = 400;

export const useNotificationSummaries = (viewMode) => {
  const unreadCount = useUnreadCount();
  const activityCounts = useActivityCounts();
  const isCategoryMode = viewMode === NOTIFICATION_VIEW_MODES.CATEGORY;
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const reloadTimerRef = useRef(null);

  const loadPeople = useCallback(async (shouldShowLoader) => {
    if (shouldShowLoader) setIsPeopleLoading(true);
    try {
      setPeople(await fetchPersonSummaries());
    } catch (error) {
      console.error('loadPeople:', error);
    } finally {
      setIsPeopleLoading(false);
    }
  }, []);

  const loadCategories = useCallback(
    async (shouldShowLoader) => {
      if (!isCategoryMode) return;
      if (shouldShowLoader) setIsCategoriesLoading(true);
      try {
        setCategories(await fetchCategorySummaries());
      } catch (error) {
        console.error('loadCategories:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    },
    [isCategoryMode]
  );

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      loadPeople(false);
      loadCategories(false);
    }, SUMMARY_RELOAD_DEBOUNCE_MS);
  }, [loadPeople, loadCategories]);

  useEffect(() => {
    loadPeople(true);
  }, [loadPeople]);

  useEffect(() => {
    loadCategories(true);
  }, [loadCategories]);

  useEffect(
    () => () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    },
    []
  );

  useEffect(() => notificationFeed.subscribe(scheduleReload), [scheduleReload]);

  useEffect(() => {
    scheduleReload();
  }, [unreadCount, activityCounts.mentions, activityCounts.replies, scheduleReload]);

  return { categories, people, isCategoriesLoading, isPeopleLoading };
};