import { apiRequest } from '@/features/core/network/api/api.request';

const requestJson = async (path) => {
  const response = await apiRequest(path, 'GET');
  const body = await response.json();
  return body.data;
};

export const fetchHireOrderTotals = () =>
  requestJson('/order/hire/stats/totals');

export const fetchHireOrderSummary = (granularity) =>
  requestJson(`/order/hire/stats/summary?granularity=${granularity}`);

export const fetchHireOrderSeries = (granularity) =>
  requestJson(`/order/hire/stats/series?granularity=${granularity}`);

export const fetchHireOrderGrowth = (granularity) =>
  requestJson(`/order/hire/stats/growth?granularity=${granularity}`);