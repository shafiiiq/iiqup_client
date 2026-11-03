import { navigateToScreen } from '@/features/core/platform/navigation/screen.router';
import { useAlert } from '@/shared/context/AlertContext';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import { useFeatureLinkDocument } from '../../hooks/useFeatureLinkDocument';

const NotificationFeatureLinkViewer = ({ link, onClose }) => {
  const pdfDocument = useFeatureLinkDocument(link);
  const { showAlert } = useAlert();

  if (!link) return null;

  const openTarget = () => {
    onClose();
    const isOpened = navigateToScreen({ screenKey: link.screenKey, documentId: link.reference });
    if (!isOpened) showAlert('This document cannot be opened on web', 'error', '--color-primary');
  };

  return (
    <div className="features screen notification overlay">
      <div className="features screen notification overlay-backdrop" onClick={onClose} />
      <div className="features screen notification overlay-panel fullscreen">
        <div className="features screen notification overlay-header">
          <h3 className="features screen notification overlay-title">{link.title}</h3>
          <div className="features screen notification overlay-header-actions">
            <button type="button" className="features screen notification media-button" onClick={openTarget}>
              {renderComponentIcon('IconlyFolderOpen', 18, 'currentColor')}
              {`Open in ${link.label}`}
            </button>
            <button type="button" className="features screen notification icon-button" onClick={onClose}>
              {renderComponentIcon('IconlyClose', 20, 'currentColor')}
            </button>
          </div>
        </div>
        {pdfDocument.url && (
          <iframe title={link.title} src={pdfDocument.url} className="features screen notification overlay-frame" />
        )}
        {!pdfDocument.url && !pdfDocument.hasFailed && (
          <div className="features screen notification loading">
            <Loader />
          </div>
        )}
        {pdfDocument.hasFailed && (
          <span className="features screen notification error-text">Document unavailable</span>
        )}
      </div>
    </div>
  );
};

export default NotificationFeatureLinkViewer;