import { useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { buildSearchUrl, extractSearchResult } from './search.util';
import { SEARCH_DEBOUNCE_MS } from './search.constant';

export const useSearch = ({ source, field, limit = 20 }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (searchText, targetPage = 1, append = false) => {
      if (!searchText) {
        setResults([]);
        setTotalPages(1);
        setTotalCount(0);
        setHasMore(false);
        return;
      }

      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const url = buildSearchUrl({ source, field, q: searchText, page: targetPage, limit });
        const response = await apiRequest(url, 'GET');
        const responseJson = await response.json();

        if (currentRequestId !== requestIdRef.current) return;

        const result = extractSearchResult(responseJson, source);
        setResults((prev) => (append ? [...prev, ...result.results] : result.results));
        setPage(result.currentPage);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          setError(err.message || 'Search failed');
        }
      } finally {
        if (currentRequestId === requestIdRef.current) setLoading(false);
      }
    },
    [source, field, limit]
  );

  const search = useCallback(
    (text) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        runSearch(text, 1, false);
      }, SEARCH_DEBOUNCE_MS);
    },
    [runSearch]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    runSearch(query, page + 1, true);
  }, [hasMore, loading, query, page, runSearch]);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    setResults([]);
    setPage(1);
    setTotalPages(1);
    setTotalCount(0);
    setHasMore(false);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    query,
    results,
    page,
    totalPages,
    totalCount,
    hasMore,
    loading,
    error,
    search,
    loadMore,
    clear,
  };
};