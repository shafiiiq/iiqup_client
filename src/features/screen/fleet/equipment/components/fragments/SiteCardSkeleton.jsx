import Skeleton from '@/shared/components/widgets/loader/skeleton/Skeleton';
import CardSkeleton from '@/shared/components/widgets/card/CardSkeleton';
import MediaCardSkeleton from '@/shared/components/widgets/card/MediaCardSkeleton';
import MediaSkeletonPlaceholder from '@/shared/components/widgets/card/MediaSkeletonPlaceholder';
import { SITE_CARD_LOOK, SITE_ITEM_CARD_LOOK } from '../../constants/equipment.card.look.constant';

function SiteCardSkeleton() {
  return (
    <CardSkeleton vars={SITE_CARD_LOOK}>
      <div className="fleet equipment site-card-header">
        <Skeleton width="220px" height="28px" />
        <Skeleton width="140px" height="26px" radius="20px" />
      </div>

      <div className="fleet equipment site-equipments-grid">
        {Array.from({ length: 2 }).map((_, index) => (
          <MediaCardSkeleton
            key={index}
            vars={SITE_ITEM_CARD_LOOK}
            mediaGap="16px"
            media={
              <div className="fleet equipment site-card-image-slider">
                <MediaSkeletonPlaceholder mediaType="image" radius="0px" />
              </div>
            }
          >
            <div className="fleet equipment site-card-content">
              <div className="fleet equipment site-card-header-mini">
                <Skeleton width="60%" height="22px" />
                <Skeleton width="70px" height="24px" radius="20px" />
              </div>

              <div className="fleet equipment site-card-details">
                {Array.from({ length: 2 }).map((__, detailIndex) => (
                  <div className="fleet equipment detail-item" key={detailIndex}>
                    <Skeleton width="60%" height="12px" style={{ marginBottom: '6px' }} />
                    <Skeleton width="85%" height="16px" />
                  </div>
                ))}
              </div>

              <div className="fleet equipment site-card-actions">
                <Skeleton width="40px" height="40px" radius="12px" />
                <Skeleton width="40px" height="40px" radius="12px" />
                <Skeleton width="90px" height="36px" radius="12px" />
                <Skeleton width="90px" height="36px" radius="12px" />
                <Skeleton width="140px" height="36px" radius="12px" />
              </div>
            </div>
          </MediaCardSkeleton>
        ))}
      </div>
    </CardSkeleton>
  );
}

export default SiteCardSkeleton;