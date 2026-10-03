import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  fetchDocumentsBySource,
  fetchFoldersBySource,
  createFolder,
  renameFolder,
  moveDocument,
  copyDocument,
  fetchSourceEntity,
  registerUploadedDocuments,
  renewDocument,
  updateDocumentDates,
  renameDocument,
  deleteDocument,
  mergeDocumentPages,
  editDocumentPages,
  moveFolder,
  copyFolder,
  splitDocument,
  getSignedUrl,
} from '../api/document.api';
import { uploadFile } from '@/features/core/sync/upload/upload.service';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
  DOCUMENT_UPLOAD_FEATURE,
  DRAGGED_DOCUMENT_TYPE,
  DOCUMENT_VIEWS,
  DOCUMENT_VIEW_TABS,
  DOCUMENT_URL_REFRESH_INTERVAL_MILLISECONDS,
  RENEWAL_STATUS,
  buildDocumentKeyPrefix,
} from '../constants/document.constant';
import {
  isAcceptedFile,
  isPdfDocument,
  filterDocumentsByView,
  buildViewTabItems,
  countFolderItems,
  validateDateRange,
  buildDocumentFileLabel,
  buildUniqueFolderName,
  stripDocumentExtension,
  isFolderInsideAny,
} from '../helper/document.helper';
import { useMarqueeSelection } from './useMarqueeSelection';

export const useDocument = ({ sourceType, sourceId } = {}) => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [sourceData, setSourceData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeView, setActiveView] = useState(DOCUMENT_VIEWS.ALL);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  const [renamingItem, setRenamingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [datesTarget, setDatesTarget] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);
  const [viewerTarget, setViewerTarget] = useState(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const explorerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => setToast({ isOpen: true, message, type }), []);
  const handleCloseToast = () => setToast((previous) => ({ ...previous, isOpen: false }));

  const loadDocuments = useCallback(
    async ({ silent = false } = {}) => {
      if (!sourceType || !sourceId) return;
      if (!silent) setIsLoading(true);
      try {
        const [documentData, folderData] = await Promise.all([
          fetchDocumentsBySource({ sourceType, sourceId }),
          fetchFoldersBySource({ sourceType, sourceId }),
        ]);
        setDocuments(documentData);
        setFolders(folderData);
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [sourceType, sourceId, showToast]
  );

  useEffect(() => {
    setSourceData(null);
    setDocuments([]);
    setFolders([]);
    setCurrentFolderId(null);
    setClipboard(null);
    setSelectionMode(false);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
    setViewerTarget(null);
    setContextMenu(null);
    if (!sourceType || !sourceId) return;
    fetchSourceEntity({ type: sourceType, id: sourceId })
      .then(setSourceData)
      .catch((error) => console.error('Error fetching source data:', error));
    loadDocuments();
  }, [sourceType, sourceId, loadDocuments]);

  useEffect(() => {
    if (!sourceType || !sourceId) return undefined;
    const intervalId = setInterval(() => loadDocuments({ silent: true }), DOCUMENT_URL_REFRESH_INTERVAL_MILLISECONDS);
    return () => clearInterval(intervalId);
  }, [sourceType, sourceId, loadDocuments]);

  useEffect(() => {
    if (!sourceData) {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
      return undefined;
    }
    const subtitles = {
      equipment: `${sourceData.machine || 'Equipment'} - ${sourceData.regNo || sourceId}`,
      operator: `Operator > ${sourceData.name || 'Operator'} - ${sourceData.qatarId || sourceId}`,
      mechanic: `Mechanis > ${sourceData.name || 'Mechanic'}`,
      staff: `${sourceData.name || 'Office Staff'} - ${sourceData.email || sourceId}`,
    };
    setHeaderTitle('Documents');
    setHeaderSubtitle(subtitles[sourceType] ?? sourceId);
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [sourceData, sourceType, sourceId, setHeaderTitle, setHeaderSubtitle]);

  const uploadFiles = useCallback(
    async (files) => {
      const acceptedFiles = files.filter(isAcceptedFile);
      if (acceptedFiles.length === 0) {
        showToast('Unsupported file type', 'error');
        return;
      }
      if (acceptedFiles.length < files.length) showToast('Some files were skipped because of unsupported type', 'info');

      setShowProgressModal(true);
      setUploadProgress(0);

      const completedSessionIds = [];
      let failure = null;

      try {
        for (let fileIndex = 0; fileIndex < acceptedFiles.length; fileIndex += 1) {
          const file = acceptedFiles[fileIndex];
          setUploadLabel(`Uploading ${fileIndex + 1} of ${acceptedFiles.length}: ${file.name}`);
          const { sessionId } = await uploadFile({
            file,
            feature: DOCUMENT_UPLOAD_FEATURE,
            context: sourceType,
            entityId: sourceId,
            keyPrefix: buildDocumentKeyPrefix(sourceType, sourceId),
            onProgress: (percent) =>
              setUploadProgress(Math.round(((fileIndex + percent / 100) / acceptedFiles.length) * 100)),
          });
          completedSessionIds.push(sessionId);
        }
      } catch (error) {
        failure = error;
      }

      try {
        if (completedSessionIds.length > 0) {
          await registerUploadedDocuments({
            sourceType,
            sourceId,
            sessionIds: completedSessionIds,
            folderId: currentFolderId,
          });
          await loadDocuments({ silent: true });
        }
      } catch (error) {
        failure = failure || error;
      }

      setShowProgressModal(false);
      setUploadProgress(0);
      setUploadLabel('');

      if (failure) showToast(`Error: ${failure.message}`, 'error');
      else showToast(`${completedSessionIds.length} document(s) uploaded`, 'success');
    },
    [sourceType, sourceId, currentFolderId, loadDocuments, showToast]
  );

  const stageClipboard = useCallback(
    (mode, documentIds, folderIds = []) => {
      const total = documentIds.length + folderIds.length;
      if (total === 0) return false;
      setClipboard({ mode, documentIds, folderIds });
      Promise.resolve(navigator.clipboard?.writeText('')).catch(() => null);
      showToast(`${total} item(s) ${mode === 'cut' ? 'cut' : 'copied'}`, 'info');
      return true;
    },
    [showToast]
  );

  const pasteClipboardInto = useCallback(
    async (targetFolderId) => {
      if (!clipboard) return;
      const { mode, documentIds, folderIds } = clipboard;
      if (folderIds.length > 0 && isFolderInsideAny(folders, targetFolderId, folderIds)) {
        showToast('A folder cannot be pasted into itself', 'error');
        return;
      }
      try {
        await Promise.all([
          ...documentIds.map((documentId) =>
            mode === 'cut'
              ? moveDocument({ documentId, folderId: targetFolderId })
              : copyDocument({ documentId, folderId: targetFolderId })
          ),
          ...folderIds.map((folderId) =>
            mode === 'cut'
              ? moveFolder({ folderId, parentFolderId: targetFolderId })
              : copyFolder({ folderId, parentFolderId: targetFolderId })
          ),
        ]);
        if (mode === 'cut') setClipboard(null);
        setSelectedDocumentIds([]);
        setSelectedFolderIds([]);
        showToast(`${documentIds.length + folderIds.length} item(s) pasted`, 'success');
        await loadDocuments({ silent: true });
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      }
    },
    [clipboard, folders, loadDocuments, showToast]
  );

  useEffect(() => {
    if (!sourceType || !sourceId) return undefined;

    const containsFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

    const handleDragOver = (event) => {
      event.preventDefault();
      if (containsFiles(event)) setIsDragging(true);
    };

    const handleDragLeave = (event) => {
      if (!event.relatedTarget) setIsDragging(false);
    };

    const handleDrop = (event) => {
      event.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(event.dataTransfer?.files || []);
      if (droppedFiles.length > 0) uploadFiles(droppedFiles);
    };

    const handlePaste = (event) => {
      const targetTagName = event.target?.tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA') return;
      const pastedFiles = Array.from(event.clipboardData?.files || []);
      if (pastedFiles.length > 0) {
        event.preventDefault();
        setClipboard(null);
        uploadFiles(pastedFiles);
        return;
      }
      if (!clipboard) return;
      event.preventDefault();
      if (activeView !== DOCUMENT_VIEWS.ALL) {
        showToast('Open All Documents to paste here', 'info');
        return;
      }
      pasteClipboardInto(currentFolderId);
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('paste', handlePaste);
      setIsDragging(false);
    };
  }, [sourceType, sourceId, uploadFiles, clipboard, activeView, currentFolderId, pasteClipboardInto, showToast]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (viewerTarget) return;
      if (event.key === 'Escape') {
        setContextMenu(null);
        setSelectedDocumentIds([]);
        setSelectedFolderIds([]);
        return;
      }
      const targetTagName = event.target?.tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA') return;
      if (event.key === 'F2') {
        if (selectedDocumentIds.length === 1 && selectedFolderIds.length === 0) {
          event.preventDefault();
          setRenamingItem({ kind: 'document', id: selectedDocumentIds[0] });
        } else if (selectedFolderIds.length === 1 && selectedDocumentIds.length === 0) {
          event.preventDefault();
          setRenamingItem({ kind: 'folder', id: selectedFolderIds[0] });
        }
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      const pressedKey = event.key.toLowerCase();
      if (pressedKey !== 'c' && pressedKey !== 'x') return;
      if (stageClipboard(pressedKey === 'x' ? 'cut' : 'copy', selectedDocumentIds, selectedFolderIds)) {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [stageClipboard, selectedDocumentIds, selectedFolderIds, viewerTarget]);

  const handleMarqueeSelect = useCallback(({ documentIds, folderIds }) => {
    setSelectedDocumentIds(documentIds);
    setSelectedFolderIds(folderIds);
  }, []);

  const marqueeRect = useMarqueeSelection({
    isEnabled: selectionMode,
    containerRef: explorerRef,
    onSelectItems: handleMarqueeSelect,
  });

  const visibleDocuments = useMemo(
    () =>
      activeView === DOCUMENT_VIEWS.ALL
        ? documents.filter((documentItem) => (documentItem.folderId || null) === currentFolderId)
        : filterDocumentsByView(documents, activeView),
    [documents, activeView, currentFolderId]
  );

  const visibleFolders = useMemo(
    () =>
      activeView === DOCUMENT_VIEWS.ALL
        ? folders.filter((folderItem) => (folderItem.parentFolderId || null) === currentFolderId)
        : [],
    [folders, activeView, currentFolderId]
  );

  const folderTrail = useMemo(() => {
    const folderById = new Map(folders.map((folderItem) => [folderItem._id, folderItem]));
    const trail = [];
    let cursorFolder = folderById.get(currentFolderId);
    while (cursorFolder) {
      trail.unshift(cursorFolder);
      cursorFolder = folderById.get(cursorFolder.parentFolderId);
    }
    return trail;
  }, [folders, currentFolderId]);
  const folderItemCounts = useMemo(
    () =>
      Object.fromEntries(
        folders.map((folderItem) => [folderItem._id, countFolderItems(documents, folders, folderItem._id)])
      ),
    [documents, folders]
  );

  const viewTabItems = useMemo(
    () => buildViewTabItems(DOCUMENT_VIEW_TABS, documents, folders),
    [documents, folders]
  );

  const handleViewChange = (viewKey) => {
    setActiveView(viewKey);
    setCurrentFolderId(null);
    setSelectionMode(false);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
    setContextMenu(null);
  };

  const handleOpenFolder = (folderId) => {
    setCurrentFolderId(folderId);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
    setContextMenu(null);
  };

  const handleNewFolderClick = async () => {
    if (activeView !== DOCUMENT_VIEWS.ALL) return;
    try {
      const createdFolder = await createFolder({
        sourceType,
        sourceId,
        parentFolderId: currentFolderId,
        name: buildUniqueFolderName(folders, currentFolderId),
      });
      await loadDocuments({ silent: true });
      setSelectedDocumentIds([]);
      setRenamingItem({ kind: 'folder', id: createdFolder._id });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleRenameFolderClick = (folderItem) => setRenamingItem({ kind: 'folder', id: folderItem._id });

  const handleMoveItems = async (documentIds, folderIds, folderId) => {
    try {
      await Promise.all([
        ...documentIds.map((documentId) => moveDocument({ documentId, folderId })),
        ...folderIds.map((id) => moveFolder({ folderId: id, parentFolderId: folderId })),
      ]);
      setSelectedDocumentIds([]);
      setSelectedFolderIds([]);
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleDropDocuments = (payload, folderId) => {
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return;
    }
    const documentIds = Array.isArray(parsed) ? parsed : parsed?.documentIds || [];
    const folderIds = Array.isArray(parsed) ? [] : parsed?.folderIds || [];
    if (documentIds.length === 0 && folderIds.length === 0) return;
    if (folderIds.length > 0 && isFolderInsideAny(folders, folderId, folderIds)) return;
    handleMoveItems(documentIds, folderIds, folderId);
  };

  const setDragPayload = (event, documentIds, folderIds) => {
    event.dataTransfer.setData(DRAGGED_DOCUMENT_TYPE, JSON.stringify({ documentIds, folderIds }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDocumentDragStart = (event, documentItem) => {
    const isSelected = selectedDocumentIds.includes(documentItem._id);
    setDragPayload(
      event,
      isSelected ? selectedDocumentIds : [documentItem._id],
      isSelected ? selectedFolderIds : []
    );
  };

  const handleFolderDragStart = (event, folderItem) => {
    const isSelected = selectedFolderIds.includes(folderItem._id);
    setDragPayload(
      event,
      isSelected ? selectedDocumentIds : [],
      isSelected ? selectedFolderIds : [folderItem._id]
    );
  };

  const handleExplorerClick = (event) => {
    if (selectionMode || event.target.closest('[data-document-id],[data-folder-id]')) return;
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
  };

  const handleExplorerContextMenu = (event) => {
    if (activeView !== DOCUMENT_VIEWS.ALL) return;
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, isBackground: true });
  };

  const handleFolderContextMenu = (event, folderItem) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedFolderIds.includes(folderItem._id)) {
      setSelectedFolderIds([folderItem._id]);
      setSelectedDocumentIds([]);
    }
    setContextMenu({ x: event.clientX, y: event.clientY, folderId: folderItem._id });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((previous) => !previous);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
  };

  const handleTileClick = (documentItem, event) => {
    const isMultiSelectGesture = event.metaKey || event.ctrlKey;
    if (!selectionMode && !isMultiSelectGesture) {
      setSelectedDocumentIds([documentItem._id]);
      setSelectedFolderIds([]);
      return;
    }
    if (!selectionMode) setSelectionMode(true);
    setSelectedDocumentIds((previous) =>
      previous.includes(documentItem._id)
        ? previous.filter((documentId) => documentId !== documentItem._id)
        : [...previous, documentItem._id]
    );
  };

  const handleView = (documentItem) => setViewerTarget({ mode: 'view', documents: [documentItem] });

  const handleFolderClick = (folderItem, event) => {
    const isMultiSelectGesture = event.metaKey || event.ctrlKey;
    if (!selectionMode && !isMultiSelectGesture) {
      setSelectedFolderIds([folderItem._id]);
      setSelectedDocumentIds([]);
      return;
    }
    if (!selectionMode) setSelectionMode(true);
    setSelectedFolderIds((previous) =>
      previous.includes(folderItem._id)
        ? previous.filter((folderId) => folderId !== folderItem._id)
        : [...previous, folderItem._id]
    );
  };

  const handleTileContextMenu = (event, documentItem) => {
    event.preventDefault();
    event.stopPropagation();
    const isMultiple = selectedDocumentIds.length >= 2 && selectedDocumentIds.includes(documentItem._id);
    if (!selectedDocumentIds.includes(documentItem._id)) {
      setSelectedDocumentIds([documentItem._id]);
      setSelectedFolderIds([]);
    }
    setContextMenu({ x: event.clientX, y: event.clientY, documentId: documentItem._id, isMultiple });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleRenameClick = (documentItem) => setRenamingItem({ kind: 'document', id: documentItem._id });

  const handleCancelInlineRename = () => setRenamingItem(null);

  const handleCommitInlineRename = async (draftName) => {
    const renameTargetItem = renamingItem;
    setRenamingItem(null);
    const trimmedName = draftName.trim();
    if (!renameTargetItem || !trimmedName) return;

    try {
      if (renameTargetItem.kind === 'folder') {
        const folderItem = folders.find((candidate) => candidate._id === renameTargetItem.id);
        if (!folderItem || folderItem.name === trimmedName) return;
        await renameFolder({ folderId: folderItem._id, name: trimmedName });
      } else {
        const documentItem = documents.find((candidate) => candidate._id === renameTargetItem.id);
        if (!documentItem || stripDocumentExtension(documentItem) === trimmedName) return;
        await renameDocument({ documentId: documentItem._id, newFileName: trimmedName });
      }
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleDownload = async (documentItem) => {
    try {
      const signedUrl = await getSignedUrl(documentItem.s3Key);
      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      const blobUrl = URL.createObjectURL(await fileResponse.blob());
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = buildDocumentFileLabel(documentItem);
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      showToast(`Error downloading: ${error.message}`, 'error');
    }
  };

  const handleDeleteClick = (documentItem) => setDeleteTarget(documentItem);
  const handleCancelDelete = () => setDeleteTarget(null);

  const handleConfirmDelete = async () => {
    const targetDocument = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteDocument(targetDocument._id);
      setSelectedDocumentIds((previous) => previous.filter((documentId) => documentId !== targetDocument._id));
      showToast('Document deleted', 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleCancelDatesDialog = () => setDatesTarget(null);

  const handleConfirmDates = async ({ issueDate, expiryDate }) => {
    const validationMessage = validateDateRange(issueDate, expiryDate);
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }
    setIsSubmittingDialog(true);
    try {
      await updateDocumentDates({ documentId: datesTarget._id, issueDate, expiryDate });
      setDatesTarget(null);
      showToast('Dates saved', 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmittingDialog(false);
    }
  };

  const handleCancelRenewDialog = () => setRenewTarget(null);

  const handleConfirmRenew = async ({ issueDate, expiryDate, file }) => {
    if (!file) {
      showToast('Select the new file to renew with', 'error');
      return;
    }
    if (!isAcceptedFile(file)) {
      showToast('Unsupported file type', 'error');
      return;
    }
    const validationMessage = validateDateRange(issueDate, expiryDate);
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }

    const targetDocument = renewTarget;
    setRenewTarget(null);
    setShowProgressModal(true);
    setUploadProgress(0);
    setUploadLabel(`Renewing: ${targetDocument.displayName}`);

    try {
      const { sessionId } = await uploadFile({
        file,
        feature: DOCUMENT_UPLOAD_FEATURE,
        context: targetDocument.sourceType,
        entityId: targetDocument.sourceId,
        keyPrefix: buildDocumentKeyPrefix(targetDocument.sourceType, targetDocument.sourceId),
        onProgress: setUploadProgress,
      });
      await renewDocument({ documentId: targetDocument._id, uploadSessionId: sessionId, issueDate, expiryDate });
      showToast('Document renewed', 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setShowProgressModal(false);
      setUploadProgress(0);
      setUploadLabel('');
    }
  };

  const handleSplitClick = (documentItem) => setViewerTarget({ mode: 'split', documents: [documentItem] });

  const handleCloseViewer = () => setViewerTarget(null);

  const handleSaveViewerPages = async (documentId, pages) => {
    setIsSubmittingDialog(true);
    try {
      await editDocumentPages({ documentId, pages });
      setViewerTarget(null);
      showToast('Document updated', 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmittingDialog(false);
    }
  };

  const handleMergePages = async (documentId, pageNumbers) => {
    try {
      await splitDocument({ documentId, splitType: 'specific', pages: pageNumbers });
      setViewerTarget(null);
      showToast(`Extracted ${pageNumbers.length} pages`, 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleSplitAllPages = async (documentId, totalPages) => {
    try {
      await splitDocument({ documentId, splitType: 'every', pages: [] });
      setViewerTarget(null);
      showToast(`Split into ${totalPages} pages`, 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleMergeSelected = () => {
    const selectedDocuments = selectedDocumentIds
      .map((documentId) => documents.find((documentItem) => documentItem._id === documentId))
      .filter(Boolean);
    setViewerTarget({ mode: 'merge', documents: selectedDocuments });
  };

  const handleConfirmMergePages = async (pages) => {
    setIsSubmittingDialog(true);
    try {
      await mergeDocumentPages({ sourceType, sourceId, pages });
      setViewerTarget(null);
      setSelectionMode(false);
      setSelectedDocumentIds([]);
      showToast('Documents merged', 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmittingDialog(false);
    }
  };

  const buildContextMenuItems = () => {
    if (!contextMenu) return [];

    if (contextMenu.isBackground) {
      const backgroundMenuItems = [{ key: 'new-folder', label: 'New Folder', onSelect: handleNewFolderClick }];
      if (clipboard) {
        backgroundMenuItems.push({
          key: 'paste',
          label: 'Paste',
          onSelect: () => pasteClipboardInto(currentFolderId),
        });
      }
      return backgroundMenuItems;
    }

    if (contextMenu.folderId) {
      const folderItem = folders.find((candidate) => candidate._id === contextMenu.folderId);
      if (!folderItem) return [];
      const folderMenuItems = [
        { key: 'rename-folder', label: 'Rename Folder', onSelect: () => handleRenameFolderClick(folderItem) },
        { key: 'cut', label: 'Cut', onSelect: () => stageClipboard('cut', selectedDocumentIds, selectedFolderIds) },
        { key: 'copy', label: 'Copy', onSelect: () => stageClipboard('copy', selectedDocumentIds, selectedFolderIds) },
      ];
      if (clipboard) {
        folderMenuItems.push({
          key: 'paste',
          label: 'Paste Into Folder',
          onSelect: () => pasteClipboardInto(folderItem._id),
        });
      }
      return folderMenuItems;
    }

    if (contextMenu.isMultiple) {
      const areAllSelectedPdf = selectedDocumentIds.every((documentId) => {
        const selectedDocument = documents.find((documentItem) => documentItem._id === documentId);
        return selectedDocument && isPdfDocument(selectedDocument);
      });
      return [
        {
          key: 'merge',
          label: `Merge ${selectedDocumentIds.length} Documents`,
          isDisabled: !areAllSelectedPdf || selectedFolderIds.length > 0,
          onSelect: handleMergeSelected,
        },
        { key: 'cut', label: 'Cut', onSelect: () => stageClipboard('cut', selectedDocumentIds, selectedFolderIds) },
        { key: 'copy', label: 'Copy', onSelect: () => stageClipboard('copy', selectedDocumentIds, selectedFolderIds) },
      ];
    }

    const documentItem = documents.find((candidate) => candidate._id === contextMenu.documentId);
    if (!documentItem) return [];

    const menuItems = [
      { key: 'view', label: 'View', onSelect: () => handleView(documentItem) },
      { key: 'download', label: 'Download', onSelect: () => handleDownload(documentItem) },
      { key: 'dates', label: 'Issue & Expiry Dates', onSelect: () => setDatesTarget(documentItem) },
      { key: 'rename', label: 'Rename', onSelect: () => handleRenameClick(documentItem) },
      { key: 'cut', label: 'Cut', onSelect: () => stageClipboard('cut', [documentItem._id]) },
      { key: 'copy', label: 'Copy', onSelect: () => stageClipboard('copy', [documentItem._id]) },
    ];
    if (documentItem.renewalStatus !== RENEWAL_STATUS.EXPIRED) {
      menuItems.push({ key: 'renew', label: 'Renew Document', onSelect: () => setRenewTarget(documentItem) });
    }
    if (isPdfDocument(documentItem)) {
      menuItems.push({ key: 'split', label: 'Split', onSelect: () => handleSplitClick(documentItem) });
    }
    menuItems.push({
      key: 'delete',
      label: 'Delete',
      isDanger: true,
      onSelect: () => handleDeleteClick(documentItem),
    });
    return menuItems;
  };

  const buildToolbarActions = () => {
    const selectedDocuments = selectedDocumentIds
      .map((documentId) => documents.find((documentItem) => documentItem._id === documentId))
      .filter(Boolean);
    const isSingleSelection = selectedDocuments.length === 1;
    const isMultipleSelection = selectedDocuments.length > 1;
    const singleDocument = selectedDocuments[0];

    const isClipboardMatchingSelection = (mode) =>
      clipboard?.mode === mode &&
      clipboard.documentIds.length === selectedDocumentIds.length &&
      clipboard.folderIds.length === selectedFolderIds.length &&
      selectedDocumentIds.every((documentId) => clipboard.documentIds.includes(documentId)) &&
      selectedFolderIds.every((folderId) => clipboard.folderIds.includes(folderId));

    const toolbarActionList = [];

    if (isSingleSelection) {
      toolbarActionList.push(
        { key: 'view', label: 'View', onSelect: () => handleView(singleDocument) },
        { key: 'download', label: 'Download', onSelect: () => handleDownload(singleDocument) },
        { key: 'rename', label: 'Rename', onSelect: () => handleRenameClick(singleDocument) }
      );
      if (singleDocument.renewalStatus !== RENEWAL_STATUS.EXPIRED) {
        toolbarActionList.push({
          key: 'renew',
          label: 'Renew Document',
          onSelect: () => setRenewTarget(singleDocument),
        });
      }
      toolbarActionList.push({
        key: 'dates',
        label: 'Issue & Expiry Dates',
        onSelect: () => setDatesTarget(singleDocument),
      });
      if (isPdfDocument(singleDocument)) {
        toolbarActionList.push({ key: 'split', label: 'Split', onSelect: () => handleSplitClick(singleDocument) });
      }
    }

    if (isMultipleSelection && selectedDocuments.every(isPdfDocument)) {
      toolbarActionList.push({ key: 'merge', label: 'Merge', onSelect: handleMergeSelected });
    }

    if (selectedFolderIds.length === 1 && selectedDocuments.length === 0) {
      toolbarActionList.push({
        key: 'rename',
        label: 'Rename Folder',
        onSelect: () => setRenamingItem({ kind: 'folder', id: selectedFolderIds[0] }),
      });
    }

    if (selectedDocuments.length > 0 || selectedFolderIds.length > 0) {
      toolbarActionList.push(
        {
          key: 'cut',
          label: 'Cut',
          isDisabled: isClipboardMatchingSelection('cut'),
          onSelect: () => stageClipboard('cut', selectedDocumentIds, selectedFolderIds),
        },
        {
          key: 'copy',
          label: 'Copy',
          isDisabled: isClipboardMatchingSelection('copy'),
          onSelect: () => stageClipboard('copy', selectedDocumentIds, selectedFolderIds),
        }
      );
    }

    if (clipboard && activeView === DOCUMENT_VIEWS.ALL) {
      toolbarActionList.push({ key: 'paste', label: 'Paste', onSelect: () => pasteClipboardInto(currentFolderId) });
    }

    if (isSingleSelection) {
      toolbarActionList.push({
        key: 'delete',
        label: 'Delete',
        isDanger: true,
        onSelect: () => handleDeleteClick(singleDocument),
      });
    }

    return toolbarActionList;
  };

  return {
    toolbarActions: buildToolbarActions(),
    sourceData,
    documents,
    folders,
    folderItemCounts,
      cutDocumentIds: clipboard?.mode === 'cut' ? clipboard.documentIds : [],
    cutFolderIds: clipboard?.mode === 'cut' ? clipboard.folderIds : [],
    selectedFolderIds,
    viewerTarget,
    activeView,
    visibleDocuments,
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
    contextMenuItems: buildContextMenuItems(),
    explorerRef,
    marqueeRect,
    renamingItem,
    deleteTarget,
    datesTarget,
    renewTarget,
    isSubmittingDialog,
    visibleFolders,
    folderTrail,
    currentFolderId,
    handleOpenFolder,
    handleNewFolderClick,
    handleFolderClick,
    handleFolderDragStart,
    handleDropDocuments,
    handleDocumentDragStart,
    handleExplorerClick,
    handleExplorerContextMenu,
    handleFolderContextMenu,
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
  };
};

export default useDocument;