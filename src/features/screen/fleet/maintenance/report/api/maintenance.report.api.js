import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchMaintenanceDocuments = async (querySuffix) => {
  const response = await apiRequest(`/maintenance/documents${querySuffix}`, 'GET');
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
};

const readPdfBlob = async (response) => {
  const blob = await response.blob();
  if (!blob.size || !blob.type.includes('application/pdf')) throw new Error('PDF response was invalid');
  return new Blob([blob], { type: 'application/pdf' });
};

export const downloadStoredMaintenancePdf = async (maintenanceId) =>
  readPdfBlob(await apiRequest(`/maintenance/pdf/download/${encodeURIComponent(maintenanceId)}`, 'GET'));

export const downloadMaintenanceBatchPdf = async (path, fileName) => {
  const response = await apiRequest('/pdf/render', 'POST', {
    path,
    width: 297,
    height: 420,
    download: true,
    fileName,
  });
  return readPdfBlob(response);
};