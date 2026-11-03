import { fetchVideoBySourceKey, fetchRenditionPlaybackUrl, fetchThumbnailBySourceKey, fetchRenditionDownloadUrl } from './cdn.api';
import { PLAYBACK_PHASE, ORIGINAL_PLAYBACK, VIDEO_STATUS_FAILED } from './cdn.constant';
import { listReadyRenditionNames, pickRendition } from './cdn.helper';

export const loadVideoPlayback = async ({ sourceKey, renditionName }) => {
  let asset;
  try {
    asset = await fetchVideoBySourceKey(sourceKey);
  } catch (error) {
    if (error.status === 404) return ORIGINAL_PLAYBACK;
    throw error;
  }
  if (asset.status === VIDEO_STATUS_FAILED) return ORIGINAL_PLAYBACK;

  const readyRenditionNames = listReadyRenditionNames(asset.renditions);
  const activeRendition = pickRendition(readyRenditionNames, renditionName);
  if (!activeRendition) {
    return { phase: PLAYBACK_PHASE.PROCESSING, url: '', renditions: [], activeRendition: '' };
  }

  const { url } = await fetchRenditionPlaybackUrl({ assetId: asset.assetId, renditionName: activeRendition });
  return { phase: PLAYBACK_PHASE.STREAM, url, renditions: readyRenditionNames, activeRendition };
};

export const loadVideoThumbnailUrl = async (sourceKey) => {
  const { url } = await fetchThumbnailBySourceKey(sourceKey);
  return url;
};

export const loadVideoDownload = async ({ sourceKey, renditionName }) => {
  const asset = await fetchVideoBySourceKey(sourceKey);
  return fetchRenditionDownloadUrl({ assetId: asset.assetId, renditionName });
};