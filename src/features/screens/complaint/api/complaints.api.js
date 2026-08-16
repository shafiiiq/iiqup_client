import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchComplaints = async (complaintId) => {
  const endpoint = complaintId
    ? `${API_URI}/complaints/get-complaints/${complaintId}`
    : `${API_URI}/complaints/get-all-complaints`;

  const response = await apiRequest(endpoint);
  if (!response.ok) throw new Error('Failed to fetch complaints');

  const data = await response.json();
  const raw = complaintId ? [data.data] : Array.isArray(data.data?.data) ? data.data.data : [];

  if (!Array.isArray(raw)) throw new Error('Invalid data format: expected array');

  return [...raw].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getPreSignedMediaUrl = async (filePath) => {
  if (!filePath) return '';

  try {
    const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: true });
    const result = await response.json();
    return result.dataUrl || '';
  } catch (error) {
    console.error('[ComplaintsService] getPreSignedMediaUrl error:', error);
    return '';
  }
};
