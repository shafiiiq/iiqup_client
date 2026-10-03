import { useEffect, useRef, useState } from 'react';
import { usePdfPages } from '../../hooks/usePdfPages';
import { isPdfDocument, isImageDocument, buildDocumentFileLabel } from '../../helper/document.helper';
import PdfPageCanvas from './PdfPageCanvas';

const THUMB_WIDTH = 190;
const MAIN_WIDTH = 820;
const SHIFT_STEP = 5;

function DocumentViewer({ mode, documents, isBusy, onClose, onSave, onSplitSelected, onSplitAll, onConfirmMerge }) {
  const primary = documents[0];
  const isPdfFlow = mode === 'merge' || isPdfDocument(primary);
  const { pages: loadedPages, pdfs, isLoading, error } = usePdfPages(documents, isPdfFlow);

  const [pages, setPages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [notice, setNotice] = useState('');
  const thumbsRef = useRef(null);
  const keyHandlerRef = useRef(null);

  const canEdit = mode !== 'split';
  const isDirty =
    pages.length !== loadedPages.length || pages.some((entry, index) => entry.key !== loadedPages[index]?.key);
  const activeEntry = pages[activeIndex];

  useEffect(() => {
    setPages(loadedPages);
    setActiveIndex(0);
    setCheckedKeys([]);
  }, [loadedPages]);

  useEffect(() => {
    const handleKeyDown = (event) => keyHandlerRef.current?.(event);
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    thumbsRef.current
      ?.querySelector('.doc-viewer-thumb.active')
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex, pages]);

  const requestClose = () => {
    if (mode === 'view' && isDirty && !window.confirm('Discard unsaved changes?')) return;
    onClose();
  };

  const goTo = (index) => setActiveIndex(Math.max(0, Math.min(index, pages.length - 1)));

  const reorder = (from, to) => {
    if (!canEdit || from === null) return;
    const target = Math.max(0, Math.min(to, pages.length - 1));
    if (target === from) return;
    const next = [...pages];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    setPages(next);
    setActiveIndex(target);
  };

  const removePage = (index) => {
    if (!canEdit) return;
    if (pages.length <= 1) {
      setNotice('At least one page must remain');
      return;
    }
    setNotice('');
    setPages(pages.filter((_, pageIndex) => pageIndex !== index));
    setActiveIndex(Math.min(index, pages.length - 2));
  };

  const toggleChecked = (key) =>
    setCheckedKeys((previous) =>
      previous.includes(key) ? previous.filter((checkedKey) => checkedKey !== key) : [...previous, key]
    );

  const toggleAllChecked = () =>
    setCheckedKeys(checkedKeys.length === pages.length ? [] : pages.map((entry) => entry.key));

  const checkedPageNumbers = pages
    .filter((entry) => checkedKeys.includes(entry.key))
    .map((entry) => entry.pageNumber)
    .sort((first, second) => first - second);

  keyHandlerRef.current = (event) => {
    if (event.key === 'Escape') {
      requestClose();
      return;
    }
    if (isBusy || !isPdfFlow) return;
    const step = event.shiftKey ? SHIFT_STEP : 1;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const target = activeIndex + (event.key === 'ArrowUp' ? -step : step);
      if (canEdit) reorder(activeIndex, target);
      else goTo(target);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : pages.length - 1;
      if (canEdit) reorder(activeIndex, target);
      else goTo(target);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === 'Delete' && canEdit) {
      removePage(activeIndex);
    }
  };

  const title =
    mode === 'merge'
      ? `Merge ${documents.length} documents`
      : `${buildDocumentFileLabel(primary)}${mode === 'split' ? ' · Split' : ''}`;

  const renderBody = () => {
    if (!isPdfFlow) {
      return isImageDocument(primary) ? (
        <div className="doc-viewer-main">
          <img className="doc-viewer-image" src={primary.fileUrl} alt={primary.displayName} />
        </div>
      ) : (
        <div className="doc-viewer-message">Preview is not available for this file type</div>
      );
    }
    if (isLoading) return <div className="doc-viewer-message">Loading pages...</div>;
    if (error) return <div className="doc-viewer-message">{error}</div>;

    return (
      <div className="doc-viewer-body">
        <div className="doc-viewer-thumbs" ref={thumbsRef}>
          {pages.map((entry, index) => (
            <div
              key={entry.key}
              className={`doc-viewer-thumb${index === activeIndex ? ' active' : ''}${dragOver === index && dragFrom !== index ? ' drag-over' : ''}`}
              draggable={canEdit && !isBusy}
              onClick={() => setActiveIndex(index)}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', String(index));
                setDragFrom(index);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const from = dragFrom;
                setDragFrom(null);
                setDragOver(null);
                reorder(from, index);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
            >
              <div className="doc-viewer-thumb-frame">
                <PdfPageCanvas pdf={pdfs[entry.documentId]} pageNumber={entry.pageNumber} width={THUMB_WIDTH} lazy />
                {mode === 'split' && (
                  <input
                    type="checkbox"
                    className="doc-viewer-thumb-check"
                    checked={checkedKeys.includes(entry.key)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggleChecked(entry.key)}
                  />
                )}
                {canEdit && (
                  <button
                    type="button"
                    className="doc-viewer-thumb-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      removePage(index);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="doc-viewer-thumb-label">{index + 1}</span>
              {mode === 'merge' && <span className="doc-viewer-thumb-doc">{entry.documentName}</span>}
            </div>
          ))}
        </div>

        <div className="doc-viewer-main">
          {activeEntry && (
            <PdfPageCanvas pdf={pdfs[activeEntry.documentId]} pageNumber={activeEntry.pageNumber} width={MAIN_WIDTH} />
          )}
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (!isPdfFlow || isLoading || error) return null;
    return (
      <div className="doc-viewer-footer">
        {notice && <div className="doc-viewer-error">{notice}</div>}

        {mode === 'view' && (
          <>
            <button
              type="button"
              className="doc-viewer-btn secondary"
              disabled={isBusy || pages.length <= 1}
              onClick={() => removePage(activeIndex)}
            >
              Remove Page
            </button>
            <button
              type="button"
              className="doc-viewer-btn primary"
              disabled={isBusy || !isDirty}
              onClick={() => onSave(primary._id, pages.map((entry) => entry.pageNumber))}
            >
              {isBusy ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        )}

        {mode === 'split' && (
          <>
            <button type="button" className="doc-viewer-btn secondary" disabled={isBusy} onClick={toggleAllChecked}>
              {checkedKeys.length === pages.length ? 'Clear' : 'Select All'}
            </button>
            <button
              type="button"
              className="doc-viewer-btn primary"
              disabled={isBusy || checkedPageNumbers.length === 0}
              onClick={() => onSplitSelected(primary._id, checkedPageNumbers)}
            >
              {`Split Selected (${checkedPageNumbers.length})`}
            </button>
            <button
              type="button"
              className="doc-viewer-btn primary"
              disabled={isBusy}
              onClick={() => onSplitAll(primary._id, pages.length)}
            >
              Split All
            </button>
          </>
        )}

        {mode === 'merge' && (
          <>
            <button
              type="button"
              className="doc-viewer-btn secondary"
              disabled={isBusy || pages.length <= 1}
              onClick={() => removePage(activeIndex)}
            >
              Remove Page
            </button>
            <button type="button" className="doc-viewer-btn secondary" disabled={isBusy} onClick={requestClose}>
              Cancel
            </button>
            <button
              type="button"
              className="doc-viewer-btn primary"
              disabled={isBusy || pages.length === 0}
              onClick={() =>
                onConfirmMerge(pages.map((entry) => ({ documentId: entry.documentId, pageNumber: entry.pageNumber })))
              }
            >
              {isBusy ? 'Merging...' : `Confirm Merge (${pages.length})`}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="doc-viewer-overlay" onClick={requestClose}>
      <div className="doc-viewer-content" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="doc-viewer-close" onClick={requestClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        <div className="doc-viewer-header">
          <h2>{title}</h2>
          {isPdfFlow && pages.length > 0 && (
            <span className="doc-viewer-counter">
              {activeIndex + 1} / {pages.length}
            </span>
          )}
        </div>

        {renderBody()}
        {renderFooter()}
      </div>
    </div>
  );
}

export default DocumentViewer;