import { useState, useRef, useEffect } from 'react';
import './Equipments.css';
import { useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import DevModal from '../../common/DevModal';
import { useSearch } from '../../context/SearchContext';
import { useHeaderVibration } from '../../context/HeaderVibrationContext';
import Button from '../../common/Button/Button';
import * as XLSX from 'xlsx';

function Equipments() {
  const { searchTerm, setSearchTerm } = useSearch();
  const { triggerVibration } = useHeaderVibration();

  // Cache helper functions
  const CACHE_KEY = 'equipment_images_cache';
  const EQUIPMENT_DATA_CACHE_KEY = 'equipment_data_cache';
  const EQUIPMENT_LIST_CACHE_KEY = 'equipment_list_cache';
  const CACHE_EXPIRY_HOURS = 6; // Cache expires after 6 hours
  const EQUIPMENT_LIST_EXPIRY_HOURS = 24; // Cache list for 24 hours
  const ITEMS_PER_PAGE = 20; // Show 20 cards at a time
  const BUFFER_ITEMS = 10; // Preload 10 cards above/below viewport

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment-based');
  const [displayedSites, setDisplayedSites] = useState([]);
  const [siteScrollPosition, setSiteScrollPosition] = useState(0);
  const [siteGroupedEquipment, setSiteGroupedEquipment] = useState({});
  const [displayedEquipment, setDisplayedEquipment] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [equipments, setEquipments] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [operatorsData, setOperatorsData] = useState([]);
  const [hoveredOperator, setHoveredOperator] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showOutsideEquipmentModal, setShowOutsideEquipmentModal] = useState(false);
  const [notFoundSearchTerm, setNotFoundSearchTerm] = useState('');
  const [hasAnimated, setHasAnimated] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [editFormFields, setEditFormFields] = useState([]);
  const [addFormFields, setAddFormFields] = useState([]);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(true);
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [operatorSearchTerm, setOperatorSearchTerm] = useState('');
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);
  const [filteredOperator, setFilteredOperator] = useState([]);
  const [operator, setOperator] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState(null);
  const [sidebarTitle, setSidebarTitle] = useState('');
  const [fuelsData, setFuelsData] = useState([]);
  const [isLoadingFuels, setIsLoadingFuels] = useState(false);
  const [showFuelProgressModal, setShowFuelProgressModal] = useState(false);
  const [fuelProgress, setFuelProgress] = useState(0);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);
  const [equipmentProgress, setEquipmentProgress] = useState(0);
  const [completedWorks, setCompletedWorks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);
  const [showCompletedWorkAlert, setShowCompletedWorkAlert] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [fullscreenEquipment, setFullscreenEquipment] = useState(null);
  const [imageClickPosition, setImageClickPosition] = useState({ x: 0, y: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    machine: true,
    regNo: true,
    brand: true,
    year: true,
    company: true,
    operator: true,
    site: true,
    status: true,
    istimaraExpiry: false,
    insuranceExpiry: false,
    tpcExpiry: false
  });
  const [addEquipmentForm, setAddEquipmentForm] = useState({
    machine: '',
    regNo: '',
    coc: '',
    brand: '',
    year: '',
    istimaraExpiry: '',
    insuranceExpiry: '',
    tpcExpiry: '',
    operator: '',
    company: 'ATE',
    hired: false,
    status: 'Active',
    site: ''
  });
  const [editFormData, setEditFormData] = useState({
    machine: '',
    regNo: '',
    brand: '',
    year: '',
    company: '',
    operator: '',
    brand: '',
    site: '',
    status: ''
  });
  const [outsideEquipmentForm, setOutsideEquipmentForm] = useState({
    machine: '',
    regNo: '',
    brand: '',
    operator: '',
    company: 'OUTSIDE',
    hired: true
  });

  // Refetch equipment when tab changes
  useEffect(() => {
    setSearchTerm(''); // Clear search when switching tabs
    setCurrentPage(1); // Reset to first page
    fetchEquipments(1, false); // Fetch fresh data for new tab
  }, [activeTab]);

  // Group equipment by site whenever filteredData changes
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      const grouped = filteredData.reduce((acc, equipment) => {
        // Handle site as array or string
        let site = equipment.site;
        if (Array.isArray(site)) {
          site = site[site.length - 1] || 'Unassigned';
        } else {
          site = site || 'Unassigned';
        }

        if (!acc[site]) {
          acc[site] = [];
        }
        acc[site].push(equipment);
        return acc;
      }, {});
      setSiteGroupedEquipment(grouped);
    } else {
      setSiteGroupedEquipment({});
    }
  }, [filteredData]);

  // Virtual scrolling for site-based view
  useEffect(() => {
    if (activeTab !== 'site-based') return;

    if (!siteGroupedEquipment || Object.keys(siteGroupedEquipment).length === 0) {
      setDisplayedSites([]);
      return;
    }

    const allSites = Object.entries(siteGroupedEquipment);
    const SITES_PER_LOAD = 5; // Load 5 sites at a time

    const sitesToShow = Math.min(
      allSites.length,
      SITES_PER_LOAD + siteScrollPosition
    );

    const visibleSites = allSites.slice(0, sitesToShow);
    setDisplayedSites(visibleSites);
  }, [siteGroupedEquipment, siteScrollPosition, activeTab]);

  // Detect scroll for site view
  useEffect(() => {
    if (activeTab !== 'site-based') return;

    let scrollTimeout = null;

    const handleSiteScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const scrollTop = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollTop > documentHeight - 800) {
          setSiteScrollPosition(prev => prev + 3);
        }
      }, 200);
    };

    window.addEventListener('scroll', handleSiteScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleSiteScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [activeTab]);

  // Reset site scroll when switching tabs
  useEffect(() => {
    setSiteScrollPosition(0);
  }, [activeTab]);

  // Virtual scrolling - only render visible items
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setDisplayedEquipment([]);
      return;
    }

    // Just show first batch plus what's been scrolled to
    const itemsToShow = Math.min(
      filteredData.length,
      ITEMS_PER_PAGE + scrollPosition
    );

    const visibleItems = filteredData.slice(0, itemsToShow);
    setDisplayedEquipment(visibleItems);
  }, [filteredData, scrollPosition]);

  // Detect scroll and update which items to show
  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const scrollTop = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // When user scrolls near bottom, load more
        if (scrollTop > documentHeight - 500) {
          setScrollPosition(prev => prev + 10);
        }
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  // Lazy load images when cards come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const regNo = entry.target.dataset.regNo;
            setVisibleCards(prev => new Set([...prev, regNo]));
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    // Observe both equipment-card AND site-equipment-item
    const equipmentCards = document.querySelectorAll('.equipment-card');
    const siteEquipmentItems = document.querySelectorAll('.site-equipment-item');

    equipmentCards.forEach(card => observer.observe(card));
    siteEquipmentItems.forEach(item => observer.observe(item));

    return () => {
      equipmentCards.forEach(card => observer.unobserve(card));
      siteEquipmentItems.forEach(item => observer.unobserve(item));
    };
  }, [displayedEquipment, siteGroupedEquipment, activeTab]);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/operators/get-all-operators`, 'GET');
        if (!response.ok) throw new Error('Failed to fetch mechanics');
        const data = await response.json();
        setOperator(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error('Error fetching mechanics:', err);
      }
    };

    fetchMechanics();
  }, []);

  useEffect(() => {
    const intervals = {};

    filteredData.forEach(item => {
      if (item.equipmentImage && item.equipmentImage.length > 1) {
        intervals[item.regNo] = setInterval(() => {
          setActiveImageIndex(prev => ({
            ...prev,
            [item.regNo]: ((prev[item.regNo] || 0) + 1) % item.equipmentImage.length
          }));
        }, 3000);
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [filteredData]);

  // Add this useEffect after your other useEffects (around line 200)
  useEffect(() => {
    // Clear expired cache entries on component mount
    clearExpiredCache();
  }, []);

  useEffect(() => {
    if (operatorSearchTerm.trim() === '') {
      setFilteredOperator(operator);
    } else {
      const filtered = operator.filter(op =>
        op.name.toLowerCase().includes(operatorSearchTerm.toLowerCase())
      );
      setFilteredOperator(filtered);
    }
  }, [operatorSearchTerm, operator]);

  const toggleEquipmentSelection = (regNo) => {
    setSelectedEquipment(prev => {
      if (prev.includes(regNo)) {
        return prev.filter(r => r !== regNo);
      } else {
        return [...prev, regNo];
      }
    });
  };

  // Handle mechanic selection
  const handleOperatorSelect = (operator) => {
    setEditFormData({
      ...editFormData,
      operator: operator.name
    });
    setOperatorSearchTerm(operator.name); // Set search term to selected operator
    setShowOperatorDropdown(false);
  };

  // Helper function to get media URL from S3
  const getMediaUrl = async (filePath) => {
    if (!filePath) return '';

    try {
      const body = { key: filePath, isLong: true };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);
      const s3URL = await s3response.json();
      return s3URL.dataUrl;
    } catch (error) {
      console.error('Error getting media URL:', error);
      return '';
    }
  };

  const handleImageClick = (e, equipment, imageIndex) => {
    e.stopPropagation();

    // Get the clicked image position
    const rect = e.target.getBoundingClientRect();
    setImageClickPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });

    setFullscreenEquipment(equipment);
    setFullscreenImage(equipment.equipmentImage[imageIndex]);
    setFullscreenImageIndex(imageIndex);
  };

  const closeFullscreen = () => {
    const overlay = document.querySelector('.fullscreen-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        setFullscreenImage(null);
        setFullscreenEquipment(null);
        setFullscreenImageIndex(0);
      }, 400);
    }
  };

  const navigateFullscreenImage = (direction) => {
    if (!fullscreenEquipment) return;

    const currentEquipmentIndex = filteredData.findIndex(
      eq => eq.regNo === fullscreenEquipment.regNo
    );

    let newIndex = fullscreenImageIndex + direction;
    let newEquipment = fullscreenEquipment;

    // If exceeded current equipment images, move to next/prev equipment
    if (newIndex >= fullscreenEquipment.equipmentImage.length) {
      // Move to next equipment
      const nextEquipmentIndex = currentEquipmentIndex + 1;
      if (nextEquipmentIndex < filteredData.length) {
        newEquipment = filteredData[nextEquipmentIndex];
        // Skip equipment without images
        while (newEquipment && (!newEquipment.equipmentImage || newEquipment.equipmentImage.length === 0)) {
          const skipIndex = filteredData.findIndex(eq => eq.regNo === newEquipment.regNo) + 1;
          newEquipment = filteredData[skipIndex];
        }
        if (newEquipment && newEquipment.equipmentImage && newEquipment.equipmentImage.length > 0) {
          newIndex = 0;
          setFullscreenEquipment(newEquipment);
        } else {
          return; // No more equipment with images
        }
      } else {
        return; // Last equipment
      }
    } else if (newIndex < 0) {
      // Move to previous equipment
      const prevEquipmentIndex = currentEquipmentIndex - 1;
      if (prevEquipmentIndex >= 0) {
        newEquipment = filteredData[prevEquipmentIndex];
        // Skip equipment without images
        while (newEquipment && (!newEquipment.equipmentImage || newEquipment.equipmentImage.length === 0)) {
          const skipIndex = filteredData.findIndex(eq => eq.regNo === newEquipment.regNo) - 1;
          newEquipment = filteredData[skipIndex];
        }
        if (newEquipment && newEquipment.equipmentImage && newEquipment.equipmentImage.length > 0) {
          newIndex = newEquipment.equipmentImage.length - 1;
          setFullscreenEquipment(newEquipment);
        } else {
          return; // No more equipment with images
        }
      } else {
        return; // First equipment
      }
    }

    setFullscreenImageIndex(newIndex);
    setFullscreenImage(newEquipment.equipmentImage[newIndex]);
  };

  const getCachedImageUrl = (filePath) => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return null;

      const cacheData = JSON.parse(cache);
      const cachedItem = cacheData[filePath];

      if (!cachedItem) return null;

      // Check if cache is expired
      const now = new Date().getTime();
      const expiryTime = cachedItem.timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

      if (now > expiryTime) {
        // Cache expired, remove it
        delete cacheData[filePath];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        return null;
      }

      return cachedItem.url;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setCachedImageUrl = (filePath, url) => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      const cacheData = cache ? JSON.parse(cache) : {};

      cacheData[filePath] = {
        url: url,
        timestamp: new Date().getTime()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
      // If localStorage is full, clear old cache
      if (error.name === 'QuotaExceededError') {
        localStorage.removeItem(CACHE_KEY);
        console.log('Cache cleared due to quota exceeded');
      }
    }
  };

  const clearExpiredCache = () => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return;

      const cacheData = JSON.parse(cache);
      const now = new Date().getTime();
      let hasChanges = false;

      Object.keys(cacheData).forEach(key => {
        const expiryTime = cacheData[key].timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
        if (now > expiryTime) {
          delete cacheData[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('Expired cache entries cleared');
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  };

  // Cache equipment list (without images)
  const getCachedEquipmentList = () => {
    try {
      const cache = localStorage.getItem(EQUIPMENT_LIST_CACHE_KEY);
      if (!cache) return null;

      const parsed = JSON.parse(cache);
      const now = new Date().getTime();
      const expiryTime = parsed.timestamp + (EQUIPMENT_LIST_EXPIRY_HOURS * 60 * 60 * 1000);

      if (now > expiryTime) {
        localStorage.removeItem(EQUIPMENT_LIST_CACHE_KEY);
        console.log('Equipment list cache expired');
        return null;
      }

      console.log('Using cached equipment list');
      return parsed.data;
    } catch (error) {
      console.error('Error reading equipment list cache:', error);
      return null;
    }
  };

  const setCachedEquipmentList = (equipmentList) => {
    try {
      const cacheData = {
        data: equipmentList,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(EQUIPMENT_LIST_CACHE_KEY, JSON.stringify(cacheData));
      console.log('Equipment list cached successfully');
    } catch (error) {
      console.error('Error caching equipment list:', error);
      if (error.name === 'QuotaExceededError') {
        localStorage.removeItem(EQUIPMENT_LIST_CACHE_KEY);
        console.log('Equipment list cache cleared due to quota exceeded');
      }
    }
  };

  // Enhanced getMediaUrl with caching
  const getMediaUrlWithCache = async (filePath) => {
    if (!filePath) return '';

    // Check cache first
    const cachedUrl = getCachedImageUrl(filePath);
    if (cachedUrl) {
      return cachedUrl;
    }

    // If not in cache, fetch from S3
    try {
      const body = { key: filePath, isLong: true };
      const s3response = await apiRequest(`${END_POINT}/s3Config/get-pre-signed-url`, 'POST', body);
      const s3URL = await s3response.json();
      const url = s3URL.dataUrl;

      // Cache the URL
      setCachedImageUrl(filePath, url);
      console.log('Cached new URL for:', filePath);

      return url;
    } catch (error) {
      console.error('Error getting media URL:', error);
      return '';
    }
  };

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle year sorting - convert to numbers
      if (key === 'year') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Get current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format date as DD-MM-YY
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

      // Format time in AM/PM
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString}   |   ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchEquipments();
    fetchCompletedWorks();
  }, []);

  // Infinite scroll for loading more equipment
  useEffect(() => {
    if (activeTab !== 'equipment-based') return;
    if (!hasMore || isLoadingMore || isLoadingEquipments) return;

    let scrollTimeout = null;

    const handleInfiniteScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const scrollTop = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when 80% scrolled
        if (scrollTop > documentHeight * 0.8) {
          console.log('Loading more equipment...');
          fetchEquipments(currentPage + 1, true);
        }
      }, 200);
    };

    window.addEventListener('scroll', handleInfiniteScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleInfiniteScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [activeTab, hasMore, isLoadingMore, isLoadingEquipments, currentPage]);


  const fetchEquipments = async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoadingEquipments(true);
    } else {
      setIsLoadingMore(true);
    }

    const progressInterval = setInterval(() => {
      setEquipmentProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 150);

    try {
      // Determine hired filter based on active tab
      let hiredParam = '';
      if (activeTab === 'hired') {
        hiredParam = '&hired=hired';
      } else if (activeTab === 'equipment-based') {
        hiredParam = '&hired=own';
      }
      // For site-based, fetch all (no hired param)

      // Fetch equipment list with pagination
      const response = await apiRequest(
        `${END_POINT}/equipments/get-equipments?page=${page}&limit=20${hiredParam}`,
        'GET'
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.message || 'Failed to fetch equipments');
      }

      const equipmentList = data.data;
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      setHasMore(data.pagination.hasMore);

      // Get regNos for bulk image fetch
      const regNos = equipmentList.map(eq => eq.regNo);

      // Fetch images in bulk (ONE API call instead of 20!)
      const imageResponse = await apiRequest(
        `${END_POINT}/equipments/bulk-equipment-images`,
        'POST',
        { regNos }
      );
      const imageData = await imageResponse.json();

      // Merge equipment with images
      const equipmentsWithImages = await Promise.all(
        equipmentList.map(async (equipment) => {
          const images = imageData.data[equipment.regNo];

          if (!images || !images.success || images.images.length === 0) {
            return { ...equipment, equipmentImage: [] };
          }

          // Fetch S3 URLs for images
          const imagesWithUrls = await Promise.all(
            images.images.map(async (img) => {
              const s3Url = await getMediaUrlWithCache(img.path);
              return {
                ...img,
                s3Url: s3Url || `${END_POINT}/${img.path}`
              };
            })
          );

          return {
            ...equipment,
            equipmentImage: imagesWithUrls
          };
        })
      );

      setEquipmentProgress(100);



      if (append) {
        setEquipments(prev => [...prev, ...equipmentsWithImages]);
        setFilteredData(prev => [...prev, ...equipmentsWithImages]);
      } else {
        setEquipments(equipmentsWithImages);
        setFilteredData(equipmentsWithImages);
      }

      setTimeout(() => {
        setIsLoadingEquipments(false);
        setIsLoadingMore(false);
        setEquipmentProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error fetching equipment records:', error);
      setIsLoadingEquipments(false);
      setIsLoadingMore(false);
      setEquipmentProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleQuickServices = () => {
    navigate(`/service-histoy/summary`);
  }

  const handleClearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(EQUIPMENT_DATA_CACHE_KEY);
    localStorage.removeItem(EQUIPMENT_LIST_CACHE_KEY);
    setDeleteStatus({
      message: 'Image cache cleared successfully. Reload the page to fetch fresh images.',
      isError: false
    });
    setShowStatusModal(true);
    console.log('Cache manually cleared');
  };

  const fetchCompletedWorks = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/complaints/get-all-complaints`, 'GET');
      const data = await response.json();

      const completedWorksList = data.filter(item => item.workflowStatus === "completed");

      setCompletedWorks(completedWorksList);
      setShowCompletedWorkAlert(completedWorksList.length > 0);
    } catch (error) {
      console.error('Error fetching completed works:', error);
      setCompletedWorks([]);
      setShowCompletedWorkAlert(false);
    }
  };

  useEffect(() => {
    const searchEquipments = async () => {
      if (!searchTerm || searchTerm.trim() === '') {
        fetchEquipments(1, false);
        setShowNoResultsModal(false);
        return;
      }

      try {
        // Determine hired filter
        let hiredFilter = null;
        if (activeTab === 'hired') {
          hiredFilter = 'hired';
        } else if (activeTab === 'equipment-based') {
          hiredFilter = 'own';
        }

        const response = await apiRequest(
          `${END_POINT}/equipments/search-equipments`,
          'POST',
          {
            searchTerm: searchTerm.trim(),
            page: 1,
            limit: 100,
            searchField: activeTab === 'site-based' ? 'site' : 'all',
            hired: hiredFilter
          }
        );

        const data = await response.json();

        if (data.ok) {
          // Fetch images for search results
          const regNos = data.data.map(eq => eq.regNo);
          const imageResponse = await apiRequest(
            `${END_POINT}/equipments/bulk-equipment-images`,
            'POST',
            { regNos }
          );
          const imageData = await imageResponse.json();

          // Merge with images
          const resultsWithImages = await Promise.all(
            data.data.map(async (equipment) => {
              const images = imageData.data[equipment.regNo];

              if (!images || !images.success || images.images.length === 0) {
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

          setFilteredData(resultsWithImages)
          setShowNoResultsModal(resultsWithImages.length === 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchEquipments();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, activeTab]);

  const handleNavigateToComplaint = (workItem) => {
    navigate(`/complaints/${workItem._id}/${workItem.regNo}`);
  };

  const handleCloseCompletedWorkAlert = () => {
    setShowCompletedWorkAlert(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}, ${month} ${year}`;
  };

  const handleRowClick = (regNo) => {
    navigate(`/service-history/${regNo}`);
  };

  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      setDeleteStatus({
        message: 'No data available to export.',
        isError: true
      });
      setShowStatusModal(true);
      return;
    }

    // Show export modal to select columns
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    // Get selected columns
    const selectedColumns = Object.entries(exportColumns)
      .filter(([_, isSelected]) => isSelected)
      .map(([col, _]) => col);

    if (selectedColumns.length === 0) {
      setDeleteStatus({
        message: 'Please select at least one column to export.',
        isError: true
      });
      setShowStatusModal(true);
      return;
    }

    // Column headers mapping
    const columnHeaders = {
      machine: 'Machine',
      regNo: 'Reg No',
      brand: 'Brand',
      year: 'Year',
      company: 'Company',
      operator: 'Operator',
      site: 'Site',
      status: 'Status',
      istimaraExpiry: 'Istimara Expiry',
      insuranceExpiry: 'Insurance Expiry',
      tpcExpiry: 'TPC Expiry'
    };

    // Prepare data for export
    const exportData = filteredData.map(item => {
      const row = {};
      selectedColumns.forEach(col => {
        if (col === 'operator') {
          row[columnHeaders[col]] = item.certificationBody?.[item.certificationBody.length - 1] || 'N/A';
        } else if (col === 'istimaraExpiry' || col === 'insuranceExpiry' || col === 'tpcExpiry') {
          row[columnHeaders[col]] = formatDateWithExpiry(item[col]).formattedDate || 'N/A';
        } else {
          row[columnHeaders[col]] = item[col] || 'N/A';
        }
      });
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipment Inventory');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Equipment_Inventory_${date}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    setShowExportModal(false);
    setDeleteStatus({
      message: 'Excel file exported successfully!',
      isError: false
    });
    setShowStatusModal(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const style = `
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1, p { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: center; }
      th { background-color: #f2f2f2; }
      .no-results { text-align: center; font-style: italic; }
    </style>
  `;

    // Generate table HTML from filteredData
    const tableHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Machine</th>
          <th>Reg No</th>
          <th>Brand</th>
          <th>Year</th>
          <th>Company</th>
          <th>Operator</th>
          <th>Site</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${filteredData && filteredData.length > 0
        ? filteredData.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.machine || 'N/A'}</td>
              <td>${item.regNo || 'N/A'}</td>
              <td>${item.brand || 'N/A'}</td>
              <td>${item.year || 'N/A'}</td>
              <td>${item.company || 'N/A'}</td>
              <td>${item.certificationBody && item.certificationBody.length > 0
            ? item.certificationBody[item.certificationBody.length - 1]
            : 'N/A'}</td>
              <td>${item.site || 'N/A'}</td>
              <td>${item.status || 'N/A'}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="9" class="no-results">No equipment data available</td></tr>'
      }
      </tbody>
    </table>
  `;

    const content = `
    <html>
      <head>
        <title>Equipment Inventory</title>
        ${style}
      </head>
      <body>
        <h1>Equipment Inventory</h1>
        ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
        ${tableHTML}
        <div style="margin-top: 10px; text-align: center;">
          Showing ${filteredData?.length || 0} ${searchTerm ? 'matching entries' : 'entries'}
        </div>
      </body>
    </html>
  `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleEdit = (e, equipment) => {
    e.stopPropagation()
    triggerVibration();
    setEditEquipment(equipment);

    const currentOperator = equipment.certificationBody[equipment.certificationBody.length - 1] || '';

    setEditFormData({
      machine: equipment.machine,
      regNo: equipment.regNo,
      brand: equipment.brand,
      site: equipment.site,
      status: equipment.status,
      year: equipment.year,
      company: equipment.company,
      operator: currentOperator
    });

    // Reset operator search term to current operator
    setOperatorSearchTerm(currentOperator);
    setShowOperatorDropdown(false); // Make sure dropdown is closed
    setShowEditModal(true);
  };

  const handleDeleteClick = (e, equipment) => {
    e.stopPropagation()
    triggerVibration();
    setSelectedEquipment(equipment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEquipment) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/equipments/delete-equipment/${selectedEquipment.regNo}`,
        'DELETE'
      );

      const data = await response.json();
      setShowDeleteModal(false);

      if (data.ok) {
        setDeleteStatus({
          message: `Equipment ${selectedEquipment.regNo} successfully deleted.`,
          isError: false
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to delete equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({
        message: 'Error deleting equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error deleting equipment:', error);
    }
  };

  // Updated handleAdd function to show modal instead of navigate
  const handleAdd = () => {
    triggerVibration();
    setShowAddModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleUpdateEquipment = async (e) => {
    e?.preventDefault();

    if (!editEquipment) return;

    const updatedEquipment = {
      ...editEquipment,
      machine: editFormData.machine,
      regNo: editFormData.regNo,
      brand: editFormData.brand,
      year: editFormData.year,
      company: editFormData.company,
      site: editFormData.site,
      status: editFormData.status
    };

    if (editFormData.operator !== editEquipment.certificationBody[editEquipment.certificationBody.length - 1]) {
      updatedEquipment.certificationBody = [...editEquipment.certificationBody, editFormData.operator];
    }

    try {
      const response = await apiRequest(
        `${END_POINT}/equipments/update-equipment/${editEquipment.regNo}`,
        'PUT',
        updatedEquipment
      );

      const data = await response.json();
      setShowEditModal(false);

      if (data.ok) {
        setDeleteStatus({
          message: `Equipment ${editEquipment.regNo} successfully updated.`,
          isError: false
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to update equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowEditModal(false);
      setDeleteStatus({
        message: 'Error updating equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error updating equipment:', error);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditEquipment(null);
    setOperatorSearchTerm(''); // Reset search term
    setShowOperatorDropdown(false); // Close dropdown
  };

  const handleViewAllOperators = (e, operators) => {
    e.stopPropagation();
    setSidebarContent({ type: 'operators', data: operators });
    setSidebarTitle('All Operators');
    setShowSidebar(true);
  };

  const handleViewAllFuels = async (e, regNo) => {
    e.stopPropagation();
    setIsLoadingFuels(true);
    setShowFuelProgressModal(true);
    setFuelProgress(0);

    // Animate progress from 0 to 90% while loading
    const progressInterval = setInterval(() => {
      setFuelProgress(prev => {
        if (prev >= 90) return prev; // Stop at 90% until completion
        return prev + Math.random() * 15; // Random increments for smooth animation
      });
    }, 150);

    try {
      const response = await apiRequest(`${END_POINT}/fuels/equipment-consumption`);
      const data = await response.json();

      const fuelData = data.data.filter(item => item.regNo === regNo);

      if (data.success) {
        setFuelProgress(100); // Complete the progress bar
        setTimeout(() => {
          setSidebarContent({ type: 'fuels', data: fuelData });
          setSidebarTitle(`Fuel Consumption - ${regNo}`);
          setShowSidebar(true);
        }, 300);
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to fetch fuel data.',
          isError: true
        });
        setShowStatusModal(true);
      }
    } catch (error) {
      setDeleteStatus({
        message: 'Error fetching fuel data: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error fetching fuel data:', error);
    } finally {
      clearInterval(progressInterval); // Stop the animation
      setIsLoadingFuels(false);
      setTimeout(() => setShowFuelProgressModal(false), 500);
    }
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSidebarContent(null);
    setSidebarTitle('');
  };

  const handleOperatorMouseEnter = (equipmentId) => {
    setHoveredOperator(equipmentId);
  };

  const handleOperatorMouseLeave = () => {
    setHoveredOperator(null);
  };

  const handleOutsideEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setOutsideEquipmentForm({
      ...outsideEquipmentForm,
      [name]: value
    });
  };

  const handleAddOutsideEquipment = async (e) => {
    e?.preventDefault();

    const newOutsideEquipment = {
      ...outsideEquipmentForm,
      certificationBody: [outsideEquipmentForm.operator]
    };

    delete newOutsideEquipment.operator;

    try {
      const response = await apiRequest(
        `${END_POINT}/equipments/add-equipment`,
        'POST',
        newOutsideEquipment
      );

      const data = await response.json();
      setShowOutsideEquipmentModal(false);

      if (data.ok) {
        setDeleteStatus({
          message: `Outside equipment ${outsideEquipmentForm.regNo} successfully added.`,
          isError: false
        });
        setOutsideEquipmentForm({
          machine: '',
          regNo: '',
          brand: '',
          operator: '',
          company: 'OUTSIDE',
          hired: true
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to add hired equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowOutsideEquipmentModal(false);
      setDeleteStatus({
        message: 'Error adding hired equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error adding hired equipment:', error);
    }
  };

  const closeOutsideEquipmentModal = () => {
    setShowOutsideEquipmentModal(false);
    setNotFoundSearchTerm('');
  };

  // Add Equipment Modal Functions
  const handleAddEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setAddEquipmentForm({
      ...addEquipmentForm,
      [name]: value
    });
  };

  const handleAddEquipmentSubmit = async (e) => {
    e?.preventDefault();

    const newEquipment = {
      ...addEquipmentForm,
      year: parseInt(addEquipmentForm.year),
      certificationBody: [addEquipmentForm.operator],
      site: [addEquipmentForm.site],
      hired: addEquipmentForm.company === 'HIRED'
    };

    // Remove operator and site from the object as they're now in arrays
    delete newEquipment.operator;

    try {
      const response = await apiRequest(`${END_POINT}/equipments/add-equipment`, 'POST', newEquipment);

      setShowAddModal(false);

      if (response.ok) {
        setDeleteStatus({
          message: `Equipment ${addEquipmentForm.regNo} successfully added.`,
          isError: false
        });
        // Reset form
        setAddEquipmentForm({
          machine: '',
          regNo: '',
          coc: '',
          brand: '',
          year: '',
          istimaraExpiry: '',
          insuranceExpiry: '',
          tpcExpiry: '',
          operator: '',
          company: 'ATE',
          hired: false,
          status: 'Active',
          site: ''
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: response.message || 'Failed to add equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);
    } catch (error) {
      setShowAddModal(false);
      setDeleteStatus({
        message: 'Error adding equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error adding equipment:', error);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    // Reset form when closing
    setAddEquipmentForm({
      machine: '',
      regNo: '',
      coc: '',
      brand: '',
      year: '',
      istimaraExpiry: '',
      insuranceExpiry: '',
      tpcExpiry: '',
      operator: '',
      company: 'ATE',
      hired: false,
      status: 'Active',
      site: ''
    });
  };

  const handleViewDetails = (equipment) => {
    setSidebarContent({ type: 'details', data: equipment });
    setSidebarTitle(`${equipment.machine} - ${equipment.regNo}`);
    setShowSidebar(true);
  };

  const formatDateWithExpiry = (dateString) => {
    if (!dateString) return { formattedDate: '', isExpired: false };

    // Parse the mm/dd/yyyy date
    const dateParts = dateString.split('/');
    if (dateParts.length !== 3) return { formattedDate: dateString, isExpired: false };

    const [month, day, year] = dateParts;

    // Format to dd-mm-yyyy
    const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;

    // Check if expired (before today)
    const itemDate = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    const isExpired = itemDate < today;

    return {
      formattedDate,
      isExpired
    };
  }

  // Render sidebar content based on type
  const renderSidebarContent = () => {
    if (!sidebarContent) return null;

    if (sidebarContent.type === 'details') {
      const item = sidebarContent.data;
      const istimaraInfo = formatDateWithExpiry(item.istimaraExpiry);

      return (
        <div className="details-section">
          <h3>Basic Information</h3>
          <div className="details-list">
            <div className="detail-row">
              <span className="detail-row-label">Machine</span>
              <span className="detail-row-value">{item.machine}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Registration No</span>
              <span className="detail-row-value">{item.regNo}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Brand</span>
              <span className="detail-row-value">{item.brand}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Year</span>
              <span className="detail-row-value">{item.year}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Company</span>
              <span className="detail-row-value">{item.company}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Status</span>
              <span className="detail-row-value">
                <span className={`status-badge ${item.status?.toLowerCase()}`}>
                  {item.status}
                </span>
              </span>
            </div>
          </div>

          <h3>Location & Assignment</h3>
          <div className="details-list">
            <div className="detail-row-actions">
              <div className="detail-row">
                <span className="detail-row-label">Site</span>
                <span className="detail-row-value">{item.site || 'N/A'}</span>
              </div>
              {!isSelectMode && (
                <Button
                  text="Replace Site"
                  onClick={() => handleViewDetails(item)}
                  colorScheme="rose-700"
                  variant="gradient"
                  font="xl"
                  animation=""
                  squircle="4xl"
                  width="170px"
                  height="58px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
              )}
            </div>
            <div className='detail-row-actions'>
              <div className="detail-row">
                <span className="detail-row-label">Current Operator</span>
                <span className="detail-row-value">
                  {item.certificationBody && item.certificationBody.length > 0
                    ? item.certificationBody[item.certificationBody.length - 1]
                    : 'N/A'}
                </span>
              </div>
              {!isSelectMode && (
                <Button
                  text="Replace Operator"
                  onClick={() => handleViewDetails(item)}
                  colorScheme="amber-500"
                  variant="gradient"
                  font="xl"
                  animation=""
                  squircle="4xl"
                  width="200px"
                  height="58px"
                  type="submit"
                  textColor="black-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
              )}
            </div>
            {item.certificationBody && item.certificationBody.length > 1 && (
              <div className="detail-row">
                <span className="detail-row-label">All Operators</span>
                <span className="detail-row-value">
                  <button
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSidebarContent({ type: 'operators', data: item.certificationBody });
                      setSidebarTitle('All Operators');
                    }}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    View All ({item.certificationBody.length})
                  </button>
                </span>
              </div>
            )}
          </div>

          <h3>Expiry Information</h3>
          <div className="details-list">
            <div className="detail-row">
              <span className="detail-row-label">Istimara Expiry</span>
              <span className="detail-row-value">
                {istimaraInfo.formattedDate || 'N/A'}
                {istimaraInfo.isExpired && (
                  <span className="expired-label">expired</span>
                )}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Insurance Expiry</span>
              <span className="detail-row-value">{item.insuranceExpiry || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">TPC Expiry</span>
              <span className="detail-row-value">{item.tpcExpiry || 'N/A'}</span>
            </div>
          </div>

          <h3>Actions</h3>
          <div className="details-list">
            <Button
              text="View Fuel Consumption"
              onClick={(e) => handleViewAllFuels(e, item.regNo)}
              colorScheme="blue-600"
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="fit-content"
              height="58px"
              type="submit"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          </div>
        </div>
      );
    }

    if (sidebarContent.type === 'operators') {
      return (
        <div className="operators-list">
          <table className="operators-table">
            <thead>
              <tr>
                <th>SL No</th>
                <th>Operator Name</th>
              </tr>
            </thead>
            <tbody>
              {sidebarContent.data.map((operator, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{operator.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (sidebarContent.type === 'fuels') {
      if (sidebarContent.data.length === 0) {
        return <p>No fuel consumption data available.</p>;
      }


      const fuelData = sidebarContent.data[0];
      { console.log(fuelData.transactions) }
      return (
        <div className="fuels-list">
          <div className="fuel-summary">
            <h3>Fuel Consumption Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Liters:</span>
                <span className="summary-value">{fuelData.totalLiters || 0} L</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Amount:</span>
                <span className="summary-value">SAR {fuelData.totalAmount || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Transactions:</span>
                <span className="summary-value">{fuelData.totalTransactions || 0}</span>
              </div>
            </div>
          </div>

          {fuelData.productBreakdown && Object.keys(fuelData.productBreakdown).length > 0 && (
            <div className="breakdown-section">
              <h4>Product Breakdown</h4>
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Liters</th>
                    <th>Amount</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fuelData.productBreakdown).map(([product, data], index) => (
                    <tr key={index}>
                      <td>{product}</td>
                      <td>{data.liters || 0} L</td>
                      <td>SAR {data.amount || 0}</td>
                      <td>{data.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fuelData.transactions && Object.keys(fuelData.transactions).length > 0 && (
            <div className="breakdown-section">
              <h4>Station Breakdown</h4>
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Station</th>
                    <th>Liters</th>
                    <th>Amount</th>
                    <th>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelData.transactions.slice().reverse().map((data, index) => (
                    <tr key={index}>
                      <td>{formatDate(data.transactionDate)}</td>
                      <td>{data.stationName}</td>
                      <td>{data.liter || 0} L</td>
                      <td>SAR {data.totalAmount || 0}</td>
                      <td>{data.unitPrice || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="equipment-container">
      {/* Completed Work Alert */}
      {showCompletedWorkAlert && completedWorks.length > 0 && (
        <div className="completed-work-alert">
          <div className="alert-header">
            <h3 className="alert-title">✓ Completed Work ({completedWorks.length})</h3>
            <button className="alert-close-btn" onClick={handleCloseCompletedWorkAlert}>
              <span class="material-symbols-rounded">
                close
              </span>
            </button>
          </div>
          <div className="work-alert-list">
            {completedWorks.map((workItem) => (
              <div key={workItem._id} className="work-alert-item">
                <div className="work-alert-info">
                  <div className="info-row">
                    <span className="info-label">Operator:</span>
                    <span className="info-value">{workItem.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Equipment:</span>
                    <span className="info-value">{workItem.regNo || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Comments:</span>
                    <span className="info-value">{workItem.approvalTrail[1].comments || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Completed By:</span>
                    <span className="info-value">{workItem.assignedMechanic?.mechanicName || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Registered Time:</span>
                    <span className="info-value">{workItem.createdAt || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Completed Time:</span>
                    <span className="info-value">{workItem.createdAt || 'N/A'}</span>
                  </div>
                </div>
                <button
                  className="action-btn view-work"
                  onClick={() => handleNavigateToComplaint(workItem)}
                >
                  View Work
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="controls-container">
        <div className="buttons-container">
          <Button
            text={isSelectMode ? "Cancel Selection" : "Select Multiple"}
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedEquipment([]); // Clear selections when toggling
            }}
            colorScheme={isSelectMode ? "red-600" : "purple-600"}
            variant="gradient"
            font="md"
            squircle="4xl"
            width="160px"
            height="38px"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />

          {isSelectMode && selectedEquipment.length > 0 && (
            <Button
              text={`View History (${selectedEquipment.length})`}
              onClick={() => navigate(`/service-history/${selectedEquipment.join(',')}`)}
              colorScheme="emerald-600"
              variant="gradient"
              font="md"
              squircle="4xl"
              width="180px"
              height="38px"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          )}
          <Button
            text="Add Equipment"
            onClick={() => handleAdd()}
            colorScheme="amber-600"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Print"
            onClick={() => handlePrint()}
            colorScheme="pink-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Export as Excel"
            onClick={() => exportToExcel()}
            colorScheme="lime-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
        <div className="buttons-container">
          <Button
            text="Recent Activities"
            onClick={() => handleQuickServices()}
            colorScheme="blue-400"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="fit-content"
            height="38px"
            type="submit"
            textColor="black-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Quick Service Histories"
            onClick={() => handleQuickServices()}
            colorScheme="lime-400"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="fit-content"
            height="38px"
            type="submit"
            textColor="black-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Clear Cache"
            onClick={() => handleClearCache()}
            colorScheme="emerald-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="doc-details-tabs">
        <Button
          text="Own Equipments"
          onClick={() => setActiveTab('equipment-based')}
          colorScheme={activeTab === 'equipment-based' ? 'amber-300' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'equipment-based' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
        <Button
          text="Hired"
          onClick={() => setActiveTab('hired')}
          colorScheme={activeTab === 'hired' ? 'amber-400' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'hired' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
        <Button
          text="View By Sites"
          onClick={() => setActiveTab('site-based')}
          colorScheme={activeTab === 'site-based' ? 'amber-400' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          squircle="4xl"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'site-based' ? 'black-300' : 'white-900'}
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
      </div>

      <div className="table-info">
        {activeTab === 'site-based' ? (
          searchTerm ? (
            `Found ${Object.keys(siteGroupedEquipment).length} matching ${Object.keys(siteGroupedEquipment).length === 1 ? 'site' : 'sites'} with ${filteredData?.length || 0} equipment`
          ) : (
            `Showing ${displayedSites.length} of ${Object.keys(siteGroupedEquipment).length} sites with ${filteredData?.length || 0} equipment`
          )
        ) : (
          searchTerm ? (
            `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
          ) : (
            `Showing ${displayedEquipment?.length || 0} of ${filteredData?.length || 0} entries`
          )
        )}
      </div>

      {activeTab === 'equipment-based' || activeTab === 'hired' ? (
        <div className="equipment-grid">
          {displayedEquipment && displayedEquipment.length > 0 ? (
            displayedEquipment.map((item) => {
              const currentImageIndex = activeImageIndex[item.regNo] || 0;
              const hasImages = item.equipmentImage && item.equipmentImage.length > 0;

              return (
                <div
                  className={`equipment-card ${isSelectMode && selectedEquipment.includes(item.regNo) ? 'selected' : ''}`}
                  key={item.id}
                  data-reg-no={item.regNo}
                  onClick={() => isSelectMode && toggleEquipmentSelection(item.regNo)}
                  style={{ cursor: isSelectMode ? 'pointer' : 'default' }}
                >
                  {/* Image Slider */}
                  <div className="card-image-slider">
                    {hasImages && visibleCards.has(item.regNo) ? (
                      <>
                        <div className="slider-images">
                          {item.equipmentImage.map((img, index) => (
                            <img
                              key={index}
                              src={img.s3Url || img.url}
                              alt={img.label || `${item.machine} ${index + 1}`}
                              className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                              loading="lazy"
                              onClick={(e) => !isSelectMode && handleImageClick(e, item, index)}
                            />
                          ))}
                        </div>
                        {item.equipmentImage.length > 1 && (
                          <div className="slider-dots">
                            {item.equipmentImage.map((_, index) => (
                              <div
                                key={index}
                                className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                onClick={() => setActiveImageIndex(prev => ({
                                  ...prev,
                                  [item.id]: index
                                }))}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : hasImages && !visibleCards.has(item.regNo) ? (
                      <div className="no-image-placeholder">
                        Loading images...
                      </div>
                    ) : (
                      <div className="no-image-placeholder">
                        Upload images to view
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="card-content">
                    <div className="card-header">
                      <div className="main-details">
                        <div className="equipment-name-and-reg">
                          <h3 className="card-title">{item.machine} - </h3>
                          <div className="card-subtitle">{item.regNo}</div>
                        </div>
                        <div className="card-brand">{item.brand} • {item.year}</div>
                      </div>
                      <div>
                        <span className={`status-badge ${item.status?.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="card-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Operator</span>
                        <span className="detail-value">
                          {item.certificationBody && item.certificationBody.length > 0
                            ? item.certificationBody[item.certificationBody.length - 1].toUpperCase()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Site</span>
                        <span className="detail-value">{item.site || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      {!isSelectMode && (
                        <div className="card-actions">
                          <Button
                            iconCenter="edit_square"
                            onClick={(e) => handleEdit(e, item)}
                            colorScheme="blue-800"
                            variant="gradient"
                            font="md"
                            animation=""
                            squircle="4xl"
                            width="45px"
                            height="45px"
                            type="submit"
                            textColor="white-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                          />
                          <Button
                            iconCenter="backspace"
                            onClick={(e) => handleDeleteClick(e, item)}
                            colorScheme="red-600"
                            variant="gradient"
                            font="md"
                            animation=""
                            squircle="4xl"
                            width="45px"
                            height="45px"
                            type="submit"
                            textColor="white-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                          />
                        </div>
                      )}
                      {!isSelectMode && (
                        <Button
                          text="Service History"
                          onClick={() => handleRowClick(item.regNo)}
                          colorScheme="lime-800"
                          variant="gradient"
                          font="md"
                          animation=""
                          squircle="4xl"
                          width="160px"
                          height="38px"
                          type="submit"
                          textColor="white-200"
                          shadowPosition="to-bottom"
                          shadowColor="white-600"
                        />
                      )}
                      {!isSelectMode && (
                        <Button
                          text="View More"
                          onClick={() => handleViewDetails(item)}
                          colorScheme="warning-800"
                          variant="gradient"
                          font="md"
                          animation=""
                          squircle="4xl"
                          width="160px"
                          height="38px"
                          type="submit"
                          textColor="white-200"
                          shadowPosition="to-bottom"
                          shadowColor="white-600"
                        />
                      )}
                      {!isSelectMode && (
                        <Button
                          text="Mobilize"
                          onClick={() => handleViewDetails(item)}
                          colorScheme="lime-400"
                          variant="gradient"
                          font="md"
                          animation=""
                          squircle="4xl"
                          width="225px"
                          height="38px"
                          type="submit"
                          textColor="black-200"
                          shadowPosition="to-bottom"
                          shadowColor="white-600"
                        />
                      )}
                      {!isSelectMode && (
                        <Button
                          text="Demobilize"
                          onClick={() => handleViewDetails(item)}
                          colorScheme="fuchsia-500"
                          variant="gradient"
                          font="md"
                          animation=""
                          squircle="4xl"
                          width="225px"
                          height="38px"
                          type="submit"
                          textColor="black-200"
                          shadowPosition="to-bottom"
                          shadowColor="white-600"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      ) : (
        // SITE-BASED GRID
        <div className="site-grid">
          {displayedSites.length > 0 ? (
            displayedSites.map(([site, equipments]) => (
              <div
                className="site-card"
                key={site}
                style={{
                  gridRow: `span ${Math.ceil(equipments.length / 2)}`
                }}
              >
                <div className="site-card-header">
                  <h2 className="site-name">{site}</h2>
                  <span className="equipment-count">{equipments.length} Equipment{equipments.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="site-equipments-grid">
                  {equipments.map((item) => {
                    const currentImageIndex = activeImageIndex[item.regNo] || 0;
                    const hasImages = item.equipmentImage && item.equipmentImage.length > 0;

                    return (
                      <div
                        className="site-equipment-item"
                        key={item.id}
                        data-reg-no={item.regNo}
                      >
                        {/* Image Slider */}
                        <div className="site-card-image-slider">
                          {hasImages && visibleCards.has(item.regNo) ? (
                            <>
                              <div className="slider-images">
                                {item.equipmentImage.map((img, index) => (
                                  <img
                                    key={index}
                                    src={img.s3Url || img.url}
                                    alt={img.label || `${item.machine} ${index + 1}`}
                                    className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                    loading="lazy"
                                    onClick={(e) => handleImageClick(e, item, index)}
                                  />
                                ))}
                              </div>
                              {item.equipmentImage.length > 1 && (
                                <div className="slider-dots">
                                  {item.equipmentImage.map((_, index) => (
                                    <div
                                      key={index}
                                      className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                      onClick={() => setActiveImageIndex(prev => ({
                                        ...prev,
                                        [item.id]: index
                                      }))}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          ) : hasImages && !visibleCards.has(item.regNo) ? (
                            <div className="no-image-placeholder">Loading...</div>
                          ) : (
                            <div className="no-image-placeholder">No images</div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="site-card-content">
                          <div className="site-card-header-mini">
                            <div className="equipment-name-and-reg">
                              <h3 className="site-card-title">{item.machine}</h3>
                              <div className="site-card-subtitle">{item.regNo}</div>
                            </div>
                            <span className={`status-badge ${item.status?.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="site-card-details">
                            <div className="detail-item">
                              <span className="detail-label">Brand</span>
                              <span className="detail-value">{item.brand} • {item.year}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Operator</span>
                              <span className="detail-value">
                                {item.certificationBody && item.certificationBody.length > 0
                                  ? item.certificationBody[item.certificationBody.length - 1]
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="site-card-actions">
                            <Button
                              iconCenter="edit_square"
                              onClick={(e) => handleEdit(e, item)}
                              colorScheme="blue-800"
                              variant="gradient"
                              font="md"
                              squircle="4xl"
                              width="40px"
                              height="40px"
                              textColor="white-200"
                            />
                            <Button
                              iconCenter="backspace"
                              onClick={(e) => handleDeleteClick(e, item)}
                              colorScheme="red-600"
                              variant="gradient"
                              font="md"
                              squircle="4xl"
                              width="40px"
                              height="40px"
                              textColor="white-200"
                            />
                            <Button
                              text="History"
                              onClick={() => handleRowClick(item.regNo)}
                              colorScheme="lime-800"
                              variant="gradient"
                              font="sm"
                              squircle="4xl"
                              width="90px"
                              height="36px"
                              textColor="white-200"
                            />
                            <Button
                              text="View"
                              onClick={() => handleViewDetails(item)}
                              colorScheme="warning-800"
                              variant="gradient"
                              font="sm"
                              squircle="4xl"
                              width="90px"
                              height="36px"
                              textColor="white-200"
                            />
                            <Button
                              text="Replace Equipment"
                              onClick={() => handleViewDetails(item)}
                              colorScheme="lime-400"
                              variant="gradient"
                              font="sm"
                              squircle="4xl"
                              width="fit-content"
                              height="36px"
                              textColor="black-200"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">No equipment found</div>
          )}
        </div>
      )}

      {/* Sidebar for View All content */}
      {showSidebar && (
        <div className="sidebar-overlay" onClick={closeSidebar}>
          <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2>{sidebarTitle}</h2>
              <button className="close-btn" onClick={closeSidebar}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="sidebar-body">
              {isLoadingFuels ? (
                <div className="loading-spinner"></div>
              ) : (
                renderSidebarContent()
              )}
            </div>
          </div>
        </div>
      )}

      {/* <DevModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
        type="unauthorized"
        title="Access Denied"
        message="You don't have permission to perform this action."
        unauthorizedReason="This feature requires administrator privileges."
        contactEmail="support@yourcompany.com"
        buttonText="Request Access"
        onButtonClick={() => {
          // Handle request access
          console.log('Request access clicked');
        }}
        secondaryButtonText="Back"
        onSecondaryClick={() => setShowUnauthorizedModal(false)}
      /> */}

      {/* Add Equipment Modal */}
      <DevModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        type="form"
        title="Add New Equipment"
        message="Fill in the details to add new equipment"
        formFields={[
          { name: 'machine', label: 'Machine', type: 'text', placeholder: 'Enter machine name', required: true },
          { name: 'regNo', label: 'Registration No', type: 'text', placeholder: 'Enter reg number', required: true },
          { name: 'coc', label: 'COC', type: 'text', placeholder: 'Enter COC' },
          { name: 'brand', label: 'Brand', type: 'text', placeholder: 'Enter brand', required: true },
          { name: 'year', label: 'Year', type: 'number', placeholder: 'Enter year', required: true },
          {
            name: 'company',
            label: 'Company',
            type: 'select',
            required: true,
            options: [
              { value: 'ATE', label: 'ATE' },
              { value: 'ASK', label: 'ASK' },
              { value: 'HIRED', label: 'HIRED' }
            ]
          },
          { name: 'istimaraExpiry', label: 'Istimara Expiry', type: 'date' },
          { name: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date' },
          { name: 'tpcExpiry', label: 'TPC Expiry', type: 'date' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Maintenance', label: 'Maintenance' }
            ]
          },
          { name: 'operator', label: 'Operator', type: 'text', placeholder: 'Enter operator name', required: true },
          { name: 'site', label: 'Site', type: 'text', placeholder: 'Enter site', required: true }
        ]}
        formValues={addEquipmentForm}
        onFormChange={(field, value) => setAddEquipmentForm({ ...addEquipmentForm, [field]: value })}
        buttonText="Add Equipment"
        onButtonClick={handleAddEquipmentSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={closeAddModal}
      />

      {/* Delete Confirmation Modal */}
      <DevModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="error"
        title="Delete Equipment?"
        message={`Are you sure you want to delete the equipment with registration number ${selectedEquipment?.regNo}`}
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={confirmDelete}
        onSecondaryClick={() => setShowDeleteModal(false)}
      />

      {/* Status Modal */}
      {showStatusModal && (
        <DevModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          type={deleteStatus.isError ? 'error' : 'success'}
          title={deleteStatus.isError ? 'Error' : 'Success'}
          message={deleteStatus.message}
          secondaryButtonText={deleteStatus.isError ? 'X' : 'Ok'}
          onSecondaryClick={() => setShowStatusModal(false)}
        />
      )}

      {/* Edit Equipment Modal */}
      <DevModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        type="form"
        title="Update Equipment"
        message="Edit the equipment details below"
        formFields={[
          { name: 'machine', label: 'Machine', type: 'text', placeholder: 'Enter machine name', required: true },
          { name: 'regNo', label: 'Registration No', type: 'text', placeholder: 'Enter reg number', required: true },
          { name: 'brand', label: 'Brand', type: 'text', placeholder: 'Enter brand', required: true },
          { name: 'year', label: 'Year', type: 'text', placeholder: 'Enter year', required: true },
          { name: 'company', label: 'Company', type: 'text', placeholder: 'Enter company', required: true },
          { name: 'operator', label: 'Operator', type: 'text', placeholder: 'Enter operator name', required: true },
          { name: 'site', label: 'Site', type: 'text', placeholder: 'Enter site', required: true },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { value: 'active', label: 'Active' },
              { value: 'idle', label: 'Idle' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'going', label: 'Going' },
              { value: 'loading', label: 'Loading' }
            ]
          }
        ]}
        formValues={editFormData}
        onFormChange={(field, value) => setEditFormData({ ...editFormData, [field]: value })}
        buttonText="Save Changes"
        onButtonClick={handleUpdateEquipment}
        secondaryButtonText="Cancel"
        onSecondaryClick={closeEditModal}
      />

      {/* Export Columns Selection Modal */}
      <DevModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        type="filters"
        title="Select Columns to Export"
        message="Choose which columns you want to include in the Excel file"
        filterGroups={[
          {
            name: 'columns',
            label: 'Available Columns',
            type: 'checkbox',
            options: [
              { value: 'machine', label: 'Machine' },
              { value: 'regNo', label: 'Registration No' },
              { value: 'brand', label: 'Brand' },
              { value: 'year', label: 'Year' },
              { value: 'company', label: 'Company' },
              { value: 'operator', label: 'Operator' },
              { value: 'site', label: 'Site' },
              { value: 'status', label: 'Status' },
              { value: 'istimaraExpiry', label: 'Istimara Expiry' },
              { value: 'insuranceExpiry', label: 'Insurance Expiry' },
              { value: 'tpcExpiry', label: 'TPC Expiry' }
            ]
          }
        ]}
        filterValues={{
          columns: Object.entries(exportColumns)
            .filter(([_, isSelected]) => isSelected)
            .map(([col, _]) => col)
        }}
        onFilterChange={(filterName, value) => {
          const newExportColumns = { ...exportColumns };
          Object.keys(newExportColumns).forEach(key => {
            newExportColumns[key] = value.includes(key);
          });
          setExportColumns(newExportColumns);
        }}
        onApplyFilters={handleExportConfirm}
        onResetFilters={() => {
          setExportColumns({
            machine: true,
            regNo: true,
            brand: true,
            year: true,
            company: true,
            operator: true,
            site: true,
            status: true,
            istimaraExpiry: false,
            insuranceExpiry: false,
            tpcExpiry: false
          });
        }}
        buttonText="Export to Excel"
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowExportModal(false)}
      />

      {/* Add Outside Equipment Modal */}
      {showOutsideEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content hired">
            <div className="modal-header">
              <h2>Add Outside Equipment</h2>
              <button className="close-btn" onClick={closeOutsideEquipmentModal}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddOutsideEquipment} className="edit-form">
                <div className="form-group">
                  <label htmlFor="machine">Machine:</label>
                  <input
                    type="text"
                    id="machine"
                    name="machine"
                    value={outsideEquipmentForm.machine}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="regNo">Registration No:</label>
                  <input
                    type="text"
                    id="regNo"
                    name="regNo"
                    value={outsideEquipmentForm.regNo}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brand">Brand:</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={outsideEquipmentForm.brand}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="operator">Operator:</label>
                  <input
                    type="text"
                    id="operator"
                    name="operator"
                    value={outsideEquipmentForm.operator}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <p className="hired-note">
                    <strong>Note:</strong> This equipment will be marked as an hired equipment with company "OUTSIDE".
                  </p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="action-btn cancel" onClick={closeOutsideEquipmentModal}>Cancel</button>
              <button className="action-btn save" onClick={handleAddOutsideEquipment}>Add Equipment</button>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Data Progress Modal using DevModal */}
      <DevModal
        isOpen={showFuelProgressModal}
        type="progress"
        title="Loading Fuel Data"
        message="Fetching fuel consumption data, please wait..."
        progress={fuelProgress}
        progressText="Processing..."
      />

      {/* No Results Modal */}
      <DevModal
        isOpen={showNoResultsModal}
        onClose={() => {
          setShowNoResultsModal(false);
          setSearchTerm(''); // Clear search when closing
        }}
        type="warning"
        title="No Equipment Found"
        message={`No matching records found for "${searchTerm}". Would you like to add this as an hired equipment?`}
        buttonText="Add as Outside Equipment"
        onButtonClick={() => {
          setOutsideEquipmentForm({
            ...outsideEquipmentForm,
            regNo: searchTerm
          });
          setShowNoResultsModal(false);
          setShowOutsideEquipmentModal(true);
        }}
        secondaryButtonText="Clear"
        onSecondaryClick={() => {
          setShowNoResultsModal(false);
          setSearchTerm('');
        }}
      />
      <DevModal
        isOpen={isLoadingEquipments}
        type="progress"
        title="Loading Equipment Data"
        message="Fetching equipment information, please wait..."
        progress={equipmentProgress}
        progressText="Loading..."
      />

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && fullscreenEquipment && (
        <div
          className="fullscreen-overlay"
          onClick={closeFullscreen}
          style={{
            '--click-x': `${imageClickPosition.x}px`,
            '--click-y': `${imageClickPosition.y}px`
          }}
        >
          <div className="fullscreen-header">
            <h2>{fullscreenEquipment.machine} - {fullscreenEquipment.regNo}</h2>
            <span className="image-counter">
              {fullscreenImageIndex + 1} / {fullscreenEquipment.equipmentImage.length}
            </span>
          </div>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button className="fullscreen-close" onClick={closeFullscreen}>
              <span className="material-symbols-rounded">close</span>
            </button>

            <div className="fullscreen-image-container">
              <img
                src={fullscreenImage.s3Url || fullscreenImage.url}
                alt={fullscreenImage.label || `${fullscreenEquipment.machine}`}
              />
            </div>

            <button
              className="fullscreen-nav prev"
              onClick={() => navigateFullscreenImage(-1)}
            >
              <span className="material-symbols-rounded">chevron_left</span>
            </button>

            <button
              className="fullscreen-nav next"
              onClick={() => navigateFullscreenImage(1)}
            >
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipments;