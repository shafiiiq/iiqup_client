import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from './notification.response';

export const fetchPendingNotifications = async () => {
  const body = await readResponseBody(
    await apiRequest('/notification/pending', 'GET'),
    'Failed to load pending notifications'
  );
  return body.data ?? [];
};

export const acknowledgeDeliveredNotifications = async (pushIds) => {
  if (pushIds.length === 0) return;
  const response = await apiRequest('/notification/delivered', 'PUT', { pushIds });
  if (!response.ok) throw new Error(`Failed to acknowledge delivered notifications: ${response.status}`);
};