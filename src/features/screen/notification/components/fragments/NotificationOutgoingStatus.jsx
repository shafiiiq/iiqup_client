import { useNowTicker } from '../../hooks/useNowTicker';
import { formatRemainingTime } from '../../utils/notification.outgoing.utils';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationOutgoingStatus = ({ outgoing, onRetry, onDiscard }) => {
  const isUploading = outgoing.status === 'sending' && outgoing.hasFiles;
  const now = useNowTicker(isUploading);
  const percent = Math.round(Math.min(1, Math.max(0, outgoing.progress)) * 100);

  if (outgoing.status === 'sent') {
    return (
      <div className="features screen notification outgoing-row sent">
        {renderComponentIcon('IconlyTickCircle', 20, 'currentColor')}
      </div>
    );
  }

  if (outgoing.status === 'failed') {
    return (
      <div className="features screen notification outgoing-row">
        {renderComponentIcon('IconlyDanger', 20, 'currentColor')}
        <span className="features screen notification outgoing-failed-text">
          {outgoing.errorMessage || 'Failed to send'}
        </span>
        <button type="button" className="features screen notification text-button" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className="features screen notification text-button" onClick={onDiscard}>
          Discard
        </button>
      </div>
    );
  }

  if (!outgoing.hasFiles) {
    return (
      <div className="features screen notification outgoing-row">
        <span className="features screen notification time">Sending...</span>
      </div>
    );
  }

  return (
    <div className="features screen notification outgoing-row">
      <div className="features screen notification outgoing-progress-column">
        <div className="features screen notification outgoing-track">
          <div className="features screen notification outgoing-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="features screen notification time">
          {percent}% · {formatRemainingTime(outgoing, now)}
        </span>
      </div>
    </div>
  );
};

export default NotificationOutgoingStatus;