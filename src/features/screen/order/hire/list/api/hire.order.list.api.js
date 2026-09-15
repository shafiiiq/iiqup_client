import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchHireOrderList = async () => {
  const response = await apiRequest(`/order/hire/get-all-hire-orders`, 'GET');
  return response.json();
};

export const fetchPendingSignatures = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.uniqueCode) return { data: [], count: 0 };

    const pendingRes = await apiRequest(`/order/hire/pending-signatures`, 'POST', {
      uniqueCode: encodeURIComponent(user.uniqueCode),
    });

    return pendingRes.json();
  } catch (error) {
    console.error('[HireOrderListService] fetchPendingSignatures:', error);
    return { data: [], count: 0 };
  }
};

export const deleteHireOrder = async (hireOrderRef) => {
  const response = await apiRequest(`/order/hire/delete-hire-order/${encodeURIComponent(hireOrderRef)}`, 'DELETE');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete Hire Order');
  }

  return response;
};