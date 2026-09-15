import Button from '@/shared/components/widgets/button/Button';
import { SHARED_BTN, SIGNATURE_STATUS, DRAFT_STATUS, STATUS_LABELS } from '../constants/hire.order.list.constant';

const getSignatureStatus = (hireOrder, getRowClass) => {
  if (hireOrder.workflowStatus === 'hire_order_created') return DRAFT_STATUS;
  return SIGNATURE_STATUS[getRowClass(hireOrder)] ?? DRAFT_STATUS;
};

export const buildHireOrderTableColumns = ({
  getRowClass,
  handleSigCellEnter,
  handleSigCellLeave,
  handleViewHireOrder,
  handleDeleteClick,
  handleAmendment,
  toggleExpandRow,
}) => [
    { key: 'expand', header: '', expand: true },
    { key: 'hireOrderRef', header: 'Hire Order Ref', render: (h) => h.hireOrderRef },
    { key: 'date', header: 'Date', render: (h) => h.date },
    { key: 'vendor', header: 'Vendor', render: (h) => h.company?.vendor },
    {
      key: 'description',
      header: 'Description',
      render: (h) => {
        const items = h.items || [];
        const extra = items.length - 1;
        return (
          <span>
            {items[0]?.description || '-'}
            {extra > 0 && (
              <span
                style={{ marginLeft: 6, color: 'var(--color-primary-500, #0066cc)', cursor: 'pointer', fontSize: 12 }}
                onClick={(e) => { e.stopPropagation(); toggleExpandRow?.(h._id); }}
              >
                +{extra} more
              </span>
            )}
          </span>
        );
      },
      renderExpanded: (extraItem) => extraItem.description,
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (h) => h.items?.[0]?.quantity ?? '-',
      renderExpanded: (extraItem) => extraItem.quantity ?? '-',
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      render: (h) => (h.items?.[0]?.unitPrice ?? 0).toFixed(2),
      renderExpanded: (extraItem) => (extraItem.unitPrice ?? 0).toFixed(2),
    },
    { key: 'complaintId', headerCenter: true, dataCenter: true, header: 'Category', render: (h) => (h.complaintId ? h.complaintId : 'Regular') },
    {
      key: 'signStatus',
      header: 'Status',
      progress: true,
      headerCenter: true,
      dataCenter: true,
      render: (h) => getSignatureStatus(h, getRowClass),
      onProgressEnter: (h) => handleSigCellEnter(h),
      onProgressLeave: () => handleSigCellLeave(),
    },
    {
      key: 'amended',
      progress: true,
      headerCenter: true,
      dataCenter: true,
      header: 'Amended',
      render: (h) => (h.isAmendmented ? STATUS_LABELS.yes : STATUS_LABELS.no)
    },
    { key: 'totalAmount', header: 'Total Amount', render: (h) => (h.totalAmount ?? 0).toFixed(2) },
    {
      key: 'view',
      header: 'View',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      render: (h) => (
        <Button
          {...SHARED_BTN}
          componentIconCenter="IconlyShow"
          componentIconSize={30}
          onClick={(e) => handleViewHireOrder(e, h)}
          colorScheme="yellow-800"
          iconColor="info-300"
          padding='0'
        />
      ),
    },
    {
      key: 'delete',
      header: 'Delete',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      render: (h) => (
        <Button
          {...SHARED_BTN}
          componentIconCenter="IconlyDelete"
          componentIconSize={30}
          onClick={(e) => handleDeleteClick(e, h)}
          colorScheme="yellow-800"
          iconColor="error-500"
          padding='0'
        />
      ),
    },
    {
      key: 'amend',
      header: 'Amend',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      render: (h) => (
        <Button
          {...SHARED_BTN}
          componentIconCenter="IconlyPaperPlus"
          componentIconSize={30}
          onClick={(e) => handleAmendment(e, h)}
          colorScheme="yellow-800"
          iconColor="warning-300"
          padding='0'
        />
      ),
    },
  ];