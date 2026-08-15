import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchLpoList = async ({ isEquip, isStock, isForAllEquip, regNo }) => {
  let url = `${API_URI}/lpo/get-all-lpo`;

  if (isEquip && regNo) {
    url = `${API_URI}/lpo/get-lpo-by-regno/${regNo}`;
  } else if (isStock) {
    url = `${API_URI}/lpo/get-lpo-of-stock`;
  } else if (isForAllEquip) {
    url = `${API_URI}/lpo/get-lpo-of-all-equipments`;
  }

  const response = await apiRequest(url, 'GET');
  return response.json();
};

export const fetchPendingSignatures = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.uniqueCode) return { data: [], count: 0 };

    const pendingRes = await apiRequest(`${API_URI}/lpo/pending-signatures`, 'POST', {
      uniqueCode: encodeURIComponent(user.uniqueCode),
    });

    return pendingRes.json();
  } catch (error) {
    console.error('[LpoService] fetchPendingSignatures:', error);
    return { data: [], count: 0 };
  }
};

export const deleteLpo = async (lpoRef) => {
  const response = await apiRequest(`${API_URI}/lpo/delete-lpo/${lpoRef}`, 'DELETE');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete LPO');
  }

  return response;
};

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
