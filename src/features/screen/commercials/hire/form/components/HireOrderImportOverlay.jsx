import { useEffect, useState } from 'react';

import Controls from '@/shared/components/widgets/controls/Controls';
import { apiRequest } from '@/features/core/network/api/api.request';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';
import LoadMoreSentinel from '@/features/screen/commercials/quotation/list/components/fragments/LoadMoreSentinel';

import { fetchHireOrderPage } from '../api/hire.order.form.api';
import { IMPORT_PAGE_SIZE, resolveHasMore } from '../helper/hire.order.import.helper';
import { SHARED_BTN } from '../constants/hire.order.form.constant';
import HireOrderImportCard from './HireOrderImportCard';
import './HireOrderImportOverlay.css';

const SEARCH_BATCH = 10;

function HireOrderImportOverlay({ onClose, onSelect }) {
  const [hireOrders, setHireOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [visibleCount, setVisibleCount] = useState(SEARCH_BATCH);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchHireOrderPage(1, IMPORT_PAGE_SIZE);
        if (cancelled) return;
        const rows = Array.isArray(data?.data) ? data.data : [];
        setHireOrders(rows);
        setHasMore(resolveHasMore(data, rows.length));
      } catch (error) {
        console.error('[HireOrderImport] load error:', error);
        if (!cancelled) setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const term = search.trim();
    setVisibleCount(SEARCH_BATCH);
    if (!term) {
      setSearchResults(null);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const url = buildSearchUrl({ source: SEARCH_SOURCES.HIRE_ORDERS, q: term, limit: 1000 });
        const response = await apiRequest(url, 'GET');
        const json = await response.json();
        const result = extractSearchResult(json, SEARCH_SOURCES.HIRE_ORDERS);
        if (!cancelled) setSearchResults(result.results || []);
      } catch (error) {
        console.error('[HireOrderImport] search error:', error);
        if (!cancelled) setSearchResults([]);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  const loadMore = async () => {
    if (searchResults) {
      setVisibleCount((count) => count + SEARCH_BATCH);
      return;
    }
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchHireOrderPage(nextPage, IMPORT_PAGE_SIZE);
      const rows = Array.isArray(data?.data) ? data.data : [];
      setHireOrders((prev) => {
        const seen = new Set(prev.map((hireOrder) => hireOrder._id));
        return [...prev, ...rows.filter((hireOrder) => !seen.has(hireOrder._id))];
      });
      setPage(nextPage);
      setHasMore(resolveHasMore(data, rows.length));
    } catch (error) {
      console.error('[HireOrderImport] loadMore error:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const displayed = searchResults ? searchResults.slice(0, visibleCount) : hireOrders;
  const canLoadMore = searchResults ? visibleCount < searchResults.length : hasMore;

  return (
    <div className="features screen hire order import overlay">
      <div className="features screen hire order import header">
        <input
          type="text"
          autoFocus
          className="features screen hire order import search"
          placeholder="Search by hire order ref or vendor"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="features screen hire order import count">
          {searchResults ? `${searchResults.length} found` : `${displayed.length} loaded`}
        </span>
        <Controls
          justify="end"
          width="fit-content"
          items={[{ text: 'Close', onClick: onClose, colorScheme: 'error-800', ...SHARED_BTN, width: 'fit-content' }]}
        />
      </div>

      <div className="features screen hire order import body">
        {loading ? (
          <div className="features screen hire order import message">Loading hire orders...</div>
        ) : displayed.length === 0 ? (
          <div className="features screen hire order import message">No Hire Order data available</div>
        ) : (
          displayed.map((hireOrder) => (
            <HireOrderImportCard key={hireOrder._id || hireOrder.hireOrderRef} hireOrder={hireOrder} onSelect={onSelect} />
          ))
        )}

        {!loading && (
          <LoadMoreSentinel onVisible={loadMore} disabled={loadingMore || !canLoadMore} loading={loadingMore} />
        )}
      </div>
    </div>
  );
}

export default HireOrderImportOverlay;