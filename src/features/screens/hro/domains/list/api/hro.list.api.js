import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchHireOrders = async () => {
  const response = await apiRequest(`${API_URI}/hire-order/get-all-hire-orders`, 'GET');
  return response.json();
};

export const deleteHireOrder = async (ref) => {
  const response = await apiRequest(`${API_URI}/hire-order/delete-hire-order/${encodeURIComponent(ref)}`, 'DELETE');
  return response;
};
