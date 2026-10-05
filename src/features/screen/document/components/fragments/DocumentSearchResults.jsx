import { memo } from 'react';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import DocumentPreview from './DocumentPreview';
import { buildDocumentFileLabel, formatBytes } from '../../helper/document.helper';

const SearchFolderTile = memo(function SearchFolderTile({ folder, onOpen }) {
  return (
    <div className="doc-details-tile doc-details-folder-tile" onDoubleClick={() => onOpen(folder)}>
      <div className="doc-details-tile-preview doc-details-folder-preview">
        {renderComponentIcon('FolderIcon', 90, 'var(--color-primary-200)')}
      </div>
      <div className="doc-details-tile-name" title={folder.name}>
        {folder.name}
      </div>
      <div className="doc-details-tile-path" title={folder.locationLabel}>
        {folder.locationLabel}
      </div>
      <button type="button" className="doc-search-link" onClick={() => onOpen(folder)}>
        Open folder
      </button>
    </div>
  );
});

const SearchDocumentTile = memo(function SearchDocumentTile({ documentItem, onView, onShow }) {
  return (
    <div className="doc-details-tile" onDoubleClick={() => onView(documentItem)}>
      <div className="doc-details-tile-preview">
        <DocumentPreview documentItem={documentItem} />
        <div className="doc-details-preview-shield" />
      </div>
      <div className="doc-details-tile-name" title={buildDocumentFileLabel(documentItem)}>
        {buildDocumentFileLabel(documentItem)}
      </div>
      <div className="doc-details-tile-path" title={documentItem.locationLabel}>
        {documentItem.locationLabel}
      </div>
      <div className="doc-details-tile-date">{formatBytes(documentItem.fileSize)}</div>
      <button type="button" className="doc-search-link" onClick={() => onShow(documentItem)}>
        Show in folder
      </button>
    </div>
  );
});

function DocumentSearchResults({ query, state, onViewDocument, onShowDocument, onOpenFolder }) {
  const total = state.documents.length + state.folders.length;
  return (
    <div className="doc-details-explorer">
      <div className="doc-search-summary">
        {state.isLoading ? 'Searching...' : `${total} result${total === 1 ? '' : 's'} for "${query}"`}
      </div>
      {state.isLoading && total === 0 ? (
        <Loader />
      ) : total === 0 ? (
        <div className="doc-details-empty-state">No files or folders match your search.</div>
      ) : (
        <div className="doc-details-grid">
          {state.folders.map((folder) => (
            <SearchFolderTile key={folder._id} folder={folder} onOpen={onOpenFolder} />
          ))}
          {state.documents.map((documentItem) => (
            <SearchDocumentTile
              key={documentItem._id}
              documentItem={documentItem}
              onView={onViewDocument}
              onShow={onShowDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentSearchResults;