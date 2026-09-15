import { useCallback, useEffect, useState } from 'react';
import {
  fetchNotificationStats,
  fetchUserSpecificTabsMeta,
  fetchModelCategoriesMeta,
} from '../api/notification.api';
import { formatCategoryLabel } from '../helper/notification.helper';
import { REFRESH_INTERVAL } from '../constants/notification.constants';

const EMPTY_STATS = { total: 0, unread: 0, forYouUnread: 0 };

export const useNotificationTabs = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [userTabs, setUserTabs] = useState([]);
  const [categories, setCategories] = useState([]);

  const refreshStats = useCallback(async () => {
    const response = await fetchNotificationStats();
    setStats(response.data || EMPTY_STATS);
  }, []);

  const refreshMeta = useCallback(async () => {
    const [statsResponse, userTabsResponse, categoriesResponse] = await Promise.all([
      fetchNotificationStats(),
      fetchUserSpecificTabsMeta(),
      fetchModelCategoriesMeta(),
    ]);
    setStats(statsResponse.data || EMPTY_STATS);
    setUserTabs(userTabsResponse.data || []);
    setCategories(categoriesResponse.data || []);
  }, []);

  useEffect(() => {
    refreshMeta();
    const interval = setInterval(refreshMeta, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshMeta]);

  const tabItems = [
    { key: 'all', label: 'All', iconName: 'notifications', badge: stats.total || undefined },
    { key: 'unread', label: 'Unread', iconName: 'mark_email_unread', badge: stats.unread || undefined },
    { key: 'foryou', label: 'For You', iconName: 'person_pin', badge: stats.forYouUnread || undefined },
    { key: 'high', label: 'High Priority', iconName: 'priority_high' },
    ...(userTabs.length
      ? [{
          key: 'user_specific',
          label: 'My Items',
          iconName: 'folder_special',
          children: userTabs.map((tab) => ({ key: tab.id, label: tab.label })),
        }]
      : []),
    ...(categories.length
      ? [{
          key: 'category',
          label: 'Categories',
          iconName: 'category',
          children: categories.map((category) => ({ key: category, label: formatCategoryLabel(category) })),
        }]
      : []),
  ];

  return { stats, tabItems, refreshStats, refreshMeta };
};