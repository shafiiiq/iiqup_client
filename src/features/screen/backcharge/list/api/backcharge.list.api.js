import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl } from '@/shared/pagination/pagination.util';

export const fetchBackchargeReports = async (pagination) => {
  const url = appendPaginationToUrl(`/backcharge/get-backcharge-reports`, pagination);
  const response = await apiRequest(url, 'GET');
  return response.json();
};

export const fetchBackchargeTotals = async () => {
  const response = await apiRequest(`/backcharge/stats/totals`, 'GET');
  const result = await response.json();
  return result.data;
};

export const fetchBackchargeSummary = async (granularity) => {
  const response = await apiRequest(`/backcharge/stats/summary?granularity=${granularity}`, 'GET');
  const result = await response.json();
  return result.data;
};

export const fetchBackchargeSeries = async (granularity) => {
  const response = await apiRequest(`/backcharge/stats/series?granularity=${granularity}`, 'GET');
  const result = await response.json();
  return result.data;
};

export const fetchBackchargeGrowth = async (granularity) => {
  const response = await apiRequest(`/backcharge/stats/growth?granularity=${granularity}`, 'GET');
  const result = await response.json();
  return result.data;
};

export const fetchPendingSignatures = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.uniqueCode) return { data: [], count: 0 };

    const response = await apiRequest(`/backcharge/pending-signatures`, 'POST', {
      uniqueCode: encodeURIComponent(user.uniqueCode),
    });

    return response.json();
  } catch (error) {
    console.error('[BackchargeService] fetchPendingSignatures:', error);
    return { data: [], count: 0 };
  }
};

export const fetchSignedByUser = async (uniqueCode) => {
  const response = await apiRequest(`/backcharge/who-signed`, 'POST', { uniqueCode: encodeURIComponent(uniqueCode) });
  return response.json();
};

export const deleteBackcharge = async (id) => {
  const response = await apiRequest(`/backcharge/delete-backcharge/${id}`, 'DELETE');
  return response;
};