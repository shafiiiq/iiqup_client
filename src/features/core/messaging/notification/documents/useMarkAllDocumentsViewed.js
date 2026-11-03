import { useEffect } from 'react';
import { markAllDocumentsViewed } from '../api/notification.documents.service';

export const useMarkAllDocumentsViewed = (sourceKey, isReady) => {
  useEffect(() => {
    if (!isReady) return;
    markAllDocumentsViewed(sourceKey).catch(console.error);
  }, [sourceKey, isReady]);
};