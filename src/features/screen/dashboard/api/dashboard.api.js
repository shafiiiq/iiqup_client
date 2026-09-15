import { apiRequest } from '@/features/core/network/api/api.request';

const requestJson = async (path) => {
  const response = await apiRequest(path, 'GET');
  const body = await response.json();
  return body.data;
};

export const fetchNumbers = (granularity) =>
  requestJson(`/dashboard/numbers?granularity=${granularity}`);

export const fetchTotals = () =>
  requestJson('/dashboard/totals');

export const fetchStats = (granularity) =>
  requestJson(`/dashboard/stats?granularity=${granularity}`);

export const fetchBreakdown = (key, field) =>
  requestJson(`/dashboard/breakdown/${key}?field=${field}`);

export const fetchRecentActivity = (limit = 20) =>
  requestJson(`/dashboard/recent?limit=${limit}`);

export const fetchSchema = () =>
  requestJson('/dashboard/schema');

export const fetchRecordsPage = async (key, granularity, page, limit) => {
  const response = await apiRequest(
    `/dashboard/records/${key}?granularity=${granularity}&page=${page}&limit=${limit}`,
    'GET'
  );
  const body = await response.json();
  return body.data;
};
