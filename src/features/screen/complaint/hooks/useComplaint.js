import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { fetchComplaints as fetchComplaintsService, getPreSignedMediaUrl } from '../api/complaint.api';

import {
  FALLBACK_IMAGE,
  REFRESH_INTERVAL_MS,
  isVideoMedia,
  getStatusColor,
  getStatusIcon,
} from '../constants/complaint.constant';

export const useAsyncMedia = ({ filePath, type, mimeType, onError, mediaUrls, getMediaUrl, rest }) => {
  const [mediaUrl, setMediaUrl] = useState(mediaUrls[filePath] || '');
  const [loading, setLoading] = useState(!mediaUrls[filePath]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!filePath) return;

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

  const isVideo = isVideoMedia({ mimeType, filePath, type });

  const { mediaUrls: _mu1, getMediaUrl: _gmu1, ...videoProps } = rest;
  const { controls, preload, mediaUrls: _mu2, getMediaUrl: _gmu2, onLoadStart, onLoadedData, ...imgProps } = rest;

  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
    if (onError) onError(e);
  };

  return { loading, error, mediaUrl, isVideo, videoProps, imgProps, handleImgError };
};

export const useComplaint = () => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { complaintId, regNo } = useParams();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [mediaUrls, setMediaUrls] = useState({});
  const [activeMediaIndices, setActiveMediaIndices] = useState({});

  useEffect(() => {
    setHeaderTitle('Complaint Management');
    setHeaderSubtitle(`${complaints.length} Complaint`);

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [complaints.length, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    fetchComplaints();

    const interval = setInterval(() => fetchComplaints(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComplaints = async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);

      const sorted = await fetchComplaintsService(complaintId);

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
      console.error('[Complaint] fetchComplaints error:', err);
      setError(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMediaUrl = async (filePath) => {
    if (!filePath) return '';
    if (mediaUrls[filePath]) return mediaUrls[filePath];

    const url = await getPreSignedMediaUrl(filePath);
    if (url) {
      setMediaUrls((prev) => ({ ...prev, [filePath]: url }));
      return url;
    }

    return FALLBACK_IMAGE;
  };

  const preloadMediaUrls = async (complaintsData) => {
    const paths = [];

    complaintsData.forEach((c) => {
      c.mediaFiles?.forEach((m) => { if (m.filePath && !mediaUrls[m.filePath]) paths.push(m.filePath); });
      c.solutions?.forEach((s) => { if (s.filePath && !mediaUrls[s.filePath]) paths.push(s.filePath); });
    });

    await Promise.all(paths.map(getMediaUrl));
  };

  const handleRefresh = () => fetchComplaints(true);
  const handleRetry = () => fetchComplaints();
  const handleReturnToDashboardClick = () => {};

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

  const handleSelectThumbnail = (complaintIndex, mediaIndex) => {
    setActiveMediaIndices((prev) => ({ ...prev, [complaintIndex]: mediaIndex }));
  };

  const handleMediaError = (e) => console.error('[Complaint] media error:', e.target?.error?.message);
  const handleSolutionMediaError = (e) => console.error('[Complaint] solution media error:', e);

  const statusCounts = {
    resolved: complaints.filter((c) => c.status?.toLowerCase() === 'resolved').length,
    pending: complaints.filter((c) => c.status?.toLowerCase() === 'pending').length,
    rejected: complaints.filter((c) => c.status?.toLowerCase() === 'rejected').length,
    'in-progress': complaints.filter((c) => c.status?.toLowerCase() === 'in-progress').length,
  };

  const complaintsView = complaints.map((complaint, complaintIndex) => {
    const activeMediaIndex = activeMediaIndices[complaintIndex] || 0;
    const activeMedia = complaint.mediaFiles[activeMediaIndex];
    const hasMultipleMedia = complaint.mediaFiles.length > 1;
    const statusColor = getStatusColor(complaint.status);
    const StatusIcon = getStatusIcon(complaint.status);

    return {
      complaint,
      complaintIndex,
      activeMediaIndex,
      activeMedia,
      hasMultipleMedia,
      statusColor,
      StatusIcon,
    };
  });

  return {
    complaintId,
    regNo,
    complaints,
    complaintsView,
    loading,
    error,
    refreshing,
    mediaUrls,
    activeMediaIndices,
    statusCounts,
    getMediaUrl,
    handleRefresh,
    handleRetry,
    handleReturnToDashboardClick,
    handleMediaNavigation,
    handleSelectThumbnail,
    handleMediaError,
    handleSolutionMediaError,
  };
};