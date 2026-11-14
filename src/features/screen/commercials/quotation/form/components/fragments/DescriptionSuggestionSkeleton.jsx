import Skeleton from '@/shared/components/widgets/loader/skeleton/Skeleton';
import LoadMoreSkeleton from '@/shared/components/widgets/loader/skeleton/LoadMoreSkeleton';

const DEFAULT_SKELETON_ROW_COUNT = 6;

function DescriptionSuggestionSkeleton({ count = DEFAULT_SKELETON_ROW_COUNT }) {
  return (
    <LoadMoreSkeleton
      count={count}
      renderItem={() => (
        <div className="features screen quotation form dropdown-option desc-option">
          <Skeleton width="70%" height="16px" />
          <Skeleton width="36px" height="36px" radius="4px" />
        </div>
      )}
    />
  );
}

export default DescriptionSuggestionSkeleton;