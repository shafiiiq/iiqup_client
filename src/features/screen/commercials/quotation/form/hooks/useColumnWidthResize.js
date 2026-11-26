import { useState, useRef, useEffect } from 'react';
import {
  EDGE_GRAB_THRESHOLD_PX,
  measureColumnPercentWidths,
  resizeColumnWidths,
  applyColumnWidths,
} from '../../shared/helper/quotation.column.width.helper';

export const useColumnWidthResize = ({ columns, setColumns }) => {
  const dragRef = useRef(null);
  const [isResizingColumn, setIsResizingColumn] = useState(false);

  const handleHeaderMouseDown = (event, cell) => {
    if (!event.shiftKey || event.button !== 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const leftDistance = event.clientX - bounds.left;
    const rightDistance = bounds.right - event.clientX;
    if (Math.min(leftDistance, rightDistance) > EDGE_GRAB_THRESHOLD_PX) return;

    const edge = rightDistance <= leftDistance ? 'right' : 'left';
    const tableElement = event.currentTarget.closest('table');
    event.preventDefault();

    dragRef.current = {
      startX: event.clientX,
      edge,
      targetIndex: edge === 'right' ? cell.startIndex + cell.span - 1 : cell.startIndex,
      tableWidth: tableElement.getBoundingClientRect().width,
      startWidths: measureColumnPercentWidths(tableElement, columns),
    };
    setIsResizingColumn(true);
  };

  useEffect(() => {
    if (!isResizingColumn) return undefined;

    const handleMouseMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const deltaPercent = ((event.clientX - drag.startX) / drag.tableWidth) * 100;
      const nextWidths = resizeColumnWidths({
        widths: drag.startWidths,
        targetIndex: drag.targetIndex,
        edge: drag.edge,
        deltaPercent,
      });
      setColumns((previous) => applyColumnWidths(previous, nextWidths));
    };

    const suppressClick = (event) => {
      event.stopPropagation();
      event.preventDefault();
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsResizingColumn(false);
      window.addEventListener('click', suppressClick, true);
      setTimeout(() => window.removeEventListener('click', suppressClick, true), 0);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingColumn, setColumns]);

  return { handleHeaderMouseDown, isResizingColumn };
};

export default useColumnWidthResize;