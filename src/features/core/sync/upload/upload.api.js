import { apiRequest } from '@/features/core/network/api/api.request';
import { UPLOAD_BASE_PATH } from './upload.constant';

const readResponseData = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallbackMessage);
  return body.data;
};

export const initiateUploadSession = async (payload) =>
  readResponseData(await apiRequest(`${UPLOAD_BASE_PATH}/initiate`, 'POST', payload), 'Failed to initiate upload');

export const requestPartUrls = async ({ sessionId, partNumbers }) =>
  readResponseData(
    await apiRequest(`${UPLOAD_BASE_PATH}/${sessionId}/parts`, 'POST', { partNumbers }),
    'Failed to get upload part URLs'
  );

export const completeUploadSession = async ({ sessionId, parts }) =>
  readResponseData(
    await apiRequest(`${UPLOAD_BASE_PATH}/${sessionId}/complete`, 'POST', { parts }),
    'Failed to complete upload'
  );

export const abortUploadSession = async (sessionId) =>
  readResponseData(await apiRequest(`${UPLOAD_BASE_PATH}/${sessionId}`, 'DELETE'), 'Failed to abort upload');