export const COLORS = {
  primary: '#1e3a8a',
  primaryLight: '#3b82f6',
  primaryLighter: '#a1c5ffff',
  secondary: '#1e40af',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  dark: '#0f172a',
  light: '#f8fafc',
  infoLight: '#ffbbefff',
  infoLighter: '#75e6afff',
  infoDark: '#44ef5bff',
  chartColors: ['#1e3a8a', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
};


export const getStatusColor = (status) => {
  const statusColors = {
    'Active': COLORS.success,
    'Maintenance': COLORS.warning,
    'Critical': COLORS.danger,
    'Idle': COLORS.info,
    'available': COLORS.success,
    'low': COLORS.warning,
    'out': COLORS.danger,
    'in_stock': COLORS.success,
    'low_stock': COLORS.warning,
    'out_of_stock': COLORS.danger
  };
  return statusColors[status] || COLORS.primary;
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};