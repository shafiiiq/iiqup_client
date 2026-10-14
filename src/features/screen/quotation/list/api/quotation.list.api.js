import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchQuotations = async (page = 1, limit = 20) => {
  const response = await apiRequest(`/quotation?page=${page}&limit=${limit}`, 'GET');
  return response.json();
};

export const deleteQuotation = async (ref) => {
  const response = await apiRequest(`/quotation/${encodeURIComponent(ref)}`, 'DELETE');
  return response;
};