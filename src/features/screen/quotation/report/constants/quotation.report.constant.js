export const DEFAULT_COLUMNS = [
  { id: 'description', label: 'Item Description', type: 'text' },
  { id: 'quantity', label: 'Qty', type: 'number' },
  { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number' },
  { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated' },
];

export const DEFAULT_QUOTATION_DATA = {
  vendor: '',
  date: '',
  quotationRef: '',
  attention: '',
  designation: '',
  location: '',
  customFields: [],
  requestText: '',
  noticeText: '',
  priceStatementText: '',
  contactText: '',
  items: [],
  columns: DEFAULT_COLUMNS,
  totalAmount: 0,
  discount: 0,
  showDiscountInTotal: true,
  termsAndConditions: [],
  signatures: { authorizedSignatory: 'AHAMMED KAMAL', authorizedSignatoryTitle: 'CEO' },
};

export const SIGN_TYPES = ['authorized', 'seal'];

export const DEFAULT_SIGNATURE_FLAGS = {
  authorizedSigned: false,
};

export const DEFAULT_SIGNATURE_STATES = {
  authorized: { url: '', loading: false },
  seal: { url: '', loading: false },
};

export const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  width: '160px',
  type: 'submit',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};

export const CONFIRMATION_HEADING = 'Please fill out the following details and revert to us to confirm the hire.';