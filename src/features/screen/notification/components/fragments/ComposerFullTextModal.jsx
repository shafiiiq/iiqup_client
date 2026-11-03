
import { useRef, useState } from 'react';
import { useTextareaSelection } from '../../hooks/useTextareaSelection';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import DistributionGhostText from './DistributionGhostText';

const ComposerFullTextModal = ({
  isVisible,
  text,
  ghostLines,
  selection,
  onChangeText,
  onSelectionChange,
  onSelectionApplied,
  onClose,
}) => {
  const textareaRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  useTextareaSelection({ textareaRef, selection: isVisible ? selection : null, onSelectionApplied });

  if (!isVisible) return null;

  return (
    <div className="features screen notification overlay">
      <div className="features screen notification overlay-backdrop" onClick={onClose} />
      <div className="features screen notification overlay-panel fullscreen">
        <div className="features screen notification overlay-header">
          <span />
          <button type="button" className="features screen notification icon-button" onClick={onClose}>
            {renderComponentIcon('IconlyCompress', 22, 'currentColor')}
          </button>
        </div>
        <div className="features screen notification full-text-body">
          <DistributionGhostText
            lines={ghostLines}
            scrollOffset={scrollOffset}
            className="features screen notification full-text-ghost-clip"
          />
          <textarea
            ref={textareaRef}
            className="features screen notification full-text-input"
            value={text}
            onChange={(event) => onChangeText(event.target.value)}
            onSelect={(event) =>
              onSelectionChange({ start: event.target.selectionStart, end: event.target.selectionEnd })
            }
            onScroll={(event) => setScrollOffset(event.target.scrollTop)}
            placeholder="Message"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default ComposerFullTextModal;