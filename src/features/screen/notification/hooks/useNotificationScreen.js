import { useCallback, useEffect, useMemo, useState } from 'react';
import { markAllNotificationsRead } from '@/features/core/messaging/notification/api/notification.counts.service';
import { refreshUnreadCount } from '@/features/core/messaging/notification/catchup/notification.catchup';
import { useActivityCounts } from '@/features/core/messaging/notification/count/activity.count.store';
import { useUnreadCount } from '@/features/core/messaging/notification/count/unread.count.store';
import { useSearch } from '@/shared/context/SearchContext';
import {
  ALL_NOTIFICATION_TAB,
  DEFAULT_CATEGORY_ICON,
  NOTIFICATION_TAB_ICONS,
  NOTIFICATION_VIEW_MODES,
} from '../constants/notification.tabs';
import { filterOutgoingForTab } from '../utils/notification.outgoing.utils';
import { useInfiniteScrollSentinel } from './useInfiniteScrollSentinel';
import { useNotificationComposer } from './useNotificationComposer';
import { useNotificationFeed } from './useNotificationFeed';
import { useNotificationHighlight } from './useNotificationHighlight';
import { useNotificationMentions } from './useNotificationMentions';
import { useNotificationNavigation } from './useNotificationNavigation';
import { useNotificationReactions } from './useNotificationReactions';
import { useNotificationReadTracking } from './useNotificationReadTracking';
import { useNotificationReplies } from './useNotificationReplies';
import { useNotificationSearch } from './useNotificationSearch';
import { useNotificationSections } from './useNotificationSections';
import { useNotificationSummaries } from './useNotificationSummaries';
import { useNotificationTabs } from './useNotificationTabs';
import { useNotificationUnreadAbove } from './useNotificationUnreadAbove';
import { useOutgoingNotifications } from './useOutgoingNotifications';

export const useNotificationScreen = () => {
  const unreadCount = useUnreadCount();
  const activityCounts = useActivityCounts();
  const [viewMode, setViewMode] = useState(NOTIFICATION_VIEW_MODES.NOTIFICATION);
  const [jumpRequest, setJumpRequest] = useState(null);
  const [categoryTarget, setCategoryTarget] = useState(null);
  const [featureLink, setFeatureLink] = useState(null);

  const { tabs, selectedTab, selectTab, reloadTabs } = useNotificationTabs();
  const feed = useNotificationFeed({ selectedTab });
  const mentions = useNotificationMentions();
  const summaries = useNotificationSummaries(viewMode);
  const outgoing = useOutgoingNotifications({ onDelivered: feed.refresh });
  const composer = useNotificationComposer({
    onQueueMessage: (payload) => {
      setViewMode(NOTIFICATION_VIEW_MODES.NOTIFICATION);
      outgoing.enqueue(payload);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });
  const { searchTerm } = useSearch();
  const search = useNotificationSearch(searchTerm);
  const { handleActionPress } = useNotificationNavigation();

  const isSearchActive = searchTerm.trim().length > 0;
  const outgoingItems = useMemo(
    () => filterOutgoingForTab(outgoing.items, selectedTab),
    [outgoing.items, selectedTab]
  );
  const visibleItems = useMemo(
    () => (isSearchActive ? search.results : [...outgoingItems, ...feed.items]),
    [isSearchActive, search.results, outgoingItems, feed.items]
  );
  const rows = useNotificationSections(visibleItems);

  const unreadAbove = useNotificationUnreadAbove({
    rows,
    tabId: selectedTab.id,
    isLoading: feed.isInitialLoading,
    skipInitialScroll: isSearchActive || Boolean(jumpRequest),
  });

  const readTracking = useNotificationReadTracking({
    updateItem: feed.updateItem,
    onReadFlushed: mentions.refresh,
  });
  const reactions = useNotificationReactions({ updateItem: feed.updateItem });
  const { updateItem } = feed;
  const { refresh: refreshMentions } = mentions;

  const handleReplyCreated = useCallback(
    (notificationId) =>
      updateItem(notificationId, (item) => ({
        ...item,
        replyCount: item.replyCount + 1,
        lastActivityAt: new Date().toISOString(),
      })),
    [updateItem]
  );
  const handleRepliesViewed = useCallback(
    (notificationId, summary) => {
      updateItem(notificationId, { replyCount: summary.total, unseenReplyCount: summary.unseen });
      refreshMentions();
    },
    [updateItem, refreshMentions]
  );
  const replies = useNotificationReplies({
    onReplyCreated: handleReplyCreated,
    onRepliesViewed: handleRepliesViewed,
    onOpenFeatureLink: setFeatureLink,
  });
  const { openThreadAtReply } = replies;

  const { activeTarget } = mentions;
  useEffect(() => {
    if (!activeTarget) return;
    setJumpRequest({
      notificationId: activeTarget.notificationId,
      replyId: activeTarget.replyId,
      tabId: ALL_NOTIFICATION_TAB.id,
      requestKey: `mention-${activeTarget.requestKey}`,
    });
  }, [activeTarget]);

  useEffect(() => {
    if (!jumpRequest) return;
    setViewMode(NOTIFICATION_VIEW_MODES.NOTIFICATION);
    selectTab(jumpRequest.tabId);
    if (jumpRequest.replyId) openThreadAtReply(jumpRequest.notificationId, jumpRequest.replyId);
  }, [jumpRequest, openThreadAtReply, selectTab]);

  const navigationTarget = useMemo(
    () =>
      jumpRequest
        ? {
            notificationId: jumpRequest.notificationId,
            requestKey: jumpRequest.requestKey,
            highlightCard: !jumpRequest.replyId,
          }
        : null,
    [jumpRequest]
  );

  const { highlightedNotificationId } = useNotificationHighlight({
    rows,
    hasMore: feed.hasMore,
    loadMore: feed.loadMore,
    navigationTarget,
  });

  const sentinelRef = useInfiniteScrollSentinel({
    onReachEnd: feed.loadMore,
    isEnabled: viewMode === NOTIFICATION_VIEW_MODES.NOTIFICATION && !isSearchActive && feed.hasMore,
    watchKey: feed.items.length,
  });

  const openSummaryEvent = useCallback((event, tabId) => {
    setJumpRequest({
      notificationId: event.notificationId,
      replyId: event.replyId,
      tabId,
      requestKey: `summary-${Date.now()}`,
    });
  }, []);

  const openCategoryInfo = useCallback((tab) => {
    if (tab.categoryKey) setCategoryTarget({ key: tab.categoryKey, label: tab.label });
  }, []);

  const openItemCategory = useCallback((item) => {
    if (item.categoryKey) {
      setCategoryTarget({ key: item.categoryKey, label: item.categoryLabel ?? item.categoryKey });
    }
  }, []);

  const closeCategoryInfo = useCallback(() => setCategoryTarget(null), []);

  const closeFeatureLink = useCallback(() => setFeatureLink(null), []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      feed.markAllLoadedAsRead();
      mentions.refresh();
    } catch (error) {
      console.error('markAllNotificationsRead:', error);
    }
  }, [feed, mentions]);

  const refreshAll = useCallback(async () => {
    await Promise.all([feed.refresh(), reloadTabs(), refreshUnreadCount().catch(console.error)]);
  }, [feed, reloadTabs]);

  const tabItems = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.id,
        label: tab.label,
        iconName: NOTIFICATION_TAB_ICONS[tab.id] ?? DEFAULT_CATEGORY_ICON,
        badge: tab.pendingCount || undefined,
      })),
    [tabs]
  );

  const handleTabSelect = useCallback(
    ([tabId]) => {
      setViewMode(NOTIFICATION_VIEW_MODES.NOTIFICATION);
      selectTab(tabId);
    },
    [selectTab]
  );

  return {
    viewMode,
    setViewMode,
    unreadCount,
    mentionCount: activityCounts.mentions,
    tabItems,
    selectedTab,
    handleTabSelect,
    feed,
    rows,
    isSearchActive,
    search,
    mentions,
    summaries,
    composer,
    outgoing,
    unreadAbove,
    replies,
    reactions,
    readTracking,
    highlightedNotificationId,
    sentinelRef,
    handleActionPress,
    openSummaryEvent,
    categoryTarget,
    openCategoryInfo,
    openItemCategory,
    closeCategoryInfo,
    featureLink,
    openFeatureLink: setFeatureLink,
    closeFeatureLink,
    markAllRead,
    refreshAll,
  };
};