import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useSearch } from '@/shared/context/SearchContext';
import { deleteMaintenance } from '../../report/api/maintenance.api';
import { fetchMaintenanceList, fetchMaintenanceTypeCounts } from '../api/maintenance.list.api';
import { buildMaintenanceFilterParams } from '../helper/maintenance.list.query.helper';
import { getDateRangeLabel } from '../helper/maintenance.list.helper';
import {
  exportMaintenanceListToExcel,
  exportMaintenanceListToPdf,
  exportMaintenanceListToSeparatePdfs,
  printMaintenanceListTable,
} from '../helper/maintenance.list.export.helper';
import { useMaintenanceSigning } from './useMaintenanceSigning';
import {
  MAINTENANCE_LIST_TABS,
  MAINTENANCE_LIST_PAGE_SIZE,
  MAINTENANCE_LIST_SCROLL_BOTTOM_OFFSET_PX,
  MAINTENANCE_LIST_SCROLL_DEBOUNCE_MS,
  MAINTENANCE_LIST_DEFAULT_TAB_COUNTS,
  MAINTENANCE_LIST_FILTER_FIELDS,
  DEFAULT_DATE_RANGE_FILTER,
} from '../constants/maintenance.list.constant';

const onScrollNearBottom = (offsetPx, callback) => {
  let debounceTimer = null;
  return () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const reachedBottom = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - offsetPx;
      if (reachedBottom) callback();
    }, MAINTENANCE_LIST_SCROLL_DEBOUNCE_MS);
  };
};

export const useMaintenanceList = ({ registrationNumbers = [] } = {}) => {
  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { searchTerm } = useSearch();
  const signing = useMaintenanceSigning();
  const tableRef = useRef(null);

  const isMultipleEquipment = registrationNumbers.length !== 1;

  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState(MAINTENANCE_LIST_TABS.ALL);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_DATE_RANGE_FILTER);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_DATE_RANGE_FILTER);
  const [tabCounts, setTabCounts] = useState(MAINTENANCE_LIST_DEFAULT_TAB_COUNTS);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [maintenancePendingDeletion, setMaintenancePendingDeletion] = useState(null);
  const [expandedRemarks, setExpandedRemarks] = useState({});

  const equipmentList = useMemo(() => {
    const equipmentByRegNo = new Map();
    maintenanceItems.forEach((item) => {
      if (!equipmentByRegNo.has(item.regNo)) equipmentByRegNo.set(item.regNo, { regNo: item.regNo, machine: item.equipment });
    });
    return Array.from(equipmentByRegNo.values());
  }, [maintenanceItems]);

  useEffect(() => {
    const dateRangeLabel = getDateRangeLabel(appliedFilters).toUpperCase();
    const serviceLabel = `${activeTab.toUpperCase()} SERVICE`;

    if (registrationNumbers.length === 1) {
      const machineName = equipmentList[0]?.machine;
      setHeaderSubtitle(`${machineName ? `${machineName} - ` : ''}${registrationNumbers[0]} > ${dateRangeLabel} > ${serviceLabel}`);
    } else {
      const equipmentCount = registrationNumbers.length || equipmentList.length;
      setHeaderSubtitle(`Equipments (${equipmentCount}) > ${dateRangeLabel} > ${serviceLabel}`);
    }
    setHeaderTitle('Maintenance List');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [equipmentList, registrationNumbers, activeTab, appliedFilters, setHeaderTitle, setHeaderSubtitle]);

  const fetchPage = useCallback(async (page, append) => {
    if (page === 1) setLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const result = await fetchMaintenanceList({
        regNos: registrationNumbers,
        serviceType: activeTab === MAINTENANCE_LIST_TABS.ALL ? null : activeTab,
        page,
        limit: MAINTENANCE_LIST_PAGE_SIZE,
        dateRangeFilter: appliedFilters,
      });

      if (!result.ok) throw new Error(result.message || 'Failed to fetch maintenance records');

      const normalizedItems = (result.data || []).map((item) => ({ ...item, regNo: String(item.regNo || '').trim() }));

      setMaintenanceItems((previous) => (append ? [...previous, ...normalizedItems] : normalizedItems));
      setCurrentPage(result.pagination?.currentPage || page);
      setHasMorePages(Boolean(result.pagination?.hasMore));
    } catch (fetchError) {
      console.error('Error fetching maintenance records:', fetchError);
      setError('Failed to fetch maintenance records. Please try again.');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [registrationNumbers, activeTab, appliedFilters]);

  const fetchTabCounts = useCallback(async () => {
    try {
      const result = await fetchMaintenanceTypeCounts({ regNos: registrationNumbers, dateRangeFilter: appliedFilters });
      if (result.ok) setTabCounts(result.data);
    } catch (countError) {
      console.error('Error fetching maintenance counts:', countError);
    }
  }, [registrationNumbers, appliedFilters]);

  useEffect(() => { fetchPage(1, false); }, [fetchPage]);
  useEffect(() => { fetchTabCounts(); }, [fetchTabCounts]);

  useEffect(() => {
    if (!hasMorePages || loading || isLoadingMore) return undefined;
    const handleScroll = onScrollNearBottom(MAINTENANCE_LIST_SCROLL_BOTTOM_OFFSET_PX, () => {
      fetchPage(currentPage + 1, true);
    });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMorePages, loading, isLoadingMore, currentPage, fetchPage]);

  const searchedItems = useMemo(() => {
    if (!searchTerm) return maintenanceItems;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return maintenanceItems.filter((item) =>
      Object.values(item).some((value) => String(value).toLowerCase().includes(lowerSearchTerm))
    );
  }, [maintenanceItems, searchTerm]);

  const groupedData = useMemo(() => {
    if (!isMultipleEquipment) return { [registrationNumbers[0]]: searchedItems };

    return searchedItems.reduce((groups, item) => {
      (groups[item.regNo] = groups[item.regNo] || []).push(item);
      return groups;
    }, {});
  }, [searchedItems, isMultipleEquipment, registrationNumbers]);

  const handleFilterFormChange = (fieldName, value) => {
    setDraftFilters((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
  };

  const handleApplyFilters = () => setAppliedFilters(draftFilters);

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_DATE_RANGE_FILTER);
    setAppliedFilters(DEFAULT_DATE_RANGE_FILTER);
  };

  const handleShowDeleteConfirmation = (item) => {
    setMaintenancePendingDeletion(item);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleConfirmDeleteMaintenance = async () => {
    const result = await deleteMaintenance(maintenancePendingDeletion._id);
    if (!result.ok) return;
    setShowDeleteModal(false);
    fetchPage(1, false);
    fetchTabCounts();
  };

  const handleToggleRemarkExpansion = (remarkKey) => {
    setExpandedRemarks((current) => ({ ...current, [remarkKey]: !current[remarkKey] }));
  };

  const navigateToAddMaintenance = () => {
    navigate(registrationNumbers.length === 1 ? `/maintenance/form/new/${registrationNumbers[0]}` : '/maintenance/form/new');
  };

  const navigateToAddMultipleMaintenance = () => {
    navigate(registrationNumbers.length === 1 ? `/batch-service-form/${registrationNumbers[0]}` : '/batch-service-form');
  };

  const navigateToAllDocuments = () => {
    const params = buildMaintenanceFilterParams({
      regNos: registrationNumbers,
      serviceType: activeTab === MAINTENANCE_LIST_TABS.ALL ? null : activeTab,
      dateRangeFilter: appliedFilters,
    });
    navigate(`/maintenance/report/batch?${params.toString()}`);
  };

  const exportContext = {
    groupedData,
    activeTab,
    isMultipleEquipment,
    equipmentList,
    registrationNumbers,
    searchTerm,
    dateRangeFilter: appliedFilters,
  };

  const handleExportToExcel = () => exportMaintenanceListToExcel(exportContext);

  const handleExportToPdf = () => {
    signing.requireSignature((signatureUrl) => {
      exportMaintenanceListToPdf({ ...exportContext, supervisorSignUrl: signatureUrl, skipSignature: !signatureUrl });
    });
  };

  const handleExportToSeparatePdfs = () => {
    signing.requireSignature((signatureUrl) => {
      exportMaintenanceListToSeparatePdfs({ ...exportContext, supervisorSignUrl: signatureUrl, skipSignature: !signatureUrl });
    });
  };

  const handlePrint = () => {
    signing.requireSignature((signatureUrl) => {
      printMaintenanceListTable({
        ...exportContext,
        tableElement: tableRef.current,
        filteredItems: searchedItems,
        supervisorSignUrl: signatureUrl,
        skipSignature: !signatureUrl,
      });
    });
  };

  return {
    filteredItems: searchedItems,
    groupedData,
    registrationNumbers,
    isMultipleEquipment,
    loading,
    isLoadingMore,
    error,
    tableRef,

    activeTab,
    setActiveTab,
    tabCounts,

    appliedFilters,
    draftFilters,
    filterFormFields: MAINTENANCE_LIST_FILTER_FIELDS,
    handleFilterFormChange,
    handleApplyFilters,
    handleResetFilters,

    showDeleteModal,
    handleShowDeleteConfirmation,
    handleCloseDeleteModal,
    handleConfirmDeleteMaintenance,

    expandedRemarks,
    handleToggleRemarkExpansion,

    navigateToAddMaintenance,
    navigateToAddMultipleMaintenance,
    navigateToAllDocuments,

    handleExportToExcel,
    handleExportToPdf,
    handleExportToSeparatePdfs,
    handlePrint,

    signing,
  };
};