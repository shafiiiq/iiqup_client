import { apiRequest } from '@/features/core/network/api/api.request';
import { readStoredUserData } from '@/features/core/device/storage/credentials/credentials.user.data';

export const fetchQuotations = async (page = 1, limit = 20) => {
  const response = await apiRequest(`/quotation?page=${page}&limit=${limit}`, 'GET');
  return response.json();
};

export const fetchPendingQuotationSignatures = async () => {
  const user = readStoredUserData();
  if (!user?.uniqueCode) return { data: [] };
  const response = await apiRequest(`/quotation/pending-signatures`, 'POST', { uniqueCode: user.uniqueCode });
  return response.json();
};

export const deleteQuotation = async (ref) => {
  const response = await apiRequest(`/quotation/${encodeURIComponent(ref)}`, 'DELETE');
  return response;
};