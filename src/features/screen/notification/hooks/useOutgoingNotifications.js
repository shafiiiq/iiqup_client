import { useCallback, useEffect, useRef, useState } from 'react';
import { OUTGOING_SENT_VISIBLE_MS } from '../constants/notification.outgoing';
import { deliverOutgoingPayload } from '../services/notification.outgoing.delivery';
import { readCurrentUserActor } from '../utils/notification.current.actor';
import { buildOutgoingNotification } from '../utils/notification.outgoing.builders';
import { createOutgoingId } from '../utils/notification.outgoing.utils';

export const useOutgoingNotifications = ({ onDelivered }) => {
  const [items, setItems] = useState([]);
  const payloadsRef = useRef({});
  const timersRef = useRef(new Set());
  const onDeliveredRef = useRef(onDelivered);
  onDeliveredRef.current = onDelivered;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const updateOutgoing = useCallback((pendingId, patch) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item._id === pendingId && item.outgoing ? { ...item, outgoing: { ...item.outgoing, ...patch } } : item
      )
    );
  }, []);

  const discard = useCallback((pendingId) => {
    delete payloadsRef.current[pendingId];
    setItems((previousItems) => previousItems.filter((item) => item._id !== pendingId));
  }, []);

  const deliver = useCallback(
    async (pendingId) => {
      const payload = payloadsRef.current[pendingId];
      if (!payload) return;
      updateOutgoing(pendingId, { status: 'sending', progress: 0, errorMessage: null, startedAt: Date.now() });
      try {
        await deliverOutgoingPayload(payload, (progress) => updateOutgoing(pendingId, { progress }));
        updateOutgoing(pendingId, { status: 'sent', progress: 1, errorMessage: null });
        const timerId = setTimeout(async () => {
          timersRef.current.delete(timerId);
          try {
            await onDeliveredRef.current();
          } catch (error) {
            console.error('onDelivered:', error);
          }
          discard(pendingId);
        }, OUTGOING_SENT_VISIBLE_MS);
        timersRef.current.add(timerId);
      } catch (error) {
        console.error('deliverOutgoingNotification:', error);
        updateOutgoing(pendingId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Failed to send',
        });
      }
    },
    [updateOutgoing, discard]
  );

  const enqueue = useCallback(
    (payload) => {
      const pendingId = createOutgoingId();
      payloadsRef.current[pendingId] = payload;
      const author = readCurrentUserActor();
      setItems((previousItems) => [buildOutgoingNotification({ pendingId, payload, author }), ...previousItems]);
      deliver(pendingId);
    },
    [deliver]
  );

  return { items, enqueue, retry: deliver, discard };
};