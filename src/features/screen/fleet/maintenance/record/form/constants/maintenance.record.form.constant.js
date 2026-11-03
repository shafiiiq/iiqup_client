import { FORM_SECTIONS, FORM_SECTION_LABELS } from '../../../form/constants/maintenance.form.constant';

export const RECORD_FORM_SECTIONS = {
  EQUIPMENT: 'equipment',
  ...FORM_SECTIONS,
};

export const RECORD_FORM_SECTION_ORDER = [
  RECORD_FORM_SECTIONS.EQUIPMENT,
  FORM_SECTIONS.TYPE,
  FORM_SECTIONS.DETAILS,
  FORM_SECTIONS.HISTORY,
  FORM_SECTIONS.REPORT,
  FORM_SECTIONS.ATTACHMENTS,
];

export const RECORD_FORM_SECTION_LABELS = {
  [RECORD_FORM_SECTIONS.EQUIPMENT]: 'Select Equipment',
  ...FORM_SECTION_LABELS,
};

export const RECORD_SUBMIT_STATUS = {
  IDLE: 'idle',
  SUCCESS: 'success',
  FAILED: 'failed',
};

export const INITIAL_CARDS_COUNT = 2;

export const RECORD_TAB_CONTROL_BUTTON_PROPS = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
  width: '100%',
};