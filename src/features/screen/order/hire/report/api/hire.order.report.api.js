import { apiRequest } from '@/features/core/network/api/api.request';

export const getHireOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`/order/hire/get-hire-order-by-ref/${decodedRef}`, 'GET');
  return response.json();
};

export const verifyDeviceTrust = async (signType, deviceInfo) => {
  const response = await apiRequest(`/authn/verify/device-trust`, 'POST', { signType, deviceInfo });
  return response.json();
};

export const getSignatureKey = async (signType, info, authRole) => {
  const payload = { deviceInfo: info };
  if (signType === 'authorized' && authRole === 'MANAGING_DIRECTOR') {
    payload.authRole = 'MANAGING_DIRECTOR';
  }

  const response = await apiRequest(`/authz/sign-key/${signType}`, 'POST', payload);
  return response.json();
};

export const getPreSignedUrl = async (key, isLong = false, isAuthSign = true) => {
  const response = await apiRequest(`/s3/pre-signed-url`, 'POST', { key, isLong, isAuthSign });
  return response.json();
};

export const signHireOrder = async (refNo, payload) => {
  const response = await apiRequest(`/order/hire/sign/${encodeURIComponent(refNo)}`, 'POST', payload);
  return response;
};

export const sendHireOrderEmail = async (formData) => {
  const response = await apiRequest(`/order/hire/send-via-email`, 'POST', formData, true);
  return response;
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  const response = await apiRequest(`/authz/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
  return response;
};

export const uploadHireOrder = async (payload) => {
  const response = await apiRequest(`/order/hire/upload-hire-order`, 'POST', payload, { 'Content-Type': 'application/json' });
  return response;
};

export const downloadHireOrderPdf = async (path, fileName) => {
  const response = await apiRequest(`/pdf/render`, 'POST', {
    path,
    width: 297,
    height: 420,
    download: true,
    fileName,
  });
  if (!response.ok) throw new Error('Failed to generate PDF');

  const blob = await response.blob();
  if (!blob.size || !blob.type.includes('application/pdf')) throw new Error('PDF response was invalid');

  return new Blob([blob], { type: 'application/pdf' });
};