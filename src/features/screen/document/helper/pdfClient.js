import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const safeDestroy = (pdfOrTask) => {
  try {
    return Promise.resolve(pdfOrTask?.destroy()).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const message = String(event.reason?.message || event.reason || '');
      if (message.includes('Worker was terminated')) event.preventDefault();
    },
    true
  );
}

export default pdfjsLib;