import { useEffect, useState } from 'react';
import pdfjsLib, { safeDestroy } from '../helper/pdfClient';

export const usePdfPages = (documents, enabled) => {
  const [state, setState] = useState({ pages: [], pdfs: {}, isLoading: true, error: '' });

  useEffect(() => {
    if (!enabled) return undefined;
    let isCancelled = false;
    const abortController = new AbortController();
    const loadedPdfs = [];
    const loadingTasks = new Set();
    setState({ pages: [], pdfs: {}, isLoading: true, error: '' });

    (async () => {
      try {
        const pdfs = {};
        const pages = [];
        for (const documentItem of documents) {
          const fileResponse = await fetch(documentItem.fileUrl, {
            cache: 'no-store',
            mode: 'cors',
            signal: abortController.signal,
          });
          if (!fileResponse.ok) throw new Error('Failed to fetch file');
          const loadingTask = pdfjsLib.getDocument({ data: await fileResponse.arrayBuffer() });
          loadingTasks.add(loadingTask);
          let pdf;
          try {
            pdf = await loadingTask.promise;
          } finally {
            loadingTasks.delete(loadingTask);
          }
          if (isCancelled) {
            safeDestroy(pdf);
            return;
          }
          loadedPdfs.push(pdf);
          pdfs[documentItem._id] = pdf;
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            pages.push({
              key: `${documentItem._id}:${pageNumber}`,
              documentId: documentItem._id,
              documentName: documentItem.displayName,
              pageNumber,
            });
          }
        }
        if (!isCancelled) setState({ pages, pdfs, isLoading: false, error: '' });
      } catch (error) {
        if (!isCancelled && error.name !== 'AbortError') {
          setState({ pages: [], pdfs: {}, isLoading: false, error: 'Failed to load PDF' });
        }
      }
    })();

    return () => {
      isCancelled = true;
      abortController.abort();
      loadedPdfs.forEach((pdf) => safeDestroy(pdf));
      loadingTasks.forEach((loadingTask) => safeDestroy(loadingTask));
    };
  }, [documents, enabled]);

  return state;
};