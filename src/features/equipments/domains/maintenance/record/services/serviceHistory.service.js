import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchServiceSummaryData = async ({ period, startDate = null, endDate = null, months = null }) => {
  let url;
  if (startDate && endDate) {
    const formatForAPI = (date) => {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    };
    url = `${API_URI}/service-report/summary/date-range/${formatForAPI(startDate)}/${formatForAPI(endDate)}`;
  } else if (months) {
    url = `${API_URI}/service-report/summary/last-months/${months}`;
  } else {
    url = `${API_URI}/service-report/summary/${period}`;
  }

  const response = await apiRequest(url, 'GET');
  const data = await response.json();
  return data;
};

export const deleteServiceReport = async (reportId) => {
  const response = await apiRequest(`${API_URI}/service-report/deletewith/${reportId}`, 'DELETE');
  return response;
};
