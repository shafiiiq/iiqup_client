export const BUTTON_PROPS = {
  variant:        'gradient',
  font:           'md',
  animation:      '',
  squircle:       '4xl',
  height:         '38px',
  textColor:      'white-200',
  shadowPosition: 'to-bottom',
  shadowColor:    'white-600',
  width:          '100%',
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

export const SERVICE_TYPES_WITH_HOURS_TRACKING = new Set(['oil', 'normal', 'major', 'tyre', 'battery']);

export const isOilOrNormalService = (serviceType) => serviceType === 'oil' || serviceType === 'normal';

export const MAINTENANCE_HISTORY_TABS = {
  ALL: 'all',
  NORMAL: 'normal',
  OIL: 'oil',
  MAJOR: 'major',
  TYRE: 'tyre',
  BATTERY: 'battery',
};

export const MAINTENANCE_HISTORY_PAGE_SIZE = 30;
export const MAINTENANCE_HISTORY_SCROLL_BOTTOM_OFFSET_PX = 500;
export const MAINTENANCE_HISTORY_SCROLL_DEBOUNCE_MS = 200;

export const MAINTENANCE_HISTORY_DEFAULT_TAB_COUNTS = {
  total: 0,
  oil: 0,
  normal: 0,
  tyre: 0,
  battery: 0,
  major: 0,
};