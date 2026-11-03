import { useEffect, useState } from 'react';
import { loadVideoPlayback } from './cdn.service';
import { PLAYBACK_PHASE, ORIGINAL_PLAYBACK } from './cdn.constant';

const LOADING_PLAYBACK = { ...ORIGINAL_PLAYBACK, phase: PLAYBACK_PHASE.LOADING };

export const useVideoStream = ({ sourceKey, fallbackUrl, preferredRendition }) => {
  const [selectedRendition, setSelectedRendition] = useState(preferredRendition);
  const [playback, setPlayback] = useState(LOADING_PLAYBACK);

  useEffect(() => {
    let isCancelled = false;
    loadVideoPlayback({ sourceKey, renditionName: selectedRendition })
      .then((result) => {
        if (!isCancelled) setPlayback(result);
      })
      .catch(() => {
        if (!isCancelled) setPlayback(ORIGINAL_PLAYBACK);
      });
    return () => {
      isCancelled = true;
    };
  }, [sourceKey, selectedRendition]);

  return {
    phase: playback.phase,
    url: playback.phase === PLAYBACK_PHASE.STREAM ? playback.url : fallbackUrl,
    renditions: playback.renditions,
    activeRendition: playback.activeRendition,
    selectRendition: setSelectedRendition,
  };
};