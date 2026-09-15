import { PERIOD_OPTIONS } from './maintenance.record.constant';

export const buildRecordPeriodNavItems = () => [
  ...PERIOD_OPTIONS.map((option) => ({ key: option.value, label: option.label })),
  { key: 'months', label: 'Last N Months' },
  { key: 'custom', label: 'Custom Range' },
];