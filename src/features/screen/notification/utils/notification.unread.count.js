export const countUnreadInRow = (row) => {
  if (row.rowKind !== 'item') return 0;
  return (row.item.isRead ? 0 : 1) + row.item.unseenReplyCount;
};

export const countUnreadInRows = (rows) => rows.reduce((total, row) => total + countUnreadInRow(row), 0);