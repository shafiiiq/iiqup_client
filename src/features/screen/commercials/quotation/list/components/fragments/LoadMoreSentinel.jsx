import { useEffect, useRef } from 'react';

function LoadMoreSentinel({ onVisible, disabled, loading }) {
  const ref = useRef(null);
  const callbackRef = useRef(onVisible);
  callbackRef.current = onVisible;

  useEffect(() => {
    if (disabled || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) callbackRef.current(); },
      { rootMargin: '300px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [disabled]);

  return (
    <div ref={ref} style={{ minHeight: 24, textAlign: 'center', opacity: 0.7, padding: '12px 0' }}>
      {loading ? 'Loading more...' : ''}
    </div>
  );
}

export default LoadMoreSentinel;