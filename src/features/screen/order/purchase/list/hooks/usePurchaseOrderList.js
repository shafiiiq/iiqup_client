import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearch } from '@/shared/context/SearchContext';
import { deletePurchaseOrder, fetchPurchaseOrderList, fetchPendingSignatures } from '../api/purchase.order.list.api';
import { DEFAULT_FILTERS, SIGNED_WORKFLOW_STATUSES, PURCHASE_ORDER_LIST_TYPE, STATS_TAB } from '../constants/purchase.order.list.constant';
import { usePagination } from '@/shared/pagination/usePagination';

const usePurchaseOrderList = ({ purchaseOrderOfSpecificEquipment } = {}) => {
    const navigate = useNavigate();
    const tableRef = useRef(null);
    const toggleExpandRef = useRef(null);
    const { regNo } = useParams();

    const { searchTerm } = useSearch();
    const [activeView, setActiveView] = useState('list');
    const [activeListType, setActiveListType] = useState(PURCHASE_ORDER_LIST_TYPE.ALL);
    const [statsTab, setStatsTab] = useState(STATS_TAB.OVERVIEW);
    const isPurchaseOrdersOfEquipments = !purchaseOrderOfSpecificEquipment && activeListType === PURCHASE_ORDER_LIST_TYPE.EQUIPMENTS;
    const isPurchaseOrdersOfStocks = !purchaseOrderOfSpecificEquipment && activeListType === PURCHASE_ORDER_LIST_TYPE.STOCKS;

    const fetchFn = useCallback(({ page, limit }) => fetchPurchaseOrderList({
        purchaseOrderOfSpecificEquipment,
        purchaseOrdersOfStocks: isPurchaseOrdersOfStocks,
        purchaseOrdersOfEquipments: isPurchaseOrdersOfEquipments,
        regNo,
        page,
        limit,
    }), [purchaseOrderOfSpecificEquipment, isPurchaseOrdersOfStocks, isPurchaseOrdersOfEquipments, regNo]);

    const {
        data: purchaseorders,
        loading: isLoading,
        hasMore,
        loadMore,
        fetchPage,
        reset: resetPagination,
    } = usePagination(fetchFn);

    const [filteredData, setFilteredData] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
    const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingSignatures, setPendingSignatures] = useState([]);
    const [showPendingToast, setShowPendingToast] = useState(false);
    const [showLegendModal, setShowLegendModal] = useState(false);
    const [isPickingEquipment, setIsPickingEquipment] = useState(false);
    const [sigToast, setSigToast] = useState({ show: false, message: '' });
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    useEffect(() => {
        resetPagination();
        fetchPage(1);
        fetchPendingSignaturesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchaseOrderOfSpecificEquipment, activeListType, regNo]);

    const fetchPurchaseOrders = () => fetchPage(1);

    const isPendingForUser = (purchaseorderRef) => pendingSignatures.some(p => p.purchaseorderRef === purchaseorderRef);

    const fetchPendingSignaturesData = async () => {
        try {
            const data = await fetchPendingSignatures();
            setPendingSignatures(data.data || []);
            if (data.count > 0) setShowPendingToast(true);
        } catch (error) {
            console.error('[PurchaseOrderList] fetchPendingSignatures:', error);
        }
    };

    const getRowClass = (purchaseorder) => {
        const { pmSigned, managerSigned, accountsSigned, ceoSigned } = purchaseorder;
        const uploaded = SIGNED_WORKFLOW_STATUSES.includes(purchaseorder.workflowStatus);
        if (!uploaded) return '';

        if (managerSigned && pmSigned && accountsSigned && ceoSigned)
            return 'purchaseorder-sig-all';

        if (isPendingForUser(purchaseorder.purchaseorderRef))
            return 'purchaseorder-sig-pending';

        if (managerSigned && pmSigned && accountsSigned && !ceoSigned) return 'purchaseorder-sig-mgr-pm-acc';
        if (managerSigned && pmSigned && !accountsSigned && ceoSigned) return 'purchaseorder-sig-mgr-pm-ceo';
        if (managerSigned && !pmSigned && accountsSigned && ceoSigned) return 'purchaseorder-sig-mgr-acc-ceo';
        if (!managerSigned && pmSigned && accountsSigned && ceoSigned) return 'purchaseorder-sig-pm-acc-ceo';

        if (managerSigned && pmSigned && !accountsSigned && !ceoSigned) return 'purchaseorder-sig-mgr-pm';
        if (managerSigned && !pmSigned && accountsSigned && !ceoSigned) return 'purchaseorder-sig-mgr-acc';
        if (managerSigned && !pmSigned && !accountsSigned && ceoSigned) return 'purchaseorder-sig-mgr-ceo';
        if (!managerSigned && pmSigned && accountsSigned && !ceoSigned) return 'purchaseorder-sig-pm-acc';
        if (!managerSigned && pmSigned && !accountsSigned && ceoSigned) return 'purchaseorder-sig-pm-ceo';
        if (!managerSigned && !pmSigned && accountsSigned && ceoSigned) return 'purchaseorder-sig-acc-ceo';

        if (managerSigned && !pmSigned && !accountsSigned && !ceoSigned) return 'purchaseorder-sig-mgr-only';
        if (!managerSigned && pmSigned && !accountsSigned && !ceoSigned) return 'purchaseorder-sig-pm-only';
        if (!managerSigned && !pmSigned && accountsSigned && !ceoSigned) return 'purchaseorder-sig-acc-only';
        if (!managerSigned && !pmSigned && !accountsSigned && ceoSigned) return 'purchaseorder-sig-ceo-only';

        return 'purchaseorder-sig-none';
    };

    useEffect(() => {
        applyAllFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchaseorders, searchTerm, filters]);

    const handleTabSelect = (path, node) => {
        if (Object.values(STATS_TAB).includes(node.key)) {
            setActiveView('stats');
            setStatsTab(node.key);
            return;
        }
        if (Object.values(PURCHASE_ORDER_LIST_TYPE).includes(node.key)) {
            setActiveView('list');
            setActiveListType(node.key);
        }
    };

    const handleRowClick = (purchaseorderRef) => {
        navigate(`/purchaseorder-details/${purchaseorderRef}`);
    };

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
          <title>PurchaseOrder List</title>
          ${style}
        </head>
        <body>
          <h1>PurchaseOrder List</h1>
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

    const handleDeleteClick = (e, purchaseorder) => {
        e.stopPropagation();
        setSelectedPurchaseOrder(purchaseorder);
        setShowDeleteModal(true);
    };

    const handleAmendment = (e, purchaseorder) => {
        e.stopPropagation();
        navigate(`/order/purchase/form/amendment/${encodeURIComponent(purchaseorder.purchaseorderRef)}`);
    };

    const confirmDelete = async () => {
        if (!selectedPurchaseOrder) return;

        try {
            await deletePurchaseOrder(selectedPurchaseOrder.purchaseorderRef);

            setShowDeleteModal(false);
            setDeleteStatus({
                message: `PurchaseOrder ${selectedPurchaseOrder.purchaseorderRef} successfully deleted.`,
                isError: false
            });
            fetchPurchaseOrders();
        } catch (error) {
            setShowDeleteModal(false);
            setDeleteStatus({
                message: 'Error deleting PurchaseOrder: ' + error.message,
                isError: true
            });
            console.error('Error deleting PurchaseOrder:', error);
        } finally {
            setShowStatusModal(true);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedPurchaseOrder(null);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setDeleteStatus({ message: '', isError: false });
    };

    const handleViewPurchaseOrder = (e, purchaseorder) => {
        e.stopPropagation();
        navigate(`/order/purchase/report/${encodeURIComponent(purchaseorder.purchaseorderRef)}`);
    };

    const handleAddPurchaseOrder = () => {
        navigate(`/order/purchase/form/${regNo}`);
    };

    const handleCreateForAllEquipments = () => {
        navigate('/order/purchase/form/for-all-equipments');
    };

    const handleCreateForStock = () => {
        navigate('/order/purchase/form/for-stock');
    };

    const handleOpenEquipmentPicker = () => setIsPickingEquipment(true);
    const handleCloseEquipmentPicker = () => setIsPickingEquipment(false);

    const handleEquipmentPicked = (equipment) => {
        setIsPickingEquipment(false);
        navigate(`/order/purchase/form/${equipment.regNo}`);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        applyAllFilters();
    };

    const handleResetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setFilteredData(Array.isArray(purchaseorders) ? purchaseorders : []);
    };

    const applyAllFilters = () => {
        let filtered = Array.isArray(purchaseorders) ? [...purchaseorders] : [];

        if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
            filtered = filtered.filter(purchaseorder => {
                const purchaseorderDate = new Date(purchaseorder.date);
                const startDate = new Date(filters.customStartDate);
                const endDate = new Date(filters.customEndDate);
                return purchaseorderDate >= startDate && purchaseorderDate <= endDate;
            });
        } else if (filters.dateFilter === 'lastXmonths') {
            const monthsAgo = new Date();
            monthsAgo.setMonth(monthsAgo.getMonth() - filters.lastMonthsCount);
            filtered = filtered.filter(purchaseorder => new Date(purchaseorder.date) >= monthsAgo);
        } else if (filters.dateFilter === 'thismonth') {
            const now = new Date();
            filtered = filtered.filter(purchaseorder => {
                const purchaseorderDate = new Date(purchaseorder.date);
                return purchaseorderDate.getMonth() === now.getMonth() &&
                    purchaseorderDate.getFullYear() === now.getFullYear();
            });
        }

        if (filters.vendors.length > 0) {
            filtered = filtered.filter(purchaseorder =>
                filters.vendors.includes(purchaseorder.company?.vendor)
            );
        }

        if (filters.equipmentTypes.length > 0) {
            filtered = filtered.filter(purchaseorder =>
                filters.equipmentTypes.includes(purchaseorder.equipment)
            );
        }

        if (filters.amountRange.min || filters.amountRange.max) {
            filtered = filtered.filter(purchaseorder => {
                const amount = purchaseorder.totalAmount;
                const min = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0;
                const max = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity;
                return amount >= min && amount <= max;
            });
        }

        if (searchTerm) {
            filtered = filtered.filter(purchaseorder => {
                return Object.values(purchaseorder).some(value => {
                    if (typeof value === 'object' && value !== null) {
                        return Object.values(value).some(v =>
                            String(v).toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }
                    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                });
            });
        }

        setFilteredData(filtered);
    };

    const handleSigCellEnter = (purchaseorder) => {
        const signed = [
            purchaseorder.managerSigned && 'Manager',
            purchaseorder.pmSigned && 'PM',
            purchaseorder.accountsSigned && 'Accounts',
            purchaseorder.ceoSigned && 'CEO',
        ].filter(Boolean);
        setSigToast({
            show: true,
            message: signed.length > 0 ? 'Signed by: ' + signed.join(' | ') : 'Nobody signed yet'
        });
    };

    const handleSigCellLeave = () => setSigToast({ show: false, message: '' });

    const closeSigToast = () => setSigToast({ show: false, message: '' });

    const closePendingToast = () => setShowPendingToast(false);

    const handlePendingToastAction = () => {
        setShowPendingToast(false);
        const firstPending = pendingSignatures[0];
        if (firstPending && tableRef.current) {
            const row = tableRef.current.querySelector(`[data-purchaseorderref="${firstPending.purchaseorderRef}"]`);
            row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const registerExpandControls = (fn) => { toggleExpandRef.current = fn; };
    const toggleExpandRow = (key) => toggleExpandRef.current?.(key);

    return {
        searchTerm,
        purchaseorders,
        filteredData,
        isLoading,
        hasMore,
        loadMore,
        activeView,
        activeListType,
        statsTab,
        showDeleteModal,
        selectedPurchaseOrder,
        deleteStatus,
        showStatusModal,
        pendingSignatures,
        showPendingToast,
        showLegendModal,
        setShowLegendModal,
        isPickingEquipment,
        sigToast,
        filters,
        tableRef,
        getRowClass,
        handleTabSelect,
        handleRowClick,
        handlePrint,
        handleDeleteClick,
        handleAmendment,
        confirmDelete,
        cancelDelete,
        closeStatusModal,
        handleViewPurchaseOrder,
        handleAddPurchaseOrder,
        handleCreateForAllEquipments,
        handleCreateForStock,
        handleOpenEquipmentPicker,
        handleCloseEquipmentPicker,
        handleEquipmentPicked,
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

export default usePurchaseOrderList;