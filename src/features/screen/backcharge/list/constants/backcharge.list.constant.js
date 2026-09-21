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

export const SIGNATURE_LEGEND_GROUPS = [
  {
    label: 'General',
    items: [
      { color: '#f52a2a', label: 'Nobody signed yet' },
      { color: '#3cbe15', label: 'All 4 signed — complete' },
      { color: '#d5e21f', label: 'Your signature is needed' },
    ],
  },
  {
    label: '1 Signed',
    items: [
      { color: '#ff600a', label: 'Workshop Manager only' },
      { color: '#12a5ca', label: 'Purchase Manager only' },
      { color: '#db2777', label: 'Operations Manager only' },
      { color: '#eca50b', label: 'Authorized Signatory only' },
    ],
  },
  {
    label: '2 Signed',
    items: [
      { color: '#0a9185', label: 'WM + PM' },
      { color: '#7c3aed', label: 'WM + Ops' },
      { color: '#57534e', label: 'WM + Authorized' },
      { color: '#1d4ed8', label: 'PM + Ops' },
      { color: '#65a30d', label: 'PM + Authorized' },
      { color: '#be123c', label: 'Ops + Authorized' },
    ],
  },
  {
    label: '3 Signed',
    items: [
      { color: '#92400e', label: 'WM + PM + Ops' },
      { color: '#e40faf', label: 'WM + PM + Authorized' },
      { color: '#5a6b0d', label: 'WM + Ops + Authorized' },
      { color: '#8924db', label: 'PM + Ops + Authorized' },
    ],
  },
];

export const DRAFT_STATUS = { label: 'Draft', background: 'var(--hover-bg)', color: 'var(--text-color)' };

export const SIGNATURE_STATUS = {
  'backcharge-sig-none': { label: 'Unsigned', background: '#f52a2a', color: '#ffffff' },
  'backcharge-sig-all': { label: 'Approved', background: '#3cbe15', color: '#ffffff' },
  'backcharge-sig-pending': { label: 'Your Turn', background: '#d5e21f', color: '#1f2937' },
  'backcharge-sig-wm-only': { label: 'In Progress', background: '#ff600a', color: '#ffffff' },
  'backcharge-sig-pm-only': { label: 'In Progress', background: '#12a5ca', color: '#ffffff' },
  'backcharge-sig-ops-only': { label: 'In Progress', background: '#db2777', color: '#ffffff' },
  'backcharge-sig-auth-only': { label: 'In Progress', background: '#eca50b', color: '#1f2937' },
  'backcharge-sig-wm-pm': { label: 'In Progress', background: '#0a9185', color: '#ffffff' },
  'backcharge-sig-wm-ops': { label: 'In Progress', background: '#7c3aed', color: '#ffffff' },
  'backcharge-sig-wm-auth': { label: 'In Progress', background: '#57534e', color: '#ffffff' },
  'backcharge-sig-pm-ops': { label: 'In Progress', background: '#1d4ed8', color: '#ffffff' },
  'backcharge-sig-pm-auth': { label: 'In Progress', background: '#65a30d', color: '#ffffff' },
  'backcharge-sig-ops-auth': { label: 'In Progress', background: '#be123c', color: '#ffffff' },
  'backcharge-sig-wm-pm-ops': { label: 'In Progress', background: '#92400e', color: '#ffffff' },
  'backcharge-sig-wm-pm-auth': { label: 'In Progress', background: '#e40faf', color: '#ffffff' },
  'backcharge-sig-wm-ops-auth': { label: 'In Progress', background: '#5a6b0d', color: '#ffffff' },
  'backcharge-sig-pm-ops-auth': { label: 'In Progress', background: '#8924db', color: '#ffffff' },
};

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