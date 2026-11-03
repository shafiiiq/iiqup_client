import { useRef } from 'react';
import { useVisibilityDwell } from '../../hooks/useVisibilityDwell';
import { getNotificationColor } from '../../utils/notification.appearance';
import { formatNotificationTime } from '../../utils/notification.time.format';
import NotificationActionButtons from './NotificationActionButtons';
import NotificationAttachments from './NotificationAttachments';
import NotificationAvatar from './NotificationAvatar';
import NotificationFeatureLinkCards from './NotificationFeatureLinkCards';
import NotificationOutgoingStatus from './NotificationOutgoingStatus';
import NotificationReplyThread from './NotificationReplyThread';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationCard = ({
  item,
  isHighlighted,
  threadView,
  showCategory,
  onActionPress,
  onToggleLike,
  onToggleThread,
  onViewed,
  onPressCategory,
  onPressFeatureLink,
  onRetryOutgoing,
  onDiscardOutgoing,
}) => {
  const cardRef = useRef(null);
  const accentColor = getNotificationColor(item.priority);
  const unseenReplyCount = item.unseenReplyCount;
  const hasUnseenReplies = unseenReplyCount > 0;
  const seenReplyCount = Math.max(0, item.replyCount - unseenReplyCount);
  const replyStateClassName = hasUnseenReplies ? 'attention' : item.replyCount > 0 ? 'replied' : '';

  useVisibilityDwell({ elementRef: cardRef, isEnabled: !item.isRead, onDwell: () => onViewed(item._id) });

  return (
    <div
      ref={cardRef}
      data-notification-id={item._id}
      className={`features screen notification card ${isHighlighted ? 'highlighted' : ''}`.trim()}
      style={{ '--notification-accent': accentColor }}
    >
      <NotificationAvatar profilePicPath={item.actor?.profilePicPath} />

      <div className="features screen notification card-content">
        <div className="features screen notification card-header">
          <span className="features screen notification actor-name">{item.actor?.name ?? 'System'}</span>
          {item.actor?.designation && (
            <span className="features screen notification actor-designation">{item.actor.designation}</span>
          )}
          {!item.isRead && <span className="features screen notification unread-dot" />}
          {showCategory && item.categoryLabel && (
            <button
              type="button"
              className="features screen notification category-chip"
              onClick={() => onPressCategory(item)}
            >
              {item.categoryLabel}
            </button>
          )}
        </div>

        <h3 className="features screen notification card-title">{item.title}</h3>
        {item.mentionsMe && (
          <span className="features screen notification mention-label">
            {renderComponentIcon('IconlyMention', 14, 'currentColor')}
            Mentioned you
          </span>
        )}
        {item.body && <p className="features screen notification message">{item.body}</p>}

        <NotificationAttachments attachments={item.sourceAttachments} />
        <NotificationFeatureLinkCards links={item.featureLinks} onPress={onPressFeatureLink} />
        <NotificationActionButtons actions={item.actions} onActionPress={onActionPress} />

        {item.outgoing ? (
          <NotificationOutgoingStatus
            outgoing={item.outgoing}
            onRetry={() => onRetryOutgoing(item)}
            onDiscard={() => onDiscardOutgoing(item)}
          />
        ) : (
          <div className="features screen notification card-footer">
            <span className="features screen notification time">
              {renderComponentIcon('IconlyClock', 14, 'currentColor')}
              {formatNotificationTime(item.lastActivityAt)}
            </span>
            <div className="features screen notification reactions">
              <button type="button" className="features screen notification reaction" onClick={() => onToggleLike(item)}>
                <span className={`features screen notification like-icon ${item.likedByMe ? 'liked' : ''}`.trim()}>
                  {renderComponentIcon(item.likedByMe ? 'IconlyHeartFilled' : 'IconlyHeart', 18, 'currentColor')}
                </span>
                {item.likeCount > 0 && <span>{item.likeCount}</span>}
              </button>
              <button
                type="button"
                className={`features screen notification reaction ${replyStateClassName}`.trim()}
                onClick={() => onToggleThread(item._id)}
              >
                {renderComponentIcon('IconlyChat', 18, 'currentColor')}
                {item.replyCount === 0 && <span>Reply</span>}
                {seenReplyCount > 0 && <span>{seenReplyCount}</span>}
                {hasUnseenReplies && (
                  <span className="features screen notification reply-new-count">{unseenReplyCount} new</span>
                )}
                {hasUnseenReplies && <span className="features screen notification new-dot" />}
              </button>
            </div>
          </div>
        )}

        {threadView && <NotificationReplyThread view={threadView} />}
      </div>
    </div>
  );
};

export default NotificationCard;