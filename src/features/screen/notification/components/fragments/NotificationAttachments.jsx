import { useAttachmentUrl } from '../../hooks/useAttachmentUrl';
import { resolvePreviewKind } from '../../utils/notification.attachment.kind';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationAttachmentItem = ({ attachment }) => {
  const attachmentUrl = useAttachmentUrl(attachment.filePath);
  const kind = resolvePreviewKind(attachment.mimeType, attachment.fileName);

  if (!attachmentUrl) return <span className="features screen notification attachment-placeholder" />;

  if (kind === 'image') {
    return (
      <a href={attachmentUrl} target="_blank" rel="noreferrer">
        <img src={attachmentUrl} alt={attachment.fileName} className="features screen notification attachment-image" />
      </a>
    );
  }
  if (kind === 'video') {
    return <video src={attachmentUrl} controls className="features screen notification attachment-video" />;
  }
  if (kind === 'audio') {
    return <audio src={attachmentUrl} controls className="features screen notification attachment-audio" />;
  }
  return (
    <a href={attachmentUrl} target="_blank" rel="noreferrer" className="features screen notification attachment-document">
      {renderComponentIcon('IconlyDocument', 18, 'currentColor')}
      {attachment.fileName}
    </a>
  );
};

const NotificationAttachments = ({ attachments }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="features screen notification attachment-group">
      {attachments.map((attachment) => (
        <NotificationAttachmentItem key={attachment.filePath} attachment={attachment} />
      ))}
    </div>
  );
};

export default NotificationAttachments;