import { memo, useEffect, useRef, useState } from 'react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const DocumentMenuBar = memo(function DocumentMenuBar({ categories }) {
  const [openKey, setOpenKey] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    if (!openKey) return undefined;
    const handleMouseDown = (event) => {
      if (!barRef.current.contains(event.target)) setOpenKey(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenKey(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openKey]);

  return (
    <div ref={barRef} className="doc-menu-bar">
      {categories.map((category) => (
        <div key={category.key} className="doc-menu-group">
          <button
            type="button"
            className={`doc-menu-trigger ${openKey === category.key ? 'open' : ''}`}
            onClick={() => setOpenKey(openKey === category.key ? null : category.key)}
            onMouseEnter={() => openKey && setOpenKey(category.key)}
          >
            {category.label}
          </button>
          {openKey === category.key && (
            <div className="doc-menu-dropdown">
              {category.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.isDisabled}
                  className={`doc-menu-item ${item.isDanger ? 'danger' : ''}`}
                  onClick={() => {
                    setOpenKey(null);
                    item.onSelect();
                  }}
                >
                  <span className="doc-menu-item-icon">{renderComponentIcon(item.icon, 22, 'currentColor')}</span>
                  <span className="doc-menu-item-label">{item.label}</span>
                  <span className="doc-menu-item-shortcut">{item.shortcut}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default DocumentMenuBar;