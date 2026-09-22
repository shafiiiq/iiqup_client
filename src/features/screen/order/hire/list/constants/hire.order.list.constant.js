export const DEFAULT_FILTERS = {
  dateFilter: 'all',
  vendors: [],
  amountRange: { min: '', max: '' },
  lastMonthsCount: 6,
  customStartDate: '',
  customEndDate: '',
};

export const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  width: 'fit-content',
  height: '38px',
  type: 'submit',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};

export const MONTH_COUNT_OPTIONS = [
  { value: 1, label: '1 Month' },
  { value: 2, label: '2 Months' },
  { value: 3, label: '3 Months' },
  { value: 4, label: '4 Months' },
  { value: 5, label: '5 Months' },
  { value: 6, label: '6 Months' },
  { value: 7, label: '7 Months' },
  { value: 8, label: '8 Months' },
  { value: 9, label: '9 Months' },
  { value: 10, label: '10 Months' },
  { value: 11, label: '11 Months' },
  { value: 12, label: '12 Months' },
];

export const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'lastXmonths', label: 'Last X Months' },
  { value: 'custom', label: 'Custom Range' },
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
      { color: '#ff600a', label: 'Manager only' },
      { color: '#12a5ca', label: 'PM only' },
      { color: '#db2777', label: 'Accounts only' },
      { color: '#eca50b', label: 'CEO only' },
    ],
  },
  {
    label: '2 Signed',
    items: [
      { color: '#0a9185', label: 'Manager + PM' },
      { color: '#7c3aed', label: 'Manager + Accounts' },
      { color: '#57534e', label: 'Manager + CEO' },
      { color: '#1d4ed8', label: 'PM + Accounts' },
      { color: '#65a30d', label: 'PM + CEO' },
      { color: '#be123c', label: 'Accounts + CEO' },
    ],
  },
  {
    label: '3 Signed',
    items: [
      { color: '#92400e', label: 'Manager + PM + Accounts' },
      { color: '#e40faf', label: 'Manager + PM + CEO' },
      { color: '#5a6b0d', label: 'Manager + Accounts + CEO' },
      { color: '#8924db', label: 'PM + Accounts + CEO' },
    ],
  },
  {
    label: 'No colour',
    items: [
      { color: 'rgba(255,255,255,0.08)', label: 'Hire Order not yet uploaded' },
    ],
  },
];

export const SIGNED_WORKFLOW_STATUSES = [
  'hire_order_uploaded',
  'hire_order_amended',
  'manager_approved',
  'purchase_approved',
  'accounts_approved',
  'ceo_approved',
  'md_approved',
  'items_available',
];

export const DRAFT_STATUS = { label: 'Draft', background: 'var(--hover-bg)', color: 'var(--text-color)' };

export const STATUS_LABELS = {
  yes: { label: 'Yes', background: '#20620c', color: '#ffffff' },
  no: { label: 'No', background: '#681111', color: '#ffffff' },
};

export const SIGNATURE_STATUS = {
  'hire-order-sig-none': { label: 'Unsigned', background: '#f52a2a', color: '#ffffff' },
  'hire-order-sig-all': { label: 'Approved', background: '#3cbe15', color: '#ffffff' },
  'hire-order-sig-pending': { label: 'Your Turn', background: '#d5e21f', color: '#1f2937' },
  'hire-order-sig-mgr-only': { label: 'In Progress', background: '#ff600a', color: '#ffffff' },
  'hire-order-sig-pm-only': { label: 'In Progress', background: '#12a5ca', color: '#ffffff' },
  'hire-order-sig-acc-only': { label: 'In Progress', background: '#db2777', color: '#ffffff' },
  'hire-order-sig-ceo-only': { label: 'In Progress', background: '#eca50b', color: '#1f2937' },
  'hire-order-sig-mgr-pm': { label: 'In Progress', background: '#0a9185', color: '#ffffff' },
  'hire-order-sig-mgr-acc': { label: 'In Progress', background: '#7c3aed', color: '#ffffff' },
  'hire-order-sig-mgr-ceo': { label: 'In Progress', background: '#57534e', color: '#ffffff' },
  'hire-order-sig-pm-acc': { label: 'In Progress', background: '#1d4ed8', color: '#ffffff' },
  'hire-order-sig-pm-ceo': { label: 'In Progress', background: '#65a30d', color: '#ffffff' },
  'hire-order-sig-acc-ceo': { label: 'In Progress', background: '#be123c', color: '#ffffff' },
  'hire-order-sig-mgr-pm-acc': { label: 'In Progress', background: '#92400e', color: '#ffffff' },
  'hire-order-sig-mgr-pm-ceo': { label: 'In Progress', background: '#e40faf', color: '#ffffff' },
  'hire-order-sig-mgr-acc-ceo': { label: 'In Progress', background: '#5a6b0d', color: '#ffffff' },
  'hire-order-sig-pm-acc-ceo': { label: 'In Progress', background: '#8924db', color: '#ffffff' },
};

export const STATS_TAB = { OVERVIEW: 'overview', ANALYTICS: 'analytics', GROWTH: 'growth' };
export const STATS_GRANULARITIES = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
    { key: 'allYears', label: 'By Year' },
];
export const DEFAULT_STATS_GRANULARITY = 'month';
export const HIRE_ORDER_TAB_ITEMS = [
  { key: 'hire-order', label: 'Hire Order', children: [{ key: 'all', label: 'All' }] },
  { key: 'statistics', label: 'Statistics', children: [
    { key: STATS_TAB.OVERVIEW, label: 'Overview' },
    { key: STATS_TAB.ANALYTICS, label: 'Analytics' },
    { key: STATS_TAB.GROWTH, label: 'Growth' },
  ]},
];