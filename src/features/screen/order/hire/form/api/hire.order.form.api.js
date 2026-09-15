import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchLatestHireOrderRef = async () => {
  const response = await apiRequest(`/order/hire/check-latest-hire-order-ref`);
  return response.json();
};

export const getHireOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`/order/hire/get-hire-order-by-ref/${decodedRef}`, 'GET');
  return response.json();
};

export const fetchCompanyDetails = async () => {
  const response = await apiRequest(`/order/hire/company-details`);
  return response.json();
};

export const createOrUpdateHireOrder = async (endpoint, method, payload) => {
  const response = await apiRequest(endpoint, method, payload);
  return response.json();
};
