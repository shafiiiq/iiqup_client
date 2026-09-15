import OilService from '@assets/images/oil-service.png';
import NormalService from '@assets/images/normal-service.jpg';
import TyreService from '@assets/images/tyre-service.jpg';
import BatteryService from '@assets/images/battery-service.png';
import MajorWork from '@assets/images/major-service.jpg';

export const ENTRY_TABS = {
  TYPE: 'type',
  HISTORY: 'history',
  REPORT: 'report',
};

export const SERVICE_TYPES = [
  { value: 'normal', label: 'Normal Service', image: NormalService },
  { value: 'oil', label: 'Oil Service', image: OilService },
  { value: 'tyre', label: 'Tyre Service', image: TyreService },
  { value: 'battery', label: 'Battery Service', image: BatteryService },
  { value: 'major', label: 'Major Works', image: MajorWork },
];

export const DEFAULT_CHECKLIST = [
  { id: 1, description: 'Change Engine oil & Filter', status: '' },
  { id: 2, description: 'Change Fuel Filter', status: '' },
  { id: 3, description: 'Check/Clean Air Filter', status: '' },
  { id: 4, description: 'Check Transmission Filter', status: '' },
  { id: 5, description: 'Check Power Steering Oil', status: '' },
  { id: 6, description: 'Check Hydraulic Oil', status: '' },
  { id: 7, description: 'Check Brake', status: '' },
  { id: 8, description: 'Check Tyre Air Pressure', status: '' },
  { id: 9, description: 'Check Oil Leak', status: '' },
  { id: 10, description: 'Check Battery Condition', status: '' },
  { id: 11, description: 'Check Wiper & Water', status: '' },
  { id: 12, description: 'Check All Lights', status: '' },
  { id: 13, description: 'Check All Horns', status: '' },
  { id: 14, description: 'Check Parking Brake', status: '' },
  { id: 15, description: 'Check Differential Oil', status: '' },
  { id: 16, description: 'Check Rod Water & Hoses', status: '' },
  { id: 17, description: 'Lubricants All Points', status: '' },
  { id: 18, description: 'Check Gear Shift System', status: '' },
  { id: 19, description: 'Check Clutch System', status: '' },
  { id: 20, description: 'Check Wheel Nut', status: '' },
  { id: 21, description: 'Check Starter & Alternator', status: '' },
  { id: 22, description: 'Check Number Plate both', status: '' },
  { id: 23, description: 'Check Paint', status: '' },
  { id: 24, description: 'Check Tires', status: '' },
  { id: 25, description: 'Check Silencer', status: '' },
  { id: 26, description: 'Replace Hydraulic Oil- Filter', status: '' },
  { id: 27, description: 'Replace Transmission Oil', status: '' },
  { id: 28, description: 'Replace Differential Oil', status: '' },
  { id: 29, description: 'Replace Steering Box Oil', status: '' },
  { id: 30, description: 'Check Engine Valve Clearence', status: '' },
  { id: 31, description: 'Replace clutch fluid', status: '' },
  { id: 32, description: 'Check Brake Lining', status: '' },
  { id: 33, description: 'Change Drive Belt', status: '' },
  { id: 34, description: 'Check A/C filter', status: '' },
  { id: 35, description: 'Check Water Seperator', status: '' },
];

export const DEFAULT_TOAST = { isOpen: false, type: 'success', message: '', textColor: '#ffffff' };

export const NEXT_SERVICE_INCREMENT = 400;

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