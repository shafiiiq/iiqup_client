export const DOCUMENT_UPLOAD_FEATURE = 'documents';

export const DRAGGED_DOCUMENT_TYPE = 'application/x-document-id';

export const DOCUMENT_TOOLBAR_ICONS = {
  newFolder: 'IconlyPlus',
  view: "IconlyShow",
  download: 'IconlyDownload',
  dates: "IconlyCalendar",
  rename: "RenameIcon",
  renew: "ReviewDocumentIcon",
  split: "SplitIcon",
  merge: "MergeIcon",
  cut: "ScissorsIcon",
  copy: "CopyIcon",
  paste: "PasteIcon",
  delete: "IconlyDelete",
};

export const buildDocumentKeyPrefix = (sourceType, sourceId) => `documents/${sourceType}/${sourceId}`;

export const RENEWAL_STATUS = {
  NONE: 'none',
  RENEWED: 'renewed',
  EXPIRED: 'expired',
};

export const DOCUMENT_VIEWS = {
  ALL: 'all',
  RENEWED: 'renewed',
  EXPIRED: 'expired',
};

export const DOCUMENT_VIEW_TABS = [
  { key: DOCUMENT_VIEWS.ALL, label: 'All Documents', iconName: 'MutipleFilesIcon' },
  { key: DOCUMENT_VIEWS.RENEWED, label: 'Renewed Documents', iconName: 'IconlyFolder' },
  { key: DOCUMENT_VIEWS.EXPIRED, label: 'Expired Documents', iconName: 'IconlyFolder' },
];

export const IMAGE_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

export const ACCEPTED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', ...IMAGE_FILE_EXTENSIONS];

export const DOCUMENT_URL_REFRESH_INTERVAL_MILLISECONDS = 50 * 60 * 1000;

export const TOOLBAR_BUTTON_PROPS = {
  variant: 'gradient',
  font: 'lg',
  type: 'button',
  squircle: '4xl',
  width: 'fit-content',
  height: '40px',
};

export const DIALOG_BUTTON_PROPS = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  width: '160px',
  height: '44px',
  textColor: 'white-100',
};

export const EMPTY_STATE_MESSAGES = {
  [DOCUMENT_VIEWS.ALL]: 'Drag and drop files here, or copy files and paste them here to upload.',
  [DOCUMENT_VIEWS.RENEWED]: 'No renewed documents yet. Right click a document and choose Renew Document.',
  [DOCUMENT_VIEWS.EXPIRED]: 'No expired documents yet. Documents move here when they are renewed.',
};