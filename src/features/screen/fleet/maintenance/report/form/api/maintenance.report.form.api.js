import { apiRequest } from '@/features/core/network/api/api.request';

const REPORT_BASE = `/maintenance/report`;

export const saveServiceReport = async (payload) => {
  const response = await apiRequest(REPORT_BASE, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateServiceReport = async (reportId, payload) => {
  const response = await apiRequest(`${REPORT_BASE}/record/${reportId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};