import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchAllToolkitUsers = async () => {
  const [mechanicsRes, operatorsRes, officeUsersRes] = await Promise.all([
    apiRequest(`${API_URI}/mechanics/get-all-mechanic`, 'GET'),
    apiRequest(`${API_URI}/operators/get-all-operators`, 'GET'),
    apiRequest(`${API_URI}/users/get-all-users`, 'GET'),
  ]);

  const mechanics = mechanicsRes.ok ? ((await mechanicsRes.json()).data || []).map((mechanic) => ({ _id: mechanic._id, name: mechanic.name, type: 'Mechanic' })) : [];
  const operators = operatorsRes.ok ? ((await operatorsRes.json()).data || []).map((operator) => ({ _id: operator._id, name: operator.name, type: 'Operator' })) : [];
  const officeUsers = officeUsersRes.ok ? ((await officeUsersRes.json()).data?.office || []).map((user) => ({ _id: user._id, name: user.name, type: 'Office User' })) : [];
  return [...mechanics, ...operators, ...officeUsers];
};

export const fetchToolkits = async () => {
  const response = await apiRequest(`${API_URI}/toolkits/get-toolkits`);
  if (!response.ok) throw new Error('Failed to fetch toolkits');
  const result = await response.json();
  return Array.isArray(result.data) ? result.data : [];
};

export const fetchToolkitHistory = async (toolkitId) => {
  const response = await apiRequest(`${API_URI}/toolkits/toolkit-stock-history/${toolkitId}`);
  if (!response.ok) return [];
  const result = await response.json();
  return result.data?.variants || [];
};

export const fetchVariantHistory = async (toolkitId, variantId) => {
  const response = await apiRequest(`${API_URI}/toolkits/stock-history/${toolkitId}/${variantId}`);
  if (!response.ok) throw new Error('Failed to fetch stock history');
  const result = await response.json();
  return result.data?.stockHistory || [];
};

export const addToolkit = async (payload) => {
  const response = await apiRequest(`${API_URI}/toolkits/add-toolkits`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateToolkit = async (toolkitId, payload) => {
  const response = await apiRequest(`${API_URI}/toolkits/update-toolkit/${toolkitId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};

export const updateVariant = async (toolkitId, variantId, payload) => {
  const response = await apiRequest(`${API_URI}/toolkits/update-variant/${toolkitId}/${variantId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};

export const deleteToolkit = async (toolkitId) => {
  const response = await apiRequest(`${API_URI}/toolkits/delete-toolkit/${toolkitId}`, 'DELETE');
  return response;
};

export const deleteVariant = async (toolkitId, variantId) => {
  const response = await apiRequest(`${API_URI}/toolkits/delete-variant/${toolkitId}/${variantId}`, 'DELETE');
  const result = await response.json();
  return { response, result };
};

export const reduceToolkitStock = async (toolkitId, variantId, payload) => {
  const response = await apiRequest(`${API_URI}/toolkits/reduce-stock/${toolkitId}/${variantId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};
