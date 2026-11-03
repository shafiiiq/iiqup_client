import { formatNotificationTime } from '../../utils/notification.time.format';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import NotificationAttachments from './NotificationAttachments';
import NotificationAvatar from './NotificationAvatar';
import NotificationFeatureLinkCards from './NotificationFeatureLinkCards';
import NotificationOutgoingStatus from './NotificationOutgoingStatus';

const NotificationReplyItem = ({ reply, isHighlighted, view }) => {
  const authorName = reply.author?.name || 'Unknown user';

  return (
    <div
      data-reply-id={reply._id}
      className={`features screen notification reply ${isHighlighted ? 'highlighted' : ''}`.trim()}
    >
      <div className="features screen notification reply-header">
        <div className="features screen notification reply-author">
          <NotificationAvatar profilePicPath={reply.author?.profilePicPath} isCompact />
          <span className="features screen notification reply-name">{authorName}</span>
          {!reply.isViewedByMe && <span className="features screen notification new-dot" />}
        </div>
        <span className="features screen notification time">{formatNotificationTime(reply.createdAt)}</span>
      </div>

      {reply.parentPreview && (
        <button
          type="button"
          className="features screen notification parent-preview"
          onClick={() => view.onJumpToReply(reply.parentPreview.replyId)}
        >
          <strong>{reply.parentPreview.authorName}</strong>
          <span>{reply.parentPreview.text}</span>
        </button>
      )}

      {reply.mentionsMe && (
        <span className="features screen notification mention-label">
          {renderComponentIcon('IconlyMention', 14, 'currentColor')}
          Mentioned you
        </span>
      )}
      {reply.text && <p className="features screen notification reply-text">{reply.text}</p>}
      <NotificationAttachments attachments={reply.attachments ?? []} />
      <NotificationFeatureLinkCards links={reply.featureLinks ?? []} onPress={view.onPressFeatureLink} />

      {reply.outgoing ? (
        <NotificationOutgoingStatus
          outgoing={reply.outgoing}
          onRetry={() => view.onRetryOutgoing(reply)}
          onDiscard={() => view.onDiscardOutgoing(reply)}
        />
      ) : (
        <div className="features screen notification reply-actions">
          <button type="button" className="features screen notification reaction" onClick={() => view.onToggleReplyLike(reply)}>
            <span className={`features screen notification like-icon ${reply.likedByMe ? 'liked' : ''}`.trim()}>
              {renderComponentIcon(reply.likedByMe ? 'IconlyHeartFilled' : 'IconlyHeart', 18, 'currentColor')}
            </span>
            {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
          </button>
          <button type="button" className="features screen notification reaction" onClick={() => view.onReplyToReply(reply)}>
            {renderComponentIcon('IconlyReply', 18, 'currentColor')}
            <span>Reply</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationReplyItem;