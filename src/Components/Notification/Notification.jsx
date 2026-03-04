import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { END_POINT } from '../../constants';
import './Notification.css';
import { apiRequest } from '../../utils/api';
import Button from '../../common/Button/Button';
import { useAlert } from '../../context/AlertContext';
import Input from '../../common/Input/Input';
import Loader from '../../common/Loader/Loader';

const Notifications = ({ islivemodeON, scrollContainerRef }) => {

  const isLoadingRef = useRef(false);
  const { showAlert } = useAlert();
  const pendingPagesRef = useRef(new Set());

  const soundOptions = {
    bell: {
      name: 'Bell 🔔',
      url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
    },
    elegant: {
      name: 'Elegant ✨',
      url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    },
    soft: {
      name: 'Soft 🎵',
      url: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3'
    },
    chime: {
      name: 'Chime 🎐',
      url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'
    },
    ding: {
      name: 'Ding 🔊',
      url: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'
    }
  };

  const ITEMS_PER_PAGE = 100;
  const LOAD_THRESHOLD = 0.85;

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved
  });
  const [selectedSound, setSelectedSound] = useState(() => {
    const saved = localStorage.getItem('notificationSound');
    return (saved && soundOptions[saved]) ? saved : 'bell';
  });

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const notificationSoundRef = useRef(null);

  useEffect(() => {
    notificationSoundRef.current = new Audio();
    notificationSoundRef.current.src = soundOptions[selectedSound].url;
    notificationSoundRef.current.volume = 0.7;
    notificationSoundRef.current.preload = 'auto';
    notificationSoundRef.current.addEventListener('error', (e) => {
      console.error('❌ Sound file failed to load');
      playFallbackSound();
    });

    notificationSoundRef.current.addEventListener('loadeddata', () => { });

    initializeApp();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllNotifications(false, 1, false);

    const refreshInterval = setInterval(() => {
      fetchAllNotifications(true, 1, true);
    }, 30000);

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let scrollTimeout = null;
    let lastScrollTop = 0;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const scrollElement = scrollContainerRef?.current || window;

        let scrollTop, windowHeight, documentHeight;

        if (scrollElement === window) {
          scrollTop = window.scrollY;
          windowHeight = window.innerHeight;
          documentHeight = document.documentElement.scrollHeight;
        } else {
          scrollTop = scrollElement.scrollTop;
          windowHeight = scrollElement.clientHeight;
          documentHeight = scrollElement.scrollHeight;
        }

        const scrollPercentage = (scrollTop + windowHeight) / documentHeight;
        const isScrollingDown = scrollTop > lastScrollTop;

        if (
          isScrollingDown &&
          scrollPercentage > LOAD_THRESHOLD &&
          hasMore &&
          !isLoadingRef.current &&
          !loading
        ) {
          const nextPage = currentPage + 1;

          if (pendingPagesRef.current.has(nextPage)) {
            return;
          }

          pendingPagesRef.current.add(nextPage);

          showAlert('Loading more notifications...', 'sync', '--color-info-600');

          isLoadingRef.current = true;
          setCurrentPage(nextPage);

          fetchAllNotifications(false, nextPage, true)
            .then(() => {
              console.log('FETCH COMPLETED');
            })
            .catch((error) => {
              console.error('❌ FETCH FAILED:', error);
            })
            .finally(() => {
              pendingPagesRef.current.delete(nextPage);

              isLoadingRef.current = false;

              showAlert('Loaded successfully', 'check_circle', '--color-success-600');
            });
        }
        if (!isScrollingDown && scrollTop < 100 && currentPage > 1 && notifications.length > ITEMS_PER_PAGE) {
          setNotifications(prev => {
            const itemsToKeep = ITEMS_PER_PAGE;
            const newArray = prev.slice(0, itemsToKeep);
            return newArray;
          });
          setCurrentPage(1);
          pendingPagesRef.current.clear();
        }

        lastScrollTop = scrollTop;
      }, 200);
    };

    const scrollElement = scrollContainerRef?.current || window;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, currentPage, notifications.length, scrollContainerRef, showAlert, displayedNotifications.length]);

  useEffect(() => {
    const sorted = [...notifications].sort((a, b) => {
      const dateA = new Date(a.time || a.createdAt || 0);
      const dateB = new Date(b.time || b.createdAt || 0);
      return dateB - dateA;
    });

    setDisplayedNotifications(sorted);
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

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
          console.log('Web notifications enabled');
        } else {
          console.log('Web notifications denied');
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
        socketRef.current.emit('authenticate', {
          uniqueCode: userUniqueCode,
          userId: userUniqueCode
        });
      });

      socketRef.current.on('authenticated', (data) => {
      });

      socketRef.current.on('disconnect', (reason) => {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socketRef.current?.connected) {
            setupWebSocket();
          }
        }, 3000);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
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
    }
  };

  const handleNewNotification = async (notification) => {
    try {
      if (!notification) {
        console.error('❌ Notification is null or undefined');
        return;
      }

      showAlert('New Notification Recieved', 'notifications_active', '--color-primary');

      playNotificationSound();

      notification.animate = true;
      notification.read = false;
      notification.isNew = true; 

      setNotifications(prev => {
        const updatedPrev = prev.map(n => ({
          ...n,
          animate: false,
          isNew: false
        }));

        return [notification, ...updatedPrev];
      });

      const notificationTitle = getNotificationTitle(notification);
      const notificationBody = getNotificationMessage(notification);

      showWebNotification(notificationTitle, notificationBody);

      setTimeout(() => {
        setNotifications(prev => prev.map(n =>
          n._id === notification._id ? { ...n, animate: false, isNew: false } : n
        ));
      }, 600);

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

  const fetchNormalNotifications = async (page = 1) => {
    try {
      const response = await apiRequest(`${END_POINT}/notification/get-all-notification`,
        'POST',
        {
          uniqueCode: uniqueCode,
          page: page,
          limit: ITEMS_PER_PAGE
        }
      );
      const data = await response.json();

      if (response.ok && data.status === 200) {
        setHasMore(data.pagination.hasMore);

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

  const fetchAllNotifications = async (isBackgroundRefresh = false, page = 1, append = false) => {
    if (!isBackgroundRefresh && !append) {
      setLoading(true);
    }

    try {
      const userUniqueCode = await getUserUniqueCode();

      const [normalNotifications, specialNotifications] = await Promise.all([
        fetchNormalNotifications(page),
        page === 1 ? fetchSpecialNotifications(userUniqueCode) : []
      ]);

      const newNotifications = [
        ...(page === 1 ? specialNotifications : []),
        ...normalNotifications
      ];

      if (append || isBackgroundRefresh) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n._id));
          const uniqueNew = newNotifications.filter(n => !existingIds.has(n._id));

          const combined = isBackgroundRefresh
            ? [...uniqueNew, ...prev]
            : [...prev, ...uniqueNew];

          return combined;
        });
      } else {
        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error('❌ Error fetching all notifications:', error);
      if (!isBackgroundRefresh && !append) {
        alert('Failed to fetch notifications. Please try again.');
      }
    } finally {
      if (!isBackgroundRefresh && !append) {
        setLoading(false);
      }
    }
  };

  const playNotificationSound = () => {
    setTimeout(() => {
      if (!soundEnabled) {
        return;
      }

      try {
        if (notificationSoundRef.current) {
          notificationSoundRef.current.currentTime = 0;
          notificationSoundRef.current.volume = 0.7;

          const playPromise = notificationSoundRef.current.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
              })
              .catch(e => {
                console.error('❌ Audio play failed:', e);
                playFallbackSound();
              });
          }
        } else {
          console.error('❌ notificationSoundRef.current is null');
          playFallbackSound();
        }
      } catch (error) {
        console.error('❌ Error playing notification sound:', error);
        playFallbackSound();
      }
    }, 1000);
  };

  const playFallbackSound = () => {
    if (!soundEnabled) {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);

      }, 150);

    } catch (error) {
      console.error('❌ Fallback sound generation failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllNotifications(false); 
    setRefreshing(false);
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

  const enableSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('notificationSoundEnabled', newSoundState.toString());
    if (newSoundState) {
      setTimeout(() => playNotificationSound(), 100);
    }
  }

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

  if (loading && !refreshing) {
    return (
      <div className="ntf-loading-container">
        <Loader />
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

      {/* <div className="ntf-header">
        <div className="ntf-header-content">
          <div className="ntf-connection-status">
            <div className={`ntf-status-dot ${isConnected ? 'ntf-connected' : 'ntf-disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div> */}

      {
        islivemodeON ? null : (
          <div className="ntf-actions">
            <div className="ntf-action-buttons">
              <Button
                text={refreshing ? 'Refreshing...' : 'Refresh'}
                onClick={onRefresh}
                colorScheme="violet-600"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="130px"
                height="46px"
                type={refreshing ? 'disabled' : 'submit'}
                textColor="white-400"
                iconRight="refresh"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Button
                text="Mark all as read"
                onClick={markAllAsRead}
                colorScheme="lime-700"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="200px"
                height="46px"
                type={unreadCount === 0 ? 'disabled' : 'submit'}
                textColor="white-400"
                iconRight="check"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Button
                text={soundEnabled ? 'Sound On' : 'Sound Off'}
                onClick={enableSound}
                colorScheme={!soundEnabled ? 'amber-300' : 'amber-700'}
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="160px"
                height="46px"
                type="submit"
                textColor={!soundEnabled ? 'black-300' : 'white-800'}
                iconRight={!soundEnabled ? 'notification_audio_off' : 'notification_audio'}
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Input
                type="select"
                value={selectedSound}
                onChange={(e) => {
                  const newSound = e.target.value;
                  setSelectedSound(newSound);
                  localStorage.setItem('notificationSound', newSound);
                  notificationSoundRef.current.src = soundOptions[newSound].url;
                  setTimeout(() => playNotificationSound(), 100);
                }}
                options={Object.entries(soundOptions).map(([key, sound]) => ({
                  label: sound.name,
                  value: key
                }))}
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
        )
      }

      {/* {
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
      } */}

      <div className={islivemodeON ? 'live-table-info' : 'ntf-table-info'}>
        Showing {displayedNotifications?.length || 0} notifications
      </div>

      <div className={`ntf-grid ${islivemodeON ? 'live-dsh-pad' : 'ntf-pad'}`}>
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map((notification, index) => {
            const notificationId = notification._id || `${notification.type}_${index}`;
            const isUnread = !notification.read;

            return (
              <div
                key={notificationId}
                data-notification-id={notificationId}
                className={`ntf-card ${notification.type === 'special' ? 'ntf-special' : ''} ${isUnread ? 'ntf-unread' : ''} ${notification.animate ? 'ntf-animate' : ''} ${islivemodeON ? '' : 'ntf-card-color'}`}
                onClick={() => {
                  setSelectedNotification(notification);
                  setShowDetailsPanel(true);
                  markAsRead(notificationId);
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
                <span class="material-symbols-rounded">
                  close
                </span>
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