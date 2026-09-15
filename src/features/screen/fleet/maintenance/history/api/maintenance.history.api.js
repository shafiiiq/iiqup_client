import { apiRequest } from '@/features/core/network/api/api.request';
import { formatDate } from '../helper/maintenance.history.helper';

const EQUIPMENT_BASE = `/equipments`;
const HISTORY_BASE = `/maintenance/history`;
const REPORT_BASE = `/maintenance/report`;

export const fetchEquipmentByRegNo = async (regNo) => {
  const response = await apiRequest(`${EQUIPMENT_BASE}/${regNo}`, 'GET');
  const result = await response.json();
  return result?.data?.[0] ?? null;
};

export const fetchHistoryById = async (serviceType, historyId) => {
  const response = await apiRequest(`${HISTORY_BASE}/record/${serviceType}/${historyId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service history data');
  return result.data;
};

export const fetchReportById = async (reportId) => {
  const response = await apiRequest(`${REPORT_BASE}/record/${reportId}`, 'GET');
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error('Failed to load service report data');
  return result.data;
};

const buildDateRangeParams = ({ dateFilterMode, lastMonthsCount, customStartDate, customEndDate } = {}) => {
  const params = new URLSearchParams();
  params.set('dateFilterMode', dateFilterMode || 'all');
  if (dateFilterMode === 'lastXmonths' && lastMonthsCount) params.set('lastMonthsCount', lastMonthsCount);
  if (dateFilterMode === 'custom') {
    if (customStartDate) params.set('customStartDate', customStartDate);
    if (customEndDate) params.set('customEndDate', customEndDate);
  }
  return params;
};

export const fetchServiceHistoryList = async ({ regNos, serviceType, page, limit, dateRangeFilter }) => {
  const params = buildDateRangeParams(dateRangeFilter);
  params.set('regNos', regNos.join(','));
  if (serviceType) params.set('serviceType', serviceType);
  params.set('page', page);
  params.set('limit', limit);

  const response = await apiRequest(`${HISTORY_BASE}/list?${params.toString()}`, 'GET');
  return response.json();
};

export const fetchServiceHistoryTypeCounts = async ({ regNos, dateRangeFilter }) => {
  const params = buildDateRangeParams(dateRangeFilter);
  params.set('regNos', regNos.join(','));

  const response = await apiRequest(`${HISTORY_BASE}/type-counts?${params.toString()}`, 'GET');
  return response.json();
};

export const createServiceHistory = async (payload) => {
  const response = await apiRequest(HISTORY_BASE, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const saveBatchServiceHistory = async (payload) => {
  const response = await apiRequest(`${HISTORY_BASE}/batch`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const saveServiceReport = async (payload) => {
  const response = await apiRequest(REPORT_BASE, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const updateServiceReport = async (reportId, payload) => {
  const response = await apiRequest(`${REPORT_BASE}/record/${reportId}`, 'PUT', payload);
  const result = await response.json();
  return { response, result };
};

const toApiDateFormat = (isoDate) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
};

export const fetchServiceSummaryData = async ({ period, startDate = null, endDate = null, months = null }) => {
  const url = startDate && endDate
    ? `${REPORT_BASE}/summary/date-range/${toApiDateFormat(startDate)}/${toApiDateFormat(endDate)}`
    : months
      ? `${REPORT_BASE}/summary/last-months/${months}`
      : `${REPORT_BASE}/summary/${period}`;

  const response = await apiRequest(url, 'GET');
  return response.json();
};

export const deleteServiceReport = async (reportId) =>
  apiRequest(`${REPORT_BASE}/record/${reportId}`, 'DELETE');

export const deleteServiceHistoryRecord = async (serviceType, historyId) => {
  const response = await apiRequest(`${HISTORY_BASE}/${serviceType}/${historyId}`, 'DELETE');
  return response.json();
};

export const fetchServiceHistoriesByRegNos = async (registrationNumbers) => {
  const responses = await Promise.all(
    registrationNumbers.map((registrationNumber) => apiRequest(`${HISTORY_BASE}/${registrationNumber}`))
  );
  const parsedResponses = await Promise.all(responses.map((response) => response.json()));
  return parsedResponses.flatMap((result) => result.data ?? []);
};

export const fetchReportForHistoryItem = async (item) => {
  const endpoint = item.reportId
    ? `${REPORT_BASE}/record/${item.reportId}`
    : `${REPORT_BASE}/${item.regNo}/${formatDate(item.date)}`;

  const response = await apiRequest(endpoint);
  if (!response.ok) return null;
  const result = await response.json();
  return item.reportId ? result.data : result?.data?.[0];
};