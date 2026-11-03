import { DATE_FILTER_OPTIONS, MONTH_COUNT_OPTIONS } from '../constants/purchase.order.list.constant';

export const buildVendorOptions = (purchaseorders) =>
    [...new Set((Array.isArray(purchaseorders) ? purchaseorders : []).map((purchaseorder) => purchaseorder.company?.vendor).filter(Boolean))]
        .map((vendor) => ({ value: vendor, label: vendor }));

export const buildEquipmentTypeOptions = (purchaseorders) =>
    [...new Set((Array.isArray(purchaseorders) ? purchaseorders : []).map((purchaseorder) => purchaseorder.equipment).filter(Boolean))]
        .map((equipment) => ({ value: equipment, label: equipment }));

export const buildFilterGroups = ({ filters, vendorOptions, equipmentTypeOptions }) => [
    {
        name: 'dateFilter',
        label: 'Date Range',
        type: 'select',
        options: DATE_FILTER_OPTIONS,
    },
    ...(filters.dateFilter === 'lastXmonths' ? [{
        name: 'lastMonthsCount',
        label: 'Number of Months',
        type: 'select',
        options: MONTH_COUNT_OPTIONS,
    }] : []),
    ...(filters.dateFilter === 'custom' ? [
        { name: 'customStartDate', label: 'Start Date', type: 'date' },
        { name: 'customEndDate', label: 'End Date', type: 'date' },
    ] : []),
    {
        name: 'vendors',
        label: 'Vendors',
        type: 'checkbox',
        options: vendorOptions,
    },
    {
        name: 'equipmentTypes',
        label: 'Equipment Types',
        type: 'checkbox',
        options: equipmentTypeOptions,
    },
    {
        name: 'amountRange',
        label: 'Amount Range (QAR)',
        type: 'range',
    },
];