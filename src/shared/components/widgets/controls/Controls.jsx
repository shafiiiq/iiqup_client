import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import Button from '../button/Button';
import './Controls.css';

function ControlsGroup({ label, items, defaultExpanded }) {
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));
  const [panelStyle, setPanelStyle] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!expanded) return;

    const handleOutsideClick = (event) => {
      const clickedTrigger = triggerRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);
      if (!clickedTrigger && !clickedPanel) setExpanded(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [expanded]);

  useLayoutEffect(() => {
    if (!expanded || !triggerRef.current) return;

    const positionPanel = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const panelWidth = panelRef.current?.offsetWidth ?? 0;
      const overflowsRight = triggerRect.left + panelWidth > window.innerWidth;

      setPanelStyle({
        position: 'fixed',
        top: triggerRect.bottom + 8,
        left: overflowsRight ? undefined : triggerRect.left,
        right: overflowsRight ? window.innerWidth - triggerRect.right : undefined,
      });
    };

    positionPanel();
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  }, [expanded]);

  return (
    <div className="shared controls tree node" ref={triggerRef}>
      <button
        type="button"
        className={`shared controls tree toggle${expanded ? ' expanded' : ''}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="shared controls tree label">{label}</span>
        <ChevronDown size={16} className="shared controls tree chevron" />
      </button>

      {expanded && createPortal(
        <div
          ref={panelRef}
          className="shared controls tree panel"
          style={panelStyle ?? { position: 'fixed', top: -9999, left: -9999 }}
        >
          {items.map((item, index) => (
            <Button key={item.key ?? index} {...item} />
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function ControlsStack({ items }) {
  return (
    <div className="shared controls stack">
      {items.map((item, index) => (
        <Button key={item.key ?? index} {...item} />
      ))}
    </div>
  );
}

function Controls({
  items,
  buttons,
  rows,
  columns,
  gap = '10px',
  justify = 'end',
  wrap = true,
  hideOnPrint = true,
  className = '',
  width = '100%',
  placeItems = 'center',
  alignItems = 'center',
  margin = '0',
}) {
  const nodes = items ?? buttons ?? [];
  const useGrid = Boolean(rows || columns);

  const justifyContentMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
  };

  const layoutStyle = useGrid
    ? {
        display: 'grid',
        gridTemplateColumns: columns ? `repeat(${columns}, auto)` : undefined,
        gridTemplateRows: rows ? `repeat(${rows}, auto)` : undefined,
        gap,
        width,
        placeItems: placeItems,
        margin,
      }
    : {
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        justifyContent: justifyContentMap[justify] || justifyContentMap.end,
        gap,
        width,
        alignItems: alignItems,
        margin,
        ...(wrap ? {} : { overflowX: 'auto' }),
      };

  const wrapperClassName = [
    'shared controls bar',
    !useGrid && !wrap ? 'no-wrap' : '',
    hideOnPrint ? 'no-print' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName} style={layoutStyle}>
      {nodes.map((node, index) => {
        const key = node.key ?? index;

        if (node.stack) {
          return <ControlsStack key={key} items={node.items} />;
        }

        if (node.items) {
          return (
            <ControlsGroup
              key={key}
              label={node.label}
              items={node.items}
              defaultExpanded={node.defaultExpanded}
            />
          );
        }

        const { order, ...buttonProps } = node;
        return (
          <div
            key={key}
            className="shared controls bar item"
            style={order !== undefined ? { order } : undefined}
          >
            <Button {...buttonProps} />
          </div>
        );
      })}
    </div>
  );
}

export default Controls;