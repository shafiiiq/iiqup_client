import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationEmptyState = ({ isLoading }) => {
  if (isLoading) {
    return (
      <div className="features screen notification loading">
        <Loader />
      </div>
    );
  }

  return (
    <div className="features screen notification empty-state">
      <span className="features screen notification empty-icon">
        {renderComponentIcon('IconlyNotificationOff', 56, 'currentColor')}
      </span>
      <h3>No notifications</h3>
      <p>You have no notifications here yet.</p>
    </div>
  );
};

export default NotificationEmptyState;