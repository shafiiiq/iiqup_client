const PRIORITY_COLORS = {
  high: 'var(--color-error-700)',
  medium: 'var(--color-error-500)',
  low: 'var(--color-error-300)',
};

const DEFAULT_PRIORITY_COLOR = 'var(--color-error-200)';

export const getNotificationColor = (priority) => (priority && PRIORITY_COLORS[priority]) || DEFAULT_PRIORITY_COLOR;