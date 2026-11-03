import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const safeDestroy = (pdfOrTask) => {
  try {
    if (pdfOrTask?.promise) pdfOrTask.promise.catch(() => null);
    return Promise.resolve(pdfOrTask?.destroy()).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
};

const WORKER_TERMINATED_MESSAGE = 'Worker was terminated';

const suppressWorkerTerminatedEvent = (event) => {
  const message = String(event.reason?.message || event.reason || event.error?.message || event.message || '');
  if (!message.includes(WORKER_TERMINATED_MESSAGE)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', suppressWorkerTerminatedEvent, true);
  window.addEventListener('error', suppressWorkerTerminatedEvent, true);
}

export default pdfjsLib;