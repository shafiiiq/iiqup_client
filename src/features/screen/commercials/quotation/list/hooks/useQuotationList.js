import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/shared/context/SearchContext';
import { fetchQuotations, deleteQuotation, fetchPendingQuotationSignatures } from '../api/quotation.list.api';
import useDocumentTaskUpdates from '@/features/core/network/socket/useDocumentTaskUpdates';
import useSignAllDocuments from '@/features/core/messaging/signature/hooks/useSignAllDocuments';
import { QUOTATION_SIGNATURE_SOURCE_KEY } from '@/features/screen/commercials/quotation/report/constants/quotation.report.constant';
import { STATS_TAB } from '../constants/quotation.list.constant';
import { PAGE_SIZE, resolveHasMore } from '../helper/quotation.list.pagination.helper';
import { apiRequest } from '@/features/core/network/api/api.request';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

const useQuotationList = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const toggleExpandRef = useRef(null);
  const { searchTerm } = useSearch();

  const [quotations, setQuotations] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [statsTab, setStatsTab] = useState(STATS_TAB.OVERVIEW);
  const handleTabSelect = (path, node) => {
    if (Object.values(STATS_TAB).includes(node.key)) { setActiveView('stats'); setStatsTab(node.key); return; }
    setActiveView('list');
  };

  useEffect(() => {
    loadQuotations();
    loadPendingSignatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(null);
      return;
    }

    let cancelled = false;
    const runSearch = async () => {
      try {
        const url = buildSearchUrl({ source: SEARCH_SOURCES.QUOTATIONS, q: searchTerm, limit: 1000 });
        const response = await apiRequest(url, 'GET');
        const responseJson = await response.json();
        const result = extractSearchResult(responseJson, SEARCH_SOURCES.QUOTATIONS);
        if (!cancelled) setSearchResults(result.results);
      } catch (error) {
        console.error('[QuotationList] search error:', error);
        if (!cancelled) setSearchResults([]);
      }
    };

    runSearch();
    return () => { cancelled = true; };
  }, [searchTerm]);

  useEffect(() => {
    applySearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotations, searchResults]);

  const loadPendingSignatures = async () => {
    try {
      const response = await fetchPendingQuotationSignatures();
      setPendingSignatures(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('[QuotationList] loadPendingSignatures:', error);
    }
  };

  const refreshSilently = async () => {
    try {
      const [listData] = await Promise.all([fetchQuotations(1, PAGE_SIZE), loadPendingSignatures()]);
      const rows = Array.isArray(listData?.data) ? listData.data : [];
      setQuotations(rows);
      setPage(1);
      setHasMore(resolveHasMore(listData, rows.length));
    } catch (error) {
      console.error('[QuotationList] refreshSilently:', error);
    }
  };

  useDocumentTaskUpdates(refreshSilently, QUOTATION_SIGNATURE_SOURCE_KEY);

  const signAll = useSignAllDocuments({
    sourceKey: QUOTATION_SIGNATURE_SOURCE_KEY,
    documentIds: pendingSignatures
      .filter((pendingSignature) => pendingSignature.status !== 'draft')
      .map((pendingSignature) => pendingSignature.quotationRef),
    onCompleted: refreshSilently,
  });

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuotations(1, PAGE_SIZE);
      const rows = Array.isArray(data?.data) ? data.data : [];
      setQuotations(rows);
      setPage(1);
      setHasMore(resolveHasMore(data, rows.length));
    } catch (error) {
      console.error('[QuotationList] loadQuotations:', error);
      setQuotations([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore || searchTerm) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchQuotations(nextPage, PAGE_SIZE);
      const rows = Array.isArray(data?.data) ? data.data : [];
      setQuotations((prev) => {
        const seen = new Set(prev.map((q) => q._id));
        return [...prev, ...rows.filter((q) => !seen.has(q._id))];
      });
      setPage(nextPage);
      setHasMore(resolveHasMore(data, rows.length));
    } catch (error) {
      console.error('[QuotationList] loadMore:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const applySearch = () => {
    if (!searchTerm) { setFilteredData(quotations); return; }
    setFilteredData(searchResults || []);
  };

  const handleRowClick = (ref) => navigate(`/quotation/report/${encodeURIComponent(ref)}`);
  const handleViewQuotation = (e, q) => { e.stopPropagation(); navigate(`/quotation/report/${encodeURIComponent(q.quotationRef)}`); };
  const handleAddQuotation = () => navigate('/quotation/form');
  const handleDuplicate = (e, q) => { e.stopPropagation(); navigate(`/quotation/form/duplicate/${encodeURIComponent(q.quotationRef)}`); };
  const handleEdit = (e, q) => {
    e.stopPropagation();
    const ref = encodeURIComponent(q.quotationRef);
    navigate(q.amendments?.length ? `/quotation/form/amendment/edit/${ref}` : `/quotation/form/edit/${ref}`);
  };
  const handleAmendment = (e, q) => { e.stopPropagation(); navigate(`/quotation/form/amendment/${encodeURIComponent(q.quotationRef)}`); };

  const handleDeleteClick = (e, q) => { e.stopPropagation(); setSelectedQuotation(q); setShowDeleteModal(true); };
  const cancelDelete = () => { setShowDeleteModal(false); setSelectedQuotation(null); };

  const confirmDelete = async () => {
    if (!selectedQuotation) return;
    try {
      await deleteQuotation(selectedQuotation.quotationRef);
      setShowDeleteModal(false);
      setDeleteStatus({ message: `Quotation ${selectedQuotation.quotationRef} successfully deleted.`, isError: false });
      loadQuotations();
    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({ message: 'Error deleting quotation: ' + error.message, isError: true });
    } finally {
      setShowStatusModal(true);
    }
  };

  const closeStatusModal = () => { setShowStatusModal(false); setDeleteStatus({ message: '', isError: false }); };

  const registerExpandControls = (fn) => { toggleExpandRef.current = fn; };
  const toggleExpandRow = (key) => toggleExpandRef.current?.(key);

  return {
    searchTerm,
    filteredData,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    showDeleteModal,
    selectedQuotation,
    deleteStatus,
    showStatusModal,
    tableRef,
    handleRowClick,
    handleViewQuotation,
    handleAddQuotation,
    handleAmendment,
    handleDuplicate,
    handleEdit,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    registerExpandControls,
    toggleExpandRow,
    activeView,
    statsTab,
    handleTabSelect,
    signAll,
  };
};

export default useQuotationList;