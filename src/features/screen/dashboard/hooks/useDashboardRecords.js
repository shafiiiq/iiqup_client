import { useCallback, useEffect } from 'react';
import { usePagination } from '@/shared/pagination/usePagination';
import { fetchRecordsPage } from '../api/dashboard.api';

export const useDashboardRecords = (key, granularity) => {
  const fetchFn = useCallback(
    ({ page, limit }) => fetchRecordsPage(key, granularity, page, limit),
    [key, granularity]
  );

  const pagination = usePagination(fetchFn, { page: 1, limit: 20 });

  useEffect(() => {
    pagination.reset();
    pagination.fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, granularity]);

  return pagination;
};
