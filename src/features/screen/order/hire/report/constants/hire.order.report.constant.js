export const SIGN_TYPES = ['accounts', 'pm', 'manager', 'authorized', 'seal'];

export const DEFAULT_COLUMNS = [
  { id: 'description', label: 'Item Description', type: 'text' },
  { id: 'quantity', label: 'Qty', type: 'number' },
  { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number' },
  { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated' },
];

export const DEFAULT_HIRE_ORDER_DATA = {
  vendor: '',
  date: '',
  hireOrderRef: '',
  quoteNo: '',
  attention: '',
  designation: '',
  requestText: '',
  items: [],
  columns: DEFAULT_COLUMNS,
  totalAmount: 0,
  discount: 0,
  showDiscountInTotal: false,
  totalDiscountAmount: null,
  isAmendment: false,
  termsAndConditions: [
    'Terms & Conditions',
    'Payment will be made within 90 days from the day of submission of invoice',
  ],
  signatures: {
    accountsDept: 'ACCOUNTS DEPT',
    purchasingManager: 'PURCHASING MANAGER',
    operationsManager: 'OPERATIONS MANAGER',
    authorizedSignatory: 'CEO/MD',
    authorizedSignatoryTitle: 'CEO',
  },
};

export const DEFAULT_SIGNATURE_FLAGS = {
  pmSigned: false,
  accountsSigned: false,
  managerSigned: false,
  ceoSigned: false,
};

export const DEFAULT_SIGNATURE_STATES = {
  accounts: { url: '', loading: false },
  pm: { url: '', loading: false },
  manager: { url: '', loading: false },
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

export const ROLE_LABELS = {
  PURCHASE_MANAGER: 'Purchase Manager',
  MANAGER: 'Operations Manager',
  CEO: 'CEO',
  MANAGING_DIRECTOR: 'Managing Director',
  ACCOUNTS: 'Accounts Dept',
};

export const EMAIL_FORM_FIELDS = [
  { name: 'emails', label: 'Recipient Emails (comma-separated)', type: 'text', placeholder: 'vendor@example.com, other@example.com', required: true },
];