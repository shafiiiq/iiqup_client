import {
  IMAGE_FILE_EXTENSIONS,
  VIDEO_FILE_EXTENSIONS,
  AUDIO_FILE_EXTENSIONS,
  TEXT_FILE_EXTENSIONS,
  SPREADSHEET_FILE_EXTENSIONS,
  WORD_FILE_EXTENSIONS,
  OFFICE_CONVERT_EXTENSIONS,
  ARCHIVE_FILE_EXTENSIONS,
  DOCUMENT_VIEWS,
} from '../constants/document.constant';

export const getFileExtension = (fileName = '') => {
  const nameParts = fileName.split('.');
  return nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';
};

export const isUploadableFile = (file) => Boolean(file) && file.size > 0;

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
  if (['xls', 'xlsx', 'xlsm', 'csv', 'ods'].includes(extension) || normalizedMimeType.includes('spreadsheet')) return 'ExcelIcon';
  if (['ppt', 'pptx'].includes(extension) || normalizedMimeType.includes('presentation')) return 'PowerPointIcon';
  if (ARCHIVE_FILE_EXTENSIONS.includes(extension) || normalizedMimeType.includes('zip')) return 'ZipIcon';
  if (TEXT_FILE_EXTENSIONS.includes(extension) || normalizedMimeType.startsWith('text/')) return 'TextFileIcon';
  return 'AttachmentIcon';
};

const hasExtensionIn = (documentItem, extensions) =>
  extensions.includes(getFileExtension(documentItem.originalFileName));

export const getPreviewKind = (documentItem) => {
  const mimeType = (documentItem.mimeType || '').toLowerCase();
  if (hasExtensionIn(documentItem, SPREADSHEET_FILE_EXTENSIONS)) return 'spreadsheet';
  if (hasExtensionIn(documentItem, WORD_FILE_EXTENSIONS)) return 'word';
  if (hasExtensionIn(documentItem, OFFICE_CONVERT_EXTENSIONS)) return 'officeConvert';
  if (hasExtensionIn(documentItem, TEXT_FILE_EXTENSIONS)) return 'text';
  if (isPdfDocument(documentItem)) return 'pdf';
  if (isImageDocument(documentItem)) return 'image';
  if (mimeType.startsWith('video/') || hasExtensionIn(documentItem, VIDEO_FILE_EXTENSIONS)) return 'video';
  if (mimeType.startsWith('audio/') || hasExtensionIn(documentItem, AUDIO_FILE_EXTENSIONS)) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  return 'unsupported';
};

export const isArchiveDocument = (documentItem) =>
  hasExtensionIn(documentItem, ARCHIVE_FILE_EXTENSIONS) || (documentItem.mimeType || '').toLowerCase().includes('zip');

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

export const isFolderInsideAny = (folders, targetFolderId, folderIds) => {
  const folderById = new Map(folders.map((folderItem) => [folderItem._id, folderItem]));
  let cursorId = targetFolderId;
  while (cursorId) {
    if (folderIds.includes(cursorId)) return true;
    cursorId = folderById.get(cursorId)?.parentFolderId || null;
  }
  return false;
};

export const runBulkActions = async (actions) => {
  const results = await Promise.allSettled(actions.map((action) => action()));
  const failedResults = results.filter((result) => result.status === 'rejected');
  return {
    succeededCount: results.length - failedResults.length,
    firstErrorMessage: failedResults[0]?.reason?.message || '',
    outcomes: results.map((result) => ({ isSuccess: result.status === 'fulfilled', value: result.value })),
  };
};

export const runBulkActionsOrThrow = async (actions) => {
  const { firstErrorMessage, outcomes } = await runBulkActions(actions);
  if (firstErrorMessage) throw new Error(firstErrorMessage);
  return outcomes;
};

export const areSameIdLists = (firstList, secondList) =>
  firstList.length === secondList.length && firstList.every((id, index) => id === secondList[index]);

export const isWordDocument = (documentItem) => ['doc', 'docx', 'odt', 'rtf'].includes(getFileExtension(documentItem.originalFileName));

export const isConvertibleImage = (documentItem) => ['jpg', 'jpeg', 'png'].includes(getFileExtension(documentItem.originalFileName));

export const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let scaled = value / 1024;
  let unitIndex = 0;
  while (scaled >= 1024 && unitIndex < units.length - 1) {
    scaled /= 1024;
    unitIndex += 1;
  }
  return `${scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(1)} ${units[unitIndex]}`;
};

export const getItemArea = (item) => item.area || 'all';

const isVirtualViewMember = (documentItem, viewKey) =>
  (viewKey === DOCUMENT_VIEWS.RENEWED || viewKey === DOCUMENT_VIEWS.EXPIRED) &&
  getItemArea(documentItem) === 'all' &&
  documentItem.renewalStatus === viewKey;

export const belongsToView = (documentItem, viewKey) =>
  getItemArea(documentItem) === viewKey || isVirtualViewMember(documentItem, viewKey);

export const selectViewDocuments = (documents, viewKey, folderId) => {
  if (folderId) return documents.filter((documentItem) => documentItem.folderId === folderId);
  return documents.filter(
    (documentItem) =>
      isVirtualViewMember(documentItem, viewKey) || (getItemArea(documentItem) === viewKey && !documentItem.folderId)
  );
};

export const selectViewFolders = (folders, viewKey, folderId) => {
  if (folderId) return folders.filter((folderItem) => folderItem.parentFolderId === folderId);
  return folders.filter((folderItem) => !folderItem.parentFolderId && getItemArea(folderItem) === viewKey);
};

export const buildViewTabItems = (viewTabs, documents, folders) =>
  viewTabs.map((viewTab) => ({
    ...viewTab,
    badge:
      selectViewDocuments(documents, viewTab.key, null).length + selectViewFolders(folders, viewTab.key, null).length,
  }));

export const computeFolderSizes = (documents, folders) => {
  const parentById = new Map(folders.map((folderItem) => [folderItem._id, folderItem.parentFolderId || null]));
  const sizes = {};
  documents.forEach((documentItem) => {
    let cursorId = documentItem.folderId;
    let guard = 0;
    while (cursorId && guard < 1000) {
      sizes[cursorId] = (sizes[cursorId] || 0) + (documentItem.fileSize || 0);
      cursorId = parentById.get(cursorId) || null;
      guard += 1;
    }
  });
  return sizes;
};

export const computeViewSizes = (documents) => {
  const sizes = { all: 0, renewed: 0, expired: 0, source: 0 };
  documents.forEach((documentItem) => {
    Object.keys(sizes).forEach((viewKey) => {
      if (belongsToView(documentItem, viewKey)) sizes[viewKey] += documentItem.fileSize || 0;
    });
  });
  return sizes;
};

export const buildUniqueFolderName = (folders, parentFolderId, area, baseName = 'New Folder') => {
  const siblingNames = new Set(
    folders
      .filter(
        (folderItem) =>
          (folderItem.parentFolderId || null) === parentFolderId && (parentFolderId || getItemArea(folderItem) === area)
      )
      .map((folderItem) => folderItem.name.toLowerCase())
  );
  let candidate = baseName;
  let counter = 2;
  while (siblingNames.has(candidate.toLowerCase())) {
    candidate = `${baseName} ${counter}`;
    counter += 1;
  }
  return candidate;
};

export const filesToUploadItems = (fileList) =>
  Array.from(fileList || []).map((file) => {
    const relativePath = file.webkitRelativePath || '';
    const separatorIndex = relativePath.lastIndexOf('/');
    return { file, directory: separatorIndex > 0 ? relativePath.slice(0, separatorIndex) : '' };
  });

const readAllDirectoryEntries = (reader) =>
  new Promise((resolve, reject) => {
    const entries = [];
    const readBatch = () =>
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(entries);
        else {
          entries.push(...batch);
          readBatch();
        }
      }, reject);
    readBatch();
  });

const readEntryFile = (entry) => new Promise((resolve, reject) => entry.file(resolve, reject));

export const collectDroppedItems = (dataTransfer) => {
  const items = Array.from(dataTransfer?.items || []).filter((item) => item.kind === 'file');
  const roots = items.map((item) => ({
    entry: item.webkitGetAsEntry ? item.webkitGetAsEntry() : null,
    file: item.getAsFile(),
  }));
  const fallbackFiles = Array.from(dataTransfer?.files || []);
  const files = [];
  const directories = [];

  const walk = async (entry, parentPath) => {
    if (entry.isFile) {
      files.push({ file: await readEntryFile(entry), directory: parentPath });
      return;
    }
    const directoryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    directories.push(directoryPath);
    const children = await readAllDirectoryEntries(entry.createReader());
    for (const child of children) await walk(child, directoryPath);
  };

  return (async () => {
    if (roots.length === 0) return { files: fallbackFiles.map((file) => ({ file, directory: '' })), directories };
    for (const root of roots) {
      if (root.entry) await walk(root.entry, '');
      else if (root.file) files.push({ file: root.file, directory: '' });
    }
    return { files, directories };
  })();
};