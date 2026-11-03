import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchNotificationCounts } from '@/features/core/messaging/notification/api/notification.counts.service';
import { notificationFeed } from '@/features/core/messaging/notification/feed/notification.feed';
import { fetchMentionTargets } from '../services/notification.reply.service';

export const useNotificationMentions = () => {
  const [targets, setTargets] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [requestKey, setRequestKey] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [nextTargets] = await Promise.all([fetchMentionTargets(), fetchNotificationCounts()]);
      setTargets(nextTargets);
      setActiveIndex((currentIndex) =>
        currentIndex !== null && currentIndex < nextTargets.length ? currentIndex : null
      );
    } catch (error) {
      console.error('refreshMentions:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    return notificationFeed.subscribe(() => {
      refresh();
    });
  }, [refresh]);

  const goToIndex = useCallback((index) => {
    setActiveIndex(index);
    setRequestKey((currentKey) => currentKey + 1);
  }, []);

  const openFirst = useCallback(() => {
    if (targets.length > 0) goToIndex(0);
  }, [targets.length, goToIndex]);

  const goToNext = useCallback(() => {
    if (activeIndex !== null && activeIndex < targets.length - 1) goToIndex(activeIndex + 1);
  }, [activeIndex, targets.length, goToIndex]);

  const goToPrevious = useCallback(() => {
    if (activeIndex !== null && activeIndex > 0) goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const activeTarget = useMemo(
    () => (activeIndex !== null && targets[activeIndex] ? { ...targets[activeIndex], requestKey } : null),
    [activeIndex, targets, requestKey]
  );

  return {
    targetCount: targets.length,
    activeTarget,
    isNavigating: activeIndex !== null,
    canGoPrevious: activeIndex !== null && activeIndex > 0,
    canGoNext: activeIndex !== null && activeIndex < targets.length - 1,
    openFirst,
    goToNext,
    goToPrevious,
    refresh,
  };
};