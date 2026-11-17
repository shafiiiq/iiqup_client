import { useCallback, useEffect, useRef, useState } from 'react';

const HISTORY_DEBOUNCE_MS = 400;

const useHireOrderHistory = ({ snapshot, applySnapshot }) => {
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const presentRef = useRef(null);
  const suppressRef = useRef(true);
  const timerRef = useRef(null);
  const undoRef = useRef(null);
  const redoRef = useRef(null);
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      presentRef.current = snapshot;
      return undefined;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (presentRef.current) pastRef.current.push(presentRef.current);
      presentRef.current = snapshot;
      futureRef.current = [];
      setRevision((value) => value + 1);
    }, HISTORY_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [snapshot]);

  const undo = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!pastRef.current.length) return;
    const previous = pastRef.current.pop();
    futureRef.current.push(presentRef.current);
    suppressRef.current = true;
    applySnapshot(previous);
    presentRef.current = previous;
    setRevision((value) => value + 1);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!futureRef.current.length) return;
    const next = futureRef.current.pop();
    pastRef.current.push(presentRef.current);
    suppressRef.current = true;
    applySnapshot(next);
    presentRef.current = next;
    setRevision((value) => value + 1);
  }, [applySnapshot]);

  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoRef.current();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redoRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const suppressNext = useCallback(() => {
    suppressRef.current = true;
  }, []);

  return {
    undo,
    redo,
    suppressNext,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
};

export default useHireOrderHistory;