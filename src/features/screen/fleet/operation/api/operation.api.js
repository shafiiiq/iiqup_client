import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchFilteredActivities = async ({
  filterType,
  specificTime,
  timeRange,
  startDate,
  endDate,
  months,
}) => {
  let mobUrl = `/equipments/filtered-mobilizations?filterType=${filterType}`;
  let repUrl = `/equipments/filtered-replacements?filterType=${filterType}`;

  if (specificTime) {
    mobUrl += `&specificTime=${specificTime}`;
    repUrl += `&specificTime=${specificTime}`;
  } else if (timeRange?.start && timeRange?.end) {
    mobUrl += `&startTime=${timeRange.start}&endTime=${timeRange.end}`;
    repUrl += `&startTime=${timeRange.start}&endTime=${timeRange.end}`;
  }

  if (filterType === 'custom' && startDate && endDate) {
    const formatForAPI = (date) => {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    };
    mobUrl += `&startDate=${formatForAPI(startDate)}&endDate=${formatForAPI(endDate)}`;
    repUrl += `&startDate=${formatForAPI(startDate)}&endDate=${formatForAPI(endDate)}`;
  } else if (filterType === 'months' && months) {
    mobUrl += `&months=${months}`;
    repUrl += `&months=${months}`;
  }

  const [mobResponse, repResponse] = await Promise.all([
    apiRequest(mobUrl, 'GET'),
    apiRequest(repUrl, 'GET'),
  ]);

  const mobData = await mobResponse.json();
  const repData = await repResponse.json();

  return {
    mobilizations: mobData?.ok ? mobData.data || [] : [],
    replacements: repData?.ok ? repData.data || [] : [],
  };
};

export const fetchRecentActivities = async () => {
  const [mobResponse, repResponse] = await Promise.all([
    apiRequest('/equipments/all-mobilizations', 'GET'),
    apiRequest('/equipments/all-replacements', 'GET'),
  ]);

  const mobData = await mobResponse.json();
  const repData = await repResponse.json();

  return {
    mobilizations: mobData?.ok ? mobData.data || [] : [],
    replacements: repData?.ok ? repData.data || [] : [],
  };
};