import { apiRequest } from '@/features/core/network/api/api.request';
import { buildMaintenanceFilterParams } from '../helper/maintenance.list.query.helper';

const MAINTENANCE_BASE = '/maintenance';

export const fetchMaintenanceList = async ({ regNos, serviceType, page, limit, dateRangeFilter }) => {
  const params = buildMaintenanceFilterParams({ regNos, serviceType, dateRangeFilter });
  params.set('page', page);
  params.set('limit', limit);

  const response = await apiRequest(`${MAINTENANCE_BASE}/list?${params.toString()}`, 'GET');
  return response.json();
};

export const fetchMaintenanceTypeCounts = async ({ regNos, dateRangeFilter }) => {
  const params = buildMaintenanceFilterParams({ regNos, dateRangeFilter });
  const response = await apiRequest(`${MAINTENANCE_BASE}/type-counts?${params.toString()}`, 'GET');
  return response.json();
};