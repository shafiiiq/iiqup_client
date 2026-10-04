import { useEffect, useRef, useState } from 'react';

const PAGE_ASPECT_RATIO = 1.414;

function PdfPageCanvas({ pdf, pageNumber, width, box, zoom = 1, rotation = 0, lazy = false }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(!lazy);
  const boxWidth = box?.width;
  const boxHeight = box?.height;

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
      const pageRotation = (page.rotate + rotation) % 360;
      const baseViewport = page.getViewport({ scale: 1, rotation: pageRotation });
      const cssScale = boxWidth
        ? Math.min(boxWidth / baseViewport.width, boxHeight / baseViewport.height) * zoom
        : width / baseViewport.width;
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: cssScale * pixelRatio, rotation: pageRotation });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${baseViewport.width * cssScale}px`;
      canvas.style.height = `${baseViewport.height * cssScale}px`;
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      renderTask.promise.catch(() => null);
    }).catch(() => null);

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, width, boxWidth, boxHeight, zoom, rotation, isVisible]);

  return (
    <div
      ref={wrapperRef}
      className="doc-viewer-canvas-wrap"
      style={boxWidth ? undefined : { width, minHeight: isVisible ? undefined : width * PAGE_ASPECT_RATIO }}
    >
      <canvas ref={canvasRef} className="doc-viewer-canvas" />
    </div>
  );
}

export default PdfPageCanvas;