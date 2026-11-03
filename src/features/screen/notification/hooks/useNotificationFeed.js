import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationFeed } from '@/features/core/messaging/notification/feed/notification.feed';
import { fetchNotificationPage } from '../services/notification.list.service';
import { mergeNotificationPages, sortNotificationsByLastActivity } from '../utils/notification.list.merge';

const HEAD_REFRESH_DEBOUNCE_MS = 300;

export const useNotificationFeed = ({ selectedTab }) => {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const tabRef = useRef(selectedTab);
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(false);
  const generationRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  tabRef.current = selectedTab;
  cursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;

  const loadFirstPage = useCallback(async (isManualRefresh) => {
    generationRef.current += 1;
    const generation = generationRef.current;
    if (isManualRefresh) setIsRefreshing(true);
    else setIsInitialLoading(true);
    try {
      const page = await fetchNotificationPage({ tab: tabRef.current, before: null });
      if (generation !== generationRef.current) return;
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('loadFirstPage:', error);
    } finally {
      if (generation === generationRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    loadFirstPage(false);
  }, [selectedTab.id, loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current || !cursorRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const generation = generationRef.current;
    try {
      const page = await fetchNotificationPage({ tab: tabRef.current, before: cursorRef.current });
      if (generation !== generationRef.current) return;
      setItems((previousItems) => mergeNotificationPages(previousItems, page.items));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('loadMore:', error);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  const refreshHead = useCallback(async () => {
    const generation = generationRef.current;
    try {
      const page = await fetchNotificationPage({ tab: tabRef.current, before: null });
      if (generation !== generationRef.current) return;
      setItems((previousItems) => mergeNotificationPages(previousItems, page.items));
    } catch (error) {
      console.error('refreshHead:', error);
    }
  }, []);

  useEffect(() => {
    let timerId = null;
    const unsubscribe = notificationFeed.subscribe(() => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(refreshHead, HEAD_REFRESH_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timerId) clearTimeout(timerId);
    };
  }, [refreshHead]);

  const updateItem = useCallback((notificationId, patch) => {
    setItems((previousItems) =>
      sortNotificationsByLastActivity(
        previousItems.map((item) => {
          if (item._id !== notificationId) return item;
          return typeof patch === 'function' ? patch(item) : { ...item, ...patch };
        })
      )
    );
  }, []);

  const markAllLoadedAsRead = useCallback(() => {
    setItems((previousItems) => previousItems.map((item) => (item.isRead ? item : { ...item, isRead: true })));
  }, []);

  const refresh = useCallback(() => loadFirstPage(true), [loadFirstPage]);

  return {
    items,
    hasMore,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    loadMore,
    refresh,
    updateItem,
    markAllLoadedAsRead,
  };
};