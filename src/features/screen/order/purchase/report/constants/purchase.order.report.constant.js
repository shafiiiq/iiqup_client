// constants 
export const SIGN_TYPES = ['accounts', 'pm', 'manager', 'authorized', 'seal'];

export const DEFAULT_PurchaseOrder_DATA = {
    vendor: '',
    equipments: [],
    date: '',
    purchaseorderRef: '',
    jobCode: '',
    quoteNo: '',
    attention: '',
    designation: '',
    requestText: '',
    workingHrs: '',
    runningKm: '',
    items: [],
    complaintId: '',
    totalAmount: 0,
    isAmendment: false,
    totalDiscountAmount: null,
    quotation: null,
    termsAndConditions: [
        'Terms & Conditions',
        'Payment will be made within 90 days from the day of submission of invoice',
    ],
    signatures: {
        accountsDept: 'ROSHAN SHA',
        purchasingManager: 'ABDUL MALIK',
        operationsManager: 'SURESHKANTH',
        authorizedSignatory: 'AHAMMED KAMAL',
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

export const ITEMS_PER_PAGE = 26;

export const CHARS_PER_LINE = 65; 