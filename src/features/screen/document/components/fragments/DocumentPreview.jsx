import { memo } from 'react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import { getFileIcon, getPreviewKind } from '../../helper/document.helper';
import { useLazyVisible } from '../../hooks/useLazyVisible';
import PdfThumbnail from './PdfThumbnail';

const DocumentPreview = memo(function DocumentPreview({ documentItem }) {
  const previewKind = getPreviewKind(documentItem);
  const [wrapperRef, isVisible] = useLazyVisible();

  const fallbackIcon = (
    <div className="doc-details-preview-icon">
      {renderComponentIcon(getFileIcon(documentItem.originalFileName, documentItem.mimeType), 90, 'currentColor')}
    </div>
  );

  let content = fallbackIcon;
  if (isVisible && previewKind === 'image') {
    content = (
      <img
        className="doc-details-preview-image"
        src={documentItem.fileUrl}
        alt={documentItem.displayName}
        decoding="async"
        draggable={false}
      />
    );
  } else if (isVisible && previewKind === 'pdf') {
    content = (
      <PdfThumbnail
        url={documentItem.fileUrl}
        cacheKey={`${documentItem._id}:${documentItem.updatedAt}`}
        fallback={fallbackIcon}
      />
    );
  } else if (isVisible && previewKind === 'video') {
    content = (
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

  return (
    <div ref={wrapperRef} className="doc-details-preview-lazy">
      {content}
    </div>
  );
});

export default DocumentPreview;