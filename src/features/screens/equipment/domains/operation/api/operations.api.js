import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchFilteredActivities = async ({
  filterType,
  specificTime,
  timeRange,
  startDate,
  endDate,
  months,
}) => {
  let mobUrl = `${API_URI}/equipments/filtered-mobilizations?filterType=${filterType}`;
  let repUrl = `${API_URI}/equipments/filtered-replacements?filterType=${filterType}`;

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

export const getSignedMediaUrl = async (filePath) => {
  if (!filePath) return '';

  try {
    const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: true });
    const payload = await response.json();
    return payload.dataUrl || '';
  } catch (error) {
    console.error('Error getting media URL:', error);
    return '';
  }
};

export const getOperatorProfileUrl = async (filePath) => {
  if (!filePath) return null;

  try {
    const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: false });
    const payload = await response.json();
    return payload.dataUrl || null;
  } catch (error) {
    console.error('Error getting operator profile URL:', error);
    return null;
  }
};
