import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchBackchargeReports = async () => {
  const response = await apiRequest(`${API_URI}/backcharge/get-backcharge-reports`, 'GET');
  return response.json();
};

export const checkLatestBackchargeRef = async () => {
  const response = await apiRequest(`${API_URI}/backcharge/check-latest-backcharge-ref`, 'GET');
  return response.json();
};

export const addBackcharge = async (payload) => {
  const response = await apiRequest(`${API_URI}/backcharge/add-backcharge`, 'POST', payload);
  return response;
};
