import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const getHireOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`${API_URI}/hire-order/get-hire-order-by-ref/${decodedRef}`, 'GET');
  return response.json();
};

export const verifyDeviceTrust = async (signType, deviceInfo) => {
  const response = await apiRequest(`${API_URI}/users/verify-device-trust`, 'POST', { signType, deviceInfo });
  return response.json();
};

export const getSignatureKey = async (signType, info, authRole) => {
  const payload = { deviceInfo: info };
  if (signType === 'authorized' && authRole === 'MANAGING DIRECTOR') {
    payload.authRole = 'MANAGING_DIRECTOR';
  }

  const response = await apiRequest(`${API_URI}/users/doc-oauth-${signType}-sign-key`, 'POST', payload);
  return response.json();
};

export const getPreSignedUrl = async (key, isLong = false, isAuthSign = true) => {
  const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key, isLong, isAuthSign });
  return response.json();
};

export const signHireOrder = async (refNo, payload) => {
  const response = await apiRequest(`${API_URI}/hire-order/sign/${encodeURIComponent(refNo)}`, 'POST', payload);
  return response;
};

export const sendHireOrderEmail = async (formData) => {
  const response = await apiRequest(`${API_URI}/hire-order/send-via-email`, 'POST', formData, true);
  return response;
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  const response = await apiRequest(`${API_URI}/users/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
  return response;
};

export const uploadHireOrder = async (payload) => {
  const response = await apiRequest(`${API_URI}/hire-order/upload-hire-order`, 'POST', payload, { 'Content-Type': 'application/json' });
  return response;
};
