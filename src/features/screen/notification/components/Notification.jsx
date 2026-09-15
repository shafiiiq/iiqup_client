import { useEffect, useMemo, useRef, useState } from 'react';
import './Notification.css';

import { useAlert } from '@/shared/context/AlertContext';
import { useSearch } from '@/shared/search/useSearch';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Controls from '@/shared/components/widgets/controls/Controls';
import Input from '@/shared/components/widgets/input/Input';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';

import { useNotificationTabs } from '../hooks/useNotificationTabs';
import { useNotificationFeed } from '../hooks/useNotificationFeed';
import { useNotificationInsights } from '../hooks/useNotificationInsights';
import { markNotificationAsRead } from '../api/notification.api';
import NotificationInsights from './fragments/NotificationInsights';
import {
  ITEMS_PER_PAGE,
  LIVE_MODE_PREVIEW_COUNT,
  SOUND_OPTIONS,
} from '../constants/notification.constants';
import {
  getStoredUniqueCode,
  normalizeNotification,
  getNotificationColor,
  getNotificationTitle,
  getNotificationMessage,
  formatNotificationTime,
  formatCategoryLabel,
} from '../helper/notification.helper';

const NotificationCard = ({ notification, onSelect }) => {
  const isUnread = !notification.read;
  const hasCategoryTag = notification.category && notification.category !== 'general';

  return (
    <div
      data-notification-id={notification._id}
      className={`features screen notification card ${isUnread ? 'unread' : ''} ${notification.animate ? 'animate' : ''}`.trim()}
      onClick={() => onSelect(notification)}
    >
      <div className="features screen notification card-header">
        <h3 className="features screen notification card-title">{getNotificationTitle(notification)}</h3>
        {isUnread && <span className="features screen notification unread-dot" />}
      </div>

      <p className="features screen notification message">{getNotificationMessage(notification)}</p>

      <div className="features screen notification card-footer">
        <span className="features screen notification time">{formatNotificationTime(notification)}</span>
        {hasCategoryTag && <span className="features screen notification tag">{formatCategoryLabel(notification.category)}</span>}
        <span className="features screen notification priority" style={{ color: getNotificationColor(notification) }}>
          {notification.priority || 'normal'}
        </span>
      </div>
    </div>
  );
};

const NotificationDetailPanel = ({ notification, onClose, onNavigate }) => {
  if (!notification) return null;

  return (
    <div className="features screen notification overlay">
      <div className="features screen notification overlay-backdrop" onClick={onClose} />

      <div className="features screen notification detail-panel">
        <div className="features screen notification detail-header">
          <h2>Details</h2>
          <button className="features screen notification close-button" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="features screen notification detail-body">
          <div className="features screen notification detail-row">
            <span className="features screen notification detail-label">Title</span>
            <span className="features screen notification detail-value">{getNotificationTitle(notification)}</span>
          </div>

          <div className="features screen notification detail-row">
            <span className="features screen notification detail-label">Category</span>
            <span
              className="features screen notification type-badge"
              style={{ backgroundColor: getNotificationColor(notification) }}
            >
              {formatCategoryLabel(notification.category)}
            </span>
          </div>

          <div className="features screen notification detail-row">
            <span className="features screen notification detail-label">Priority</span>
            <span className="features screen notification detail-value priority" style={{ color: getNotificationColor(notification) }}>
              {notification.priority || 'normal'}
            </span>
          </div>

          <div className="features screen notification detail-row">
            <span className="features screen notification detail-label">Date & Time</span>
            <span className="features screen notification detail-value">
              {new Date(notification.time || notification.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="features screen notification detail-row full">
            <span className="features screen notification detail-label">Message</span>
            <div className="features screen notification detail-value message">{getNotificationMessage(notification)}</div>
          </div>
        </div>

        <div className="features screen notification detail-footer">
          {notification.hasButton && notification.navigateText && (
            <button className="features screen notification action-button" onClick={() => onNavigate?.(notification)}>
              {notification.navigateText}
            </button>
          )}
          <button className="features screen notification action-button secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const NotificationSearchOverlay = ({ search, results, onSelect, onClose }) => (
  <div className="features screen notification search-overlay">
    <div className="features screen notification search-backdrop" onClick={onClose} />

    <div className="features screen notification search-panel">
      <div className="features screen notification search-header">
        <Input
          type="text"
          value={search.query}
          onChange={(e) => search.search(e.target.value)}
          placeholder="Search notifications"
          iconLeft="search"
          fullWidth
          autoFocus
          colorScheme="primary-600"
        />
        <button className="features screen notification close-button" onClick={onClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div className="features screen notification search-results">
        {results.length > 0 ? (
          results.map((notification) => (
            <NotificationCard key={notification._id} notification={notification} onSelect={onSelect} />
          ))
        ) : (
          <p className="features screen notification search-empty">
            {search.query ? 'No matching notifications.' : 'Type to search notifications.'}
          </p>
        )}
      </div>
    </div>
  </div>
);

const NotificationEmptyState = () => (
  <div className="features screen notification empty-state">
    <svg viewBox="0 0 24 24" width="48" height="48" className="features screen notification empty-icon">
      <path fill="#64748b" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
    </svg>
    <h3>No notifications found</h3>
    <p>There are no notifications yet.</p>
  </div>
);

const NotificationVirtualizedList = ({ virtualGrid, onSelect }) => (
  <div ref={virtualGrid.containerRef} style={{ position: 'relative', height: virtualGrid.totalHeight, width: '100%' }}>
    {virtualGrid.virtualRows.map((virtualRow) => {
      const row = virtualGrid.rows[virtualRow.index][0];
      return (
        <div
          key={virtualRow.key}
          ref={virtualGrid.measureRow}
          data-index={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualGrid.getRowOffset(virtualRow)}px)`,
          }}
        >
          {row.kind === 'label' ? (
            <div className="features screen notification section-label">{row.label}</div>
          ) : (
            <div className="features screen notification row">
              <NotificationCard notification={row.notification} onSelect={onSelect} />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const Notifications = ({ islivemodeON, liveNotification, onNavigate }) => {
  const { showAlert } = useAlert();
  const uniqueCode = useRef(getStoredUniqueCode()).current;

  const [activePath, setActivePath] = useState(['all']);
  const [searchMode, setSearchMode] = useState(false);
  const [readOverrides, setReadOverrides] = useState(() => new Set());
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('notificationSoundEnabled') === 'true');
  const [selectedSound, setSelectedSound] = useState(() => {
    const saved = localStorage.getItem('notificationSound');
    return saved && SOUND_OPTIONS[saved] ? saved : 'bell';
  });

  const notificationSoundRef = useRef(null);

  const tabs = useNotificationTabs();
  const insights = useNotificationInsights();

  const activeTab = useMemo(() => {
    const [root, child] = activePath;
    if (root === 'user_specific') return { key: 'user_specific', sourceId: child };
    if (root === 'category') return { key: 'category', category: child };
    return { key: root || 'all' };
  }, [activePath]);

  const markLocalRead = (notificationId) => {
    setReadOverrides((prev) => new Set(prev).add(notificationId));
  };

  const feed = useNotificationFeed(activeTab, uniqueCode, readOverrides);

  const search = useSearch({ source: 'notifications', limit: ITEMS_PER_PAGE });
  const searchResults = useMemo(
    () => search.results.map((notification) => normalizeNotification(notification, uniqueCode, readOverrides)),
    [search.results, uniqueCode, readOverrides]
  );

  const playFallbackSound = () => {
    if (!soundEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, startAt) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, startAt);
      gain.gain.exponentialRampToValueAtTime(0.01, startAt + 0.1);
      osc.start(startAt);
      osc.stop(startAt + 0.1);
    };
    play(800, ctx.currentTime);
    play(1000, ctx.currentTime + 0.15);
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    setTimeout(() => {
      if (!notificationSoundRef.current) { playFallbackSound(); return; }
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(playFallbackSound);
    }, 1_000);
  };

  useEffect(() => {
    notificationSoundRef.current = new Audio();
    notificationSoundRef.current.src = SOUND_OPTIONS[selectedSound].url;
    notificationSoundRef.current.volume = 0.7;
    notificationSoundRef.current.preload = 'auto';
    notificationSoundRef.current.addEventListener('error', playFallbackSound);
    return () => notificationSoundRef.current?.removeEventListener('error', playFallbackSound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!liveNotification) return;
    showAlert('New Notification Received', 'notifications_active', '--color-primary');
    playNotificationSound();
    feed.prependLive(liveNotification);
    tabs.refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveNotification]);

  const handleTabSelect = (path) => setActivePath(path);
  const handleOpenSearch = () => setSearchMode(true);
  const handleCloseSearch = () => {
    setSearchMode(false);
    search.clear();
  };

  const handleSelectNotification = (notification) => {
    setSelectedNotification(notification);
    setShowDetailPanel(true);
    if (!notification.read) {
      markNotificationAsRead(notification._id).catch(() => { });
      markLocalRead(notification._id);
      tabs.refreshStats();
    }
  };

  const handleClosePanel = () => {
    setShowDetailPanel(false);
    setTimeout(() => setSelectedNotification(null), 300);
  };

  const handleRefresh = () => {
    feed.refresh();
    tabs.refreshStats();
    insights.refresh();
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = feed.items.filter((notification) => !notification.read).map((notification) => notification._id);
    if (unreadIds.length === 0) return;
    await Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
    unreadIds.forEach(markLocalRead);
    tabs.refreshStats();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('notificationSoundEnabled', String(next));
    if (next) setTimeout(playNotificationSound, 100);
  };

  const handleSoundChange = (e) => {
    const nextSound = e.target.value;
    setSelectedSound(nextSound);
    localStorage.setItem('notificationSound', nextSound);
    if (notificationSoundRef.current) notificationSoundRef.current.src = SOUND_OPTIONS[nextSound].url;
    setTimeout(playNotificationSound, 100);
  };

  const unreadInView = feed.items.filter((notification) => !notification.read).length;

  if (islivemodeON) {
    const previewItems = feed.items.slice(0, LIVE_MODE_PREVIEW_COUNT);
    return (
      <div className="features screen notification root live">
        <div className="features screen notification feed">
          {previewItems.length > 0
            ? previewItems.map((notification) => (
              <NotificationCard key={notification._id} notification={notification} onSelect={handleSelectNotification} />
            ))
            : <NotificationEmptyState />}
        </div>

        {showDetailPanel && (
          <NotificationDetailPanel notification={selectedNotification} onClose={handleClosePanel} onNavigate={onNavigate} />
        )}
      </div>
    );
  }

  if (feed.loading && feed.items.length === 0) {
    return (
      <div className="features screen notification loading">
        <Loader />
      </div>
    );
  }

  const toolbarItems = [
    {
      text: feed.loading ? 'Refreshing...' : 'Refresh',
      iconRight: 'refresh',
      onClick: handleRefresh,
      colorScheme: 'primary-600',
      textColor: 'white-100',
      type: feed.loading ? 'disabled' : 'submit',
    },
    {
      text: 'Mark all as read',
      iconRight: 'check',
      onClick: handleMarkAllAsRead,
      colorScheme: 'primary-600',
      textColor: 'white-100',
      type: unreadInView === 0 ? 'disabled' : 'submit',
    },
    {
      text: soundEnabled ? 'Sound On' : 'Sound Off',
      iconRight: soundEnabled ? 'notification_audio' : 'notification_audio_off',
      onClick: toggleSound,
      colorScheme: soundEnabled ? 'primary-300' : 'primary-600',
      textColor: soundEnabled ? 'black-100' : 'white-100',
    },
  ];

  return (
    <div className="features screen notification root">
      <Tabs
        items={tabs.tabItems}
        activePath={activePath}
        onSelect={handleTabSelect}
        title="Notifications"
        showSearch
        searchPlaceholder="Search notifications"
        onSearch={handleOpenSearch}
        maxHeight="calc(100vh - 230px)"
      />

      <div className="features screen notification center">
        <div className="features screen notification toolbar">
          <Controls
            items={toolbarItems}
            justify="start"
          />
          <Input
            type="select"
            value={selectedSound}
            onChange={handleSoundChange}
            options={Object.entries(SOUND_OPTIONS).map(([key, sound]) => ({ label: sound.name, value: key }))}
            colorScheme="primary-600"
            variant="gradient"
            width="160px"
            height="46px"
            textColor="white-200"
          />
        </div>

        <div className="features screen notification feed">
          {feed.items.length > 0
            ? <NotificationVirtualizedList virtualGrid={feed.virtualGrid} onSelect={handleSelectNotification} />
            : <NotificationEmptyState />}
        </div>
      </div>

      <NotificationInsights
        stats={tabs.stats}
        priorityBreakdown={insights.priorityBreakdown}
        categoryBreakdown={insights.categoryBreakdown}
        dailyTrend={insights.dailyTrend}
      />

      {searchMode && (
        <NotificationSearchOverlay
          search={search}
          results={searchResults}
          onSelect={handleSelectNotification}
          onClose={handleCloseSearch}
        />
      )}

      {showDetailPanel && (
        <NotificationDetailPanel notification={selectedNotification} onClose={handleClosePanel} onNavigate={onNavigate} />
      )}
    </div>
  );
};

export default Notifications;