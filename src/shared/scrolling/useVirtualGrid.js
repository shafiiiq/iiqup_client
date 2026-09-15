import { useMemo, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { VIRTUAL_GRID_OVERSCAN_ROWS } from './scrolling.constant';

const chunkIntoRows = (items, columnCount) => {
  if (columnCount <= 0 || items.length === 0) return [];
  const rows = [];
  for (let i = 0; i < items.length; i += columnCount) {
    rows.push(items.slice(i, i + columnCount));
  }
  return rows;
};

export const useVirtualGrid = ({
  items,
  columnCount,
  estimateRowHeight,
  gap,
  overscan = VIRTUAL_GRID_OVERSCAN_ROWS,
}) => {
  const containerRef = useRef(null);

  const rows = useMemo(() => chunkIntoRows(items, columnCount), [items, columnCount]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => estimateRowHeight + gap,
    overscan,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const scrollMargin = containerRef.current?.offsetTop ?? 0;

  return {
    containerRef,
    rows,
    rowCount: rows.length,
    virtualRows,
    totalHeight: rowVirtualizer.getTotalSize(),
    measureRow: rowVirtualizer.measureElement,
    getRowOffset: (virtualRow) => virtualRow.start - scrollMargin,
  };
};