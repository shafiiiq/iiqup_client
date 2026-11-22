import { resolveHeaderCells } from '../../shared/helper/quotation.header.cell.helper';

const findSelectedHeaderCells = (columns, selectedIds) =>
  resolveHeaderCells(columns).filter((cell) => selectedIds.includes(cell.column.id));

export const resetHeaderSpans = (columns) =>
  columns.map((column) => (column.headerSpan > 1 ? { ...column, headerSpan: 1 } : column));

export const canMergeHeaderColumns = (columns, selectedIds) => {
  const selectedCells = findSelectedHeaderCells(columns, selectedIds);
  if (selectedCells.length < 2) return false;

  return selectedCells.every((cell, index) => {
    if (index === 0) return true;
    const previous = selectedCells[index - 1];
    return previous.startIndex + previous.span === cell.startIndex;
  });
};

export const mergeHeaderColumns = (columns, selectedIds) => {
  const selectedCells = findSelectedHeaderCells(columns, selectedIds);
  const firstCell = selectedCells[0];
  const lastCell = selectedCells[selectedCells.length - 1];
  const startIndex = firstCell.startIndex;
  const endIndex = lastCell.startIndex + lastCell.span - 1;

  return columns.map((column, index) => {
    if (index === startIndex) return { ...column, headerSpan: endIndex - startIndex + 1 };
    if (index > startIndex && index <= endIndex) return { ...column, headerSpan: 1 };
    return column;
  });
};

export const unmergeHeaderColumn = (columns, columnId) =>
  columns.map((column) => (column.id === columnId ? { ...column, headerSpan: 1 } : column));