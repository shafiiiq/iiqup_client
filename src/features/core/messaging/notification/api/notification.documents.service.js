import { apiRequest } from '@/features/core/network/api/api.request';
import { documentUnseenStore } from '../count/document.unseen.store';
import { readResponseBody } from './notification.response';

const parseDocumentUnseen = (data) => ({
  bySource: data?.bySource ?? {},
  referencesBySource: data?.referencesBySource ?? {},
  total: data?.total ?? 0,
});

const applyCounts = (data) => {
  const counts = parseDocumentUnseen(data);
  documentUnseenStore.setCounts(counts);
  return counts;
};

export const fetchDocumentUnseen = async () => {
  const body = await readResponseBody(
    await apiRequest('/notification/documents/unseen', 'GET'),
    'Failed to load unseen documents'
  );
  return applyCounts(body.data);
};

export const markDocumentViewed = async (sourceKey, documentId) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/documents/${sourceKey}/${encodeURIComponent(documentId)}/viewed`, 'PUT'),
    'Failed to mark document as viewed'
  );
  return applyCounts(body.data);
};

export const markAllDocumentsViewed = async (sourceKey) => {
  const body = await readResponseBody(
    await apiRequest(`/notification/documents/${sourceKey}/viewed-all`, 'PUT'),
    'Failed to mark documents as viewed'
  );
  return applyCounts(body.data);
};