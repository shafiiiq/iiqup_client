// ─────────────────────────────────────────────────────────────────────────────
// useEquipmentData.js — Core data hook for the Equipments page.
// Owns: fetching, pagination, infinite scroll, image hydration,
//       completed-works alert, operator list, and image slideshow timers.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { apiRequest }                        from '../../../utils/api';
import { END_POINT }                         from '../../../constants';
import { groupEquipmentBySite }              from '../utils/equipmentHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE    = 20;
const SITES_PER_LOAD    = 5;
const SCROLL_DEBOUNCE   = 200;   // ms — debounce all scroll handlers
const SLIDESHOW_INTERVAL = 3000; // ms — auto-advance multi-image cards

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ getMediaUrlWithCache: Function }} imageCache
 *   — injected from useImageCache so this hook doesn't own caching logic
 */
export const useEquipmentData = ({ getMediaUrlWithCache, searchTerm = '' }) => {

  // ── Tab & Pagination ───────────────────────────────────────────────────────
  const [activeTab,           setActiveTab]           = useState('equipment-based');
  const [currentPage,         setCurrentPage]         = useState(1);
  const [hasMore,             setHasMore]             = useState(true);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [filteredData,        setFilteredData]        = useState([]);
  const [operator,            setOperator]            = useState([]);   // operator dropdown list
  const [sites,               setSites]               = useState([]);
  const [completedWorks,      setCompletedWorks]      = useState([]);
  const [showCompletedWorkAlert, setShowCompletedWorkAlert] = useState(false);

  // ── Loading / Progress ─────────────────────────────────────────────────────
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(true);
  const [isLoadingMore,       setIsLoadingMore]       = useState(false);
  const [equipmentProgress,   setEquipmentProgress]   = useState(0);

  // ── Search Guard ───────────────────────────────────────────────────────────
  const [isSearchActive,      setIsSearchActive]      = useState(false);

  // ── Virtual Scroll (equipment-based / hired tabs) ──────────────────────────
  const [displayedEquipment,  setDisplayedEquipment]  = useState([]);
  const [scrollPosition,      setScrollPosition]      = useState(0);

  // ── Virtual Scroll (site-based tab) ───────────────────────────────────────
  const [siteGroupedEquipment, setSiteGroupedEquipment] = useState({});
  const [displayedSites,       setDisplayedSites]       = useState([]);
  const [siteScrollPosition,   setSiteScrollPosition]   = useState(0);

  // ── Card Visibility (IntersectionObserver) ─────────────────────────────────
  const [visibleCards,        setVisibleCards]        = useState(new Set());

  // ── Image Slideshow ────────────────────────────────────────────────────────
  const [activeImageIndex,    setActiveImageIndex]    = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // Image Hydration Helper
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Given a raw equipment list, bulk-fetches image metadata from the server,
   * then resolves each image path to a usable S3 URL via the cache.
   *
   * @param {Array} equipmentList
   * @returns {Promise<Array>} — equipment objects with `equipmentImage` populated
   */
  const hydrateWithImages = useCallback(async (equipmentList) => {
    if (!equipmentList.length) return [];

    const regNos = equipmentList.map(eq => eq.regNo);

    const imageResponse = await apiRequest(
      `${END_POINT}/equipments/bulk-equipment-images`,
      'POST',
      { regNos }
    );
    const imageData = await imageResponse.json();

    return Promise.all(
      equipmentList.map(async (equipment) => {
        const images = imageData.data[equipment.regNo];

        if (!images?.success || images.images.length === 0) {
          return { ...equipment, equipmentImage: [] };
        }

        const imagesWithUrls = await Promise.all(
          images.images.map(async (img) => {
            const s3Url = await getMediaUrlWithCache(img.path);
            return { ...img, s3Url: s3Url || `${END_POINT}/${img.path}` };
          })
        );

        return { ...equipment, equipmentImage: imagesWithUrls };
      })
    );
  }, [getMediaUrlWithCache]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: Equipment List (paginated)
  // ─────────────────────────────────────────────────────────────────────────

  const fetchEquipments = useCallback(async (page = 1, append = false) => {
    page === 1 ? setIsLoadingEquipments(true) : setIsLoadingMore(true);

    // Simulate progress ticking up to 90% while the request is in-flight
    const progressInterval = setInterval(() => {
      setEquipmentProgress(prev => prev >= 90 ? prev : prev + Math.random() * 15);
    }, 150);

    try {
      // Map activeTab to the API's hired query param
      const hiredMap = { hired: 'hired', 'equipment-based': 'own' };
      const hiredParam = hiredMap[activeTab] ? `&hired=${hiredMap[activeTab]}` : '';
      const statusParam = activeTab === 'leased' ? '&status=leased' : '';

      const response = await apiRequest(
        `${END_POINT}/equipments/get-equipments?page=${page}&limit=${ITEMS_PER_PAGE}${hiredParam}${statusParam}`,
        'GET'
      );
      const data = await response.json();

      if (!data.ok) throw new Error(data.message || 'Failed to fetch equipments');

      setCurrentPage(data.pagination.currentPage);
      setHasMore(data.pagination.hasMore);

      const hydrated = await hydrateWithImages(data.data);

      setEquipmentProgress(100);
      append
        ? setFilteredData(prev => [...prev, ...hydrated])
        : setFilteredData(hydrated);

      // Brief pause so the progress bar reaches 100% visually before hiding
      setTimeout(() => {
        setIsLoadingEquipments(false);
        setIsLoadingMore(false);
        setEquipmentProgress(0);
      }, 500);
    } catch (err) {
      console.error('Error fetching equipment records:', err);
      setIsLoadingEquipments(false);
      setIsLoadingMore(false);
      setEquipmentProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  }, [activeTab, hydrateWithImages]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: Completed Works Alert
  // ─────────────────────────────────────────────────────────────────────────

  const fetchCompletedWorks = useCallback(async () => {
    try {
      const response = await apiRequest(`${END_POINT}/complaints/get-all-complaints`, 'GET');
      const data     = await response.json();
      const list     = Array.isArray(data.data) ? data.data : data.data?.complaints || data.complaints || [];
      const completed = list.filter(item => item.workflowStatus === 'completed');
      setCompletedWorks(completed);
      setShowCompletedWorkAlert(completed.length > 0);
    } catch (err) {
      console.error('Error fetching completed works:', err);
      setCompletedWorks([]);
      setShowCompletedWorkAlert(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: Operator Dropdown
  // ─────────────────────────────────────────────────────────────────────────

  const fetchOperators = useCallback(async () => {
    try {
      const response = await apiRequest(`${END_POINT}/operators/get-all-operators`, 'GET');
      if (!response.ok) throw new Error('Failed to fetch operators');
      const data = await response.json();
      setOperator(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Error fetching operators:', err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch: Site Dropdown (on-demand, triggered by form field focus)
  // ─────────────────────────────────────────────────────────────────────────

  const fetchSitesForDropdown = useCallback(async () => {
    try {
      const response = await apiRequest(`${END_POINT}/equipments/get-sites`, 'GET');
      const data     = await response.json();
      setSites(data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Initial Load
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchEquipments();
    fetchCompletedWorks();
    fetchOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Tab Change
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
    setScrollPosition(0);
    setSiteScrollPosition(0);
    setDisplayedEquipment([]);
    fetchEquipments(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Grouping (site-based tab)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setSiteGroupedEquipment(groupEquipmentBySite(filteredData));
  }, [filteredData]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Virtual Scroll: equipment-based / hired
  // Slices filteredData based on how far the user has scrolled.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!filteredData.length) { setDisplayedEquipment([]); return; }
    const count = Math.min(filteredData.length, ITEMS_PER_PAGE + scrollPosition);
    setDisplayedEquipment(filteredData.slice(0, count));
  }, [filteredData, scrollPosition]);

  useEffect(() => {
    const handler = () => {
      let t = null;
      return () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 500) {
            setScrollPosition(prev => prev + 10);
          }
        }, SCROLL_DEBOUNCE);
      };
    };
    const fn = handler();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Virtual Scroll: site-based
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'site-based') return;
    const all = Object.entries(siteGroupedEquipment).map(([site, equipments]) => {
      if (!searchTerm?.trim()) return [site, equipments];
      const term = searchTerm.toLowerCase();
      const filtered = equipments.filter(eq =>
        eq.machine?.toLowerCase().includes(term) ||
        eq.regNo?.toLowerCase().includes(term) ||
        eq.brand?.toLowerCase().includes(term) ||
        site?.toLowerCase().includes(term)
      );
      return [site, filtered];
    }).filter(([, equipments]) => equipments.length > 0);
    const count = Math.min(all.length, SITES_PER_LOAD + siteScrollPosition);
    setDisplayedSites(all.slice(0, count));
  }, [siteGroupedEquipment, siteScrollPosition, activeTab, searchTerm]);

  useEffect(() => {
    if (activeTab !== 'site-based') return;
    let t = null;
    const handleSiteScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 800) {
          setSiteScrollPosition(prev => prev + 3);
        }
      }, SCROLL_DEBOUNCE);
    };
    window.addEventListener('scroll', handleSiteScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleSiteScroll); clearTimeout(t); };
  }, [activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Infinite Scroll (server-side pagination)
  // Triggers fetchEquipments for the next page when near the bottom.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoadingEquipments || isSearchActive) return;

    let t = null;
    const handleInfiniteScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (window.scrollY + window.innerHeight > document.documentElement.scrollHeight * 0.8) {
          fetchEquipments(currentPage + 1, true);
        }
      }, SCROLL_DEBOUNCE);
    };

    window.addEventListener('scroll', handleInfiniteScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleInfiniteScroll); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasMore, isLoadingMore, isLoadingEquipments, currentPage, isSearchActive]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — IntersectionObserver (lazy-load images per card)
  // Adds regNo to visibleCards when a card enters the viewport.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => new Set([...prev, entry.target.dataset.regNo]));
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    const cards = [
      ...document.querySelectorAll('.equipment-card'),
      ...document.querySelectorAll('.site-equipment-item'),
    ];
    cards.forEach(c => observer.observe(c));
    return () => cards.forEach(c => observer.unobserve(c));
  }, [displayedEquipment, siteGroupedEquipment, activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects — Slideshow Auto-Advance
  // Rotates activeImageIndex every 3s for cards with multiple images.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const intervals = {};

    filteredData.forEach(item => {
      if (item.equipmentImage?.length > 1) {
        intervals[item.regNo] = setInterval(() => {
          setActiveImageIndex(prev => ({
            ...prev,
            [item.regNo]: ((prev[item.regNo] || 0) + 1) % item.equipmentImage.length
          }));
        }, SLIDESHOW_INTERVAL);
      }
    });

    return () => Object.values(intervals).forEach(clearInterval);
  }, [filteredData]);

  // ─────────────────────────────────────────────────────────────────────────
  // Exposed API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Tab
    activeTab, setActiveTab,

    // Data
    filteredData,    setFilteredData,
    operator,
    sites,
    completedWorks,
    showCompletedWorkAlert, setShowCompletedWorkAlert,

    // Loading
    isLoadingEquipments,
    isLoadingMore,
    equipmentProgress,

    
    // Display slices
    displayedEquipment,
    displayedSites,
    siteGroupedEquipment,
    
    // Card state
    visibleCards,
    activeImageIndex, setActiveImageIndex,
    
    // Actions
    fetchEquipments,
    fetchSitesForDropdown,
    hydrateWithImages,
    isSearchActive, setIsSearchActive,
  };
};