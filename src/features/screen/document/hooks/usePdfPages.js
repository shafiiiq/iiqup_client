import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const usePdfPages = (documents, enabled) => {
  const [state, setState] = useState({ pages: [], pdfs: {}, isLoading: true, error: '' });

  useEffect(() => {
    if (!enabled) return undefined;
    let isCancelled = false;
    const loadedPdfs = [];

    (async () => {
      try {
        const pdfs = {};
        const pages = [];
        for (const documentItem of documents) {
          const pdf = await pdfjsLib.getDocument(documentItem.fileUrl).promise;
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
      } catch {
        if (!isCancelled) setState({ pages: [], pdfs: {}, isLoading: false, error: 'Failed to load PDF' });
      }
    })();

    return () => {
      isCancelled = true;
      loadedPdfs.forEach((pdf) => pdf.destroy());
    };
  }, [documents, enabled]);

  return state;
};