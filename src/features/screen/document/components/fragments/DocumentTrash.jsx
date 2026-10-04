import { memo } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import Modal from '@/shared/components/widgets/modal/Modal';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import DocumentFolderTile from './DocumentFolderTile';
import DocumentContextMenu from './DocumentContextMenu';
import DocumentPreview from './DocumentPreview';
import { DOCUMENT_TOOLBAR_ICONS, TOOLBAR_BUTTON_PROPS } from '../../constants/document.constant';
import { formatDisplayDate, formatBytes } from '../../helper/document.helper';
import { formatShortcut } from '../../helper/documentShortcut.helper';

const TrashTile = memo(function TrashTile({ item, isSelected, onClick, onContextMenu }) {
  return (
    <div
      className={`doc-details-tile ${isSelected ? 'selected' : ''}`}
      data-trash-item={item.key}
      onClick={(event) => onClick(item, event)}
      onContextMenu={(event) => onContextMenu(event, item)}
    >
      <div className={`doc-details-tile-preview ${item.kind === 'folder' ? 'doc-details-folder-preview' : ''}`}>
        {item.kind === 'folder' ? (
          renderComponentIcon('FolderIcon', 90, 'var(--color-primary-200)')
        ) : (
          <DocumentPreview documentItem={item.documentItem} />
        )}
        {item.kind === 'document' && <div className="doc-details-preview-shield" />}
      </div>
      <div className="doc-details-tile-name" title={item.name}>
        {item.name}
      </div>
      <div className="doc-details-tile-path" title={item.trashedFromPath}>
        From: {item.trashedFromPath}
      </div>
      <div className="doc-details-tile-date">Deleted: {formatDisplayDate(item.deletedAt)}</div>
      <div className="doc-details-tile-date">{formatBytes(item.size)}</div>
      {item.kind === 'folder' && (
        <div className="doc-details-tile-count">
          {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'} inside
        </div>
      )}
    </div>
  );
});

function DocumentTrash({ trash, shortcuts, undoManager }) {
  const {
    sources,
    activeSource,
    items,
    isLoading,
    isSubmitting,
    hasContent,
    selectedKeys,
    selectedKeySet,
    contextMenu,
    contextMenuItems,
    confirmTarget,
    handleOpenSource,
    handleItemClick,
    handleItemContextMenu,
    handleCloseContextMenu,
    handleBackgroundClick,
    restoreSelected,
    requestDeleteSelected,
    requestEmptyTrash,
    handleCancelConfirm,
    handleConfirmDelete,
  } = trash;

  const buttonProps = {
    ...TOOLBAR_BUTTON_PROPS,
    componentIconSize: '40',
    colorScheme: 'yellow-700',
    iconColor: 'primary-200',
    padding: '0',
  };

  return (
    <>
      <div className="doc-details-trash-toolbar">
        <Button
          {...buttonProps}
          title={`Undo${undoManager.undoLabel ? ` ${undoManager.undoLabel}` : ''} (${formatShortcut(shortcuts.undo)})`}
          componentIconCenter={DOCUMENT_TOOLBAR_ICONS.undo}
          type={undoManager.canUndo ? 'button' : 'disabled'}
          onClick={undoManager.undo}
        />
        <Button
          {...buttonProps}
          title={`Redo${undoManager.redoLabel ? ` ${undoManager.redoLabel}` : ''} (${formatShortcut(shortcuts.redo)})`}
          componentIconCenter={DOCUMENT_TOOLBAR_ICONS.redo}
          type={undoManager.canRedo ? 'button' : 'disabled'}
          onClick={undoManager.redo}
        />
        {activeSource && selectedKeys.length > 0 && (
          <span className="doc-details-toolbar-count">{selectedKeys.length} selected</span>
        )}
        {activeSource && (
          <>
            <Button
              {...buttonProps}
              title="Restore"
              componentIconCenter={DOCUMENT_TOOLBAR_ICONS.restore}
              type={selectedKeys.length > 0 && !isSubmitting ? 'button' : 'disabled'}
              onClick={restoreSelected}
            />
            <Button
              {...buttonProps}
              title={`Delete Permanently (${formatShortcut(shortcuts.deletePermanently)})`}
              componentIconCenter={DOCUMENT_TOOLBAR_ICONS.deletePermanently}
              type={selectedKeys.length > 0 && !isSubmitting ? 'button' : 'disabled'}
              onClick={requestDeleteSelected}
            />
          </>
        )}
        <Button
          {...buttonProps}
          title={activeSource ? 'Empty This Trash Folder' : 'Empty Trash'}
          componentIconCenter={DOCUMENT_TOOLBAR_ICONS.emptyTrash}
          type={hasContent && !isSubmitting ? 'button' : 'disabled'}
          onClick={requestEmptyTrash}
        />
      </div>

      <div className="doc-details-explorer" onClick={handleBackgroundClick} onContextMenu={(event) => event.preventDefault()}>
        {isLoading && !hasContent ? (
          <Loader />
        ) : !hasContent ? (
          <div className="doc-details-empty-state">Trash is empty.</div>
        ) : activeSource ? (
          <div className="doc-details-grid">
            {items.map((item) => (
              <TrashTile
                key={item.key}
                item={item}
                isSelected={selectedKeySet.has(item.key)}
                onClick={handleItemClick}
                onContextMenu={handleItemContextMenu}
              />
            ))}
          </div>
        ) : (
          <div className="doc-details-grid">
            {sources.map((source) => {
              const sourceKey = `${source.sourceType}:${source.sourceId}`;
              return (
                <DocumentFolderTile
                  key={sourceKey}
                  label={`${source.typeLabel} · ${source.label}`}
                  targetFolderId={sourceKey}
                  itemCount={source.itemCount}
                  sizeLabel={formatBytes(source.bytes)}
                  onOpen={handleOpenSource}
                />
              );
            })}
          </div>
        )}
      </div>

      {contextMenu && contextMenuItems.length > 0 && (
        <DocumentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={handleCloseContextMenu}
        />
      )}

      <Modal
        isOpen={Boolean(confirmTarget)}
        type="error"
        title="Delete Permanently"
        message={confirmTarget?.message || ''}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={handleConfirmDelete}
        onSecondaryClick={handleCancelConfirm}
      />
    </>
  );
}

export default DocumentTrash;