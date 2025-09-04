import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { END_POINT } from '../../constants';
import './Notification.css';
import { apiRequest } from '../../utils/0auth';

const Notifications = ({ islivemodeON }) => {
  // Quick filter options
  const quickFilters = [
    { id: 'all', label: 'All', type: 'all', color: '#6366f1' },
    { id: 'normal', label: 'Normal', type: 'normal', color: '#10b981' },
    { id: 'special', label: 'Special', type: 'special', color: '#f59e0b' },
    { id: 'high', label: 'High Priority', type: 'high', color: '#ef4444' },
  ];

  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // WebSocket refs
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const notificationSoundRef = useRef(null);

  useEffect(() => {
    // Initialize notification sound
    notificationSoundRef.current = new Audio('/assets/sounds/notification.mp3');

    initializeApp();
    return cleanup;
  }, []);

  useEffect(() => {
    filterNotifications();
    // Update unread count when notifications change
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [selectedFilter, notifications]);

  // Live time update effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      await initializeData();
      await setupWebSocket();
      await setupWebNotifications();
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  };

  const setupWebNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Web notifications enabled');
        } else {
          console.log('❌ Web notifications denied');
        }
      }
    } catch (error) {
      console.error('Error setting up web notifications:', error);
    }
  };

  const showWebNotification = (title, body, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  };

  const playNotificationSound = () => {
    try {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const initializeData = async () => {
    try {
      await getUserUniqueCode();
      await fetchAllNotifications();
    } catch (error) {
      console.error('Error initializing data:', error);
      setLoading(false);
    }
  };

  const getUserUniqueCode = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setUniqueCode(parsedUserData.uniqueCode || '');
        return parsedUserData.uniqueCode;
      }
    } catch (error) {
      console.error('Error getting user unique code:', error);
    }
    return '';
  };

  const setupWebSocket = async () => {
    try {
      const userUniqueCode = await getUserUniqueCode();
      if (!userUniqueCode) {
        return;
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(END_POINT, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        socketRef.current.emit('authenticate', {
          uniqueCode: userUniqueCode,
          userId: userUniqueCode
        });
      });

      socketRef.current.on('authenticated', (data) => {
      });

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socketRef.current?.connected) {
            setupWebSocket();
          }
        }, 3000);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setIsConnected(false);
      });

      socketRef.current.on('new_notification', (data) => {
        handleNewNotification(data);
      });

      socketRef.current.on('notification', (data) => {
        handleNewNotification(data);
      });

      const pingInterval = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('ping');
        }
      }, 30000);

      socketRef.current.pingInterval = pingInterval;

    } catch (error) {
      console.error('❌ Error setting up WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleNewNotification = async (notification) => {
    try {
      if (!notification) {
        console.error('❌ Notification is null or undefined');
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Add animation class to new notification
      notification.animate = true;
      notification.read = false;

      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        return newNotifications;
      });

      const notificationTitle = getNotificationTitle(notification);
      const notificationBody = getNotificationMessage(notification);

      showWebNotification(notificationTitle, notificationBody);

    } catch (error) {
      console.error('❌ Error in handleNewNotification:', error);
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      if (socketRef.current.pingInterval) {
        clearInterval(socketRef.current.pingInterval);
      }
      socketRef.current.disconnect();
    }
  };

  const fetchNormalNotifications = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/notification/get-all-notification`);
      const data = await response.json();

      if (response.ok && data.status === 200) {
        return data.data.map((notification) => ({
          ...notification,
          type: 'normal',
          read: true
        }));
      } else {
        console.error('Error fetching normal notifications:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching normal notifications:', error);
      return [];
    }
  };

  const fetchSpecialNotifications = async (userUniqueCode) => {
    try {
      if (!userUniqueCode) return [];

      const body = {
        uniqueCode: userUniqueCode
      }

      const response = await apiRequest(`${END_POINT}/users/get-special-notification`,
        'POST',
        body
      );

      const data = await response.json();

      if (response.ok && data.status === 200) {
        return data.data.notifications.map((notification) => ({
          ...notification,
          type: 'special',
          read: true,
          _id: notification._id || `special_${notification.stockId}_${Date.now()}`
        }));
      } else {
        console.error('Error fetching special notifications:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching special notifications:', error);
      return [];
    }
  };

  const deleteSpecialNotification = async (notificationId) => {
    try {
      const response = await apiRequest(`${END_POINT}/users/delete-special-notification/${notificationId}`,
        'DELETE',
      );

      const data = await response.json();

      if (response.ok && data.status === 200) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        return true;
      } else {
        console.error('Error deleting notification:', data.message);
        alert('Failed to delete notification. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
      return false;
    }
  };

  const fetchAllNotifications = async () => {
    setLoading(true);
    try {
      const userUniqueCode = await getUserUniqueCode();

      const [normalNotifications, specialNotifications] = await Promise.all([
        fetchNormalNotifications(),
        fetchSpecialNotifications(userUniqueCode)
      ]);

      const allNotifications = [
        ...specialNotifications,
        ...normalNotifications
      ];

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      alert('Failed to fetch notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllNotifications();
    setRefreshing(false);
  };

  const filterNotifications = () => {
    let filtered = notifications;

    switch (selectedFilter) {
      case 'normal':
        filtered = notifications.filter(n => n.type === 'normal');
        break;
      case 'special':
        filtered = notifications.filter(n => n.type === 'special');
        break;
      case 'high':
        filtered = notifications.filter(n =>
          (n.type === 'normal' && n.priority === 'high') ||
          (n.type === 'special' && n.priority === 'high')
        );
        break;
      default:
        filtered = notifications;
    }

    setFilteredNotifications(filtered);
  };

  const handleDeleteNotification = async (notificationId, notification) => {
    if (notification.type === 'special') {
      await deleteSpecialNotification(notificationId);
    } else {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n =>
      n._id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationStats = () => {
    return {
      total: notifications.length,
      normal: notifications.filter(n => n.type === 'normal').length,
      special: notifications.filter(n => n.type === 'special').length,
      highPriority: notifications.filter(n =>
        (n.type === 'normal' && n.priority === 'high') ||
        (n.type === 'special' && n.priority === 'high')
      ).length,
    };
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === 'special') {
      if (notification.stockInfo?.type === 'equipment') {
        return '🚛';
      }
      return '📦';
    }

    switch (notification.priority) {
      case 'high': return '🚨';
      case 'medium': return '📢';
      case 'low': return '📝';
      default: return '📢';
    }
  };

  const getNotificationColor = (notification) => {
    if (notification.type === 'special') {
      return '#f59e0b';
    }

    switch (notification.priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const formatNotificationTime = (notification) => {
    let dateToFormat = null;

    if (notification.type === 'normal') {
      dateToFormat = notification.time;
    } else {
      dateToFormat = notification.time || notification.createdAt;
    }

    if (!dateToFormat) {
      return 'Recently';
    }

    try {
      if (typeof dateToFormat === 'string' &&
        (dateToFormat.includes('ago') || dateToFormat === 'just now')) {
        return dateToFormat;
      }

      const now = new Date();
      const targetDate = new Date(dateToFormat);
      const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return diffInSeconds <= 1 ? 'just now' : `${diffInSeconds} sec ago`;
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} min ago`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
      }

      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) {
        return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) {
        return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
      }

      const diffInYears = Math.floor(diffInMonths / 12);
      return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Recently';
    }
  };

  const getNotificationTitle = (notification) => {
    if (notification.type === 'normal') {
      return notification.title;
    } else {
      if (notification.title) {
        return notification.title;
      }

      const stockInfo = notification.stockInfo;

      if (stockInfo?.type === 'equipment') {
        return `Equipment Alert: ${stockInfo.equipmentName || stockInfo.product}`;
      } else {
        return `Stock Alert: ${stockInfo?.product || 'Stock Update'}`;
      }
    }
  };

  const getNotificationMessage = (notification) => {
    if (notification.type === 'normal') {
      if (typeof notification.description === 'string') {
        return notification.description;
      } else if (typeof notification.description === 'object') {
        return JSON.stringify(notification.description);
      }
      return 'No description available';
    } else {
      if (notification.description) {
        if (typeof notification.description === 'object') {
          return notification.description.message ||
            JSON.stringify(notification.description);
        }
        return notification.description.toString();
      }

      const stockInfo = notification.stockInfo;

      if (notification.message) {
        return notification.message;
      }

      if (stockInfo) {
        let message = '';

        if (stockInfo.type === 'equipment') {
          message = `Equipment: ${stockInfo.equipmentName || stockInfo.product}`;
          if (stockInfo.equipmentNumber) {
            message += ` (${stockInfo.equipmentNumber})`;
          }
        } else {
          message = `Stock: ${stockInfo.product}`;
        }

        message += `\nSerial: ${stockInfo.serialNumber}`;
        message += `\nQuantity: ${stockInfo.stockCount}`;
        message += `\nRate: ${stockInfo.rate.toFixed(2)}`;
        message += `\nTotal Value: ${(stockInfo.rate * stockInfo.stockCount).toFixed(2)}`;

        return message;
      }

      return 'Special notification update';
    }
  };

  const stats = getNotificationStats();

  if (loading && !refreshing) {
    return (
      <div className="ntf-loading-container">
        <div className="ntf-spinner">
          <div className="ntf-spinner-circle"></div>
          <div className="ntf-spinner-circle"></div>
          <div className="ntf-spinner-circle"></div>
          <div className="ntf-spinner-circle"></div>
        </div>
        <p className="ntf-loading-text">Loading Live Updates</p>
      </div>
    );
  }

  return (
    <div className={`ntf-grid ntf-container ${islivemodeON ? 'round-live' : ''}`}>
      {/* Floating unread badge */}
      {unreadCount > 0 && (
        <div className="ntf-unread-badge" onClick={markAllAsRead}>
          {unreadCount}
        </div>
      )}

      <div className="ntf-header">
        <div className="ntf-header-content">
          <h1 className="ntf-title">
            Live Updates
            {unreadCount > 0 && (
              <span className="ntf-unread-count">{unreadCount} new</span>
            )}
          </h1>
          <div className="ntf-connection-status">
            <div className={`ntf-status-dot ${isConnected ? 'ntf-connected' : 'ntf-disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        {/* <div className="ntf-date-time">
          <span className="ntf-date">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <span className="ntf-time">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div> */}
      </div>

      {
        islivemodeON ? null : (
          <div className="ntf-actions">
            <div className="ntf-filter-buttons">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`ntf-filter-btn ${selectedFilter === filter.id ? 'ntf-active' : ''}`}
                  style={{
                    '--ntf-filter-color': filter.color,
                  }}
                >
                  {filter.label}
                  {selectedFilter === filter.id && (
                    <span className="ntf-filter-indicator"></span>
                  )}
                </button>
              ))}
            </div>
            <div className="ntf-action-buttons">
              <button
                onClick={onRefresh}
                className="ntf-refresh-btn"
                disabled={refreshing}
              >
                <span className="ntf-refresh-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                  </svg>
                </span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={markAllAsRead}
                className="ntf-mark-read-btn"
                disabled={unreadCount === 0}
              >
                <span className="ntf-mark-read-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                  </svg>
                </span>
                Mark all as read
              </button>
            </div>
          </div>
        )
      }

      {
        islivemodeON ? null : (
          <div className="ntf-stats-cards">
            <div className="ntf-stat-card ntf-total">
              <div className="ntf-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,10.5A1.5,1.5 0 0,1 13.5,12A1.5,1.5 0 0,1 12,13.5A1.5,1.5 0 0,1 10.5,12A1.5,1.5 0 0,1 12,10.5M7.5,10.5A1.5,1.5 0 0,1 9,12A1.5,1.5 0 0,1 7.5,13.5A1.5,1.5 0 0,1 6,12A1.5,1.5 0 0,1 7.5,10.5M16.5,10.5A1.5,1.5 0 0,1 18,12A1.5,1.5 0 0,1 16.5,13.5A1.5,1.5 0 0,1 15,12A1.5,1.5 0 0,1 16.5,10.5Z" />
                </svg>
              </div>
              <div className="ntf-stat-content">
                <div className="ntf-stat-value">{stats.total}</div>
                <div className="ntf-stat-label">Total</div>
              </div>
            </div>
            <div className="ntf-stat-card ntf-normal">
              <div className="ntf-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,10.5A1.5,1.5 0 0,1 13.5,12A1.5,1.5 0 0,1 12,13.5A1.5,1.5 0 0,1 10.5,12A1.5,1.5 0 0,1 12,10.5M7.5,10.5A1.5,1.5 0 0,1 9,12A1.5,1.5 0 0,1 7.5,13.5A1.5,1.5 0 0,1 6,12A1.5,1.5 0 0,1 7.5,10.5M16.5,10.5A1.5,1.5 0 0,1 18,12A1.5,1.5 0 0,1 16.5,13.5A1.5,1.5 0 0,1 15,12A1.5,1.5 0 0,1 16.5,10.5Z" />
                </svg>
              </div>
              <div className="ntf-stat-content">
                <div className="ntf-stat-value">{stats.normal}</div>
                <div className="ntf-stat-label">Normal</div>
              </div>
            </div>
            <div className="ntf-stat-card ntf-special">
              <div className="ntf-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </div>
              <div className="ntf-stat-content">
                <div className="ntf-stat-value">{stats.special}</div>
                <div className="ntf-stat-label">Special</div>
              </div>
            </div>
            <div className="ntf-stat-card ntf-high">
              <div className="ntf-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16" />
                </svg>
              </div>
              <div className="ntf-stat-content">
                <div className="ntf-stat-value">{stats.highPriority}</div>
                <div className="ntf-stat-label">High Priority</div>
              </div>
            </div>
          </div>
        )
      }

      <div className={`ntf-grid ${islivemodeON ? 'live-dsh-pad' : 'pad-40'}`}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.slice().reverse().map((notification, index) => {
            const notificationId = notification._id || `${notification.type}_${index}`;
            const isUnread = !notification.read;

            return (
              <div
                key={notificationId}
                className={`ntf-card ${notification.type === 'special' ? 'ntf-special' : ''} ${isUnread ? 'ntf-unread' : ''} ${notification.animate ? 'ntf-animate' : ''}`}
                onClick={() => {
                  setSelectedNotification(notification);
                  setShowDetailsPanel(true);
                  markAsRead(notificationId);
                }}
                onAnimationEnd={() => {
                  setNotifications(prev => prev.map(n =>
                    n._id === notificationId ? { ...n, animate: false } : n
                  ));
                }}
              >
                <div className="ntf-content">
                  <div className="ntf-card-header">
                    <h3 className="ntf-card-title">
                      {getNotificationTitle(notification)}
                    </h3>
                    <div className="ntf-card-footer">
                      <span className="ntf-time-display">
                        {formatNotificationTime(notification)}
                      </span>
                      <span
                        className="ntf-priority"
                        style={{ color: getNotificationColor(notification) }}
                      >
                        {notification.priority || 'normal'}
                      </span>
                    </div>
                    {notification.type === 'special' && (
                      <span className="ntf-tag">
                        {notification.stockInfo?.type === 'equipment' ? 'EQUIPMENT' : 'STOCK'}
                      </span>
                    )}
                    {isUnread && <div className="ntf-unread-dot"></div>}
                  </div>

                  <p className="ntf-message">
                    {getNotificationMessage(notification)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="ntf-no-results">
            <div className="ntf-no-results-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#64748b" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
              </svg>
            </div>
            <h3>No notifications found</h3>
            <p>There are no notifications for the selected filter.</p>
          </div>
        )}
      </div>

      {showDetailsPanel && selectedNotification && (
        <div className="ntf-details-panel">
          <div className="ntf-panel-overlay" onClick={() => setShowDetailsPanel(false)}></div>
          <div className="ntf-panel-content">
            <div className="ntf-panel-header">
              <h2>
                Details
              </h2>
              <button
                className="ntf-close-btn"
                onClick={() => setShowDetailsPanel(false)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>

            <div className="ntf-panel-body">
              <div className="ntf-detail-row">
                <span className="ntf-detail-label">Title:</span>
                <span className="ntf-detail-value">{getNotificationTitle(selectedNotification)}</span>
              </div>

              <div className="ntf-detail-row">
                <span className="ntf-detail-label">Type:</span>
                <span className="ntf-detail-value ntf-type">
                  <span className="ntf-type-badge" style={{
                    backgroundColor: getNotificationColor(selectedNotification),
                    color: selectedNotification.type === 'special' ? '#1e293b' : 'white'
                  }}>
                    {selectedNotification.type}
                  </span>
                </span>
              </div>

              <div className="ntf-detail-row">
                <span className="ntf-detail-label">Priority:</span>
                <span
                  className="ntf-detail-value ntf-priority"
                  style={{ color: getNotificationColor(selectedNotification) }}
                >
                  {selectedNotification.priority || 'normal'}
                </span>
              </div>

              <div className="ntf-detail-row">
                <span className="ntf-detail-label">Date & Time:</span>
                <span className="ntf-detail-value">
                  {new Date(selectedNotification.time || selectedNotification.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="ntf-detail-row ntf-full">
                <span className="ntf-detail-label">Message:</span>
                <div className="ntf-detail-value ntf-message">
                  {getNotificationMessage(selectedNotification)}
                </div>
              </div>
            </div>

            <div className="ntf-panel-footer">
              <button
                className="ntf-action-btn ntf-secondary"
                onClick={() => setShowDetailsPanel(false)}
              >
                Close
              </button>
              <button
                className="ntf-action-btn ntf-delete"
                onClick={() => {
                  handleDeleteNotification(selectedNotification._id, selectedNotification);
                  setShowDetailsPanel(false);
                }}
              >
                Delete Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;