import Skeleton from '@/shared/components/widgets/loader/skeleton/Skeleton';

import './A2Paper.css';

function A2PaperSkeleton() {
  return (
    <div className="a2-paper">
      <div className="a2-paper-header" style={{marginBottom: '1rem'}}>
        <Skeleton width="200px" height="85px" radius="6px" />
        <Skeleton width="22rem" height="60px" radius="6px" />
      </div>

      <div className="a2-paper-body">
        <Skeleton height="100%" radius="4px" />
      </div>

      <div className="a2-paper-footer">
        <Skeleton width="320px" height="12px" radius="16px" style={{ marginBottom: '4px' }} />
        <Skeleton width="60rem" height="40px" radius="6px" />
      </div>
    </div>
  );
}

export default A2PaperSkeleton;