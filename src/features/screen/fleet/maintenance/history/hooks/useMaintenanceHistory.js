import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useSearch } from '@/shared/context/SearchContext';
import { setNestedFormValue } from '../helper/maintenance.history.helper';
import {
  exportServiceHistoryToExcel,
  exportServiceHistoryToPdf,
  exportServiceHistoryToSeparatePdfsPerEquipment,
  printServiceHistoryTable,
} from '../helper/maintenance.history.export.helper';
import {
  deleteServiceHistoryRecord,
  fetchEquipmentByRegNo,
  fetchServiceHistoryList,
  fetchServiceHistoryTypeCounts,
  fetchReportForHistoryItem,
} from '../api/maintenance.history.api';
import { useDocumentSigning } from './useHistorySign';
import {
  MAINTENANCE_HISTORY_TABS,
  MAINTENANCE_HISTORY_PAGE_SIZE,
  MAINTENANCE_HISTORY_SCROLL_BOTTOM_OFFSET_PX,
  MAINTENANCE_HISTORY_SCROLL_DEBOUNCE_MS,
  MAINTENANCE_HISTORY_DEFAULT_TAB_COUNTS,
} from '../constants/maintenance.history.constant';

const DEFAULT_DATE_RANGE_FILTER = {
  dateFilterMode: 'all',
  lastMonthsCount: 6,
  customStartDate: '',
  customEndDate: '',
};

export const SERVICE_HISTORY_FILTER_FIELDS = [
  {
    name: 'dateFilterMode',
    label: 'Date Range',
    type: 'select',
    options: [
      { value: 'all', label: 'All Time' },
      { value: 'lastXmonths', label: 'Last N Months' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'custom', label: 'Custom Range' },
    ],
  },
  { name: 'lastMonthsCount', label: 'Number of Months', type: 'number', visibleWhen: (values) => values.dateFilterMode === 'lastXmonths' },
  { name: 'customStartDate', label: 'Start Date', type: 'date', visibleWhen: (values) => values.dateFilterMode === 'custom' },
  { name: 'customEndDate', label: 'End Date', type: 'date', visibleWhen: (values) => values.dateFilterMode === 'custom' },
];

const onScrollNearBottom = (offsetPx, callback) => {
  let debounceTimer = null;
  return () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const reachedBottom = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - offsetPx;
      if (reachedBottom) callback();
    }, MAINTENANCE_HISTORY_SCROLL_DEBOUNCE_MS);
  };
};

export const useMaintenanceHistory = ({ registrationNumbers = [], isMultipleEquipment = false } = {}) => {
  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { searchTerm } = useSearch();
  const signing = useDocumentSigning();
  const tableRef = useRef(null);

  const [historyItems, setHistoryItems] = useState([]);
  const [equipmentData, setEquipmentData] = useState(null);
  const [multipleEquipmentData, setMultipleEquipmentData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState(MAINTENANCE_HISTORY_TABS.ALL);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_DATE_RANGE_FILTER);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_DATE_RANGE_FILTER);
  const [tabCounts, setTabCounts] = useState(MAINTENANCE_HISTORY_DEFAULT_TAB_COUNTS);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  const [groupedData, setGroupedData] = useState({});

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportPendingDeletion, setReportPendingDeletion] = useState(null);
  const [expandedRemarks, setExpandedRemarks] = useState({});

  useEffect(() => {
    if (isMultipleEquipment && multipleEquipmentData.length > 0) {
      setHeaderSubtitle(`Equipments (${multipleEquipmentData.length}) > ${appliedFilters.dateFilterMode.toUpperCase()} TIME > ${activeTab.toUpperCase()} SERVICE`);
    } else if (equipmentData && registrationNumbers[0]) {
      setHeaderSubtitle(`${equipmentData.machine} - ${registrationNumbers[0]} > ${appliedFilters.dateFilterMode.toUpperCase()} TIME > ${activeTab.toUpperCase()} SERVICE`);
    } else {
      setHeaderSubtitle(null);
    }
    setHeaderTitle('Service History');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [equipmentData, multipleEquipmentData, registrationNumbers, activeTab, appliedFilters.dateFilterMode, isMultipleEquipment, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (registrationNumbers.length === 0) return;

    const loadEquipmentDetails = async () => {
      try {
        if (isMultipleEquipment) {
          const equipments = await Promise.all(registrationNumbers.map(fetchEquipmentByRegNo));
          const validEquipments = equipments.filter(Boolean);
          setMultipleEquipmentData(validEquipments);
          setEquipmentData(validEquipments[0] || null);
        } else {
          const equipment = await fetchEquipmentByRegNo(registrationNumbers[0]);
          if (equipment) setEquipmentData(equipment);
        }
      } catch (err) {
        console.error('Could not load equipment data:', err);
      }
    };

    loadEquipmentDetails();
  }, [registrationNumbers, isMultipleEquipment]);

  const enrichWithReportDetails = useCallback(async (items) => {
    const reportBackedServiceTypes = new Set(['oil', 'normal', 'tyre', 'battery']);

    return Promise.all(items.map(async (item) => {
      if (item.serviceType === 'major') {
        try {
          const matchedReport = await fetchReportForHistoryItem(item);
          if (!matchedReport) return item;
          return {
            ...item,
            remarks: matchedReport.remarks || item.remarks,
            serviceHrs: matchedReport.serviceHrs || item.serviceHrs,
            nextServiceHrs: matchedReport.nextServiceHrs || item.nextServiceHrs,
            location: matchedReport.location || item.location,
            majorRemarks: matchedReport.remarks || item.majorRemarks,
          };
        } catch {
          return item;
        }
      }

      if (!reportBackedServiceTypes.has(item.serviceType) || !item.date) return item;

      try {
        const matchedReport = await fetchReportForHistoryItem(item);
        if (!matchedReport) return item;

        const enrichedItem = { ...item, remarks: matchedReport.remarks || item.remarks };
        if ((item.serviceType === 'oil' || item.serviceType === 'normal') && matchedReport.location) {
          enrichedItem.location = matchedReport.location;
        }
        return enrichedItem;
      } catch {
        return item;
      }
    }));
  }, []);

  const fetchPage = useCallback(async (page, append) => {
    if (registrationNumbers.length === 0) return;

    page === 1 ? setLoading(true) : setIsLoadingMore(true);
    setError(null);

    try {
      const result = await fetchServiceHistoryList({
        regNos: registrationNumbers,
        serviceType: activeTab === MAINTENANCE_HISTORY_TABS.ALL ? null : activeTab,
        page,
        limit: MAINTENANCE_HISTORY_PAGE_SIZE,
        dateRangeFilter: appliedFilters,
      });

      if (!result.ok) throw new Error(result.message || 'Failed to fetch service records');

      const normalizedItems = (result.data || []).map((item) => ({ ...item, regNo: String(item.regNo || '').trim() }));
      const enrichedItems = await enrichWithReportDetails(normalizedItems);

      setHistoryItems((prev) => (append ? [...prev, ...enrichedItems] : enrichedItems));
      setCurrentPage(result.pagination?.currentPage || page);
      setHasMorePages(Boolean(result.pagination?.hasMore));
    } catch (err) {
      console.error('Error fetching service histories:', err);
      setError('Failed to fetch service records. Please try again.');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [registrationNumbers, activeTab, appliedFilters, enrichWithReportDetails]);

  const fetchTabCounts = useCallback(async () => {
    if (registrationNumbers.length === 0) return;
    try {
      const result = await fetchServiceHistoryTypeCounts({ regNos: registrationNumbers, dateRangeFilter: appliedFilters });
      if (result.ok) setTabCounts(result.data);
    } catch (err) {
      console.error('Error fetching service history counts:', err);
    }
  }, [registrationNumbers, appliedFilters]);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  useEffect(() => {
    if (!hasMorePages || loading || isLoadingMore) return;
    const handleScroll = onScrollNearBottom(MAINTENANCE_HISTORY_SCROLL_BOTTOM_OFFSET_PX, () => {
      fetchPage(currentPage + 1, true);
    });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMorePages, loading, isLoadingMore, currentPage, fetchPage]);

  const searchedItems = useMemo(() => {
    if (!searchTerm) return historyItems;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return historyItems.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(lowerSearchTerm)));
  }, [historyItems, searchTerm]);

  useEffect(() => {
    if (isMultipleEquipment) {
      const itemsByRegistrationNumber = {};
      searchedItems.forEach((item) => {
        if (!itemsByRegistrationNumber[item.regNo]) itemsByRegistrationNumber[item.regNo] = [];
        itemsByRegistrationNumber[item.regNo].push(item);
      });
      setGroupedData(itemsByRegistrationNumber);
    } else if (registrationNumbers[0]) {
      setGroupedData({ [registrationNumbers[0]]: searchedItems });
    } else {
      setGroupedData({});
    }
  }, [searchedItems, isMultipleEquipment, registrationNumbers]);

  const handleShowFiltersModal = () => {
    setDraftFilters(appliedFilters);
    setShowFiltersModal(true);
  };

  const handleCloseFiltersModal = () => setShowFiltersModal(false);

  const handleFilterFormChange = (fieldPath, value) => {
    setDraftFilters((currentDraft) => setNestedFormValue(currentDraft, fieldPath, value));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_DATE_RANGE_FILTER);
    setAppliedFilters(DEFAULT_DATE_RANGE_FILTER);
  };

  const handleShowDeleteConfirmation = (item) => {
    setReportPendingDeletion(item);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleConfirmDeleteReport = async () => {
    const result = await deleteServiceHistoryRecord(reportPendingDeletion.serviceType || 'oil', reportPendingDeletion._id);
    if (result.ok) window.location.reload();
  };

  const handleToggleRemarkExpansion = (remarkKey) => {
    setExpandedRemarks((current) => ({ ...current, [remarkKey]: !current[remarkKey] }));
  };

  const navigateToAddSingleServiceRecord = () => {
    navigate(`/maintenance/entry/${registrationNumbers[0]}`);
  };

  const navigateToAddMultipleServiceRecords = () => {
    navigate('/batch-service-form', { state: { regNos: registrationNumbers } });
  };

  const navigateToAllServiceDocuments = () => {
    navigate(`/all/all-histories/${registrationNumbers.join(',')}`);
  };

  const exportContext = {
    groupedData,
    activeTab,
    isMultipleEquipment,
    multipleEquipmentData,
    equipmentData,
    registrationNumbers,
    searchTerm,
    dateRangeFilter: appliedFilters,
  };

  const handleExportToExcel = () => exportServiceHistoryToExcel(exportContext);

  const handleExportToPdf = () => {
    signing.requireSignature((signatureUrl) => {
      exportServiceHistoryToPdf({ ...exportContext, supervisorSignUrl: signatureUrl });
    });
  };

  const handleExportToSeparatePdfs = () => {
    signing.requireSignature((signatureUrl) => {
      exportServiceHistoryToSeparatePdfsPerEquipment({ ...exportContext, supervisorSignUrl: signatureUrl });
    });
  };

  const handlePrint = () => {
    signing.requireSignature((signatureUrl) => {
      printServiceHistoryTable({
        ...exportContext,
        tableElement: tableRef.current,
        filteredItems: searchedItems,
        supervisorSignUrl: signatureUrl,
      });
    });
  };

  const handlePrintWithoutSignature = () => {
    printServiceHistoryTable({
      ...exportContext,
      tableElement: tableRef.current,
      filteredItems: searchedItems,
      supervisorSignUrl: null,
      skipSignature: true,
    });
  };

  return {
    filteredItems: searchedItems,
    groupedData,
    equipmentData,
    multipleEquipmentData,
    registrationNumbers,
    isMultipleEquipment,
    loading,
    isLoadingMore,
    hasMorePages,
    error,
    tableRef,

    activeTab,
    setActiveTab,
    tabCounts,

    appliedFilters,
    draftFilters,
    filterFormFields: SERVICE_HISTORY_FILTER_FIELDS,

    handleShowFiltersModal,
    handleCloseFiltersModal,
    handleFilterFormChange,
    handleApplyFilters,
    handleResetFilters,
    showFiltersModal,

    showDeleteModal,
    handleShowDeleteConfirmation,
    handleCloseDeleteModal,
    handleConfirmDeleteReport,

    expandedRemarks,
    handleToggleRemarkExpansion,

    navigateToAddSingleServiceRecord,
    navigateToAddMultipleServiceRecords,
    navigateToAllServiceDocuments,

    handleExportToExcel,
    handleExportToPdf,
    handleExportToSeparatePdfs,
    handlePrint,
    handlePrintWithoutSignature,

    signing,
  };
};