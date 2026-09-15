import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchQuotations = async () => {
  const response = await apiRequest(`/quotation`, 'GET');
  return response.json();
};

export const deleteQuotation = async (ref) => {
  const response = await apiRequest(`/quotation/${encodeURIComponent(ref)}`, 'DELETE');
  return response;
};