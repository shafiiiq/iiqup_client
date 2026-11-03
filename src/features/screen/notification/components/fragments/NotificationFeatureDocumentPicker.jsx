import { useMemo, useState } from 'react';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import { useFeatureDocumentSearch } from '../../hooks/useFeatureDocumentSearch';
import FeatureDocumentRow from './FeatureDocumentRow';
import NotificationFeatureLinkViewer from './NotificationFeatureLinkViewer';

const buildLinkKey = (link) => `${link.featureKey}:${link.reference}`;

const NotificationFeatureDocumentPicker = ({ feature, attachedLinks, onAttach, onClose }) => {
  const [previewLink, setPreviewLink] = useState(null);
  const search = useFeatureDocumentSearch({ featureKey: feature?.key ?? null, isOpen: Boolean(feature) });
  const attachedKeys = useMemo(() => new Set(attachedLinks.map(buildLinkKey)), [attachedLinks]);

  if (!feature) return null;

  return (
    <div className="features screen notification overlay">
      <div className="features screen notification overlay-backdrop" onClick={onClose} />
      <div className="features screen notification overlay-panel large">
        <div className="features screen notification overlay-header">
          <div>
            <h3 className="features screen notification overlay-title">{feature.label}</h3>
            <p className="features screen notification overlay-subtitle">Preview and attach a document</p>
          </div>
          <button type="button" className="features screen notification icon-button" onClick={onClose}>
            {renderComponentIcon('IconlyClose', 20, 'currentColor')}
          </button>
        </div>
        <input
          className="features screen notification overlay-search-input"
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          placeholder={`Search by ${feature.identifierLabel ?? 'number'}, vendor...`}
          autoCapitalize="none"
        />
        {search.isLoading && (
          <div className="features screen notification loading">
            <Loader />
          </div>
        )}
        {!search.isLoading && search.documents.length === 0 && (
          <span className="features screen notification overlay-empty">No documents found</span>
        )}
        {search.documents.map((document) => (
          <FeatureDocumentRow
            key={buildLinkKey(document.link)}
            document={document}
            isAttached={attachedKeys.has(buildLinkKey(document.link))}
            onPreview={setPreviewLink}
            onAttach={onAttach}
          />
        ))}
        <NotificationFeatureLinkViewer link={previewLink} onClose={() => setPreviewLink(null)} />
      </div>
    </div>
  );
};

export default NotificationFeatureDocumentPicker;