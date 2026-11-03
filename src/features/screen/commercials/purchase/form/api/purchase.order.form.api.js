import { apiRequest } from '@/features/core/network/api/api.request';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

export const fetchPurchaseOrderByRef = async (refNo) => {
  const decodedRef = decodeURIComponent(refNo);
  const response = await apiRequest(`/order/purchase/${decodedRef}`, 'GET');
  return response.json();
};

export const fetchLatestPurchaseOrderRef = async () => {
  const response = await apiRequest(`/order/purchase/latest-refno`);
  return response.json();
};

export const fetchEquipments = async (searchTerm = '') => {
  if (!searchTerm.trim()) {
    const response = await apiRequest(`/equipments?page=1&limit=1000`, 'GET');
    return response.json();
  }

  const url = buildSearchUrl({
    source: SEARCH_SOURCES.EQUIPMENT,
    q: searchTerm,
    page: 1,
    limit: 1000,
  });
  const response = await apiRequest(url, 'GET');
  const responseJson = await response.json();
  const result = extractSearchResult(responseJson, SEARCH_SOURCES.EQUIPMENT);
  return {
    success: true,
    data: result.results,
    pagination: {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
    },
  };
};

export const fetchEquipmentByRegNo = async (regNo) => {
  const response = await apiRequest(`/equipments/by-reg/${regNo}`, 'GET');
  return response.json();
};

export const fetchCompanies = async () => {
  const response = await apiRequest(`/order/purchase/company-details`);
  return response.json();
};

export const createOrUpdatePurchaseOrder = async (endpoint, method, payload) => {
  const response = await apiRequest(endpoint, method, payload);
  return response.json();
};

export const createComplaintPurchaseOrder = async (complaintId, complaintPayload) => {
  const response = await apiRequest(`/complaints/create-purchaseorder/${complaintId}`, 'POST', complaintPayload);
  return response.json();
};

export const getQuotationUploadUrl = async (fileName, purchaseorderRef, contentType) => {
  const response = await apiRequest(`/order/purchase/get-quotation-upload-url`, 'POST', {
    fileName,
    purchaseorderRef,
    contentType,
  });
  return response.json();
};

export const getPreSignedUrl = async (filePath, isLong = false) => {
  const response = await apiRequest(`/s3/pre-signed-url`, 'POST', { key: filePath, isLong });
  return response.json();
};
