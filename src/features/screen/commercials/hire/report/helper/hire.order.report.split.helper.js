import { countRichLines, splitRichHtmlByLines } from '@/shared/components/widgets/input/richText.split';

const findLongestTextColumn = (item, columns) => {
  let longestColumnId = null;
  let longestLineCount = 1;

  columns.forEach((column) => {
    if (column.type !== 'text') return;
    const lineCount = countRichLines(item[column.id]);
    if (lineCount > longestLineCount) {
      longestColumnId = column.id;
      longestLineCount = lineCount;
    }
  });

  return { longestColumnId, longestLineCount };
};

export const splitItemByFitRatio = (item, columns, fitRatio) => {
  const { longestColumnId, longestLineCount } = findLongestTextColumn(item, columns);
  if (!longestColumnId) return null;

  const headLineCount = Math.min(longestLineCount - 1, Math.max(1, Math.floor(longestLineCount * fitRatio)));
  const parts = splitRichHtmlByLines(item[longestColumnId], headLineCount);
  if (!parts) return null;

  return {
    head: { ...item, [longestColumnId]: parts.head },
    tail: { ...item, [longestColumnId]: parts.tail, isContinuation: true, splitColumnId: longestColumnId },
  };
};