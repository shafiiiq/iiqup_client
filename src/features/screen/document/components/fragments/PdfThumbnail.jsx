import { useEffect, useRef, useState } from 'react';
import pdfjsLib, { safeDestroy } from '../../helper/pdfClient';

const MAXIMUM_CONCURRENT_THUMBNAILS = 3;
const THUMBNAIL_RENDER_WIDTH = 146;

let activeThumbnailCount = 0;
const pendingThumbnailTasks = [];

const runPendingThumbnailTasks = () => {
  while (activeThumbnailCount < MAXIMUM_CONCURRENT_THUMBNAILS && pendingThumbnailTasks.length > 0) {
    const task = pendingThumbnailTasks.shift();
    activeThumbnailCount += 1;
    task().finally(() => {
      activeThumbnailCount -= 1;
      runPendingThumbnailTasks();
    });
  }
};

const enqueueThumbnailTask = (task) => {
  pendingThumbnailTasks.push(task);
  runPendingThumbnailTasks();
  return () => {
    const taskIndex = pendingThumbnailTasks.indexOf(task);
    if (taskIndex >= 0) pendingThumbnailTasks.splice(taskIndex, 1);
  };
};

function PdfThumbnail({ url, cacheKey, fallback }) {
  const canvasRef = useRef(null);
  const urlRef = useRef(url);
  const [hasFailed, setHasFailed] = useState(false);
  urlRef.current = url;

  useEffect(() => {
    let isCancelled = false;
    let loadingTask = null;

    const renderThumbnail = async () => {
      if (isCancelled) return;
      try {
        loadingTask = pdfjsLib.getDocument({ url: urlRef.current, disableAutoFetch: true });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        if (isCancelled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: THUMBNAIL_RENDER_WIDTH / baseViewport.width });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      } catch {
        if (!isCancelled) setHasFailed(true);
      } finally {
        if (loadingTask) safeDestroy(loadingTask);
      }
    };

    const removePendingTask = enqueueThumbnailTask(renderThumbnail);
    return () => {
      isCancelled = true;
      removePendingTask();
      if (loadingTask) safeDestroy(loadingTask);
    };
  }, [cacheKey]);

  if (hasFailed) return fallback;
  return <canvas ref={canvasRef} className="doc-details-preview-canvas" />;
}

export default PdfThumbnail;