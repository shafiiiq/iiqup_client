import { buildDocumentFileLabel } from './document.helper';

const INVALID_NAME_PATTERN = /[\\/:*?"<>|]/g;

const sanitizeName = (name) => name.replace(INVALID_NAME_PATTERN, '_').trim() || 'untitled';

export const isDirectoryExportSupported = () =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

const entryExists = async (directoryHandle, name, kind) => {
  try {
    if (kind === 'file') await directoryHandle.getFileHandle(name);
    else await directoryHandle.getDirectoryHandle(name);
    return true;
  } catch {
    return false;
  }
};

const pickFreeName = async (directoryHandle, name, kind) => {
  if (!(await entryExists(directoryHandle, name, kind))) return name;
  const dotIndex = kind === 'file' ? name.lastIndexOf('.') : -1;
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const extension = dotIndex > 0 ? name.slice(dotIndex) : '';
  let counter = 2;
  while (await entryExists(directoryHandle, `${baseName} (${counter})${extension}`, kind)) counter += 1;
  return `${baseName} (${counter})${extension}`;
};

const writeDocument = async (directoryHandle, documentItem) => {
  const fileName = await pickFreeName(directoryHandle, sanitizeName(buildDocumentFileLabel(documentItem)), 'file');
  const response = await fetch(documentItem.fileUrl, { mode: 'cors' });
  if (!response.ok || !response.body) throw new Error(`Could not download ${fileName}`);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await response.body.pipeTo(writable);
};

export const exportItemsToDirectory = async ({ directoryHandle, documentItems, folderItems, documents, folders, onProgress }) => {
  const documentsByFolderId = new Map();
  const foldersByParentId = new Map();
  documents.forEach((documentItem) => {
    if (!documentItem.folderId) return;
    documentsByFolderId.set(documentItem.folderId, [...(documentsByFolderId.get(documentItem.folderId) || []), documentItem]);
  });
  folders.forEach((folderItem) => {
    if (!folderItem.parentFolderId) return;
    foldersByParentId.set(folderItem.parentFolderId, [...(foldersByParentId.get(folderItem.parentFolderId) || []), folderItem]);
  });

  const countFolderFiles = (folderItem) =>
    (documentsByFolderId.get(folderItem._id) || []).length +
    (foldersByParentId.get(folderItem._id) || []).reduce((total, child) => total + countFolderFiles(child), 0);

  const totalFiles = documentItems.length + folderItems.reduce((total, folderItem) => total + countFolderFiles(folderItem), 0);
  let completedFiles = 0;
  const reportProgress = () => {
    completedFiles += 1;
    if (onProgress && totalFiles > 0) onProgress(completedFiles / totalFiles);
  };

  const writeFolder = async (parentHandle, folderItem) => {
    const folderName = await pickFreeName(parentHandle, sanitizeName(folderItem.name), 'directory');
    const folderHandle = await parentHandle.getDirectoryHandle(folderName, { create: true });
    for (const documentItem of documentsByFolderId.get(folderItem._id) || []) {
      await writeDocument(folderHandle, documentItem);
      reportProgress();
    }
    for (const childFolder of foldersByParentId.get(folderItem._id) || []) await writeFolder(folderHandle, childFolder);
  };

  for (const documentItem of documentItems) {
    await writeDocument(directoryHandle, documentItem);
    reportProgress();
  }
  for (const folderItem of folderItems) await writeFolder(directoryHandle, folderItem);
};