import { useEffect, useMemo, useRef, useState } from 'react';
import { usePdfPages } from '../../hooks/usePdfPages';
import { buildDocumentFileLabel } from '../../helper/document.helper';
import {
  PDF_EDITOR_FONTS,
  PDF_EDITOR_DEFAULT_SIZES,
  TEXT_LINE_HEIGHT_RATIO,
  createPdfElement,
  readImageFile,
  clampNumber,
  getFontCss,
} from '../../helper/pdfEditor.helper';
import PdfPageCanvas from './PdfPageCanvas';

const BASE_PAGE_WIDTH = 760;
const MINIMUM_ZOOM = 0.5;
const MAXIMUM_ZOOM = 2;
const ZOOM_STEP = 0.25;
const HISTORY_LIMIT = 50;
const HISTORY_MERGE_MILLISECONDS = 700;
const FALLBACK_DIMENSIONS = { w: 595, h: 842 };
const HANDLES = ['nw', 'ne', 'sw', 'se'];
const TOOLS = [
  { key: 'select', label: 'Select' },
  { key: 'text', label: 'Text' },
  { key: 'rect', label: 'Rectangle' },
  { key: 'ellipse', label: 'Ellipse' },
  { key: 'line', label: 'Line' },
];

const getAnchor = (handle, element) => ({
  x: handle.includes('w') ? element.x + element.w : element.x,
  y: handle.includes('n') ? element.y + element.h : element.y,
});

function PdfEditor({ documentItem, isBusy, onSave, onClose }) {
  const documents = useMemo(() => [documentItem], [documentItem]);
  const { pages, pdfs, isLoading, error } = usePdfPages(documents, true);
  const pdf = pdfs[documentItem._id];

  const [elements, setElements] = useState([]);
  const [images, setImages] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [pageDimensions, setPageDimensions] = useState({});
  const [notice, setNotice] = useState('');

  const scrollRef = useRef(null);
  const pageRefs = useRef({});
  const dragRef = useRef(null);
  const historyRef = useRef({ stack: [], lastPushedAt: 0 });
  const imageInputRef = useRef(null);
  const latestRef = useRef({});

  const displayWidth = BASE_PAGE_WIDTH * zoom;
  const dimensionsOf = (pageNumber) => pageDimensions[pageNumber] || FALLBACK_DIMENSIONS;
  const selected = elements.find((element) => element.id === selectedId) || null;

  useEffect(() => {
    if (!pdf) return undefined;
    let isCancelled = false;
    (async () => {
      const dimensions = {};
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        dimensions[pageNumber] = { w: viewport.width, h: viewport.height };
      }
      if (!isCancelled) setPageDimensions(dimensions);
    })().catch(() => null);
    return () => {
      isCancelled = true;
    };
  }, [pdf]);

  const pushHistory = (isForced) => {
    const history = historyRef.current;
    const now = Date.now();
    if (!isForced && now - history.lastPushedAt < HISTORY_MERGE_MILLISECONDS) return;
    history.lastPushedAt = now;
    history.stack.push(latestRef.current.elements);
    if (history.stack.length > HISTORY_LIMIT) history.stack.shift();
  };

  const undo = () => {
    const previous = historyRef.current.stack.pop();
    if (!previous) return;
    setElements(previous);
    setSelectedId(null);
    setEditingId(null);
  };

  const updateElement = (elementId, patch) => {
    pushHistory(false);
    setElements((previous) => previous.map((element) => (element.id === elementId ? { ...element, ...patch } : element)));
  };

  const removeElement = (elementId) => {
    pushHistory(true);
    setElements((previous) => previous.filter((element) => element.id !== elementId));
    setSelectedId(null);
    setEditingId(null);
  };

  const requestClose = () => {
    if (latestRef.current.elements.length > 0 && !window.confirm('Discard your edits?')) return;
    onClose();
  };

  latestRef.current = { elements, selectedId, tool, undo, removeElement, requestClose };

  useEffect(() => {
    const handleMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { rect } = drag;
      if (drag.mode === 'move') {
        const deltaX = (event.clientX - drag.startX) / rect.width;
        const deltaY = (event.clientY - drag.startY) / rect.height;
        setElements((previous) =>
          previous.map((element) =>
            element.id === drag.id
              ? {
                  ...element,
                  x: clampNumber(drag.origin.x + deltaX, 0, Math.max(0, 1 - element.w)),
                  y: clampNumber(drag.origin.y + deltaY, 0, Math.max(0, 1 - element.h)),
                }
              : element
          )
        );
        return;
      }
      const pointerX = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
      const pointerY = clampNumber((event.clientY - rect.top) / rect.height, 0, 1);
      const width = Math.abs(pointerX - drag.anchor.x);
      const height = drag.aspect
        ? (width * drag.dimensions.w) / (drag.aspect * drag.dimensions.h)
        : Math.abs(pointerY - drag.anchor.y);
      const x = pointerX < drag.anchor.x ? drag.anchor.x - width : drag.anchor.x;
      const y = pointerY < drag.anchor.y ? drag.anchor.y - height : drag.anchor.y;
      setElements((previous) =>
        previous.map((element) => (element.id === drag.id ? { ...element, x, y, w: width, h: height } : element))
      );
    };

    const handleUp = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      if (drag.mode !== 'create') return;
      setElements((previous) =>
        previous.map((element) => {
          if (element.id !== drag.id || element.w >= 0.02 || element.h >= 0.02) return element;
          const defaults = PDF_EDITOR_DEFAULT_SIZES[element.type];
          return { ...element, w: Math.min(defaults.w, 1 - element.x), h: Math.min(defaults.h, 1 - element.y) };
        })
      );
      setTool('select');
      setSelectedId(drag.id);
      if (drag.type === 'text') setEditingId(drag.id);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      const isTyping = tagName === 'TEXTAREA' || tagName === 'INPUT' || tagName === 'SELECT';
      const current = latestRef.current;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !isTyping) {
        event.preventDefault();
        event.stopPropagation();
        current.undo();
        return;
      }
      if (isTyping) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && current.selectedId) {
        event.preventDefault();
        event.stopPropagation();
        current.removeElement(current.selectedId);
        return;
      }
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (current.selectedId || current.tool !== 'select') {
          setSelectedId(null);
          setTool('select');
        } else {
          current.requestClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleOverlayPointerDown = (event, pageNumber) => {
    if (event.target !== event.currentTarget) return;
    setEditingId(null);
    if (tool === 'select') {
      setSelectedId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clampNumber((event.clientY - rect.top) / rect.height, 0, 1);
    const element = createPdfElement(tool, pageNumber, { x, y, w: 0, h: 0 });
    pushHistory(true);
    setElements((previous) => [...previous, element]);
    setSelectedId(element.id);
    dragRef.current = {
      mode: 'create',
      id: element.id,
      type: element.type,
      rect,
      anchor: { x, y },
      dimensions: dimensionsOf(pageNumber),
      aspect: 0,
    };
  };

  const handleElementPointerDown = (event, element) => {
    if (editingId === element.id) return;
    event.stopPropagation();
    setSelectedId(element.id);
    setTool('select');
    pushHistory(true);
    dragRef.current = {
      mode: 'move',
      id: element.id,
      rect: event.currentTarget.parentElement.getBoundingClientRect(),
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: element.x, y: element.y },
    };
  };

  const handleHandlePointerDown = (event, element, handle) => {
    event.stopPropagation();
    pushHistory(true);
    const image = element.type === 'image' ? images[element.imageKey] : null;
    dragRef.current = {
      mode: 'resize',
      id: element.id,
      rect: event.currentTarget.closest('.pdf-editor-layer').getBoundingClientRect(),
      anchor: getAnchor(handle, element),
      dimensions: dimensionsOf(element.page),
      aspect: image ? image.width / image.height : 0,
    };
  };

  const getVisiblePage = () => {
    const viewport = scrollRef.current.getBoundingClientRect();
    const center = viewport.top + viewport.height / 2;
    let bestPage = 1;
    let bestDistance = Infinity;
    Object.entries(pageRefs.current).forEach(([pageNumber, element]) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const distance = center < rect.top ? rect.top - center : center > rect.bottom ? center - rect.bottom : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPage = Number(pageNumber);
      }
    });
    return bestPage;
  };

  const handleImageChosen = async (file) => {
    if (!file) return;
    try {
      const image = await readImageFile(file);
      const imageKey = `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const pageNumber = getVisiblePage();
      const dimensions = dimensionsOf(pageNumber);
      const width = 0.3;
      const height = Math.min(0.9, (width * dimensions.w) / (image.width / image.height) / dimensions.h);
      setImages((previous) => ({ ...previous, [imageKey]: image }));
      pushHistory(true);
      const element = createPdfElement('image', pageNumber, {
        x: (1 - width) / 2,
        y: Math.max(0, (1 - height) / 2),
        w: width,
        h: height,
        imageKey,
      });
      setElements((previous) => [...previous, element]);
      setSelectedId(element.id);
      setNotice('');
    } catch (imageError) {
      setNotice(imageError.message);
    }
  };

  const buildPayload = () => {
    const usedImageKeys = new Set();
    const elementsByPage = new Map();
    elements.forEach(({ id, page, ...rest }) => {
      if (rest.type === 'image') usedImageKeys.add(rest.imageKey);
      elementsByPage.set(page, [...(elementsByPage.get(page) || []), rest]);
    });
    return {
      pages: [...elementsByPage].map(([pageNumber, pageElements]) => ({ pageNumber, elements: pageElements })),
      images: Object.fromEntries([...usedImageKeys].map((imageKey) => [imageKey, images[imageKey].dataUrl])),
    };
  };

  const handleSave = (asCopy) => {
    if (elements.length === 0 || isBusy) return;
    if (!asCopy && !window.confirm('Save over the original file? This cannot be undone.')) return;
    onSave({ ...buildPayload(), asCopy });
  };

  const renderElementBody = (element, scale) => {
    const strokePixels = (element.strokeWidth || 0) * scale;
    if (element.type === 'text') {
      const textStyle = {
        fontFamily: getFontCss(element.fontFamily),
        fontWeight: element.bold ? 700 : 400,
        fontStyle: element.italic ? 'italic' : 'normal',
        fontSize: element.size * scale,
        lineHeight: TEXT_LINE_HEIGHT_RATIO,
        color: element.color,
      };
      if (element.id === editingId) {
        return (
          <textarea
            className="pdf-editor-textarea"
            style={textStyle}
            autoFocus
            value={element.text}
            onChange={(event) => updateElement(element.id, { text: event.target.value })}
            onBlur={() => {
              setEditingId(null);
              if (!element.text.trim()) removeElement(element.id);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Escape') event.currentTarget.blur();
            }}
          />
        );
      }
      return (
        <div className="pdf-editor-text" style={textStyle}>
          {element.text || <span className="pdf-editor-placeholder">Text</span>}
        </div>
      );
    }
    if (element.type === 'image') {
      return (
        <img
          className="pdf-editor-image"
          src={images[element.imageKey]?.dataUrl}
          alt=""
          draggable={false}
          style={{ opacity: element.opacity }}
        />
      );
    }
    if (element.type === 'line') {
      return (
        <svg className="pdf-editor-line" width="100%" height="100%" preserveAspectRatio="none" style={{ opacity: element.opacity }}>
          <line
            x1="0"
            y1={element.flip ? '100%' : '0'}
            x2="100%"
            y2={element.flip ? '0' : '100%'}
            stroke={element.strokeColor}
            strokeWidth={Math.max(strokePixels, 0.5)}
          />
        </svg>
      );
    }
    return (
      <div
        className="pdf-editor-shape"
        style={{
          border: `${strokePixels}px solid ${element.strokeColor}`,
          background: element.fillColor || 'transparent',
          borderRadius: element.type === 'ellipse' ? '50%' : 0,
          opacity: element.opacity,
        }}
      />
    );
  };

  const renderProperties = () => {
    if (!selected) {
      return <span className="pdf-editor-hint">Pick a tool, then click or drag on a page. Double click text to edit it.</span>;
    }
    const patch = (values) => updateElement(selected.id, values);
    return (
      <>
        {selected.type === 'text' && (
          <>
            <select value={selected.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value })}>
              {PDF_EDITOR_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <label className="pdf-editor-field">
              Size
              <input
                type="number"
                min="4"
                max="300"
                value={selected.size}
                onChange={(event) => patch({ size: clampNumber(Number(event.target.value) || 4, 4, 300) })}
              />
            </label>
            <button
              type="button"
              className={`pdf-editor-toggle ${selected.bold ? 'active' : ''}`}
              onClick={() => patch({ bold: !selected.bold })}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              className={`pdf-editor-toggle ${selected.italic ? 'active' : ''}`}
              onClick={() => patch({ italic: !selected.italic })}
            >
              <i>I</i>
            </button>
            <label className="pdf-editor-field">
              Color
              <input type="color" value={selected.color} onChange={(event) => patch({ color: event.target.value })} />
            </label>
          </>
        )}
        {(selected.type === 'rect' || selected.type === 'ellipse' || selected.type === 'line') && (
          <>
            <label className="pdf-editor-field">
              Line
              <input
                type="color"
                value={selected.strokeColor}
                onChange={(event) => patch({ strokeColor: event.target.value })}
              />
            </label>
            <label className="pdf-editor-field">
              Width
              <input
                type="number"
                min="0"
                max="50"
                value={selected.strokeWidth}
                onChange={(event) => patch({ strokeWidth: clampNumber(Number(event.target.value) || 0, 0, 50) })}
              />
            </label>
            {selected.type !== 'line' && (
              <>
                <label className="pdf-editor-field">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.fillColor)}
                    onChange={(event) => patch({ fillColor: event.target.checked ? '#ffffff' : null })}
                  />
                  Fill
                </label>
                {selected.fillColor && (
                  <input type="color" value={selected.fillColor} onChange={(event) => patch({ fillColor: event.target.value })} />
                )}
              </>
            )}
            {selected.type === 'line' && (
              <label className="pdf-editor-field">
                <input type="checkbox" checked={selected.flip} onChange={(event) => patch({ flip: event.target.checked })} />
                Flip
              </label>
            )}
          </>
        )}
        {selected.type !== 'text' && (
          <label className="pdf-editor-field">
            Opacity
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={selected.opacity}
              onChange={(event) => patch({ opacity: Number(event.target.value) })}
            />
          </label>
        )}
        <button type="button" className="pdf-editor-button danger" onClick={() => removeElement(selected.id)}>
          Delete
        </button>
      </>
    );
  };

  return (
    <div className="pdf-editor-overlay">
      <div className="pdf-editor-bar">
        <span className="pdf-editor-title" title={buildDocumentFileLabel(documentItem)}>
          {buildDocumentFileLabel(documentItem)}
        </span>
        {TOOLS.map((toolItem) => (
          <button
            key={toolItem.key}
            type="button"
            className={`pdf-editor-button ${tool === toolItem.key ? 'active' : ''}`}
            onClick={() => setTool(toolItem.key)}
          >
            {toolItem.label}
          </button>
        ))}
        <button type="button" className="pdf-editor-button" onClick={() => imageInputRef.current?.click()}>
          Image
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            handleImageChosen(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <button type="button" className="pdf-editor-button" onClick={undo}>
          Undo
        </button>
        <span className="pdf-editor-spacer" />
        <button
          type="button"
          className="pdf-editor-button"
          disabled={zoom <= MINIMUM_ZOOM}
          onClick={() => setZoom((previous) => Math.max(MINIMUM_ZOOM, previous - ZOOM_STEP))}
        >
          −
        </button>
        <span className="pdf-editor-zoom">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="pdf-editor-button"
          disabled={zoom >= MAXIMUM_ZOOM}
          onClick={() => setZoom((previous) => Math.min(MAXIMUM_ZOOM, previous + ZOOM_STEP))}
        >
          +
        </button>
        <button
          type="button"
          className="pdf-editor-button primary"
          disabled={isBusy || elements.length === 0}
          onClick={() => handleSave(true)}
        >
          {isBusy ? 'Saving...' : 'Save as copy'}
        </button>
        <button
          type="button"
          className="pdf-editor-button primary"
          disabled={isBusy || elements.length === 0}
          onClick={() => handleSave(false)}
        >
          Save
        </button>
        <button type="button" className="pdf-editor-button" onClick={requestClose}>
          Close
        </button>
      </div>

      <div className="pdf-editor-properties">
        {notice && <span className="pdf-editor-notice">{notice}</span>}
        {renderProperties()}
      </div>

      <div className={`pdf-editor-scroll ${tool !== 'select' ? 'drawing' : ''}`} ref={scrollRef}>
        {isLoading || error ? (
          <div className="pdf-editor-message">{error || 'Loading pages...'}</div>
        ) : (
          pages.map((entry) => {
            const scale = displayWidth / dimensionsOf(entry.pageNumber).w;
            return (
              <div
                key={entry.key}
                className="pdf-editor-page"
                style={{ width: displayWidth }}
                ref={(node) => {
                  pageRefs.current[entry.pageNumber] = node;
                }}
              >
                <PdfPageCanvas pdf={pdf} pageNumber={entry.pageNumber} width={displayWidth} lazy />
                <div
                  className="pdf-editor-layer"
                  onPointerDown={(event) => handleOverlayPointerDown(event, entry.pageNumber)}
                >
                  {elements
                    .filter((element) => element.page === entry.pageNumber)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`pdf-editor-element ${element.id === selectedId ? 'selected' : ''}`}
                        style={{
                          left: `${element.x * 100}%`,
                          top: `${element.y * 100}%`,
                          width: `${element.w * 100}%`,
                          height: `${element.h * 100}%`,
                        }}
                        onPointerDown={(event) => handleElementPointerDown(event, element)}
                        onDoubleClick={() => {
                          if (element.type !== 'text') return;
                          pushHistory(true);
                          setEditingId(element.id);
                        }}
                      >
                        {renderElementBody(element, scale)}
                        {element.id === selectedId &&
                          editingId !== element.id &&
                          HANDLES.map((handle) => (
                            <span
                              key={handle}
                              className={`pdf-editor-handle ${handle}`}
                              onPointerDown={(event) => handleHandlePointerDown(event, element, handle)}
                            />
                          ))}
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PdfEditor;