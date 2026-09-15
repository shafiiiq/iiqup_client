import Button from '@/shared/components/widgets/button/Button';
import { SHARED_BTN, STATUS_LABELS, SIGNATURE_STATUS_LABELS } from '../constants/quotation.list.constant';

export const buildQuotationTableColumns = ({ handleViewQuotation, handleDeleteClick, handleAmendment, toggleExpandRow }) => [
  { key: 'expand', header: '', expand: true },
  { key: 'quotationRef', header: 'Quotation Ref', render: (q) => q.quotationRef },
  { key: 'date', header: 'Date', render: (q) => q.date },
  { key: 'vendor', header: 'Vendor', render: (q) => q.company?.vendor },
  { key: 'quoteNo', header: 'Ref No', render: (q) => q.quoteNo },
  {
    key: 'description',
    header: 'Description',
    render: (q) => {
      const items = q.items || [];
      const extra = items.length - 1;
      return (
        <span>
          {items[0]?.description || '-'}
          {extra > 0 && (
            <span
              style={{ marginLeft: 6, color: 'var(--color-primary-300)', cursor: 'pointer', fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); toggleExpandRow?.(q._id); }}
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
    render: (q) => q.items?.[0]?.quantity ?? '-',
    renderExpanded: (extraItem) => extraItem.quantity ?? '-',
  },
  {
    key: 'unitPrice',
    header: 'Unit Price',
    render: (q) => (q.items?.[0]?.unitPrice ?? 0).toFixed(2),
    renderExpanded: (extraItem) => (extraItem.unitPrice ?? 0).toFixed(2),
  },
  {
    key: 'status',
    header: 'Status',
    progress: true,
    headerCenter: true,
    dataCenter: true,
    render: (q) => STATUS_LABELS[q.status] ?? STATUS_LABELS.draft,
  },
  {
    key: 'signature',
    header: 'Signature',
    progress: true,
    headerCenter: true,
    dataCenter: true,
    render: (q) => (q.authorizedSigned ? SIGNATURE_STATUS_LABELS.signed : SIGNATURE_STATUS_LABELS.unsigned),
  },
  {
    key: 'amended',
    header: 'Amended',
    headerCenter: true,
    dataCenter: true,
    progress: true,
    render: (q) => (q.isAmendmented ? STATUS_LABELS.yes : STATUS_LABELS.no)
  },
  { key: 'totalAmount', header: 'Total Amount', render: (q) => (q.totalAmount ?? 0).toFixed(2) },
  {
    key: 'view',
    header: 'View',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    render: (q) => (
      <>
        <Button
          {...SHARED_BTN}
          componentIconCenter="IconlyShow"
          componentIconSize={30}
          onClick={(e) => handleViewQuotation(e, q)}
          colorScheme="yellow-800"
          iconColor="info-300"
          padding='0'
        />
      </>
    ),
  },
  {
    key: 'delete',
    header: 'Delete',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    render: (q) => (
      <>
        <Button
          {...SHARED_BTN}
          componentIconCenter="IconlyDelete"
          componentIconSize={30}
          onClick={(e) => handleDeleteClick(e, q)}
          colorScheme="yellow-800"
          iconColor="error-500"
          padding='0'
        />
      </>
    ),
  },
  {
    key: 'amend',
    header: 'Amend',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    render: (q) => (
      <>
        <Button
          {...SHARED_BTN}
          componentIconCenter="IconlyPaperPlus"
          componentIconSize={30}
          onClick={(e) => handleAmendment(e, q)}
          colorScheme="yellow-800"
          iconColor="warning-300"
          padding='0'
        />
      </>
    ),
  },
];