import { useState, useRef } from 'react';

import { apiRequest } from '@/features/core/network/api/api.request';

import { SERVICE_TYPES, EQUIPMENT_SEARCH_DEBOUNCE_MS } from '../constants/maintenance.record.form.constant';
import { calcNextServiceValue, checklistDefaultsForType } from '../helper/maintenance.record.form.helper';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

export function useMaintenanceRecordCard(card, onChange) {
  const [eqResults, setEqResults] = useState([]);
  const [eqSearching, setEqSearching] = useState(false);
  const eqDebounceRef = useRef(null);

  const set = (field, val) => onChange(card.id, field, val);

  const searchEquipments = (term) => {
    if (!term?.trim()) { setEqResults([]); return; }

    clearTimeout(eqDebounceRef.current);
    eqDebounceRef.current = setTimeout(async () => {
      setEqSearching(true);
      try {
        const url = buildSearchUrl({
          source: SEARCH_SOURCES.EQUIPMENT,
          q: term.trim(),
          page: 1,
          limit: 20,
        });
        const res = await apiRequest(url, 'GET');
        const responseJson = await res.json();
        const result = extractSearchResult(responseJson, SEARCH_SOURCES.EQUIPMENT);
        setEqResults(result.results || []);
      } catch {
        setEqResults([]);
      } finally {
        setEqSearching(false);
      }
    }, EQUIPMENT_SEARCH_DEBOUNCE_MS);
  };

  const handleHrsBlur = () => {
    const isOil = card.serviceType === 'oil' || card.serviceType === 'normal';
    if (isOil && card.serviceHrs && !card.nextServiceHrs) {
      set('nextServiceHrs', calcNextServiceValue(card.serviceHrs));
    }
  };

  const handleEquipmentSelect = (val) => {
    const found = eqResults.find((eq) => String(eq.regNo) === String(val));

    if (found) {
      const lastCert = found.certificationBody?.[found.certificationBody.length - 1];
      const operator = lastCert?.operatorName || '';
      onChange(card.id, '__bulk', { regNo: String(found.regNo), machine: found.machine || '', operator });
    } else {
      set('regNo', val);
      searchEquipments(val);
    }
  };

  const handleClStatus = (id, status) =>
    set('checklistItems', card.checklistItems.map((item) => (item.id === id ? { ...item, status } : item)));

  const handleClRange = (start, end, status) =>
    set('checklistItems', card.checklistItems.map((item) =>
      item.id >= start && item.id <= end ? { ...item, status } : item
    ));

  const handleTypeChange = (val) => {
    set('serviceType', val);
    set('checklistItems', checklistDefaultsForType(val));
  };

  const markedCount = card.checklistItems.filter((item) => item.status).length;
  const typeLabel = SERVICE_TYPES.find((type) => type.value === card.serviceType)?.label || '';

  return {
    eqResults,
    eqSearching,
    set,
    searchEquipments,
    handleHrsBlur,
    handleEquipmentSelect,
    handleClStatus,
    handleClRange,
    handleTypeChange,
    markedCount,
    typeLabel,
  };
}