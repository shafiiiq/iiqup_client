export const STATUS_COLORS = {
    idle: '#F59E0B',
    loading: '#df29c0',
    going: '#3B82F6',
    active: '#10B981',
    maintenance: '#EF4444',
    leased: '#6366f1'
};

export const PERIOD_OPTIONS = [
    { value: 'daily', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'weekly', label: 'Last Week' },
    { value: 'monthly', label: 'Last Month' },
    { value: 'yearly', label: 'Last Year' }
];

export const MONTH_OPTIONS = [
    { value: '1', label: '1 Month' },
    { value: '2', label: '2 Months' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' }
];

export const TAB_TREE = [
    { key: 'overview', label: 'Overview' },
    {
        key: 'mobilizations',
        label: 'Mobilizations',
        children: [
            { key: 'mobilization', label: 'Mobilization' },
            { key: 'demobilization', label: 'Demobilization' },
        ],
    },
    {
        key: 'replacements',
        label: 'Replacements',
        children: [
            { key: 'operatorReplacements', label: 'Operator Replacements' },
            { key: 'equipmentReplacements', label: 'Equipment Replacements' },
        ],
    },
    { key: 'statusChanges', label: 'Status Changes' },
];