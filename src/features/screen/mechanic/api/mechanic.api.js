import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchAllMechanics = async () => {
  const response = await apiRequest('/users/mechanics');
  const json = await response.json();
  if (!json.success) return { data: [] };
  return { data: json.data || [] };
};

export const fetchRecentActivity = async (limit = 20) => {
  const response = await apiRequest(`/users/mechanics/recent-activity?limit=${limit}`);
  const json = await response.json();
  if (!json.success) return { data: [] };
  return { data: json.data || [] };
};

export const fetchMechanicAttendancePage = async (zktecoPin, query, { page, limit }) => {
  const emptyPage = { data: [], pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasMore: false } };

  if (!zktecoPin || !query) return emptyPage;

  const params = new URLSearchParams({ ...query, page, limit }).toString();
  const response = await apiRequest(`/users/mechanics/attendance/${zktecoPin}?${params}`);
  const json = await response.json();

  if (!json.success) return emptyPage;

  return { data: json.data.records || [], pagination: json.data.pagination };
};

export const updateMechanic = async (mechanicId, payload) => {
  const response = await apiRequest(`/users/mechanics/${mechanicId}`, 'PUT', payload);
  return response.json();
};

export const deleteMechanic = async (mechanicId) => apiRequest(`/users/mechanics/${mechanicId}`, 'DELETE');