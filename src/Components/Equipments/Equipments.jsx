import { useState, useRef, useEffect } from 'react';
import './Equipments.css';
import { useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import DevModal from '../../common/DevModal';
import { useSearch } from '../../context/SearchContext';
import { useHeaderVibration } from '../../context/HeaderVibrationContext';
import Button from '../../common/Button/Button';

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
  const [selectedEquipment, setSelectedEquipment] = useState(null);
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
  const [outsideEquipmentForm, setOutsideEquipmentForm] = useState({
    machine: '',
    regNo: '',
    brand: '',
    operator: '',
    company: 'OUTSIDE',
    outside: true
  });
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
  const [showCompletedWorkAlert, setShowCompletedWorkAlert] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
    outside: false,
    status: 'Active',
    site: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);
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
      console.log('Using cached URL for:', filePath);
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

  const fetchEquipments = async () => {
    setIsLoadingEquipments(true);

    const progressInterval = setInterval(() => {
      setEquipmentProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 150);

    try {
      // Try to get cached equipment list first
      let equipmentList = getCachedEquipmentList();

      // If no cache, fetch from server
      if (!equipmentList) {
        console.log('Fetching equipment list from server...');
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        const data = await response.json();
        equipmentList = data.data;

        // Cache the equipment list
        setCachedEquipmentList(equipmentList);
      }

      // Check if we have cached equipment data
      const cachedEquipmentData = localStorage.getItem(EQUIPMENT_DATA_CACHE_KEY);
      let equipmentImagesCache = {};

      if (cachedEquipmentData) {
        try {
          const parsed = JSON.parse(cachedEquipmentData);
          const now = new Date().getTime();
          // Check if cache is still valid
          if (parsed.timestamp && (now - parsed.timestamp < CACHE_EXPIRY_HOURS * 60 * 60 * 1000)) {
            equipmentImagesCache = parsed.data;
            console.log('Using cached equipment images data');
          }
        } catch (e) {
          console.error('Error parsing cached equipment data:', e);
        }
      }

      // Separate equipment into cached and non-cached
      const cachedEquipment = [];
      const uncachedEquipment = [];

      equipmentList.forEach(equipment => {
        if (equipmentImagesCache[equipment.regNo]) {
          cachedEquipment.push({
            ...equipment,
            equipmentImage: equipmentImagesCache[equipment.regNo]
          });
        } else {
          uncachedEquipment.push(equipment);
        }
      });

      // Fetch ALL uncached equipment images in PARALLEL
      const uncachedImagePromises = uncachedEquipment.map(equipment =>
        apiRequest(`${END_POINT}/stocks/equipment/${equipment.regNo}`, 'GET')
          .then(response => response.json())
          .then(imageData => ({ regNo: equipment.regNo, imageData }))
          .catch(error => {
            console.error(`Error fetching images for ${equipment.regNo}:`, error);
            return { regNo: equipment.regNo, imageData: null };
          })
      );

      // Wait for ALL image data fetches to complete
      const allImageData = await Promise.all(uncachedImagePromises);

      // Now fetch ALL S3 URLs in PARALLEL
      const equipmentWithImagePromises = allImageData.map(async ({ regNo, imageData }) => {
        const equipment = uncachedEquipment.find(eq => eq.regNo === regNo);

        if (!imageData || !imageData.data?.images) {
          return {
            ...equipment,
            equipmentImage: []
          };
        }

        // Fetch ALL S3 URLs for this equipment in PARALLEL
        const s3UrlPromises = imageData.data.images.map(img =>
          getMediaUrlWithCache(img.path)
            .then(s3Url => ({
              ...img,
              s3Url: s3Url || `${END_POINT}/${img.path}`
            }))
            .catch(() => ({
              ...img,
              s3Url: `${END_POINT}/${img.path}`
            }))
        );

        const imagesWithUrls = await Promise.all(s3UrlPromises);

        // Cache this equipment's images
        equipmentImagesCache[equipment.regNo] = imagesWithUrls;

        return {
          ...equipment,
          equipmentImage: imagesWithUrls
        };
      });

      // Wait for ALL equipment image processing to complete
      const processedUncachedEquipment = await Promise.all(equipmentWithImagePromises);

      // Combine cached and newly fetched equipment
      const equipmentsWithImages = [...cachedEquipment, ...processedUncachedEquipment];

      // Save all equipment images to cache
      localStorage.setItem(EQUIPMENT_DATA_CACHE_KEY, JSON.stringify({
        data: equipmentImagesCache,
        timestamp: new Date().getTime()
      }));

      setEquipmentProgress(100);
      setEquipments(equipmentsWithImages);
      setFilteredData(equipmentsWithImages);

      setTimeout(() => {
        setIsLoadingEquipments(false);
        setEquipmentProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error fetching equipment records:', error);
      setIsLoadingEquipments(false);
      setEquipmentProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

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

      // Filter complaints where workflowStatus is "completed"
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
    if (equipments && equipments.length > 0) {
      let results;

      if (activeTab === 'site-based' && searchTerm) {
        // In site-based view, filter by site name
        results = equipments.filter(item => {
          // Handle site as array or string
          let siteName = item.site;
          if (Array.isArray(siteName)) {
            siteName = siteName[siteName.length - 1] || 'Unassigned';
          } else {
            siteName = siteName || 'Unassigned';
          }
          return String(siteName).toLowerCase().includes(searchTerm.toLowerCase());
        });
      } else {
        // In equipment-based view, search all fields
        results = equipments.filter(item => {
          return Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }

      setFilteredData(results);

      // Show modal if search term exists but no results found
      if (searchTerm && results.length === 0) {
        setShowNoResultsModal(true);
      } else {
        setShowNoResultsModal(false);
      }
    }
  }, [searchTerm, equipments, activeTab]);

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
          outside: true
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to add outside equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowOutsideEquipmentModal(false);
      setDeleteStatus({
        message: 'Error adding outside equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error adding outside equipment:', error);
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
      site: [addEquipmentForm.site]
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
          outside: false,
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
      outside: false,
      status: 'Active',
      site: ''
    });
  };

  const handleViewDetails = (equipment) => {
    setSidebarContent({ type: 'details', data: equipment });
    setSidebarTitle(`Equipment Details - ${equipment.regNo}`);
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
            <div className="detail-row">
              <span className="detail-row-label">Site</span>
              <span className="detail-row-value">{item.site || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Current Operator</span>
              <span className="detail-row-value">
                {item.certificationBody && item.certificationBody.length > 0
                  ? item.certificationBody[item.certificationBody.length - 1]
                  : 'N/A'}
              </span>
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
            <div className="detail-row">
              <button
                className="view-details-btn"
                onClick={(e) => handleViewAllFuels(e, item.regNo)}
                style={{ width: '100%' }}
              >
                View Fuel Consumption
              </button>
            </div>
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
                  <td>{operator}</td>
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
      {/* <div className="equipment-header">
        <h1 className='equip-title'>Equipment Inventory</h1>
        <div className="date-time">{currentDateTime}</div>
      </div> */}

      {/* <div className="search-container">
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={handleClearSearch} className="clear-button">
            ×
          </button>
        )}
      </div> */}

      <div className="controls-container">
        <div className="buttons-container">
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
            rounded="md"
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
            text="Clear Cache"
            onClick={() => handleClearCache()}
            colorScheme="emerald-800"
            variant="gradient"
            font="md"
            animation=""
            rounded="md"
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
          text="View By Equipments"
          onClick={() => setActiveTab('equipment-based')}
          colorScheme={activeTab === 'equipment-based' ? 'amber-300' : 'amber-900'}
          variant="gradient"
          font="md"
          animation=""
          rounded="md"
          width="50%"
          height="48px"
          type="submit"
          textColor={activeTab === 'equipment-based' ? 'black-300' : 'white-900'}
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
          rounded="md"
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

      {activeTab === 'equipment-based' ? (
        <div className="equipment-grid">
          {displayedEquipment && displayedEquipment.length > 0 ? (
            displayedEquipment.map((item) => {
              const currentImageIndex = activeImageIndex[item.regNo] || 0;
              const hasImages = item.equipmentImage && item.equipmentImage.length > 0;

              return (
                <div
                  className="equipment-card"
                  key={item.id}
                  data-reg-no={item.regNo}
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
                            ? item.certificationBody[item.certificationBody.length - 1]
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Site</span>
                        <span className="detail-value">{item.site || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="card-actions">
                        <Button
                          iconCenter="edit_square"
                          onClick={(e) => handleEdit(e, item)}
                          colorScheme="blue-800"
                          variant="gradient"
                          font="md"
                          animation=""
                          rounded="md"
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
                          rounded="md"
                          width="45px"
                          height="45px"
                          type="submit"
                          textColor="white-200"
                          shadowPosition="to-bottom"
                          shadowColor="white-600"
                        />
                      </div>
                      <Button
                        text="Service History"
                        onClick={() => handleRowClick(item.regNo)}
                        colorScheme="lime-800"
                        variant="gradient"
                        font="md"
                        animation=""
                        rounded="md"
                        width="160px"
                        height="38px"
                        type="submit"
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                      />
                      <Button
                        text="View More"
                        onClick={() => handleViewDetails(item)}
                        colorScheme="warning-800"
                        variant="gradient"
                        font="md"
                        animation=""
                        rounded="md"
                        width="160px"
                        height="38px"
                        type="submit"
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                      />
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
                              rounded="md"
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
                              rounded="md"
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
                              rounded="md"
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
                              rounded="md"
                              width="90px"
                              height="36px"
                              textColor="white-200"
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
              { value: 'OUTSIDE', label: 'OUTSIDE' }
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

      {/* Add Outside Equipment Modal */}
      {showOutsideEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content outside">
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
                  <p className="outside-note">
                    <strong>Note:</strong> This equipment will be marked as an outside equipment with company "OUTSIDE".
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
        message={`No matching records found for "${searchTerm}". Would you like to add this as an outside equipment?`}
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
      {/* Equipment Loading Progress Modal */}
      {/* Equipment Loading Progress Modal */}
      <DevModal
        isOpen={isLoadingEquipments}
        type="progress"
        title="Loading Equipment Data"
        message="Fetching equipment information, please wait..."
        progress={equipmentProgress}
        progressText="Loading..."
      />
    </div>
  );
}

export default Equipments;