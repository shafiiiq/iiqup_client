import { useState, useEffect, useCallback } from 'react';
import {
  fetchQuotationTotals,
  fetchQuotationSummary,
  fetchQuotationSeries,
  fetchQuotationGrowth,
} from '../api/quotation.stats.api';

export const useQuotationStats = (granularity) => {
  const [totals, setTotals] = useState(null);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [totalsData, summaryData, seriesData, growthData] = await Promise.all([
        fetchQuotationTotals(),
        fetchQuotationSummary(granularity),
        fetchQuotationSeries(granularity),
        fetchQuotationGrowth(granularity),
      ]);
      setTotals(totalsData);
      setSummary(summaryData);
      setSeries(seriesData);
      setGrowth(growthData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => { load(); }, [load]);

  return { totals, summary, series, growth, loading, error, reload: load };
};

export default useQuotationStats;