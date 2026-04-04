// ─────────────────────────────────────────────────────────────────────────────
// useServiceData.js — Data fetching + processing hook for ServiceHistory.
// Owns: fetching 4 history types in parallel, enriching records with remarks
// and location from a secondary endpoint, applying all active filters,
// grouping by equipment, and syncing the global header context.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHeaderTitle } from '../../../Context/HeaderTitleContext';
import { useSearch }      from '../../../Context/SearchContext';
import { apiRequest }     from '../../../utils/api';
import { END_POINT }      from '../../../constants';
import { formatDate, isDateInRange } from '../utils/serviceHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   regNoArray:          string[],
 *   regNos:              string,
 *   isMultipleEquipment: boolean,
 * }}
 */
export const useServiceData = ({ regNoArray, regNos, isMultipleEquipment }) => {

  // ── Global contexts ────────────────────────────────────────────────────────
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { searchTerm }                        = useSearch();

  // ── Raw API data ───────────────────────────────────────────────────────────
  const [serviceHistory,     setServiceHistory]     = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [tyreHistory,        setTyreHistory]        = useState([]);
  const [batteryHistory,     setBatteryHistory]     = useState([]);
  const [equipmentData,      setEquipmentData]      = useState(null);
  const [multipleEquipmentData, setMultipleEquipmentData] = useState([]);

  // ── Loading / Error ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [activeTab,       ] = useState('all'); // tab is read-only from the shell
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

  // ── Modal: filters form ────────────────────────────────────────────────────
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // ── Modal: delete report ───────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReport,    setDeleteReport]    = useState({});

  // ── Remarks expansion in table ────────────────────────────────────────────
  const [expandedRemarks, setExpandedRemarks] = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: filter state object (passed to pure helper functions)
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
  // Fetching — history records (all 4 types in parallel)
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
        // Fire one request per history type per regNo — N×4 requests in parallel
        const responses = await Promise.all(
          regNoArray.flatMap(regNo => [
            apiRequest(`${END_POINT}/service-history/get-service-history/${regNo}`),
            apiRequest(`${END_POINT}/service-history/get-maintenance-history/${regNo}`),
            apiRequest(`${END_POINT}/service-history/get-tyre-history/${regNo}`),
            apiRequest(`${END_POINT}/service-history/get-battery-history/${regNo}`),
          ])
        );
        const allData = await Promise.all(responses.map(r => r.json()));

        const combined = { service: [], maintenance: [], tyre: [], battery: [] };

        regNoArray.forEach((_, idx) => {
          const offset = idx * 4;
          combined.service.push(    ...(allData[offset    ].data || []));
          combined.maintenance.push(...(allData[offset + 1].data || []));
          combined.tyre.push(       ...(allData[offset + 2].data || []));
          combined.battery.push(    ...(allData[offset + 3].data || []));
        });

        setServiceHistory(combined.service);
        setMaintenanceHistory(combined.maintenance);
        setTyreHistory(combined.tyre);
        setBatteryHistory(combined.battery);
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
            regNoArray.map(rn => apiRequest(`${END_POINT}/equipments/get-equipment/${rn}`, 'GET'))
          );
          const parsed = await Promise.all(responses.map(r => r.json()));
          const equipments = parsed
            .map(r => (Array.isArray(r.data) ? r.data[0] : r.data))
            .filter(Boolean);
          setMultipleEquipmentData(equipments);
          setEquipmentData(equipments[0] || null);
        } else {
          const response = await apiRequest(`${END_POINT}/equipments/get-equipment/${regNoArray[0]}`, 'GET');
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
  // Enrichment — fetches remarks + location for individual records
  // These are secondary calls per item after the bulk fetch completes.
  // ─────────────────────────────────────────────────────────────────────────

  const fetchRemarksAndLocation = useCallback(async (items) => {
    const OIL_TYPES = new Set(['oil', 'normal', 'tyre', 'battery']);

    return Promise.all(items.map(async (item) => {
      if (!OIL_TYPES.has(item.serviceType) || !item.date) return item;
      try {
        const res  = await apiRequest(`${END_POINT}/service-report/${item.regNo}/${formatDate(item.date)}`);
        if (!res.ok) return item;
        const data = await res.json();
        const row  = data?.data?.[0];
        if (!row) return item;

        const updated = { ...item, remarks: row.remarks || item.remarks };
        if ((item.serviceType === 'oil' || item.serviceType === 'normal') && row.location) {
          updated.location = row.location;
        }
        return updated;
      } catch { return item; }
    }));
  }, []);

  const fetchMaintenanceRemarks = useCallback(async (items) => {
    return Promise.all(items.map(async (item) => {
      if (item.serviceType !== 'maintenance' || !item.date) return item;
      try {
        const res  = await apiRequest(`${END_POINT}/service-report/${item.regNo}/${formatDate(item.date)}`);
        if (!res.ok) return item;
        const data = await res.json();
        const row  = data?.data?.[0];
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
  // Runs whenever the source data, filter state, or search term changes.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const processData = async () => {
      // 1. Merge all history types into one array with normalised serviceType + regNo
      const combined = [
        ...serviceHistory.map(i    => ({ ...i, serviceType: i.serviceType || 'oil',  regNo: i.regNo || i.equipmentId })),
        ...maintenanceHistory.map(i => ({ ...i, serviceType: 'maintenance',           regNo: i.regNo || i.equipmentId })),
        ...tyreHistory.map(i        => ({ ...i, serviceType: 'tyre',                  regNo: i.equipmentNo || i.equipmentId })),
        ...batteryHistory.map(i     => ({ ...i, serviceType: 'battery',               regNo: i.equipmentNo || i.equipmentId })),
      ];

      // 2. Keep only records belonging to the requested reg nos
      const inScope = combined.filter(item => regNoArray.includes(item.regNo?.toString().trim()));

      // 3. Date range filter
      let result = inScope.filter(item => isDateInRange(item.date, filterState));

      // 4. Service type filter
      if (filters.serviceTypes.length > 0) {
        result = result.filter(item => filters.serviceTypes.includes(item.serviceType));
      }

      // 5. Service hours range filter
      if (filters.serviceHoursRange.min || filters.serviceHoursRange.max) {
        result = result.filter(item => {
          const hrs = item.serviceHrs || item.runningHours || 0;
          const min = filters.serviceHoursRange.min ? parseInt(filters.serviceHoursRange.min) : 0;
          const max = filters.serviceHoursRange.max ? parseInt(filters.serviceHoursRange.max) : Infinity;
          return hrs >= min && hrs <= max;
        });
      }

      // 6. Has-remarks filter
      if (filters.hasRemarks === 'yes') {
        result = result.filter(item => item.remarks || item.majorRemarks || item.workRemarks);
      } else if (filters.hasRemarks === 'no') {
        result = result.filter(item => !item.remarks && !item.majorRemarks && !item.workRemarks);
      }

      // 7. Enrich with secondary API data (remarks + location) — fire both in parallel
      const [enrichedRegular, enrichedMaintenance] = await Promise.all([
        fetchRemarksAndLocation(result),
        fetchMaintenanceRemarks(result),
      ]);

      // 8. Merge the two enriched arrays: maintenance items come from enrichedMaintenance,
      //    all others come from enrichedRegular
      const merged = result.map(item => {
        if (item.serviceType === 'maintenance') {
          return enrichedMaintenance.find(d => d._id === item._id) || item;
        }
        return enrichedRegular.find(d => d._id === item._id) || item;
      });

      // 9. Sort newest first
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 10. Global search term filter
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
  }, [serviceHistory, maintenanceHistory, tyreHistory, batteryHistory, regNoArray, searchTerm, dateFilter, lastMonthsCount, customStartDate, customEndDate, filters]);

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
    const empty = { dateFilter: 'all', serviceTypes: [], serviceHoursRange: { min: '', max: '' }, hasRemarks: '', lastMonthsCount: 6, customStartDate: '', customEndDate: '' };
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
  // Delete Report
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteReport = (item) => { setDeleteReport(item); setShowDeleteModal(true); };

  const confirmDeleteReport = async () => {
    const urlMap = {
      oil:         `${END_POINT}/service-history/delete-service-history/oil/${deleteReport._id}`,
      normal:      `${END_POINT}/service-history/delete-service-history/oil/${deleteReport._id}`,
      tyre:        `${END_POINT}/service-history/delete-service-history/tyre/${deleteReport._id}`,
      battery:     `${END_POINT}/service-history/delete-service-history/battery/${deleteReport._id}`,
      maintenance: `${END_POINT}/service-history/delete-service-history/maintenance/${deleteReport._id}`,
    };
    const url = urlMap[deleteReport.serviceType] || urlMap.maintenance;
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
    // Data
    filteredData,
    groupedData,
    equipmentData,
    multipleEquipmentData,
    loading,
    error,

    // Filter state (for display + export)
    filterState,
    filters, setFilters,
    dateFilter,
    searchTerm,
    activeTab,

    // Filter handlers
    handleApplyFilters,
    handleResetFilters,
    handleFilterChange,
    showFiltersModal, setShowFiltersModal,

    // Delete
    showDeleteModal, setShowDeleteModal,
    deleteReport,
    handleDeleteReport,
    confirmDeleteReport,

    // Remarks
    expandedRemarks,
    toggleRemarkExpansion,
  };
};