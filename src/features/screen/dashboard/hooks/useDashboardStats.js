import { useState, useEffect, useCallback } from 'react';
import { fetchStats } from '../api/dashboard.api';

export const useDashboardStats = (granularity) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStats(granularity);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, reload: load };
};
