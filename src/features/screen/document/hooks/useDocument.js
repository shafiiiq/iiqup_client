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
  trashItems,
  deleteItemsPermanently,
  compressItems,
  extractDocument,
  mergeDocumentPages,
  editDocumentPages,
  moveFolder,
  copyFolder,
  splitDocument,
  convertDocuments,
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
  isUploadableFile,
  collectDroppedItems,
  filesToUploadItems,
  isPdfDocument,
  isArchiveDocument,
  isWordDocument,
  isConvertibleImage,
  selectViewDocuments,
  selectViewFolders,
  computeFolderSizes,
  computeViewSizes,
  buildViewTabItems,
  validateDateRange,
  buildDocumentFileLabel,
  buildUniqueFolderName,
  stripDocumentExtension,
  isFolderInsideAny,
  runBulkActions,
  areSameIdLists,
  getItemArea,
} from '../helper/document.helper';
import { useMarqueeSelection } from './useMarqueeSelection';
import { useDocumentShortcuts } from './useDocumentShortcuts';
import { useStableCallback } from './useStableCallback';
import { useDocumentUndo } from './useDocumentUndo';
import {
  buildUndoByTrashOperation,
  buildUndoByRestoreOperation,
  buildMoveOperation,
  buildRenameOperation,
  buildDatesOperation,
  buildRenewOperation,
} from '../helper/documentUndo.helper';
import { eventToShortcut } from '../helper/documentShortcut.helper';
import { exportItemsToDirectory, isDirectoryExportSupported } from '../helper/documentExport.helper';
import { renderPdfToJpegFiles } from '../helper/pdfImages.helper';
import { NATIVE_PASTE_SHORTCUT } from '../constants/documentShortcut.constant';

export const useDocument = ({ sourceType, sourceId } = {}) => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const hasSource = Boolean(sourceType && sourceId);

  const [sourceData, setSourceData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [requestedView, setActiveView] = useState(DOCUMENT_VIEWS.SOURCE);
  const activeView = sourceType === 'root' ? DOCUMENT_VIEWS.SOURCE : requestedView;
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [progressTitle, setProgressTitle] = useState('Uploading');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [newItemIds, setNewItemIds] = useState([]);

  const [renamingItem, setRenamingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [datesTarget, setDatesTarget] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [viewerTarget, setViewerTarget] = useState(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const explorerRef = useRef(null);
  const latestRef = useRef({});
  const shortcutContextRef = useRef(null);
  const loadRequestIdRef = useRef(0);
  const lastLoadedAtRef = useRef(0);
  const isUploadingRef = useRef(false);
  const knownSignaturesRef = useRef(null);
  const justHighlightedRef = useRef(false);
  const pendingNavigationRef = useRef(null);
  const queueNavigation = useCallback((navigation) => {
    pendingNavigationRef.current = navigation;
  }, []);

  const { shortcuts, setShortcut, resetShortcut, resetAllShortcuts } = useDocumentShortcuts();

  const showToast = useCallback((message, type = 'success') => setToast({ isOpen: true, message, type }), []);
  const handleCloseToast = useCallback(() => setToast((previous) => ({ ...previous, isOpen: false })), []);

  const undoManager = useDocumentUndo({ showToast });
  const { recordOperation, registerRefreshHandler } = undoManager;

  const loadDocuments = useCallback(
    async ({ silent = false } = {}) => {
      if (!sourceType || !sourceId) return;
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      if (!silent) setIsLoading(true);
      try {
        const [documentData, folderData] = await Promise.all([
          fetchDocumentsBySource({ sourceType, sourceId }),
          fetchFoldersBySource({ sourceType, sourceId }),
        ]);
        if (requestId !== loadRequestIdRef.current) return;
        lastLoadedAtRef.current = Date.now();
        const signatures = new Map([
          ...documentData.map((item) => [item._id, `${item.folderId || ''}|${getItemArea(item)}`]),
          ...folderData.map((item) => [item._id, `${item.parentFolderId || ''}|${getItemArea(item)}`]),
        ]);
        const previousSignatures = knownSignaturesRef.current;
        if (previousSignatures) {
          const changedIds = [...signatures]
            .filter(([id, signature]) => previousSignatures.get(id) !== signature)
            .map(([id]) => id);
          if (changedIds.length > 0) {
            setNewItemIds((previous) => [...new Set([...previous, ...changedIds])]);
            justHighlightedRef.current = true;
            setTimeout(() => {
              justHighlightedRef.current = false;
            }, 400);
          }
        }
        knownSignaturesRef.current = signatures;
        setDocuments(documentData);
        setFolders(folderData);
      } catch (error) {
        if (requestId === loadRequestIdRef.current) showToast(`Error: ${error.message}`, 'error');
      } finally {
        if (requestId === loadRequestIdRef.current) setIsLoading(false);
      }
    },
    [sourceType, sourceId, showToast]
  );

  useEffect(() => {
    const pendingNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    knownSignaturesRef.current = null;
    setNewItemIds([]);
    setSourceData(null);
    setDocuments([]);
    setFolders([]);
    setCurrentFolderId(pendingNavigation ? pendingNavigation.folderId : null);
    if (pendingNavigation) setActiveView(pendingNavigation.view);
    setSelectionMode(false);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
    setViewerTarget(null);
    setContextMenu(null);
    setRenamingItem(null);
    if (!sourceType || !sourceId) return undefined;

    let isCancelled = false;
    fetchSourceEntity({ type: sourceType, id: sourceId })
      .then((entity) => {
        if (!isCancelled) setSourceData(entity);
      })
      .catch((error) => console.error('Error fetching source data:', error));
    loadDocuments();

    return () => {
      isCancelled = true;
      loadRequestIdRef.current += 1;
    };
  }, [sourceType, sourceId, loadDocuments]);

  useEffect(() => {
    if (!hasSource) return undefined;
    const refreshIfStale = () => {
      if (document.hidden || isUploadingRef.current) return;
      if (Date.now() - lastLoadedAtRef.current >= DOCUMENT_URL_REFRESH_INTERVAL_MILLISECONDS) {
        loadDocuments({ silent: true });
      }
    };
    const intervalId = setInterval(refreshIfStale, DOCUMENT_URL_REFRESH_INTERVAL_MILLISECONDS / 5);
    document.addEventListener('visibilitychange', refreshIfStale);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshIfStale);
    };
  }, [hasSource, loadDocuments]);

  useEffect(() => {
    if (!sourceData) {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
      return undefined;
    }
    const subtitles = {
      equipment: `${sourceData.machine || 'Equipment'} - ${sourceData.regNo || sourceId}`,
      operator: `Operator > ${sourceData.name || 'Operator'} - ${sourceData.qatarId || sourceId}`,
      mechanic: `Mechanic > ${sourceData.name || 'Mechanic'}`,
      staff: `${sourceData.name || 'Office Staff'} - ${sourceData.email || sourceId}`,
    };
    setHeaderTitle('Documents');
    setHeaderSubtitle(subtitles[sourceType] ?? sourceId);
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [sourceData, sourceType, sourceId, setHeaderTitle, setHeaderSubtitle]);

  useEffect(
    () => registerRefreshHandler('documents', () => loadDocuments({ silent: true })),
    [registerRefreshHandler, loadDocuments]
  );

  const clearSelection = useCallback(() => {
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
  }, []);

  const runWithProgressModal = async (title, label, task, { isIndeterminate = true } = {}) => {
    if (isUploadingRef.current) {
      showToast('Another operation is in progress', 'info');
      return undefined;
    }
    isUploadingRef.current = true;
    setProgressTitle(title);
    setUploadLabel(label);
    setUploadProgress(5);
    setShowProgressModal(true);
    const intervalId = isIndeterminate
      ? setInterval(() => setUploadProgress((previous) => (previous >= 90 ? previous : previous + Math.random() * 6)), 400)
      : null;
    try {
      return await task();
    } finally {
      if (intervalId) clearInterval(intervalId);
      setShowProgressModal(false);
      setUploadProgress(0);
      setUploadLabel('');
      isUploadingRef.current = false;
    }
  };

  const uploadFiles = async (items, emptyDirectories = []) => {
    if (!hasSource) return;
    if (isUploadingRef.current) {
      showToast('An operation is already in progress', 'info');
      return;
    }
    const uploadableItems = items.filter((item) => isUploadableFile(item.file));
    if (uploadableItems.length === 0 && emptyDirectories.length === 0) {
      showToast('Empty files cannot be uploaded', 'error');
      return;
    }

    isUploadingRef.current = true;
    const uploadSourceType = sourceType;
    const uploadSourceId = sourceId;
    const targetFolderId = currentFolderId;
    const targetArea = activeView;
    const completedSessionIds = [];
    const directoryBySessionId = {};
    const failedFileNames = [];
    let registrationError = null;

    setProgressTitle('Uploading');
    setShowProgressModal(true);
    setUploadProgress(0);

    for (let fileIndex = 0; fileIndex < uploadableItems.length; fileIndex += 1) {
      const { file, directory } = uploadableItems[fileIndex];
      setUploadLabel(`Uploading ${fileIndex + 1} of ${uploadableItems.length}: ${file.name}`);
      try {
        const { sessionId } = await uploadFile({
          file,
          feature: DOCUMENT_UPLOAD_FEATURE,
          context: uploadSourceType,
          entityId: uploadSourceId,
          keyPrefix: buildDocumentKeyPrefix(uploadSourceType, uploadSourceId),
          onProgress: (percent) =>
            setUploadProgress(Math.round(((fileIndex + percent / 100) / uploadableItems.length) * 100)),
        });
        completedSessionIds.push(sessionId);
        if (directory) directoryBySessionId[sessionId] = directory;
      } catch {
        failedFileNames.push(file.name);
      }
    }

    try {
      if (completedSessionIds.length > 0 || emptyDirectories.length > 0) {
        const createdDocuments = await registerUploadedDocuments({
          sourceType: uploadSourceType,
          sourceId: uploadSourceId,
          sessionIds: completedSessionIds,
          folderId: targetFolderId,
          area: targetArea,
          directoryBySessionId,
          emptyDirectories,
        });
        if (createdDocuments.length > 0) {
          recordOperation(
            buildUndoByTrashOperation({
              label: `Upload ${createdDocuments.length} file(s)`,
              documentIds: createdDocuments.map((createdDocument) => createdDocument._id),
              folderIds: [],
            })
          );
        }
      }
    } catch (error) {
      registrationError = error;
    }

    isUploadingRef.current = false;
    setShowProgressModal(false);
    setUploadProgress(0);
    setUploadLabel('');

    await loadDocuments({ silent: true });

    if (registrationError) {
      showToast(`Error: ${registrationError.message}`, 'error');
    } else if (failedFileNames.length > 0) {
      showToast(
        `${completedSessionIds.length} uploaded, ${failedFileNames.length} failed: ${failedFileNames.slice(0, 3).join(', ')}`,
        'error'
      );
    } else {
      showToast(`${completedSessionIds.length} document(s) uploaded`, 'success');
    }
  };

  const handleUploadFromInput = (fileList) => {
    const items = filesToUploadItems(fileList);
    if (items.length > 0) uploadFiles(items, []);
  };

  const locateDocument = (documentId) => {
    const documentItem = documents.find((candidate) => candidate._id === documentId);
    return {
      sourceType: documentItem?.sourceType || sourceType,
      sourceId: documentItem?.sourceId || sourceId,
      folderId: documentItem?.folderId || null,
      area: documentItem?.area || 'all',
    };
  };

  const locateFolder = (folderId) => {
    const folderItem = folders.find((candidate) => candidate._id === folderId);
    return {
      sourceType: folderItem?.sourceType || sourceType,
      sourceId: folderItem?.sourceId || sourceId,
      folderId: folderItem?.parentFolderId || null,
      area: folderItem?.area || 'all',
    };
  };

  const stageClipboard = (mode, documentIds, folderIds = []) => {
    const totalCount = documentIds.length + folderIds.length;
    if (totalCount === 0) return false;
    setClipboard({
      mode,
      documentIds,
      folderIds,
      documentLocations: documentIds.map(locateDocument),
      folderLocations: folderIds.map(locateFolder),
    });
    Promise.resolve(navigator.clipboard?.writeText('')).catch(() => null);
    showToast(`${totalCount} item(s) ${mode === 'cut' ? 'cut' : 'copied'}`, 'info');
    return true;
  };

  const pasteClipboardInto = async (targetFolderId) => {
    if (!clipboard) return;
    const { mode, documentIds, folderIds, documentLocations, folderLocations } = clipboard;
    if (folderIds.length > 0 && isFolderInsideAny(folders, targetFolderId, folderIds)) {
      showToast('A folder cannot be pasted into itself', 'error');
      return;
    }
    const totalCount = documentIds.length + folderIds.length;
    const targetArea = activeView;
    const target = { targetSourceType: sourceType, targetSourceId: sourceId };
    const { succeededCount, firstErrorMessage, outcomes } = await runBulkActions([
      ...documentIds.map((documentId) => () =>
        mode === 'cut'
          ? moveDocument({ documentId, folderId: targetFolderId, area: targetArea, ...target })
          : copyDocument({ documentId, folderId: targetFolderId, area: targetArea, ...target })
      ),
      ...folderIds.map((folderId) => () =>
        mode === 'cut'
          ? moveFolder({ folderId, parentFolderId: targetFolderId, area: targetArea, ...target })
          : copyFolder({ folderId, parentFolderId: targetFolderId, area: targetArea, ...target })
      ),
    ]);
    const documentOutcomes = outcomes.slice(0, documentIds.length);
    const folderOutcomes = outcomes.slice(documentIds.length);
    const destination = { sourceType, sourceId, folderId: targetFolderId, area: targetArea };
    if (mode === 'cut') {
      const documentMoves = documentIds
        .map((id, index) => ({ id, from: documentLocations[index], to: destination }))
        .filter((_, index) => documentOutcomes[index].isSuccess);
      const folderMoves = folderIds
        .map((id, index) => ({ id, from: folderLocations[index], to: destination }))
        .filter((_, index) => folderOutcomes[index].isSuccess);
      if (documentMoves.length + folderMoves.length > 0) {
        recordOperation(
          buildMoveOperation({ label: `Move ${documentMoves.length + folderMoves.length} item(s)`, documentMoves, folderMoves })
        );
      }
    } else {
      const createdDocumentIds = documentOutcomes.filter((outcome) => outcome.isSuccess).map((outcome) => outcome.value._id);
      const createdFolderIds = folderOutcomes.filter((outcome) => outcome.isSuccess).map((outcome) => outcome.value._id);
      if (createdDocumentIds.length + createdFolderIds.length > 0) {
        recordOperation(
          buildUndoByTrashOperation({
            label: `Paste ${createdDocumentIds.length + createdFolderIds.length} item(s)`,
            documentIds: createdDocumentIds,
            folderIds: createdFolderIds,
          })
        );
      }
    }
    if (mode === 'cut' && succeededCount === totalCount) setClipboard(null);
    clearSelection();
    await loadDocuments({ silent: true });
    if (firstErrorMessage) showToast(`${succeededCount} of ${totalCount} pasted. ${firstErrorMessage}`, 'error');
    else showToast(`${succeededCount} item(s) pasted`, 'success');
  };

  latestRef.current = {
    hasSource,
    uploadFiles,
    clipboard,
    activeView,
    currentFolderId,
    pasteClipboardInto,
  };

  useEffect(() => {
    const containsFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

    const handleDragOver = (event) => {
      event.preventDefault();
      if (latestRef.current.hasSource && containsFiles(event)) setIsDragging(true);
    };

    const handleDragLeave = (event) => {
      if (!event.relatedTarget) setIsDragging(false);
    };

    const handleDrop = (event) => {
      event.preventDefault();
      setIsDragging(false);
      if (!containsFiles(event)) return;
      if (!latestRef.current.hasSource) {
        showToast('Open a data source first to upload files', 'info');
        return;
      }
      collectDroppedItems(event.dataTransfer)
        .then(({ files, directories }) => {
          if (files.length > 0 || directories.length > 0) latestRef.current.uploadFiles(files, directories);
        })
        .catch(() => showToast('Could not read the dropped items', 'error'));
    };

    const handlePaste = (event) => {
      const current = latestRef.current;
      if (!current.hasSource) return;
      const targetTagName = event.target?.tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA') return;
      if ((event.clipboardData?.files?.length || 0) > 0) {
        event.preventDefault();
        setClipboard(null);
        collectDroppedItems(event.clipboardData)
          .then(({ files, directories }) => current.uploadFiles(files, directories))
          .catch(() => showToast('Could not read the pasted items', 'error'));
        return;
      }
      if (!current.clipboard) return;
      event.preventDefault();
      current.pasteClipboardInto(current.currentFolderId);
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
  }, [showToast]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const context = shortcutContextRef.current;
      if (!context || context.isBlocked) return;
      if (event.key === 'Escape') {
        context.clearSelection();
        return;
      }
      const targetTagName = event.target?.tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA') return;
      const pressedShortcut = eventToShortcut(event);
      if (!pressedShortcut) return;
      if (targetTagName === 'BUTTON' && pressedShortcut === 'Enter') return;
      const actionKey = Object.keys(context.shortcuts).find((key) => context.shortcuts[key] === pressedShortcut);
      const action = actionKey ? context.actions[actionKey] : null;
      if (!action || action.isDisabled) return;
      if (actionKey === 'paste' && pressedShortcut === NATIVE_PASTE_SHORTCUT) return;
      event.preventDefault();
      action.onSelect();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarqueeSelect = useCallback(({ documentIds, folderIds }) => {
    setSelectedDocumentIds((previous) => (areSameIdLists(previous, documentIds) ? previous : documentIds));
    setSelectedFolderIds((previous) => (areSameIdLists(previous, folderIds) ? previous : folderIds));
  }, []);

  const marqueeRect = useMarqueeSelection({
    isEnabled: hasSource,
    containerRef: explorerRef,
    onSelectItems: handleMarqueeSelect,
  });

  const visibleDocuments = useMemo(
    () => selectViewDocuments(documents, activeView, currentFolderId),
    [documents, activeView, currentFolderId]
  );

  const visibleFolders = useMemo(
    () => selectViewFolders(folders, activeView, currentFolderId),
    [folders, activeView, currentFolderId]
  );

  const folderSizes = useMemo(() => computeFolderSizes(documents, folders), [documents, folders]);
  const viewSizes = useMemo(() => computeViewSizes(documents), [documents]);

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

  const folderItemCounts = useMemo(() => {
    const counts = {};
    documents.forEach((documentItem) => {
      if (documentItem.folderId) counts[documentItem.folderId] = (counts[documentItem.folderId] || 0) + 1;
    });
    folders.forEach((folderItem) => {
      if (folderItem.parentFolderId) counts[folderItem.parentFolderId] = (counts[folderItem.parentFolderId] || 0) + 1;
    });
    return counts;
  }, [documents, folders]);

  const viewTabItems = useMemo(
    () => buildViewTabItems(DOCUMENT_VIEW_TABS, documents, folders),
    [documents, folders]
  );

  const handleViewChange = useCallback((viewKey) => {
    setActiveView(viewKey);
    setCurrentFolderId(null);
    setSelectionMode(false);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
    setContextMenu(null);
  }, []);

  const handleOpenFolder = useCallback((folderId) => {
    setCurrentFolderId(folderId);
    setSelectedDocumentIds([]);
    setSelectedFolderIds([]);
    setContextMenu(null);
  }, []);

  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    const clearHighlights = () => {
      if (justHighlightedRef.current) return;
      setNewItemIds((previous) => (previous.length > 0 ? [] : previous));
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') clearHighlights();
    };
    document.addEventListener('mousedown', clearHighlights);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', clearHighlights);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const dismissHighlight = useCallback(
    (itemId) => setNewItemIds((previous) => (previous.includes(itemId) ? previous.filter((id) => id !== itemId) : previous)),
    []
  );

  const newItemIdSet = useMemo(() => new Set(newItemIds), [newItemIds]);

  const containsNewIdSet = useMemo(() => {
    const parentById = new Map(folders.map((folderItem) => [folderItem._id, folderItem.parentFolderId || null]));
    const ids = new Set();
    const markAncestors = (startId, area) => {
      ids.add(`view:${area}`);
      let cursorId = startId;
      let guard = 0;
      while (cursorId && guard < 1000) {
        ids.add(cursorId);
        cursorId = parentById.get(cursorId) || null;
        guard += 1;
      }
    };
    documents.forEach((documentItem) => {
      if (newItemIdSet.has(documentItem._id)) markAncestors(documentItem.folderId, getItemArea(documentItem));
    });
    folders.forEach((folderItem) => {
      if (newItemIdSet.has(folderItem._id)) markAncestors(folderItem.parentFolderId, getItemArea(folderItem));
    });
    return ids;
  }, [documents, folders, newItemIdSet]);

  const handleNewFolderClick = async () => {
    if (!hasSource) return;
    try {
      const createdFolder = await createFolder({
        sourceType,
        sourceId,
        parentFolderId: currentFolderId,
        area: activeView,
        name: buildUniqueFolderName(folders, currentFolderId, activeView),
      });
      await loadDocuments({ silent: true });
      clearSelection();
      recordOperation(
        buildUndoByTrashOperation({
          label: `Create folder "${createdFolder.name}"`,
          documentIds: [],
          folderIds: [createdFolder._id],
        })
      );
      setRenamingItem({ kind: 'folder', id: createdFolder._id });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleMoveItems = async (documentIds, folderIds, folderId, area) => {
    const previousDocumentLocations = documentIds.map(locateDocument);
    const previousFolderLocations = folderIds.map(locateFolder);
    const target = { targetSourceType: sourceType, targetSourceId: sourceId };
    const { succeededCount, firstErrorMessage, outcomes } = await runBulkActions([
      ...documentIds.map((documentId) => () => moveDocument({ documentId, folderId, area, ...target })),
      ...folderIds.map((id) => () => moveFolder({ folderId: id, parentFolderId: folderId, area, ...target })),
    ]);
    const destination = { sourceType, sourceId, folderId, area };
    const documentMoves = documentIds
      .map((id, index) => ({ id, from: previousDocumentLocations[index], to: destination }))
      .filter((_, index) => outcomes[index].isSuccess);
    const folderMoves = folderIds
      .map((id, index) => ({ id, from: previousFolderLocations[index], to: destination }))
      .filter((_, index) => outcomes[documentIds.length + index].isSuccess);
    if (documentMoves.length + folderMoves.length > 0) {
      recordOperation(
        buildMoveOperation({ label: `Move ${documentMoves.length + folderMoves.length} item(s)`, documentMoves, folderMoves })
      );
    }
    clearSelection();
    await loadDocuments({ silent: true });
    const totalCount = documentIds.length + folderIds.length;
    if (firstErrorMessage) showToast(`${succeededCount} of ${totalCount} moved. ${firstErrorMessage}`, 'error');
  };

  const handleDropDocuments = (payload, folderId, area = activeView) => {
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      return;
    }
    const documentIds = Array.isArray(parsedPayload) ? parsedPayload : parsedPayload?.documentIds || [];
    const folderIds = Array.isArray(parsedPayload) ? [] : parsedPayload?.folderIds || [];
    if (documentIds.length === 0 && folderIds.length === 0) return;
    if (folderIds.length > 0 && isFolderInsideAny(folders, folderId, folderIds)) return;
    handleMoveItems(documentIds, folderIds, folderId, area || 'all');
  };

  const setDragPayload = (event, documentIds, folderIds) => {
    event.dataTransfer.setData(DRAGGED_DOCUMENT_TYPE, JSON.stringify({ documentIds, folderIds }));
    event.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDocumentDragStart = (event, documentItem) => {
    const isSelected = selectedDocumentIds.includes(documentItem._id);
    const draggedDocumentIds = isSelected ? selectedDocumentIds : [documentItem._id];
    const draggedFolderIds = isSelected ? selectedFolderIds : [];
    setDragPayload(event, draggedDocumentIds, draggedFolderIds);
    if (draggedDocumentIds.length === 1 && draggedFolderIds.length === 0) {
      const safeName = buildDocumentFileLabel(documentItem).replace(/:/g, '_');
      event.dataTransfer.setData(
        'DownloadURL',
        `${documentItem.mimeType || 'application/octet-stream'}:${safeName}:${documentItem.fileUrl}`
      );
    }
  };

  const handleFolderDragStart = (event, folderItem) => {
    const isSelected = selectedFolderIds.includes(folderItem._id);
    setDragPayload(event, isSelected ? selectedDocumentIds : [], isSelected ? selectedFolderIds : [folderItem._id]);
  };

  const handleExplorerClick = (event) => {
    if (selectionMode || event.target.closest('[data-document-id],[data-folder-id]')) return;
    clearSelection();
  };

  const handleExplorerContextMenu = (event) => {
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
    clearSelection();
  };

  const handleTileClick = (documentItem, event) => {
    dismissHighlight(documentItem._id);
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

  const handleFolderClick = (folderItem, event) => {
    dismissHighlight(folderItem._id);
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

  const handleView = (documentItem) => setViewerTarget({ mode: 'view', documents: [documentItem] });

  const viewerIndex =
    viewerTarget?.mode === 'view'
      ? visibleDocuments.findIndex((documentItem) => documentItem._id === viewerTarget.documents[0]._id)
      : -1;

  const handleViewerNavigate = (direction) => {
    const nextDocument = visibleDocuments[viewerIndex + direction];
    if (viewerIndex >= 0 && nextDocument) setViewerTarget({ mode: 'view', documents: [nextDocument] });
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

  const handleRenameClick = (documentItem) => setRenamingItem({ kind: 'document', id: documentItem._id });
  const handleRenameFolderClick = (folderItem) => setRenamingItem({ kind: 'folder', id: folderItem._id });
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
        recordOperation(
          buildRenameOperation({ kind: 'folder', id: folderItem._id, previousName: folderItem.name, nextName: trimmedName })
        );
      } else {
        const documentItem = documents.find((candidate) => candidate._id === renameTargetItem.id);
        if (!documentItem || stripDocumentExtension(documentItem) === trimmedName) return;
        await renameDocument({ documentId: documentItem._id, newFileName: trimmedName });
        recordOperation(
          buildRenameOperation({
            kind: 'document',
            id: documentItem._id,
            previousName: documentItem.displayName,
            nextName: trimmedName,
          })
        );
      }
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleDownload = async (documentItem) => {
    try {
      const downloadUrl = await getSignedUrl(documentItem.s3Key, buildDocumentFileLabel(documentItem));
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.rel = 'noopener';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      showToast(`Error downloading: ${error.message}`, 'error');
    }
  };

  const moveToTrash = async (documentIds, folderIds) => {
    const totalCount = documentIds.length + folderIds.length;
    if (totalCount === 0) return;
    try {
      await trashItems({ documentIds, folderIds });
      setClipboard(null);
      clearSelection();
      recordOperation(buildUndoByRestoreOperation({ label: `Move ${totalCount} item(s) to Trash`, documentIds, folderIds }));
      showToast(`${totalCount} item(s) moved to Trash`, 'success');
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
    await loadDocuments({ silent: true });
  };

  const requestPermanentDelete = (documentIds, folderIds) => {
    const totalCount = documentIds.length + folderIds.length;
    if (totalCount === 0) return;
    const singleDocument = documents.find((candidate) => candidate._id === documentIds[0]);
    const singleFolder = folders.find((candidate) => candidate._id === folderIds[0]);
    let label = `${totalCount} items`;
    if (totalCount === 1) label = singleDocument ? buildDocumentFileLabel(singleDocument) : singleFolder?.name || 'this item';
    setDeleteTarget({ documentIds, folderIds, label });
  };

  const handleCancelDelete = () => setDeleteTarget(null);

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    try {
      await deleteItemsPermanently({ documentIds: target.documentIds, folderIds: target.folderIds });
      setClipboard(null);
      clearSelection();
      showToast('Deleted permanently', 'success');
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
    await loadDocuments({ silent: true });
  };

  const handleCompress = () => {
    if (selectedDocumentIds.length + selectedFolderIds.length === 0) return undefined;
    return runWithProgressModal('Compressing', 'Creating zip file...', async () => {
      try {
        const archiveDocument = await compressItems({
          sourceType,
          sourceId,
          documentIds: selectedDocumentIds,
          folderIds: selectedFolderIds,
          folderId: currentFolderId,
          area: activeView,
        });
        clearSelection();
        recordOperation(
          buildUndoByTrashOperation({ label: 'Compress to zip', documentIds: [archiveDocument._id], folderIds: [] })
        );
        showToast('Zip file created', 'success');
        await loadDocuments({ silent: true });
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      }
    });
  };

  const handleExtract = (documentItem) =>
    runWithProgressModal('Extracting', `Extracting ${documentItem.displayName}...`, async () => {
      try {
        const result = await extractDocument({ documentId: documentItem._id });
        recordOperation(
          buildUndoByTrashOperation({
            label: `Extract "${documentItem.displayName}"`,
            documentIds: [],
            folderIds: [result.folderId],
          })
        );
        showToast(`${result.documentCount} file(s) extracted`, 'success');
        await loadDocuments({ silent: true });
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      }
    });

  const handleConvert = (conversion, documentIds, label) =>
    runWithProgressModal('Converting', `${label}...`, async () => {
      try {
        const createdDocuments = await convertDocuments({ sourceType, sourceId, conversion, documentIds });
        recordOperation(
          buildUndoByTrashOperation({
            label,
            documentIds: createdDocuments.map((createdDocument) => createdDocument._id),
            folderIds: [],
          })
        );
        clearSelection();
        showToast(`${label} finished`, 'success');
        await loadDocuments({ silent: true });
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      }
    });

  const handlePdfToImages = (documentItem) =>
    runWithProgressModal(
      'Converting',
      `PDF to JPG: ${documentItem.displayName}`,
      async () => {
        try {
          const baseName = stripDocumentExtension(documentItem);
          const imageFiles = await renderPdfToJpegFiles({
            url: documentItem.fileUrl,
            baseName,
            onProgress: (ratio) => setUploadProgress(Math.round(ratio * 50)),
          });
          const createdFolder = await createFolder({
            sourceType,
            sourceId,
            parentFolderId: documentItem.folderId || null,
            area: documentItem.area || 'all',
            name: buildUniqueFolderName(folders, documentItem.folderId || null, documentItem.area || 'all', `${baseName} (Images)`),
          });
          const sessionIds = [];
          for (let fileIndex = 0; fileIndex < imageFiles.length; fileIndex += 1) {
            const { sessionId } = await uploadFile({
              file: imageFiles[fileIndex],
              feature: DOCUMENT_UPLOAD_FEATURE,
              context: sourceType,
              entityId: sourceId,
              keyPrefix: buildDocumentKeyPrefix(sourceType, sourceId),
              onProgress: (percent) =>
                setUploadProgress(50 + Math.round(((fileIndex + percent / 100) / imageFiles.length) * 50)),
            });
            sessionIds.push(sessionId);
          }
          await registerUploadedDocuments({ sourceType, sourceId, sessionIds, folderId: createdFolder._id });
          recordOperation(
            buildUndoByTrashOperation({ label: 'PDF to JPG', documentIds: [], folderIds: [createdFolder._id] })
          );
          showToast(`${imageFiles.length} image(s) created`, 'success');
          await loadDocuments({ silent: true });
        } catch (error) {
          showToast(`Error: ${error.message}`, 'error');
        }
      },
      { isIndeterminate: false }
    );

  const handleExport = async (shouldMove) => {
    if (!isDirectoryExportSupported()) {
      showToast('Copying to your computer needs Chrome or Edge on desktop. Use Download instead.', 'error');
      return;
    }
    const documentItems = selectedDocumentIds
      .map((documentId) => documents.find((candidate) => candidate._id === documentId))
      .filter(Boolean);
    const folderItems = selectedFolderIds
      .map((folderId) => folders.find((candidate) => candidate._id === folderId))
      .filter(Boolean);
    if (documentItems.length + folderItems.length === 0) return;

    let directoryHandle;
    try {
      directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      return;
    }

    let hasExported = false;
    await runWithProgressModal(
      shouldMove ? 'Moving to computer' : 'Copying to computer',
      'Saving files...',
      async () => {
        try {
          await exportItemsToDirectory({
            directoryHandle,
            documentItems,
            folderItems,
            documents,
            folders,
            onProgress: (ratio) => setUploadProgress(Math.round(ratio * 95)),
          });
          hasExported = true;
          showToast('Saved to your computer', 'success');
        } catch (error) {
          showToast(`Error: ${error.message}`, 'error');
        }
      },
      { isIndeterminate: false }
    );
    if (shouldMove && hasExported) await moveToTrash(selectedDocumentIds, selectedFolderIds);
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
      recordOperation(
        buildDatesOperation({
          documentId: datesTarget._id,
          label: `Change dates of "${buildDocumentFileLabel(datesTarget)}"`,
          previousDates: { issueDate: datesTarget.issueDate, expiryDate: datesTarget.expiryDate },
          nextDates: { issueDate, expiryDate },
        })
      );
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
    if (!isUploadableFile(file)) {
      showToast('Select the new file to renew with', 'error');
      return;
    }
    const validationMessage = validateDateRange(issueDate, expiryDate);
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }
    if (isUploadingRef.current) {
      showToast('An upload is already in progress', 'info');
      return;
    }

    const targetDocument = renewTarget;
    isUploadingRef.current = true;
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
      const renewedDocument = await renewDocument({
        documentId: targetDocument._id,
        uploadSessionId: sessionId,
        issueDate,
        expiryDate,
      });
      recordOperation(
        buildRenewOperation({
          label: `Renew "${targetDocument.displayName}"`,
          renewedDocumentId: renewedDocument._id,
          previousDocumentId: targetDocument._id,
          previousStatus: targetDocument.renewalStatus,
        })
      );
      showToast('Document renewed', 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      isUploadingRef.current = false;
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
      const createdDocuments = await splitDocument({ documentId, splitType: 'specific', pages: pageNumbers });
      recordOperation(
        buildUndoByTrashOperation({
          label: 'Extract pages',
          documentIds: createdDocuments.map((createdDocument) => createdDocument._id),
          folderIds: [],
        })
      );
      setViewerTarget(null);
      showToast(`Extracted ${pageNumbers.length} pages`, 'success');
      await loadDocuments({ silent: true });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleSplitAllPages = async (documentId, totalPages) => {
    try {
      const createdDocuments = await splitDocument({ documentId, splitType: 'every', pages: [] });
      recordOperation(
        buildUndoByTrashOperation({
          label: 'Split all pages',
          documentIds: createdDocuments.map((createdDocument) => createdDocument._id),
          folderIds: [],
        })
      );
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
      const mergedDocument = await mergeDocumentPages({ sourceType, sourceId, pages });
      recordOperation(
        buildUndoByTrashOperation({ label: 'Merge documents', documentIds: [mergedDocument._id], folderIds: [] })
      );
      setViewerTarget(null);
      setSelectionMode(false);
      clearSelection();
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
        backgroundMenuItems.push({ key: 'paste', label: 'Paste', onSelect: () => pasteClipboardInto(currentFolderId) });
      }
      return backgroundMenuItems;
    }

    if (contextMenu.folderId) {
      const folderItem = folders.find((candidate) => candidate._id === contextMenu.folderId);
      if (!folderItem) return [];
      const folderMenuItems = [
        { key: 'rename-folder', label: 'Rename Folder', onSelect: () => handleRenameFolderClick(folderItem) },
        { key: 'compress', label: 'Compress to Zip', onSelect: handleCompress },
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
      folderMenuItems.push({
        key: 'delete',
        label: 'Move to Trash',
        isDanger: true,
        onSelect: () => moveToTrash(selectedDocumentIds, selectedFolderIds),
      });
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
        { key: 'compress', label: 'Compress to Zip', onSelect: handleCompress },
        { key: 'cut', label: 'Cut', onSelect: () => stageClipboard('cut', selectedDocumentIds, selectedFolderIds) },
        { key: 'copy', label: 'Copy', onSelect: () => stageClipboard('copy', selectedDocumentIds, selectedFolderIds) },
        {
          key: 'delete',
          label: `Move ${selectedDocumentIds.length + selectedFolderIds.length} Items to Trash`,
          isDanger: true,
          onSelect: () => moveToTrash(selectedDocumentIds, selectedFolderIds),
        },
      ];
    }

    const documentItem = documents.find((candidate) => candidate._id === contextMenu.documentId);
    if (!documentItem) return [];

    const menuItems = [
      { key: 'view', label: 'View', onSelect: () => handleView(documentItem) },
      { key: 'download', label: 'Download', onSelect: () => handleDownload(documentItem) },
      { key: 'dates', label: 'Issue & Expiry Dates', onSelect: () => setDatesTarget(documentItem) },
      { key: 'rename', label: 'Rename', onSelect: () => handleRenameClick(documentItem) },
      { key: 'compress', label: 'Compress to Zip', onSelect: handleCompress },
      { key: 'cut', label: 'Cut', onSelect: () => stageClipboard('cut', [documentItem._id]) },
      { key: 'copy', label: 'Copy', onSelect: () => stageClipboard('copy', [documentItem._id]) },
    ];
    if (isPdfDocument(documentItem)) {
      menuItems.push(
        { key: 'editPdf', label: 'Edit PDF', onSelect: () => handleView(documentItem) },
        { key: 'pdfToWord', label: 'PDF to Word', onSelect: () => handleConvert('pdfToWord', [documentItem._id], 'PDF to Word') },
        { key: 'pdfToImages', label: 'PDF to JPG', onSelect: () => handlePdfToImages(documentItem) }
      );
    }
    if (isWordDocument(documentItem)) {
      menuItems.push({ key: 'wordToPdf', label: 'Word to PDF', onSelect: () => handleConvert('wordToPdf', [documentItem._id], 'Word to PDF') });
    }
    if (isConvertibleImage(documentItem)) {
      menuItems.push({ key: 'imagesToPdf', label: 'Image to PDF', onSelect: () => handleConvert('imagesToPdf', [documentItem._id], 'Image to PDF') });
    }
    menuItems.push(
      { key: 'exportCopy', label: 'Copy to Computer', onSelect: () => handleExport(false) },
      { key: 'exportMove', label: 'Move to Computer', onSelect: () => handleExport(true) }
    );
    if (isArchiveDocument(documentItem)) {
      menuItems.push({ key: 'extract', label: 'Extract Zip', onSelect: () => handleExtract(documentItem) });
    }
    if (documentItem.renewalStatus !== RENEWAL_STATUS.EXPIRED) {
      menuItems.push({ key: 'renew', label: 'Renew Document', onSelect: () => setRenewTarget(documentItem) });
    }
    if (isPdfDocument(documentItem)) {
      menuItems.push({ key: 'split', label: 'Split', onSelect: () => handleSplitClick(documentItem) });
    }
    menuItems.push({
      key: 'delete',
      label: 'Move to Trash',
      isDanger: true,
      onSelect: () => moveToTrash([documentItem._id], []),
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
    const hasAnySelection = selectedDocuments.length > 0 || selectedFolderIds.length > 0;

    const isClipboardMatchingSelection = (mode) =>
      clipboard?.mode === mode &&
      clipboard.documentIds.length === selectedDocumentIds.length &&
      clipboard.folderIds.length === selectedFolderIds.length &&
      selectedDocumentIds.every((documentId) => clipboard.documentIds.includes(documentId)) &&
      selectedFolderIds.every((folderId) => clipboard.folderIds.includes(folderId));

    const toolbarActionList = [];

    if (isSingleSelection && selectedFolderIds.length === 0) {
      toolbarActionList.push(
        { key: 'view', label: 'View', onSelect: () => handleView(singleDocument) },
        { key: 'download', label: 'Download', onSelect: () => handleDownload(singleDocument) },
        { key: 'rename', label: 'Rename', onSelect: () => handleRenameClick(singleDocument) }
      );
      if (singleDocument.renewalStatus !== RENEWAL_STATUS.EXPIRED) {
        toolbarActionList.push({ key: 'renew', label: 'Renew Document', onSelect: () => setRenewTarget(singleDocument) });
      }
      toolbarActionList.push({
        key: 'dates',
        label: 'Issue & Expiry Dates',
        onSelect: () => setDatesTarget(singleDocument),
      });
      if (isPdfDocument(singleDocument)) {
        toolbarActionList.push({ key: 'split', label: 'Split', onSelect: () => handleSplitClick(singleDocument) });
      }
      if (isPdfDocument(singleDocument)) {
        toolbarActionList.push(
          { key: 'editPdf', label: 'Edit PDF', onSelect: () => handleView(singleDocument) },
          { key: 'pdfToWord', label: 'PDF to Word', onSelect: () => handleConvert('pdfToWord', [singleDocument._id], 'PDF to Word') },
          { key: 'pdfToImages', label: 'PDF to JPG', onSelect: () => handlePdfToImages(singleDocument) }
        );
      }
      if (isWordDocument(singleDocument)) {
        toolbarActionList.push({
          key: 'wordToPdf',
          label: 'Word to PDF',
          onSelect: () => handleConvert('wordToPdf', [singleDocument._id], 'Word to PDF'),
        });
      }
      if (isArchiveDocument(singleDocument)) {
        toolbarActionList.push({
          key: 'extract',
          label: 'Extract Zip',
          onSelect: () => handleExtract(singleDocument),
        });
      }
    }

      if (selectedDocuments.length > 0 && selectedFolderIds.length === 0 && selectedDocuments.every(isConvertibleImage)) {
      toolbarActionList.push({
        key: 'imagesToPdf',
        label: selectedDocuments.length > 1 ? 'Images to PDF' : 'Image to PDF',
        onSelect: () => handleConvert('imagesToPdf', selectedDocumentIds, 'Images to PDF'),
      });
    }

    if (isMultipleSelection && selectedFolderIds.length === 0 && selectedDocuments.every(isPdfDocument)) {
      toolbarActionList.push({ key: 'merge', label: 'Merge', onSelect: handleMergeSelected });
    }

    if (selectedFolderIds.length === 1 && selectedDocuments.length === 0) {
      toolbarActionList.push({
        key: 'rename',
        label: 'Rename Folder',
        onSelect: () => setRenamingItem({ kind: 'folder', id: selectedFolderIds[0] }),
      });
    }

    if (hasAnySelection) {
      toolbarActionList.push(
        { key: 'compress', label: 'Compress to Zip', onSelect: handleCompress },
        { key: 'exportCopy', label: 'Copy to Computer', onSelect: () => handleExport(false) },
        { key: 'exportMove', label: 'Move to Computer', onSelect: () => handleExport(true) },
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

    if (clipboard) {
      toolbarActionList.push({ key: 'paste', label: 'Paste', onSelect: () => pasteClipboardInto(currentFolderId) });
    }

    if (hasAnySelection) {
      toolbarActionList.push(
        {
          key: 'delete',
          label: 'Move to Trash',
          isDanger: true,
          onSelect: () => moveToTrash(selectedDocumentIds, selectedFolderIds),
        },
        {
          key: 'deletePermanently',
          label: 'Delete Permanently',
          isDanger: true,
          onSelect: () => requestPermanentDelete(selectedDocumentIds, selectedFolderIds),
        }
      );
    }

    return toolbarActionList;
  };

  const toolbarActions = buildToolbarActions();

  const shortcutActions = Object.fromEntries(toolbarActions.map((toolbarAction) => [toolbarAction.key, toolbarAction]));
  shortcutActions.newFolder = {
    onSelect: handleNewFolderClick,
    isDisabled: !hasSource,
  };
  shortcutActions.undo = { onSelect: undoManager.undo };
  shortcutActions.redo = { onSelect: undoManager.redo };
  shortcutActions.redoAlternate = shortcutActions.redo;

  shortcutContextRef.current = {
    shortcuts,
    actions: shortcutActions,
    isBlocked: Boolean(
      viewerTarget || isShortcutsOpen || datesTarget || renewTarget || deleteTarget || showProgressModal
    ),
    clearSelection: () => {
      setContextMenu(null);
      clearSelection();
    },
  };

  const stableHandleTileClick = useStableCallback(handleTileClick);
  const stableHandleView = useStableCallback(handleView);
  const stableHandleTileContextMenu = useStableCallback(handleTileContextMenu);
  const stableHandleDocumentDragStart = useStableCallback(handleDocumentDragStart);
  const stableHandleFolderClick = useStableCallback(handleFolderClick);
  const stableHandleFolderDragStart = useStableCallback(handleFolderDragStart);
  const stableHandleFolderContextMenu = useStableCallback(handleFolderContextMenu);
  const stableHandleDropDocuments = useStableCallback(handleDropDocuments);
  const stableHandleCommitInlineRename = useStableCallback(handleCommitInlineRename);
  const stableHandleCancelInlineRename = useStableCallback(handleCancelInlineRename);

  return {
    queueNavigation,
    newItemIdSet,
    containsNewIdSet,
    progressTitle,
    folderSizes,
    viewSizes,
    handleUploadFromInput,
    undoManager,
    toolbarActions,
    shortcuts,
    isShortcutsOpen,
    handleOpenShortcuts: () => setIsShortcutsOpen(true),
    handleCloseShortcuts: () => setIsShortcutsOpen(false),
    handleChangeShortcut: setShortcut,
    handleResetShortcut: resetShortcut,
    handleResetAllShortcuts: resetAllShortcuts,
    showToast,
    sourceData,
    documents,
    folders,
    folderItemCounts,
    cutDocumentIds: clipboard?.mode === 'cut' ? clipboard.documentIds : [],
    cutFolderIds: clipboard?.mode === 'cut' ? clipboard.folderIds : [],
    selectedFolderIds,
    viewerTarget,
    viewerHasPrev: viewerIndex > 0,
    viewerHasNext: viewerIndex >= 0 && viewerIndex < visibleDocuments.length - 1,
    handleViewerNavigate,
    handleDownload,
    activeView,
    visibleDocuments,
    visibleFolders,
    viewTabItems,
    folderTrail,
    currentFolderId,
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
    handleOpenFolder,
    handleNewFolderClick,
    handleFolderClick: stableHandleFolderClick,
    handleFolderDragStart: stableHandleFolderDragStart,
    handleDropDocuments: stableHandleDropDocuments,
    handleDocumentDragStart: stableHandleDocumentDragStart,
    handleExplorerClick,
    handleExplorerContextMenu,
    handleFolderContextMenu: stableHandleFolderContextMenu,
    handleCloseToast,
    handleViewChange,
    handleToggleSelectionMode,
    handleTileClick: stableHandleTileClick,
    handleView: stableHandleView,
    handleTileContextMenu: stableHandleTileContextMenu,
    handleCloseContextMenu,
    handleCommitInlineRename: stableHandleCommitInlineRename,
    handleCancelInlineRename: stableHandleCancelInlineRename,
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