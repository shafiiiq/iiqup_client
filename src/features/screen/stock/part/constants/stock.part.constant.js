export const STOCK_BTN = {
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

export const DEFAULT_REDUCE_FORM_DATA = {
  stockCount: '',
  equipmentName: '',
  equipmentNumber: '',
  mechanicName: '',
  reduceType: 'stock',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const DEFAULT_ADD_FORM_DATA = {
  stockCount: '',
  reason: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const DEFAULT_STOCK_FORM_DATA = {
  type: 'stock',
  equipments: [],
  product: '',
  serialNumber: '',
  date: new Date().toISOString().split('T')[0],
  rate: '',
  stockCount: '',
  hasSubUnits: false,
  subUnitName: '',
  subUnitCapacity: '',
};

export const ADD_STOCK_FORM_FIELDS = [
  { name: 'stockCount', label: 'Quantity to Add', type: 'number', placeholder: 'Enter quantity to add', required: true },
  { name: 'reason', label: 'Reason', type: 'text', placeholder: 'Enter reason', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
];

export const STOCK_TYPE_OPTIONS = [
  { value: 'stock', label: 'For Stock' },
  { value: 'specific-equipment', label: 'For Specific Equipment' },
  { value: 'equipment', label: 'For Equipment' },
  { value: 'all', label: 'For All Machines' },
];

export const HAS_SUB_UNITS_OPTIONS = [
  { value: false, label: 'No' },
  { value: true, label: 'Yes' },
];