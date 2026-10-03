import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import {
  getFileIcon,
  getFileExtension,
  isImageDocument,
  isPdfDocument,
  formatDisplayDate,
  buildDocumentFileLabel,
  stripDocumentExtension,
} from '../../helper/document.helper';
import InlineRenameInput from './InlineRenameInput';

function DocumentPreview({ documentItem }) {
  if (isImageDocument(documentItem)) {
    return (
      <img
        className="doc-details-preview-image"
        src={documentItem.fileUrl}
        alt={documentItem.displayName}
        loading="lazy"
        draggable={false}
      />
    );
  }

  if (isPdfDocument(documentItem)) {
    return (
      <iframe
        className="doc-details-preview-pdf"
        src={`${documentItem.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title={documentItem.displayName}
        loading="lazy"
        tabIndex={-1}
      />
    );
  }

  return (
    <div className="doc-details-preview-icon">
      {renderComponentIcon(getFileIcon(documentItem.originalFileName, documentItem.mimeType), 90, 'currentColor')}
    </div>
  );
}

function DocumentTile({
  documentItem,
  isSelected,
  isCut,
  isRenaming,
  onCommitRename,
  onCancelRename,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
}) {
  const extension = getFileExtension(documentItem.originalFileName);

  return (
    <div
      className={`doc-details-tile ${isSelected ? 'selected' : ''} ${isCut ? 'cut' : ''}`}
      data-document-id={documentItem._id}
      draggable={!isRenaming}
      onDragStart={(event) => onDragStart(event, documentItem)}
      onClick={(event) => onClick(documentItem, event)}
      onDoubleClick={() => onDoubleClick(documentItem)}
      onContextMenu={(event) => onContextMenu(event, documentItem)}
    >
      <div className="doc-details-tile-preview">
        <DocumentPreview documentItem={documentItem} />
        <div className="doc-details-preview-shield" />
      </div>
      {isRenaming ? (
        <InlineRenameInput
          initialValue={stripDocumentExtension(documentItem)}
          suffix={extension ? `.${extension}` : ''}
          onCommit={onCommitRename}
          onCancel={onCancelRename}
        />
      ) : (
        <div className="doc-details-tile-name" title={buildDocumentFileLabel(documentItem)}>
          {buildDocumentFileLabel(documentItem)}
        </div>
      )}
      {documentItem.issueDate && (
        <div className="doc-details-tile-date">Issued: {formatDisplayDate(documentItem.issueDate)}</div>
      )}
      {documentItem.expiryDate && (
        <div className="doc-details-tile-date">Expiry: {formatDisplayDate(documentItem.expiryDate)}</div>
      )}
    </div>
  );
}

export default DocumentTile;