import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

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
