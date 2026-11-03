import { apiRequest } from '@/features/core/network/api/api.request';
import { CDN_BASE_PATH } from './cdn.constant';

const readResponseData = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || fallbackMessage);
    error.status = response.status;
    throw error;
  }
  return body.data;
};

export const fetchVideoBySourceKey = async (sourceKey) =>
  readResponseData(
    await apiRequest(`${CDN_BASE_PATH}/by-source-key?key=${encodeURIComponent(sourceKey)}`, 'GET'),
    'Failed to load video'
  );

export const fetchThumbnailBySourceKey = async (sourceKey) =>
  readResponseData(
    await apiRequest(`${CDN_BASE_PATH}/thumbnail?key=${encodeURIComponent(sourceKey)}`, 'GET'),
    'Failed to load video thumbnail'
  );

export const fetchVideoStatus = async (assetId) =>
  readResponseData(await apiRequest(`${CDN_BASE_PATH}/${assetId}`, 'GET'), 'Failed to load video status');

export const fetchRenditionPlaybackUrl = async ({ assetId, renditionName }) =>
  readResponseData(
    await apiRequest(`${CDN_BASE_PATH}/${assetId}/renditions/${renditionName}/playback-url`, 'GET'),
    'Failed to load playback url'
  );

export const fetchRenditionDownloadUrl = async ({ assetId, renditionName }) =>
  readResponseData(
    await apiRequest(`${CDN_BASE_PATH}/${assetId}/renditions/${renditionName}/download-url`, 'GET'),
    'Failed to load download url'
  );