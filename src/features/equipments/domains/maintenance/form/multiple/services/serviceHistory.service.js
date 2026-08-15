import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const saveBatchServiceHistory = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-history/batch`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};
