import { useAttachmentUrl } from '../hooks/useAttachmentUrl';

import './MaintenanceAttachment.css';

function MaintenanceAttachment({ attachment, onRemove }) {
  const mediaUrl = useAttachmentUrl(attachment);
  const isVideo = attachment.mimeType?.startsWith('video/');

  return (
    <div className="fleet maintenance attachment item">
      {mediaUrl ? (
        isVideo ? (
          <video className="fleet maintenance attachment media" src={mediaUrl} controls preload="metadata" />
        ) : (
          <img className="fleet maintenance attachment media" src={mediaUrl} alt={attachment.fileName} />
        )
      ) : (
        <div className="fleet maintenance attachment placeholder" />
      )}

      <span className="fleet maintenance attachment name">{attachment.fileName}</span>

      {attachment.status === 'uploading' && (
        <span className="fleet maintenance attachment progress">{attachment.progress}%</span>
      )}
      {attachment.status === 'error' && (
        <span className="fleet maintenance attachment error">{attachment.errorMessage || 'Upload failed'}</span>
      )}

      {onRemove && (
        <button
          type="button"
          className="fleet maintenance attachment remove"
          onClick={() => onRemove(attachment.localId)}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default MaintenanceAttachment;