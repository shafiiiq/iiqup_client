import { useEffect, useState } from 'react';
import { loadVideoThumbnailUrl } from './cdn.service';

const thumbnailUrlBySourceKey = new Map();
const pendingRequestBySourceKey = new Map();

const requestThumbnailUrl = (sourceKey) => {
  if (thumbnailUrlBySourceKey.has(sourceKey)) return Promise.resolve(thumbnailUrlBySourceKey.get(sourceKey));
  if (pendingRequestBySourceKey.has(sourceKey)) return pendingRequestBySourceKey.get(sourceKey);

  const request = loadVideoThumbnailUrl(sourceKey)
    .then((url) => {
      thumbnailUrlBySourceKey.set(sourceKey, url);
      return url;
    })
    .catch(() => null)
    .finally(() => {
      pendingRequestBySourceKey.delete(sourceKey);
    });

  pendingRequestBySourceKey.set(sourceKey, request);
  return request;
};

export const useVideoThumbnail = (sourceKey) => {
  const [state, setState] = useState(() => ({
    thumbnailUrl: thumbnailUrlBySourceKey.get(sourceKey) || null,
    isLoading: !thumbnailUrlBySourceKey.has(sourceKey),
  }));

  useEffect(() => {
    let isCancelled = false;
    requestThumbnailUrl(sourceKey).then((url) => {
      if (!isCancelled) setState({ thumbnailUrl: url, isLoading: false });
    });
    return () => {
      isCancelled = true;
    };
  }, [sourceKey]);

  return state;
};