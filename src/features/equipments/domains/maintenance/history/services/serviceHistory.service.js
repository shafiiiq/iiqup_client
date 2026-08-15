import { API_URI } from '@shared/constants';
import { apiRequest } from '@shared/utils/api';

export const fetchEquipmentByRegNo = async (regNo) => {
  const response = await apiRequest(`${API_URI}/equipments/get-equipment/${regNo}`, 'GET');
  const data = await response.json();
  return data?.data?.[0] ?? null;
};

export const fetchHistoryById = async (serviceType, historyId) => {
  const response = await apiRequest(`${API_URI}/service-history/get-by-id/${serviceType}/${historyId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service history data');
  return result.data;
};

export const fetchReportById = async (reportId) => {
  const response = await apiRequest(`${API_URI}/service-report/get-report/with-id/${reportId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service report data');
  return result.data;
};

export const createServiceHistory = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-history/add`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const saveBatchServiceHistory = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-history/batch`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const saveServiceReport = async (payload) => {
  const response = await apiRequest(`${API_URI}/service-report/add-service-report`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateServiceReport = async (reportId, payload) => {
  const response = await apiRequest(`${API_URI}/service-report/updatewith/${reportId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};

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
