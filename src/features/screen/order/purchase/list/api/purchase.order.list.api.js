import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl } from '@/shared/pagination/pagination.util';

export const fetchPurchaseOrderList = async ({ purchaseOrderOfSpecificEquipment, purchaseOrdersOfStocks, purchaseOrdersOfEquipments, regNo, page, limit }) => {
  let url = `/order/purchase`;

  if (purchaseOrderOfSpecificEquipment && regNo) {
    url = `/order/purchase/equipment/${regNo}`;
  } else if (purchaseOrdersOfStocks) {
    url = `/order/purchase/of-stock`;
  } else if (purchaseOrdersOfEquipments) {
    url = `/order/purchase/equipments`;
  }

  url = appendPaginationToUrl(url, { page, limit });

  const response = await apiRequest(url, 'GET');
  return response.json();
};

export const fetchPendingSignatures = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.uniqueCode) return { data: [], count: 0 };

    const pendingRes = await apiRequest(`/order/purchase/pending-signatures`, 'POST', {
      uniqueCode: encodeURIComponent(user.uniqueCode),
    });

    return pendingRes.json();
  } catch (error) {
    console.error('[PurchaseOrderService] fetchPendingSignatures:', error);
    return { data: [], count: 0 };
  }
};

export const deletePurchaseOrder = async (purchaseorderRef) => {
  const response = await apiRequest(`/order/purchase/${purchaseorderRef}`, 'DELETE');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete PurchaseOrder');
  }

  return response;
};
