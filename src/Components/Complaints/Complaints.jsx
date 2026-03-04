// ─────────────────────────────────────────────────────────────────────────────
// Complaints.jsx — Complaints management dashboard.
// Displays all complaints or a single complaint (when :complaintId is present).
// Features:
//   • Auto-refreshes every 30 seconds
//   • Media carousel with prev/next navigation and thumbnail strip
//   • Async S3 pre-signed URL resolution for images and videos
//   • Status summary bar (Resolved / Pending / Rejected / In Progress)
//   • Complaint-linked navigation to service form after resolution
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import {
  AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../Common/Button/Button';
import Loader from '../../Common/Loader/Loader';

import './Complaints.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Fallback image shown when a media file fails to load. */
const FALLBACK_IMAGE = 'https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg';

/** Auto-refresh interval in milliseconds. */
const REFRESH_INTERVAL_MS = 30_000;

/** Video file extensions used for type detection when mimeType is absent. */
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'm4v'];

/** Status display configuration keyed by normalised status string. */
const STATUS_CONFIG = {
  resolved: { color: '#10b981', icon: CheckCircle },
  'in-progress': { color: '#3b82f6', icon: Clock },
  pending: { color: '#f59e0b', icon: Clock },
  rejected: { color: '#ef4444', icon: XCircle },
};

/** Shared Button props applied to every action button in the header bar. */
const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the given media file is a video, based on mimeType or
 * file extension.
 *
 * @param {{ mimeType?: string, filePath?: string, type?: string }} media
 * @returns {boolean}
 */
const isVideoMedia = ({ mimeType, filePath, type } = {}) => {
  if (mimeType) return mimeType.toLowerCase().includes('video');
  if (filePath) return VIDEO_EXTENSIONS.includes(filePath.toLowerCase().split('.').pop());
  return type === 'video';
};

/**
 * Formats an ISO date string for display.
 *
 * @param {string} dateString - Raw ISO date string.
 * @returns {string} Localised date/time string, or "Unknown date".
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Returns the status colour for a given status string.
 *
 * @param {string} status - Complaint status value.
 * @returns {string} CSS colour string.
 */
const getStatusColor = (status) =>
  (STATUS_CONFIG[status?.toLowerCase()] || { color: '#64748b' }).color;

/**
 * Returns the Lucide icon component for a given status string.
 *
 * @param {string} status - Complaint status value.
 * @returns {React.ComponentType} Icon component.
 */
const getStatusIcon = (status) =>
  (STATUS_CONFIG[status?.toLowerCase()] || { icon: Clock }).icon;

// ─────────────────────────────────────────────────────────────────────────────
// AsyncMedia — Sub-component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asynchronously resolves an S3 pre-signed URL and renders either an <img>
 * or <video> element. Shows a spinner while loading and a fallback image on
 * error.
 *
 * @param {Object}   props
 * @param {string}   props.filePath    - S3 key / file path.
 * @param {string}   [props.type]      - Explicit media type ('video' | 'image').
 * @param {string}   [props.mimeType]  - MIME type string.
 * @param {string}   [props.alt]       - Alt text for images.
 * @param {string}   [props.className] - CSS class name.
 * @param {Function} [props.onError]   - Error callback.
 * @param {Object}   props.mediaUrls   - Cached URL map from parent state.
 * @param {Function} props.getMediaUrl - Async function to resolve an S3 URL.
 */
const AsyncMedia = ({
  filePath, type, mimeType, alt, className, onError,
  mediaUrls, getMediaUrl,
  ...rest
}) => {
  const [mediaUrl, setMediaUrl] = useState(mediaUrls[filePath] || '');
  const [loading, setLoading] = useState(!mediaUrls[filePath]);
  const [error, setError] = useState(false);

  // ── Effect: Resolve pre-signed URL when filePath changes ─────────────────

  useEffect(() => {
    if (!filePath) return;

    // Use cached URL if already resolved.
    if (mediaUrls[filePath]) {
      setMediaUrl(mediaUrls[filePath]);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const url = await getMediaUrl(filePath);
        setMediaUrl(url);
      } catch (err) {
        console.error('[AsyncMedia] URL resolution error:', err);
        setError(true);
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filePath, mediaUrls, getMediaUrl, onError]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`${className} media-loading`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#f3f4f6', minHeight: '100px'
        }}>
        <div className="loading-spinner-small" />
      </div>
    );
  }

  // ── Error / missing URL — show fallback image ─────────────────────────────

  if (error || !mediaUrl) {
    return <img src={FALLBACK_IMAGE} alt={alt} className={className} onError={onError} />;
  }

  // ── Video ─────────────────────────────────────────────────────────────────

  if (isVideoMedia({ mimeType, filePath, type })) {
    // Strip props that are invalid on <video> elements.
    const { mediaUrls: _, getMediaUrl: __, ...videoProps } = rest;
    return (
      <video {...videoProps} className={className} onError={onError}>
        <source src={mediaUrl} type={mimeType || 'video/mp4'} />
        <source src={mediaUrl} type="video/webm" />
        <source src={mediaUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // ── Image ─────────────────────────────────────────────────────────────────

  // Strip props that are invalid on <img> elements.
  const { controls, preload, mediaUrls: _, getMediaUrl: __, onLoadStart, onLoadedData, ...imgProps } = rest;
  return (
    <img
      {...imgProps}
      src={mediaUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_IMAGE;
        if (onError) onError(e);
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Complaints — Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complaints — Full complaints dashboard with auto-refresh, media carousel,
 * and status summary. Operates in two modes:
 *   • All complaints — when no :complaintId param is present.
 *   • Single complaint — when :complaintId is in the URL.
 */
function Complaints() {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { complaintId, regNo } = useParams();

  // ── Complaints data ────────────────────────────────────────────────────────

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Media state ────────────────────────────────────────────────────────────

  const [mediaUrls, setMediaUrls] = useState({});
  const [activeMediaIndices, setActiveMediaIndices] = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // ── Effect: Sync header title / subtitle ──────────────────────────────────

  useEffect(() => {
    setHeaderTitle('Complaints Management');
    setHeaderSubtitle(`${complaints.length} Complaints`);

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [complaints.length, setHeaderTitle, setHeaderSubtitle]);

  // ── Effect: Initial fetch + 30-second auto-refresh ────────────────────────

  useEffect(() => {
    fetchComplaints();

    const interval = setInterval(() => fetchComplaints(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetches complaints from the API and preloads all media URLs.
   * When showRefresh is true the spinner is suppressed (silent background refresh).
   *
   * @param {boolean} [showRefresh=false] - Show the refreshing indicator instead of full spinner.
   */
  const fetchComplaints = async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);

      const endpoint = complaintId
        ? `${END_POINT}/complaints/get-complaints/${complaintId}`
        : `${END_POINT}/complaints/get-all-complaints`;

      const response = await apiRequest(endpoint);
      if (!response.ok) throw new Error('Failed to fetch complaints');

      const data = await response.json();

      const raw = complaintId ? [data] : data.data;
      if (!Array.isArray(raw)) throw new Error('Invalid data format: expected array');

      // Sort newest first.
      const sorted = [...raw].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Initialise media carousel indices.
      const indices = Object.fromEntries(sorted.map((_, i) => [i, 0]));
      setActiveMediaIndices(indices);

      const processed = sorted.map((c) => ({
        ...c,
        mediaFiles: c.mediaFiles || [],
        solutions: c.solutions || [],
      }));

      setComplaints(processed);
      await preloadMediaUrls(processed);

    } catch (err) {
      console.error('[Complaints] fetchComplaints error:', err);
      setError(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Resolves and caches an S3 pre-signed URL for a given file path.
   * Returns the cached URL immediately if already resolved.
   *
   * @param {string} filePath - S3 key.
   * @returns {Promise<string>} Pre-signed URL.
   */
  const getMediaUrl = async (filePath) => {
    if (!filePath) return '';
    if (mediaUrls[filePath]) return mediaUrls[filePath];

    try {
      const response = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', { key: filePath, isLong: true });
      const result = await response.json();
      const url = result.dataUrl;

      setMediaUrls((prev) => ({ ...prev, [filePath]: url }));
      return url;
    } catch (err) {
      console.error('[Complaints] getMediaUrl error:', err);
      return FALLBACK_IMAGE;
    }
  };

  /**
   * Pre-fetches all media URLs for a set of complaints in parallel.
   * Skips paths that are already cached.
   *
   * @param {Object[]} complaintsData - Array of complaint objects.
   */
  const preloadMediaUrls = async (complaintsData) => {
    const paths = [];

    complaintsData.forEach((c) => {
      c.mediaFiles?.forEach((m) => { if (m.filePath && !mediaUrls[m.filePath]) paths.push(m.filePath); });
      c.solutions?.forEach((s) => { if (s.filePath && !mediaUrls[s.filePath]) paths.push(s.filePath); });
    });

    await Promise.all(paths.map(getMediaUrl));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Triggers a silent background refresh of the complaints list. */
  const handleRefresh = () => fetchComplaints(true);

  /**
   * Advances the media carousel for a specific complaint card.
   *
   * @param {number} complaintIndex - Index of the complaint in the list.
   * @param {'prev'|'next'} direction - Navigation direction.
   */
  const handleMediaNavigation = (complaintIndex, direction) => {
    setActiveMediaIndices((prev) => {
      const current = prev[complaintIndex] || 0;
      const mediaCount = complaints[complaintIndex]?.mediaFiles?.length || 0;
      if (mediaCount <= 1) return prev;

      const next = direction === 'prev'
        ? (current === 0 ? mediaCount - 1 : current - 1)
        : (current === mediaCount - 1 ? 0 : current + 1);

      return { ...prev, [complaintIndex]: next };
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / Error / Empty states
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="complaints-dashboard-container">
        <div className="loading-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="complaints-dashboard-container">
        <div className="error-container">
          <AlertTriangle size={48} />
          <h2>Complaints Dashboard Error</h2>
          <p>{error}</p>
          <button onClick={() => fetchComplaints()} className="retry-button">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="complaints-dashboard-container">
        <div className="no-data-container">
          <div className="no-data-content">
            <AlertTriangle size={48} />
            <h2>No Complaints Found</h2>
            <p>There are currently no complaints in the system</p>
            <button onClick={() => fetchComplaints()} className="refresh-button">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Derived summary counts
  // ─────────────────────────────────────────────────────────────────────────

  const statusCounts = {
    resolved: complaints.filter((c) => c.status?.toLowerCase() === 'resolved').length,
    pending: complaints.filter((c) => c.status?.toLowerCase() === 'pending').length,
    rejected: complaints.filter((c) => c.status?.toLowerCase() === 'rejected').length,
    'in-progress': complaints.filter((c) => c.status?.toLowerCase() === 'in-progress').length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="complaints-dashboard-container">

      {/* ── Header: navigation and refresh actions ── */}
      <div className="complaints-summary-header">
        <div className="complaints-summary-content">
          <Link to="/dashboard">
            <Button {...SHARED_BTN} text="Return to Dashboard" onClick={() => { }}
              colorScheme="amber-800" width="200px" type="submit"
            />
          </Link>
          <Button {...SHARED_BTN}
            text={refreshing ? 'Refreshing...' : 'Refresh'}
            onClick={handleRefresh}
            colorScheme="lime-800" width="160px" type="submit"
          />
        </div>
      </div>

      {/* ── Status summary bar ── */}
      <div className="complaints-status-bar">
        {[
          { key: 'resolved', label: 'Resolved', gradient: '#10b981, #059669', Icon: CheckCircle },
          { key: 'pending', label: 'Pending', gradient: '#f59e0b, #d97706', Icon: Clock },
          { key: 'rejected', label: 'Rejected', gradient: '#ef4444, #dc2626', Icon: XCircle },
          { key: 'in-progress', label: 'In Progress', gradient: '#3b82f6, #1d4ed8', Icon: Clock },
        ].map(({ key, label, gradient, Icon }) => (
          <div key={key} className="complaints-status-item">
            <div className="complaints-status-icon"
              style={{ background: `linear-gradient(135deg, ${gradient})` }}>
              <Icon size={24} />
            </div>
            <div className="complaints-status-content">
              <span className="complaints-status-value">{statusCounts[key]}</span>
              <span className="complaints-status-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Complaints list ── */}
      <div className="complaints-list-container">
        {complaints.map((complaint, complaintIndex) => {
          const activeMediaIndex = activeMediaIndices[complaintIndex] || 0;
          const activeMedia = complaint.mediaFiles[activeMediaIndex];
          const hasMultipleMedia = complaint.mediaFiles.length > 1;
          const statusColor = getStatusColor(complaint.status);
          const StatusIcon = getStatusIcon(complaint.status);

          return (
            <div key={complaint._id || complaintIndex} className="complaint-card-container">
              <div className="complaint-card">

                {/* ── Card header: title, status badge, dates ── */}
                <div className="complaint-card-header"
                  style={{ borderBottom: `3px solid ${statusColor}` }}>
                  <div className="complaint-title-section">
                    <h2 className="complaint-title">ID : {complaint.complaintId}</h2>
                    <div className="complaint-status-badge"
                      style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                      <StatusIcon size={16} />
                      <span>{complaint.status || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="complaint-meta">
                    <span className="complaint-date">Submitted on {formatDate(complaint.createdAt)}</span>
                    {complaint.updatedAt && (
                      <span className="complaint-date">Last updated: {formatDate(complaint.updatedAt)}</span>
                    )}
                  </div>
                </div>

                <div className="complaint-content-grid">

                  {/* ── Left: complaint details + media carousel ── */}
                  <div className="complaint-details-section">

                    {/* Info grid */}
                    <div className="complaint-info-grid">
                      <div className="complaint-info-item">
                        <strong>Name :</strong>
                        <span>{complaint.name || 'N/A'}</span>
                      </div>
                      {complaint.regNo && (
                        <div className="complaint-info-item">
                          <strong>Reg No:</strong>
                          <span>{complaint.regNo}</span>
                        </div>
                      )}
                      {complaint.category && (
                        <div className="complaint-info-item">
                          <strong>Category:</strong>
                          <span>{complaint.category}</span>
                        </div>
                      )}
                      {complaint.priority && (
                        <div className="complaint-info-item">
                          <strong>Priority:</strong>
                          <span>{complaint.priority}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {complaint.description && (
                      <div className="complaint-description">
                        <h3>Description</h3>
                        <p>{complaint.description}</p>
                      </div>
                    )}

                    {/* Media carousel */}
                    {complaint.mediaFiles?.length > 0 ? (
                      <div className="complaint-media-section">
                        <div className="complaint-media-display">
                          <div className="complaint-media-viewer">

                            {hasMultipleMedia && (
                              <button className="complaint-media-nav-button complaint-media-prev-button"
                                onClick={() => handleMediaNavigation(complaintIndex, 'prev')}>
                                <ChevronLeft size={24} />
                              </button>
                            )}

                            <div className="complaint-media-container">
                              <AsyncMedia
                                filePath={activeMedia?.filePath}
                                type={activeMedia?.type}
                                mimeType={activeMedia?.mimeType}
                                alt={`Complaint evidence ${activeMediaIndex + 1}`}
                                className="complaint-media-element"
                                mediaUrls={mediaUrls}
                                getMediaUrl={getMediaUrl}
                                controls
                                preload="metadata"
                                onError={(e) => console.error('[Complaints] media error:', e.target?.error?.message)}
                              />
                            </div>

                            {hasMultipleMedia && (
                              <button className="complaint-media-nav-button complaint-media-next-button"
                                onClick={() => handleMediaNavigation(complaintIndex, 'next')}>
                                <ChevronRight size={24} />
                              </button>
                            )}
                          </div>

                          <div className="complaint-media-counter">
                            Media {activeMediaIndex + 1} of {complaint.mediaFiles.length}
                          </div>
                        </div>

                        {/* Thumbnail strip */}
                        <div className="complaint-media-thumbnails">
                          {complaint.mediaFiles.map((media, mediaIndex) => (
                            <div
                              key={mediaIndex}
                              className={`complaint-thumbnail ${mediaIndex === activeMediaIndex ? 'complaint-thumbnail-active' : ''}`}
                              onClick={() => setActiveMediaIndices((prev) => ({ ...prev, [complaintIndex]: mediaIndex }))}
                            >
                              {isVideoMedia(media) ? (
                                <div className="complaint-video-thumbnail">
                                  <div className="complaint-thumbnail-placeholder">
                                    <div className="complaint-play-format">{media.mimeType || 'video'}</div>
                                  </div>
                                </div>
                              ) : (
                                <AsyncMedia
                                  filePath={media.filePath}
                                  type={media.type}
                                  mimeType={media.mimeType}
                                  alt={`Thumbnail ${mediaIndex + 1}`}
                                  mediaUrls={mediaUrls}
                                  getMediaUrl={getMediaUrl}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="complaint-no-media">No media files available for this complaint</div>
                    )}
                  </div>

                  {/* ── Right: solutions list ── */}
                  <div className="complaint-solutions-section">
                    <h3 className="solutions-title">Solutions</h3>

                    {complaint.solutions?.length > 0 ? (
                      <div className="solutions-list">
                        {complaint.solutions.map((solution, solutionIndex) => (
                          <div key={solution._id || solutionIndex} className="solution-card">
                            <div className="solution-header">
                              <span className="solution-date">
                                {formatDate(solution.uploadDate || solution.createdAt)}
                              </span>
                            </div>
                            <div className="solution-media">
                              <div className="solution-media-item">
                                <AsyncMedia
                                  filePath={solution.filePath}
                                  type={solution.type}
                                  mimeType={solution.mimeType}
                                  alt={`Solution ${solutionIndex + 1}`}
                                  className="solution-media-element"
                                  mediaUrls={mediaUrls}
                                  getMediaUrl={getMediaUrl}
                                  controls
                                  preload="metadata"
                                  onError={(e) => console.error('[Complaints] solution media error:', e)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-solutions">No solutions provided yet for this complaint</div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })}

        {/* ── Conclude action (single-complaint view only) ── */}
        {complaintId && (
          <div className="complaint-card-container work-navigation">
            <Link to={`/service-form-nav/${regNo}`}>
              <button>Conclude &amp; Store to database</button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

export default Complaints;