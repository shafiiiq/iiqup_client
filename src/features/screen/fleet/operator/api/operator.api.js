import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl, extractPaginationResult } from '@/shared/pagination/pagination.util';

export const fetchOperators = async (pagination) => {
  const url = appendPaginationToUrl(`/users/operators`, pagination);
  const response = await apiRequest(url);
  if (!response.ok) throw new Error('Failed to fetch operators');
  const result = await response.json();
  return extractPaginationResult(result);
};

export const getOperatorProfilePicUrl = async (filePath) => {
  if (!filePath) return null;
  try {
    const response = await apiRequest(`/s3/pre-signed-url`, 'POST', { key: filePath, isLong: false });
    if (!response.ok) return null;
    const data = await response.json();
    return data.dataUrl || null;
  } catch {
    return null;
  }
};

export const uploadOperatorProfilePic = async (qatarId, profilePicFile) => {
  const response = await apiRequest(`/users/operators/profile`, 'POST', { qatarId }, {}, profilePicFile);
  return response;
};

export const createOperator = async (payload) => {
  const response = await apiRequest(`/users/operators/add-operator`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateOperator = async (qatarId, payload) => {
  const response = await apiRequest(`/users/operators/${qatarId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};

export const deleteOperator = async (qatarId) => {
  const response = await apiRequest(`/users/operators/${qatarId}`, 'DELETE');
  return response;
};