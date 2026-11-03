import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const FeatureDocumentRow = ({ document, isAttached, onPreview, onAttach }) => {
  const { link, details } = document;

  return (
    <div className="features screen notification feature-document-row">
      <button
        type="button"
        className="features screen notification feature-document-preview"
        onClick={() => onPreview(link)}
      >
        {renderComponentIcon('IconlyDocument', 32, 'currentColor')}
        <span>Tap to preview</span>
      </button>
      <div className="features screen notification feature-document-details">
        <strong className="features screen notification feature-document-title">{link.title}</strong>
        {details.map((detail) => (
          <div key={detail.label} className="features screen notification feature-document-detail">
            <span>{detail.label}</span>
            <span>{detail.value}</span>
          </div>
        ))}
        <button
          type="button"
          className="features screen notification media-button feature-document-attach"
          disabled={isAttached}
          onClick={() => onAttach(link)}
        >
          {renderComponentIcon('IconlyAttach', 18, 'currentColor')}
          {isAttached ? 'Attached' : 'Attach'}
        </button>
      </div>
    </div>
  );
};

export default FeatureDocumentRow;