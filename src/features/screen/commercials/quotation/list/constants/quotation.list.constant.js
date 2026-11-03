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

export const STATUS_LABELS = {
  draft: { label: 'Draft', background: 'var(--hover-bg)', color: 'var(--text-color)' },
  sent: { label: 'Sent', background: '#3cbe15', color: '#ffffff' },
  yes: { label: 'Yes', background: '#20620c', color: '#ffffff' },
  no: { label: 'No', background: '#681111', color: '#ffffff' },
};

export const SIGNATURE_STATUS_LABELS = {
  signed: { label: 'Signed', background: '#3cbe15', color: '#ffffff' },
  unsigned: { label: 'Unsigned', background: '#f52a2a', color: '#ffffff' },
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
export const QUOTATION_TAB_ITEMS = [
  { key: 'quotation', label: 'Quotation', children: [{ key: 'all', label: 'All' }] },
  { key: 'statistics', label: 'Statistics', children: [
    { key: STATS_TAB.OVERVIEW, label: 'Overview' },
    { key: STATS_TAB.ANALYTICS, label: 'Analytics' },
    { key: STATS_TAB.GROWTH, label: 'Growth' },
  ]},
];