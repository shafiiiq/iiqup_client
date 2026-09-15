import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchStockEquipments = async () => {
  const response = await apiRequest(`/equipments`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch equipments');
  return response.json();
};

export const fetchAllUsers = async () => {
  const response = await apiRequest(`/users/staff`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchStocks = async () => {
  const response = await apiRequest(`/stocks/get-all-stocks`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch stocks');
  return response.json();
};

export const updateStockQuantity = async (stockId, updateData) => {
  const response = await apiRequest(`/stocks/update-quantity/${stockId}`, 'PUT', updateData);
  const result = await response.json();
  return { response, result };
};

export const addStock = async (submitData) => {
  const response = await apiRequest(`/stocks/add-stocks`, 'POST', submitData);
  const result = await response.json();
  return { response, result };
};

export const updateStock = async (stockId, submitData) => {
  const response = await apiRequest(`/stocks/update-stock/${stockId}`, 'PUT', submitData);
  const result = await response.json();
  return { response, result };
};

export const deleteStock = async (stockId) => {
  const response = await apiRequest(`/stocks/delete-stock/${stockId}`, 'DELETE');
  return response;
};
