import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { countUnreadInRow, countUnreadInRows } from '../utils/notification.unread.count';

const INITIAL_SCROLL_DELAY_MS = 120;

const findCardElement = (notificationId) => document.querySelector(`[data-notification-id="${notificationId}"]`);

export const useNotificationUnreadAbove = ({ rows, tabId, isLoading, skipInitialScroll }) => {
  const [searchParams] = useSearchParams();
  const routeNotificationId = searchParams.get('notificationId');
  const [visibleNotificationIds, setVisibleNotificationIds] = useState(() => new Set());
  const handledTabRef = useRef(null);
  const sawLoadingRef = useRef(false);

  useEffect(() => {
    handledTabRef.current = null;
    sawLoadingRef.current = false;
    setVisibleNotificationIds(new Set());
  }, [tabId]);

  useEffect(() => {
    if (isLoading) {
      sawLoadingRef.current = true;
      return;
    }
    if (!sawLoadingRef.current || handledTabRef.current === tabId || rows.length === 0) return;
    handledTabRef.current = tabId;
    if (skipInitialScroll || routeNotificationId) return;

    let oldestUnreadIndex = -1;
    rows.forEach((row, index) => {
      if (row.rowKind === 'item' && !row.item.isRead) oldestUnreadIndex = index;
    });
    if (oldestUnreadIndex <= 1) return;

    const oldestUnreadId = rows[oldestUnreadIndex].item._id;
    setTimeout(() => {
      findCardElement(oldestUnreadId)?.scrollIntoView({ block: 'start' });
    }, INITIAL_SCROLL_DELAY_MS);
  }, [isLoading, rows, tabId, skipInitialScroll, routeNotificationId]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      setVisibleNotificationIds((previousIds) => {
        const nextIds = new Set(previousIds);
        entries.forEach((entry) => {
          const notificationId = entry.target.getAttribute('data-notification-id');
          if (entry.isIntersecting) nextIds.add(notificationId);
          else nextIds.delete(notificationId);
        });
        return nextIds;
      });
    });
    document.querySelectorAll('[data-notification-id]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rows]);

  const visibleIndexes = useMemo(
    () =>
      rows.reduce(
        (indexes, row, index) =>
          row.rowKind === 'item' && visibleNotificationIds.has(row.item._id) ? [...indexes, index] : indexes,
        []
      ),
    [rows, visibleNotificationIds]
  );

  const firstVisibleIndex = visibleIndexes.length > 0 ? Math.min(...visibleIndexes) : 0;
  const lastVisibleIndex = visibleIndexes.length > 0 ? Math.max(...visibleIndexes) : -1;

  const unreadAboveCount = useMemo(
    () => countUnreadInRows(rows.slice(0, firstVisibleIndex)),
    [rows, firstVisibleIndex]
  );

  const unreadBelowCount = useMemo(
    () => (lastVisibleIndex < 0 ? 0 : countUnreadInRows(rows.slice(lastVisibleIndex + 1))),
    [rows, lastVisibleIndex]
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToNextUnreadBelow = useCallback(() => {
    const targetIndex = rows.findIndex((row, index) => index > lastVisibleIndex && countUnreadInRow(row) > 0);
    if (targetIndex === -1) return;
    findCardElement(rows[targetIndex].item._id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [rows, lastVisibleIndex]);

  return { unreadAboveCount, unreadBelowCount, scrollToTop, scrollToNextUnreadBelow };
};