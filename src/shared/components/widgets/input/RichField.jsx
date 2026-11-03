import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { sanitizeRichHtml } from './richText';
import './RichField.css';

const SWATCHES = ['#fff176', '#ffcc80', '#a5d6a7', '#80deea', '#90caf9', '#f48fb1', '#ce93d8', '#ef9a9a'];

const exec = (command, value) => document.execCommand(command, false, value);

function RichField({ value, onChange, multiline = false, placeholder, className = '', onKeyDown, onPaste, ...rest }) {
  const ref = useRef(null);
  const menuRef = useRef(null);
  const initial = useRef(sanitizeRichHtml(value ?? ''));
  const lastEmitted = useRef(value ?? '');
  const savedRange = useRef(null);
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = value ?? '';
    if (next !== lastEmitted.current) {
      el.innerHTML = sanitizeRichHtml(next);
      lastEmitted.current = next;
    }
  }, [value]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => {
      if (e.type === 'mousedown' && menuRef.current?.contains(e.target)) return;
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      setMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    if (!el.textContent && el.innerHTML) el.innerHTML = '';
    const html = el.textContent ? sanitizeRichHtml(el.innerHTML) : '';
    lastEmitted.current = html;
    onChange?.({ target: { value: html } });
  };

  const handlePaste = (e) => {
    onPaste?.(e);
    const items = Array.from(e.clipboardData?.items || []);
    if (items.some((item) => item.type.startsWith('image/'))) return;
    e.preventDefault();
    let text = e.clipboardData.getData('text/plain');
    if (!multiline) text = text.replace(/\s*[\r\n]+\s*/g, ' ');
    exec('insertText', text);
  };

  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (multiline) exec('insertLineBreak');
    }
  };

  const handleContextMenu = (e) => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.isCollapsed || !sel.rangeCount) return;
    if (!el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) return;
    e.preventDefault();
    savedRange.current = sel.getRangeAt(0).cloneRange();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const apply = (command, commandValue, keepOpen = false) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    exec('styleWithCSS', true);
    exec(command, commandValue);
    if (sel.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
    emit();
    if (!keepOpen) setMenu(null);
  };

  const menuLeft = menu ? Math.min(menu.x, window.innerWidth - 230) : 0;
  const menuTop = menu ? Math.min(menu.y, window.innerHeight - 190) : 0;

  return (
    <>
      <div
        ref={ref}
        className={`rich-field${className ? ` ${className}` : ''}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onContextMenu={handleContextMenu}
        dangerouslySetInnerHTML={{ __html: initial.current }}
        {...rest}
      />
      {menu && createPortal(
        <div
          ref={menuRef}
          className="rich-menu"
          style={{ left: menuLeft, top: menuTop }}
          onMouseDown={(e) => { if (e.target.tagName !== 'INPUT') e.preventDefault(); }}
        >
          <div className="rich-menu-row">
            <button type="button" className="rich-menu-btn" onClick={() => apply('bold')}><b>B</b> Bold</button>
            <button type="button" className="rich-menu-btn" onClick={() => apply('italic')}><i>I</i> Italic</button>
          </div>
          <div className="rich-menu-label">Highlight</div>
          <div className="rich-menu-row">
            {SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                className="rich-menu-swatch"
                style={{ background: color }}
                title={color}
                onClick={() => apply('hiliteColor', color)}
              />
            ))}
          </div>
          <div className="rich-menu-row">
            <label className="rich-menu-custom">
              Custom
              <input type="color" defaultValue="#ffff00" onChange={(e) => apply('hiliteColor', e.target.value, true)} />
            </label>
          </div>
          <div className="rich-menu-row">
            <button type="button" className="rich-menu-btn" onClick={() => apply('hiliteColor', 'transparent')}>Remove highlight</button>
            <button type="button" className="rich-menu-btn" onClick={() => apply('removeFormat')}>Clear all</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default RichField;