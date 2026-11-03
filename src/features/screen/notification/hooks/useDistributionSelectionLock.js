import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveEditableSelection } from '../utils/notification.distribution.fields';

const SELECTION_RESOLVE_DELAY_MS = 0;

export const useDistributionSelectionLock = ({ distribution, latestTextRef }) => {
  const [selection, setSelectionState] = useState(null);
  const pendingTimerRef = useRef(null);

  const cancelPendingResolution = useCallback(() => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = null;
  }, []);

  const setSelection = useCallback(
    (nextSelection) => {
      cancelPendingResolution();
      setSelectionState(nextSelection);
    },
    [cancelPendingResolution]
  );

  const changeSelection = useCallback(
    (nextSelection) => {
      cancelPendingResolution();
      if (!distribution) return;
      pendingTimerRef.current = setTimeout(() => {
        setSelectionState(resolveEditableSelection(latestTextRef.current, nextSelection, distribution.fields));
      }, SELECTION_RESOLVE_DELAY_MS);
    },
    [distribution, latestTextRef, cancelPendingResolution]
  );

  useEffect(() => cancelPendingResolution, [cancelPendingResolution]);

  return { selection, changeSelection, setSelection };
};