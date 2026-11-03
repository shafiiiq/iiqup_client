const compareLastActivityDescending = (first, second) => {
  const timeDifference = Date.parse(second.lastActivityAt) - Date.parse(first.lastActivityAt);
  if (timeDifference !== 0) return timeDifference;
  if (first._id < second._id) return 1;
  return first._id > second._id ? -1 : 0;
};

export const sortNotificationsByLastActivity = (items) => [...items].sort(compareLastActivityDescending);

export const mergeNotificationPages = (existingItems, incomingItems) => {
  const itemsById = new Map(existingItems.map((item) => [item._id, item]));
  incomingItems.forEach((item) => itemsById.set(item._id, item));
  return sortNotificationsByLastActivity([...itemsById.values()]);
};