// ─────────────────────────────────────────────────────────────────────────────
// Viewer.jsx — Native-feel file preview window
// Renders as a draggable, resizable OS-style window with:
//   • Mac traffic-light controls (close / minimise / maximise) on the LEFT
//   • File name centred in the title bar
//   • Action toolbar (copy / share / edit / print / info) on the RIGHT
//   • Transparent preview body — no background colour behind media
//   • Supports: image, PDF, video, audio, text/code, office, unknown
// Controlled externally via `file` prop — pass null to close.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useCallback, useState, useRef } from 'react';
import './Viewer.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Derives the broad preview category from a file's MIME type or extension. */
const getFileCategory = (file) => {
  const mime = file.type || '';
  const ext  = file.name.split('.').pop().toLowerCase();

  if (mime.startsWith('image/'))                                             return 'image';
  if (mime === 'application/pdf' || ext === 'pdf')                          return 'pdf';
  if (mime.startsWith('video/'))                                             return 'video';
  if (mime.startsWith('audio/'))                                             return 'audio';
  if (mime.startsWith('text/') || ['js','jsx','ts','tsx','json',
      'html','css','md','txt','csv','xml','yaml','yml'].includes(ext))       return 'text';
  if (['xlsx','xls','docx','doc','pptx','ppt'].includes(ext))               return 'office';
  return 'unknown';
};

/** Material Symbol icon for a file category. */
const getCategoryIcon = (category) => ({
  image:   'image',
  pdf:     'picture_as_pdf',
  video:   'smart_display',
  audio:   'audio_file',
  text:    'code',
  office:  'description',
  unknown: 'draft',
}[category] ?? 'draft');

/** Human-readable file size. */
const formatFileSize = (bytes) => {
  if (!bytes)            return '—';
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-renderers — one per category, all transparent backgrounds
// ─────────────────────────────────────────────────────────────────────────────

const ImagePreview = ({ src, name }) => (
  <div className="viewer__body-image">
    <img src={src} alt={name} className="viewer__image" draggable={false} />
  </div>
);

const PdfPreview = ({ src }) => (
  <iframe src={src} className="viewer__iframe" title="PDF Preview" />
);

const VideoPreview = ({ src, type }) => (
  <div className="viewer__body-media">
    <video controls className="viewer__video">
      <source src={src} type={type} />
    </video>
  </div>
);

const AudioPreview = ({ src, type, name }) => (
  <div className="viewer__body-audio">
    <span className="material-symbols-rounded viewer__audio-icon">audio_file</span>
    <p className="viewer__audio-name">{name}</p>
    <audio controls className="viewer__audio">
      <source src={src} type={type} />
    </audio>
  </div>
);

const TextPreview = ({ content }) => (
  <div className="viewer__body-text">
    <pre className="viewer__code"><code>{content}</code></pre>
  </div>
);

const OfficePreview = ({ name, ext }) => (
  <div className="viewer__body-unsupported">
    <span className="material-symbols-rounded viewer__unsupported-icon">description</span>
    <p className="viewer__unsupported-title">{name}</p>
    <p className="viewer__unsupported-msg">
      {ext.toUpperCase()} files cannot be previewed in the browser.
      Download to open in the appropriate application.
    </p>
  </div>
);

const UnknownPreview = ({ name }) => (
  <div className="viewer__body-unsupported">
    <span className="material-symbols-rounded viewer__unsupported-icon">draft</span>
    <p className="viewer__unsupported-title">{name}</p>
    <p className="viewer__unsupported-msg">No preview available for this file type.</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Viewer Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object}        props
 * @param {File|null}     props.file         — File to preview; null = hidden
 * @param {string|null}   props.objectUrl    — Pre-created object URL
 * @param {string|null}   props.textContent  — Pre-read text (for text category)
 * @param {Function}      props.onClose      — Called when window is closed
 * @param {Function}      [props.onDownload] — Optional download handler
 */
const Viewer = ({ file, objectUrl, textContent, onClose, onDownload }) => {

  // ── Window state ───────────────────────────────────────────────────────────

  const [isMaximised, setIsMaximised] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [showInfo,    setShowInfo]    = useState(false);

  // ── Drag state ─────────────────────────────────────────────────────────────

  const windowRef   = useRef(null);
  const dragOffset  = useRef({ x: 0, y: 0 });
  const isDragging  = useRef(false);
  const [position,  setPosition]  = useState({ x: null, y: null }); // null = CSS-centered

  // ── Reset state when a new file is opened ─────────────────────────────────

  useEffect(() => {
    if (file) {
      setIsMaximised(false);
      setIsMinimised(false);
      setShowInfo(false);
      setPosition({ x: null, y: null });
    }
  }, [file]);

  // ── Keyboard: Escape closes, F = toggle fullscreen ────────────────────────

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'f' || e.key === 'F') setIsMaximised((p) => !p);
  }, [onClose]);

  useEffect(() => {
    if (!file) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [file, handleKeyDown]);

  // ── Drag — title bar ──────────────────────────────────────────────────────

  const handleTitleBarMouseDown = (e) => {
    // Only drag on left click on the bar itself (not buttons)
    if (e.target.closest('.viewer__traffic') || e.target.closest('.viewer__toolbar-btn')) return;
    if (isMaximised) return;

    const rect = windowRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDragging.current = true;

    const onMove = (ev) => {
      if (!isDragging.current) return;
      setPosition({
        x: ev.clientX - dragOffset.current.x,
        y: ev.clientY - dragOffset.current.y,
      });
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Copy file name to clipboard ───────────────────────────────────────────

  const handleCopyName = () => {
    if (file) navigator.clipboard?.writeText(file.name);
  };

  // ── Print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    if (!objectUrl) return;
    const win = window.open(objectUrl, '_blank');
    win?.print();
  };

  // ── Nothing to show ───────────────────────────────────────────────────────

  if (!file) return null;

  const category = getFileCategory(file);
  const ext      = file.name.split('.').pop().toLowerCase();

  // ── Window positioning style ──────────────────────────────────────────────

  const windowStyle = isMaximised
    ? {}
    : position.x !== null
      ? { left: position.x, top: position.y, transform: 'none' }
      : {};

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={[
        'viewer__overlay',
        isMaximised ? 'viewer__overlay--maximised' : '',
        isMinimised ? 'viewer__overlay--minimised' : '',
      ].filter(Boolean).join(' ')}
      onClick={(e) => { if (e.target === e.currentTarget && !isMaximised) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${file.name}`}
    >
      <div
        ref={windowRef}
        className={[
          'viewer__window',
          isMaximised ? 'viewer__window--maximised' : '',
          isMinimised ? 'viewer__window--minimised' : '',
        ].filter(Boolean).join(' ')}
        style={windowStyle}
      >

        {/* ── Title bar ─────────────────────────────────────────────────── */}
        <div
          className="viewer__titlebar"
          onMouseDown={handleTitleBarMouseDown}
        >

          {/* Left — traffic-light controls */}
          <div className="viewer__traffic">
            {/* Close — red */}
            <button
              className="viewer__traffic-btn viewer__traffic-btn--close"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <span className="viewer__traffic-icon material-symbols-rounded">close</span>
            </button>

            {/* Minimise — yellow */}
            <button
              className="viewer__traffic-btn viewer__traffic-btn--minimise"
              onClick={() => setIsMinimised((p) => !p)}
              title="Minimise"
              aria-label="Minimise"
            >
              <span className="viewer__traffic-icon material-symbols-rounded">remove</span>
            </button>

            {/* Maximise — green */}
            <button
              className="viewer__traffic-btn viewer__traffic-btn--maximise"
              onClick={() => { setIsMaximised((p) => !p); setIsMinimised(false); }}
              title={isMaximised ? 'Restore' : 'Maximise'}
              aria-label={isMaximised ? 'Restore' : 'Maximise'}
            >
              <span className="viewer__traffic-icon material-symbols-rounded">
                {isMaximised ? 'close_fullscreen' : 'open_in_full'}
              </span>
            </button>
          </div>

          {/* Centre — file name + category icon */}
          <div className="viewer__titlebar-center">
            <span className="material-symbols-rounded viewer__titlebar-icon">
              {getCategoryIcon(category)}
            </span>
            <span className="viewer__titlebar-name" title={file.name}>
              {file.name}
            </span>
            <span className="viewer__titlebar-size">{formatFileSize(file.size)}</span>
          </div>

          {/* Right — file action toolbar */}
          <div className="viewer__toolbar">
            {onDownload && (
              <button
                className="viewer__toolbar-btn"
                onClick={onDownload}
                title="Download"
              >
                <span className="material-symbols-rounded">download</span>
                <span className="viewer__toolbar-label">Download</span>
              </button>
            )}

            <button className="viewer__toolbar-btn" onClick={handleCopyName} title="Copy name">
              <span className="material-symbols-rounded">content_copy</span>
              <span className="viewer__toolbar-label">Copy</span>
            </button>

            <button className="viewer__toolbar-btn" onClick={handlePrint} title="Print">
              <span className="material-symbols-rounded">print</span>
              <span className="viewer__toolbar-label">Print</span>
            </button>

            <button
              className={`viewer__toolbar-btn ${showInfo ? 'viewer__toolbar-btn--active' : ''}`}
              onClick={() => setShowInfo((p) => !p)}
              title="File info"
            >
              <span className="material-symbols-rounded">info</span>
              <span className="viewer__toolbar-label">Info</span>
            </button>
          </div>
        </div>

        {/* ── Info panel (slides in under title bar) ─────────────────────── */}
        {showInfo && (
          <div className="viewer__info-panel">
            <div className="viewer__info-row">
              <span className="viewer__info-key">Name</span>
              <span className="viewer__info-val">{file.name}</span>
            </div>
            <div className="viewer__info-row">
              <span className="viewer__info-key">Type</span>
              <span className="viewer__info-val">{file.type || ext.toUpperCase() || '—'}</span>
            </div>
            <div className="viewer__info-row">
              <span className="viewer__info-key">Size</span>
              <span className="viewer__info-val">{formatFileSize(file.size)}</span>
            </div>
            <div className="viewer__info-row">
              <span className="viewer__info-key">Modified</span>
              <span className="viewer__info-val">
                {file.lastModified
                  ? new Date(file.lastModified).toLocaleString()
                  : '—'}
              </span>
            </div>
          </div>
        )}

        {/* ── Preview body — intentionally backgroundless ────────────────── */}
        <div className="viewer__body">
          {category === 'image'   && <ImagePreview   src={objectUrl}  name={file.name} />}
          {category === 'pdf'     && <PdfPreview     src={objectUrl} />}
          {category === 'video'   && <VideoPreview   src={objectUrl}  type={file.type} />}
          {category === 'audio'   && <AudioPreview   src={objectUrl}  type={file.type} name={file.name} />}
          {category === 'text'    && <TextPreview    content={textContent ?? 'Loading…'} />}
          {category === 'office'  && <OfficePreview  name={file.name} ext={ext} />}
          {category === 'unknown' && <UnknownPreview name={file.name} />}
        </div>

        {/* ── Minimised bar — shown instead of body when minimised ──────── */}
        {isMinimised && (
          <div
            className="viewer__minimised-bar"
            onClick={() => setIsMinimised(false)}
            title="Click to restore"
          >
            <span className="material-symbols-rounded">{getCategoryIcon(category)}</span>
            <span>{file.name}</span>
            <span className="viewer__minimised-size">{formatFileSize(file.size)}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default Viewer;