import { useLayoutEffect, useRef, useState } from 'react';
import {
  COMPOSER_EXPAND_LINE_COUNT,
  COMPOSER_INPUT_VERTICAL_PADDING,
  COMPOSER_LINE_HEIGHT,
} from '../../constants/notification.composer';
import { useTextareaSelection } from '../../hooks/useTextareaSelection';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import DistributionGhostText from './DistributionGhostText';

const ComposerInputBar = ({
  text,
  selection,
  placeholder,
  isEditable,
  showAttach,
  ghostLines,
  onChangeText,
  onSelectionChange,
  onSelectionApplied,
  onKeyDown,
  onPressAttach,
  onPressExpand,
  children,
}) => {
  const textareaRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const isExpandable = contentHeight > COMPOSER_LINE_HEIGHT * COMPOSER_EXPAND_LINE_COUNT;

  useTextareaSelection({ textareaRef, selection, onSelectionApplied });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setContentHeight(textarea.scrollHeight - COMPOSER_INPUT_VERTICAL_PADDING * 2);
  }, [text]);

  return (
    <div className="features screen notification composer-input-row">
      <div className="features screen notification composer-pill">
        <DistributionGhostText
          lines={ghostLines}
          scrollOffset={scrollOffset}
          className="features screen notification ghost-clip"
        />
        <textarea
          ref={textareaRef}
          className="features screen notification composer-input"
          value={text}
          onChange={(event) => onChangeText(event.target.value)}
          onSelect={(event) =>
            onSelectionChange({ start: event.target.selectionStart, end: event.target.selectionEnd })
          }
          onScroll={(event) => setScrollOffset(event.target.scrollTop)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          autoFocus
          disabled={!isEditable}
        />
        <div className="features screen notification pill-actions">
          {isExpandable && (
            <button type="button" className="features screen notification pill-icon-button" onClick={onPressExpand}>
              {renderComponentIcon('IconlyExpand', 20, 'currentColor')}
            </button>
          )}
          {showAttach && (
            <button type="button" className="features screen notification pill-icon-button" onClick={onPressAttach}>
              {renderComponentIcon('IconlyAttach', 24, 'currentColor')}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default ComposerInputBar;