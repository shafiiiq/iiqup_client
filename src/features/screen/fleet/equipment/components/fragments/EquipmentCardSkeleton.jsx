import Skeleton from '@/shared/components/widgets/loader/skeleton/Skeleton';
import MediaCardSkeleton from '@/shared/components/widgets/card/MediaCardSkeleton';
import MediaSkeletonPlaceholder from '@/shared/components/widgets/card/MediaSkeletonPlaceholder';
import { EQUIPMENT_CARD_LOOK } from '../../constants/equipment.card.look.constant';

function EquipmentCardSkeleton() {
  return (
    <MediaCardSkeleton
      vars={EQUIPMENT_CARD_LOOK}
      media={
        <div className="fleet equipment card-image-slider">
          <MediaSkeletonPlaceholder mediaType="image" radius="0px" />
        </div>
      }
    >
      <div className="fleet equipment card-content">
        <div className="fleet equipment card-header">
          <div className="fleet equipment main-details" style={{ width: '70%' }}>
            <Skeleton width="80%" height="26px" style={{ marginBottom: '10px' }} />
            <Skeleton width="50%" height="16px" />
          </div>
          <Skeleton width="70px" height="26px" radius="20px" />
        </div>

        <div className="fleet equipment card-details-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="fleet equipment detail-item" key={index}>
              <Skeleton width="60%" height="12px" style={{ marginBottom: '6px' }} />
              <Skeleton width="85%" height="18px" />
            </div>
          ))}
        </div>

        <div className="fleet equipment card-footer">
          <div className="fleet equipment card-actions">
            <Skeleton width="45px" height="45px" radius="12px" />
            <Skeleton width="45px" height="45px" radius="12px" />
          </div>
          <Skeleton width="160px" height="38px" radius="12px" />
          <Skeleton width="160px" height="38px" radius="12px" />
          <Skeleton width="225px" height="38px" radius="12px" />
          <Skeleton width="225px" height="38px" radius="12px" />
        </div>
      </div>
    </MediaCardSkeleton>
  );
}

export default EquipmentCardSkeleton;