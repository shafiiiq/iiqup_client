import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchBackchargeReports = async () => {
  const response = await apiRequest(`${API_URI}/backcharge/get-backcharge-reports`, 'GET');
  return response.json();
};

export const fetchPendingSignatures = async (uniqueCode) => {
  const response = await apiRequest(`${API_URI}/backcharge/pending-signatures`, 'POST', { uniqueCode: encodeURIComponent(uniqueCode) });
  return response.json();
};

export const fetchSignedByUser = async (uniqueCode) => {
  const response = await apiRequest(`${API_URI}/backcharge/signed-by-user`, 'POST', { uniqueCode: encodeURIComponent(uniqueCode) });
  return response.json();
};

export const deleteBackcharge = async (id) => {
  const response = await apiRequest(`${API_URI}/backcharge/delete-backcharge/${id}`, 'DELETE');
  return response;
};
