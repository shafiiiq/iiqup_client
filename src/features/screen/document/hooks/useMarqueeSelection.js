import { useEffect, useRef, useState } from 'react';

const MINIMUM_DRAG_DISTANCE_PIXELS = 4;
const ITEM_SELECTOR = '[data-document-id],[data-folder-id]';

export const useMarqueeSelection = ({ isEnabled, containerRef, onSelectItems }) => {
  const [marqueeRect, setMarqueeRect] = useState(null);
  const dragStartPointRef = useRef(null);
  const pointerPointRef = useRef(null);
  const frameRef = useRef(0);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!isEnabled || !container) return undefined;

    const processFrame = () => {
      frameRef.current = 0;
      const dragStartPoint = dragStartPointRef.current;
      const pointerPoint = pointerPointRef.current;
      if (!dragStartPoint || !pointerPoint) return;

      const left = Math.min(dragStartPoint.x, pointerPoint.x);
      const top = Math.min(dragStartPoint.y, pointerPoint.y);
      const width = Math.abs(pointerPoint.x - dragStartPoint.x);
      const height = Math.abs(pointerPoint.y - dragStartPoint.y);
      if (width < MINIMUM_DRAG_DISTANCE_PIXELS && height < MINIMUM_DRAG_DISTANCE_PIXELS) return;

      didDragRef.current = true;
      setMarqueeRect({ left, top, width, height });

      const intersectingElements = Array.from(container.querySelectorAll(ITEM_SELECTOR)).filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left < left + width && bounds.right > left && bounds.top < top + height && bounds.bottom > top;
      });

      onSelectItems({
        documentIds: intersectingElements
          .filter((element) => element.dataset.documentId)
          .map((element) => element.dataset.documentId),
        folderIds: intersectingElements
          .filter((element) => element.dataset.folderId)
          .map((element) => element.dataset.folderId),
      });
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0 || event.target.closest(ITEM_SELECTOR)) return;
      event.preventDefault();
      dragStartPointRef.current = { x: event.clientX, y: event.clientY };
      pointerPointRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event) => {
      if (!dragStartPointRef.current) return;
      pointerPointRef.current = { x: event.clientX, y: event.clientY };
      if (!frameRef.current) frameRef.current = requestAnimationFrame(processFrame);
    };

    const handleMouseUp = () => {
      if (didDragRef.current) {
        didDragRef.current = false;
        suppressClickRef.current = true;
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
      dragStartPointRef.current = null;
      pointerPointRef.current = null;
      setMarqueeRect(null);
    };

    const handleClick = (event) => {
      if (suppressClickRef.current) event.stopPropagation();
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      dragStartPointRef.current = null;
      pointerPointRef.current = null;
      setMarqueeRect(null);
    };
  }, [isEnabled, containerRef, onSelectItems]);

  return marqueeRect;
};