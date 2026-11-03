import { useCallback, useEffect, useRef } from 'react';
import { markNotificationRead } from '@/features/core/messaging/notification/api/notification.counts.service';

const READ_FLUSH_DELAY_MS = 1000;

export const useNotificationReadTracking = ({ updateItem, onReadFlushed }) => {
  const pendingIdsRef = useRef(new Set());
  const confirmedIdsRef = useRef(new Set());
  const flushTimerRef = useRef(null);
  const callbacksRef = useRef({ updateItem, onReadFlushed });
  callbacksRef.current = { updateItem, onReadFlushed };

  const flushPendingReads = useCallback(async () => {
    clearTimeout(flushTimerRef.current);
    flushTimerRef.current = null;
    const notificationIds = [...pendingIdsRef.current];
    pendingIdsRef.current.clear();

    await Promise.allSettled(
      notificationIds.map(async (notificationId) => {
        confirmedIdsRef.current.add(notificationId);
        callbacksRef.current.updateItem(notificationId, { isRead: true });
        try {
          await markNotificationRead(notificationId);
        } catch (error) {
          confirmedIdsRef.current.delete(notificationId);
          callbacksRef.current.updateItem(notificationId, { isRead: false });
          console.error('markNotificationRead:', error);
        }
      })
    );
    if (notificationIds.length > 0) callbacksRef.current.onReadFlushed();
  }, []);

  const queueRead = useCallback(
    (notificationId) => {
      if (confirmedIdsRef.current.has(notificationId)) return;
      pendingIdsRef.current.add(notificationId);
      if (!flushTimerRef.current) flushTimerRef.current = setTimeout(flushPendingReads, READ_FLUSH_DELAY_MS);
    },
    [flushPendingReads]
  );

  useEffect(
    () => () => {
      flushPendingReads();
    },
    [flushPendingReads]
  );

  return { queueRead };
};