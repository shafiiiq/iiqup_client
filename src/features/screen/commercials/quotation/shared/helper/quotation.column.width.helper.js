export const MIN_COLUMN_WIDTH_PERCENT = 5;
export const EDGE_GRAB_THRESHOLD_PX = 6;
export const SERIAL_COLUMN_WIDTH_PX = 40;

const roundWidth = (value) => Math.round(value * 100) / 100;

export const measureColumnPercentWidths = (tableElement, columns) => {
  const tableWidth = tableElement.getBoundingClientRect().width;
  const fullRow = Array.from(tableElement.querySelectorAll('tbody tr')).find(
    (row) => row.children.length === columns.length + 1
  );

  if (!fullRow) {
    const serialPercent = (SERIAL_COLUMN_WIDTH_PX / tableWidth) * 100;
    return columns.map(() => roundWidth((100 - serialPercent) / columns.length));
  }

  return Array.from(fullRow.children)
    .slice(1)
    .map((cell) => roundWidth((cell.getBoundingClientRect().width / tableWidth) * 100));
};

export const resizeColumnWidths = ({ widths, targetIndex, edge, deltaPercent }) => {
  const growth = edge === 'right' ? deltaPercent : -deltaPercent;
  const preferredDonorIndex = edge === 'right' ? targetIndex + 1 : targetIndex - 1;
  const hasPreferredDonor = preferredDonorIndex >= 0 && preferredDonorIndex < widths.length;
  const fallbackDonorIndex = edge === 'right' ? targetIndex - 1 : targetIndex + 1;
  const donorIndex = hasPreferredDonor ? preferredDonorIndex : fallbackDonorIndex;
  if (donorIndex < 0 || donorIndex >= widths.length) return widths;

  const minimumGrowth = MIN_COLUMN_WIDTH_PERCENT - widths[targetIndex];
  const maximumGrowth = widths[donorIndex] - MIN_COLUMN_WIDTH_PERCENT;
  const boundedGrowth = Math.min(maximumGrowth, Math.max(minimumGrowth, growth));

  return widths.map((width, index) => {
    if (index === targetIndex) return roundWidth(width + boundedGrowth);
    if (index === donorIndex) return roundWidth(width - boundedGrowth);
    return roundWidth(width);
  });
};

export const applyColumnWidths = (columns, widths) =>
  columns.map((column, index) => ({ ...column, width: widths[index] }));

export const clearColumnWidths = (columns) =>
  columns.map((column) => (column.width ? { ...column, width: null } : column));