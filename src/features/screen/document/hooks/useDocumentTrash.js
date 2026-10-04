import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  fetchTrashSources,
  fetchTrashItems,
  restoreTrashItems,
  deleteItemsPermanently,
  emptyTrash,
} from '../api/document.api';
import { buildDocumentFileLabel } from '../helper/document.helper';
import { buildUndoByTrashOperation } from '../helper/documentUndo.helper';
import { eventToShortcut } from '../helper/documentShortcut.helper';

const DOCUMENT_KEY_PREFIX = 'document:';
const FOLDER_KEY_PREFIX = 'folder:';

const extractIds = (itemKeys, prefix) =>
  itemKeys.filter((itemKey) => itemKey.startsWith(prefix)).map((itemKey) => itemKey.slice(prefix.length));

const normalizeTrashItems = ({ documents, folders }) => [
  ...folders.map((folderItem) => ({
    key: `${FOLDER_KEY_PREFIX}${folderItem._id}`,
    kind: 'folder',
    name: folderItem.name,
    trashedFromPath: folderItem.trashedFromPath,
    deletedAt: folderItem.deletedAt,
    itemCount: folderItem.itemCount,
    size: folderItem.bytes,
  })),
  ...documents.map((documentItem) => ({
    key: `${DOCUMENT_KEY_PREFIX}${documentItem._id}`,
    kind: 'document',
    name: buildDocumentFileLabel(documentItem),
    trashedFromPath: documentItem.trashedFromPath,
    deletedAt: documentItem.deletedAt,
    size: documentItem.fileSize,
    documentItem,
  })),
];

export const useDocumentTrash = ({ isActive, shortcuts, showToast, undoManager }) => {
  const { recordOperation, registerRefreshHandler } = undoManager;
  const [sources, setSources] = useState([]);
  const [activeSource, setActiveSource] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestIdRef = useRef(0);
  const latestRef = useRef({});

  const loadTrash = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    try {
      if (activeSource) {
        const data = await fetchTrashItems(activeSource);
        if (requestId !== requestIdRef.current) return;
        const normalizedItems = normalizeTrashItems(data);
        setItems(normalizedItems);
        if (normalizedItems.length === 0) setActiveSource(null);
      } else {
        const data = await fetchTrashSources();
        if (requestId !== requestIdRef.current) return;
        setSources(data);
      }
      setSelectedKeys([]);
    } catch (error) {
      if (requestId === requestIdRef.current) showToast(`Error: ${error.message}`, 'error');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [activeSource, showToast]);

  useEffect(() => {
    if (!isActive) {
      setActiveSource(null);
      setItems([]);
      setSelectedKeys([]);
      setContextMenu(null);
      return undefined;
    }
    loadTrash();
    return () => {
      requestIdRef.current += 1;
    };
  }, [isActive, loadTrash]);

  useEffect(() => {
    if (!isActive) return undefined;
    return registerRefreshHandler('trash', loadTrash);
  }, [isActive, registerRefreshHandler, loadTrash]);

  const handleOpenSource = useCallback(
    (sourceKey) => {
      const source = sources.find((candidate) => `${candidate.sourceType}:${candidate.sourceId}` === sourceKey);
      if (source) {
        setItems([]);
        setActiveSource({ sourceType: source.sourceType, sourceId: source.sourceId, label: `${source.typeLabel} · ${source.label}` });
      }
    },
    [sources]
  );

  const handleResetSource = useCallback(() => setActiveSource(null), []);

  const handleItemClick = useCallback((item, event) => {
    setContextMenu(null);
    if (event.metaKey || event.ctrlKey) {
      setSelectedKeys((previous) =>
        previous.includes(item.key) ? previous.filter((itemKey) => itemKey !== item.key) : [...previous, item.key]
      );
      return;
    }
    setSelectedKeys([item.key]);
  }, []);

  const handleItemContextMenu = useCallback((event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedKeys((previous) => (previous.includes(item.key) ? previous : [item.key]));
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);

  const handleBackgroundClick = useCallback((event) => {
    if (!event.target.closest('[data-trash-item]')) setSelectedKeys([]);
  }, []);

  const restoreSelected = async () => {
    if (selectedKeys.length === 0) return;
    setIsSubmitting(true);
    try {
      await restoreTrashItems({
        documentIds: extractIds(selectedKeys, DOCUMENT_KEY_PREFIX),
        folderIds: extractIds(selectedKeys, FOLDER_KEY_PREFIX),
      });
      recordOperation(
        buildUndoByTrashOperation({
          label: `Restore ${selectedKeys.length} item(s)`,
          documentIds: extractIds(selectedKeys, DOCUMENT_KEY_PREFIX),
          folderIds: extractIds(selectedKeys, FOLDER_KEY_PREFIX),
        })
      );
      showToast(`${selectedKeys.length} item(s) restored`, 'success');
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
    await loadTrash();
  };

  const requestDeleteSelected = () => {
    if (selectedKeys.length === 0) return;
    const message =
      selectedKeys.length === 1
        ? 'Delete the selected item permanently? This cannot be undone.'
        : `Delete ${selectedKeys.length} items permanently? This cannot be undone.`;
    setConfirmTarget({ kind: 'selection', message, itemKeys: selectedKeys });
  };

  const requestEmptyTrash = () => {
    setConfirmTarget({
      kind: 'empty',
      message: activeSource
        ? 'Delete everything in this Trash folder permanently? This cannot be undone.'
        : 'Empty the whole Trash? Everything in it is deleted permanently and cannot be undone.',
    });
  };

  const handleCancelConfirm = () => setConfirmTarget(null);

  const handleConfirmDelete = async () => {
    const target = confirmTarget;
    setConfirmTarget(null);
    if (!target) return;
    setIsSubmitting(true);
    try {
      if (target.kind === 'empty') {
        await emptyTrash(activeSource || {});
      } else {
        await deleteItemsPermanently({
          documentIds: extractIds(target.itemKeys, DOCUMENT_KEY_PREFIX),
          folderIds: extractIds(target.itemKeys, FOLDER_KEY_PREFIX),
        });
      }
      showToast('Deleted permanently', 'success');
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
    await loadTrash();
  };

  latestRef.current = { shortcuts, confirmTarget, requestDeleteSelected };

  useEffect(() => {
    if (!isActive) return undefined;
    const handleKeyDown = (event) => {
      const current = latestRef.current;
      if (current.confirmTarget) return;
      if (event.key === 'Escape') {
        setSelectedKeys([]);
        setContextMenu(null);
        return;
      }
      const targetTagName = event.target?.tagName;
      if (targetTagName === 'INPUT' || targetTagName === 'TEXTAREA') return;
      if (eventToShortcut(event) === current.shortcuts.deletePermanently) {
        event.preventDefault();
        current.requestDeleteSelected();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  const contextMenuItems = contextMenu
    ? [
        { key: 'restore', label: 'Restore', onSelect: restoreSelected },
        { key: 'delete', label: 'Delete Permanently', isDanger: true, onSelect: requestDeleteSelected },
      ]
    : [];

  const hasContent = activeSource ? items.length > 0 : sources.length > 0;
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  return {
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
    handleResetSource,
    handleItemClick,
    handleItemContextMenu,
    handleCloseContextMenu,
    handleBackgroundClick,
    restoreSelected,
    requestDeleteSelected,
    requestEmptyTrash,
    handleCancelConfirm,
    handleConfirmDelete,
  };
};