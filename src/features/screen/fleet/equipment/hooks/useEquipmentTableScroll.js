import { useCallback } from 'react';

export const useEquipmentTableScroll = ({
  currentPage,
  hasMore,
  isLoadingMore,
  isLoading,
  fetchEquipmentList,
  enabled,
}) => {
  const onScrollEnd = useCallback(() => {
    if (!enabled || !hasMore || isLoading || isLoadingMore) return;
    fetchEquipmentList(currentPage + 1, true);
  }, [enabled, hasMore, isLoading, isLoadingMore, fetchEquipmentList, currentPage]);

  return { onScrollEnd };
};