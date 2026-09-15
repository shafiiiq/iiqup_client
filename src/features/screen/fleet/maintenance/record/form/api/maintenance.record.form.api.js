import { apiRequest } from '@/features/core/network/api/api.request';

export const saveBatchServiceHistory = async (payload) => {
  const response = await apiRequest(`/maintenance/history/batch`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};
