export const DOCUMENT_UPLOAD_FEATURE = 'documents';

export const DRAGGED_DOCUMENT_TYPE = 'application/x-document-id';

export const DOCUMENT_TOOLBAR_ICONS = {
  newFolder: 'NewFolderIcon',
  hint: 'KeyBoardIcon',
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
  delete: "TrashIcon",
  deletePermanently: "IconlyDelete",
  compress: "CompressIcon",
  extract: "ZipIcon",
  restore: "RestoreTrashIcon",
  emptyTrash: "EmptyTrashIcon",
  trash: "TrashIcon",
  undo: 'UndoIcon',
  redo: 'RedoIcon',
  editPdf: 'EditFileIcon',
  pdfToWord: 'ToWordIcon',
  wordToPdf: 'ToPdfIcon',
  imagesToPdf: 'ImageToPdfIcon',
  pdfToImages: 'PdfToImageIcon',
  exportCopy: 'CopyToComputerIcon',
  exportMove: 'MoveToComputerIcon',
  uploadFiles: 'FileUploadIcon',
  uploadFolder: 'FolderUploadIcon',
  selectMultiple: 'SelectMultipleIcon',
  newWindow: 'NewWindowIcon',
  duplicateWindow: 'DuplicateWindowIcon',
  closeWindow: 'CloseWindowIcon',
  closeRightWindows: 'CloseRightWindowsIcon',
  closeLeftWindows: 'CloseLeftWindowsIcon',
  reopenWindow: 'RedoWindowIcon',
  reopenRightWindows: 'RedoClosedRightWindowsIcon',
  reopenLeftWindows: 'RedoClosedLeftWindowsIcon',
};

export const DOCUMENT_MENU_CATEGORIES = [
  {
    key: 'file',
    label: 'File',
    items: [
      { key: 'newFolder', label: 'New Folder' },
      { key: 'uploadFiles', label: 'Upload Files' },
      { key: 'uploadFolder', label: 'Upload Folder' },
      { key: 'download', label: 'Download' },
      { key: 'exportCopy', label: 'Copy to Computer' },
      { key: 'exportMove', label: 'Move to Computer' },
    ],
  },
  {
    key: 'edit',
    label: 'Edit',
    items: [
      { key: 'undo', label: 'Undo' },
      { key: 'redo', label: 'Redo' },
      { key: 'cut', label: 'Cut' },
      { key: 'copy', label: 'Copy' },
      { key: 'paste', label: 'Paste' },
      { key: 'rename', label: 'Rename' },
    ],
  },
  {
    key: 'view',
    label: 'View',
    items: [
      { key: 'view', label: 'View' },
      { key: 'selectMultiple', label: 'Select Multiple' },
    ],
  },
  {
    key: 'manage',
    label: 'Manage',
    items: [
      { key: 'dates', label: 'Issue & Expiry Dates' },
      { key: 'renew', label: 'Renew Document' },
      { key: 'compress', label: 'Compress to Zip' },
      { key: 'extract', label: 'Extract Zip' },
      { key: 'delete', label: 'Move to Trash', isDanger: true },
      { key: 'deletePermanently', label: 'Delete Permanently', isDanger: true },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    items: [
      { key: 'editPdf', label: 'Edit PDF' },
      { key: 'split', label: 'Split' },
      { key: 'merge', label: 'Merge' },
      { key: 'pdfToWord', label: 'PDF to Word' },
      { key: 'wordToPdf', label: 'Word to PDF' },
      { key: 'imagesToPdf', label: 'Images to PDF' },
      { key: 'pdfToImages', label: 'PDF to JPG' },
    ],
  },
  {
    key: 'window',
    label: 'Window',
    items: [
      { key: 'newWindow', label: 'New Window' },
      { key: 'duplicateWindow', label: 'Duplicate Window' },
      { key: 'closeWindow', label: 'Close Window' },
      { key: 'closeRightWindows', label: 'Close Windows on the Right' },
      { key: 'closeLeftWindows', label: 'Close Windows on the Left' },
      { key: 'reopenWindow', label: 'Bring Back Closed Window' },
      { key: 'reopenRightWindows', label: 'Bring Back Windows Closed on the Right' },
      { key: 'reopenLeftWindows', label: 'Bring Back Windows Closed on the Left' },
    ],
  },
  {
    key: 'help',
    label: 'Help',
    items: [{ key: 'hint', label: 'Keyboard Shortcuts' }],
  },
];

export const TRASH_NODE_KEY = 'trash';
export const buildDocumentKeyPrefix = (sourceType, sourceId) => `documents/${sourceType}/${sourceId}`;

export const RENEWAL_STATUS = {
  NONE: 'none',
  RENEWED: 'renewed',
  EXPIRED: 'expired',
};

export const DOCUMENT_VIEWS = {
  SOURCE: 'source',
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

export const VIDEO_FILE_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];

export const AUDIO_FILE_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

export const TEXT_FILE_EXTENSIONS = [
  'txt', 'md', 'json', 'xml', 'yaml', 'yml', 'log', 'ini', 'html', 'htm', 'css', 'scss', 'js', 'jsx', 'ts', 'tsx', 'mjs',
  'py', 'java', 'c', 'h', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sh', 'sql', 'toml', 'env', 'conf', 'tex', 'vue', 'svg',
];

export const OFFICE_CONVERT_EXTENSIONS = ['doc', 'odt', 'rtf', 'ppt', 'pptx', 'odp'];

export const SPREADSHEET_FILE_EXTENSIONS = ['xlsx', 'xls', 'xlsm', 'csv', 'ods'];

export const WORD_FILE_EXTENSIONS = ['docx'];

export const ARCHIVE_FILE_EXTENSIONS = ['zip'];

export const TEXT_PREVIEW_INITIAL_BYTES = 2 * 1024 * 1024;

export const SPREADSHEET_PREVIEW_MAXIMUM_ROWS = 500;

export const SPREADSHEET_PREVIEW_MAXIMUM_COLUMNS = 50;

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
  [DOCUMENT_VIEWS.SOURCE]: 'Drag files or folders here, or use New Folder. Open All Documents, Renewed or Expired above.',
  [DOCUMENT_VIEWS.ALL]: 'Drag and drop files here, or copy files and paste them here to upload.',
  [DOCUMENT_VIEWS.RENEWED]: 'No renewed documents yet. Right click a document and choose Renew Document.',
  [DOCUMENT_VIEWS.EXPIRED]: 'No expired documents yet. Documents move here when they are renewed.',
};