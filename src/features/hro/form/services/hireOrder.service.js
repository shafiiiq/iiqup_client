import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchLatestHireOrderRef = async () => {
  const response = await apiRequest(`${API_URI}/hire-order/check-latest-hire-order-ref`);
  return response.json();
};

export const getHireOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`${API_URI}/hire-order/get-hire-order-by-ref/${decodedRef}`, 'GET');
  return response.json();
};

export const fetchCompanyDetails = async () => {
  const response = await apiRequest(`${API_URI}/lpo/get-company-details`);
  return response.json();
};

export const createOrUpdateHireOrder = async (endpoint, method, payload) => {
  const response = await apiRequest(endpoint, method, payload);
  return response.json();
};
