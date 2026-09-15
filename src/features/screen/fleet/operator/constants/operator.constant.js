export const NATIONALITY_OPTIONS   = ['INDIAN', 'NEPALI', 'BANGLADESHI', 'PAKISTANI', 'SRI LANKAN', 'OTHER'];
export const SPONSORSHIP_OPTIONS   = ['ATE', 'ASK', 'HIRED'];
export const WORKING_IN_OPTIONS    = ['ATE', 'SITE', 'OFFICE', 'ASK'];
export const LICENCE_TYPE_OPTIONS  = ['Loader', 'Car', 'Bus', 'Med. Truck', 'Heavy Truck', 'Crane', 'Forklift'];

export const WORKMEN_COMPENSATION_OPTIONS = [
  { label: 'No', value: 'no' },
  { label: 'Yes', value: 'yes' },
];

export const EMPTY_FORM = {
  name:                     '',
  userType:                 'operator',
  nationality:              'INDIAN',
  sponsorship:              'ATE',
  workingIn:                'ATE',
  doj:                      '',
  passportNo:               '',
  passportExpiry:           '',
  qatarId:                  '',
  qidExpiry:                '',
  healthCardExpiry:         '',
  licenceType:              '',
  licenceExpiry:            '',
  labourContractExpiry:     '',
  workmenCompensationAdded: 'no',
  contactNo:                '',
  dob:                      '',
  email:                    '',
  password:                 '',
  equipmentNumber:          '',
  isVerified:               false,
  toolkits:                 [],
  hired:                    false,
  hiredFrom:                '',
};

export const SHARED_BUTTON = {
  variant: 'gradient', font: 'md', animation: '', squircle: '4xl',
  width: 'fit-content', height: '38px', type: 'submit',
  shadowPosition: 'to-bottom', shadowColor: 'white-600',
};

export const OPERATOR_TABS = {
  OWN: 'own',
  HIRED: 'hired',
  MOBILIZED: 'mobilized',
  DEMOBILIZED: 'demobilized',
};

export const OPERATOR_NAV_TREE = [
  { key: OPERATOR_TABS.OWN, label: 'Own Operator' },
  { key: OPERATOR_TABS.HIRED, label: 'Hired Operator' },
  { key: OPERATOR_TABS.MOBILIZED, label: 'Mobilized Operator' },
  { key: OPERATOR_TABS.DEMOBILIZED, label: 'Demobilized' },
];

export const TABLE_COLUMNS = [
  ['name',            'Name'          ],
  ['qatarId',         'Qatar ID'      ],
  ['uniqueCode',      'Unique Code'   ],
  ['nationality',     'Nationality'   ],
  ['sponsorship',     'Sponsorship'   ],
  ['equipmentNumber', 'Equipment No'  ],
];

export const VERIFICATION_STATUS_LABELS = {
  active:   { label: 'Active',   background: '#3cbe15',       color: '#ffffff' },
  expired:  { label: 'Expired',  background: '#681111',       color: '#ffffff' },
  pending:  { label: 'Pending',  background: 'var(--hover-bg)', color: 'var(--text-color)' },
};

export const MOBILIZATION_STATUS_LABELS = {
  mobilized:   { label: 'Mobilized',   background: '#3cbe15', color: '#ffffff' },
  demobilized: { label: 'Demobilized', background: '#681111', color: '#ffffff' },
};

export const DEPLOY_TYPE_OPTIONS = [
  { value: 'site', label: 'Site' },
  { value: 'company', label: 'Client Company (Lease)' },
];

export const SHIFT_OPTIONS = [
  { value: '', label: 'No Shift' },
  { value: 'Full Shift', label: 'Full Shift' },
  { value: 'Day Shift', label: 'Day Shift' },
  { value: 'Night Shift', label: 'Night Shift' },
];

export const RENT_BASIS_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'trip', label: 'Trip' },
];

export const DESIGNATION_OPTIONS = ['Operator', 'Driver', 'Helper', 'Rigger', 'Foreman', 'Supervisor'];

export const MOBILIZE_FORM_DEFAULTS = {
  deployType: 'site',
  regNo: '',
  site: '',
  clientCompany: '',
  shiftName: '',
  designation: '',
  rentRate: { basis: 'daily', rate: '' },
  'rentRate.basis': 'daily',
  'rentRate.rate': '',
  remarks: '',
};

export const DEMOBILIZE_FORM_DEFAULTS = {
  remarks: '',
};

export const OPERATOR_LIST_PAGE_SIZE = 50;
export const OPERATOR_SCROLL_DEBOUNCE_MS = 200;
export const OPERATOR_SCROLL_BOTTOM_OFFSET_PX = 500;