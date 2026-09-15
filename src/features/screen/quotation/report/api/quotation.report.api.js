import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchQuotationByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  return apiRequest(`/quotation/${decodedRef}`, 'GET');
};

export const downloadQuotationPdf = async (refNo) => {
  return apiRequest(`/quotation/pdf/download/${encodeURIComponent(refNo)}`, 'GET');
};

export const submitQuotationPdf = async (refNo) => {
  return apiRequest(`/quotation/pdf/submit/${encodeURIComponent(refNo)}`, 'POST', {});
};

export const emailQuotationPdf = async (refNo, formData) => {
  return apiRequest(`/quotation/pdf/email/${encodeURIComponent(refNo)}`, 'POST', formData, true);
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

export const getPreSignedUrl = async (key, isLong = false, isAuthSign = true) => {
  return apiRequest(`/s3/pre-signed-url`, 'POST', { key, isLong, isAuthSign });
};

export const signQuotationDoc = async (refNo, payload) => {
  return apiRequest(`/quotation/sign/${encodeURIComponent(refNo)}`, 'POST', payload);
};

export const activateSignature = async (activationKey, signType, deviceInfo) => {
  return apiRequest(`/authz/activate-signature`, 'POST', { activationKey, signType, deviceInfo });
};