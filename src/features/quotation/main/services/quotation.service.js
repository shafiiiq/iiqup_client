import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchHireOrders = async () => {
  const response = await apiRequest(`${API_URI}/hire-order/get-all-hire-orders`, 'GET');
  return response.json();
};

export const deleteHireOrder = async (ref) => {
  const response = await apiRequest(`${API_URI}/hire-order/delete-hire-order/${encodeURIComponent(ref)}`, 'DELETE');
  return response;
};
