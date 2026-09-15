export const COMPANY_OPTIONS = [
  { value: 'ATE', label: 'ATE' },
  { value: 'ASK', label: 'ASK' },
  { value: 'HIRED', label: 'HIRED' },
];

export const STATUS_OPTIONS_ADD = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const STATUS_OPTIONS_EDIT = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'going', label: 'Going' },
  { value: 'loading', label: 'Loading' },
  { value: 'leased', label: 'Leased' },
  { value: 'sold', label: 'Sold' },
];

export const EXPORT_COLUMN_OPTIONS = [
  { value: 'machine', label: 'Machine' },
  { value: 'regNo', label: 'Registration No' },
  { value: 'brand', label: 'Brand' },
  { value: 'year', label: 'Year' },
  { value: 'company', label: 'Company' },
  { value: 'operator', label: 'Operator' },
  { value: 'site', label: 'Site' },
  { value: 'status', label: 'Status' },
  { value: 'istimaraExpiry', label: 'Istimara Expiry' },
  { value: 'insuranceExpiry', label: 'Insurance Expiry' },
  { value: 'tpcExpiry', label: 'TPC Expiry' },
];

export const DEFAULT_EXPORT_COLUMNS = {
  machine: true, regNo: true, brand: true, year: true,
  company: true, operator: true, site: true, status: true,
  istimaraExpiry: false, insuranceExpiry: false, tpcExpiry: false,
};

export const RENT_BASIS_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'trip', label: 'Trip' },
];

export const SHIFT_OPTIONS = [
  { value: '', label: 'No Shift' },
  { value: 'Full Shift', label: 'Full Shift' },
  { value: 'Day Shift', label: 'Day Shift' },
  { value: 'Night Shift', label: 'Night Shift' },
];