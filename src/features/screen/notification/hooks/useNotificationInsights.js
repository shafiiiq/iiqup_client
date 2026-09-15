import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllNotifications } from '../api/notification.api';
import { REFRESH_INTERVAL, INSIGHTS_SAMPLE_LIMIT } from '../constants/notification.constants';

export const useNotificationInsights = () => {
  const [sample, setSample] = useState([]);

  const refresh = useCallback(async () => {
    const response = await fetchAllNotifications({ page: 1, limit: INSIGHTS_SAMPLE_LIMIT });
    setSample(response.data || []);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const priorityBreakdown = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    sample.forEach((notification) => {
      const key = (notification.priority || 'medium').toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [sample]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map();
    sample.forEach((notification) => {
      const key = notification.category || 'general';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [sample]);

  const dailyTrend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    return days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const value = sample.filter((notification) => {
        const time = new Date(notification.time || notification.createdAt);
        return time >= day && time < nextDay;
      }).length;
      return { label: day.toLocaleDateString(undefined, { weekday: 'short' }), value };
    });
  }, [sample]);

  return { priorityBreakdown, categoryBreakdown, dailyTrend, refresh };
};