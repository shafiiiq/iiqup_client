import { apiRequest } from '@/features/core/network/api/api.request';

const readResponseData = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallbackMessage);
  return body.data;
};

export const fetchDocumentsBySource = async ({ sourceType, sourceId }) =>
  readResponseData(await apiRequest(`/documents/source/${sourceType}/${sourceId}`, 'GET'), 'Failed to fetch documents');

export const registerUploadedDocuments = async ({ sourceType, sourceId, sessionIds, folderId }) =>
  readResponseData(
    await apiRequest('/documents/register-uploads', 'POST', { sourceType, sourceId, sessionIds, folderId }),
    'Failed to save uploaded documents'
  );

export const fetchFoldersBySource = async ({ sourceType, sourceId }) =>
  readResponseData(await apiRequest(`/documents/folders/${sourceType}/${sourceId}`, 'GET'), 'Failed to fetch folders');

export const createFolder = async ({ sourceType, sourceId, parentFolderId, name }) =>
  readResponseData(
    await apiRequest('/documents/folders', 'POST', { sourceType, sourceId, parentFolderId, name: name.trim() }),
    'Failed to create folder'
  );

export const renameFolder = async ({ folderId, name }) =>
  readResponseData(
    await apiRequest(`/documents/folders/${folderId}/rename`, 'PUT', { name: name.trim() }),
    'Failed to rename folder'
  );

export const moveDocument = async ({ documentId, folderId }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/move`, 'PUT', { folderId }),
    'Failed to move document'
  );

export const copyDocument = async ({ documentId, folderId }) =>
  readResponseData(
    await apiRequest(`/documents/${documentId}/copy`, 'POST', { folderId }),
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

export const deleteDocument = async (documentId) =>
  readResponseData(await apiRequest(`/documents/${documentId}`, 'DELETE'), 'Failed to delete document');

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

export const getSignedUrl = async (filePath) => {
  const response = await apiRequest('/s3/pre-signed-url', 'POST', { key: filePath, isLong: false });
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

export const moveFolder = async ({ folderId, parentFolderId }) =>
  readResponseData(
    await apiRequest(`/documents/folders/${folderId}/move`, 'PUT', { parentFolderId }),
    'Failed to move folder'
  );

export const copyFolder = async ({ folderId, parentFolderId }) =>
  readResponseData(
    await apiRequest(`/documents/folders/${folderId}/copy`, 'POST', { parentFolderId }),
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