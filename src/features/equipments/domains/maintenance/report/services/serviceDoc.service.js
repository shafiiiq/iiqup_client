import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchServiceReportBatch = async (resolvedUrl) => {
  const response = await apiRequest(resolvedUrl, 'GET');
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
};

export const fetchServiceHistoryRecord = async (serviceType, historyId) => {
  const response = await apiRequest(`${API_URI}/service-history/get-by-id/${serviceType}/${historyId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service history data');
  return result.data;
};

export const fetchServiceReportRecord = async (reportId) => {
  const response = await apiRequest(`${API_URI}/service-report/get-report/with-id/${reportId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service report data');
  return result.data;
};

export const verifySixDigitPassword = async (password) => {
  return apiRequest(`${API_URI}/users/six-digit-auth/verify`, 'POST', { password });
};

export const requestDocumentOtp = async () => {
  return apiRequest(`${API_URI}/otp/request`, 'POST', { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' });
};

export const verifyDocumentOtp = async (otp, userId) => {
  return apiRequest(`${API_URI}/otp/verify`, 'POST', { email: 'DOCUMENT_VERIFIER_AUTH_MAIL', otp, userId });
};

export const generateDocumentSignatureKey = async (password) => {
  return apiRequest(`${API_URI}/users/doc-oauth-sign-key`, 'POST', { password });
};

export const getDocumentSignatureUrl = async (signKey) => {
  return apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key: signKey, isLong: false, isAuthSign: true });
};

export const deleteServiceReport = async (reportId) => {
  return apiRequest(`${API_URI}/service-report/deletewith/${reportId}`, 'DELETE');
};
