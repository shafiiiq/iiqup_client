import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchNormalNotifications = async (uniqueCode, page = 1, limit = 100) => {
  try {
    const response = await apiRequest(
      `${API_URI}/notification/get-all-notification`,
      'POST',
      { uniqueCode, page, limit }
    );
    const data = await response.json();

    if (response.ok && data.status === 200) {
      return {
        hasMore: data.pagination?.hasMore ?? false,
        notifications: (data.data || [])
          .filter((n) => n.sourceId !== 'attendance')
          .map((n) => ({ ...n, type: 'normal', read: true })),
      };
    }

    console.error('[NotificationsService] fetchNormalNotifications:', data.message);
    return { hasMore: false, notifications: [] };
  } catch (error) {
    console.error('[NotificationsService] fetchNormalNotifications:', error);
    return { hasMore: false, notifications: [] };
  }
};
