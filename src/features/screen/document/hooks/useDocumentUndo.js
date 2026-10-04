import { useCallback, useEffect, useRef, useState } from 'react';

const UNDO_WINDOW_MILLISECONDS = 2 * 60 * 1000;
const MAXIMUM_HISTORY_ENTRIES = 50;
const EXPIRY_TIMER_PADDING_MILLISECONDS = 50;

const getLastEntry = (entries) => entries[entries.length - 1];

export const useDocumentUndo = ({ showToast }) => {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const refreshHandlersRef = useRef(new Map());
  const expiryTimerRef = useRef(0);
  const isRunningRef = useRef(false);
  const [historyState, setHistoryState] = useState({ undoLabel: '', redoLabel: '' });

  const pruneHistory = useCallback(() => {
    const now = Date.now();
    const isFresh = (entry) => now - entry.createdAt < UNDO_WINDOW_MILLISECONDS;
    undoStackRef.current = undoStackRef.current.filter(isFresh);
    const oldestRedoEntry = getLastEntry(redoStackRef.current);
    if (oldestRedoEntry && !isFresh(oldestRedoEntry)) redoStackRef.current = [];
  }, []);

  const syncHistory = useCallback(() => {
    pruneHistory();
    const undoLabel = getLastEntry(undoStackRef.current)?.label || '';
    const redoLabel = getLastEntry(redoStackRef.current)?.label || '';
    setHistoryState((previous) =>
      previous.undoLabel === undoLabel && previous.redoLabel === redoLabel ? previous : { undoLabel, redoLabel }
    );
    clearTimeout(expiryTimerRef.current);
    const allEntries = [...undoStackRef.current, ...redoStackRef.current];
    if (allEntries.length === 0) return;
    const nextExpiryTime = Math.min(...allEntries.map((entry) => entry.createdAt + UNDO_WINDOW_MILLISECONDS));
    expiryTimerRef.current = setTimeout(
      syncHistory,
      Math.max(nextExpiryTime - Date.now(), 0) + EXPIRY_TIMER_PADDING_MILLISECONDS
    );
  }, [pruneHistory]);

  useEffect(() => () => clearTimeout(expiryTimerRef.current), []);

  const recordOperation = useCallback(
    ({ label, undo, redo }) => {
      pruneHistory();
      undoStackRef.current = [...undoStackRef.current, { label, undo, redo, createdAt: Date.now() }].slice(
        -MAXIMUM_HISTORY_ENTRIES
      );
      redoStackRef.current = [];
      syncHistory();
    },
    [pruneHistory, syncHistory]
  );

  const registerRefreshHandler = useCallback((handlerKey, handler) => {
    refreshHandlersRef.current.set(handlerKey, handler);
    return () => {
      if (refreshHandlersRef.current.get(handlerKey) === handler) refreshHandlersRef.current.delete(handlerKey);
    };
  }, []);

  const runHistoryEntry = useCallback(
    async (direction) => {
      if (isRunningRef.current) return;
      pruneHistory();
      const isUndo = direction === 'undo';
      const sourceStackRef = isUndo ? undoStackRef : redoStackRef;
      const targetStackRef = isUndo ? redoStackRef : undoStackRef;
      const entry = getLastEntry(sourceStackRef.current);

      if (!entry) {
        syncHistory();
        showToast(isUndo ? 'Nothing to undo' : 'Nothing to redo', 'info');
        return;
      }

      isRunningRef.current = true;
      sourceStackRef.current = sourceStackRef.current.slice(0, -1);
      try {
        await entry[direction]();
        targetStackRef.current = [...targetStackRef.current, entry];
        showToast(`${isUndo ? 'Undone' : 'Redone'}: ${entry.label}`, 'success');
      } catch (error) {
        showToast(`Could not ${isUndo ? 'undo' : 'redo'} "${entry.label}": ${error.message}`, 'error');
      } finally {
        isRunningRef.current = false;
        await Promise.all(
          Array.from(refreshHandlersRef.current.values(), (handler) => Promise.resolve(handler()).catch(() => null))
        );
        syncHistory();
      }
    },
    [pruneHistory, syncHistory, showToast]
  );

  const undo = useCallback(() => runHistoryEntry('undo'), [runHistoryEntry]);
  const redo = useCallback(() => runHistoryEntry('redo'), [runHistoryEntry]);

  return {
    recordOperation,
    registerRefreshHandler,
    undo,
    redo,
    undoLabel: historyState.undoLabel,
    redoLabel: historyState.redoLabel,
    canUndo: Boolean(historyState.undoLabel),
    canRedo: Boolean(historyState.redoLabel),
  };
};