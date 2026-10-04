import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../hooks/useDocument';
import { useDocumentTrash } from '../hooks/useDocumentTrash';
import { useDocumentStorage } from '../hooks/useDocumentStorage';
import { useStableCallback } from '../hooks/useStableCallback';
import Modal from '@/shared/components/widgets/modal/Modal';
import Button from '@/shared/components/widgets/button/Button';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Toast from '@/shared/components/widgets/toast/Toast';
import FolderPicker from '@/shared/components/pickers/folder/FolderPicker';
import { usePickerRoot } from '@/shared/components/pickers/Picker';
import DocumentViewer from './fragments/DocumentViewer';
import DocumentSidebar from './fragments/DocumentSidebar';
import DocumentTile from './fragments/DocumentTile';
import DocumentFolderTile from './fragments/DocumentFolderTile';
import DocumentContextMenu from './fragments/DocumentContextMenu';
import DocumentDatesDialog from './fragments/DocumentDatesDialog';
import DocumentShortcutsDialog from './fragments/DocumentShortcutsDialog';
import DocumentStorageBar from './fragments/DocumentStorageBar';
import DocumentTrash from './fragments/DocumentTrash';
import { formatShortcut } from '../helper/documentShortcut.helper';
import {
  DOCUMENT_VIEWS,
  DOCUMENT_VIEW_TABS,
  DOCUMENT_TOOLBAR_ICONS,
  EMPTY_STATE_MESSAGES,
  TOOLBAR_BUTTON_PROPS,
  TRASH_NODE_KEY,
} from '../constants/document.constant';
import { toDateInputValue, formatBytes } from '../helper/document.helper';
import { decoratePickerTree, resolvePathLabel } from '../helper/documentStorage.helper';
import {
  PICKER_ROOT_KEY,
  buildSidebarRoot,
  buildSourceNodeKey,
  buildViewNodeKey,
  buildFolderNodeKey,
  findKeyPath,
} from '../helper/documentSidebar.helper';
import './Document.css';

const PICKER_TYPES = ['equipment', 'user'];

const ROOT_SCOPE = { type: 'root', id: 'root' };

const TRASH_NODE = {
  type: 'folder',
  key: TRASH_NODE_KEY,
  label: 'Trash',
  icon: DOCUMENT_TOOLBAR_ICONS.trash,
  isLoading: false,
  hasMore: false,
  isLoadingMore: false,
  children: [],
};

const ICON_BUTTON_PROPS = {
  ...TOOLBAR_BUTTON_PROPS,
  componentIconSize: '40',
  colorScheme: 'yellow-700',
  iconColor: 'primary-200',
  width: 'fit-content',
  padding: '0',
};

function Document() {
  const { type: routeType, id: routeId } = useParams();
  const [selectedSource, setSelectedSource] = useState(() =>
    routeType && routeId ? { type: routeType, id: routeId } : null
  );
  const [pickerPathKeys, setPickerPathKeys] = useState([PICKER_ROOT_KEY]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const isRootActive = !selectedSource && pickerPathKeys.length === 1;
  const scope = selectedSource || (isRootActive ? ROOT_SCOPE : null);
  const isRootScope = scope?.type === 'root';

  const {
    progressTitle,
    folderSizes,
    viewSizes,
    handleUploadFromInput,
    undoManager,
    toolbarActions,
    shortcuts,
    isShortcutsOpen,
    handleOpenShortcuts,
    handleCloseShortcuts,
    handleChangeShortcut,
    handleResetShortcut,
    handleResetAllShortcuts,
    showToast,
    sourceData,
    documents,
    folders,
    folderItemCounts,
    cutDocumentIds,
    cutFolderIds,
    selectedFolderIds,
    activeView,
    visibleDocuments,
    visibleFolders,
    folderTrail,
    currentFolderId,
    viewTabItems,
    isLoading,
    isDragging,
    toast,
    showProgressModal,
    uploadProgress,
    uploadLabel,
    selectionMode,
    selectedDocumentIds,
    contextMenu,
    contextMenuItems,
    explorerRef,
    marqueeRect,
    renamingItem,
    deleteTarget,
    datesTarget,
    renewTarget,
    isSubmittingDialog,
    viewerTarget,
    viewerHasPrev,
    viewerHasNext,
    handleViewerNavigate,
    handleDownload,
    handleCloseToast,
    handleViewChange,
    handleToggleSelectionMode,
    handleTileClick,
    handleView,
    handleTileContextMenu,
    handleCloseContextMenu,
    handleCommitInlineRename,
    handleCancelInlineRename,
    handleCancelDelete,
    handleConfirmDelete,
    handleCancelDatesDialog,
    handleConfirmDates,
    handleCancelRenewDialog,
    handleConfirmRenew,
    handleCloseViewer,
    handleSaveViewerPages,
    handleConfirmMergePages,
    handleMergePages,
    handleSplitAllPages,
    handleFolderClick,
    handleFolderDragStart,
    handleOpenFolder,
    handleNewFolderClick,
    handleDropDocuments,
    handleDocumentDragStart,
    handleExplorerClick,
    handleExplorerContextMenu,
    handleFolderContextMenu,
  } = useDocument({ sourceType: scope?.type, sourceId: scope?.id });

  const isTrashActive = !selectedSource && pickerPathKeys.length === 2 && pickerPathKeys[1] === TRASH_NODE_KEY;

  const trash = useDocumentTrash({ isActive: isTrashActive, shortcuts, showToast, undoManager });

  const storage = useDocumentStorage({ documents, trashItems: trash.items, trashSources: trash.sources });

  const handlePickerSelect = useStableCallback((type, item, meta) => {
    handleViewChange(DOCUMENT_VIEWS.SOURCE);
    if (type === 'equipment') {
      setSelectedSource({ type: 'equipment', id: item._id });
    } else if (type === 'user') {
      setSelectedSource({ type: meta || 'staff', id: item._id || item.id });
    }
  });

  const pickerRoot = usePickerRoot(PICKER_TYPES, handlePickerSelect);

  const documentRoot = useMemo(
    () => ({ ...pickerRoot, children: [...pickerRoot.children, TRASH_NODE] }),
    [pickerRoot]
  );

  const decoratedPicker = useMemo(
    () => decoratePickerTree(documentRoot, storage.bySource, storage.trashBytes),
    [documentRoot, storage.bySource, storage.trashBytes]
  );

  const selectSource = ({ sourceType, sourceId, folderPathKeys, viewKey }) => {
    setSelectedSource({ type: sourceType, id: sourceId });
    setPickerPathKeys(folderPathKeys);
    handleViewChange(viewKey);
  };

  const handleSidebarNode = useStableCallback((path, node) => {
    const { payload } = node;

    if (payload.kind === 'folder') {
      setPickerPathKeys(path);
      setSelectedSource(null);
      if (path.length === 1) handleOpenFolder(null);
      return;
    }

    const folderPathKeys = path.slice(0, path.indexOf(payload.sourceNodeKey));

    if (payload.kind === 'source') {
      if (selectedSource && selectedSource.id === payload.sourceId) {
        handleViewChange(DOCUMENT_VIEWS.SOURCE);
        return;
      }
      selectSource({
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        folderPathKeys,
        viewKey: DOCUMENT_VIEWS.SOURCE,
      });
      return;
    }

    if (payload.kind === 'documentFolder') {
      setSelectedSource({ type: payload.sourceType, id: payload.sourceId });
      setPickerPathKeys(folderPathKeys);
      handleViewChange(payload.area);
      handleOpenFolder(payload.folderId);
      return;
    }

    selectSource({
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      folderPathKeys,
      viewKey: payload.viewKey,
    });
  });

  const selectedSourceId = selectedSource?.id;

  const sidebarItems = useMemo(
    () => [
      buildSidebarRoot({
        root: documentRoot,
        selection: selectedSourceId
          ? {
              sourceId: selectedSourceId,
              documents,
              folders,
              folderItemCounts,
              viewTabItems,
              activeView,
              currentFolderId,
              onDropDocuments: handleDropDocuments,
            }
          : null,
        onActivate: handleSidebarNode,
      }),
    ],
    [
      documentRoot,
      selectedSourceId,
      documents,
      folders,
      folderItemCounts,
      viewTabItems,
      activeView,
      currentFolderId,
      handleDropDocuments,
      handleSidebarNode,
    ]
  );

  const sidebarActivePath = useMemo(() => {
    if (!selectedSourceId) return pickerPathKeys;
    let activeNodeKey = buildViewNodeKey(selectedSourceId, activeView);
    if (currentFolderId) activeNodeKey = buildFolderNodeKey(selectedSourceId, currentFolderId);
    else if (activeView === DOCUMENT_VIEWS.SOURCE) activeNodeKey = buildSourceNodeKey(selectedSourceId);
    return findKeyPath(sidebarItems, activeNodeKey) || [];
  }, [selectedSourceId, currentFolderId, activeView, sidebarItems, pickerPathKeys]);

  const sourceLabel = sourceData
    ? sourceData.machine
      ? `${sourceData.machine} - ${sourceData.regNo}`
      : sourceData.name || 'Selected source'
    : 'Loading source...';

  const activeViewTab = DOCUMENT_VIEW_TABS.find((tab) => tab.key === activeView);

  const trailingSegments = useMemo(() => {
    const folderSegments = folderTrail.map((folderItem) => ({
      key: folderItem._id,
      label: folderItem.name,
      onSelect: () => handleOpenFolder(folderItem._id),
    }));
    if (selectedSource) {
      return [
        { key: 'selected-source', label: sourceLabel, onSelect: () => handleViewChange(DOCUMENT_VIEWS.SOURCE) },
        ...(activeViewTab
          ? [{ key: 'selected-view', label: activeViewTab.label, onSelect: () => handleViewChange(activeView) }]
          : []),
        ...folderSegments,
      ];
    }
    if (isRootActive) return folderSegments;
    if (isTrashActive && trash.activeSource) {
      return [{ key: 'trash-source', label: trash.activeSource.label, onSelect: trash.handleResetSource }];
    }
    return [];
  }, [
    selectedSource,
    isRootActive,
    sourceLabel,
    activeView,
    activeViewTab,
    folderTrail,
    isTrashActive,
    trash.activeSource,
    trash.handleResetSource,
    handleViewChange,
    handleOpenFolder,
  ]);

  const handleBreadcrumbNavigate = useStableCallback(() => {
    setSelectedSource(null);
    trash.handleResetSource();
    handleOpenFolder(null);
  });

  const parentFolderId = folderTrail.length > 1 ? folderTrail[folderTrail.length - 2]._id : null;
  const showViewTiles = Boolean(scope) && !isRootScope && activeView === DOCUMENT_VIEWS.SOURCE && !currentFolderId;
  const showParentTile = Boolean(currentFolderId) || (!isRootScope && activeView !== DOCUMENT_VIEWS.SOURCE);
  const viewCounts = Object.fromEntries(viewTabItems.map((tab) => [tab.key, tab.badge]));
  const isExplorerEmpty =
    visibleDocuments.length === 0 && visibleFolders.length === 0 && !currentFolderId && !showViewTiles;

  const usedBytes = (() => {
    if (scope && currentFolderId) return folderSizes[currentFolderId] || 0;
    if (selectedSource) {
      if (activeView !== DOCUMENT_VIEWS.SOURCE) return viewSizes[activeView] || 0;
      return storage.bySource[`${selectedSource.type}:${selectedSource.id}`] || 0;
    }
    if (isTrashActive) {
      if (!trash.activeSource) return storage.trashBytes;
      const trashSource = trash.sources.find(
        (candidate) => candidate.sourceType === trash.activeSource.sourceType && candidate.sourceId === trash.activeSource.sourceId
      );
      return trashSource?.bytes || 0;
    }
    const lastKey = pickerPathKeys[pickerPathKeys.length - 1];
    return lastKey === PICKER_ROOT_KEY ? storage.totalBytes : decoratedPicker.bytesByKey[lastKey] || 0;
  })();

  const directoryLabel = (() => {
    if (currentFolderId && folderTrail.length > 0) return folderTrail[folderTrail.length - 1].name;
    if (selectedSource) return activeViewTab ? activeViewTab.label : sourceLabel;
    if (isTrashActive) return trash.activeSource ? trash.activeSource.label : 'Trash';
    return resolvePathLabel(documentRoot, pickerPathKeys) || 'Root';
  })();

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (showProgressModal) event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showProgressModal]);

  return (
    <div
      className={`doc-details-container ${isDragging ? 'dragging-active' : ''}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={handleCloseToast} />

      <Modal
        isOpen={showProgressModal}
        type="progress"
        title={progressTitle}
        message={uploadLabel}
        progress={uploadProgress}
        progressText="Processing..."
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          handleUploadFromInput(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        hidden
        webkitdirectory="true"
        onChange={(event) => {
          handleUploadFromInput(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="doc-details-layout">
        <div className="doc-details-layout-sidebar">
          <DocumentSidebar items={sidebarItems} activePath={sidebarActivePath} onSelect={handleSidebarNode} />
        </div>

        <div className="doc-details-layout-content">
          <FolderPicker
            root={decoratedPicker.root}
            pathKeys={pickerPathKeys}
            onPathKeysChange={setPickerPathKeys}
            trailingSegments={trailingSegments}
            isBodyHidden={Boolean(selectedSource) || isTrashActive}
            onBreadcrumbNavigate={handleBreadcrumbNavigate}
          />

          {isTrashActive && <DocumentTrash trash={trash} shortcuts={shortcuts} undoManager={undoManager} />}

          {scope && (
            <>
              <div className="doc-details-toolbar">
                <Button
                  {...ICON_BUTTON_PROPS}
                  title={`Undo${undoManager.undoLabel ? ` ${undoManager.undoLabel}` : ''} (${formatShortcut(shortcuts.undo)})`}
                  componentIconCenter={DOCUMENT_TOOLBAR_ICONS.undo}
                  type={undoManager.canUndo ? 'button' : 'disabled'}
                  onClick={undoManager.undo}
                />
                <Button
                  {...ICON_BUTTON_PROPS}
                  title={`Redo${undoManager.redoLabel ? ` ${undoManager.redoLabel}` : ''} (${formatShortcut(shortcuts.redo)})`}
                  componentIconCenter={DOCUMENT_TOOLBAR_ICONS.redo}
                  type={undoManager.canRedo ? 'button' : 'disabled'}
                  onClick={undoManager.redo}
                />
                <Button
                  {...ICON_BUTTON_PROPS}
                  componentIconCenter={selectionMode ? 'CancelAllIcon' : 'SelectMultipleIcon'}
                  textColor="white-100"
                  onClick={handleToggleSelectionMode}
                />
                {(selectionMode || selectedDocumentIds.length + selectedFolderIds.length > 1) && (
                  <span className="doc-details-toolbar-count">
                    {selectedDocumentIds.length + selectedFolderIds.length} selected
                  </span>
                )}
                <Button
                  {...ICON_BUTTON_PROPS}
                  title="Upload Files"
                  componentIconCenter={DOCUMENT_TOOLBAR_ICONS.uploadFiles}
                  onClick={() => fileInputRef.current?.click()}
                />
                <Button
                  {...ICON_BUTTON_PROPS}
                  title="Upload Folder"
                  componentIconCenter={DOCUMENT_TOOLBAR_ICONS.uploadFolder}
                  onClick={() => folderInputRef.current?.click()}
                />
                <Button
                  {...ICON_BUTTON_PROPS}
                  title={`New Folder (${formatShortcut(shortcuts.newFolder)})`}
                  componentIconCenter={DOCUMENT_TOOLBAR_ICONS.newFolder}
                  onClick={handleNewFolderClick}
                />
                {toolbarActions.map((toolbarAction) => (
                  <Button
                    key={toolbarAction.key}
                    {...ICON_BUTTON_PROPS}
                    title={`${toolbarAction.label} (${formatShortcut(shortcuts[toolbarAction.key])})`}
                    componentIconLeft={DOCUMENT_TOOLBAR_ICONS[toolbarAction.key]}
                    type={toolbarAction.isDisabled ? 'disabled' : 'button'}
                    onClick={toolbarAction.onSelect}
                  />
                ))}
                <Button
                  {...ICON_BUTTON_PROPS}
                  title="Keyboard Shortcuts"
                  componentIconCenter={DOCUMENT_TOOLBAR_ICONS.hint}
                  onClick={handleOpenShortcuts}
                />
              </div>

              <div
                ref={explorerRef}
                className={`doc-details-explorer ${selectionMode ? 'selecting' : ''}`}
                onClick={handleExplorerClick}
                onContextMenu={handleExplorerContextMenu}
              >
                {isLoading ? (
                  <Loader />
                ) : isExplorerEmpty ? (
                  <div className="doc-details-empty-state">{EMPTY_STATE_MESSAGES[activeView]}</div>
                ) : (
                  <div className="doc-details-grid">
                    {showViewTiles &&
                      DOCUMENT_VIEW_TABS.map((viewTab) => (
                        <DocumentFolderTile
                          key={`view-${viewTab.key}`}
                          label={viewTab.label}
                          dropArea={viewTab.key}
                          itemCount={viewCounts[viewTab.key] ?? 0}
                          sizeLabel={formatBytes(viewSizes[viewTab.key])}
                          onOpen={() => handleViewChange(viewTab.key)}
                          onDropDocuments={handleDropDocuments}
                        />
                      ))}
                    {showParentTile && (
                      <DocumentFolderTile
                        key="parent-folder"
                        label=".."
                        targetFolderId={parentFolderId}
                        dropArea={currentFolderId ? activeView : DOCUMENT_VIEWS.SOURCE}
                        onOpen={() =>
                          currentFolderId ? handleOpenFolder(parentFolderId) : handleViewChange(DOCUMENT_VIEWS.SOURCE)
                        }
                        onDropDocuments={handleDropDocuments}
                      />
                    )}
                    {visibleFolders.map((folderItem) => (
                      <DocumentFolderTile
                        key={folderItem._id}
                        label={folderItem.name}
                        folder={folderItem}
                        targetFolderId={folderItem._id}
                        itemCount={folderItemCounts[folderItem._id] ?? 0}
                        sizeLabel={formatBytes(folderSizes[folderItem._id] || 0)}
                        isSelected={selectedFolderIds.includes(folderItem._id)}
                        isCut={cutFolderIds.includes(folderItem._id)}
                        isRenaming={renamingItem?.kind === 'folder' && renamingItem.id === folderItem._id}
                        onClick={handleFolderClick}
                        onDragStart={handleFolderDragStart}
                        onOpen={handleOpenFolder}
                        onContextMenu={handleFolderContextMenu}
                        onCommitRename={handleCommitInlineRename}
                        onCancelRename={handleCancelInlineRename}
                        onDropDocuments={handleDropDocuments}
                      />
                    ))}
                    {visibleDocuments.map((documentItem) => (
                      <DocumentTile
                        key={documentItem._id}
                        documentItem={documentItem}
                        isSelected={selectedDocumentIds.includes(documentItem._id)}
                        isCut={cutDocumentIds.includes(documentItem._id)}
                        isRenaming={renamingItem?.kind === 'document' && renamingItem.id === documentItem._id}
                        onCommitRename={handleCommitInlineRename}
                        onCancelRename={handleCancelInlineRename}
                        onDragStart={handleDocumentDragStart}
                        onClick={handleTileClick}
                        onDoubleClick={handleView}
                        onContextMenu={handleTileContextMenu}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <DocumentStorageBar label={directoryLabel} usedBytes={usedBytes} totalBytes={storage.totalBytes} />

      {marqueeRect && <div className="doc-details-marquee" style={marqueeRect} />}

      {isShortcutsOpen && (
        <DocumentShortcutsDialog
          shortcuts={shortcuts}
          onChange={handleChangeShortcut}
          onReset={handleResetShortcut}
          onResetAll={handleResetAllShortcuts}
          onClose={handleCloseShortcuts}
        />
      )}

      {contextMenu && contextMenuItems.length > 0 && (
        <DocumentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={handleCloseContextMenu}
        />
      )}

      {datesTarget && (
        <DocumentDatesDialog
          key={datesTarget._id}
          title="Issue & Expiry Dates"
          confirmText="Save"
          showFileInput={false}
          initialIssueDate={toDateInputValue(datesTarget.issueDate)}
          initialExpiryDate={toDateInputValue(datesTarget.expiryDate)}
          isSubmitting={isSubmittingDialog}
          onConfirm={handleConfirmDates}
          onCancel={handleCancelDatesDialog}
        />
      )}

      {renewTarget && (
        <DocumentDatesDialog
          key={`renew-${renewTarget._id}`}
          title={`Renew: ${renewTarget.displayName}`}
          confirmText="Renew"
          showFileInput
          initialIssueDate=""
          initialExpiryDate=""
          isSubmitting={isSubmittingDialog}
          onConfirm={handleConfirmRenew}
          onCancel={handleCancelRenewDialog}
        />
      )}

      {viewerTarget && (
        <DocumentViewer
          key={viewerTarget.mode}
          mode={viewerTarget.mode}
          documents={viewerTarget.documents}
          isBusy={isSubmittingDialog}
          hasPrevFile={viewerHasPrev}
          hasNextFile={viewerHasNext}
          onNavigate={handleViewerNavigate}
          onDownload={handleDownload}
          onClose={handleCloseViewer}
          onSave={handleSaveViewerPages}
          onSplitSelected={handleMergePages}
          onSplitAll={handleSplitAllPages}
          onConfirmMerge={handleConfirmMergePages}
        />
      )}

      <Modal
        isOpen={Boolean(deleteTarget)}
        type="error"
        title="Delete Permanently"
        message={`Are you sure you want to permanently delete "${deleteTarget?.label || ''}"?${deleteTarget?.folderIds?.length ? ' Folders are deleted with everything inside them.' : ''} This action cannot be undone.`}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={handleConfirmDelete}
        onSecondaryClick={handleCancelDelete}
      />
    </div>
  );
}

export default Document;