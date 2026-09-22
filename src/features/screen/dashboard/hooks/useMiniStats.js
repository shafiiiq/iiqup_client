import { useState, useEffect } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

const fetchJson = async (path) => {
  const response = await apiRequest(path, 'GET');
  const body = await response.json();
  return body.data;
};

const SOURCES = {
  purchase: { summary: '/order/purchase/stats/summary?granularity=month', series: '/order/purchase/stats/series?granularity=month' },
  hire: { summary: '/order/hire/stats/summary?granularity=month', series: '/order/hire/stats/series?granularity=month' },
  quotation: { summary: '/quotation/stats/summary?granularity=month', series: '/quotation/stats/series?granularity=month' },
  backcharge: { summary: '/backcharge/stats/summary?granularity=month', series: '/backcharge/stats/series?granularity=month' },
};

export const useMiniStats = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const entries = await Promise.all(
          Object.entries(SOURCES).map(async ([key, paths]) => {
            const [summary, series] = await Promise.all([fetchJson(paths.summary), fetchJson(paths.series)]);
            return [key, { summary, series }];
          })
        );
        setData(Object.fromEntries(entries));
      } catch (err) {
        console.error('[useMiniStats] load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { data, loading };
};