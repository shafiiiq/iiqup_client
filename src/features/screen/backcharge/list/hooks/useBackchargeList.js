import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBackchargeReports, fetchPendingSignatures, deleteBackcharge } from '../api/backcharge.list.api';
import { usePagination } from '@/shared/pagination/usePagination';
import {
  DEFAULT_FILTERS,
  BACKCHARGE_LIST_PAGE_SIZE,
  BACKCHARGE_SCROLL_DEBOUNCE_MS,
  BACKCHARGE_SCROLL_BOTTOM_OFFSET_PX,
  BACKCHARGE_VIEW,
  STATS_TAB,
} from '../constants/backcharge.list.constant';

export const useBackchargeList = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [activeView, setActiveView] = useState(BACKCHARGE_VIEW.LIST);
  const [statsTab, setStatsTab] = useState(STATS_TAB.OVERVIEW);

  const fetchFn = useCallback(({ page, limit }) => fetchBackchargeReports({ page, limit }), []);

  const {
    data: backcharges,
    loading: isLoading,
    hasMore,
    loadMore,
    fetchPage,
    reset: resetPagination,
  } = usePagination(fetchFn, { limit: BACKCHARGE_LIST_PAGE_SIZE });

  const isInitialLoading = isLoading && backcharges.length === 0;
  const isLoadingMore = isLoading && backcharges.length > 0;

  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackcharge, setSelectedBackcharge] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [showPendingToast, setShowPendingToast] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const refreshList = useCallback(() => {
    resetPagination();
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadPendingSignatures = async () => {
      try {
        const response = await fetchPendingSignatures();
        const items = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setPendingSignatures(items);
        if (items.length > 0) setShowPendingToast(true);
      } catch (error) {
        console.error('[BackchargeList] pending signatures error:', error);
      }
    };

    loadPendingSignatures();
  }, []);

  useEffect(() => {
    if (!hasMore || isLoading) return undefined;

    let debounceTimer = null;

    const handleScroll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const scrollBottom = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        if (scrollBottom > documentHeight - BACKCHARGE_SCROLL_BOTTOM_OFFSET_PX) {
          loadMore();
        }
      }, BACKCHARGE_SCROLL_DEBOUNCE_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    if (!backcharges.length) {
      setFilteredData([]);
      return;
    }

    let next = [...backcharges];

    if (filters.suppliers.length > 0) {
      next = next.filter((item) => filters.suppliers.includes(item.supplierName));
    }

    if (filters.equipmentTypes.length > 0) {
      next = next.filter((item) => filters.equipmentTypes.includes(item.equipmentType));
    }

    if (filters.dateFilter === 'thismonth') {
      const now = new Date();
      next = next.filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filters.dateFilter === 'lastXmonths') {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - filters.lastMonthsCount);
      next = next.filter((item) => new Date(item.date) >= monthsAgo);
    } else if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
      const start = new Date(filters.customStartDate);
      const end = new Date(filters.customEndDate);
      next = next.filter((item) => {
        const d = new Date(item.date);
        return d >= start && d <= end;
      });
    }

    if (filters.costRange?.min || filters.costRange?.max) {
      const min = Number(filters.costRange.min || 0);
      const max = Number(filters.costRange.max || Number.MAX_SAFE_INTEGER);
      next = next.filter((item) => {
        const total = Number(item?.costSummary?.totalCost || 0);
        return total >= min && total <= max;
      });
    }

    setFilteredData(next);
  }, [backcharges, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {};

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleTabSelect = (path, node) => {
    if (Object.values(STATS_TAB).includes(node.key)) {
      setActiveView(BACKCHARGE_VIEW.STATS);
      setStatsTab(node.key);
      return;
    }
    if (node.key === BACKCHARGE_VIEW.LIST) {
      setActiveView(BACKCHARGE_VIEW.LIST);
    }
  };

  const handleRowClick = (refNo) => {
    const documentId = refNo || selectedBackcharge?.refNo;
    if (documentId) navigate(`/backcharge/report/${encodeURIComponent(documentId)}`);
  };

  const handleViewBackcharge = (backcharge) => {
    const documentId = backcharge?.refNo || backcharge?.reportNo;
    if (documentId) navigate(`/backcharge/report/${encodeURIComponent(documentId)}`);
  };

  const handleAddBackcharge = () => {
    navigate('/backcharge/form');
  };

  const handleDeleteClick = (backcharge) => {
    setSelectedBackcharge(backcharge);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBackcharge?._id) return;

    try {
      await deleteBackcharge(selectedBackcharge._id);
      setShowDeleteModal(false);
      setDeleteStatus({ message: 'Backcharge deleted successfully.', isError: false });
      setShowStatusModal(true);
      refreshList();
    } catch (error) {
      console.error('[BackchargeList] delete error:', error);
      setShowDeleteModal(false);
      setDeleteStatus({ message: 'Could not delete this backcharge.', isError: true });
      setShowStatusModal(true);
    } finally {
      setSelectedBackcharge(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBackcharge(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setDeleteStatus({ message: '', isError: false });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Backcharge List</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Backcharge List</h2>
          ${tableRef.current?.outerHTML || ''}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const isPendingForUser = (refNo) => pendingSignatures.some((item) => item.refNo === refNo || item.backchargeRef === refNo);
  const isSignedByUser = () => false;

  return {
    tableRef,
    activeView,
    statsTab,
    backcharges,
    filteredData,
    isLoading: isInitialLoading,
    isLoadingMore,
    showDeleteModal,
    selectedBackcharge,
    deleteStatus,
    showStatusModal,
    pendingSignatures,
    showPendingToast,
    filters,
    setShowPendingToast,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
    handleTabSelect,
    handleRowClick,
    handleViewBackcharge,
    handleAddBackcharge,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    handlePrint,
    formatDate,
    formatCurrency,
    isPendingForUser,
    isSignedByUser,
  };
};