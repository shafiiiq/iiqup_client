import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const saveBatchServiceHistory = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-history/batch`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};
