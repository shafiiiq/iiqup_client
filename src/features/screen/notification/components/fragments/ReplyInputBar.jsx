import { useLayoutEffect, useState } from 'react';
import {
  REPLY_INPUT_EXPAND_LINE_COUNT,
  REPLY_INPUT_LINE_HEIGHT,
  REPLY_INPUT_VERTICAL_PADDING,
} from '../../constants/notification.reply';
import { useTextareaSelection } from '../../hooks/useTextareaSelection';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import DistributionGhostText from './DistributionGhostText';

const ReplyInputBar = ({
  inputRef,
  text,
  placeholder,
  isEditable,
  ghostLines,
  selection,
  onChangeText,
  onSelectionChange,
  onSelectionApplied,
  onPressAttach,
  onPressExpand,
  children,
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const isExpandable = contentHeight > REPLY_INPUT_LINE_HEIGHT * REPLY_INPUT_EXPAND_LINE_COUNT;

  useTextareaSelection({ textareaRef: inputRef, selection, onSelectionApplied });

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setContentHeight(textarea.scrollHeight - REPLY_INPUT_VERTICAL_PADDING * 2);
  }, [text]);

  return (
    <div className="features screen notification reply-composer">
      <div className="features screen notification composer-pill compact">
        <DistributionGhostText
          lines={ghostLines}
          scrollOffset={scrollOffset}
          className="features screen notification ghost-clip compact"
        />
        <textarea
          ref={inputRef}
          className="features screen notification reply-input"
          value={text}
          onChange={(event) => onChangeText(event.target.value)}
          onSelect={(event) =>
            onSelectionChange({ start: event.target.selectionStart, end: event.target.selectionEnd })
          }
          onScroll={(event) => setScrollOffset(event.target.scrollTop)}
          placeholder={placeholder}
          rows={1}
          disabled={!isEditable}
        />
        <div className="features screen notification pill-actions compact">
          {isExpandable && (
            <button type="button" className="features screen notification pill-icon-button" onClick={onPressExpand}>
              {renderComponentIcon('IconlyExpand', 16, 'currentColor')}
            </button>
          )}
          <button type="button" className="features screen notification pill-icon-button" onClick={onPressAttach}>
            {renderComponentIcon('IconlyAttach', 20, 'currentColor')}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default ReplyInputBar;