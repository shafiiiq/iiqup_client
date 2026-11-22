export const resolveHeaderCells = (columns) => {
  const cells = [];
  let index = 0;

  while (index < columns.length) {
    const column = columns[index];
    const span = Math.max(1, Math.min(column.headerSpan || 1, columns.length - index));
    cells.push({ column, span, startIndex: index });
    index += span;
  }

  return cells;
};