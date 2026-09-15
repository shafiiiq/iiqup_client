import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePagination } from '@/shared/pagination/usePagination';
import { useVirtualGrid } from '@/shared/scrolling/useVirtualGrid';
import { useInfiniteFetch } from '@/shared/scrolling/useInfiniteFetch';
import {
  fetchAllNotifications,
  fetchUnreadNotifications,
  fetchForYouNotifications,
  fetchHighPriorityNotifications,
  fetchUserSpecificNotifications,
  fetchCategoryNotifications,
} from '../api/notification.api';
import { normalizeNotification, buildNotificationRows } from '../helper/notification.helper';
import {
  ITEMS_PER_PAGE,
  NOTIFICATION_COLUMN_COUNT,
  NOTIFICATION_ROW_GAP,
  NOTIFICATION_ROW_ESTIMATE_HEIGHT,
} from '../constants/notification.constants';

const excludeAttendanceSourced = (list) => list.filter((notification) => notification.sourceId !== 'attendance');

const emptyNotificationPage = async () => ({
  data: [],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasMore: false },
});

const resolveFetcher = (activeTab) => {
  switch (activeTab.key) {
    case 'unread':
      return (pagination) => fetchUnreadNotifications(pagination).then((r) => ({ ...r, data: excludeAttendanceSourced(r.data) }));
    case 'foryou':
      return fetchForYouNotifications;
    case 'high':
      return fetchHighPriorityNotifications;
    case 'user_specific':
      return (pagination) => fetchUserSpecificNotifications(activeTab.sourceId, pagination);
    case 'category':
      return activeTab.category
        ? (pagination) => fetchCategoryNotifications(activeTab.category, pagination)
        : emptyNotificationPage;
    default:
      return (pagination) => fetchAllNotifications(pagination).then((r) => ({ ...r, data: excludeAttendanceSourced(r.data) }));
  }
};

export const useNotificationFeed = (activeTab, uniqueCode, readOverrides) => {
  const fetchFn = useMemo(
    () => resolveFetcher(activeTab),
    [activeTab.key, activeTab.sourceId, activeTab.category]
  );

  const pagination = usePagination(fetchFn, { page: 1, limit: ITEMS_PER_PAGE });
  const [liveItems, setLiveItems] = useState([]);

  useEffect(() => {
    pagination.reset();
    setLiveItems([]);
    pagination.fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab.key, activeTab.sourceId, activeTab.category]);

  const prependLive = useCallback((raw) => {
    setLiveItems((prev) => [{ ...raw, animate: true }, ...prev]);
    setTimeout(() => {
      setLiveItems((prev) => prev.map((n) => (n._id === raw._id ? { ...n, animate: false } : n)));
    }, 600);
  }, []);

  const knownIds = useMemo(() => new Set(pagination.data.map((n) => n._id)), [pagination.data]);
  const mergedRaw = useMemo(
    () => [...liveItems.filter((n) => !knownIds.has(n._id)), ...pagination.data],
    [liveItems, knownIds, pagination.data]
  );

  const items = useMemo(
    () => mergedRaw.map((n) => normalizeNotification(n, uniqueCode, readOverrides)),
    [mergedRaw, uniqueCode, readOverrides]
  );

  const rows = useMemo(() => buildNotificationRows(items), [items]);

  const virtualGrid = useVirtualGrid({
    items: rows,
    columnCount: NOTIFICATION_COLUMN_COUNT,
    estimateRowHeight: NOTIFICATION_ROW_ESTIMATE_HEIGHT,
    gap: NOTIFICATION_ROW_GAP,
  });

  useInfiniteFetch({
    virtualRows: virtualGrid.virtualRows,
    rowCount: virtualGrid.rowCount,
    hasMore: pagination.hasMore,
    isLoading: pagination.loading,
    onLoadMore: pagination.loadMore,
  });

  return {
    items,
    totalCount: pagination.totalCount,
    loading: pagination.loading,
    hasMore: pagination.hasMore,
    refresh: () => pagination.fetchPage(1, false),
    prependLive,
    virtualGrid,
  };
};