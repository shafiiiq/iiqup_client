import { useEffect, useRef } from 'react';

const DWELL_DURATION_MS = 600;
const VISIBLE_RATIO = 0.6;
const VISIBLE_VIEWPORT_SHARE = 0.5;
const OBSERVER_THRESHOLDS = [0, 0.25, 0.6, 1];

export const useVisibilityDwell = ({ elementRef, isEnabled, onDwell }) => {
  const onDwellRef = useRef(onDwell);
  onDwellRef.current = onDwell;

  useEffect(() => {
    const element = elementRef.current;
    if (!isEnabled || !element) return undefined;

    let timerId = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timerId);
        const isVisibleEnough =
          entry.intersectionRatio >= VISIBLE_RATIO ||
          entry.intersectionRect.height >= window.innerHeight * VISIBLE_VIEWPORT_SHARE;
        if (isVisibleEnough && document.visibilityState === 'visible') {
          timerId = setTimeout(() => onDwellRef.current(), DWELL_DURATION_MS);
        }
      },
      { threshold: OBSERVER_THRESHOLDS }
    );
    observer.observe(element);

    return () => {
      clearTimeout(timerId);
      observer.disconnect();
    };
  }, [elementRef, isEnabled]);
};