import { API_URI } from '@/features/core/network/api/api.uri';
import { apiRequest } from '@/features/core/network/api/api.request';

export const fetchDocumentTypes = async () => {
  const response = await apiRequest(`${API_URI}/documents/get-all-documents-types`);
  if (!response.ok) throw new Error('Failed to fetch document types');
  const data = await response.json();
  return data.documents?.map((d) => d.documentType?.trim()).filter(Boolean) ?? [];
};

export const fetchDocumentsBySource = async ({ sourceType, type, id }) => {
  const response = await apiRequest(`${API_URI}/documents/get-documents/${sourceType || type}/${id}`, 'GET');
  if (!response.ok) throw new Error('Failed to fetch documents');
  const data = await response.json();
  const out = [];
  data.documents?.forEach((doc) => {
    doc.files?.forEach((file) => {
      out.push({
        _id: file._id,
        sourceId: doc.SourceId,
        sourceType: doc.documentSource?.[0]?.source,
        documentType: doc.documentType,
        fileName: file.filename,
        displayFileName: file.displayFileName,
        filePath: file.path,
        mimetype: file.mimetype,
        date: file.date,
        expiry: file.expiry,
        uploadDate: file.uploadedAt || file.createdAt,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        description: doc.description || '',
        category: doc.category || 'other',
      });
    });
  });
  return out;
};

export const uploadDocument = async (payload) => {
  const response = await apiRequest(`${API_URI}/documents/upload-document`, 'POST', payload);
  const result = await response.json();
  return { response, result };
};

export const getDocumentViewData = async (documentId) => {
  const response = await apiRequest(`${API_URI}/documents/view/${documentId}`);
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
};

export const getDocumentDownloadData = async (documentId) => {
  const response = await apiRequest(`${API_URI}/documents/download/${documentId}`);
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
};

export const deleteDocument = async (documentId) => {
  const response = await apiRequest(`${API_URI}/documents/delete/${documentId}`, 'DELETE');
  const result = await response.json();
  return { response, result };
};

export const renameDocument = async (docId, newFileName) => {
  const response = await apiRequest(`${API_URI}/documents/rename-file/${docId}`, 'PUT', { newFileName: newFileName.trim() });
  const result = await response.json();
  return { response, result };
};

export const getSignedUrl = async (filePath, options = {}) => {
  const response = await apiRequest(`${API_URI}/s3/get-pre-signed-url`, 'POST', {
    key: filePath,
    isLong: false,
    ...options,
  });
  if (!response.ok) throw new Error('Failed to generate signed URL');
  const data = await response.json();
  return data.dataUrl;
};

export const splitPdfDocument = async ({ sourceId, sourceType, documentId, pageNumbers, currentCategory }) => {
  const response = await apiRequest(`${API_URI}/documents/split-pdf`, 'POST', {
    sourceId,
    sourceType,
    documentId,
    splitOptions: { pages: pageNumbers, splitType: 'specific' },
    category: currentCategory === 'all' ? 'merged' : currentCategory,
  });
  const result = await response.json();
  return { response, result };
};

export const splitAllPdfPages = async ({ sourceId, sourceType, documentId, currentCategory }) => {
  const response = await apiRequest(`${API_URI}/documents/split-pdf`, 'POST', {
    sourceId,
    sourceType,
    documentId,
    splitOptions: { pages: [1], splitType: 'every' },
    category: currentCategory === 'all' ? 'split' : currentCategory,
  });
  const result = await response.json();
  return { response, result };
};

export const mergePdfDocuments = async ({ sourceId, sourceType, documentIds, currentCategory }) => {
  const response = await apiRequest(`${API_URI}/documents/merge-pdfs`, 'POST', {
    sourceId,
    sourceType,
    documentIds,
    category: currentCategory === 'all' ? 'merged' : currentCategory,
    documentType: 'Merged Document',
  });
  const result = await response.json();
  return { response, result };
};

export const fetchSourceEntity = async ({ type, id }) => {
  const endpoints = {
    equipment: `${API_URI}/equipments/get-equipment/${id}`,
    operator: `${API_URI}/operators/get-operator/${id}`,
    mechanic: `${API_URI}/mechanics/get-mechanic/${id}`,
    'office-staff': `${API_URI}/users/get-user/${id}`,
  };
  const url = endpoints[type];
  if (!url) return null;
  const response = await apiRequest(url, 'GET');
  const data = await response.json();
  return data.data || data;
};
