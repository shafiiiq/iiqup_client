import { buildDefaultItem } from '../helper/hire.order.form.helper';

export const DEFAULT_REQUEST_TEXT = 'You are requested to supply the following manpower and equipment as per the agreed hire terms.';
export const DEFAULT_PAYMENT_TERMS = ['Payment will be made within 90 days from the day of submission of invoice'];

export const MIN_EDITABLE_COLUMNS = 2;

export const DEFAULT_COLUMNS = [
  { id: 'description', label: 'Item Description', type: 'text', deletable: true },
  { id: 'quantity', label: 'Qty', type: 'number', deletable: true },
  { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number', deletable: true },
  { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: false },
];

export const COLUMN_TEMPLATES = {
  DEFAULT: DEFAULT_COLUMNS,
  TUV_TPC_RENEWAL: [
    { id: 'description', label: 'Item Description', type: 'text', deletable: true },
    { id: 'validityRequired', label: 'Validity Required', type: 'text', deletable: true },
    { id: 'location', label: 'Location', type: 'text', deletable: true },
    { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: false },
  ],
  OPERATOR_TPC_TUV: [
    { id: 'operator', label: 'Operator', type: 'text', deletable: true },
    { id: 'location', label: 'Location', type: 'text', deletable: true },
    { id: 'quantity', label: 'Qty', type: 'number', deletable: true },
    { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number', deletable: true },
    { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: false },
  ],
  EQUIPMENT_HIRING_FROM_SUPPLIER: [
    { id: 'description', label: 'Item Description', type: 'text', deletable: true },
    { id: 'mobDate', label: 'Mob Date', type: 'text', deletable: true },
    { id: 'quantity', label: 'Qty', type: 'number', deletable: true },
    { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number', deletable: true },
    { id: 'remarks', label: 'Remarks', type: 'text', deletable: true },
  ],
};

export const COLUMN_TEMPLATE_LABELS = {
  DEFAULT: 'Default',
  TUV_TPC_RENEWAL: 'TUV/TPC Renewal',
  OPERATOR_TPC_TUV: 'Operator TPC/TUV',
  EQUIPMENT_HIRING_FROM_SUPPLIER: 'Equipment Hiring From Supplier',
};

export const DEFAULT_HIRE_ORDER_DATA = {
  vendor: '',
  date: new Date().toLocaleDateString('en-GB'),
  hireOrderRef: '',
  attention: '',
  designation: '',
  complaintId: '',
  quoteNo: '',
  requestText: DEFAULT_REQUEST_TEXT,
  items: [buildDefaultItem(DEFAULT_COLUMNS)],
  discount: 0,
};

export const SIGNATORY_MAP = { CEO: 'AHAMMED KAMAL', 'MANAGING DIRECTOR': 'MOHAMMED SHAHEEN' };

export const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};