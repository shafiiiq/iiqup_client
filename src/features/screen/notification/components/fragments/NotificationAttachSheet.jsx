import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const NotificationAttachSheet = ({ isVisible, onClose, onPickMedia, onPickDocument }) => {
  if (!isVisible) return null;

  const runThenClose = (action) => {
    action();
    onClose();
  };

  return (
    <div className="features screen notification overlay">
      <div className="features screen notification overlay-backdrop" onClick={onClose} />
      <div className="features screen notification overlay-panel compact">
        <div className="features screen notification overlay-header">
          <h3 className="features screen notification overlay-title">Attach</h3>
          <button type="button" className="features screen notification icon-button" onClick={onClose}>
            {renderComponentIcon('IconlyClose', 20, 'currentColor')}
          </button>
        </div>
        <div className="features screen notification attach-option-row">
          <button
            type="button"
            className="features screen notification attach-option"
            onClick={() => runThenClose(onPickMedia)}
          >
            {renderComponentIcon('IconlyImage', 22, 'currentColor')}
            Gallery
          </button>
          <button
            type="button"
            className="features screen notification attach-option"
            onClick={() => runThenClose(onPickDocument)}
          >
            {renderComponentIcon('IconlyFolderOpen', 22, 'currentColor')}
            Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationAttachSheet;