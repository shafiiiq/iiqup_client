export const CATEGORIES = [
  { value: 'certificate', label: 'Certificates' },
  { value: 'inspection', label: 'Inspections' },
  { value: 'specification', label: 'Specifications' },
  { value: 'handover', label: 'Handover Documents' },
  { value: 'manual', label: 'Manuals' },
  { value: 'warranty', label: 'Warranty' },
];

export const FALLBACK_DOC_TYPES = [
  'Hand Over', 'Hook Rope Certificate', 'Rope Inspection Certificate',
  'Crane Oil Specification', 'Maintenance Certificate', 'Safety Inspection',
  'Calibration Certificate', 'Operating Manual', 'Warranty Document', 'Installation Certificate',
];

export const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']);

export const EMPTY_FORM = {
  documentType: '',
  description: '',
  uploadDate: new Date().toISOString().split('T')[0],
  category: 'certificate',
  expiry: new Date().toISOString().split('T')[0],
  date: new Date().toISOString().split('T')[0],
};

export const TAB_BTN = {
  variant: 'gradient', font: 'md', animation: '', squircle: '4xl',
  width: '50%', height: '48px', type: 'submit',
  shadowPosition: 'to-bottom', shadowColor: 'white-600',
};

export const FILE_BTN = { variant: 'gradient', font: 'lg', type: 'button', squircle: '4xl' };

export const DOCUMENT_TAB_ICONS = {
  ADD: 'IconlyPaperPlus',
  VIEW: 'FolderIcon',
};