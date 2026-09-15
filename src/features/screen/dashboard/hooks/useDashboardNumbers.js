import { useState, useEffect, useCallback } from 'react';
import { fetchNumbers } from '../api/dashboard.api';

export const useDashboardNumbers = (granularity) => {
  const [numbers, setNumbers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNumbers(granularity);
      setNumbers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => { load(); }, [load]);

  return { numbers, loading, error, reload: load };
};
