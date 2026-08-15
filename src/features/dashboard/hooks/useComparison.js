import { useState, useCallback } from 'react';
import { fetchComparisonData }         from '../api/dashboard.api';
import { prepareComparisonChartData }  from '../utils/transformers';

export const useComparison = () => {
  const [data, setData]       = useState({ days: null, months: null, years: null });
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState('days');

  const load = useCallback(async (type) => {
    if (data[type]) { setActive(type); return; }
    try {
      setLoading(true);
      const result = await fetchComparisonData(type);
      setData((prev) => ({ ...prev, [type]: result }));
      setActive(type);
    } catch (err) {
      console.error('Comparison fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [data]);

  const current   = data[active];
  const chartData = current ? prepareComparisonChartData(current) : [];

  return { active, load, loading, chartData, current };
};