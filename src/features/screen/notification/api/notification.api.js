import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl } from '@/shared/pagination/pagination.util';

const EMPTY_LIST = { data: [], pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasMore: false } };
const EMPTY_STATS = { data: { total: 0, unread: 0, forYouUnread: 0 } };
const EMPTY_META = { data: [] };

const unwrap = async (response, fallback, tag) => {
  try {
    const data = await response.json();
    if (response.ok) return data;
    console.error(`[NotificationsApi] ${tag}`, data?.message || 'Request failed');
    return fallback;
  } catch (error) {
    console.error(`[NotificationsApi] ${tag}`, error);
    return fallback;
  }
};

const buildTabUrl = (path, extraParams = {}) => {
  const query = new URLSearchParams(
    Object.entries(extraParams).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  return query ? `/notification/tab/${path}?${query}` : `/notification/tab/${path}`;
};

export const fetchAllNotifications = (pagination) =>
  apiRequest(appendPaginationToUrl('/notification', pagination), 'GET')
    .then((response) => unwrap(response, EMPTY_LIST, 'fetchAllNotifications'));

export const fetchNotificationStats = () =>
  apiRequest('/notification/stats', 'GET').then((response) => unwrap(response, EMPTY_STATS, 'fetchNotificationStats'));

const fetchTabNotifications = (path, pagination, extraParams) =>
  apiRequest(appendPaginationToUrl(buildTabUrl(path, extraParams), pagination), 'GET')
    .then((response) => unwrap(response, EMPTY_LIST, `fetchTab:${path}`));

export const fetchUnreadNotifications = (pagination) => fetchTabNotifications('unread', pagination);
export const fetchForYouNotifications = (pagination) => fetchTabNotifications('foryou', pagination);
export const fetchHighPriorityNotifications = (pagination) => fetchTabNotifications('high-priority', pagination);

export const fetchUserSpecificNotifications = (sourceId, pagination) =>
  fetchTabNotifications('user-specific', pagination, sourceId ? { sourceId } : {});

export const fetchCategoryNotifications = (category, pagination) =>
  fetchTabNotifications('category', pagination, category ? { category } : {});

export const fetchUserSpecificTabsMeta = () =>
  apiRequest('/notification/tab/meta/user-tabs', 'GET').then((response) => unwrap(response, EMPTY_META, 'fetchUserSpecificTabsMeta'));

export const fetchModelCategoriesMeta = () =>
  apiRequest('/notification/tab/meta/categories', 'GET').then((response) => unwrap(response, EMPTY_META, 'fetchModelCategoriesMeta'));

export const markNotificationAsRead = (notificationId) =>
  apiRequest(`/notification/${notificationId}/read`, 'PUT', {})
    .then((response) => unwrap(response, { message: 'Failed to mark as read' }, 'markNotificationAsRead'));

export const markNotificationAsDelivered = (notificationId) =>
  apiRequest(`/notification/${notificationId}/delivered`, 'PUT', {})
    .then((response) => unwrap(response, { success: false }, 'markNotificationAsDelivered'));