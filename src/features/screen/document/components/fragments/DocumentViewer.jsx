import { useEffect, useRef, useState } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import { usePdfPages } from '../../hooks/usePdfPages';
import { isPdfDocument, buildDocumentFileLabel } from '../../helper/document.helper';
import DocumentFilePreview from './DocumentFilePreview';
import { DIALOG_BUTTON_PROPS } from '../../constants/document.constant';
import PdfPageCanvas from './PdfPageCanvas';

const THUMB_WIDTH = 190;
const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const SHIFT_STEP = 5;

const ROUND_BUTTON_PROPS = {
  variant: 'gradient',
  colorScheme: 'black-200',
  textColor: 'white-200',
  iconColor: 'white-200',
  rounded: 'full',
  padding: '0',
  animation: '',
  font: '2xl',
};

const ZOOM_BUTTON_PROPS = { ...ROUND_BUTTON_PROPS, font: 'lg', width: '38px', height: '38px' };

const FOOTER_BUTTON_PROPS = { ...DIALOG_BUTTON_PROPS, width: 'fit-content', padding: '0 22px' };

function DocumentViewer({
  mode,
  documents,
  isBusy,
  hasPrevFile,
  hasNextFile,
  onNavigate,
  onDownload,
  onClose,
  onSave,
  onSplitSelected,
  onSplitAll,
  onConfirmMerge,
}) {
  const primary = documents[0];
  const isPdfFlow = mode === 'merge' || isPdfDocument(primary);
  const { pages: loadedPages, pdfs, isLoading, error } = usePdfPages(documents, isPdfFlow);

  const [pages, setPages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [notice, setNotice] = useState('');
  const [zoom, setZoom] = useState(1);
  const [box, setBox] = useState(null);
  const thumbsRef = useRef(null);
  const mainRef = useRef(null);
  const keyHandlerRef = useRef(null);

  const canEdit = mode !== 'split';
  const showFileNav = mode === 'view' && (hasPrevFile || hasNextFile);
  const isDirty =
    pages.length !== loadedPages.length ||
    pages.some((entry, index) => entry.key !== loadedPages[index]?.key || (entry.rotation || 0) !== 0);
  const activeEntry = pages[activeIndex];

  useEffect(() => {
    setPages(loadedPages);
    setActiveIndex(0);
    setCheckedKeys([]);
    setNotice('');
  }, [loadedPages]);

  useEffect(() => {
    setZoom(1);
  }, [primary._id]);

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

  useEffect(() => {
    const element = mainRef.current;
    if (!element) return undefined;
    const measure = () => {
      const style = window.getComputedStyle(element);
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setBox({
        width: Math.max(element.clientWidth - horizontalPadding, 100),
        height: Math.max(element.clientHeight - verticalPadding, 100),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isLoading, error, isPdfFlow]);

  const changeZoom = (delta) =>
    setZoom((previous) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((previous + delta) * 100) / 100)));

  const requestClose = () => {
    if (mode === 'view' && isDirty && !window.confirm('Discard unsaved changes?')) return;
    onClose();
  };

  const navigateFile = (direction) => {
    if (mode !== 'view' || isBusy) return;
    if (direction < 0 ? !hasPrevFile : !hasNextFile) return;
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    onNavigate(direction);
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

  const rotatePages = (shouldRotate) => {
    if (!canEdit) return;
    setPages((previous) =>
      previous.map((entry, index) =>
        shouldRotate(entry, index) ? { ...entry, rotation: ((entry.rotation || 0) + 90) % 360 } : entry
      )
    );
  };

  const toggleChecked = (key) =>
    setCheckedKeys((previous) =>
      previous.includes(key) ? previous.filter((checkedKey) => checkedKey !== key) : [...previous, key]
    );

  const handleThumbClick = (event, index, entry) => {
    if (event.metaKey || event.ctrlKey) {
      setCheckedKeys((previous) => {
        const base = previous.length === 0 && pages[activeIndex] ? [pages[activeIndex].key] : previous;
        return base.includes(entry.key) ? base.filter((key) => key !== entry.key) : [...base, entry.key];
      });
      setActiveIndex(index);
      return;
    }
    setCheckedKeys([]);
    setActiveIndex(index);
  };

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
    if (isBusy) return;

    if (mode === 'view' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      navigateFile(event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }

    if (!isPdfFlow) return;

    if (event.altKey && (event.ctrlKey || event.metaKey)) {
      if (event.code === 'Equal' || event.code === 'NumpadAdd') {
        event.preventDefault();
        changeZoom(ZOOM_STEP);
        return;
      }
      if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
        event.preventDefault();
        changeZoom(-ZOOM_STEP);
        return;
      }
    }

    if (event.key.toLowerCase() === 'r' && canEdit && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      rotatePages((_, index) => index === activeIndex);
      return;
    }

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
    } else if (event.key === 'Delete' && canEdit) {
      removePage(activeIndex);
    }
  };

  const title =
    mode === 'merge'
      ? `Merge ${documents.length} documents`
      : `${buildDocumentFileLabel(primary)}${mode === 'split' ? ' · Split' : ''}`;

  const renderHeader = () => (
    <div className="doc-viewer-header">
      <h2>{title}</h2>
    </div>
  );

  const renderFileNav = () => (
    <>
      <div className="doc-viewer-nav-slot prev">
        {isPdfFlow && (
          <Button
            {...ROUND_BUTTON_PROPS}
            width="56px"
            height="56px"
            iconCenter="expand_less"
            title="Previous page"
            disabled={activeIndex <= 0}
            onClick={() => goTo(activeIndex - 1)}
          />
        )}
        {showFileNav && (
          <Button
            {...ROUND_BUTTON_PROPS}
            width="56px"
            height="56px"
            iconCenter="chevron_left"
            title="Previous file"
            disabled={!hasPrevFile || isBusy}
            onClick={() => navigateFile(-1)}
          />
        )}
      </div>
      <div className="doc-viewer-nav-slot next">
        {showFileNav && (
          <Button
            {...ROUND_BUTTON_PROPS}
            width="56px"
            height="56px"
            iconCenter="chevron_right"
            title="Next file"
            disabled={!hasNextFile || isBusy}
            onClick={() => navigateFile(1)}
          />
        )}
        {isPdfFlow && (
          <Button
            {...ROUND_BUTTON_PROPS}
            width="56px"
            height="56px"
            iconCenter="expand_more"
            title="Next page"
            disabled={activeIndex >= pages.length - 1}
            onClick={() => goTo(activeIndex + 1)}
          />
        )}
      </div>
    </>
  );

  const renderFooter = () => {
    if (isLoading || error) return null;
    return (
      <div className="doc-viewer-footer">
        {notice && <div className="doc-viewer-error">{notice}</div>}

        <Button
          {...FOOTER_BUTTON_PROPS}
          componentIconCenter={checkedKeys.length === pages.length ? 'CancelAllIcon' : 'SelectMultipleIcon'}
          componentIconSize="40"
          colorScheme="yellow-700"
          iconColor="primary-200"
          width="fit-content"
          disabled={isBusy}
          onClick={toggleAllChecked}
        />

        {canEdit && (
          <>
            <Button
              {...FOOTER_BUTTON_PROPS}
              componentIconCenter="RotateClockWiseIcon"
              componentIconSize="40"
              colorScheme="yellow-700"
              iconColor="primary-200"
              width="fit-content"
              disabled={isBusy}
              onClick={() => rotatePages((_, index) => index === activeIndex)}
            />
            <Button
              {...FOOTER_BUTTON_PROPS}
              componentIconCenter="RotateClockWiseFilledIcon"
              componentIconSize="40"
              colorScheme="yellow-700"
              iconColor="primary-200"
              width="fit-content"
              disabled={isBusy || checkedKeys.length === 0}
              onClick={() => rotatePages((entry) => checkedKeys.includes(entry.key))}
            />
            <Button
              {...FOOTER_BUTTON_PROPS}
              componentIconCenter="RotateAllIcon"
              componentIconSize="40"
              colorScheme="yellow-700"
              iconColor="primary-200"
              width="fit-content"
              disabled={isBusy}
              onClick={() => rotatePages(() => true)}
            />
            <Button
              {...FOOTER_BUTTON_PROPS}
              componentIconCenter="IconlyDelete"
              componentIconSize="40"
              colorScheme="yellow-700"
              iconColor="primary-100"
              width="fit-content"
              disabled={isBusy || pages.length <= 1}
              onClick={() => removePage(activeIndex)}
            />
          </>
        )}

        {mode === 'view' && (
          <Button
            {...FOOTER_BUTTON_PROPS}
            text={isBusy ? 'Saving...' : 'Save Changes'}
            colorScheme="success-700"
            componentIconLeft="IconlyUpload"
            componentIconSize="30"
            iconColor="primary-100"
            disabled={isBusy || !isDirty}
            onClick={() =>
              onSave(
                primary._id,
                pages.map((entry) => ({ pageNumber: entry.pageNumber, rotation: entry.rotation || 0 }))
              )
            }
          />
        )}

        {mode === 'split' && (
          <>
            <Button
              {...FOOTER_BUTTON_PROPS}
              text={`(${checkedPageNumbers.length})`}
              colorScheme="yellow-700"
              componentIconLeft="SplitIcon"
              componentIconSize="30"
              iconColor="primary-100"
              disabled={isBusy || checkedPageNumbers.length === 0}
              onClick={() => onSplitSelected(primary._id, checkedPageNumbers)}
            />
            <Button
              {...FOOTER_BUTTON_PROPS}
              text="Split All"
              componentIconLeft="SplitAllIcon"
              componentIconSize="30"
              iconColor="primary-100"
              colorScheme="yellow-700"
              disabled={isBusy}
              onClick={() => onSplitAll(primary._id, pages.length)}
            />
          </>
        )}

        {mode === 'merge' && (
          <>
            <Button
              {...FOOTER_BUTTON_PROPS}
              text="Cancel"
              colorScheme="warning-700"
              disabled={isBusy}
              onClick={requestClose}
            />
            <Button
              {...FOOTER_BUTTON_PROPS}
              text={isBusy ? 'Merging...' : `Confirm Merge (${pages.length})`}
              colorScheme="success-700"
              componentIconLeft="MergeIcon"
              componentIconSize="30"
              iconColor="primary-100"
              disabled={isBusy || pages.length === 0}
              onClick={() =>
                onConfirmMerge(
                  pages.map((entry) => ({
                    documentId: entry.documentId,
                    pageNumber: entry.pageNumber,
                    rotation: entry.rotation || 0,
                  }))
                )
              }
            />
          </>
        )}
      </div>
    );
  };

  const renderBody = () => {
    if (!isPdfFlow) {
      return (
        <div className="doc-viewer-body">
          <div className="doc-viewer-right">
            {renderHeader()}
            <div className="doc-viewer-stage">
              {renderFileNav()}
              <div className="doc-viewer-main">
                <DocumentFilePreview key={primary._id} documentItem={primary} onDownload={() => onDownload(primary)} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading || error) {
      return (
        <div className="doc-viewer-body">
          <div className="doc-viewer-right">
            {renderHeader()}
            <div className="doc-viewer-message">{error || 'Loading pages...'}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="doc-viewer-body">
        <div className="doc-viewer-thumbs" ref={thumbsRef}>
          {pages.map((entry, index) => (
            <div
              key={entry.key}
              className={`doc-viewer-thumb${index === activeIndex ? ' active' : ''}${checkedKeys.includes(entry.key) ? ' selected' : ''}${dragOver === index && dragFrom !== index ? ' drag-over' : ''}`}
              draggable={canEdit && !isBusy}
              onClick={(event) => handleThumbClick(event, index, entry)}
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
                <PdfPageCanvas
                  pdf={pdfs[entry.documentId]}
                  pageNumber={entry.pageNumber}
                  width={THUMB_WIDTH}
                  rotation={entry.rotation || 0}
                  lazy
                />
                {canEdit && (
                  <div className="doc-viewer-thumb-remove">
                    <Button
                      {...ROUND_BUTTON_PROPS}
                      colorScheme="error-700"
                      font="xs"
                      width="24px"
                      height="24px"
                      iconCenter="close"
                      title="Remove page"
                      onClick={(event) => {
                        event.stopPropagation();
                        removePage(index);
                      }}
                    />
                  </div>
                )}
              </div>
              <span className="doc-viewer-thumb-label">{index + 1}</span>
              {mode === 'merge' && <span className="doc-viewer-thumb-doc">{entry.documentName}</span>}
            </div>
          ))}
        </div>

        <div className="doc-viewer-right">
          {renderHeader()}
          <div className="doc-viewer-stage">
            {renderFileNav()}

            <div className="doc-viewer-main" ref={mainRef}>
              {activeEntry && box && (
                <PdfPageCanvas
                  pdf={pdfs[activeEntry.documentId]}
                  pageNumber={activeEntry.pageNumber}
                  box={box}
                  zoom={zoom}
                  rotation={activeEntry.rotation || 0}
                />
              )}
            </div>

            <div className="doc-viewer-zoom">
              <Button
                {...ZOOM_BUTTON_PROPS}
                iconCenter="remove"
                title="Zoom out"
                colorScheme="yellow-200"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => changeZoom(-ZOOM_STEP)}
              />
              <Button
                {...ZOOM_BUTTON_PROPS}
                width="70px"
                text={`${Math.round(zoom * 100)}%`}
                title="Reset zoom"
                colorScheme="yellow-200"
                onClick={() => setZoom(1)}
              />
              <Button
                {...ZOOM_BUTTON_PROPS}
                iconCenter="add"
                title="Zoom in"
                colorScheme="yellow-200"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => changeZoom(ZOOM_STEP)}
              />
            </div>

            <div className="doc-viewer-page-counter">
              {activeIndex + 1} / {pages.length}
            </div>
          </div>

          {renderFooter()}
        </div>
      </div>
    );
  };

  return (
    <div className="doc-viewer-overlay" onClick={requestClose}>
      <div className="doc-viewer-content" onClick={(event) => event.stopPropagation()}>
        <div className="doc-viewer-close">
          <Button
            {...ROUND_BUTTON_PROPS}
            width="50px"
            height="50px"
            iconCenter="close"
            title="Close"
            onClick={requestClose}
          />
        </div>

        {renderBody()}
      </div>
    </div>
  );
}

export default DocumentViewer;