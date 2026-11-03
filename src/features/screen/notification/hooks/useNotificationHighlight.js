import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const HIGHLIGHT_DURATION_MS = 5800;
const SCROLL_DELAY_MS = 150;

export const useNotificationHighlight = ({ rows, hasMore, loadMore, navigationTarget }) => {
  const [searchParams] = useSearchParams();
  const routeNotificationId = searchParams.get('notificationId');
  const [highlightedNotificationId, setHighlightedNotificationId] = useState(null);
  const handledRequestKeyRef = useRef(null);
  const timersRef = useRef([]);

  const target = useMemo(() => {
    if (navigationTarget) return navigationTarget;
    if (!routeNotificationId) return null;
    return { notificationId: routeNotificationId, requestKey: routeNotificationId, highlightCard: true };
  }, [navigationTarget, routeNotificationId]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  useEffect(() => {
    if (!target || handledRequestKeyRef.current === target.requestKey) return;

    const isTargetLoaded = rows.some((row) => row.rowKind === 'item' && row.item._id === target.notificationId);
    if (!isTargetLoaded) {
      if (hasMore) loadMore();
      return;
    }

    handledRequestKeyRef.current = target.requestKey;

    if (target.highlightCard) {
      setHighlightedNotificationId(target.notificationId);
      timersRef.current.push(setTimeout(() => setHighlightedNotificationId(null), HIGHLIGHT_DURATION_MS));
    }

    timersRef.current.push(
      setTimeout(() => {
        document
          .querySelector(`[data-notification-id="${target.notificationId}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, SCROLL_DELAY_MS)
    );
  }, [target, rows, hasMore, loadMore]);

  return { highlightedNotificationId };
};