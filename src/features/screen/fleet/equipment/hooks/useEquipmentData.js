import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import { appendPaginationToUrl, normalizePagination } from '@/shared/pagination/pagination.util';
import { groupEquipmentBySite } from '../helper/equipment.helper';
import {
  EQUIPMENT_LIST_PAGE_SIZE,
  EQUIPMENT_SITES_PAGE_SIZE,
  EQUIPMENT_SCROLL_DEBOUNCE_MS,
  EQUIPMENT_IMAGE_SLIDESHOW_INTERVAL_MS,
  EQUIPMENT_LOAD_PROGRESS_TICK_MS,
  EQUIPMENT_LOAD_PROGRESS_HOLD_MS,
  EQUIPMENT_LIST_SCROLL_BOTTOM_OFFSET_PX,
  EQUIPMENT_SITE_SCROLL_BOTTOM_OFFSET_PX,
  EQUIPMENT_SITE_SCROLL_STEP,
  EQUIPMENT_TABS,
  EQUIPMENT_STATUS_FILTERS,
  EQUIPMENT_ALL_SITES_FILTER,
  EQUIPMENT_HIRED_QUERY_PARAM_BY_TAB,
  EQUIPMENT_ACTIVE_STATUS_GROUP,
  EQUIPMENT_DEFAULT_TAB_COUNTS,
  EQUIPMENT_ANSARI_STAFF_SITE_KEYWORD,
} from '../constants/equipment.constant';

const getStatusValues = (activeTab, statusFilter) => {
  if (activeTab === EQUIPMENT_TABS.LEASED) return ['leased'];
  if (activeTab !== EQUIPMENT_TABS.EQUIPMENT_BASED || statusFilter === EQUIPMENT_STATUS_FILTERS.ALL) return [];
  if (statusFilter === EQUIPMENT_STATUS_FILTERS.ACTIVE) return EQUIPMENT_ACTIVE_STATUS_GROUP;
  return [statusFilter];
};

const buildEquipmentListUrl = (activeTab, statusFilter, siteFilter, pagination) => {
  const params = new URLSearchParams();

  if (EQUIPMENT_HIRED_QUERY_PARAM_BY_TAB[activeTab]) {
    params.set('hired', EQUIPMENT_HIRED_QUERY_PARAM_BY_TAB[activeTab]);
  }

  getStatusValues(activeTab, statusFilter).forEach((status) => params.append('status', status));

  if (activeTab === EQUIPMENT_TABS.EQUIPMENT_BASED && statusFilter === EQUIPMENT_STATUS_FILTERS.ALL) {
    params.set('excludeStatus', 'sold');
  }

  if (activeTab === EQUIPMENT_TABS.SITE_BASED && siteFilter && siteFilter !== EQUIPMENT_ALL_SITES_FILTER) {
    params.set('site', siteFilter);
  }

  const baseUrl = `/equipments?${params.toString()}`;
  return appendPaginationToUrl(baseUrl, pagination);
};

const buildEquipmentExportUrl = (activeTab, statusFilter, siteFilter) => {
  const params = new URLSearchParams();
  if (EQUIPMENT_HIRED_QUERY_PARAM_BY_TAB[activeTab]) {
    params.set('hired', EQUIPMENT_HIRED_QUERY_PARAM_BY_TAB[activeTab]);
  }
  getStatusValues(activeTab, statusFilter).forEach((status) => params.append('status', status));
  if (activeTab === EQUIPMENT_TABS.EQUIPMENT_BASED && statusFilter === EQUIPMENT_STATUS_FILTERS.ALL) {
    params.set('excludeStatus', 'sold');
  }
  if (activeTab === EQUIPMENT_TABS.SITE_BASED && siteFilter && siteFilter !== EQUIPMENT_ALL_SITES_FILTER) {
    params.set('site', siteFilter);
  }
  return `/equipments/export?${params.toString()}`;
};

const normalizeCompletedWorkResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.complaints)) return payload.complaints;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.complaints)) return payload.data.complaints;
  return [];
};

const isCompletedNotFulfilled = (item) =>
  (item?.workflowStatus === 'completed' || item?.status === 'resolved') &&
  item?.workflowStatus !== 'fulfilled' &&
  item?.status !== 'fulfilled';

const onScrollNearBottom = (offsetPx, callback) => {
  let debounceTimer = null;
  return () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const reachedBottom = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - offsetPx;
      if (reachedBottom) callback();
    }, EQUIPMENT_SCROLL_DEBOUNCE_MS);
  };
};

export const useEquipmentData = ({ getMediaUrlWithCache }) => {
  const [activeTab, setActiveTab] = useState(EQUIPMENT_TABS.EQUIPMENT_BASED);
  const [statusFilter, setStatusFilter] = useState(EQUIPMENT_STATUS_FILTERS.ALL);
  const [siteFilter, setSiteFilter] = useState(EQUIPMENT_ALL_SITES_FILTER);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEquipmentPages, setHasMoreEquipmentPages] = useState(true);

  const [equipmentList, setEquipmentList] = useState([]);
  const [operatorOptions, setOperatorOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);
  const [completedWorkAlerts, setCompletedWorkAlerts] = useState([]);
  const [isCompletedWorkAlertVisible, setIsCompletedWorkAlertVisible] = useState(false);

  const [isLoadingEquipmentList, setIsLoadingEquipmentList] = useState(true);
  const [isLoadingMoreEquipment, setIsLoadingMoreEquipment] = useState(false);
  const [equipmentLoadProgress, setEquipmentLoadProgress] = useState(0);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [tabCounts, setTabCounts] = useState(EQUIPMENT_DEFAULT_TAB_COUNTS);

  const [siteGroupedEquipment, setSiteGroupedEquipment] = useState({});
  const [siteListScrollStep, setSiteListScrollStep] = useState(0);
  const [displayedSiteGroups, setDisplayedSiteGroups] = useState([]);

  const [visibleEquipmentCardKeys, setVisibleEquipmentCardKeys] = useState(new Set());
  const [activeCardImageIndexByRegNo, setActiveCardImageIndexByRegNo] = useState({});

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [fullscreenEquipment, setFullscreenEquipment] = useState(null);
  const [fullscreenClickOrigin, setFullscreenClickOrigin] = useState({ x: 0, y: 0 });

  const hydrateEquipmentListWithImages = useCallback(async (rawEquipmentList) => {
    if (!rawEquipmentList.length) return [];

    const regNos = rawEquipmentList.map(eq => eq.regNo);
    const imageResponse = await apiRequest(`/equipments/bulk-equipment-images`, 'POST', { regNos });
    const imageData = await imageResponse.json();

    return Promise.all(
      rawEquipmentList.map(async (equipment) => {
        const images = imageData.data[equipment.regNo];
        if (!images?.success || images.images.length === 0) {
          return { ...equipment, equipmentImage: [] };
        }
        const equipmentImage = await Promise.all(
          images.images.map(async (img) => ({
            ...img,
            s3Url: (await getMediaUrlWithCache(img.path)) || `/${img.path}`,
          }))
        );
        return { ...equipment, equipmentImage };
      })
    );
  }, [getMediaUrlWithCache]);

  const fetchEquipmentTabCounts = useCallback(async () => {
    try {
      const response = await apiRequest(`/equipments/tab-counts`, 'GET');
      const data = await response.json();
      if (!data.ok) return;
      setTabCounts(data.data);
    } catch (err) {
      console.error('Failed to fetch equipment tab counts:', err);
    }
  }, []);

  const fetchEquipmentList = useCallback(async (page = 1, append = false) => {
    page === 1 ? setIsLoadingEquipmentList(true) : setIsLoadingMoreEquipment(true);

    const progressTicker = setInterval(() => {
      setEquipmentLoadProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, EQUIPMENT_LOAD_PROGRESS_TICK_MS);

    try {
      const pagination = normalizePagination({ page, limit: EQUIPMENT_LIST_PAGE_SIZE });
      const url = buildEquipmentListUrl(activeTab, statusFilter, siteFilter, pagination);

      const response = await apiRequest(url, 'GET');
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'Failed to fetch equipments');

      setCurrentPage(data.pagination.currentPage);
      setHasMoreEquipmentPages(data.pagination.hasMore);

      const hydrated = await hydrateEquipmentListWithImages(data.data);
      const pageResult = activeTab === EQUIPMENT_TABS.ANSARI_STAFF
        ? hydrated.filter(eq => eq.site?.some(s => s?.toLowerCase().includes(EQUIPMENT_ANSARI_STAFF_SITE_KEYWORD)))
        : hydrated;

      setEquipmentLoadProgress(100);

      if (!append) fetchEquipmentTabCounts();

      setEquipmentList(prev => (append ? [...prev, ...pageResult] : pageResult));

      setTimeout(() => {
        setIsLoadingEquipmentList(false);
        setIsLoadingMoreEquipment(false);
        setEquipmentLoadProgress(0);
      }, EQUIPMENT_LOAD_PROGRESS_HOLD_MS);
    } catch (err) {
      console.error('Error fetching equipment records:', err);
      setIsLoadingEquipmentList(false);
      setIsLoadingMoreEquipment(false);
      setEquipmentLoadProgress(0);
    } finally {
      clearInterval(progressTicker);
    }
  }, [activeTab, statusFilter, siteFilter, hydrateEquipmentListWithImages, fetchEquipmentTabCounts]);

  const fetchEquipmentsForExport = useCallback(async () => {
    const url = buildEquipmentExportUrl(activeTab, statusFilter, siteFilter);
    const response = await apiRequest(url, 'GET');
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || 'Failed to fetch equipment for export');
    return data.data;
  }, [activeTab, statusFilter, siteFilter]);

  const fetchCompletedWorkAlerts = useCallback(async () => {
    try {
      const response = await apiRequest(`/complaints/get-all-complaints`, 'GET');
      const data = await response.json();
      const completed = normalizeCompletedWorkResponse(data).filter(isCompletedNotFulfilled);
      setCompletedWorkAlerts(completed);
      setIsCompletedWorkAlertVisible(completed.length > 0);
    } catch (err) {
      console.error('Error fetching completed works:', err);
      setCompletedWorkAlerts([]);
      setIsCompletedWorkAlertVisible(false);
    }
  }, []);

  const fetchOperatorOptions = useCallback(async () => {
    try {
      const response = await apiRequest(`/users/operators`, 'GET');
      if (!response.ok) throw new Error('Failed to fetch operators');
      const data = await response.json();
      setOperatorOptions(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Error fetching operators:', err);
    }
  }, []);

  const fetchSiteOptionsForDropdown = useCallback(async () => {
    try {
      const response = await apiRequest(`/equipments/sites`, 'GET');
      const data = await response.json();
      setSiteOptions(data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  }, []);

  const openFullscreenImage = useCallback((event, equipment, imageIndex) => {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    setFullscreenClickOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setFullscreenEquipment(equipment);
    setFullscreenImage(equipment.equipmentImage[imageIndex]);
    setFullscreenImageIndex(imageIndex);
  }, []);

  const closeFullscreenImage = useCallback(() => {
    setFullscreenImage(null);
    setFullscreenEquipment(null);
    setFullscreenImageIndex(0);
  }, []);

  const setCardImageIndex = useCallback((regNo, index) => {
    setActiveCardImageIndexByRegNo(prev => ({ ...prev, [regNo]: index }));
  }, []);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    setStatusFilter(EQUIPMENT_STATUS_FILTERS.ALL);
    setSiteFilter(EQUIPMENT_ALL_SITES_FILTER);
  }, []);

  useEffect(() => {
    fetchEquipmentList();
    fetchCompletedWorkAlerts();
    fetchOperatorOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSiteListScrollStep(0);
    fetchEquipmentList(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, siteFilter]);

  useEffect(() => {
    setSiteGroupedEquipment(groupEquipmentBySite(equipmentList));
  }, [equipmentList]);

  useEffect(() => {
    if (activeTab !== EQUIPMENT_TABS.SITE_BASED) return;
    const allGroups = Object.entries(siteGroupedEquipment);
    const visibleCount = Math.min(allGroups.length, EQUIPMENT_SITES_PAGE_SIZE + siteListScrollStep);
    setDisplayedSiteGroups(allGroups.slice(0, visibleCount));
  }, [siteGroupedEquipment, siteListScrollStep, activeTab]);

  useEffect(() => {
    if (activeTab !== EQUIPMENT_TABS.SITE_BASED) return;
    const handleScroll = onScrollNearBottom(EQUIPMENT_SITE_SCROLL_BOTTOM_OFFSET_PX, () =>
      setSiteListScrollStep(prev => prev + EQUIPMENT_SITE_SCROLL_STEP)
    );
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== EQUIPMENT_TABS.SITE_BASED) return;
    if (!hasMoreEquipmentPages || isLoadingMoreEquipment || isLoadingEquipmentList || isSearchActive) return;
    const handleScroll = onScrollNearBottom(EQUIPMENT_LIST_SCROLL_BOTTOM_OFFSET_PX, () => {
      fetchEquipmentList(currentPage + 1, true);
    });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasMoreEquipmentPages, isLoadingMoreEquipment, isLoadingEquipmentList, currentPage, isSearchActive]);

  useEffect(() => {
    if (activeTab !== EQUIPMENT_TABS.SITE_BASED) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleEquipmentCardKeys(prev => new Set([...prev, entry.target.dataset.regNo]));
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    const cards = document.querySelectorAll('.fleet.equipment.site-equipment-item');
    cards.forEach(card => observer.observe(card));
    return () => cards.forEach(card => observer.unobserve(card));
  }, [siteGroupedEquipment, activeTab]);

  useEffect(() => {
    if (activeTab !== EQUIPMENT_TABS.SITE_BASED) return;
    const timers = equipmentList
      .filter(item => item.equipmentImage?.length > 1)
      .map(item => setInterval(() => {
        setActiveCardImageIndexByRegNo(prev => ({
          ...prev,
          [item.regNo]: ((prev[item.regNo] || 0) + 1) % item.equipmentImage.length,
        }));
      }, EQUIPMENT_IMAGE_SLIDESHOW_INTERVAL_MS));
    return () => timers.forEach(clearInterval);
  }, [equipmentList, activeTab]);

  return {
    activeTab, changeTab,
    statusFilter, setStatusFilter,
    siteFilter, setSiteFilter,

    equipmentList, setEquipmentList,
    operatorOptions,
    siteOptions,
    completedWorkAlerts,
    isCompletedWorkAlertVisible, setIsCompletedWorkAlertVisible,

    isLoadingEquipmentList,
    isLoadingMoreEquipment,
    equipmentLoadProgress,

    currentPage,
    hasMoreEquipmentPages,

    displayedSiteGroups,
    siteGroupedEquipment,

    visibleEquipmentCardKeys,
    activeCardImageIndexByRegNo, setCardImageIndex,

    fullscreenImage, setFullscreenImage,
    fullscreenImageIndex, setFullscreenImageIndex,
    fullscreenEquipment, setFullscreenEquipment,
    fullscreenClickOrigin,
    openFullscreenImage,
    closeFullscreenImage,

    fetchEquipmentList,
    fetchEquipmentsForExport,
    fetchSiteOptionsForDropdown,
    hydrateEquipmentListWithImages,

    isSearchActive, setIsSearchActive,
    tabCounts,
  };
};