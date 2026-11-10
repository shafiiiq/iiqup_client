import { DEFAULT_COLUMNS, DEFAULT_HIRE_ORDER_DATA } from '../constants/hire.order.report.constant';

export const buildOriginalHireOrderDocument = (hireOrder) => ({
  vendor: hireOrder.company?.vendor || '',
  date: hireOrder.date || '',
  hireOrderRef: hireOrder.hireOrderRef || '',
  quoteNo: hireOrder.quoteNo || '',
  customFields: hireOrder.customFields || [],
  showTotalRow: hireOrder.showTotalRow ?? true,
  attention: hireOrder.company?.attention || '',
  designation: hireOrder.company?.designation || '',
  requestText: hireOrder.requestText || '',
  items: hireOrder.items || [],
  columns: hireOrder.columns?.length ? hireOrder.columns : DEFAULT_COLUMNS,
  totalAmount: hireOrder.totalAmount || 0,
  discount: hireOrder.discount || 0,
  showDiscountInTotal: hireOrder.showDiscountInTotal ?? false,
  totalDiscountAmount: hireOrder.totalDiscountAmount ?? null,
  isAmendment: false,
  termsAndConditions: hireOrder.termsAndConditions || DEFAULT_HIRE_ORDER_DATA.termsAndConditions,
  signatures: hireOrder.signatures || DEFAULT_HIRE_ORDER_DATA.signatures,
});

export const buildAmendedHireOrderDocument = (hireOrder, originalDocument, amendmentNumber) => {
  const amendment = hireOrder.amendments[amendmentNumber - 1];

  return {
    ...originalDocument,
    vendor: amendment.amendedCompany?.vendor || originalDocument.vendor,
    attention: amendment.amendedCompany?.attention || originalDocument.attention,
    designation: amendment.amendedCompany?.designation || originalDocument.designation,
    quoteNo: amendment.amendedQuoteNo || originalDocument.quoteNo,
    customFields: amendment.amendedCustomFields?.length ? amendment.amendedCustomFields : originalDocument.customFields,
    showTotalRow: amendment.amendedShowTotalRow ?? originalDocument.showTotalRow,
    requestText: amendment.amendedRequestText || originalDocument.requestText,
    items: amendment.amendedItems?.length ? amendment.amendedItems : originalDocument.items,
    columns: amendment.amendedColumns?.length ? amendment.amendedColumns : originalDocument.columns,
    totalAmount: amendment.amendedTotalAmount ?? originalDocument.totalAmount,
    discount: amendment.amendedDiscount ?? originalDocument.discount,
    totalDiscountAmount: amendment.amendedDiscount ? amendment.amendedTotalAmount : null,
    termsAndConditions: amendment.amendedTermsAndConditions?.length
      ? amendment.amendedTermsAndConditions
      : originalDocument.termsAndConditions,
    isAmendment: true,
    amendmentDate: new Date(amendment.amendmentDate).toLocaleDateString('en-GB'),
    amendmentNumber,
  };
};