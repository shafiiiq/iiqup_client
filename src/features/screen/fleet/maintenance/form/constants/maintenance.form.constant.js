import OilService from '@assets/images/oil-service.png';
import NormalService from '@assets/images/normal-service.jpg';
import TyreService from '@assets/images/tyre-service.jpg';
import BatteryService from '@assets/images/battery-service.png';
import MajorWork from '@assets/images/major-service.jpg';

export const FORM_SECTIONS = {
  TYPE: 'type',
  DETAILS: 'details',
  HISTORY: 'history',
  REPORT: 'report',
  ATTACHMENTS: 'attachments',
};

export const FORM_SECTION_ORDER = [
  FORM_SECTIONS.TYPE,
  FORM_SECTIONS.DETAILS,
  FORM_SECTIONS.HISTORY,
  FORM_SECTIONS.REPORT,
  FORM_SECTIONS.ATTACHMENTS,
];

export const FORM_SECTION_LABELS = {
  [FORM_SECTIONS.TYPE]: 'Service Type',
  [FORM_SECTIONS.DETAILS]: 'Equipment Details',
  [FORM_SECTIONS.HISTORY]: 'History',
  [FORM_SECTIONS.REPORT]: 'Report',
  [FORM_SECTIONS.ATTACHMENTS]: 'Attachments',
};

export const SERVICE_TYPES = [
  { value: 'normal', label: 'Normal Service', image: NormalService },
  { value: 'oil', label: 'Oil Service', image: OilService },
  { value: 'tyre', label: 'Tyre Service', image: TyreService },
  { value: 'battery', label: 'Battery Service', image: BatteryService },
  { value: 'major', label: 'Major Works', image: MajorWork },
];

export const OIL_FILTER_OPTIONS = [
  { key: 'oil', label: 'Engine Oil', options: ['Check', 'Change'] },
  { key: 'oilFilter', label: 'Oil Filter', options: ['Check', 'Change'] },
  { key: 'fuelFilter', label: 'Fuel Filter', options: ['Check', 'Change'] },
  { key: 'acFilter', label: 'A/C Filter', options: ['Check', 'Clean'] },
  { key: 'airFilter', label: 'Air Filter', options: ['Clean', 'Change'] },
  { key: 'waterSeparator', label: 'Water Sep.', options: ['Check', 'Change'] },
];

export const OIL_SERVICE_CHECKED_ITEM_IDS = Array.from({ length: 24 }, (_, index) => index + 1);
export const TYRE_SERVICE_CHECKED_ITEM_IDS = [8, 24];
export const BATTERY_SERVICE_CHECKED_ITEM_IDS = [10];

export const FIRST_CHECKLIST_COLUMN_SIZE = 24;

export const DEFAULT_TOAST = { isOpen: false, type: 'success', message: '', textColor: '#ffffff' };

export const NEXT_SERVICE_INCREMENT = 400;
export const EQUIPMENT_AUTOFILL_DEBOUNCE_MS = 500;
export const UNASSIGNED_OPERATOR_NAMES = ['', 'not assigned', 'no operator'];
export const EQUIPMENT_SEARCH_DEBOUNCE_MS = 350;
export const ACCEPTED_ATTACHMENT_TYPES = 'image/*,video/*';

export const INPUT_PROPS = {
  labelBgColor: 'transparent',
  labelSize: '3xl',
  required: 'true',
  labelColor: 'white-300',
  colorScheme: 'primary-1000',
  borderColor: 'primary-700',
  borderWidth: '1',
  focusBorderColor: 'primary-300',
  errorBorderColor: 'error-1000',
  variant: 'gradient',
  squircle: '4xl',
  width: '100%',
  height: '57px',
  textColor: 'white-100',
  placeholderColor: 'white-300',
  fontWeight: '500',
  inputPaddingInline: '2xl',
  inputPaddingBlock: 'xl',
};

export const REMARKS_TEXTAREA_PROPS = {
  spellCheck: true,
  autoCorrect: 'on',
  autoCapitalize: 'characters',
  autoComplete: 'on',
  lang: 'en',
};

export const RADIO_BUTTON_PROPS = {
  textColor: 'black-100',
  labelBgColor: 'transparent',
  size: 'xs',
  variant: 'gradient',
  borderWidth: '2',
  onCheckedSize: 'sm',
  rounded: '4xl',
};

export const BUTTON_PROPS = {
  variant: 'gradient',
  font: 'md',
  squircle: '4xl',
  width: '80px',
  height: '45px',
  type: 'button',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};