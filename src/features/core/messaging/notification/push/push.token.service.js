import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '../api/notification.response';

export const registerWebPushSubscription = async (subscription) => {
  await readResponseBody(
    await apiRequest('/notification/token/web', 'POST', { subscription }),
    'Failed to register web push subscription'
  );
};

export const removeWebPushSubscription = async (endpoint) => {
  await readResponseBody(
    await apiRequest('/notification/token/web', 'DELETE', { endpoint }),
    'Failed to remove web push subscription'
  );
};