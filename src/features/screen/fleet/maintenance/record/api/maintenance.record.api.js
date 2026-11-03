import { apiRequest } from '@/features/core/network/api/api.request';
import { buildMaintenanceFilterParams } from '../../list/helper/maintenance.list.query.helper';
import { PERIOD_DATE_FILTER_MODE } from '../constants/maintenance.record.constant';

export const fetchMaintenanceSummary = async ({ period, startDate, endDate, months }) => {
  const params = buildMaintenanceFilterParams({
    dateRangeFilter: {
      dateFilterMode: PERIOD_DATE_FILTER_MODE[period],
      lastMonthsCount: months ? Number(months) : undefined,
      customStartDate: startDate,
      customEndDate: endDate,
    },
  });

  const response = await apiRequest(`/maintenance/documents?${params.toString()}`, 'GET');
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to load maintenance summary');
  return result.data || [];
};