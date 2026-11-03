import { useEffect, useRef } from 'react';

const SENTINEL_ROOT_MARGIN = '400px';

export const useInfiniteScrollSentinel = ({ onReachEnd, isEnabled, watchKey }) => {
  const sentinelRef = useRef(null);
  const onReachEndRef = useRef(onReachEnd);
  onReachEndRef.current = onReachEnd;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!isEnabled || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onReachEndRef.current();
      },
      { rootMargin: SENTINEL_ROOT_MARGIN }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isEnabled, watchKey]);

  return sentinelRef;
};