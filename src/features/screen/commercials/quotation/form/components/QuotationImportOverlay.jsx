import { useEffect, useState } from 'react';

import Controls from '@/shared/components/widgets/controls/Controls';
import { apiRequest } from '@/features/core/network/api/api.request';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

import LoadMoreSentinel from '../../list/components/fragments/LoadMoreSentinel';
import { PAGE_SIZE, resolveHasMore } from '../../list/helper/quotation.list.pagination.helper';
import { fetchQuotationList } from '../api/quotation.form.api';
import { SHARED_BTN } from '../constants/quotation.form.constant';
import QuotationImportCard from './QuotationImportCard';
import './QuotationImportOverlay.css';

const SEARCH_BATCH = 10;

function QuotationImportOverlay({ onClose, onSelect }) {
  const [quotations, setQuotations] = useState([]);
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
        const data = await fetchQuotationList(1, PAGE_SIZE);
        if (cancelled) return;
        const rows = Array.isArray(data?.data) ? data.data : [];
        setQuotations(rows);
        setHasMore(resolveHasMore(data, rows.length));
      } catch (error) {
        console.error('[QuotationImport] load error:', error);
        if (!cancelled) setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
        const url = buildSearchUrl({ source: SEARCH_SOURCES.QUOTATIONS, q: term, limit: 1000 });
        const response = await apiRequest(url, 'GET');
        const json = await response.json();
        const result = extractSearchResult(json, SEARCH_SOURCES.QUOTATIONS);
        if (!cancelled) setSearchResults(result.results || []);
      } catch (error) {
        console.error('[QuotationImport] search error:', error);
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
      const data = await fetchQuotationList(nextPage, PAGE_SIZE);
      const rows = Array.isArray(data?.data) ? data.data : [];
      setQuotations((prev) => {
        const seen = new Set(prev.map((q) => q._id));
        return [...prev, ...rows.filter((q) => !seen.has(q._id))];
      });
      setPage(nextPage);
      setHasMore(resolveHasMore(data, rows.length));
    } catch (error) {
      console.error('[QuotationImport] loadMore error:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const displayed = searchResults ? searchResults.slice(0, visibleCount) : quotations;
  const canLoadMore = searchResults ? visibleCount < searchResults.length : hasMore;

  return (
    <div className="features screen quotation import overlay">
      <div className="features screen quotation import header">
        <input
          type="text"
          autoFocus
          className="features screen quotation import search"
          placeholder="Search by quotation ref or vendor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="features screen quotation import count">
          {searchResults ? `${searchResults.length} found` : `${displayed.length} loaded`}
        </span>
        <Controls
          justify="end"
          width="fit-content"
          items={[{ text: 'Close', onClick: onClose, colorScheme: 'error-800', ...SHARED_BTN, width: 'fit-content' }]}
        />
      </div>

      <div className="features screen quotation import body">
        {loading ? (
          <div className="features screen quotation import message">Loading quotations...</div>
        ) : displayed.length === 0 ? (
          <div className="features screen quotation import message">No Quotation data available</div>
        ) : (
          displayed.map((q) => (
            <QuotationImportCard key={q._id || q.quotationRef} quotation={q} onSelect={onSelect} />
          ))
        )}

        {!loading && (
          <LoadMoreSentinel
            onVisible={loadMore}
            disabled={loadingMore || !canLoadMore}
            loading={loadingMore}
          />
        )}
      </div>
    </div>
  );
}

export default QuotationImportOverlay;