import { useState, useEffect, useCallback } from 'react';
import { fetchRecentActivity } from '../api/dashboard.api';

export const useDashboardRecent = (limit = 20) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRecentActivity(limit);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, reload: load };
};
