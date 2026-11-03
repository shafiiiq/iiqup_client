import { useVideoStream } from '@/features/core/sync/cdn/useVideoStream';
import { DEFAULT_PREFERRED_RENDITION, PLAYBACK_PHASE } from '@/features/core/sync/cdn/cdn.constant';
import './DocumentVideoPreview.css';

function DocumentVideoPreview({ documentItem }) {
  const { phase, url, renditions, activeRendition, selectRendition } = useVideoStream({
    sourceKey: documentItem.s3Key,
    fallbackUrl: documentItem.fileUrl,
    preferredRendition: DEFAULT_PREFERRED_RENDITION,
  });

  if (phase === PLAYBACK_PHASE.LOADING) return <div className="doc-viewer-message">Loading video...</div>;

  return (
    <div className="doc-video-wrap">
      <video key={url} className="doc-viewer-media" src={url} controls preload="metadata" />
      <div className="doc-video-bar">
        {phase === PLAYBACK_PHASE.STREAM && renditions.length > 1 && (
          <select value={activeRendition} onChange={(event) => selectRendition(event.target.value)}>
            {renditions.map((renditionName) => (
              <option key={renditionName} value={renditionName}>
                {renditionName}
              </option>
            ))}
          </select>
        )}
        {phase === PLAYBACK_PHASE.PROCESSING && <span>Optimizing video. Playing the original file.</span>}
      </div>
    </div>
  );
}

export default DocumentVideoPreview;