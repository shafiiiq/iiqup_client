import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchLpoByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  return apiRequest(`${API_URI}/lpo/get-lpo-by-ref/${decodedRef}`, 'GET');
};

export const fetchComplaintById = async (complaintId) => {
  return apiRequest(`${API_URI}/complaints/get-complaints/${complaintId}`, 'GET');
};

export const verifyDeviceTrust = async (signType, deviceInfo) => {
  return apiRequest(`${API_URI}/users/verify-device-trust`, 'POST', { signType, deviceInfo });
};

export const getSignatureKey = async (signType, info, authRole) => {
  const payload = { deviceInfo: info };
  if (signType === 'authorized' && authRole === 'MANAGING_DIRECTOR') {
    payload.authRole = 'MANAGING_DIRECTOR';
  }

  return apiRequest(`${API_URI}/users/doc-oauth-${signType}-sign-key`, 'POST', payload);
};

export const getPreSignedUrl = async (key, isLong = false, isLpoSign = false) => {
  return apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key, isLong, isLpoSign });
};

export const signLpo = async (refNo, payload) => {
  return apiRequest(`${API_URI}/lpo/sign/${encodeURIComponent(decodeURIComponent(refNo))}`, 'POST', payload);
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  return apiRequest(`${API_URI}/users/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
};

export const uploadLpo = async (uploadEndpoint, payload) => {
  return apiRequest(uploadEndpoint, 'POST', payload, { 'Content-Type': 'application/json' });
};

export const sendLpoViaEmail = async (formData) => {
  return apiRequest(`${API_URI}/lpo/send-via-email`, 'POST', formData, true);
};
