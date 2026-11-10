import { DEFAULT_PurchaseOrder_DATA } from '../constants/purchase.order.report.constant';

export const buildOriginalPurchaseOrderDocument = (purchaseOrder) => ({
  vendor: purchaseOrder.company?.vendor || '',
  equipments: purchaseOrder.equipments || [],
  date: purchaseOrder.date || '',
  purchaseorderRef: purchaseOrder.purchaseorderRef || '',
  quoteNo: purchaseOrder.quoteNo || '',
  attention: purchaseOrder.company?.attention || '',
  designation: purchaseOrder.company?.designation || '',
  workingHrs: purchaseOrder.workingHrs || '',
  runningKm: purchaseOrder.runningKm || '',
  requestText: purchaseOrder.requestText || '',
  items: purchaseOrder.items || [],
  totalAmount: purchaseOrder.totalAmount || 0,
  isAmendment: false,
  totalDiscountAmount: purchaseOrder.totalDiscountAmount || null,
  termsAndConditions: purchaseOrder.termsAndConditions || DEFAULT_PurchaseOrder_DATA.termsAndConditions,
  signatures: purchaseOrder.signatures || DEFAULT_PurchaseOrder_DATA.signatures,
  quotation: purchaseOrder.quotation || null,
});

export const buildAmendedPurchaseOrderDocument = (purchaseOrder, originalDocument, amendmentNumber) => {
  const amendment = purchaseOrder.amendments[amendmentNumber - 1];

  return {
    ...originalDocument,
    vendor: amendment.amendedCompany?.vendor || originalDocument.vendor,
    equipments: amendment.amendedEquipments?.length ? amendment.amendedEquipments : originalDocument.equipments,
    quoteNo: amendment.amendedQuoteNo || originalDocument.quoteNo,
    attention: amendment.amendedCompany?.attention || originalDocument.attention,
    designation: amendment.amendedCompany?.designation || originalDocument.designation,
    workingHrs: amendment.amendedWorkingHrs ?? originalDocument.workingHrs,
    runningKm: amendment.amendedRunningKm ?? originalDocument.runningKm,
    requestText: amendment.amendedRequestText || originalDocument.requestText,
    items: amendment.amendedItems?.length ? amendment.amendedItems : originalDocument.items,
    totalAmount: amendment.amendedTotalAmount ?? originalDocument.totalAmount,
    totalDiscountAmount: amendment.amendedDiscount ? amendment.amendedTotalAmount : null,
    termsAndConditions: amendment.amendedTermsAndConditions?.length
      ? amendment.amendedTermsAndConditions
      : originalDocument.termsAndConditions,
    isAmendment: true,
    amendmentDate: new Date(amendment.amendmentDate).toLocaleDateString('en-GB'),
    amendmentNumber,
    amendmentReason: amendment.reason || 'Amendment requested',
  };
};