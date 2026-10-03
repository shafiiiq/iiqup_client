import { useEffect, useRef, useState } from 'react';

const PAGE_ASPECT_RATIO = 1.414;

function PdfPageCanvas({ pdf, pageNumber, width, lazy = false }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!isVisible || !pdf) return undefined;
    let isCancelled = false;
    let renderTask = null;

    pdf.getPage(pageNumber).then((page) => {
      if (isCancelled) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: (width / baseViewport.width) * pixelRatio });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${viewport.height / pixelRatio}px`;
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      renderTask.promise.catch(() => null);
    });

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, width, isVisible]);

  return (
    <div
      ref={wrapperRef}
      className="doc-viewer-canvas-wrap"
      style={{ width, minHeight: isVisible ? undefined : width * PAGE_ASPECT_RATIO }}
    >
      <canvas ref={canvasRef} className="doc-viewer-canvas" />
    </div>
  );
}

export default PdfPageCanvas;