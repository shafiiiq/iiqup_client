const pluralize = (value, unit) => (value === 1 ? `1 ${unit} ago` : `${value} ${unit}s ago`);

export const getRelativeTime = (date) => {
  const differenceInSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (differenceInSeconds < 60) return differenceInSeconds <= 1 ? 'just now' : `${differenceInSeconds} sec ago`;

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  if (differenceInMinutes < 60) return pluralize(differenceInMinutes, 'min').replace('mins', 'min');

  const differenceInHours = Math.floor(differenceInMinutes / 60);
  if (differenceInHours < 24) return pluralize(differenceInHours, 'hour');

  const differenceInDays = Math.floor(differenceInHours / 24);
  if (differenceInDays < 7) return pluralize(differenceInDays, 'day');

  const differenceInWeeks = Math.floor(differenceInDays / 7);
  if (differenceInWeeks < 4) return pluralize(differenceInWeeks, 'week');

  const differenceInMonths = Math.floor(differenceInDays / 30);
  if (differenceInMonths < 12) return pluralize(differenceInMonths, 'month');

  return pluralize(Math.floor(differenceInMonths / 12), 'year');
};

export const formatNotificationTime = (createdAt) => {
  if (!createdAt) return 'Recently';
  try {
    return getRelativeTime(createdAt);
  } catch {
    return 'Recently';
  }
};

export const formatPlaybackTime = (totalSeconds) => {
  const wholeSeconds = Math.floor(totalSeconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
};