import { memo } from 'react';
import {
  getFileExtension,
  formatDisplayDate,
  formatBytes,
  buildDocumentFileLabel,
  stripDocumentExtension,
} from '../../helper/document.helper';
import DocumentPreview from './DocumentPreview';
import InlineRenameInput from './InlineRenameInput';

const DocumentTile = memo(function DocumentTile({
  documentItem,
  isSelected,
  isCut,
  isNew,
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
      className={`doc-details-tile ${isSelected ? 'selected' : ''} ${isCut ? 'cut' : ''} ${isNew ? 'is-new' : ''}`}
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
      <div className="doc-details-tile-date">{formatBytes(documentItem.fileSize)}</div>
      {documentItem.issueDate && (
        <div className="doc-details-tile-date">Issued: {formatDisplayDate(documentItem.issueDate)}</div>
      )}
      {documentItem.expiryDate && (
        <div className="doc-details-tile-date">Expiry: {formatDisplayDate(documentItem.expiryDate)}</div>
      )}
    </div>
  );
});

export default DocumentTile;