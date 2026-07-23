// ─────────────────────────────────────────────────────────────────────────────
// useEquipmentSearch.js — Debounced search hook for the Equipments page.
// Watches the global searchTerm and fires a server search after 500ms of quiet.
// On empty search, delegates back to fetchEquipments to restore the full list.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from 'react';
import { apiRequest }             from '../../../utils/api';
import { API_URI }              from '../../../constants';
import { useSearch }              from '../../../Context/SearchContext';

const SEARCH_DEBOUNCE_MS = 500;

/**
 * @param {{
 *   activeTab:            string,
 *   fetchEquipments:      Function,
 *   setFilteredData:      Function,
 *   setShowNoResultsModal:Function,
 *   hydrateWithImages:    Function,
 * }} params
 */
export const useEquipmentSearch = ({
  activeTab,
  fetchEquipments,
  setFilteredData,
  setShowNoResultsModal,
  hydrateWithImages,
  setIsSearchActive,
}) => {
  const { searchTerm } = useSearch();

  // ─────────────────────────────────────────────────────────────────────────
  // Search Logic
  // ─────────────────────────────────────────────────────────────────────────

  const searchEquipments = useCallback(async () => {
    if (!searchTerm?.trim()) {
      // Empty search — restore the paginated list from the server
      setIsSearchActive(false); 
      fetchEquipments(1, false);
      setShowNoResultsModal(false);
      return;
    }

    // Activate the guard
    setIsSearchActive(true);

    try {
      // Map the active tab to the server's hired filter value
      const hiredMap    = { hired: 'hired', 'equipment-based': 'own' };
      const hiredFilter = hiredMap[activeTab] ?? null;

      const response = await apiRequest(
        `${API_URI}/equipments/search-equipments`,
        'POST',
        {
          searchTerm: searchTerm.trim(),
          page:       1,
          limit:      100,
          // Site-based tab searches by site field only; others search all fields
          searchField: 'all',
          hired:       hiredFilter,
        }
      );

      const data = await response.json();
      if (!data.ok) return;

      const resultsWithImages = await hydrateWithImages(data.data);
      setFilteredData(resultsWithImages);
      setShowNoResultsModal(resultsWithImages.length === 0);
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [searchTerm, activeTab, fetchEquipments, setFilteredData, setShowNoResultsModal, hydrateWithImages, setIsSearchActive]);

  // ─────────────────────────────────────────────────────────────────────────
  // Debounced Effect
  // Waits for the user to stop typing before firing the search.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(searchEquipments, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchEquipments]);

  return { searchTerm };
};