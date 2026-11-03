export const PURCHASE_ORDER_SIGNATURE_SOURCE_KEY = 'purchase_order';

export const PURCHASE_ORDER_PDF_SOURCE_KEY = 'purchase_order';

export const PURCHASE_ORDER_SIGNATURE_SLOT_ID = {
    OPERATIONS_MANAGER: 'operations_manager',
    PURCHASE_MANAGER: 'purchase_manager',
    ACCOUNTS: 'accounts',
    AUTHORIZED_SIGNATORY: 'authorized_signatory',
};

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