import { formatPlaybackTime } from '../../utils/notification.time.format';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import ReplyInputBar from './ReplyInputBar';

const ReplyComposerBar = ({ view, inputRef, hasContent, isSending, onPressAttach, onPressExpand }) => {
  const { draft } = view;

  if (view.isRecording) {
    return (
      <div className="features screen notification reply-composer">
        <button type="button" className="features screen notification icon-button" onClick={view.onCancelRecording}>
          {renderComponentIcon('IconlyClose', 24, 'currentColor')}
        </button>
        <div className="features screen notification recording-indicator">
          <span className="features screen notification recording-dot" />
          {formatPlaybackTime(view.recordingDurationMillis / 1000)}
        </div>
        <button
          type="button"
          className="features screen notification icon-button"
          onClick={view.isRecordingPaused ? view.onResumeRecording : view.onPauseRecording}
        >
          {renderComponentIcon(view.isRecordingPaused ? 'IconlyPlay' : 'IconlyPause', 24, 'currentColor')}
        </button>
        <button type="button" className="features screen notification icon-button primary" onClick={view.onSendRecording}>
          {renderComponentIcon('IconlySend', 24, 'currentColor')}
        </button>
      </div>
    );
  }

  return (
    <ReplyInputBar
      inputRef={inputRef}
      text={draft.text}
      placeholder={view.activeDistribution ? 'Fill the fields' : 'Write a reply... @ mention, # document, // feature'}
      isEditable={!isSending}
      ghostLines={view.distributionGhostLines}
      selection={view.distributionSelection}
      onChangeText={view.onChangeText}
      onSelectionChange={view.onChangeDistributionSelection}
      onSelectionApplied={view.onClearDistributionSelection}
      onPressAttach={onPressAttach}
      onPressExpand={onPressExpand}
    >
      {hasContent ? (
        <button
          type="button"
          className="features screen notification icon-button primary"
          onClick={view.onSubmit}
          disabled={isSending}
        >
          {renderComponentIcon(isSending ? 'IconlyMailDraft' : 'IconlySend', 24, 'currentColor')}
        </button>
      ) : (
        <button type="button" className="features screen notification icon-button primary" onClick={view.onStartRecording}>
          {renderComponentIcon('IconlyVoice2', 24, 'currentColor')}
        </button>
      )}
    </ReplyInputBar>
  );
};

export default ReplyComposerBar;