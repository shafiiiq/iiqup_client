import { buildDefaultItem } from '../helper/quotation.form.helper';

export const DEFAULT_REQUEST_TEXT = 'You are requested to supply the following manpower and equipment as per the agreed hire terms.';

export const DEFAULT_PAYMENT_TERMS = [
  'The rate is quoted for a minimum of 10 uninterrupted hours per day and 6 days a week, even if the actual working hours of the equipment are less than 10 hours per day.',
  'We are not responsible for the shortage of work or idle time of the equipment, due to bad inclement weather.',
  'Quotation Validity: 7 days from the date of quote.',
  'Payment should be made within 30 days from the day of invoice.',
  'Delivery: Equipment will be delivered after receiving PurchaseOrder.',
  'Over time will be charged on prorate basis.',
  'All necessary documents for the equipment available.',
  'Fuel for the equipment should be arranged by the client.',
  'Any damage/ breakdown to the hired vehicle (without an operator) caused by the tenant\'s negligence will be borne by the tenant.',
  'Utilization of equipment during part of day shall be considered as full working day.',
  'Gate pass shall be arranged by the client, supporting documents will be provided by Al Ansari Transport.',
  'Work permits, Escort & Special Permission if required, shall be arranged by the client.',
  'The client shall be responsible for supervising and ensuring compliance with all site safety requirements.',
  'In view of the current security situation, the client shall ensure the safety and security of our equipment while they are at the client\'s site. Any damage or loss occurring during this period shall be covered and insured by the client.',
  'All service maintenance for the equipment will be carried out by Al Ansari Transport.',
  'At the end of each calendar month, Al Ansari Transport shall issue the client a monthly invoice.',
  'Payment is due in advance upon receipt of the Al Ansari Transport invoice, unless an alternative credit arrangement has been approved in writing by Al Ansari Transport.',
  'Any request for extension of the rental period shall be submitted to Al Ansari Transport in writing via email at least 3 days prior for daily or weekly hire, and at least 30 days prior for monthly rentals.',
  'All equipment and personnel supplied by Al Ansari Transport are insured. However, any insurance for transportation and/or cargo lifting must be arranged by the client, without recourse to Al Ansari Transport, and with a waiver of subrogation in favor of Al Ansari Transport and its subcontractors.',
  'Equipment delivery is subject to proper access and egress at the job site. Any necessary civil works or ground preparation must be completed by the client at no cost to Al Ansari Transport.',
  'All equipment must be returned in the same condition as when received, if the equipment is hired without an operator.',
  'Any concerns regarding the equipment\'s condition or non-compliance with requirements must be reported to Al Ansari Transport in writing within one day of delivery.',
  'Hire period begins from the date of delivery to your yard or worksite and continues until it\'s returned.',
  'Renewal of the rental agreement should be intimated one week a head revise quotation.',
  'Off hire notice should be mailed at least three days before the rental termination date.',
  'If there is any delay in releasing the payment beyond 10 days after the due date, Al Ansari Transport has the right to stop the Equipment work at the site without prior notice.',
  'If any dispute arises between the parties, the Terms and Conditions of Al Ansari Transport shall prevail.',
  'Client\'s Purchase order to include all Al Ansari Transport Terms & Conditions mentioned above.',
];

export const DEFAULT_NOTICE_TEXT = 'Note: Equipment hired on weekly basis will be charged for the complete first week even if the equipment returns early.';
export const DEFAULT_PRICE_STATEMENT_TEXT = 'The price we have quoted is the best according to present standards, and considering our experience in the field we offer you a smooth and timely execution of job.';
export const DEFAULT_CONTACT_TEXT = 'For any further clarifications, please feel free to contact either the Operations Manager Mr. Suresh Kanth Mob: 51700488 OR Sales Manager Mr. Sruthin Mob: 51700489.';
export const CONFIRMATION_HEADING = 'Please fill out the following details and revert to us to confirm the hire.';

export const MIN_EDITABLE_COLUMNS = 2;

export const DEFAULT_COLUMNS = [
  { id: 'description', label: 'Item Description', type: 'text', deletable: true },
  { id: 'quantity', label: 'Qty', type: 'number', deletable: true },
  { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number', deletable: true },
  { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: false },
];

export const DEFAULT_QUOTATION_DATA = {
  vendor: '',
  date: new Date().toLocaleDateString('en-GB'),
  quotationRef: '',
  attention: '',
  designation: '',
  complaintId: '',
  location: '',
  requestText: DEFAULT_REQUEST_TEXT,
  items: [buildDefaultItem(DEFAULT_COLUMNS)],
  discount: 0,
  noticeText: DEFAULT_NOTICE_TEXT,
  priceStatementText: DEFAULT_PRICE_STATEMENT_TEXT,
  contactText: DEFAULT_CONTACT_TEXT,
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