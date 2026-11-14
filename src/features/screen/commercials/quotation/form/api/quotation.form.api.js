import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchLatestQuotationRef = async () => {
  const response = await apiRequest(`/quotation/latest-refno`);
  return response.json();
};

export const getQuotationByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`/quotation/${decodedRef}`, 'GET');
  return response.json();
};

export const fetchCompanyDetails = async () => {
  const response = await apiRequest(`/quotation/company-details`);
  return response.json();
};

export const fetchItemDescriptions = async (search = '') => {
  const response = await apiRequest(`/quotation/item-descriptions?search=${encodeURIComponent(search)}`);
  return response.json();
};

export const createOrUpdateQuotation = async (endpoint, method, payload) => {
  const response = await apiRequest(endpoint, method, payload);
  return response.json();
};

export const fetchQuotationList = async (page = 1, limit = 20) => {
  const response = await apiRequest(`/quotation?page=${page}&limit=${limit}`, 'GET');
  return response.json();
};