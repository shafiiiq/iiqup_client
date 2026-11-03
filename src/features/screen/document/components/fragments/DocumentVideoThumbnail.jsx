import { useVideoThumbnail } from '@/features/core/sync/cdn/useVideoThumbnail';

function DocumentVideoThumbnail({ documentItem }) {
  const { thumbnailUrl, isLoading } = useVideoThumbnail(documentItem.s3Key);

  if (thumbnailUrl) {
    return (
      <img
        className="doc-details-preview-image"
        src={thumbnailUrl}
        alt={documentItem.displayName}
        decoding="async"
        draggable={false}
      />
    );
  }

  if (isLoading) return null;

  return (
    <video
      className="doc-details-preview-image"
      src={`${documentItem.fileUrl}#t=0.5`}
      preload="metadata"
      muted
      playsInline
      tabIndex={-1}
    />
  );
}

export default DocumentVideoThumbnail;