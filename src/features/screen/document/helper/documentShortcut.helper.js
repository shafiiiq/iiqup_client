import { IS_MAC } from '../constants/documentShortcut.constant';

const MODIFIER_CODES = [
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
  'MetaLeft',
  'MetaRight',
];

const MODIFIER_LABELS = IS_MAC
  ? { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' }
  : { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Win' };

const KEY_LABELS = {
  Backspace: IS_MAC ? '⌫' : 'Backspace',
  Equal: '=',
  Minus: '-',
  Space: 'Space',
};

export const eventToShortcut = (event) => {
  if (MODIFIER_CODES.includes(event.code)) return null;
  const parts = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('meta');
  parts.push(event.code);
  return parts.join('+');
};

export const formatShortcut = (shortcut) => {
  if (!shortcut) return '';
  const parts = shortcut.split('+');
  const code = parts.pop();
  const labels = [...parts.map((part) => MODIFIER_LABELS[part]), KEY_LABELS[code] || code.replace(/^(Key|Digit)/, '')];
  return labels.join(IS_MAC ? ' ' : ' + ');
};