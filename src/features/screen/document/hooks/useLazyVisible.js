import { useEffect, useRef, useState } from 'react';

const LAZY_ROOT_MARGIN = '300px';

export const useLazyVisible = () => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isVisible) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: LAZY_ROOT_MARGIN }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible]);

  return [elementRef, isVisible];
};