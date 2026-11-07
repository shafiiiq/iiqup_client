export const BUTTON_PROPS = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
  width: '100%',
};

export const ACTION_BUTTON_PROPS = {
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

export const MAINTENANCE_LIST_TABS = {
  ALL: 'all',
  NORMAL: 'normal',
  OIL: 'oil',
  MAJOR: 'major',
  TYRE: 'tyre',
  BATTERY: 'battery',
};

export const MAINTENANCE_LIST_SIGNATURE_ALL_EQUIPMENT_DOCUMENT_ID = 'all-equipment';

export const MAINTENANCE_LIST_PAGE_SIZE = 30;
export const MAINTENANCE_LIST_SCROLL_BOTTOM_OFFSET_PX = 500;
export const MAINTENANCE_LIST_SCROLL_DEBOUNCE_MS = 200;

export const MAINTENANCE_LIST_DEFAULT_TAB_COUNTS = {
  total: 0,
  oil: 0,
  normal: 0,
  tyre: 0,
  battery: 0,
  major: 0,
};

export const DEFAULT_DATE_RANGE_FILTER = {
  dateFilterMode: 'all',
  lastMonthsCount: 6,
  customStartDate: '',
  customEndDate: '',
};

export const DATE_RANGE_LABELS = {
  all: 'All Time',
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 Days',
  last30days: 'Last 30 Days',
  last365days: 'Last 365 Days',
  thisMonth: 'This Month',
};

export const DATE_RANGE_FILE_NAME_SUFFIXES = {
  today: '_Today',
  yesterday: '_Yesterday',
  last7days: '_Last_7_Days',
  last30days: '_Last_30_Days',
  last365days: '_Last_365_Days',
  thisMonth: '_This_Month',
};

export const MAINTENANCE_LIST_FILTER_FIELDS = [
  {
    name: 'dateFilterMode',
    label: 'Date Range',
    type: 'select',
    options: [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'last7days', label: 'Last 7 Days' },
      { value: 'last30days', label: 'Last 30 Days' },
      { value: 'last365days', label: 'Last 365 Days' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'lastXmonths', label: 'Last N Months' },
      { value: 'custom', label: 'Custom Range' },
    ],
  },
  {
    name: 'lastMonthsCount',
    label: 'Number of Months',
    type: 'number',
    visibleWhen: (values) => values.dateFilterMode === 'lastXmonths',
  },
  {
    name: 'customStartDate',
    label: 'Start Date',
    type: 'date',
    visibleWhen: (values) => values.dateFilterMode === 'custom',
  },
  {
    name: 'customEndDate',
    label: 'End Date',
    type: 'date',
    visibleWhen: (values) => values.dateFilterMode === 'custom',
  },
];