import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchPurchaseOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  return apiRequest(`/order/purchase/${decodedRef}`, 'GET');
};

export const fetchComplaintById = async (complaintId) => {
  return apiRequest(`/complaints/get-complaints/${complaintId}`, 'GET');
};

export const verifyDeviceTrust = async (signType, deviceInfo) => {
  return apiRequest(`/authn/verify/device-trust`, 'POST', { signType, deviceInfo });
};

export const getSignatureKey = async (signType, info, authRole) => {
  const payload = { deviceInfo: info };
  if (signType === 'authorized' && authRole === 'MANAGING_DIRECTOR') {
    payload.authRole = 'MANAGING_DIRECTOR';
  }

  return apiRequest(`/authz/sign-key/${signType}`, 'POST', payload);
};

export const getPreSignedUrl = async (key, isLong = false, isPurchaseOrderSign = false) => {
  return apiRequest(`/s3/pre-signed-url`, 'POST', { key, isLong, isPurchaseOrderSign });
};

export const signPurchaseOrder = async (refNo, payload) => {
  return apiRequest(`/order/purchase/sign/${encodeURIComponent(decodeURIComponent(refNo))}`, 'POST', payload);
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  return apiRequest(`/authz/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
};

export const uploadPurchaseOrder = async (uploadEndpoint, payload) => {
  return apiRequest(uploadEndpoint, 'POST', payload, { 'Content-Type': 'application/json' });
};

export const sendPurchaseOrderViaEmail = async (formData) => {
  return apiRequest(`/order/purchase/send-via-email`, 'POST', formData, true);
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