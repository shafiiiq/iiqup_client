import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const saveServiceReport = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-report/add-service-report`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateServiceReport = async (reportId, payload) => {
  const response = await apiRequest(`${API_URI}/service-report/updatewith/${reportId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};
