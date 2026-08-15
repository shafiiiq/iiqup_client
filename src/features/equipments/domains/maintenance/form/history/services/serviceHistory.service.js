import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const createServiceHistory = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-history/add`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};
