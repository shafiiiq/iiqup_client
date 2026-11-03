import { Link } from 'react-router';
import {
  AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import Button from '@/shared/components/widgets/button/Button';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';

import { useComplaint, useAsyncMedia } from '../hooks/useComplaint';
import { isVideoMedia, formatDate } from '../constants/complaint.constant';
import { FALLBACK_IMAGE, SHARED_BTN, STATUS_BAR_ITEMS } from '../constants/complaint.constant';

import './Complaint.css';

const AsyncMedia = ({
  filePath, type, mimeType, alt, className, onError,
  mediaUrls, getMediaUrl,
  ...rest
}) => {
  const { loading, error, mediaUrl, isVideo, videoProps, imgProps, handleImgError } = useAsyncMedia({
    filePath, type, mimeType, onError, mediaUrls, getMediaUrl, rest,
  });

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

  if (error || !mediaUrl) {
    return <img src={FALLBACK_IMAGE} alt={alt} className={className} onError={onError} />;
  }

  if (isVideo) {
    return (
      <video {...videoProps} className={className} onError={onError}>
        <source src={mediaUrl} type={mimeType || 'video/mp4'} />
        <source src={mediaUrl} type="video/webm" />
        <source src={mediaUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <img
      {...imgProps}
      src={mediaUrl}
      alt={alt}
      className={className}
      onError={handleImgError}
    />
  );
};

function Complaint() {
  const {
    complaintId,
    regNo,
    complaints,
    complaintsView,
    loading,
    error,
    refreshing,
    mediaUrls,
    statusCounts,
    getMediaUrl,
    handleRefresh,
    handleRetry,
    handleReturnToDashboardClick,
    handleMediaNavigation,
    handleSelectThumbnail,
    handleMediaError,
    handleSolutionMediaError,
  } = useComplaint();

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
          <h2>Complaint Dashboard Error</h2>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
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
            <h2>No Complaint Found</h2>
            <p>There are currently no complaints in the system</p>
            <button onClick={handleRetry} className="refresh-button">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="complaints-dashboard-container">

      <div className="complaints-summary-header">
        <div className="complaints-summary-content">
          <Link to="/dashboard">
            <Button {...SHARED_BTN} text="Return to Dashboard" onClick={handleReturnToDashboardClick}
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

      <div className="complaints-status-bar">
        {STATUS_BAR_ITEMS.map(({ key, label, gradient, Icon }) => (
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

      <div className="complaints-list-container">
        {complaintsView.map(({ complaint, complaintIndex, activeMediaIndex, activeMedia, hasMultipleMedia, statusColor, StatusIcon }) => (
          <div key={complaint._id || complaintIndex} className="complaint-card-container">
            <div className="complaint-card">

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

                <div className="complaint-details-section">

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

                  {complaint.description && (
                    <div className="complaint-description">
                      <h3>Description</h3>
                      <p>{complaint.description}</p>
                    </div>
                  )}

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
                              onError={handleMediaError}
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

                      <div className="complaint-media-thumbnails">
                        {complaint.mediaFiles.map((media, mediaIndex) => (
                          <div
                            key={mediaIndex}
                            className={`complaint-thumbnail ${mediaIndex === activeMediaIndex ? 'complaint-thumbnail-active' : ''}`}
                            onClick={() => handleSelectThumbnail(complaintIndex, mediaIndex)}
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
                                onError={handleSolutionMediaError}
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
        ))}

        {complaintId && (
          <div className="complaint-card-container work-navigation">
            <Link to={`/maintanance/history/form/type/picker/${regNo}${complaintId ? `/${complaintId}` : ''}`}>
              <button>Conclude &amp; Store to database</button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

export default Complaint;