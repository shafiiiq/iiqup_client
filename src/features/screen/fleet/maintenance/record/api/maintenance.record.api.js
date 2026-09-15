import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchServiceSummaryData = async ({ period, startDate = null, endDate = null, months = null }) => {
  let url;
  if (startDate && endDate) {
    const formatForAPI = (date) => {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    };
    url = `/maintenance/report/summary/date-range/${formatForAPI(startDate)}/${formatForAPI(endDate)}`;
  } else if (months) {
    url = `/maintenance/report/summary/last-months/${months}`;
  } else {
    url = `/maintenance/report/summary/${period}`;
  }

  const response = await apiRequest(url, 'GET');
  const data = await response.json();
  return data;
};

export const deleteServiceReport = async (reportId) => {
  const response = await apiRequest(`/maintenance/report/deletewith/${reportId}`, 'DELETE');
  return response;
};
