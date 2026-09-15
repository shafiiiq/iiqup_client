import { useState, useEffect, useCallback } from 'react';
import { fetchTotals } from '../api/dashboard.api';

export const useDashboardTotals = () => {
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTotals();
      setTotals(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { totals, loading, error, reload: load };
};
