// Components/Notification/Notification.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Notification page — fetches and displays normal + special notifications.
// Supports infinite-scroll pagination, sound alerts, and a details panel.
//
// Pure data + UI component.
// Real-time notifications arrive via the `liveNotification` prop.
// App.jsx owns WebSocket and passes new events down through this prop.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import './Notification.css';

import { END_POINT }  from '../../constants';
import { apiRequest } from '../../utils/api';
import { useAlert }   from '../../Context/AlertContext';

import Button from '../../Common/Button/Button';
import Input  from '../../Common/Input/Input';
import Loader from '../../Common/Loader/Loader';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE   = 100;
const LOAD_THRESHOLD   = 0.85;    // scroll % that triggers next-page load
const REFRESH_INTERVAL = 30_000;  // background poll interval (ms)

const SOUND_OPTIONS = {
  bell:    { name: 'Bell',    url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
  elegant: { name: 'Elegant', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  soft:    { name: 'Soft',    url: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3' },
  chime:   { name: 'Chime',   url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3' },
  ding:    { name: 'Ding',    url: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure Helpers — no React, no side effects
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a CSS colour for a notification based on type / priority. */
const getNotificationColor = (notification) => {
  if (notification.type === 'special') return '#f59e0b';
  switch (notification.priority) {
    case 'high':   return '#ef4444';
    case 'medium': return '#f97316';
    case 'low':    return '#10b981';
    default:       return '#64748b';
  }
};

/** Derives the display title from a notification object. */
const getNotificationTitle = (notification) => {
  if (notification.title) return notification.title;

  const stock = notification.stockInfo;
  if (!stock) return 'Notification';

  return stock.type === 'equipment'
    ? `Equipment Alert: ${stock.equipmentName || stock.product}`
    : `Stock Alert: ${stock.product || 'Stock Update'}`;
};

/** Derives the display body from a notification object. */
const getNotificationMessage = (notification) => {
  if (notification.type === 'normal') {
    if (typeof notification.description === 'string') return notification.description;
    if (typeof notification.description === 'object') return JSON.stringify(notification.description);
    return 'No description available';
  }

  if (notification.description) {
    if (typeof notification.description === 'object') {
      return notification.description.message || JSON.stringify(notification.description);
    }
    return String(notification.description);
  }

  if (notification.message) return notification.message;

  const stock = notification.stockInfo;
  if (!stock) return 'Special notification update';

  let msg = stock.type === 'equipment'
    ? `Equipment: ${stock.equipmentName || stock.product}`
    : `Stock: ${stock.product}`;

  if (stock.equipmentNumber) msg += ` (${stock.equipmentNumber})`;
  msg += `\nSerial: ${stock.serialNumber}`;
  msg += `\nQuantity: ${stock.stockCount}`;
  msg += `\nRate: ${Number(stock.rate).toFixed(2)}`;
  msg += `\nTotal Value: ${(stock.rate * stock.stockCount).toFixed(2)}`;

  return msg;
};

/** Human-readable relative time string. */
const formatNotificationTime = (notification) => {
  const raw = notification.time || notification.createdAt;
  if (!raw) return 'Recently';

  try {
    if (typeof raw === 'string' && (raw.includes('ago') || raw === 'just now')) return raw;

    const diffSec = Math.floor((Date.now() - new Date(raw).getTime()) / 1000);
    if (diffSec < 60)  return diffSec <= 1  ? 'just now'    : `${diffSec} sec ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin  < 60)  return diffMin  === 1 ? '1 min ago'   : `${diffMin} min ago`;

    const diffHr  = Math.floor(diffMin / 60);
    if (diffHr   < 24)  return diffHr   === 1 ? '1 hour ago'  : `${diffHr} hours ago`;

    const diffDay = Math.floor(diffHr  / 24);
    if (diffDay  < 7)   return diffDay  === 1 ? '1 day ago'   : `${diffDay} days ago`;

    const diffWk  = Math.floor(diffDay / 7);
    if (diffWk   < 4)   return diffWk   === 1 ? '1 week ago'  : `${diffWk} weeks ago`;

    const diffMo  = Math.floor(diffDay / 30);
    if (diffMo   < 12)  return diffMo   === 1 ? '1 month ago' : `${diffMo} months ago`;

    const diffYr  = Math.floor(diffMo  / 12);
    return diffYr === 1 ? '1 year ago' : `${diffYr} years ago`;
  } catch {
    return 'Recently';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components — defined outside parent so React never remounts them
// ─────────────────────────────────────────────────────────────────────────────

/** Single notification card. */
const NotificationCard = ({ notification, isLive, onSelect }) => {
  const isUnread = !notification.read;

  return (
    <div
      data-notification-id={notification._id}
      className={[
        'ntf-card',
        notification.type === 'special' ? 'ntf-special' : '',
        isUnread                        ? 'ntf-unread'  : '',
        notification.animate            ? 'ntf-animate' : '',
        isLive                          ? ''            : 'ntf-card-color',
      ].join(' ').trim()}
      onClick={() => onSelect(notification)}
    >
      <div className="ntf-content">
        <div className="ntf-card-header">
          <h3 className="ntf-card-title">{getNotificationTitle(notification)}</h3>

          <div className="ntf-card-footer">
            <span className="ntf-time-display">{formatNotificationTime(notification)}</span>
            <span className="ntf-priority" style={{ color: getNotificationColor(notification) }}>
              {notification.priority || 'normal'}
            </span>
          </div>

          {notification.type === 'special' && (
            <span className="ntf-tag">
              {notification.stockInfo?.type === 'equipment' ? 'EQUIPMENT' : 'STOCK'}
            </span>
          )}

          {isUnread && <div className="ntf-unread-dot" />}
        </div>

        <p className="ntf-message">{getNotificationMessage(notification)}</p>
      </div>
    </div>
  );
};

/** Slide-in details panel. */
const NotificationDetailsPanel = ({ notification, onClose, onDelete }) => {
  if (!notification) return null;

  return (
    <div className="ntf-details-panel">
      <div className="ntf-panel-overlay" onClick={onClose} />

      <div className="ntf-panel-content">
        <div className="ntf-panel-header">
          <h2>Details</h2>
          <button className="ntf-close-btn" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="ntf-panel-body">
          <div className="ntf-detail-row">
            <span className="ntf-detail-label">Title:</span>
            <span className="ntf-detail-value">{getNotificationTitle(notification)}</span>
          </div>

          <div className="ntf-detail-row">
            <span className="ntf-detail-label">Type:</span>
            <span className="ntf-detail-value">
              <span
                className="ntf-type-badge"
                style={{
                  backgroundColor: getNotificationColor(notification),
                  color:           notification.type === 'special' ? '#1e293b' : 'white',
                }}
              >
                {notification.type}
              </span>
            </span>
          </div>

          <div className="ntf-detail-row">
            <span className="ntf-detail-label">Priority:</span>
            <span
              className="ntf-detail-value ntf-priority"
              style={{ color: getNotificationColor(notification) }}
            >
              {notification.priority || 'normal'}
            </span>
          </div>

          <div className="ntf-detail-row">
            <span className="ntf-detail-label">Date & Time:</span>
            <span className="ntf-detail-value">
              {new Date(notification.time || notification.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="ntf-detail-row ntf-full">
            <span className="ntf-detail-label">Message:</span>
            <div className="ntf-detail-value ntf-message">
              {getNotificationMessage(notification)}
            </div>
          </div>
        </div>

        <div className="ntf-panel-footer">
          <button className="ntf-action-btn ntf-secondary" onClick={onClose}>Close</button>
          <button className="ntf-action-btn ntf-delete" onClick={() => onDelete(notification)}>
            Delete Notification
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Notifications Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {boolean} islivemodeON       - hides toolbar in live/dashboard mode
 * @param {object}  scrollContainerRef - scroll container ref (falls back to window)
 * @param {object}  liveNotification   - latest real-time notification from App.jsx
 *                                       App.jsx sets this on every WebSocket
 *                                       'new_notification' event
 */
const Notifications = ({ islivemodeON, scrollContainerRef, liveNotification }) => {
  const { showAlert } = useAlert();

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore,     setHasMore]     = useState(true);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [notifications,          setNotifications]          = useState([]);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [unreadCount,            setUnreadCount]            = useState(0);

  // ── Loading ────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Details Panel ──────────────────────────────────────────────────────────
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsPanel,     setShowDetailsPanel]     = useState(false);

  // ── Sound ──────────────────────────────────────────────────────────────────
  const [soundEnabled,  setSoundEnabled]  = useState(() => localStorage.getItem('notificationSoundEnabled') === 'true');
  const [selectedSound, setSelectedSound] = useState(() => {
    const saved = localStorage.getItem('notificationSound');
    return saved && SOUND_OPTIONS[saved] ? saved : 'bell';
  });

  // ── Refs ───────────────────────────────────────────────────────────────────
  const isLoadingRef         = useRef(false);
  const pendingPagesRef      = useRef(new Set());
  const notificationSoundRef = useRef(null);
  const uniqueCodeRef        = useRef('');

  // ─────────────────────────────────────────────────────────────────────────
  // Initialisation
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Build audio element once
    notificationSoundRef.current         = new Audio();
    notificationSoundRef.current.src     = SOUND_OPTIONS[selectedSound].url;
    notificationSoundRef.current.volume  = 0.7;
    notificationSoundRef.current.preload = 'auto';
    notificationSoundRef.current.addEventListener('error', playFallbackSound);

    // Resolve uniqueCode from localStorage
    try {
      const userData        = JSON.parse(localStorage.getItem('user') || '{}');
      uniqueCodeRef.current = userData.uniqueCode || '';
    } catch {
      uniqueCodeRef.current = '';
    }

    // Initial fetch
    fetchAllNotifications(false, 1, false);

    // Background refresh poll
    const refreshInterval = setInterval(() => {
      fetchAllNotifications(true, 1, true);
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(refreshInterval);
      notificationSoundRef.current?.removeEventListener('error', playFallbackSound);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Live Notification Injection
  // App.jsx pushes new WebSocket notifications via the liveNotification prop.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!liveNotification) return;

    showAlert('New Notification Received', 'notifications_active', '--color-primary');
    playNotificationSound();

    const enriched = { ...liveNotification, animate: true, read: false, isNew: true };

    setNotifications(prev => [
      enriched,
      ...prev.map(n => ({ ...n, animate: false, isNew: false })),
    ]);

    // Clear animation flag after CSS transition completes
    setTimeout(() => {
      setNotifications(prev =>
        prev.map(n =>
          n._id === liveNotification._id ? { ...n, animate: false, isNew: false } : n
        )
      );
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveNotification]);

  // ─────────────────────────────────────────────────────────────────────────
  // Infinite Scroll
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let scrollTimeout = null;
    let lastScrollTop = 0;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const el             = scrollContainerRef?.current || window;
        const scrollTop      = el === window ? window.scrollY                        : el.scrollTop;
        const windowHeight   = el === window ? window.innerHeight                    : el.clientHeight;
        const documentHeight = el === window ? document.documentElement.scrollHeight : el.scrollHeight;
        const scrollPct      = (scrollTop + windowHeight) / documentHeight;
        const isScrollingDown = scrollTop > lastScrollTop;

        // ── Load next page ─────────────────────────────────────────────────
        if (isScrollingDown && scrollPct > LOAD_THRESHOLD && hasMore && !isLoadingRef.current && !loading) {
          const nextPage = currentPage + 1;
          if (pendingPagesRef.current.has(nextPage)) return;

          pendingPagesRef.current.add(nextPage);
          showAlert('Loading more notifications...', 'sync', '--color-info-600');
          isLoadingRef.current = true;
          setCurrentPage(nextPage);

          fetchAllNotifications(false, nextPage, true)
            .finally(() => {
              pendingPagesRef.current.delete(nextPage);
              isLoadingRef.current = false;
              showAlert('Loaded successfully', 'check_circle', '--color-success-600');
            });
        }

        // ── Trim list when scrolling back to top ───────────────────────────
        if (!isScrollingDown && scrollTop < 100 && currentPage > 1 && notifications.length > ITEMS_PER_PAGE) {
          setNotifications(prev => prev.slice(0, ITEMS_PER_PAGE));
          setCurrentPage(1);
          pendingPagesRef.current.clear();
        }

        lastScrollTop = scrollTop;
      }, 200);
    };

    const el = scrollContainerRef?.current || window;
    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, currentPage, notifications.length, scrollContainerRef]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived display list — sorted newest-first
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const sorted = [...notifications].sort((a, b) => {
      const dateA = new Date(a.time || a.createdAt || 0);
      const dateB = new Date(b.time || b.createdAt || 0);
      return dateB - dateA;
    });

    setDisplayedNotifications(sorted);
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  const fetchNormalNotifications = async (page = 1) => {
    try {
      const response = await apiRequest(
        `${END_POINT}/notification/get-all-notification`,
        'POST',
        { uniqueCode: uniqueCodeRef.current, page, limit: ITEMS_PER_PAGE }
      );
      const data = await response.json();

      if (response.ok && data.status === 200) {
        setHasMore(data.pagination.hasMore);
        return data.data
          .filter(n => n.sourceId !== 'attendance')
          .map(n => ({ ...n, type: 'normal', read: true }));
      }

      console.error('[Notifications] fetchNormal:', data.message);
      return [];
    } catch (error) {
      console.error('[Notifications] fetchNormal:', error);
      return [];
    }
  };

  const fetchSpecialNotifications = async () => {
    try {
      if (!uniqueCodeRef.current) return [];

      const response = await apiRequest(
        `${END_POINT}/users/get-special-notification`,
        'POST',
        { uniqueCode: uniqueCodeRef.current }
      );
      const data = await response.json();

      if (response.ok && data.status === 200) {
        return data.data.notifications.map(n => ({
          ...n,
          type: 'special',
          read: true,
          _id:  n._id || `special_${n.stockId}_${Date.now()}`,
        }));
      }

      console.error('[Notifications] fetchSpecial:', data.message);
      return [];
    } catch (error) {
      console.error('[Notifications] fetchSpecial:', error);
      return [];
    }
  };

  /**
   * Fetches and merges notifications.
   * @param {boolean} isBackgroundRefresh - silent background poll
   * @param {number}  page               - page number to load
   * @param {boolean} append             - append to existing list vs replace
   */
  const fetchAllNotifications = async (isBackgroundRefresh = false, page = 1, append = false) => {
    if (!isBackgroundRefresh && !append) setLoading(true);

    try {
      const [normal, special] = await Promise.all([
        fetchNormalNotifications(page),
        page === 1 ? fetchSpecialNotifications() : Promise.resolve([]),
      ]);

      const incoming = [...(page === 1 ? special : []), ...normal];

      setNotifications(prev => {
        if (!append && !isBackgroundRefresh) return incoming;

        const existingIds = new Set(prev.map(n => n._id));
        const unique      = incoming.filter(n => !existingIds.has(n._id));

        return isBackgroundRefresh ? [...unique, ...prev] : [...prev, ...unique];
      });
    } catch (error) {
      console.error('[Notifications] fetchAll:', error);
    } finally {
      if (!isBackgroundRefresh && !append) setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Sound
  // ─────────────────────────────────────────────────────────────────────────

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    setTimeout(() => {
      try {
        if (!notificationSoundRef.current) { playFallbackSound(); return; }
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(playFallbackSound);
      } catch {
        playFallbackSound();
      }
    }, 1_000);
  };

  const playFallbackSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const play = (freq, startAt) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type            = 'sine';
        gain.gain.setValueAtTime(0.3, startAt);
        gain.gain.exponentialRampToValueAtTime(0.01, startAt + 0.1);
        osc.start(startAt);
        osc.stop(startAt + 0.1);
      };
      play(800,  ctx.currentTime);
      play(1000, ctx.currentTime + 0.15);
    } catch (error) {
      console.error('[Notifications] fallbackSound:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllNotifications(false, 1, false);
    setRefreshing(false);
  };

  const handleSelectNotification = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsPanel(true);
    markAsRead(notification._id);
  };

  const handleClosePanel = () => {
    setShowDetailsPanel(false);
    setTimeout(() => setSelectedNotification(null), 300);
  };

  const handleDeleteNotification = async (notification) => {
    if (notification.type === 'special') {
      await deleteSpecialNotification(notification._id);
    } else {
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
    }
    handleClosePanel();
  };

  const deleteSpecialNotification = async (notificationId) => {
    try {
      const response = await apiRequest(
        `${END_POINT}/users/delete-special-notification/${notificationId}`,
        'DELETE'
      );
      const data = await response.json();

      if (response.ok && data.status === 200) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        return true;
      }

      console.error('[Notifications] deleteSpecial:', data.message);
      return false;
    } catch (error) {
      console.error('[Notifications] deleteSpecial:', error);
      return false;
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('notificationSoundEnabled', String(next));
    if (next) setTimeout(playNotificationSound, 100);
  };

  const handleSoundChange = (e) => {
    const newSound = e.target.value;
    setSelectedSound(newSound);
    localStorage.setItem('notificationSound', newSound);
    if (notificationSoundRef.current) notificationSoundRef.current.src = SOUND_OPTIONS[newSound].url;
    setTimeout(playNotificationSound, 100);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Shared Button defaults
  // ─────────────────────────────────────────────────────────────────────────

  const BTN = {
    variant: 'gradient', font: 'md', animation: '', squircle: '4xl',
    height: '46px', type: 'submit',
    shadowPosition: 'to-bottom', shadowColor: 'white-600',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <div className="ntf-loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`ntf-grid ntf-container ${islivemodeON ? 'round-live' : ''}`}>

      {/* ── Floating unread badge ── */}
      {unreadCount > 0 && (
        <div className="ntf-unread-badge" onClick={markAllAsRead}>
          {unreadCount}
        </div>
      )}

      {/* ── Toolbar (hidden in live mode) ── */}
      {!islivemodeON && (
        <div className="ntf-actions">
          <div className="ntf-action-buttons">
            <Button
              {...BTN}
              text={refreshing ? 'Refreshing...' : 'Refresh'}
              onClick={handleRefresh}
              colorScheme="violet-600"
              textColor="white-400"
              width="130px"
              type={refreshing ? 'disabled' : 'submit'}
              iconRight="refresh"
            />
            <Button
              {...BTN}
              text="Mark all as read"
              onClick={markAllAsRead}
              colorScheme="lime-700"
              textColor="white-400"
              width="200px"
              type={unreadCount === 0 ? 'disabled' : 'submit'}
              iconRight="check"
            />
            <Button
              {...BTN}
              text={soundEnabled ? 'Sound On' : 'Sound Off'}
              onClick={toggleSound}
              colorScheme={soundEnabled ? 'amber-700' : 'amber-300'}
              textColor={soundEnabled ? 'white-800' : 'black-300'}
              width="160px"
              iconRight={soundEnabled ? 'notification_audio' : 'notification_audio_off'}
            />
            <Input
              type="select"
              value={selectedSound}
              onChange={handleSoundChange}
              options={Object.entries(SOUND_OPTIONS).map(([key, s]) => ({ label: s.name, value: key }))}
              colorScheme="rose-700"
              variant="gradient"
              fontSize="md"
              squircle="4xl"
              width="140px"
              height="46px"
              textColor="white-200"
              shadowPosition="bottom"
              shadowColor="white-200"
              animation="none"
              fontWeight="500"
              inputPaddingInline="xl"
            />
          </div>
        </div>
      )}

      {/* ── Count row ── */}
      <div className={islivemodeON ? 'live-table-info' : 'ntf-table-info'}>
        Showing {displayedNotifications.length} notifications
      </div>

      {/* ── Notification cards ── */}
      <div className={`ntf-grid ${islivemodeON ? 'live-dsh-pad' : 'ntf-pad'}`}>
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map((notification, index) => (
            <NotificationCard
              key={notification._id || `${notification.type}_${index}`}
              notification={notification}
              isLive={islivemodeON}
              onSelect={handleSelectNotification}
            />
          ))
        ) : (
          <div className="ntf-no-results">
            <div className="ntf-no-results-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#64748b" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
              </svg>
            </div>
            <h3>No notifications found</h3>
            <p>There are no notifications yet.</p>
          </div>
        )}
      </div>

      {/* ── Details panel ── */}
      {showDetailsPanel && (
        <NotificationDetailsPanel
          notification={selectedNotification}
          onClose={handleClosePanel}
          onDelete={handleDeleteNotification}
        />
      )}

    </div>
  );
};

export default Notifications;