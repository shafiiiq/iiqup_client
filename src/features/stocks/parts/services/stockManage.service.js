import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchStockEquipments = async () => {
  const response = await apiRequest(`${API_URI}/equipments/get-equipments`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch equipments');
  return response.json();
};

export const fetchAllUsers = async () => {
  const response = await apiRequest(`${API_URI}/users/get-all-users`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchStocks = async () => {
  const response = await apiRequest(`${API_URI}/stocks/get-all-stocks`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch stocks');
  return response.json();
};

export const updateStockQuantity = async (stockId, updateData) => {
  const response = await apiRequest(`${API_URI}/stocks/update-quantity/${stockId}`, 'PUT', updateData);
  const result = await response.json();
  return { response, result };
};

export const addStock = async (submitData) => {
  const response = await apiRequest(`${API_URI}/stocks/add-stocks`, 'POST', submitData);
  const result = await response.json();
  return { response, result };
};

export const updateStock = async (stockId, submitData) => {
  const response = await apiRequest(`${API_URI}/stocks/update-stock/${stockId}`, 'PUT', submitData);
  const result = await response.json();
  return { response, result };
};

export const deleteStock = async (stockId) => {
  const response = await apiRequest(`${API_URI}/stocks/delete-stock/${stockId}`, 'DELETE');
  return response;
};
