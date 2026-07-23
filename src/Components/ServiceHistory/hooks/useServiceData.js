// ─────────────────────────────────────────────────────────────────────────────
// useServiceData.js — Data fetching + processing hook for ServiceHistory.
// UPDATED: Unified ServiceHistory collection — one API call per regNo instead
// of 4 parallel calls. serviceType 'maintenance' is now 'major' everywhere.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHeaderTitle } from '../../../Context/HeaderTitleContext';
import { useSearch }      from '../../../Context/SearchContext';
import { apiRequest }     from '../../../utils/api';
import { API_URI }      from '../../../constants';
import { formatDate, isDateInRange } from '../utils/serviceHelpers';

export const useServiceData = ({ regNoArray, regNos, isMultipleEquipment }) => {

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { searchTerm }                        = useSearch();

  // ── Raw API data ───────────────────────────────────────────────────────────
  // Unified: one array instead of 4 separate ones
  const [allHistory,         setAllHistory]         = useState([]);
  const [equipmentData,      setEquipmentData]      = useState(null);
  const [multipleEquipmentData, setMultipleEquipmentData] = useState([]);

  // ── Loading / Error ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [activeTab,       ] = useState('all');
  const [dateFilter,        setDateFilter]        = useState('all');
  const [lastMonthsCount,   setLastMonthsCount]   = useState(6);
  const [customStartDate,   setCustomStartDate]   = useState('');
  const [customEndDate,     setCustomEndDate]     = useState('');
  const [filters,           setFilters]           = useState({
    dateFilter:        'all',
    serviceTypes:      [],
    serviceHoursRange: { min: '', max: '' },
    hasRemarks:        '',
    lastMonthsCount:   6,
    customStartDate:   '',
    customEndDate:     '',
  });

  // ── Processed output ───────────────────────────────────────────────────────
  const [filteredData, setFilteredData] = useState([]);
  const [groupedData,  setGroupedData]  = useState({});

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [deleteReport,     setDeleteReport]     = useState({});
  const [expandedRemarks,  setExpandedRemarks]  = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // Derived filter state
  // ─────────────────────────────────────────────────────────────────────────

  const filterState = useMemo(() => ({
    dateFilter, lastMonthsCount, customStartDate, customEndDate,
  }), [dateFilter, lastMonthsCount, customStartDate, customEndDate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Header Context Sync
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isMultipleEquipment && multipleEquipmentData.length > 0) {
      setHeaderSubtitle(`Equipments (${multipleEquipmentData.length}) > ${dateFilter.toUpperCase()} TIME > ${activeTab.toUpperCase()} SERVICE`);
    } else if (equipmentData) {
      setHeaderSubtitle(`${equipmentData.machine} - ${regNoArray[0]} > ${dateFilter.toUpperCase()} TIME > ${activeTab.toUpperCase()} SERVICE`);
    } else {
      setHeaderSubtitle(null);
    }
    setHeaderTitle('Service History');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [equipmentData, multipleEquipmentData, regNoArray, activeTab, dateFilter, isMultipleEquipment, setHeaderTitle, setHeaderSubtitle]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetching — unified history (one call per regNo)
  // GET /service-history/get/:regNo  → returns all types for that equipment
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!regNos || regNoArray.length === 0) {
      setLoading(false);
      setError('No equipment registration numbers provided');
      return;
    }

    setLoading(true);

    const fetchAllHistories = async () => {
      try {
        // One request per regNo — backend returns all serviceTypes
        const responses = await Promise.all(
          regNoArray.map(regNo =>
            apiRequest(`${API_URI}/service-history/get/${regNo}`)
          )
        );
        const allData = await Promise.all(responses.map(r => r.json()));

        const combined = [];
        allData.forEach(res => {
          if (res.data) combined.push(...res.data);
        });

        setAllHistory(combined);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching service histories:', err);
        setError('Failed to fetch service records. Please try again.');
        setLoading(false);
      }
    };

    const fetchEquipmentDetails = async () => {
      try {
        if (isMultipleEquipment) {
          const responses = await Promise.all(
            regNoArray.map(rn => apiRequest(`${API_URI}/equipments/get-equipment/${rn}`, 'GET'))
          );
          const parsed = await Promise.all(responses.map(r => r.json()));
          const equipments = parsed
            .map(r => (Array.isArray(r.data) ? r.data[0] : r.data))
            .filter(Boolean);
          setMultipleEquipmentData(equipments);
          setEquipmentData(equipments[0] || null);
        } else {
          const response = await apiRequest(`${API_URI}/equipments/get-equipment/${regNoArray[0]}`, 'GET');
          const data     = await response.json();
          const eq       = Array.isArray(data.data) ? data.data[0] : data.data;
          if (eq) setEquipmentData(eq);
        }
      } catch (err) {
        console.error('Could not load equipment data:', err);
      }
    };

    fetchAllHistories();
    fetchEquipmentDetails();
  }, [regNoArray, regNos, isMultipleEquipment]);

  // ─────────────────────────────────────────────────────────────────────────
  // Enrichment — fetches remarks + location from report for oil/normal/major
  // Secondary calls after the bulk history fetch.
  // Note: unified model already stores remarks/location on history —
  // these calls are kept for backward compat with older records.
  // ─────────────────────────────────────────────────────────────────────────

  const fetchRemarksAndLocation = useCallback(async (items) => {
    const REPORT_TYPES = new Set(['oil', 'normal', 'tyre', 'battery']);

    return Promise.all(items.map(async (item) => {
      if (!REPORT_TYPES.has(item.serviceType) || !item.date) return item;
      try {
        // Prefer historyId-based lookup (new method)
        const endpoint = item.reportId
          ? `${API_URI}/service-report/get-report/with-id/${item.reportId}`
          : `${API_URI}/service-report/${item.regNo}/${formatDate(item.date)}`;

        const res  = await apiRequest(endpoint);
        if (!res.ok) return item;
        const data = await res.json();
        const row  = item.reportId ? data.data : data?.data?.[0];
        if (!row) return item;

        const updated = { ...item, remarks: row.remarks || item.remarks };
        if ((item.serviceType === 'oil' || item.serviceType === 'normal') && row.location) {
          updated.location = row.location;
        }
        return updated;
      } catch { return item; }
    }));
  }, []);

  const fetchMajorRemarks = useCallback(async (items) => {
    return Promise.all(items.map(async (item) => {
      // 'major' replaces old 'maintenance'
      if (item.serviceType !== 'major' || !item.date) return item;
      try {
        const endpoint = item.reportId
          ? `${API_URI}/service-report/get-report/with-id/${item.reportId}`
          : `${API_URI}/service-report/${item.regNo}/${formatDate(item.date)}`;

        const res  = await apiRequest(endpoint);
        if (!res.ok) return item;
        const data = await res.json();
        const row  = item.reportId ? data.data : data?.data?.[0];
        if (!row) return item;

        return {
          ...item,
          remarks:        row.remarks        || item.remarks,
          serviceHrs:     row.serviceHrs     || item.serviceHrs,
          nextServiceHrs: row.nextServiceHrs || item.nextServiceHrs,
          location:       row.location       || item.location,
          majorRemarks:   row.remarks        || item.majorRemarks,
        };
      } catch { return item; }
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Processing Effect
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const processData = async () => {
      // 1. Normalise regNo — unified model always uses regNo
      const combined = allHistory.map(item => ({
        ...item,
        regNo: String(item.regNo || '').trim(),
      }));

      // 2. Keep only records belonging to requested reg nos
      const inScope = combined.filter(item => regNoArray.includes(item.regNo));

      // 3. Date range filter
      let result = inScope.filter(item => isDateInRange(item.date, filterState));

      // 4. Service type filter
      // 'major' is the canonical name — 'maintenance' is no longer valid
      if (filters.serviceTypes.length > 0) {
        result = result.filter(item => filters.serviceTypes.includes(item.serviceType));
      }

      // 5. Service hours range filter
      if (filters.serviceHoursRange.min || filters.serviceHoursRange.max) {
        result = result.filter(item => {
          const hrs = parseInt(item.serviceHrs || 0, 10);
          const min = filters.serviceHoursRange.min ? parseInt(filters.serviceHoursRange.min) : 0;
          const max = filters.serviceHoursRange.max ? parseInt(filters.serviceHoursRange.max) : Infinity;
          return hrs >= min && hrs <= max;
        });
      }

      // 6. Has-remarks filter
      if (filters.hasRemarks === 'yes') {
        result = result.filter(item => item.remarks || item.majorRemarks);
      } else if (filters.hasRemarks === 'no') {
        result = result.filter(item => !item.remarks && !item.majorRemarks);
      }

      // 7. Enrich with secondary report data — fire both in parallel
      const [enrichedRegular, enrichedMajor] = await Promise.all([
        fetchRemarksAndLocation(result),
        fetchMajorRemarks(result),
      ]);

      // 8. Merge: major items from enrichedMajor, others from enrichedRegular
      const merged = result.map(item => {
        if (item.serviceType === 'major') {
          return enrichedMajor.find(d => d._id === item._id) || item;
        }
        return enrichedRegular.find(d => d._id === item._id) || item;
      });

      // 9. Sort newest first
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 10. Global search
      const searched = merged.filter(item => {
        if (!searchTerm) return true;
        return Object.values(item).some(v =>
          String(v).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      setFilteredData(searched);
    };

    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHistory, regNoArray, searchTerm, dateFilter, lastMonthsCount, customStartDate, customEndDate, filters]);

  // ─────────────────────────────────────────────────────────────────────────
  // Grouping Effect
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isMultipleEquipment) {
      const grouped = {};
      filteredData.forEach(item => {
        if (!grouped[item.regNo]) grouped[item.regNo] = [];
        grouped[item.regNo].push(item);
      });
      setGroupedData(grouped);
    } else {
      setGroupedData({ [regNoArray[0]]: filteredData });
    }
  }, [filteredData, isMultipleEquipment, regNoArray]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filter Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleApplyFilters = () => {
    setDateFilter(filters.dateFilter);
    setLastMonthsCount(filters.lastMonthsCount);
    setCustomStartDate(filters.customStartDate);
    setCustomEndDate(filters.customEndDate);
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    const empty = {
      dateFilter: 'all', serviceTypes: [],
      serviceHoursRange: { min: '', max: '' },
      hasRemarks: '', lastMonthsCount: 6,
      customStartDate: '', customEndDate: '',
    };
    setFilters(empty);
    setDateFilter('all');
    setLastMonthsCount(6);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Delete — now targets unified history endpoint
  // DELETE /service-history/delete/:type/:id  (deletes history + linked report)
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteReport = (item) => { setDeleteReport(item); setShowDeleteModal(true); };

  const confirmDeleteReport = async () => {
    // Use the item's serviceType directly — all types live in one collection
    const type = deleteReport.serviceType || 'oil';
    const url  = `${API_URI}/service-history/delete/${type}/${deleteReport._id}`;
    const res  = await apiRequest(url, 'DELETE');
    const data = await res.json();
    if (data.ok) window.location.reload();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Remarks Expansion
  // ─────────────────────────────────────────────────────────────────────────

  const toggleRemarkExpansion = (key) => {
    setExpandedRemarks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Exposed API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    filteredData,
    groupedData,
    equipmentData,
    multipleEquipmentData,
    loading,
    error,

    filterState,
    filters, setFilters,
    dateFilter,
    searchTerm,
    activeTab,

    handleApplyFilters,
    handleResetFilters,
    handleFilterChange,
    showFiltersModal, setShowFiltersModal,

    showDeleteModal, setShowDeleteModal,
    deleteReport,
    handleDeleteReport,
    confirmDeleteReport,

    expandedRemarks,
    toggleRemarkExpansion,
  };
};