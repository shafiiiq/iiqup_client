import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchPurchaseOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  return apiRequest(`/order/purchase/${decodedRef}`, 'GET');
};

export const fetchComplaintById = async (complaintId) => {
  return apiRequest(`/complaints/get-complaints/${complaintId}`, 'GET');
};

export const getPreSignedUrl = async (key, isLong = false) => {
  return apiRequest(`/s3/pre-signed-url`, 'POST', { key, isLong });
};

export const downloadPurchaseOrderPdf = async (refNo, { isAmendment, complaintId } = {}) => {
  const params = new URLSearchParams();
  if (isAmendment) params.set('amendment', 'true');
  if (complaintId) params.set('complaintId', complaintId);
  const query = params.toString();
  return apiRequest(`/order/purchase/pdf/download/${encodeURIComponent(refNo)}${query ? `?${query}` : ''}`, 'GET');
};

export const submitPurchaseOrderPdf = async (refNo, payload) => {
  return apiRequest(`/order/purchase/pdf/submit/${encodeURIComponent(refNo)}`, 'POST', payload);
};

export const emailPurchaseOrderPdf = async (refNo, formData) => {
  return apiRequest(`/order/purchase/pdf/email/${encodeURIComponent(refNo)}`, 'POST', formData, true);
};