export const GRANULARITIES = [
  { key: 'daily', label: 'This Week', description: 'Sunday to Saturday' },
  { key: 'weekly', label: 'This Month', description: 'Week 1 to Week 5' },
  { key: 'monthly', label: 'This Year', description: 'January to December' },
  { key: 'yearly', label: 'By Year', description: 'Last 5 years' },
];

export const DEFAULT_GRANULARITY = 'daily';

export const COLORS = {
  primary: '#1a1a1a',
  primaryLight: '#f5c451',
  secondary: '#8a8a84',
  accent: '#f08c4a',
  success: '#3fb27f',
  warning: '#f5c451',
  danger: '#e0654f',
  info: '#7c9cf5',
  chartColors: ['#7f7c60', '#f5c451', '#7c9cf5', '#3fb27f', '#f08c4a', '#e0654f', '#a05af0', '#4ad0d0'],
};

export const DIRECTION_COLOR = {
  growth: COLORS.success,
  loss: COLORS.danger,
  neutral: COLORS.info,
};

export const getStatusColor = (status) => {
  const map = {
    active: COLORS.success,
    idle: COLORS.info,
    maintenance: COLORS.warning,
    in_stock: COLORS.success,
    low_stock: COLORS.warning,
    out_of_stock: COLORS.danger,
    available: COLORS.success,
    low: COLORS.warning,
    out: COLORS.danger,
  };
  return map[status] || COLORS.primary;
};

export const WELCOME_COPY = {
  title: 'Welcome in, Admin',
  subtitle: 'Here is your fleet overview.',
};

export const ANALYTICS_COPY = {
  title: 'Analytics',
  subtitle: 'Activity breakdown and stock performance across your fleet.',
};

export const HISTORICAL_COPY = {
  title: 'Historical Data',
  subtitle: 'Browse activity by day, week, month or year.',
};

export const GRAPHS_COPY = {
  title: 'Graphs',
  subtitle: 'Company growth trends and equipment health at a glance.',
};
