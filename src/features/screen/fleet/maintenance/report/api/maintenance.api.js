import { apiRequest } from '@/features/core/network/api/api.request';

const MAINTENANCE_BASE = '/maintenance';

export const fetchMaintenanceById = async (maintenanceId) => {
  const response = await apiRequest(`${MAINTENANCE_BASE}/${maintenanceId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error(result.message || 'Failed to load maintenance record');
  return result.data;
};

export const deleteMaintenance = async (maintenanceId) => {
  const response = await apiRequest(`${MAINTENANCE_BASE}/${maintenanceId}`, 'DELETE');
  return response.json();
};

export const fetchAttachmentUrl = async (s3Key) => {
  const response = await apiRequest('/s3/pre-signed-url', 'POST', { key: s3Key, isLong: false, isAuthSign: false });
  if (!response.ok) throw new Error('Failed to load attachment');
  const { dataUrl } = await response.json();
  return dataUrl;
};