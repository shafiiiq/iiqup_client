import { apiRequest } from '@/features/core/network/api/api.request';

export const getBackchargeByRef = async (refNo) => {
  const response = await apiRequest(`/backcharge/get-backcharge-by-ref/${encodeURIComponent(refNo)}`, 'GET');
  return response.json();
};

export const updateBackcharge = async (documentId, payload) => {
  const response = await apiRequest(`/backcharge/update-backcharge/${documentId}`, 'PUT', payload);
  return response.json();
};

export const sendBackchargeEmail = async (formData) => {
  const response = await apiRequest(`/backcharge/send-via-email`, 'POST', formData, true);
  return response.json();
};

export const downloadBackchargePdf = async (refNo) => {
  const response = await apiRequest(`/backcharge/pdf/download/${encodeURIComponent(refNo)}`, 'GET');
  const blob = await response.blob();
  if (!blob.size || !blob.type.includes('application/pdf')) throw new Error('PDF response was invalid');
  return new Blob([blob], { type: 'application/pdf' });
};