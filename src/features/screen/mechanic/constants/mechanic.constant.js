import { LayoutGrid, Wrench, CalendarCheck, Users } from 'lucide-react';

export const OVERVIEW_ACTIVITY_LIMIT = 20;
export const ATTENDANCE_PAGE_LIMIT = 20;
export const DEFAULT_ATTENDANCE_FILTER = 'weekly';

export const ATTENDANCE_FILTER_OPTIONS = [
    { value: 'daily', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
    { value: 'date-range', label: 'Date Range' },
    { value: 'all', label: 'All Records' },
];

export const buildMechanicTreeItems = (mechanics = []) => [
    { key: 'overview', label: 'Overview', icon: LayoutGrid },
    {
        key: 'mechanics',
        label: 'Mechanics',
        icon: Users,
        children: mechanics.map((m) => ({
            key: m._id,
            label: m.name,
            selectOnClick: 'details',
            children: [
                { key: 'details', label: 'Details', icon: LayoutGrid },
                { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
                { key: 'toolkits', label: `Toolkits (${m.toolkits?.length || 0})`, icon: Wrench },
            ],
        })),
    },
];

export const PROFILE_BUTTON_PROPS = {
    variant: 'gradient',
    font: 'md',
    squircle: '4xl',
    width: '140px',
    height: '38px',
    textColor: 'white-200',
    shadowPosition: 'to-bottom',
    shadowColor: 'white-600',
};

export const DATE_RANGE_INPUT_PROPS = {
    type: 'date',
    colorScheme: 'yellow-300',
    variant: 'gradient',
    squircle: '4xl',
    width: '200px',
    height: '44px',
    textColor: 'black-100',
    placeholderColor: 'black-300',
    fontWeight: '500',
    inputPaddingInline: 'xl',
};

export const ATTENDANCE_FILTER_SELECT_PROPS = {
    type: 'select',
    colorScheme: 'lime-500',
    variant: 'gradient',
    font: 'md',
    squircle: '4xl',
    width: '150px',
    height: '44px',
    textColor: 'black-200',
    shadowPosition: 'to-bottom',
    shadowColor: 'black-600',
    fontWeight: '500',
    inputPaddingInline: 'xl',
};

export const PAGER_BUTTON_PROPS = {
    variant: 'gradient',
    font: 'md',
    squircle: 'xl',
    width: '90px',
    height: '36px',
    textColor: 'black-200',
    colorScheme: 'lime-500',
    shadowPosition: 'to-bottom',
    shadowColor: 'white-600',
};