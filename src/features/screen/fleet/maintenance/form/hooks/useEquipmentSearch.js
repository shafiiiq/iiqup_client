import { useState, useRef, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';
import { EQUIPMENT_SEARCH_DEBOUNCE_MS } from '../constants/maintenance.form.constant';

export function useEquipmentSearch() {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  const searchEquipments = useCallback((term) => {
    clearTimeout(debounceTimerRef.current);
    if (!term?.trim()) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = buildSearchUrl({ source: SEARCH_SOURCES.EQUIPMENT, q: term.trim(), page: 1, limit: 20 });
        const response = await apiRequest(url, 'GET');
        const responseJson = await response.json();
        setResults(extractSearchResult(responseJson, SEARCH_SOURCES.EQUIPMENT).results || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, EQUIPMENT_SEARCH_DEBOUNCE_MS);
  }, []);

  return { results, isSearching, searchEquipments };
}