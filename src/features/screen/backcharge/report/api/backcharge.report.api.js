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

export const verifyDeviceTrust = async (signType, deviceInfo) => {
  const response = await apiRequest(`/authn/verify/device-trust`, 'POST', { signType, deviceInfo });
  return response.json();
};

export const getBackchargeSignatureKey = async (endpoint, deviceInfo) => {
  const response = await apiRequest(`/users/${endpoint}`, 'POST', { deviceInfo });
  return response.json();
};

export const getPreSignedUrl = async (key) => {
  const response = await apiRequest(`/s3/pre-signed-url`, 'POST', { key, isLong: false, isPurchaseOrderSign: true });
  return response.json();
};

export const signBackcharge = async (refNo, payload) => {
  const response = await apiRequest(`/backcharge/sign/${encodeURIComponent(refNo)}`, 'POST', payload);
  return response.json();
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  const response = await apiRequest(`/authz/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
  return response.json();
};

export const downloadBackchargePdf = async (path, fileName) => {
  const response = await apiRequest(`/pdf/render`, 'POST', {
    path,
    width: 297,
    height: 420,
    download: true,
    fileName,
  });
  if (!response.ok) throw new Error('Failed to generate PDF');
  return response.blob();
};