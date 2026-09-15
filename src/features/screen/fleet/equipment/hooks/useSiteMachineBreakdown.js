import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

export const useSiteMachineBreakdown = (site) => {
  const [breakdown, setBreakdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBreakdown = useCallback(async () => {
    if (!site) {
      setBreakdown(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest(`/equipments/site-machine-breakdown?site=${encodeURIComponent(site)}`, 'GET');
      const data = await response.json();
      if (data.ok) setBreakdown(data.data);
    } catch (err) {
      console.error('Failed to fetch site machine breakdown:', err);
    } finally {
      setIsLoading(false);
    }
  }, [site]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return { breakdown, isLoading, refetch: fetchBreakdown };
};