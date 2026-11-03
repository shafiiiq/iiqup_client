import { apiRequest } from '@/features/core/network/api/api.request';

const requestJson = async (path) => {
  const response = await apiRequest(path, 'GET');
  const body = await response.json();
  return body.data;
};

export const fetchQuotationTotals = () =>
  requestJson('/quotation/stats/totals');

export const fetchQuotationSummary = (granularity) =>
  requestJson(`/quotation/stats/summary?granularity=${granularity}`);

export const fetchQuotationSeries = (granularity) =>
  requestJson(`/quotation/stats/series?granularity=${granularity}`);

export const fetchQuotationGrowth = (granularity) =>
  requestJson(`/quotation/stats/growth?granularity=${granularity}`);