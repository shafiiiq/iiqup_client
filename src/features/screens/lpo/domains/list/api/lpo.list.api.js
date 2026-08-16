import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

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
