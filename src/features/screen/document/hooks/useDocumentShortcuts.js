import { useCallback, useState } from 'react';
import { DEFAULT_DOCUMENT_SHORTCUTS, DOCUMENT_SHORTCUTS_STORAGE_KEY } from '../constants/documentShortcut.constant';

const readStoredShortcuts = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(DOCUMENT_SHORTCUTS_STORAGE_KEY) || '{}');
    return Object.fromEntries(
      Object.keys(DEFAULT_DOCUMENT_SHORTCUTS).map((key) => [
        key,
        typeof stored[key] === 'string' ? stored[key] : DEFAULT_DOCUMENT_SHORTCUTS[key],
      ])
    );
  } catch {
    return { ...DEFAULT_DOCUMENT_SHORTCUTS };
  }
};

const writeStoredShortcuts = (shortcuts) => {
  try {
    localStorage.setItem(DOCUMENT_SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {
    return;
  }
};

export const useDocumentShortcuts = () => {
  const [shortcuts, setShortcuts] = useState(readStoredShortcuts);

  const updateShortcuts = useCallback((updater) => {
    setShortcuts((previous) => {
      const next = updater(previous);
      writeStoredShortcuts(next);
      return next;
    });
  }, []);

  const setShortcut = useCallback(
    (actionKey, shortcut) => updateShortcuts((previous) => ({ ...previous, [actionKey]: shortcut })),
    [updateShortcuts]
  );

  const resetShortcut = useCallback(
    (actionKey) =>
      updateShortcuts((previous) => ({ ...previous, [actionKey]: DEFAULT_DOCUMENT_SHORTCUTS[actionKey] })),
    [updateShortcuts]
  );

  const resetAllShortcuts = useCallback(
    () => updateShortcuts(() => ({ ...DEFAULT_DOCUMENT_SHORTCUTS })),
    [updateShortcuts]
  );

  return { shortcuts, setShortcut, resetShortcut, resetAllShortcuts };
};