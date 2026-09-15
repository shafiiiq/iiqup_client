export const buildBackchargeFilterGroups = ({ filters, backcharges }) => [
    {
        name: 'dateFilter',
        label: 'Date Range',
        type: 'select',
        options: [
            { value: 'all', label: 'All Time' },
            { value: 'thismonth', label: 'This Month' },
            { value: 'lastXmonths', label: 'Last X Months' },
            { value: 'custom', label: 'Custom Range' },
        ],
    },
    ...(filters.dateFilter === 'lastXmonths' ? [{
        name: 'lastMonthsCount',
        label: 'Number of Months',
        type: 'select',
        options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
            value: n,
            label: `${n} Month${n > 1 ? 's' : ''}`,
        })),
    }] : []),
    ...(filters.dateFilter === 'custom' ? [
        { name: 'customStartDate', label: 'Start Date', type: 'date' },
        { name: 'customEndDate', label: 'End Date', type: 'date' },
    ] : []),
    {
        name: 'suppliers',
        label: 'Suppliers',
        type: 'checkbox',
        options: [...new Set(backcharges.map((item) => item.supplierName).filter(Boolean))].map((s) => ({
            value: s,
            label: s,
        })),
    },
    {
        name: 'equipmentTypes',
        label: 'Equipment Types',
        type: 'checkbox',
        options: [...new Set(backcharges.map((item) => item.equipmentType).filter(Boolean))].map((e) => ({
            value: e,
            label: e,
        })),
    },
    { name: 'costRange', label: 'Total Cost Range (QR)', type: 'range' },
];