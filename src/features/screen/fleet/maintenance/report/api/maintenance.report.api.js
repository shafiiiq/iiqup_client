import { apiRequest } from '@/features/core/network/api/api.request';

const HISTORY_BASE = `/maintenance/history`;
const REPORT_BASE = `/maintenance/report`;

export const fetchServiceReportBatch = async (resolvedUrl) => {
  const response = await apiRequest(resolvedUrl, 'GET');
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
};

export const fetchServiceHistoryRecord = async (serviceType, historyId) => {
  const response = await apiRequest(`${HISTORY_BASE}/record/${serviceType}/${historyId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service history data');
  return result.data;
};

export const fetchServiceReportRecord = async (reportId) => {
  const response = await apiRequest(`${REPORT_BASE}/record/${reportId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service report data');
  return result.data;
};

export const verifySixDigitPassword = async (password) =>
  apiRequest(`/authz/six-digit-auth/verify`, 'POST', { password });

export const requestDocumentOtp = async () =>
  apiRequest(`/otp/request`, 'POST', { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' });

export const verifyDocumentOtp = async (otp, userId) =>
  apiRequest(`/otp/verify`, 'POST', { email: 'DOCUMENT_VERIFIER_AUTH_MAIL', otp, userId });

export const generateDocumentSignatureKey = async (password) =>
  apiRequest(`/authz/sign-key`, 'POST', { password });

export const getDocumentSignatureUrl = async (signKey) =>
  apiRequest(`/s3/pre-signed-url`, 'POST', { key: signKey, isLong: false, isAuthSign: true });

export const deleteServiceReport = async (reportId) =>
  apiRequest(`${REPORT_BASE}/record/${reportId}`, 'DELETE');

export const downloadServiceReportPdf = async (path, fileName) => {
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

export const printServiceReportPdf = async (path) => {
  const response = await apiRequest(`/pdf/render`, 'POST', {
    path,
    width: 297,
    height: 420,
    download: false,
  });
  if (!response.ok) throw new Error('Failed to generate PDF');
  return response.blob();
};