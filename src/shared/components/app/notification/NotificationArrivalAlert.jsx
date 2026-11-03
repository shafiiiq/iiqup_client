import { useEffect } from 'react';
import { notificationArrival } from '@/features/core/messaging/notification/arrival/notification.arrival';
import { useAlert } from '@/shared/context/AlertContext';

const NotificationArrivalAlert = () => {
  const { showAlert } = useAlert();

  useEffect(
    () =>
      notificationArrival.subscribe((payload) =>
        showAlert(payload.title || 'New notification', 'notifications_active', '--color-primary')
      ),
    [showAlert]
  );

  return null;
};

export default NotificationArrivalAlert;