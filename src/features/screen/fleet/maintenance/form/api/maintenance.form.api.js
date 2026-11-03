import { apiRequest } from '@/features/core/network/api/api.request';

const MAINTENANCE_BASE = '/maintenance';

export const fetchEquipmentByRegNo = async (regNo) => {
  const response = await apiRequest(`/equipments/by-reg/${encodeURIComponent(regNo)}`, 'GET');
  if (!response.ok) return null;
  const result = await response.json();
  return result?.data ?? null;
};

export const createMaintenance = async (payload) => {
  const response = await apiRequest(MAINTENANCE_BASE, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateMaintenance = async (maintenanceId, payload) => {
  const response = await apiRequest(`${MAINTENANCE_BASE}/${maintenanceId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};