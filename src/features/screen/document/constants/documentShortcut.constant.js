export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const MOD = IS_MAC ? 'meta' : 'ctrl';

export const DOCUMENT_SHORTCUTS_STORAGE_KEY = 'document_shortcuts';

export const NATIVE_PASTE_SHORTCUT = `${MOD}+KeyV`;

export const DOCUMENT_SHORTCUT_ACTIONS = [
  { key: 'newFolder', label: 'New Folder' },
  { key: 'view', label: 'View' },
  { key: 'download', label: 'Download' },
  { key: 'dates', label: 'Issue & Expiry Dates' },
  { key: 'rename', label: 'Rename' },
  { key: 'renew', label: 'Renew Document' },
  { key: 'split', label: 'Split' },
  { key: 'merge', label: 'Merge' },
  { key: 'cut', label: 'Cut' },
  { key: 'copy', label: 'Copy' },
  { key: 'paste', label: 'Paste' },
  { key: 'delete', label: 'Delete' },
];

export const DEFAULT_DOCUMENT_SHORTCUTS = {
  newFolder: 'alt+KeyN',
  view: 'Enter',
  download: 'alt+KeyD',
  dates: 'alt+KeyI',
  rename: 'F2',
  renew: 'alt+KeyR',
  split: 'alt+KeyS',
  merge: 'alt+KeyM',
  cut: `${MOD}+KeyX`,
  copy: `${MOD}+KeyC`,
  paste: `${MOD}+KeyV`,
  delete: IS_MAC ? 'meta+Backspace' : 'Delete',
};

export const VIEWER_SHORTCUTS = [
  { label: 'Previous / next file', keys: '← / →' },
  { label: 'Reorder page (Shift = 5 pages)', keys: '↑ / ↓' },
  { label: 'Move page to start / end', keys: 'Home / End' },
  { label: 'Zoom in / out', keys: IS_MAC ? '⌥ ⌘ + / -' : 'Ctrl + Alt + / -' },
  { label: 'Rotate page', keys: 'R' },
  { label: 'Remove page', keys: 'Delete' },
  { label: 'Select multiple pages', keys: IS_MAC ? '⌘ + Click' : 'Ctrl + Click' },
  { label: 'Close viewer', keys: 'Esc' },
];