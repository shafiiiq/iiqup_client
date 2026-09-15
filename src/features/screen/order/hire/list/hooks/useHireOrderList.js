import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/shared/context/SearchContext';
import { deleteHireOrder, fetchHireOrderList, fetchPendingSignatures } from '../api/hire.order.list.api';
import { DEFAULT_FILTERS, SIGNED_WORKFLOW_STATUSES } from '../constants/hire.order.list.constant';

const useHireOrderList = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const toggleExpandRef = useRef(null);

  const { searchTerm } = useSearch();
  const [hireOrders, setHireOrders] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHireOrder, setSelectedHireOrder] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [showPendingToast, setShowPendingToast] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [sigToast, setSigToast] = useState({ show: false, message: '' });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    fetchHireOrders();
    fetchPendingSignaturesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHireOrders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHireOrderList();
      const rows = Array.isArray(data?.data) ? data.data : [];
      setHireOrders(rows);
      setFilteredData(rows);
    } catch (error) {
      console.error('[HireOrderList] fetchHireOrders:', error);
      setHireOrders([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isPendingForUser = (hireOrderRef) => pendingSignatures.some((p) => p.hireOrderRef === hireOrderRef);

  const fetchPendingSignaturesData = async () => {
    try {
      const data = await fetchPendingSignatures();
      setPendingSignatures(data.data || []);
      if (data.count > 0) setShowPendingToast(true);
    } catch (error) {
      console.error('[HireOrderList] fetchPendingSignatures:', error);
    }
  };

  const getRowClass = (hireOrder) => {
    const { pmSigned, managerSigned, accountsSigned, ceoSigned } = hireOrder;
    const uploaded = SIGNED_WORKFLOW_STATUSES.includes(hireOrder.workflowStatus);
    if (!uploaded) return '';

    if (managerSigned && pmSigned && accountsSigned && ceoSigned)
      return 'hire-order-sig-all';

    if (isPendingForUser(hireOrder.hireOrderRef))
      return 'hire-order-sig-pending';

    if (managerSigned && pmSigned && accountsSigned && !ceoSigned) return 'hire-order-sig-mgr-pm-acc';
    if (managerSigned && pmSigned && !accountsSigned && ceoSigned) return 'hire-order-sig-mgr-pm-ceo';
    if (managerSigned && !pmSigned && accountsSigned && ceoSigned) return 'hire-order-sig-mgr-acc-ceo';
    if (!managerSigned && pmSigned && accountsSigned && ceoSigned) return 'hire-order-sig-pm-acc-ceo';

    if (managerSigned && pmSigned && !accountsSigned && !ceoSigned) return 'hire-order-sig-mgr-pm';
    if (managerSigned && !pmSigned && accountsSigned && !ceoSigned) return 'hire-order-sig-mgr-acc';
    if (managerSigned && !pmSigned && !accountsSigned && ceoSigned) return 'hire-order-sig-mgr-ceo';
    if (!managerSigned && pmSigned && accountsSigned && !ceoSigned) return 'hire-order-sig-pm-acc';
    if (!managerSigned && pmSigned && !accountsSigned && ceoSigned) return 'hire-order-sig-pm-ceo';
    if (!managerSigned && !pmSigned && accountsSigned && ceoSigned) return 'hire-order-sig-acc-ceo';

    if (managerSigned && !pmSigned && !accountsSigned && !ceoSigned) return 'hire-order-sig-mgr-only';
    if (!managerSigned && pmSigned && !accountsSigned && !ceoSigned) return 'hire-order-sig-pm-only';
    if (!managerSigned && !pmSigned && accountsSigned && !ceoSigned) return 'hire-order-sig-acc-only';
    if (!managerSigned && !pmSigned && !accountsSigned && ceoSigned) return 'hire-order-sig-ceo-only';

    return 'hire-order-sig-none';
  };

  useEffect(() => {
    applyAllFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hireOrders, searchTerm, filters]);

  const handleRowClick = (hireOrderRef) => navigate(`/order/hire/report/${encodeURIComponent(hireOrderRef)}`);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const style = `
      <style>
        h1, p { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: center; }
        th { background-color: #f2f2f2; }
        .no-results { text-align: center; font-style: italic; }
      </style>
    `;

    const content = `
      <html>
        <head>
          <title>Hire Order List</title>
          ${style}
        </head>
        <body>
          <h1>Hire Order List</h1>
          ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
          ${tableRef.current?.outerHTML || ''}
          <div style="margin-top: 10px; text-align: center;">
            Showing ${filteredData?.length || 0} ${searchTerm ? 'matching entries' : 'entries'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDeleteClick = (e, hireOrder) => {
    e.stopPropagation();
    setSelectedHireOrder(hireOrder);
    setShowDeleteModal(true);
  };

  const handleAmendment = (e, hireOrder) => {
    e.stopPropagation();
    navigate(`/order/hire/form/amendment/${encodeURIComponent(hireOrder.hireOrderRef)}`);
  };

  const confirmDelete = async () => {
    if (!selectedHireOrder) return;

    try {
      await deleteHireOrder(selectedHireOrder.hireOrderRef);
      setShowDeleteModal(false);
      setDeleteStatus({ message: `Hire Order ${selectedHireOrder.hireOrderRef} successfully deleted.`, isError: false });
      fetchHireOrders();
    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({ message: 'Error deleting Hire Order: ' + error.message, isError: true });
      console.error('[HireOrderList] confirmDelete error:', error);
    } finally {
      setShowStatusModal(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedHireOrder(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setDeleteStatus({ message: '', isError: false });
  };

  const handleViewHireOrder = (e, hireOrder) => {
    e.stopPropagation();
    navigate(`/order/hire/report/${encodeURIComponent(hireOrder.hireOrderRef)}`);
  };

  const handleAddHireOrder = () => navigate('/order/hire/form');

  const handleFilterChange = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
    applyAllFilters();
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setFilteredData(Array.isArray(hireOrders) ? hireOrders : []);
  };

  const applyAllFilters = () => {
    let filtered = Array.isArray(hireOrders) ? [...hireOrders] : [];

    if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
      filtered = filtered.filter((h) => {
        const hDate = new Date(h.date);
        const startDate = new Date(filters.customStartDate);
        const endDate = new Date(filters.customEndDate);
        return hDate >= startDate && hDate <= endDate;
      });
    } else if (filters.dateFilter === 'lastXmonths') {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - filters.lastMonthsCount);
      filtered = filtered.filter((h) => new Date(h.date) >= monthsAgo);
    } else if (filters.dateFilter === 'thismonth') {
      const now = new Date();
      filtered = filtered.filter((h) => {
        const hDate = new Date(h.date);
        return hDate.getMonth() === now.getMonth() && hDate.getFullYear() === now.getFullYear();
      });
    }

    if (filters.vendors.length > 0) {
      filtered = filtered.filter((h) => filters.vendors.includes(h.company?.vendor));
    }

    if (filters.amountRange.min || filters.amountRange.max) {
      filtered = filtered.filter((h) => {
        const amount = h.totalAmount || 0;
        const min = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0;
        const max = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((h) =>
        Object.values(h).some((value) => {
          if (value && typeof value === 'object') {
            return Object.values(value).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
          }
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    setFilteredData(filtered);
  };

  const handleSigCellEnter = (hireOrder) => {
    const signed = [
      hireOrder.managerSigned && 'Manager',
      hireOrder.pmSigned && 'PM',
      hireOrder.accountsSigned && 'Accounts',
      hireOrder.ceoSigned && 'CEO',
    ].filter(Boolean);
    setSigToast({
      show: true,
      message: signed.length > 0 ? 'Signed by: ' + signed.join(' | ') : 'Nobody signed yet',
    });
  };

  const handleSigCellLeave = () => setSigToast({ show: false, message: '' });
  const closeSigToast = () => setSigToast({ show: false, message: '' });
  const closePendingToast = () => setShowPendingToast(false);

  const handlePendingToastAction = () => {
    setShowPendingToast(false);
    const firstPending = pendingSignatures[0];
    if (firstPending && tableRef.current) {
      const row = tableRef.current.querySelector(`[data-hireorderref="${firstPending.hireOrderRef}"]`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const registerExpandControls = (fn) => { toggleExpandRef.current = fn; };
  const toggleExpandRow = (key) => toggleExpandRef.current?.(key);

  return {
    searchTerm,
    hireOrders,
    filteredData,
    isLoading,
    showDeleteModal,
    selectedHireOrder,
    deleteStatus,
    showStatusModal,
    showFiltersModal,
    setShowFiltersModal,
    pendingSignatures,
    showPendingToast,
    showLegendModal,
    setShowLegendModal,
    sigToast,
    filters,
    tableRef,
    getRowClass,
    handleRowClick,
    handlePrint,
    handleDeleteClick,
    handleAmendment,
    confirmDelete,
    cancelDelete,
    closeStatusModal,
    handleViewHireOrder,
    handleAddHireOrder,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
    handleSigCellEnter,
    handleSigCellLeave,
    closeSigToast,
    closePendingToast,
    handlePendingToastAction,
    registerExpandControls,
    toggleExpandRow,
  };
};

export default useHireOrderList;