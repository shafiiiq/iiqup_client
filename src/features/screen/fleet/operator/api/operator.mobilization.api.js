import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchAllOperatorMobilizations = async () => {
  const response = await apiRequest(`/users/operators/all-mobilizations`, 'GET');
  return response.json();
};

export const fetchOperatorMobilizationHistory = async (operatorId) => {
  const response = await apiRequest(`/users/operators/mobilization-history/${operatorId}`, 'GET');
  return response.json();
};

export const mobilizeOperator = async (payload) => {
  const response = await apiRequest(`/users/operators/mobilize-operator`, 'POST', payload);
  return response.json();
};

export const demobilizeOperator = async (payload) => {
  const response = await apiRequest(`/users/operators/demobilize-operator`, 'POST', payload);
  return response.json();
};

export const fetchSiteOptions = async () => {
  const response = await apiRequest(`/equipments/sites`, 'GET');
  const result = await response.json();
  return Array.isArray(result.data) ? result.data : [];
};