import { useEffect, useState } from 'react';
import { featureLinkDocumentKey, loadFeatureLinkDocument } from '../utils/notification.feature.document';

const EMPTY_STATE = { url: null, hasFailed: false };

export const useFeatureLinkDocument = (link) => {
  const [documentState, setDocumentState] = useState(EMPTY_STATE);
  const documentKey = link ? featureLinkDocumentKey(link) : null;

  useEffect(() => {
    setDocumentState(EMPTY_STATE);
    if (!link) return undefined;
    let isCancelled = false;
    loadFeatureLinkDocument(link)
      .then((url) => {
        if (!isCancelled) setDocumentState({ url, hasFailed: false });
      })
      .catch(() => {
        if (!isCancelled) setDocumentState({ url: null, hasFailed: true });
      });
    return () => {
      isCancelled = true;
    };
  }, [documentKey]);

  return documentState;
};