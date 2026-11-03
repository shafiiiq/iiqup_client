import { UPLOAD_BASE_PATH } from '../upload/upload.constant';

export const CDN_BASE_PATH = `${UPLOAD_BASE_PATH}/videos`;
export const RENDITION_ORDER = ['360p', '480p', '720p', '1080p', '4k'];
export const DEFAULT_PREFERRED_RENDITION = '720p';
export const RENDITION_STATUS_READY = 'ready';
export const VIDEO_STATUS_FAILED = 'failed';

export const PLAYBACK_PHASE = {
  LOADING: 'loading',
  STREAM: 'stream',
  PROCESSING: 'processing',
  ORIGINAL: 'original',
};

export const ORIGINAL_PLAYBACK = {
  phase: PLAYBACK_PHASE.ORIGINAL,
  url: '',
  renditions: [],
  activeRendition: '',
};