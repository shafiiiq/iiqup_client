import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import { DRAGGED_DOCUMENT_TYPE } from '../../constants/document.constant';
import DocumentContextMenu from './DocumentContextMenu';

const HOVER_OPEN_DELAY_MILLISECONDS = 600;

const DocumentWindowTabs = memo(function DocumentWindowTabs({
  windows,
  activeWindowId,
  onSelect,
  onNew,
  onClose,
  onDuplicate,
  onMove,
}) {
  const [menu, setMenu] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const hoverTimerRef = useRef(0);
  const hoverIdRef = useRef(null);
  const handleCloseMenu = useCallback(() => setMenu(null), []);

  const clearHover = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = 0;
    hoverIdRef.current = null;
    setOverId(null);
  }, []);

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  const menuItems = menu
    ? [
        { key: 'duplicate', label: 'Duplicate', onSelect: () => onDuplicate(menu.windowId) },
        ...(windows.length > 1
          ? [{ key: 'close', label: 'Close', isDanger: true, onSelect: () => onClose(menu.windowId) }]
          : []),
      ]
    : [];

  return (
    <div className="doc-window-tabs">
      <div className="doc-window-tab-list" role="tablist">
        {windows.map((windowItem, windowIndex) => (
          <div
            key={windowItem.id}
            role="tab"
            aria-selected={windowItem.id === activeWindowId}
            className={`doc-window-tab ${windowItem.id === activeWindowId ? 'active' : ''} ${overId === windowItem.id && dragId !== windowItem.id ? 'drag-over' : ''}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', windowItem.id);
              event.dataTransfer.effectAllowed = 'move';
              setDragId(windowItem.id);
            }}
            onDragOver={(event) => {
              if (dragId) {
                event.preventDefault();
                setOverId(windowItem.id);
                return;
              }
              if (!Array.from(event.dataTransfer.types).includes(DRAGGED_DOCUMENT_TYPE)) return;
              event.preventDefault();
              if (hoverIdRef.current === windowItem.id) return;
              clearTimeout(hoverTimerRef.current);
              hoverIdRef.current = windowItem.id;
              setOverId(windowItem.id);
              if (windowItem.id === activeWindowId) return;
              hoverTimerRef.current = setTimeout(() => onSelect(windowItem.id), HOVER_OPEN_DELAY_MILLISECONDS);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              if (!dragId) clearHover();
            }}
            onDrop={(event) => {
              if (!dragId) {
                clearHover();
                return;
              }
              event.preventDefault();
              onMove(dragId, windowIndex);
              setDragId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              clearHover();
              setDragId(null);
            }}
            onClick={() => onSelect(windowItem.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setMenu({ x: event.clientX, y: event.clientY, windowId: windowItem.id });
            }}
          >
            <span className="doc-window-tab-label" title={windowItem.label}>
              {windowItem.label}
            </span>
            {windows.length > 1 && (
              <button
                type="button"
                className="doc-window-tab-close"
                aria-label="Close window"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(windowItem.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="doc-window-tab-add" aria-label="New window" title="New window" onClick={onNew}>
        {renderComponentIcon('IconlyPlus', 22, 'currentColor')}
      </button>

      {menu && menuItems.length > 0 && (
        <DocumentContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={handleCloseMenu} />
      )}
    </div>
  );
});

export default DocumentWindowTabs;