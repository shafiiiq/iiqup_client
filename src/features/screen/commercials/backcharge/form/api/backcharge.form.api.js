import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchBackchargeReports = async () => {
  const response = await apiRequest(`/backcharge/get-backcharge-reports`, 'GET');
  return response.json();
};

export const checkLatestBackchargeRef = async () => {
  const response = await apiRequest(`/backcharge/check-latest-backcharge-ref`, 'GET');
  return response.json();
};

export const addBackcharge = async (payload) => {
  const response = await apiRequest(`/backcharge/add-backcharge`, 'POST', payload);
  return response;
};
