import { OUTGOING_ID_PREFIX, OUTGOING_MIN_PROGRESS_FOR_ESTIMATE } from '../constants/notification.outgoing';

export const createOutgoingId = () =>
  `${OUTGOING_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export const createOutgoingState = (hasFiles) => ({
  status: 'sending',
  progress: 0,
  hasFiles,
  startedAt: Date.now(),
  errorMessage: null,
});

export const toOutgoingAttachments = (files) =>
  files.map((file) => ({ filePath: URL.createObjectURL(file), fileName: file.name, mimeType: file.type }));

export const formatRemainingTime = (outgoing, now) => {
  const elapsedSeconds = (now - outgoing.startedAt) / 1000;
  if (outgoing.progress < OUTGOING_MIN_PROGRESS_FOR_ESTIMATE || elapsedSeconds < 1) return 'Estimating time';
  const remainingSeconds = Math.max(0, Math.ceil((elapsedSeconds * (1 - outgoing.progress)) / outgoing.progress));
  if (remainingSeconds < 60) return `${remainingSeconds}s left`;
  return `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s left`;
};

export const filterOutgoingForTab = (items, tab) => {
  if (tab.tab === 'all') return items;
  if (tab.tab !== 'category') return [];
  return items.filter((item) => item.categoryLabel?.toLowerCase() === tab.label.toLowerCase());
};