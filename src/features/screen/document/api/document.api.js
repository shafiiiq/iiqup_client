import { apiRequest } from '@/features/core/network/api/api.request';

const readResponseData = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallbackMessage);
  return body.data;
};

export const fetchDocumentsBySource = async ({ sourceType, sourceId }) =>
  readResponseData(await apiRequest(`/documents/source/${sourceType}/${sourceId}`, 'GET'), 'Failed to fetch documents');

export const registerUploadedDocuments = async ({ sourceType, sourceId, sessionIds, folderId, area, directoryBySessionId, emptyDirectories }) =>
  readResponseData(
    await apiRequest('/documents/register-uploads', 'POST', {
      sourceType,
      sourceId,
      sessionIds,
      folderId,
      area,
      directoryBySessionId,
      emptyDirectories,
    }),
    'Failed to save uploaded documents'
  );

export const fetchFoldersBySource = async ({ sourceType, sourceId }) =>
  readResponseData(await apiRequest(`/documents/folders/${sourceType}/${sourceId}`, 'GET'), 'Failed to fetch folders');

export const createFolder = async ({ sourceType, sourceId, parentFolderId, area, name }) =>
  readResponseData(
    await apiRequest('/documents/folders', 'POST', { sourceType, sourceId, parentFolderId, area, name: name.trim() }),
    'Failed to create folder'
  );

export const renameFolder = async ({ folderId, name }) =>
  readResponseData(
    await apiRequest(`/documents/folders/${folderId}/rename`, 'PUT', { name: name.trim() }),
    'Failed to rename folder'
  );

export const moveDocument = async ({ documentId, folderId, area, targetSourceType, targetSourceId }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/move`, 'PUT', { folderId, area, targetSourceType, targetSourceId }),
    'Failed to move document'
  );

export const copyDocument = async ({ documentId, folderId, area, targetSourceType, targetSourceId }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/copy`, 'POST', { folderId, area, targetSourceType, targetSourceId }),
    'Failed to copy document'
  );

export const renewDocument = async ({ documentId, uploadSessionId, issueDate, expiryDate }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/renew`, 'POST', { uploadSessionId, issueDate, expiryDate }),
    'Failed to renew document'
  );

export const updateDocumentDates = async ({ documentId, issueDate, expiryDate }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/dates`, 'PUT', { issueDate, expiryDate }),
    'Failed to update dates'
  );

export const renameDocument = async ({ documentId, newFileName }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/rename`, 'PUT', { newFileName: newFileName.trim() }),
    'Failed to rename document'
  );

export const setDocumentRenewalStatus = async ({ documentId, renewalStatus }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/renewal-status`, 'PUT', { renewalStatus }),
    'Failed to update renewal status'
  );

export const mergeDocuments = async ({ sourceType, sourceId, documentIds }) =>
  readResponseData(
    await apiRequest('/documents/merge', 'POST', { sourceType, sourceId, documentIds }),
    'Failed to merge documents'
  );

export const splitDocument = async ({ documentId, splitType, pages }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/split`, 'POST', { splitType, pages }),
    'Failed to split document'
  );

export const trashItems = async ({ documentIds, folderIds }) =>
  readResponseData(
    await apiRequest('/documents/trash', 'POST', { documentIds, folderIds }),
    'Failed to move to Trash'
  );

export const deleteItemsPermanently = async ({ documentIds, folderIds }) =>
  readResponseData(
    await apiRequest('/documents/delete-permanently', 'POST', { documentIds, folderIds }),
    'Failed to delete permanently'
  );

export const fetchTrashSources = async () =>
  readResponseData(await apiRequest('/documents/trash/sources', 'GET'), 'Failed to load Trash');

export const fetchTrashItems = async ({ sourceType, sourceId }) =>
  readResponseData(await apiRequest(`/documents/trash/${sourceType}/${sourceId}`, 'GET'), 'Failed to load Trash');

export const restoreTrashItems = async ({ documentIds, folderIds }) =>
  readResponseData(
    await apiRequest('/documents/trash/restore', 'POST', { documentIds, folderIds }),
    'Failed to restore items'
  );

export const emptyTrash = async ({ sourceType, sourceId } = {}) =>
  readResponseData(
    await apiRequest('/documents/trash/empty', 'POST', { sourceType, sourceId }),
    'Failed to empty Trash'
  );

export const compressItems = async ({ sourceType, sourceId, documentIds, folderIds, folderId, area }) =>
  readResponseData(
    await apiRequest('/documents/compress', 'POST', { sourceType, sourceId, documentIds, folderIds, folderId, area }),
    'Failed to compress'
  );

export const extractDocument = async ({ documentId }) =>
  readResponseData(await apiRequest(`/documents/${documentId}/extract`, 'POST', {}), 'Failed to extract');

export const getSignedUrl = async (filePath, downloadFileName) => {
  const response = await apiRequest('/s3/pre-signed-url', 'POST', { key: filePath, isLong: false, downloadFileName });
  if (!response.ok) throw new Error('Failed to generate signed URL');
  const body = await response.json();
  return body.dataUrl;
};

export const fetchSourceEntity = async ({ type, id }) => {
  const endpoints = {
    equipment: `/equipments/${id}`,
    operator: `/operators/get-operator/${id}`,
    mechanic: `/users/mechanics/${id}`,
    staff: `/users/staff/${id}`,
  };
  const url = endpoints[type];
  if (!url) return null;
  const response = await apiRequest(url, 'GET');
  const body = await response.json();
  return body.data || body;
};

export const moveFolder = async ({ folderId, parentFolderId, area, targetSourceType, targetSourceId }) =>
  readResponseData(
    await apiRequest(`/documents/folders/${folderId}/move`, 'PUT', { parentFolderId, area, targetSourceType, targetSourceId }),
    'Failed to move folder'
  );

export const copyFolder = async ({ folderId, parentFolderId, area, targetSourceType, targetSourceId }) =>
  readResponseData(
    await apiRequest(`/documents/folders/${folderId}/copy`, 'POST', { parentFolderId, area, targetSourceType, targetSourceId }),
    'Failed to copy folder'
  );

export const editDocumentPages = async ({ documentId, pages }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/edit-pages`, 'POST', { pages }),
    'Failed to update document'
  );

export const mergeDocumentPages = async ({ sourceType, sourceId, pages }) =>
  readResponseData(
    await apiRequest('/documents/merge-pages', 'POST', { sourceType, sourceId, pages }),
    'Failed to merge documents'
  );

export const fetchStorageSummary = async () =>
  readResponseData(await apiRequest('/documents/storage', 'GET'), 'Failed to load storage');

export const convertDocuments = async ({ sourceType, sourceId, conversion, documentIds }) =>
  readResponseData(
    await apiRequest('/documents/convert', 'POST', { sourceType, sourceId, conversion, documentIds }),
    'Failed to convert'
  );

export const getPreviewPdfUrl = async (documentId) => {
  const data = await readResponseData(
    await apiRequest(`/documents/${documentId}/preview-pdf`, 'GET'),
    'Failed to prepare the preview'
  );
  return data.url;
};