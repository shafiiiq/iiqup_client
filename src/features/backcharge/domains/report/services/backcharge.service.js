import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const getBackchargeByRef = async (refNo) => {
  const response = await apiRequest(`${API_URI}/backcharge/get-backcharge-by-ref/${encodeURIComponent(refNo)}`, 'GET');
  return response;
};

export const updateBackcharge = async (documentId, payload) => {
  const response = await apiRequest(`${API_URI}/backcharge/update-backcharge/${documentId}`, 'PUT', payload);
  return response;
};

export const sendBackchargeEmail = async (formData) => {
  const response = await apiRequest(`${API_URI}/backcharge/send-via-email`, 'POST', formData, true);
  return response;
};

export const verifyDeviceTrust = async (signType, deviceInfo) => {
  const response = await apiRequest(`${API_URI}/users/verify-device-trust`, 'POST', { signType, deviceInfo });
  return response.json();
};

export const getBackchargeSignatureKey = async (endpoint, deviceInfo) => {
  const response = await apiRequest(`${API_URI}/users/${endpoint}`, 'POST', { deviceInfo });
  return response.json();
};

export const getPreSignedUrl = async (key) => {
  const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key, isLong: false, isLpoSign: true });
  return response.json();
};

export const signBackcharge = async (refNo, payload) => {
  const response = await apiRequest(`${API_URI}/backcharge/sign/${encodeURIComponent(refNo)}`, 'POST', payload);
  return response;
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  const response = await apiRequest(`${API_URI}/users/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
  return response;
};
