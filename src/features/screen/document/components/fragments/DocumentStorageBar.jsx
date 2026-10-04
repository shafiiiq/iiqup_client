import { memo } from 'react';
import { formatBytes } from '../../helper/document.helper';

const DocumentStorageBar = memo(function DocumentStorageBar({ label, usedBytes, totalBytes }) {
  const percent = totalBytes > 0 ? Math.min(100, (usedBytes / totalBytes) * 100) : 0;
  return (
    <div className="doc-storage-bar">
      <span className="doc-storage-label">{label}</span>
      <span className="doc-storage-values">
        {formatBytes(usedBytes)} used of {formatBytes(totalBytes)} total
      </span>
      <div className="doc-storage-track">
        <div className="doc-storage-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
});

export default DocumentStorageBar;