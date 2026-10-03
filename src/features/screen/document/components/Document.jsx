import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../hooks/useDocument';
import Modal from '@/shared/components/widgets/modal/Modal';
import Button from '@/shared/components/widgets/button/Button';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import DocumentViewer from './fragments/DocumentViewer';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Toast from '@/shared/components/widgets/toast/Toast';
import FolderPicker from '@/shared/components/pickers/folder/FolderPicker';
import { usePickerRoot } from '@/shared/components/pickers/Picker';
import DocumentTile from './fragments/DocumentTile';
import DocumentFolderTile from './fragments/DocumentFolderTile';
import DocumentContextMenu from './fragments/DocumentContextMenu';
import DocumentDatesDialog from './fragments/DocumentDatesDialog';
import {
  DOCUMENT_VIEWS,
  DOCUMENT_TOOLBAR_ICONS,
  EMPTY_STATE_MESSAGES,
  TOOLBAR_BUTTON_PROPS,
} from '../constants/document.constant';
import { toDateInputValue } from '../helper/document.helper';
import {
  PICKER_ROOT_KEY,
  buildSidebarRoot,
  buildViewNodeKey,
  buildFolderNodeKey,
  findKeyPath,
} from '../helper/documentSidebar.helper';
import './Document.css';

const PICKER_TYPES = ['equipment', 'user'];

function Document() {
  const { type: routeType, id: routeId } = useParams();
  const [selectedSource, setSelectedSource] = useState(() =>
    routeType && routeId ? { type: routeType, id: routeId } : null
  );
  const [pickerPathKeys, setPickerPathKeys] = useState([PICKER_ROOT_KEY]);

  const {
    toolbarActions,
    sourceData,
    documents,
    folders,
    folderItemCounts,
    cutDocumentIds,
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
    selectedFolderIds,
    cutFolderIds,
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
  } = useDocument({ sourceType: selectedSource?.type, sourceId: selectedSource?.id });

  const handlePickerSelect = (type, item, meta) => {
    handleViewChange(DOCUMENT_VIEWS.ALL);
    if (type === 'equipment') {
      setSelectedSource({ type: 'equipment', id: item._id });
    } else if (type === 'user') {
      setSelectedSource({ type: meta || 'staff', id: item._id || item.id });
    }
  };

  const root = usePickerRoot(PICKER_TYPES, handlePickerSelect);

  const selectSource = ({ sourceType, sourceId, folderPathKeys, viewKey }) => {
    setSelectedSource({ type: sourceType, id: sourceId });
    setPickerPathKeys(folderPathKeys);
    handleViewChange(viewKey);
  };

  const handleSidebarNode = (path, node) => {
    const { payload } = node;

    if (payload.kind === 'folder') {
      setPickerPathKeys(path);
      setSelectedSource(null);
      return;
    }

    if (payload.kind === 'source') {
      if (selectedSource && selectedSource.id === payload.sourceId) return;
      selectSource({
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        folderPathKeys: path.slice(0, path.indexOf(payload.sourceNodeKey)),
        viewKey: DOCUMENT_VIEWS.ALL,
      });
      return;
    }

    const folderPathKeys = path.slice(0, path.indexOf(payload.sourceNodeKey));

    if (payload.kind === 'documentFolder') {
      setPickerPathKeys(folderPathKeys);
      handleViewChange(DOCUMENT_VIEWS.ALL);
      handleOpenFolder(payload.folderId);
      return;
    }

    selectSource({
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      folderPathKeys,
      viewKey: payload.viewKey,
    });
  };

  const sidebarItems = [
    buildSidebarRoot({
      root,
      selection: selectedSource
        ? {
          sourceId: selectedSource.id,
          documents,
          folders,
          viewTabItems,
          activeView,
          currentFolderId,
          onDropDocuments: handleDropDocuments,
        }
        : null,
      onActivate: handleSidebarNode,
    }),
  ];

  const activeSidebarNodeKey = selectedSource
    ? currentFolderId
      ? buildFolderNodeKey(selectedSource.id, currentFolderId)
      : buildViewNodeKey(selectedSource.id, activeView)
    : null;

  const sidebarActivePath = selectedSource
    ? findKeyPath(sidebarItems, activeSidebarNodeKey) || []
    : pickerPathKeys;

  const sourceLabel = sourceData
    ? sourceData.machine
      ? `${sourceData.machine} - ${sourceData.regNo}`
      : sourceData.name || 'Selected source'
    : 'Loading source...';

  const trailingSegments = selectedSource
    ? [
      { key: 'selected-source', label: sourceLabel, onSelect: () => handleViewChange(DOCUMENT_VIEWS.ALL) },
      ...folderTrail.map((folderItem) => ({
        key: folderItem._id,
        label: folderItem.name,
        onSelect: () => handleOpenFolder(folderItem._id),
      })),
    ]
    : [];

  const parentFolderId = folderTrail.length > 1 ? folderTrail[folderTrail.length - 2]._id : null;
  const isExplorerEmpty = visibleDocuments.length === 0 && visibleFolders.length === 0 && !currentFolderId;

  return (
    <div
      className={`doc-details-container ${isDragging ? 'dragging-active' : ''}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} onClose={handleCloseToast} />

      <Modal
        isOpen={showProgressModal}
        type="progress"
        title="Uploading"
        message={uploadLabel}
        progress={uploadProgress}
        progressText="Processing..."
      />

      <div className="doc-details-layout">
        <div className="doc-details-layout-sidebar">
          <Tabs
            maxHeight="1090px"
            title={null}
            items={sidebarItems}
            activePath={sidebarActivePath}
            onSelect={handleSidebarNode}
            showSearch
            filterOnSearch
            mergeOpenKeys
            searchShortcut={null}
            searchPlaceholder="Search"
          />
        </div>

        <div className="doc-details-layout-content">
          <FolderPicker
            root={root}
            pathKeys={pickerPathKeys}
            onPathKeysChange={setPickerPathKeys}
            trailingSegments={trailingSegments}
            isBodyHidden={!!selectedSource}
            onBreadcrumbNavigate={() => setSelectedSource(null)}
          />

          {selectedSource && (
            <>
              <div className="doc-details-toolbar">
                <Button
                  {...TOOLBAR_BUTTON_PROPS}
                  componentIconLeft={selectionMode ? 'CancelAllIcon' : 'SelectMultipleIcon'}
                  componentIconSize="40"
                  colorScheme="yellow-700"
                  iconColor="primary-200"
                  textColor="white-100"
                  width="fit-content"
                  padding="0"
                  onClick={handleToggleSelectionMode}
                />
                {selectionMode && (
                  <span className="doc-details-toolbar-count">{selectedDocumentIds.length + selectedFolderIds.length} selected</span>
                )}
                <Button
                  {...TOOLBAR_BUTTON_PROPS}
                  title="New Folder"
                  componentIconLeft={DOCUMENT_TOOLBAR_ICONS.newFolder}
                  componentIconSize="40"
                  colorScheme="yellow-700"
                  iconColor="primary-200"
                  width="fit-content"
                  padding="0"
                  type={activeView === DOCUMENT_VIEWS.ALL ? 'button' : 'disabled'}
                  onClick={handleNewFolderClick}
                />
                {toolbarActions.map((toolbarAction) => (
                  <Button
                    key={toolbarAction.key}
                    {...TOOLBAR_BUTTON_PROPS}
                    title={toolbarAction.label}
                    componentIconLeft={DOCUMENT_TOOLBAR_ICONS[toolbarAction.key]}
                    componentIconSize="40"
                    colorScheme="yellow-700"
                    iconColor="primary-200"
                    width="fit-content"
                    padding="0"
                    type={toolbarAction.isDisabled ? 'disabled' : 'button'}
                    onClick={toolbarAction.onSelect}
                  />
                ))}
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
                    {currentFolderId && (
                      <DocumentFolderTile
                        key="parent-folder"
                        label=".."
                        onOpen={() => handleOpenFolder(parentFolderId)}
                        onDropDocuments={(payload) => handleDropDocuments(payload, parentFolderId)}
                      />
                    )}
                    {visibleFolders.map((folderItem) => (
                      <DocumentFolderTile
                        key={folderItem._id}
                        label={folderItem.name}
                        folder={folderItem}
                        onOpen={() => handleOpenFolder(folderItem._id)}
                        onContextMenu={handleFolderContextMenu}
                        itemCount={folderItemCounts[folderItem._id] ?? 0}
                        isSelected={selectedFolderIds.includes(folderItem._id)}
                        isCut={cutFolderIds.includes(folderItem._id)}
                        onClick={handleFolderClick}
                        onDragStart={handleFolderDragStart}
                        isRenaming={renamingItem?.kind === 'folder' && renamingItem.id === folderItem._id}
                        onCommitRename={handleCommitInlineRename}
                        onCancelRename={handleCancelInlineRename}
                        onDropDocuments={(payload) => handleDropDocuments(payload, folderItem._id)}
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

      {marqueeRect && <div className="doc-details-marquee" style={marqueeRect} />}

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
          key={`${viewerTarget.mode}-${viewerTarget.documents.map((documentItem) => documentItem._id).join('-')}`}
          mode={viewerTarget.mode}
          documents={viewerTarget.documents}
          isBusy={isSubmittingDialog}
          onClose={handleCloseViewer}
          onSave={handleSaveViewerPages}
          onSplitSelected={handleMergePages}
          onSplitAll={handleSplitAllPages}
          onConfirmMerge={handleConfirmMergePages}
        />
      )}

      <Modal
        isOpen={!!deleteTarget}
        type="error"
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.displayName || ''}"? This action cannot be undone.`}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={handleConfirmDelete}
        onSecondaryClick={handleCancelDelete}
      />
    </div>
  );
}

export default Document;