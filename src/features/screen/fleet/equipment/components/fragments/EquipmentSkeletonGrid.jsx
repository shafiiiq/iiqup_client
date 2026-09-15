import EquipmentCardSkeleton from './EquipmentCardSkeleton';
import SiteCardSkeleton from './SiteCardSkeleton';
import { EQUIPMENT_SKELETON_CARD_COUNT } from '../../constants/equipment.constant';

function EquipmentSkeletonGrid({ isSiteAllView }) {
  const placeholders = Array.from({ length: EQUIPMENT_SKELETON_CARD_COUNT });

  return (
    <div className={isSiteAllView ? 'fleet equipment site-grid' : 'fleet equipment grid'}>
      {placeholders.map((_, index) =>
        isSiteAllView ? <SiteCardSkeleton key={index} /> : <EquipmentCardSkeleton key={index} />
      )}
    </div>
  );
}

export default EquipmentSkeletonGrid;