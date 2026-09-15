import { useCallback } from 'react';
import { useVirtualGrid } from '@/shared/scrolling/useVirtualGrid';
import { useInfiniteFetch } from '@/shared/scrolling/useInfiniteFetch';
import { useEquipmentGridColumns } from './useEquipmentGridColumns';
import {
  EQUIPMENT_TABS,
  EQUIPMENT_GRID_ROW_HEIGHT_HIRED_PX,
  EQUIPMENT_GRID_ROW_HEIGHT_DEFAULT_PX,
} from '../constants/equipment.constant';

export const useEquipmentGridVirtualization = ({
  items,
  activeTab,
  currentPage,
  hasMore,
  isLoadingMore,
  isLoading,
  fetchEquipmentList,
  enabled,
}) => {
  const { columnCount, gap } = useEquipmentGridColumns();

  // Hired cards render an extra title line, so they run taller — matches
  // the '--card-min-height' distinction already made in EquipmentCard.jsx.
  const estimateRowHeight = activeTab === EQUIPMENT_TABS.HIRED
    ? EQUIPMENT_GRID_ROW_HEIGHT_HIRED_PX
    : EQUIPMENT_GRID_ROW_HEIGHT_DEFAULT_PX;

  const grid = useVirtualGrid({
    items: enabled ? items : [],
    columnCount,
    estimateRowHeight,
    gap,
  });

  const loadNextPage = useCallback(() => {
    fetchEquipmentList(currentPage + 1, true);
  }, [fetchEquipmentList, currentPage]);

  useInfiniteFetch({
    virtualRows: grid.virtualRows,
    rowCount: grid.rowCount,
    hasMore: enabled && hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: loadNextPage,
  });

  return { ...grid, columnCount, gap };
};