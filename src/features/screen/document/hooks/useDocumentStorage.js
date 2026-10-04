import { useEffect, useState } from 'react';
import { fetchStorageSummary } from '../api/document.api';

const REFRESH_DELAY_MILLISECONDS = 600;

export const useDocumentStorage = ({ documents, trashItems, trashSources }) => {
  const [storage, setStorage] = useState({ totalBytes: 0, trashBytes: 0, bySource: {} });

  useEffect(() => {
    let isCancelled = false;
    const timerId = setTimeout(async () => {
      try {
        const data = await fetchStorageSummary();
        if (isCancelled) return;
        setStorage({
          totalBytes: data.totalBytes,
          trashBytes: data.trashBytes,
          bySource: Object.fromEntries(data.sources.map((source) => [`${source.sourceType}:${source.sourceId}`, source.bytes])),
        });
      } catch {
        return;
      }
    }, REFRESH_DELAY_MILLISECONDS);
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [documents, trashItems, trashSources]);

  return storage;
};