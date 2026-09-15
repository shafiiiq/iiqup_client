import { apiRequest } from '@/features/core/network/api/api.request';

const requestJson = async (path) => {
  const response = await apiRequest(path, 'GET');
  const body = await response.json();
  return body.data;
};

export const fetchPurchaseOrderTotals = () =>
  requestJson('/order/purchase/stats/totals');

export const fetchPurchaseOrderSummary = (granularity) =>
  requestJson(`/order/purchase/stats/summary?granularity=${granularity}`);

export const fetchPurchaseOrderSeries = (granularity) =>
  requestJson(`/order/purchase/stats/series?granularity=${granularity}`);

export const fetchPurchaseOrderGrowth = (granularity) =>
  requestJson(`/order/purchase/stats/growth?granularity=${granularity}`);