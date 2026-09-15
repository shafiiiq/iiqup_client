import { useEffect, useState } from 'react';
import {
  EQUIPMENT_GRID_COLUMN_BREAKPOINT_PX,
  EQUIPMENT_GRID_GAP_DESKTOP_PX,
  EQUIPMENT_GRID_GAP_MOBILE_PX,
  EQUIPMENT_GRID_GAP_MOBILE_BREAKPOINT_PX,
} from '../constants/equipment.constant';

const resolveColumnCount = (width) => (width <= EQUIPMENT_GRID_COLUMN_BREAKPOINT_PX ? 1 : 2);
const resolveGap = (width) => (width <= EQUIPMENT_GRID_GAP_MOBILE_BREAKPOINT_PX ? EQUIPMENT_GRID_GAP_MOBILE_PX : EQUIPMENT_GRID_GAP_DESKTOP_PX);

export const useEquipmentGridColumns = () => {
  const [columnCount, setColumnCount] = useState(() => resolveColumnCount(window.innerWidth));
  const [gap, setGap] = useState(() => resolveGap(window.innerWidth));

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(resolveColumnCount(window.innerWidth));
      setGap(resolveGap(window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { columnCount, gap };
};