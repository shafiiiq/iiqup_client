import { useEffect } from 'react';
import { markDocumentViewed } from '../api/notification.documents.service';
import { TRACKED_DOCUMENT_SOURCES } from '../constant/notification.document.constant';

export const useMarkDocumentViewed = (sourceKey, documentId) => {
  useEffect(() => {
    if (!sourceKey || !documentId) return;
    if (!TRACKED_DOCUMENT_SOURCES.includes(sourceKey)) return;
    markDocumentViewed(sourceKey, documentId).catch(console.error);
  }, [sourceKey, documentId]);
};