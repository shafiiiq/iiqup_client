import { useState, useCallback } from 'react';
import { extractPaginationResult, normalizePagination } from './pagination.util';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from './pagination.constant';

export const usePagination = (fetchFn, initial = {}) => {
  const { page: initialPage, limit: initialLimit } = normalizePagination(initial);

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(
    async (targetPage = page, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const responseJson = await fetchFn({ page: targetPage, limit });
        const result = extractPaginationResult(responseJson);

        setData((prev) => (append ? [...prev, ...result.data] : result.data));
        setPage(result.currentPage);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, limit, page]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchPage(page + 1, true);
  }, [hasMore, loading, page, fetchPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(DEFAULT_PAGE);
    setTotalPages(1);
    setTotalCount(0);
    setHasMore(false);
  }, []);

  return {
    data,
    page,
    limit,
    setLimit,
    totalPages,
    totalCount,
    hasMore,
    loading,
    error,
    fetchPage,
    loadMore,
    reset,
  };
};