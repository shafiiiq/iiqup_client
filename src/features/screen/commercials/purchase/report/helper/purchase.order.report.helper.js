export const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const signatoryRole = (name) => name === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)';

const SUBMITTED_WORKFLOW_STATUSES = ['purchaseorder_uploaded', 'purchaseorder_amended'];

export const resolveIsSentForApproval = (purchaseOrder) => {
  if (purchaseOrder.workflowStatus === 'purchaseorder_created') return false;
  if (!purchaseOrder.isAmendmented) return true;
  return SUBMITTED_WORKFLOW_STATUSES.includes(purchaseOrder.workflowStatus) || purchaseOrder.managerSigned === true;
};