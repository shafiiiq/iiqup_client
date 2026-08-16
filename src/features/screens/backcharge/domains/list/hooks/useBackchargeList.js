import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBackchargeReports, fetchPendingSignatures, deleteBackcharge } from '../api/backcharge.list.api';

const defaultFilters = {
  dateFilter: 'all',
  suppliers: [],
  equipmentTypes: [],
  costRange: { min: '', max: '' },
  lastMonthsCount: 6,
  customStartDate: '',
  customEndDate: '',
};

export const useBackchargeList = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [backcharges, setBackcharges] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackcharge, setSelectedBackcharge] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [showPendingToast, setShowPendingToast] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    const loadBackcharges = async () => {
      try {
        const response = await fetchBackchargeReports();
        const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setBackcharges(rows);
        setFilteredData(rows);
      } catch (error) {
        console.error('[BackchargeList] fetch error:', error);
        setBackcharges([]);
        setFilteredData([]);
      }
    };

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

    loadBackcharges();
    loadPendingSignatures();
  }, []);

  useEffect(() => {
    if (!backcharges.length) return;

    let next = [...backcharges];

    if (filters.suppliers.length > 0) {
      next = next.filter((item) => filters.suppliers.includes(item.supplierName));
    }

    if (filters.equipmentTypes.length > 0) {
      next = next.filter((item) => filters.equipmentTypes.includes(item.equipmentType));
    }

    if (filters.dateFilter !== 'all' && filters.dateFilter === 'thismonth') {
      const now = new Date();
      next = next.filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setShowFiltersModal(false);
  };

  const handleRowClick = (reportNo) => {
    if (reportNo) navigate(`/backcharge-report/${reportNo}`);
  };

  const handleViewBackcharge = (backcharge) => {
    if (backcharge?.reportNo) navigate(`/backcharge-report/${backcharge.reportNo}`);
  };

  const handleAddBackcharge = () => {
    navigate('/backcharge-form');
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
      setBackcharges((prev) => prev.filter((item) => item._id !== selectedBackcharge._id));
      setFilteredData((prev) => prev.filter((item) => item._id !== selectedBackcharge._id));
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
            body { font-family: Arial, sans-serif; margin: 24px; }
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
    backcharges,
    filteredData,
    showDeleteModal,
    selectedBackcharge,
    deleteStatus,
    showStatusModal,
    showFiltersModal,
    pendingSignatures,
    showPendingToast,
    filters,
    setShowFiltersModal,
    setShowPendingToast,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
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
