import { useMemo } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const resolveSectionLabel = (activityDate, todayStart) => {
  const daysAgo = Math.floor((todayStart - startOfDay(new Date(activityDate))) / DAY_MS);
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return 'Earlier';
};

export const useNotificationSections = (items) =>
  useMemo(() => {
    const todayStart = startOfDay(new Date());
    const rows = [];
    let currentLabel = '';
    items.forEach((item) => {
      const label = resolveSectionLabel(item.lastActivityAt, todayStart);
      if (label !== currentLabel) {
        currentLabel = label;
        rows.push({ rowKind: 'label', id: `label-${label}`, label });
      }
      rows.push({ rowKind: 'item', id: item._id, item });
    });
    return rows;
  }, [items]);