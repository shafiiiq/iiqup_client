import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const VIEWPORT_MARGIN_PIXELS = 8;

function DocumentContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const bounds = menuRef.current.getBoundingClientRect();
    setPosition({
      left: Math.max(VIEWPORT_MARGIN_PIXELS, Math.min(x, window.innerWidth - bounds.width - VIEWPORT_MARGIN_PIXELS)),
      top: Math.max(VIEWPORT_MARGIN_PIXELS, Math.min(y, window.innerHeight - bounds.height - VIEWPORT_MARGIN_PIXELS)),
    });
  }, [x, y, items.length]);

  useEffect(() => {
    const handleOutsideMouseDown = (event) => {
      if (!menuRef.current.contains(event.target)) onClose();
    };
    window.addEventListener('mousedown', handleOutsideMouseDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('mousedown', handleOutsideMouseDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} className="doc-details-context-menu" style={position}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.isDisabled}
          className={`doc-details-context-menu-item ${item.isDanger ? 'danger' : ''}`}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default DocumentContextMenu;