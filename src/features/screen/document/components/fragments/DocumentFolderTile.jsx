import { memo, useState } from 'react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import { DRAGGED_DOCUMENT_TYPE } from '../../constants/document.constant';
import InlineRenameInput from './InlineRenameInput';

const DocumentFolderTile = memo(function DocumentFolderTile({
  label,
  folder,
  targetFolderId = null,
  dropArea,
  sizeLabel,
  itemCount,
  isRenaming,
  isSelected,
  isCut,
  isNew,
  onClick,
  onDragStart,
  onCommitRename,
  onCancelRename,
  onOpen,
  onContextMenu,
  onDropDocuments,
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragOver = (event) => {
    if (!onDropDocuments || !Array.from(event.dataTransfer.types).includes(DRAGGED_DOCUMENT_TYPE)) return;
    event.preventDefault();
    setIsDropTarget(true);
  };

  const handleDrop = (event) => {
    if (!onDropDocuments) return;
    const payload = event.dataTransfer.getData(DRAGGED_DOCUMENT_TYPE);
    setIsDropTarget(false);
    if (!payload) return;
    event.preventDefault();
    event.stopPropagation();
    onDropDocuments(payload, targetFolderId, dropArea);
  };

  return (
    <div
      className={`doc-details-tile doc-details-folder-tile ${isSelected ? 'selected' : ''} ${isCut ? 'cut' : ''} ${isDropTarget ? 'drop-target' : ''} ${isNew ? 'is-new' : ''}`}
      data-folder-id={folder?._id}
      draggable={Boolean(folder) && !isRenaming}
      onDragStart={folder ? (event) => onDragStart(event, folder) : undefined}
      onClick={folder ? (event) => onClick(folder, event) : undefined}
      onDoubleClick={() => onOpen(targetFolderId)}
      onContextMenu={onContextMenu ? (event) => onContextMenu(event, folder) : undefined}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
    >
      <div className="doc-details-tile-preview doc-details-folder-preview">
        {renderComponentIcon('FolderIcon', 90, 'var(--color-primary-200)')}
      </div>
      {isRenaming ? (
        <InlineRenameInput initialValue={label} suffix="" onCommit={onCommitRename} onCancel={onCancelRename} />
      ) : (
        <div className="doc-details-tile-name" title={label}>
          {label}
        </div>
      )}
      {typeof itemCount === 'number' && (
        <div className="doc-details-tile-count">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
      )}
      {sizeLabel && <div className="doc-details-tile-count">{sizeLabel}</div>}
    </div>
  );
});

export default DocumentFolderTile;