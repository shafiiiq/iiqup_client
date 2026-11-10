import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchPurchaseOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  return apiRequest(`/order/purchase/${decodedRef}`, 'GET');
};

export const getPreSignedUrl = async (key, isLong = false) => {
  return apiRequest(`/s3/pre-signed-url`, 'POST', { key, isLong });
};

export const downloadPurchaseOrderPdf = async (refNo, { isAmendment, parts } = {}) => {
  const params = new URLSearchParams();
  if (isAmendment) params.set('amendment', 'true');
  if (parts) params.set('parts', parts);
  const query = params.toString();
  return apiRequest(`/order/purchase/pdf/download/${encodeURIComponent(refNo)}${query ? `?${query}` : ''}`, 'GET');
};

export const submitPurchaseOrderPdf = async (refNo, payload) => {
  return apiRequest(`/order/purchase/pdf/submit/${encodeURIComponent(refNo)}`, 'POST', payload);
};

export const emailPurchaseOrderPdf = async (refNo, formData) => {
  return apiRequest(`/order/purchase/pdf/email/${encodeURIComponent(refNo)}`, 'POST', formData, true);
};