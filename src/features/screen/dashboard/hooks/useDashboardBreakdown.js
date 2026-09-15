import { useState, useEffect, useCallback } from 'react';
import { fetchBreakdown } from '../api/dashboard.api';

export const useDashboardBreakdown = (key, field) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBreakdown(key, field);
      setBreakdown(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [key, field]);

  useEffect(() => { load(); }, [load]);

  return { breakdown, loading, error, reload: load };
};
