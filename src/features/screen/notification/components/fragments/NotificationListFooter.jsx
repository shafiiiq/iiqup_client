import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationListFooter = ({ sentinelRef, isLoadingMore, hasMoreItems, hasRows, onLoadMore }) => (
  <div className="features screen notification footer">
    <div ref={sentinelRef} />
    {isLoadingMore && <span className="features screen notification time">Loading...</span>}
    {!isLoadingMore && hasMoreItems && (
      <button type="button" className="features screen notification action-button" onClick={onLoadMore}>
        {renderComponentIcon('IconlyArrowDown', 18, 'currentColor')}
        Load More
      </button>
    )}
    {!isLoadingMore && !hasMoreItems && hasRows && (
      <span className="features screen notification time">No more notifications</span>
    )}
  </div>
);

export default NotificationListFooter;