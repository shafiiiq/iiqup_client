import { useLayoutEffect, useRef, useState } from 'react';
import { countFittingCharacters, fitGhostExample } from '../../utils/notification.ghost.fit';

const DEFAULT_GHOST_FONT_SIZE = 15;

const DistributionGhostText = ({ lines, scrollOffset, className }) => {
  const elementRef = useRef(null);
  const [metrics, setMetrics] = useState({ availableWidth: 0, fontSize: DEFAULT_GHOST_FONT_SIZE });
  const hasLines = lines.length > 0;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!hasLines || !element) return undefined;

    const measure = () => {
      const style = window.getComputedStyle(element);
      setMetrics({
        availableWidth: element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        fontSize: parseFloat(style.fontSize) || DEFAULT_GHOST_FONT_SIZE,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasLines]);

  if (!hasLines) return null;

  const maxCharacters = countFittingCharacters(metrics.availableWidth, metrics.fontSize);

  return (
    <div ref={elementRef} className={className} aria-hidden="true">
      <div className="features screen notification ghost-text" style={{ transform: `translateY(${-scrollOffset}px)` }}>
        {lines.map((line, index) => (
          <span key={index}>
            <span className="features screen notification ghost-typed">{line.typed}</span>
            {fitGhostExample(line.example, line.typed.length, maxCharacters)}
            {index < lines.length - 1 ? '\n' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DistributionGhostText;