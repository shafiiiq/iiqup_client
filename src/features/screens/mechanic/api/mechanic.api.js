import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchMechanics = async () => {
  const response = await apiRequest(`${API_URI}/mechanics/get-all-mechanic`);
  if (!response.ok) throw new Error('Failed to fetch mechanics');
  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
};

export const fetchMechanicAttendance = async (zktecoPin, date) => {
  if (!zktecoPin) return [];

  const response = await apiRequest(`${API_URI}/mechanics/attendance/${zktecoPin}/daily/${date}`);
  const data = await response.json();
  return data.status === 200 ? (data.data.records || []) : [];
};

export const fetchMechanicAttendanceByFilter = async (zktecoPin, filterType, startDate = null, endDate = null) => {
  if (!zktecoPin) return [];

  let url;
  if (filterType === 'date-range' && startDate && endDate) {
    url = `${API_URI}/mechanics/attendance/${zktecoPin}/date-range?startDate=${startDate}&endDate=${endDate}`;
  } else if (filterType === 'daily') {
    const today = new Date().toISOString().split('T')[0];
    url = `${API_URI}/mechanics/attendance/${zktecoPin}/daily/${today}`;
  } else if (filterType === 'weekly') {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((now - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    url = `${API_URI}/mechanics/attendance/${zktecoPin}/weekly/${year}/${week}`;
  } else if (filterType === 'monthly') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    url = `${API_URI}/mechanics/attendance/${zktecoPin}/monthly/${year}/${month}`;
  } else if (filterType === 'yearly') {
    const year = new Date().getFullYear();
    url = `${API_URI}/mechanics/attendance/${zktecoPin}/yearly/${year}`;
  } else if (filterType === 'all') {
    url = `${API_URI}/mechanics/attendance/${zktecoPin}/all`;
  }

  if (!url) return [];

  const response = await apiRequest(url);
  const data = await response.json();
  return data.status === 200 ? (data.data.records || []) : [];
};

export const updateMechanic = async (mechanicId, payload) => {
  const response = await apiRequest(`${API_URI}/mechanics/update-mechanic/${mechanicId}`, 'PUT', payload);
  const data = await response.json();
  return data;
};

export const deleteMechanic = async (mechanicId) => {
  const response = await apiRequest(`${API_URI}/mechanics/${mechanicId}`, 'DELETE');
  return response;
};
