import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/shared/context/SearchContext';
import { fetchQuotations, deleteQuotation } from '../api/quotation.list.api';
import { STATS_TAB } from '../constants/quotation.list.constant';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [statsTab, setStatsTab] = useState(STATS_TAB.OVERVIEW);
  const handleTabSelect = (path, node) => {
    if (Object.values(STATS_TAB).includes(node.key)) { setActiveView('stats'); setStatsTab(node.key); return; }
    setActiveView('list');
  };

  useEffect(() => {
    loadQuotations();
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

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuotations();
      setQuotations(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('[QuotationList] loadQuotations:', error);
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applySearch = () => {
    if (!searchTerm) { setFilteredData(quotations); return; }
    setFilteredData(searchResults || []);
  };

  const handleRowClick = (ref) => navigate(`/quotation/report/${encodeURIComponent(ref)}`);
  const handleViewQuotation = (e, q) => { e.stopPropagation(); navigate(`/quotation/report/${encodeURIComponent(q.quotationRef)}`); };
  const handleAddQuotation = () => navigate('/quotation/form');
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
    showDeleteModal,
    selectedQuotation,
    deleteStatus,
    showStatusModal,
    tableRef,
    handleRowClick,
    handleViewQuotation,
    handleAddQuotation,
    handleAmendment,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    registerExpandControls,
    toggleExpandRow,
    activeView,
    statsTab,
    handleTabSelect
  };
};

export default useQuotationList;