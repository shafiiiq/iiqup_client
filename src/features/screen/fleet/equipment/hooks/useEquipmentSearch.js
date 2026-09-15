import { useEffect, useCallback } from 'react';
import { useSearch } from '@/shared/context/SearchContext';
import { useSearch as useGlobalSearch } from '@/shared/search/useSearch';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';
import { EQUIPMENT_SEARCH_HIRED_FILTER_BY_TAB } from '../constants/equipment.constant';

export const useEquipmentSearch = ({
  activeTab,
  fetchEquipments,
  setFilteredData,
  setShowNoResultsModal,
  hydrateWithImages,
  setIsSearchActive,
}) => {
  const { searchTerm } = useSearch();

  const globalSearch = useGlobalSearch({ source: SEARCH_SOURCES.EQUIPMENT });

  const runSearch = useCallback(async () => {
    if (!searchTerm?.trim()) {
      setIsSearchActive(false);
      fetchEquipments(1, false);
      setShowNoResultsModal(false);
      globalSearch.clear();
      return;
    }

    setIsSearchActive(true);
    globalSearch.search(searchTerm.trim());
  }, [searchTerm, fetchEquipments, setShowNoResultsModal, setIsSearchActive, globalSearch]);

  useEffect(() => {
    const timer = setTimeout(runSearch, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    const applyResults = async () => {
      if (!searchTerm?.trim()) return;

      const hiredFilter = EQUIPMENT_SEARCH_HIRED_FILTER_BY_TAB[activeTab];
      const filtered = hiredFilter
        ? globalSearch.results.filter((eq) =>
            hiredFilter === 'hired' ? !!eq.hired : !eq.hired
          )
        : globalSearch.results;

      const resultsWithImages = await hydrateWithImages(filtered);
      setFilteredData(resultsWithImages);
      setShowNoResultsModal(resultsWithImages.length === 0);
    };

    applyResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch.results, activeTab]);

  return { searchTerm, loading: globalSearch.loading, error: globalSearch.error };
};