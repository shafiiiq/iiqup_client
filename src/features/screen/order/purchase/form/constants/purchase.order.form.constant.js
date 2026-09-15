export const DEFAULT_REQUEST_TEXT =
    'You are requested to supply the following item for above mentioned material at the terms and conditions described below and submit your bill for settlement.';

export const DEFAULT_PAYMENT_TERMS = [
    'Payment will be made within 90 days from the day of submission of invoice',
];

export const DEFAULT_ITEM = { id: 1, description: '', quantity: null, unitPrice: null, totalPrice: 0 };

export const DEFAULT_PurchaseOrder_DATA = {
    vendor: '',
    equipments: [],
    date: new Date().toLocaleDateString('en-GB'),
    purchaseorderRef: '',
    attention: '',
    designation: '',
    complaintId: '',
    quoteNo: '',
    workingHrs: '',
    runningKm: '',
    requestText: DEFAULT_REQUEST_TEXT,
    items: [DEFAULT_ITEM],
    quotation: null,
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

export const ITEMS_PER_PAGE = 17;