import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchLpoByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`${API_URI}/lpo/get-lpo-by-ref/${decodedRef}`, 'GET');
  return response.json();
};

export const fetchLatestLpoRef = async () => {
  const response = await apiRequest(`${API_URI}/lpo/check-latest-lpo-ref`);
  return response.json();
};

export const fetchEquipments = async (searchTerm = '') => {
  const response = searchTerm.trim()
    ? await apiRequest(`${API_URI}/equipments/search-equipments`, 'POST', { searchTerm, page: 1, limit: 1000 })
    : await apiRequest(`${API_URI}/equipments/get-equipments?page=1&limit=1000`, 'GET');

  return response.json();
};

export const fetchCompanies = async () => {
  const response = await apiRequest(`${API_URI}/lpo/get-company-details`);
  return response.json();
};

export const createOrUpdateLpo = async (endpoint, method, payload) => {
  const response = await apiRequest(endpoint, method, payload);
  return response.json();
};

export const createComplaintLpo = async (complaintId, complaintPayload) => {
  const response = await apiRequest(`${API_URI}/complaints/create-lpo/${complaintId}`, 'POST', complaintPayload);
  return response.json();
};

export const getQuotationUploadUrl = async (fileName, lpoRef, contentType) => {
  const response = await apiRequest(`${API_URI}/lpo/get-quotation-upload-url`, 'POST', {
    fileName,
    lpoRef,
    contentType,
  });
  return response.json();
};

export const getPreSignedUrl = async (filePath, isLong = false) => {
  const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong });
  return response.json();
};
