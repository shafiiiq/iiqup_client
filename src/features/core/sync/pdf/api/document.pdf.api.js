import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchDocumentPdfStatus = async (sourceKey, documentId) => {
  const response = await apiRequest(
    `/pdf/documents/${encodeURIComponent(sourceKey)}/status?documentId=${encodeURIComponent(documentId)}`,
    'GET'
  );
  return response.json();
};