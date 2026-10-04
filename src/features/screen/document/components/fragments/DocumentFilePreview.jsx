import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import {
  DIALOG_BUTTON_PROPS,
  TEXT_PREVIEW_INITIAL_BYTES,
  SPREADSHEET_PREVIEW_MAXIMUM_ROWS,
  SPREADSHEET_PREVIEW_MAXIMUM_COLUMNS,
} from '../../constants/document.constant';
import { getFileIcon, getPreviewKind } from '../../helper/document.helper';
import { getPreviewPdfUrl } from '../../api/document.api';

const useRemoteBuffer = (url) => {
  const [state, setState] = useState({ buffer: null, isLoading: true, error: '' });

  useEffect(() => {
    const abortController = new AbortController();
    setState({ buffer: null, isLoading: true, error: '' });
    (async () => {
      try {
        const response = await fetch(url, { signal: abortController.signal, cache: 'no-store', mode: 'cors' });
        if (!response.ok) throw new Error('Failed to load file');
        const buffer = await response.arrayBuffer();
        setState({ buffer, isLoading: false, error: '' });
      } catch (error) {
        if (error.name !== 'AbortError') setState({ buffer: null, isLoading: false, error: 'Failed to load preview' });
      }
    })();
    return () => abortController.abort();
  }, [url]);

  return state;
};

function BufferPreview({ documentItem, children }) {
  const { buffer, isLoading, error } = useRemoteBuffer(documentItem.fileUrl);
  if (isLoading) return <div className="doc-viewer-message">Loading preview...</div>;
  if (error) return <div className="doc-viewer-message">{error}</div>;
  return children(buffer);
}

function TextPreview({ url }) {
  const [state, setState] = useState({ text: '', isTruncated: false, isLoading: true, error: '' });
  const [isFullLoad, setIsFullLoad] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    (async () => {
      try {
        const response = await fetch(url, {
          signal: abortController.signal,
          cache: 'no-store',
          mode: 'cors',
          headers: isFullLoad ? {} : { Range: `bytes=0-${TEXT_PREVIEW_INITIAL_BYTES - 1}` },
        });
        if (!response.ok) throw new Error('Failed to load file');
        const contentRange = response.headers.get('content-range');
        const totalBytes = contentRange ? Number(contentRange.split('/')[1]) : 0;
        const text = await response.text();
        setState({ text, isTruncated: !isFullLoad && totalBytes > TEXT_PREVIEW_INITIAL_BYTES, isLoading: false, error: '' });
      } catch (error) {
        if (error.name !== 'AbortError') setState({ text: '', isTruncated: false, isLoading: false, error: 'Failed to load preview' });
      }
    })();
    return () => abortController.abort();
  }, [url, isFullLoad]);

  if (state.error) return <div className="doc-viewer-message">{state.error}</div>;
  return (
    <div className="doc-viewer-text-wrap">
      <pre className="doc-viewer-text">{state.isLoading ? 'Loading preview...' : state.text}</pre>
      {state.isTruncated && (
        <Button
          {...DIALOG_BUTTON_PROPS}
          width="fit-content"
          padding="0 22px"
          text="Load entire file"
          colorScheme="info-700"
          onClick={() => setIsFullLoad(true)}
        />
      )}
    </div>
  );
}

function ConvertedPdfPreview({ documentItem, onDownload }) {
  const [state, setState] = useState({ url: '', isLoading: true, error: '' });

  useEffect(() => {
    let isCancelled = false;
    setState({ url: '', isLoading: true, error: '' });
    getPreviewPdfUrl(documentItem._id)
      .then((url) => {
        if (!isCancelled) setState({ url, isLoading: false, error: '' });
      })
      .catch((error) => {
        if (!isCancelled) setState({ url: '', isLoading: false, error: error.message });
      });
    return () => {
      isCancelled = true;
    };
  }, [documentItem._id]);

  if (state.isLoading) return <div className="doc-viewer-message">Preparing preview...</div>;
  if (state.error) {
    return (
      <div className="doc-viewer-message doc-viewer-unsupported">
        <span>{state.error}</span>
        <Button {...DIALOG_BUTTON_PROPS} text="Download" colorScheme="success-700" type="button" onClick={onDownload} />
      </div>
    );
  }
  return <iframe className="doc-viewer-frame" src={state.url} title={documentItem.displayName} />;
}

function WordPreview({ buffer, onFallback }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const { renderAsync } = await import('docx-preview');
        if (isCancelled || !containerRef.current) return;
        await renderAsync(buffer, containerRef.current, undefined, { inWrapper: true, breakPages: true });
      } catch {
        if (!isCancelled) onFallback();
      }
    })();
    const container = containerRef.current;
    return () => {
      isCancelled = true;
      if (container) container.innerHTML = '';
    };
  }, [buffer, onFallback]);

  return <div ref={containerRef} className="doc-viewer-docx" />;
}

function SpreadsheetPreview({ buffer }) {
  const [sheets, setSheets] = useState(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [conversionError, setConversionError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const spreadsheetModule = await import('xlsx');
        const workbook = spreadsheetModule.read(buffer, { type: 'array', sheetRows: SPREADSHEET_PREVIEW_MAXIMUM_ROWS });
        const parsedSheets = workbook.SheetNames.map((sheetName) => ({
          name: sheetName,
          rows: spreadsheetModule.utils
            .sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', blankrows: false })
            .slice(0, SPREADSHEET_PREVIEW_MAXIMUM_ROWS)
            .map((row) => row.slice(0, SPREADSHEET_PREVIEW_MAXIMUM_COLUMNS)),
        }));
        if (!isCancelled) setSheets(parsedSheets);
      } catch {
        if (!isCancelled) setConversionError('This spreadsheet cannot be previewed');
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [buffer]);

  if (conversionError) return <div className="doc-viewer-message">{conversionError}</div>;
  if (!sheets) return <div className="doc-viewer-message">Loading preview...</div>;

  const activeSheet = sheets[activeSheetIndex] || sheets[0];
  return (
    <div className="doc-viewer-office">
      {sheets.length > 1 && (
        <div className="doc-viewer-sheet-tabs">
          {sheets.map((sheet, sheetIndex) => (
            <button
              key={sheet.name}
              type="button"
              className={sheetIndex === activeSheetIndex ? 'active' : ''}
              onClick={() => setActiveSheetIndex(sheetIndex)}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}
      <div className="doc-viewer-sheet-scroll">
        <table className="doc-viewer-sheet">
          <tbody>
            {activeSheet.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentFilePreview({ documentItem, onDownload }) {
  const previewKind = getPreviewKind(documentItem);
  const [hasWordFallback, setHasWordFallback] = useState(false);
  const [isForcedText, setIsForcedText] = useState(false);
  const wordFallback = useMemo(() => () => setHasWordFallback(true), []);

  if (previewKind === 'image') {
    return <img className="doc-viewer-image" src={documentItem.fileUrl} alt={documentItem.displayName} />;
  }
  if (previewKind === 'video') {
    return <video className="doc-viewer-media" src={documentItem.fileUrl} controls preload="metadata" />;
  }
  if (previewKind === 'audio') {
    return <audio className="doc-viewer-audio" src={documentItem.fileUrl} controls preload="metadata" />;
  }
  if (previewKind === 'text' || isForcedText) return <TextPreview url={documentItem.fileUrl} />;
  if (previewKind === 'officeConvert' || (previewKind === 'word' && hasWordFallback)) {
    return <ConvertedPdfPreview documentItem={documentItem} onDownload={onDownload} />;
  }
  if (previewKind === 'word') {
    return (
      <BufferPreview documentItem={documentItem}>
        {(buffer) => <WordPreview buffer={buffer} onFallback={wordFallback} />}
      </BufferPreview>
    );
  }
  if (previewKind === 'spreadsheet') {
    return (
      <BufferPreview documentItem={documentItem}>{(buffer) => <SpreadsheetPreview buffer={buffer} />}</BufferPreview>
    );
  }

  return (
    <div className="doc-viewer-message doc-viewer-unsupported">
      {renderComponentIcon(getFileIcon(documentItem.originalFileName, documentItem.mimeType), 120, 'white')}
      <span>Preview is not available for this file type</span>
      <div className="doc-viewer-unsupported-actions">
        <Button {...DIALOG_BUTTON_PROPS} text="Download" colorScheme="success-700" type="button" onClick={onDownload} />
        <Button
          {...DIALOG_BUTTON_PROPS}
          text="Try as text"
          colorScheme="info-700"
          type="button"
          onClick={() => setIsForcedText(true)}
        />
      </div>
    </div>
  );
}

export default DocumentFilePreview;