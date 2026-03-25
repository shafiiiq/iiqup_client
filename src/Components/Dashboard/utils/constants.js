export const COLORS = {
  primary:       '#1e3a8a',
  primaryLight:  '#3b82f6',
  primaryLighter:'#a1c5ffff',
  secondary:     '#1e40af',
  accent:        '#06b6d4',
  success:       '#10b981',
  warning:       '#f59e0b',
  danger:        '#ef4444',
  info:          '#8b5cf6',
  dark:          '#0f172a',
  light:         '#f8fafc',
  infoLight:     '#ffbbefff',
  infoLighter:   '#75e6afff',
  infoDark:      '#44ef5bff',
  chartColors:   ['#1e3a8a','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']
};

export const TABS = ['daily', 'weekly', 'monthly', 'yearly'];

export const COMPARISON_TYPES = ['days', 'months', 'years'];

export const TAB_CACHE_TTL       = 60_000;
export const COMPARISON_CACHE_TTL = 300_000;
export const EQUIPMENT_CACHE_TTL  = 30_000;

export const getStatusColor = (status) => {
  const map = {
    Active:        COLORS.success,
    Maintenance:   COLORS.warning,
    Critical:      COLORS.danger,
    Idle:          COLORS.info,
    available:     COLORS.success,
    low:           COLORS.warning,
    out:           COLORS.danger,
    in_stock:      COLORS.success,
    low_stock:     COLORS.warning,
    out_of_stock:  COLORS.danger,
  };
  return map[status] || COLORS.primary;
};