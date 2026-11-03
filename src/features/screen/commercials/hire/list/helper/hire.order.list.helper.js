import { DATE_FILTER_OPTIONS, MONTH_COUNT_OPTIONS } from '../constants/hire.order.list.constant';

export const buildVendorOptions = (hireOrders) =>
  [...new Set((Array.isArray(hireOrders) ? hireOrders : []).map((h) => h.company?.vendor).filter(Boolean))]
    .map((vendor) => ({ value: vendor, label: vendor }));

export const buildFilterGroups = ({ filters, vendorOptions }) => [
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
    name: 'amountRange',
    label: 'Amount Range (QR)',
    type: 'range',
  },
];