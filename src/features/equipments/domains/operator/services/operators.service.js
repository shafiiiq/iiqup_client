import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchOperators = async () => {
  const response = await apiRequest(`${API_URI}/operators/get-all-operators`);
  if (!response.ok) throw new Error('Failed to fetch operators');
  const result = await response.json();
  return Array.isArray(result.data) ? result.data : [];
};

export const getOperatorProfilePicUrl = async (filePath) => {
  if (!filePath) return null;
  try {
    const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: false });
    if (!response.ok) return null;
    const data = await response.json();
    return data.dataUrl || null;
  } catch {
    return null;
  }
};

export const uploadOperatorProfilePic = async (qatarId, profilePicFile) => {
  const response = await apiRequest(`${API_URI}/operators/upload-profile-pic`, 'POST', { qatarId }, {}, profilePicFile);
  return response;
};

export const createOperator = async (payload) => {
  const response = await apiRequest(`${API_URI}/operators/add-operator`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateOperator = async (qatarId, payload) => {
  const response = await apiRequest(`${API_URI}/operators/update-operator/${qatarId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};

export const deleteOperator = async (qatarId) => {
  const response = await apiRequest(`${API_URI}/operators/delete-operator/${qatarId}`, 'DELETE');
  return response;
};
