import { formatNotificationCount } from '@/features/core/messaging/notification/count/notification.count.format';

import { NOTIFICATION_VIEW_MODE_OPTIONS } from '../../constants/notification.tabs';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationToolbar = ({
  viewMode,
  unreadCount,
  mentionCount,
  onChangeViewMode,
  onMarkAllRead,
  onPressMentions,
}) => (
  <div className="features screen notification toolbar">
    <div className="features screen notification toolbar-actions">
      <span className="features screen notification time">{unreadCount} unread</span>
      {unreadCount > 0 && (
        <button type="button" className="features screen notification action-button" onClick={onMarkAllRead}>
          {renderComponentIcon('IconlyTickCircle', 18, 'currentColor')}
          Mark all as read
        </button>
      )}
      {mentionCount > 0 && (
        <button type="button" className="features screen notification mention-button" onClick={onPressMentions}>
          {renderComponentIcon('IconlyMention', 18, 'currentColor')}
          {formatNotificationCount(mentionCount)}
        </button>
      )}
    </div>

    <div className="features screen notification view-switch" role="tablist">
      {NOTIFICATION_VIEW_MODE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={viewMode === option.value}
          className={`features screen notification view-button ${viewMode === option.value ? 'active' : ''}`.trim()}
          onClick={() => onChangeViewMode(option.value)}
        >
          {renderComponentIcon(option.icon, 18, 'currentColor')}
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export default NotificationToolbar;