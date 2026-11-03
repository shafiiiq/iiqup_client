import { useEffect, useRef } from 'react';
import Table from '@/shared/components/widgets/table/Table';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import DocumentPreview from './DocumentPreview';
import { EXPIRY_BUCKETS } from '../../constants/document.constant';
import { buildDocumentFileLabel, formatDisplayDate } from '../../helper/document.helper';
import './DocumentExpiryTracking.css';

const buildColumns = (onOpenLocation) => [
  {
    key: 'serialNumber',
    header: 'S/N',
    render: (documentItem, index) => index + 1,
  },
  {
    key: 'fileName',
    header: 'File Name',
    render: (documentItem) => (
      <button
        type="button"
        className="doc-expiry-file-link"
        title={documentItem.locationLabel}
        onClick={() => onOpenLocation(documentItem)}
      >
        <span className="doc-expiry-preview">
          <DocumentPreview documentItem={documentItem} />
        </span>
        <span className="doc-expiry-file-text">
          <span className="doc-expiry-file-name">{buildDocumentFileLabel(documentItem)}</span>
          <span className="doc-expiry-file-location">{documentItem.locationLabel}</span>
        </span>
      </button>
    ),
  },
  { key: 'createdAt', header: 'Created', render: (documentItem) => formatDisplayDate(documentItem.createdAt) },
  { key: 'updatedAt', header: 'Updated', render: (documentItem) => formatDisplayDate(documentItem.updatedAt) },
  { key: 'issueDate', header: 'Issue Date', render: (documentItem) => formatDisplayDate(documentItem.issueDate) },
  { key: 'expiryDate', header: 'Expiry Date', render: (documentItem) => formatDisplayDate(documentItem.expiryDate) },
];

function DocumentExpiryTracking({ expiry, highlightedDocumentId, onOpenLocation }) {
  const columns = buildColumns(onOpenLocation);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!highlightedDocumentId || expiry.isLoading) return undefined;
    const timerId = setTimeout(() => {
      containerRef.current
        ?.querySelector(`[data-expiry-row-id="${highlightedDocumentId}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timerId);
  }, [highlightedDocumentId, expiry.isLoading, expiry.groups]);

  return (
    <div ref={containerRef} className="doc-expiry-tables">
      {EXPIRY_BUCKETS.filter(
        (bucket) => !bucket.isHiddenWhenEmpty || expiry.groups[bucket.key].length > 0
      ).map((bucket) => (
        <Table
          key={bucket.key}
          title={`${bucket.label} (${expiry.groups[bucket.key].length})`}
          columns={columns}
          data={expiry.groups[bucket.key]}
          rowKey={(documentItem) => documentItem._id}
          getRowProps={(documentItem) => ({
            'data-expiry-row-id': documentItem._id,
            'data-highlighted': documentItem._id === highlightedDocumentId ? 'true' : undefined,
          })}
          loading={expiry.isLoading}
          loadingContent={<Loader />}
          titlePosition="center"
          emptyMessage="No documents"
        />
      ))}
    </div>
  );
}

export default DocumentExpiryTracking;