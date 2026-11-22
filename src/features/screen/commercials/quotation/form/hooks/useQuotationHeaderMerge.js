import { useState, useEffect } from 'react';
import { useMultiSelectModifierKey } from './useMultiSelectModifierKey';
import {
  canMergeHeaderColumns,
  mergeHeaderColumns,
  unmergeHeaderColumn,
} from '../helper/quotation.header.merge.helper';

export const useQuotationHeaderMerge = ({ columns, setColumns }) => {
  const [selectedHeaderIds, setSelectedHeaderIds] = useState([]);
  const [headerMenu, setHeaderMenu] = useState(null);
  const isMultiSelectActive = useMultiSelectModifierKey();

  useEffect(() => {
    if (!headerMenu) return undefined;

    const closeMenu = () => setHeaderMenu(null);
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [headerMenu]);

  const handleHeaderClick = (event, columnId) => {
    if (event.metaKey || event.ctrlKey) {
      setSelectedHeaderIds((previous) =>
        previous.includes(columnId) ? previous.filter((id) => id !== columnId) : [...previous, columnId]
      );
      return;
    }
    setSelectedHeaderIds([]);
  };

  const handleHeaderContextMenu = (event, cell) => {
    event.preventDefault();
    const mergeable = canMergeHeaderColumns(columns, selectedHeaderIds);
    const unmergeable = cell.span > 1;
    if (!mergeable && !unmergeable) return;

    setHeaderMenu({
      x: event.clientX,
      y: event.clientY,
      columnId: cell.column.id,
      mergeable,
      unmergeable,
    });
  };

  const mergeSelectedHeaders = () => {
    setColumns((previous) => mergeHeaderColumns(previous, selectedHeaderIds));
    setSelectedHeaderIds([]);
    setHeaderMenu(null);
  };

  const unmergeHeader = (columnId) => {
    setColumns((previous) => unmergeHeaderColumn(previous, columnId));
    setHeaderMenu(null);
  };

  return {
    isMultiSelectActive,
    selectedHeaderIds,
    headerMenu,
    handleHeaderClick,
    handleHeaderContextMenu,
    mergeSelectedHeaders,
    unmergeHeader,
  };
};

export default useQuotationHeaderMerge;