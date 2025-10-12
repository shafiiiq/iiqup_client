import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { END_POINT } from '../../constants';
import './Complaints.css';
import { Link, useParams } from 'react-router';
import { apiRequest } from '../../utils/0auth';

// Async Media Component for handling media URLs
const AsyncMedia = ({ filePath, type, mimeType, alt, className, onError, mediaUrls, getMediaUrl, ...props }) => {
  const [mediaUrl, setMediaUrl] = useState(mediaUrls[filePath] || '');
  const [loading, setLoading] = useState(!mediaUrls[filePath]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      if (!filePath) return;

      if (mediaUrls[filePath]) {
        setMediaUrl(mediaUrls[filePath]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = await getMediaUrl(filePath);
        setMediaUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error loading media:', err);
        setError(true);
        setLoading(false);
        if (onError) onError(err);
      }
    };

    loadMedia();
  }, [filePath, mediaUrls, getMediaUrl]);

  // Determine if it's a video based on mimeType or file extension
  const isVideo = () => {
    if (mimeType) {
      return mimeType.toLowerCase().includes('video') || mimeType.toLowerCase() === 'video';
    }
    if (filePath) {
      const extension = filePath.toLowerCase().split('.').pop();
      return ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'm4v'].includes(extension);
    }
    return type === 'video';
  };

  if (loading) {
    return (
      <div className={`${className} media-loading`} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        minHeight: '100px'
      }}>
        <div className="loading-spinner-small"></div>
      </div>
    );
  }

  if (error || !mediaUrl) {
    return (
      <img
        src="https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg"
        alt={alt}
        className={className}
        onError={onError}
      />
    );
  }

  if (isVideo()) {
    // Filter out DOM-invalid props for video element
    const { mimeType: _, mediaUrls: __, getMediaUrl: ___, ...validVideoProps } = props;

    return (
      <video
        {...validVideoProps}
        className={className}
        onError={onError}
      >
        <source src={mediaUrl} type={mimeType || 'video/mp4'} />
        <source src={mediaUrl} type="video/webm" />
        <source src={mediaUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    );
  } else {
    // Filter out DOM-invalid props for img element
    const { controls, preload, mimeType: _, mediaUrls: __, getMediaUrl: ___, onLoadStart, onLoadedData, ...validImgProps } = props;

    return (
      <img
        {...validImgProps}
        src={mediaUrl}
        alt={alt}
        className={className}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg';
          if (onError) onError(e);
        }}
      />
    );
  }
};

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndices, setActiveMediaIndices] = useState({});
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [videoErrors, setVideoErrors] = useState({}); // Track video loading errors
  const [videoLoadingStates, setVideoLoadingStates] = useState({}); // Track video loading states

  const { complaintId, regNo } = useParams()

  // Real-time clock and date
  // useEffect(() => {
  //   const updateDateTime = () => {
  //     const now = new Date();
  //     const timeString = now.toLocaleTimeString('en-US', {
  //       hour: '2-digit',
  //       minute: '2-digit',
  //       second: '2-digit',
  //       hour12: true
  //     });

  //     setLastUpdated(`Last updated: ${timeString}`);
  //   };

  //   updateDateTime();
  //   // const interval = setInterval(updateDateTime, 4000);
  //   // return () => clearInterval(interval);
  // }, []);
  const fetchComplaints = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setLoading(!showRefresh);

      let response;

      if (complaintId) {
        response = await apiRequest(`${END_POINT}/complaints/get-complaints/${complaintId}`);
      } else {
        response = await apiRequest(`${END_POINT}/complaints/get-all-complaints`);
      }

      if (!response.ok) throw new Error('Failed to fetch complaints');

      const data = await response.json();

      // Convert to array if fetching single complaint
      const complaintsArray = complaintId ? [data] : data;

      if (!Array.isArray(complaintsArray)) throw new Error('Invalid data format: expected array');

      // Sort complaints by createdAt in descending order (newest first)
      const sortedComplaints = [...complaintsArray].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Initialize active media indices
      const indices = {};
      sortedComplaints.forEach((complaint, idx) => {
        indices[idx] = 0;
      });

      setActiveMediaIndices(indices);
      const processedComplaints = sortedComplaints.map(complaint => ({
        ...complaint,
        mediaFiles: complaint.mediaFiles || [],
        solutions: complaint.solutions || []
      }));

      setComplaints(processedComplaints);

      // Preload all media URLs after setting complaints
      await preloadMediaUrls(processedComplaints);

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Auto-refresh every 10 seconds
    // const refreshInterval = setInterval(() => {
    //   fetchComplaints(true);
    // }, 4000);

    // return () => clearInterval(refreshInterval);
  }, []);

  const handleRefresh = () => {
    fetchComplaints(true);
  };

  const handleMediaNavigation = (complaintIndex, direction) => {
    setActiveMediaIndices(prev => {
      const currentIndex = prev[complaintIndex] || 0;
      const mediaCount = complaints[complaintIndex]?.mediaFiles?.length || 0;

      if (mediaCount <= 1) return prev;

      let newIndex;
      if (direction === 'prev') {
        newIndex = currentIndex === 0 ? mediaCount - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === mediaCount - 1 ? 0 : currentIndex + 1;
      }

      return {
        ...prev,
        [complaintIndex]: newIndex
      };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // State to store pre-signed URLs
  const [mediaUrls, setMediaUrls] = useState({});

  // Enhanced media URL construction
  const getMediaUrl = async (filePath) => {
    if (!filePath) return '';

    // Check if URL is already cached
    if (mediaUrls[filePath]) {
      return mediaUrls[filePath];
    }

    try {
      const body = { key: filePath, isLong: true };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);
      const s3URL = await s3response.json();
      const fullUrl = s3URL.dataUrl;

      // Cache the URL
      setMediaUrls(prev => ({
        ...prev,
        [filePath]: fullUrl
      }));

      console.log('Generated URL:', fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error getting media URL:', error);
      // Fallback URL
      return 'https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg';
    }
  };

  // Function to preload media URLs
  const preloadMediaUrls = async (complaints) => {
    const urlPromises = [];

    complaints.forEach(complaint => {
      // Preload complaint media files
      complaint.mediaFiles?.forEach(media => {
        if (media.filePath && !mediaUrls[media.filePath]) {
          urlPromises.push(getMediaUrl(media.filePath));
        }
      });

      // Preload solution media files
      complaint.solutions?.forEach(solution => {
        if (solution.filePath && !mediaUrls[solution.filePath]) {
          urlPromises.push(getMediaUrl(solution.filePath));
        }
      });
    });

    // Wait for all URLs to be loaded
    await Promise.all(urlPromises);
  };

  // Test if URL is accessible
  const testMediaUrl = async (url) => {
    try {
      const response = await apiRequest(url, 'HEAD');
      return response.ok;
    } catch (error) {
      console.error(`URL ${url} test failed:`, error);
      return false;
    }
  };

  const handleVideoError = (complaintIndex, mediaIndex, error) => {
    const key = `${complaintIndex}-${mediaIndex}`;
    setVideoErrors(prev => ({
      ...prev,
      [key]: error
    }));
    console.error(`Video error for complaint ${complaintIndex}, media ${mediaIndex}:`, error);
  };

  const handleVideoLoadStart = (complaintIndex, mediaIndex) => {
    const key = `${complaintIndex}-${mediaIndex}`;
    setVideoLoadingStates(prev => ({
      ...prev,
      [key]: 'loading'
    }));
  };

  const handleVideoLoadedData = (complaintIndex, mediaIndex) => {
    const key = `${complaintIndex}-${mediaIndex}`;
    setVideoLoadingStates(prev => ({
      ...prev,
      [key]: 'loaded'
    }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return <CheckCircle size={16} />;
      case 'in-progress': return <Clock size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown duration';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="complaints-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Complaints Dashboard...</h2>
          <p>Fetching complaint data from all systems</p>
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
            <RefreshCw size={16} />
            Retry
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
              <RefreshCw size={16} />
              Refresh
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
            <button className={`app-refresh-btn ${refreshing ? 'is-refreshing' : ''}`}>
              Return to Dashboard
            </button>
          </Link>
          <div className="complaints-updated-info">
            <span>{lastUpdated}</span>
            <span>Showing {complaints.length} complaints</span>
          </div>
          <button
            onClick={handleRefresh}
            className={`complaints-refresh-button ${refreshing ? 'refreshing' : ''}`}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="complaints-dashboard-header">
        <div className="complaints-header-content">
          <div>
            <h1 className="complaints-dashboard-title">Complaints Management</h1>
            <p className="complaints-dashboard-subtitle">Real-time Complaint Tracking & Resolution</p>
          </div>
        </div>
      </div>

      <div className="complaints-status-bar">
        <div className="complaints-status-item">
          <div className="complaints-status-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="complaints-status-content">
            <span className="complaints-status-value">
              {complaints.filter(c => c.status?.toLowerCase() === 'resolved').length}
            </span>
            <span className="complaints-status-label">Resolved</span>
          </div>
        </div>
        <div className="complaints-status-item">
          <div className="complaints-status-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Clock size={24} />
          </div>
          <div className="complaints-status-content">
            <span className="complaints-status-value">
              {complaints.filter(c => c.status?.toLowerCase() === 'pending').length}
            </span>
            <span className="complaints-status-label">Pending</span>
          </div>
        </div>
        <div className="complaints-status-item">
          <div className="complaints-status-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <XCircle size={24} />
          </div>
          <div className="complaints-status-content">
            <span className="complaints-status-value">
              {complaints.filter(c => c.status?.toLowerCase() === 'rejected').length}
            </span>
            <span className="complaints-status-label">Rejected</span>
          </div>
        </div>
        <div className="complaints-status-item">
          <div className="complaints-status-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Clock size={24} />
          </div>
          <div className="complaints-status-content">
            <span className="complaints-status-value">
              {complaints.filter(c => c.status?.toLowerCase() === 'in-progress').length}
            </span>
            <span className="complaints-status-label">In Progress</span>
          </div>
        </div>
      </div>

      <div className="complaints-list-container">
        {complaints.map((complaint, complaintIndex) => {
          const activeMediaIndex = activeMediaIndices[complaintIndex] || 0;
          const activeMedia = complaint.mediaFiles[activeMediaIndex];
          const hasMultipleMedia = complaint.mediaFiles.length > 1;
          const statusColor = getStatusColor(complaint.status);
          const statusIcon = getStatusIcon(complaint.status);
          const videoErrorKey = `${complaintIndex}-${activeMediaIndex}`;
          const videoLoadingKey = `${complaintIndex}-${activeMediaIndex}`;

          return (
            <div key={complaint._id || complaintIndex} className="complaint-card-container">
              <div className="complaint-card">
                <div className="complaint-card-header" style={{ borderBottom: `3px solid ${statusColor}` }}>
                  <div className="complaint-title-section">
                    <h2 className="complaint-title">Complaint #{complaintIndex + 1}</h2>
                    <div className="complaint-status-badge" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                      {statusIcon}
                      <span>{complaint.status || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="complaint-meta">
                    <span className="complaint-date">
                      Submitted on {formatDate(complaint.createdAt)}
                    </span>
                    {complaint.updatedAt && (
                      <span className="complaint-date">
                        Last updated: {formatDate(complaint.updatedAt)}
                      </span>
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
                          <strong>Equipment Reg No:</strong>
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
                              <button
                                className="complaint-media-nav-button complaint-media-prev-button"
                                onClick={() => handleMediaNavigation(complaintIndex, 'prev')}
                              >
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
                                onLoadStart={() => handleVideoLoadStart(complaintIndex, activeMediaIndex)}
                                onLoadedData={() => handleVideoLoadedData(complaintIndex, activeMediaIndex)}
                                onError={(e) => {
                                  handleVideoError(complaintIndex, activeMediaIndex, e.target?.error?.message || 'Media load error');
                                }}
                              />
                            </div>

                            {hasMultipleMedia && (
                              <button
                                className="complaint-media-nav-button complaint-media-next-button"
                                onClick={() => handleMediaNavigation(complaintIndex, 'next')}
                              >
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
                              onClick={() => setActiveMediaIndices(prev => ({
                                ...prev,
                                [complaintIndex]: mediaIndex
                              }))}
                            >
                              {/* Check if it's a video based on mimeType or file extension */}
                              {(() => {
                                const isVideo = media.mimeType?.toLowerCase().includes('video') ||
                                  media.mimeType?.toLowerCase() === 'video' ||
                                  media.filePath?.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v)$/);

                                return isVideo ? (
                                  <div className="complaint-video-thumbnail">
                                    <div className="complaint-thumbnail-placeholder">
                                      <span className="complaint-play-icon">▶</span>
                                      <div style={{ fontSize: '10px', marginTop: '4px' }}>
                                        {media.mimeType || 'video'}
                                      </div>
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
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="complaint-no-media">No media files available for this complaint</div>
                    )}
                  </div>

                  {/* FIXED SOLUTIONS SECTION */}
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

                            {/* Display the solution file using AsyncMedia component */}
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
                                  onError={(e) => {
                                    console.error('Solution media error:', e);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-solutions">
                        No solutions provided yet for this complaint
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {
          complaintId ? (
            <div className="complaint-card-container work-navigation">
              <Link to={`/service-form-nav/${regNo}`}>
                <button>
                  Conclude & Store to database 
                </button>
              </Link>
            </div>
          ) : ''
        }
      </div>
    </div>
  );
};

export default Complaints;