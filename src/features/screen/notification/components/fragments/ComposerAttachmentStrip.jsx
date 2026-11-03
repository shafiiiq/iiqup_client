import { useObjectUrl } from '../../hooks/useObjectUrl';
import { buildFileKey } from '../../utils/notification.file.picker';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const resolveFallbackIconName = (file) => {
  if (file.type.startsWith('audio/')) return 'IconlyVoice2';
  if (file.type.startsWith('video/')) return 'IconlyVideo';
  return 'IconlyDocument';
};

const ComposerAttachmentThumbnail = ({ file, onRemove }) => {
  const previewUrl = useObjectUrl(file);
  const isImage = file.type.startsWith('image/');

  return (
    <div className="features screen notification attachment-thumbnail-wrap">
      <button
        type="button"
        className="features screen notification attachment-thumbnail"
        onClick={() => previewUrl && window.open(previewUrl, '_blank', 'noreferrer')}
      >
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="features screen notification attachment-thumbnail-image" />
        ) : (
          renderComponentIcon(resolveFallbackIconName(file), 26, 'currentColor')
        )}
      </button>
      <button type="button" className="features screen notification attachment-remove" onClick={onRemove}>
        {renderComponentIcon('IconlyClose', 12, 'currentColor')}
      </button>
    </div>
  );
};

const ComposerAttachmentStrip = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="features screen notification attachment-strip">
      {files.map((file) => (
        <ComposerAttachmentThumbnail
          key={buildFileKey(file)}
          file={file}
          onRemove={() => onRemove(buildFileKey(file))}
        />
      ))}
    </div>
  );
};

export default ComposerAttachmentStrip;