import './Text.css';
import Skeleton from '../loader/skeleton/Skeleton';

const VARIANT_HEIGHTS = {
  heading: '24px',
  title: '20px',
  subtitle: '18px',
  body: '14px',
  caption: '11px',
  label: '14px',
};

function TextSkeleton({
  variant = 'body',
  width = '100%',
  lines = 1,
  lastLineWidth = '60%',
  gap = '8px',
  className = '',
}) {
  const height = VARIANT_HEIGHTS[variant] || VARIANT_HEIGHTS.body;

  if (lines <= 1) {
    return (
      <Skeleton
        width={width}
        height={height}
        radius="4px"
        className={`shared widget text skeleton${className ? ` ${className}` : ''}`}
      />
    );
  }

  const lineSlots = Array.from({ length: lines });

  return (
    <div
      className={`shared widget text skeleton-group${className ? ` ${className}` : ''}`}
      style={{ gap }}
    >
      {lineSlots.map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : width}
          height={height}
          radius="4px"
        />
      ))}
    </div>
  );
}

export default TextSkeleton;