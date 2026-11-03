const AVERAGE_GLYPH_WIDTH_RATIO = 0.6;
const ELLIPSIS = '…';

export const countFittingCharacters = (availableWidth, fontSize) =>
  Math.max(0, Math.floor(availableWidth / (fontSize * AVERAGE_GLYPH_WIDTH_RATIO)));

export const fitGhostExample = (example, typedLength, maxCharacters) => {
  if (!example) return '';
  const room = maxCharacters - typedLength;
  if (example.length <= room) return example;
  if (room <= 1) return '';
  return `${example.slice(0, room - 1).trimEnd()}${ELLIPSIS}`;
};