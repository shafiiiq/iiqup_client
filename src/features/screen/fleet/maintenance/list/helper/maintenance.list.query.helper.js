export const buildMaintenanceFilterParams = ({ regNos = [], serviceType, dateRangeFilter = {} }) => {
  const { dateFilterMode, lastMonthsCount, customStartDate, customEndDate } = dateRangeFilter;
  const params = new URLSearchParams();

  if (regNos.length) params.set('regNos', regNos.join(','));
  if (serviceType) params.set('serviceType', serviceType);
  params.set('dateFilterMode', dateFilterMode || 'all');
  if (dateFilterMode === 'lastXmonths' && lastMonthsCount) params.set('lastMonthsCount', lastMonthsCount);
  if (dateFilterMode === 'custom') {
    if (customStartDate) params.set('customStartDate', customStartDate);
    if (customEndDate) params.set('customEndDate', customEndDate);
  }

  return params;
};