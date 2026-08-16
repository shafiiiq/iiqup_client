import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const createServiceHistory = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-history/add`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};
