export const DEFAULT_FILTERS = {
  dateFilter: 'all',
  suppliers: [],
  equipmentTypes: [],
  costRange: { min: '', max: '' },
  lastMonthsCount: 6,
  customStartDate: '',
  customEndDate: '',
};

export const BACKCHARGE_LIST_PAGE_SIZE = 20;
export const BACKCHARGE_SCROLL_DEBOUNCE_MS = 200;
export const BACKCHARGE_SCROLL_BOTTOM_OFFSET_PX = 500;

export const BACKCHARGE_VIEW = {
  LIST: 'list',
  STATS: 'stats',
};

export const STATS_TAB = {
  OVERVIEW: 'overview',
  ANALYTICS: 'analytics',
  GROWTH: 'growth',
};

export const STATS_GRANULARITIES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'allYears', label: 'By Year' },
];

export const DEFAULT_STATS_GRANULARITY = 'month';

export const BACKCHARGE_TAB_ITEMS = [
  {
    key: BACKCHARGE_VIEW.LIST,
    label: 'Backcharge List',
  },
  {
    key: 'statistics',
    label: 'Statistics',
    children: [
      { key: STATS_TAB.OVERVIEW, label: 'Overview' },
      { key: STATS_TAB.ANALYTICS, label: 'Analytics' },
      { key: STATS_TAB.GROWTH, label: 'Growth' },
    ],
  },
];

export const ACTION_BUTTON_PROPS = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  width: 'fit-content',
  height: '38px',
  type: 'submit',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};