import { useEffect, useRef } from 'react';
import { INFINITE_FETCH_TRIGGER_ROWS_REMAINING } from './scrolling.constant';

export const useInfiniteFetch = ({
  virtualRows,
  rowCount,
  hasMore,
  isLoading,
  onLoadMore,
  triggerRowsRemaining = INFINITE_FETCH_TRIGGER_ROWS_REMAINING,
}) => {
  const firedForRowCount = useRef(-1);

  useEffect(() => {
    if (!hasMore || isLoading || rowCount === 0 || virtualRows.length === 0) return;

    const lastVisibleRowIndex = virtualRows[virtualRows.length - 1].index;
    const isNearEnd = lastVisibleRowIndex >= rowCount - 1 - triggerRowsRemaining;

    if (isNearEnd && firedForRowCount.current !== rowCount) {
      firedForRowCount.current = rowCount;
      onLoadMore();
    }
  }, [virtualRows, rowCount, hasMore, isLoading, onLoadMore, triggerRowsRemaining]);
};