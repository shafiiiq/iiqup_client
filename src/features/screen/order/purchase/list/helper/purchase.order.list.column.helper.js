import Button from '@/shared/components/widgets/button/Button';
import { SHARED_BTN, SIGNATURE_STATUS, DRAFT_STATUS, STATUS_LABELS } from '../constants/purchase.order.list.constant';

const getSignatureStatus = (purchaseorder, getRowClass) => {
    if (purchaseorder.workflowStatus === 'purchaseorder_created') return DRAFT_STATUS;
    return SIGNATURE_STATUS[getRowClass(purchaseorder)] ?? DRAFT_STATUS;
};

export const buildPurchaseOrderTableColumns = ({
    getRowClass,
    handleSigCellEnter,
    handleSigCellLeave,
    handleViewPurchaseOrder,
    handleDeleteClick,
    handleAmendment,
    toggleExpandRow,
}) => [
        { key: 'expand', header: '', expand: true },
        { key: 'purchaseorderRef', header: 'PurchaseOrder Ref', render: (purchaseorder) => purchaseorder.purchaseorderRef },
        { key: 'date', header: 'Date', render: (purchaseorder) => purchaseorder.date },
        { key: 'vendor', header: 'Vendor', render: (purchaseorder) => purchaseorder.company.vendor },
        { key: 'equipment', header: 'Equipment', render: (purchaseorder) => purchaseorder.equipments[0] },
        { key: 'workingHrs', header: 'Working HRS/ Running KM', render: (purchaseorder) => purchaseorder.workingHrs || purchaseorder.runningKm || 'N/A' },
        {
            key: 'description',
            header: 'Description',
            render: (purchaseorder) => {
                const items = purchaseorder.items || [];
                const extra = items.length - 1;
                return (
                    <span>
                        {items[0]?.description || '-'}
                        {extra > 0 && (
                            <span
                                style={{ marginLeft: 6, color: 'var(--color-primary-300)', cursor: 'pointer', fontSize: 12 }}
                                onClick={(e) => { e.stopPropagation(); toggleExpandRow?.(purchaseorder._id); }}
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
            render: (purchaseorder) => purchaseorder.items?.[0]?.quantity ?? '-',
            renderExpanded: (extraItem) => extraItem.quantity ?? '-',
        },
        {
            key: 'unitPrice',
            header: 'Unit Price',
            render: (purchaseorder) => (purchaseorder.items?.[0]?.unitPrice ?? 0).toFixed(2),
            renderExpanded: (extraItem) => (extraItem.unitPrice ?? 0).toFixed(2),
        },
        { key: 'complaintId', headerCenter: true, dataCenter: true, header: 'Category', render: (purchaseorder) => (purchaseorder.complaintId ? purchaseorder.complaintId : 'Regular') },
        {
            key: 'signStatus',
            header: 'Status',
            progress: true,
            headerCenter: true,
            dataCenter: true,
            render: (purchaseorder) => getSignatureStatus(purchaseorder, getRowClass),
            onProgressEnter: (purchaseorder) => handleSigCellEnter(purchaseorder),
            onProgressLeave: () => handleSigCellLeave(),
        },
        {
            key: 'amended',
            progress: true,
            headerCenter: true,
            dataCenter: true,
            header: 'Amenmend',
            render: (purchaseorder) => (purchaseorder.isAmendmented ? STATUS_LABELS.yes : STATUS_LABELS.no)
        },
        { key: 'totalAmount', header: 'Total Amount', render: (purchaseorder) => purchaseorder.totalAmount.toFixed(2) },
        {
            key: 'view',
            header: 'View',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (purchaseorder) => (
                <>
                    <Button
                        {...SHARED_BTN}
                        componentIconCenter="IconlyShow"
                        componentIconSize={30}
                        onClick={(e) => handleViewPurchaseOrder(e, purchaseorder)}
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
            render: (purchaseorder) => (
                <>
                    <Button
                        {...SHARED_BTN}
                        componentIconCenter="IconlyDelete"
                        componentIconSize={30}
                        onClick={(e) => handleDeleteClick(e, purchaseorder)}
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
            render: (purchaseorder) => (
                <>
                    <Button
                        {...SHARED_BTN}
                        componentIconCenter="IconlyPaperPlus"
                        componentIconSize={30}
                        onClick={(e) => handleAmendment(e, purchaseorder)}
                        colorScheme="yellow-800"
                        iconColor="warning-300"
                        padding='0'
                    />
                </>
            ),
        },
    ];