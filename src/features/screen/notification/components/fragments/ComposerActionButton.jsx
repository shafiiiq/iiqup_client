import { useRef } from 'react';
import { ACTION_LONG_PRESS_DELAY_MS } from '../../constants/notification.composer';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const ComposerActionButton = ({ mode, isRecording, isSubmitting, onPress, onLongPress }) => {
  const longPressTimerRef = useRef(null);
  const hasLongPressedRef = useRef(false);
  const iconName = isRecording ? 'IconlyStopCircle' : mode === 'voice' ? 'IconlyVoice2' : 'IconlySend';

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const handlePointerDown = () => {
    hasLongPressedRef.current = false;
    if (isRecording) return;
    longPressTimerRef.current = setTimeout(() => {
      hasLongPressedRef.current = true;
      onLongPress();
    }, ACTION_LONG_PRESS_DELAY_MS);
  };

  const handleClick = () => {
    if (hasLongPressedRef.current) {
      hasLongPressedRef.current = false;
      return;
    }
    onPress();
  };

  return (
    <button
      type="button"
      className={`features screen notification composer-action-button ${isRecording ? 'recording' : ''}`.trim()}
      disabled={isSubmitting}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onContextMenu={(event) => event.preventDefault()}
      onClick={handleClick}
    >
      {renderComponentIcon(isSubmitting ? 'IconlyMailDraft' : iconName, 28, 'currentColor')}
    </button>
  );
};

export default ComposerActionButton;