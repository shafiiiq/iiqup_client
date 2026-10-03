import {
  ACCEPTED_FILE_EXTENSIONS,
  IMAGE_FILE_EXTENSIONS,
  DOCUMENT_VIEWS,
  RENEWAL_STATUS,
} from '../constants/document.constant';

export const getFileExtension = (fileName = '') => {
  const nameParts = fileName.split('.');
  return nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';
};

export const isAcceptedFile = (file) => ACCEPTED_FILE_EXTENSIONS.includes(getFileExtension(file.name));

export const isImageDocument = ({ originalFileName, mimeType }) =>
  (mimeType || '').toLowerCase().startsWith('image/') ||
  IMAGE_FILE_EXTENSIONS.includes(getFileExtension(originalFileName));

export const isPdfDocument = ({ originalFileName, mimeType }) =>
  (mimeType || '').toLowerCase().includes('pdf') || getFileExtension(originalFileName) === 'pdf';

export const getFileIcon = (fileName = '', mimeType = '') => {
  const extension = getFileExtension(fileName);
  const normalizedMimeType = mimeType.toLowerCase();
  if (extension === 'pdf' || normalizedMimeType.includes('pdf')) return 'PdfIcon';
  if (IMAGE_FILE_EXTENSIONS.includes(extension) || normalizedMimeType.includes('image')) return 'ImageIcon';
  if (['doc', 'docx'].includes(extension) || normalizedMimeType.includes('word')) return 'DocumentIcon';
  return 'AttachmentIcon';
};

export const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}-${month}-${year}`;
};

export const toDateInputValue = (isoDate) => (isoDate ? isoDate.slice(0, 10) : '');

export const validateDateRange = (issueDate, expiryDate) => {
  if (issueDate && expiryDate && expiryDate < issueDate) return 'Expiry date cannot be before issue date';
  return '';
};

export const filterDocumentsByView = (documents, viewKey) => {
  if (viewKey === DOCUMENT_VIEWS.RENEWED) {
    return documents.filter((documentItem) => documentItem.renewalStatus === RENEWAL_STATUS.RENEWED);
  }
  if (viewKey === DOCUMENT_VIEWS.EXPIRED) {
    return documents.filter((documentItem) => documentItem.renewalStatus === RENEWAL_STATUS.EXPIRED);
  }
  return documents;
};

export const countFolderItems = (documents, folders, folderId) =>
  documents.filter((documentItem) => (documentItem.folderId || null) === folderId).length +
  folders.filter((folderItem) => (folderItem.parentFolderId || null) === folderId).length;

export const buildViewTabItems = (viewTabs, documents, folders) =>
  viewTabs.map((viewTab) => ({
    ...viewTab,
    badge:
      viewTab.key === DOCUMENT_VIEWS.ALL
        ? countFolderItems(documents, folders, null)
        : filterDocumentsByView(documents, viewTab.key).length,
  }));

export const stripDocumentExtension = (documentItem) => {
  const extension = getFileExtension(documentItem.originalFileName);
  const { displayName } = documentItem;
  return extension && displayName.toLowerCase().endsWith(`.${extension}`)
    ? displayName.slice(0, -(extension.length + 1))
    : displayName;
};

export const buildDocumentFileLabel = (documentItem) => {
  const extension = getFileExtension(documentItem.originalFileName);
  const baseName = stripDocumentExtension(documentItem);
  return extension ? `${baseName}.${extension}` : baseName;
};

export const buildUniqueFolderName = (folders, parentFolderId) => {
  const siblingNames = new Set(
    folders
      .filter((folderItem) => (folderItem.parentFolderId || null) === parentFolderId)
      .map((folderItem) => folderItem.name.toLowerCase())
  );
  if (!siblingNames.has('new folder')) return 'New Folder';
  let suffixNumber = 2;
  while (siblingNames.has(`new folder ${suffixNumber}`)) suffixNumber += 1;
  return `New Folder ${suffixNumber}`;
};

export const isFolderInsideAny = (folders, targetFolderId, folderIds) => {
  const folderById = new Map(folders.map((folderItem) => [folderItem._id, folderItem]));
  let cursorId = targetFolderId;
  while (cursorId) {
    if (folderIds.includes(cursorId)) return true;
    cursorId = folderById.get(cursorId)?.parentFolderId || null;
  }
  return false;
};