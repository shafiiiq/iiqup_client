import React, { useState, useRef, useEffect } from 'react';
import './ServiceHistory.css';
import { useParams, useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import ExcelJS from 'exceljs';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import { apiRequest } from '../../utils/0auth';
import DevModal from '../../common/DevModal';
import { useSearch } from '../../context/SearchContext';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';
import Toast from '../../common/Toast/Toast';

const ServiceHistory = () => {
  const { regNos } = useParams();

  // Better error handling
  const regNoArray = React.useMemo(() => {
    if (!regNos) {
      console.error('No regNos in URL!');
      return [];
    }
    const array = regNos.split(',').map(r => r.trim()).filter(r => r);
    return array;
  }, [regNos]);

  const isMultipleEquipment = regNoArray.length > 1;

  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const tableRef = useRef(null);

  const [groupedData, setGroupedData] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [supervisorSignUrl, setSupervisorSignUrl] = useState('');
  const [sixDigitPassword, setSixDigitPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');
  const [docAUTHmiddle, setDocAUTHmiddle] = useState('');
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [signatureCache, setSignatureCache] = useState({});
  const [isDocumentSigned, setIsDocumentSigned] = useState(false);
  const [signExpiryTime, setSignExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const { searchTerm, setSearchTerm } = useSearch();
  const [filteredData, setFilteredData] = useState([]);
  const [equipmentData, setEquipmentData] = useState(null);
  const [multipleEquipmentData, setMultipleEquipmentData] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'lastXmonths', 'thismonth', 'custom'
  const [lastMonthsCount, setLastMonthsCount] = useState(6);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);
  const [deleteReport, setDeleteReport] = useState({});
  const [serviceHistory, setServiceHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [tyreHistory, setTyreHistory] = useState([]);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [expandedRemarks, setExpandedRemarks] = useState({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFilter: 'all',
    serviceTypes: [],
    serviceHoursRange: { min: '', max: '' },
    hasRemarks: '',
    lastMonthsCount: 6,
    customStartDate: '',
    customEndDate: ''
  });

  // Set header title when component mounts or data changes
  useEffect(() => {
    if (isMultipleEquipment && multipleEquipmentData.length > 0) {
      const equipmentNames = multipleEquipmentData.map(eq => eq.machine).join(', ');
      const subtitle = `Equipments (${multipleEquipmentData.length}) > ${dateFilter.toLocaleUpperCase()} TIME > ${activeTab.toLocaleUpperCase()} SERVICE`;
      setHeaderTitle('Service History');
      setHeaderSubtitle(subtitle);
    } else if (equipmentData) {
      const subtitle = `${equipmentData.machine} - ${regNoArray[0]} > ${dateFilter.toLocaleUpperCase()} TIME > ${activeTab.toLocaleUpperCase()} SERVICE`;
      setHeaderTitle('Service History');
      setHeaderSubtitle(subtitle);
    } else {
      setHeaderTitle('Service History');
      setHeaderSubtitle(null);
    }

    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [equipmentData, multipleEquipmentData, regNoArray, activeTab, dateFilter, isMultipleEquipment]);

  useEffect(() => {
    let interval = null;

    if (signExpiryTime && isDocumentSigned) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((signExpiryTime - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setIsDocumentSigned(false);
          setSupervisorSignUrl('');
          setSignExpiryTime(null);
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signExpiryTime, isDocumentSigned]);

  // Get current date in DD-MM-YY format and time in AM/PM format
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
      hours = hours ? hours : 12; // Convert 0 to 12
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString}   |   ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const groupByEquipment = (data) => {
    const grouped = {};
    data.forEach(item => {
      const regNo = item.regNo;
      if (!grouped[regNo]) {
        grouped[regNo] = [];
      }
      grouped[regNo].push(item);
    });
    return grouped;
  };

  const toggleRemarkExpansion = (index) => {
    setExpandedRemarks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const checkRateLimit = () => {
    const now = Date.now();
    const timeDiff = now - (lastAttempt || 0);

    if (timeDiff < 60000 && authAttempts >= 3) {
      setSignError('Too many attempts. Please wait 1 minute.');
      return false;
    }

    if (timeDiff > 60000) {
      setAuthAttempts(0);
    }

    return true;
  };

  const checkSignatureCache = (documentId) => {
    const cached = signatureCache[documentId || 'default'];
    if (cached && Date.now() < cached.expiry) {
      return cached.url;
    }
    return null;
  };

  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const signDocument = () => {
    const cachedUrl = checkSignatureCache('default');
    if (cachedUrl) {
      setSupervisorSignUrl(cachedUrl);
      setIsDocumentSigned(true);
      setShowSuccessModal(true);
      return;
    }

    setShowPasswordModal(true);
    setSixDigitPassword('');
    setOtpCode('');
    setSignError('');
  };

  const handleSixDigitVerification = async () => {
    if (sixDigitPassword.length !== 6) {
      setSignError('Please enter a 6-digit password');
      return;
    }

    setSignLoading(true);
    setSignError('');

    if (!checkRateLimit()) {
      setSignLoading(false);
      return;
    }

    try {
      setShowPasswordModal(false);
      setShowLoadingModal(true);
      setLoadingMessage('Verifying password...');

      const passwordResponse = await apiRequest(
        `${END_POINT}/users/six-digit-auth/verify`,
        'POST',
        { password: sixDigitPassword }
      );

      if (!passwordResponse.ok) {
        throw new Error('Invalid 6-digit password');
      }

      setDocAUTHmiddle(sixDigitPassword);
      setLoadingMessage('Sending OTP to authorized email...');

      const otpResponse = await apiRequest(
        `${END_POINT}/otp/request`,
        'POST',
        { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' }
      );

      if (!otpResponse.ok) {
        throw new Error('Failed to send OTP');
      }

      setShowLoadingModal(false);
      setShowOtpModal(true);
      setSignLoading(false);
      setSignError('');
    } catch (error) {
      console.error('Six-digit verification error:', error);
      setAuthAttempts(prev => prev + 1);
      setLastAttempt(Date.now());
      setSignError(error.message || 'Authentication failed. Please try again.');
      setShowLoadingModal(false);
      setShowPasswordModal(true);
      setSignLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (otpCode.length !== 6) {
      setSignError('Please enter the 6-digit OTP');
      return;
    }

    setSignLoading(true);
    setSignError('');

    try {
      setShowOtpModal(false);
      setShowLoadingModal(true);
      setLoadingMessage('Verifying OTP code...');

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      const otpResponse = await apiRequest(
        `${END_POINT}/otp/verify`,
        'POST',
        {
          email: 'DOCUMENT_VERIFIER_AUTH_MAIL',
          otp: otpCode,
          userId: userData._id
        }
      );

      if (!otpResponse.ok) {
        throw new Error('Invalid OTP code. Please check and try again.');
      }

      setLoadingMessage('Generating signature key...');

      const keyResponse = await apiRequest(
        `${END_POINT}/users/doc-0auth-sign-key`,
        'POST',
        { password: docAUTHmiddle }
      );

      if (!keyResponse.ok) {
        throw new Error('Failed to generate signature key');
      }

      setDocAUTHmiddle('');
      const keyData = await keyResponse.json();

      setLoadingMessage('Applying digital signature...');

      const body = { key: keyData.data.sign_key, isLong: false, isAuthSign: true };
      const s3response = await apiRequest(
        `${END_POINT}/s3Config/get-pre-signed-url`,
        'POST',
        body
      );

      if (!s3response.ok) {
        throw new Error('Failed to generate signature URL');
      }

      const s3URL = await s3response.json();
      const fullUrl = s3URL.dataUrl;

      const expiryTime = Date.now() + 10000;
      setSignatureCache(prev => ({
        ...prev,
        'default': { url: fullUrl, expiry: expiryTime }
      }));

      setSupervisorSignUrl(fullUrl);
      setIsDocumentSigned(true);
      setSignExpiryTime(expiryTime);
      setTimeRemaining(10);

      setSixDigitPassword('');
      setOtpCode('');
      setSignLoading(false);
      setAuthAttempts(0);
      setSignError('');

      setShowLoadingModal(false);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('OTP verification error:', error);
      setSignError(error.message || 'Verification failed. Please try again.');
      setShowLoadingModal(false);
      setShowOtpModal(true);
      setSignLoading(false);
    }
  };

  const handleApplyFilters = () => {
    // Update the main filter states from the modal filters
    setDateFilter(filters.dateFilter);
    setLastMonthsCount(filters.lastMonthsCount);
    setCustomStartDate(filters.customStartDate);
    setCustomEndDate(filters.customEndDate);
    setShowCustomDateInputs(filters.dateFilter === 'custom');
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    setFilters({
      dateFilter: 'all',
      serviceTypes: [],
      serviceHoursRange: { min: '', max: '' },
      hasRemarks: '',
      lastMonthsCount: 6,
      customStartDate: '',
      customEndDate: ''
    });
    setDateFilter('all');
    setLastMonthsCount(6);
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDateInputs(false);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Function to format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Function to check if a date falls within the selected filter range
  const isDateInRange = (dateString) => {
    if (!dateString) return false;
    const itemDate = new Date(dateString);
    const now = new Date();

    switch (dateFilter) {
      case 'all':
        return true;
      case 'lastXmonths':
        const monthsAgo = new Date();
        monthsAgo.setMonth(now.getMonth() - lastMonthsCount);
        return itemDate >= monthsAgo;
      case 'thismonth':
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        return itemDate >= startDate && itemDate <= endDate;
      default:
        return true;
    }
  };

  const fetchServiceReportforMajor = async (combinedData) => {
    const promises = combinedData.map(async (item) => {
      if (item.serviceType === 'maintenance' && item.date) {
        try {
          const formattedDate = formatDate(item.date);
          const response = await apiRequest(`${END_POINT}/service-report/${item.regNo}/${formattedDate}`);

          if (response.ok) {
            const remarksData = await response.json();
            if (remarksData?.data?.[0]) {
              return {
                ...item,
                remarks: remarksData.data[0].remarks || item.remarks,
                serviceHrs: remarksData.data[0].serviceHrs || item.serviceHrs,
                nextServiceHrs: remarksData.data[0].nextServiceHrs || item.nextServiceHrs,
                location: remarksData.data[0].location || item.location,
                majorRemarks: remarksData.data[0].remarks || item.majorRemarks
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching maintenance data for ${item.date}:`, error);
        }
      }
      return item;
    });

    return await Promise.all(promises);
  };

  const fetchRemarksAndLocationForServices = async (combinedData) => {
    const promises = combinedData.map(async (item) => {
      if (['oil', 'normal', 'tyre', 'battery'].includes(item.serviceType) && item.date) {
        try {
          const formattedDate = formatDate(item.date);
          const response = await apiRequest(`${END_POINT}/service-report/${item.regNo}/${formattedDate}`);

          if (response.ok) {
            const remarksData = await response.json();
            if (remarksData?.data?.[0]) {
              const updated = {
                ...item,
                remarks: remarksData.data[0].remarks || item.remarks
              };

              if ((item.serviceType === 'oil' || item.serviceType === 'normal') && remarksData.data[0].location) {
                updated.location = remarksData.data[0].location;
              }

              return updated;
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${item.serviceType} on ${item.date}:`, error);
        }
      }
      return item;
    });

    return await Promise.all(promises);
  };

  // Fetch all service histories
  useEffect(() => {
    setLoading(true);

    if (!regNos || regNoArray.length === 0) {
      setLoading(false);
      setError('No equipment registration numbers provided');
      return;
    }
    setLoading(true);

    const fetchAllHistories = async () => {
      try {
        // Fetch histories for ALL regNos in parallel
        const allPromises = regNoArray.flatMap(regNo => [
          apiRequest(`${END_POINT}/service-history/get-service-history/${regNo}`),
          apiRequest(`${END_POINT}/service-history/get-maintenance-history/${regNo}`),
          apiRequest(`${END_POINT}/service-history/get-tyre-history/${regNo}`),
          apiRequest(`${END_POINT}/service-history/get-battery-history/${regNo}`)
        ]);

        const responses = await Promise.all(allPromises);
        const allData = await Promise.all(responses.map(res => res.json()));

        // Combine all service histories
        const combinedService = [];
        const combinedMaintenance = [];
        const combinedTyre = [];
        const combinedBattery = [];

        regNoArray.forEach((regNo, idx) => {
          const offset = idx * 4;
          combinedService.push(...(allData[offset].data || []));
          combinedMaintenance.push(...(allData[offset + 1].data || []));
          combinedTyre.push(...(allData[offset + 2].data || []));
          combinedBattery.push(...(allData[offset + 3].data || []));
        });

        setServiceHistory(combinedService);
        setMaintenanceHistory(combinedMaintenance);
        setTyreHistory(combinedTyre);
        setBatteryHistory(combinedBattery);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching service histories:', error);
        setError('Failed to fetch service records. Please try again.');
        setLoading(false);
      }
    };

    fetchAllHistories();

    const fetchEquipmentDetails = async () => {
      try {
        if (isMultipleEquipment) {
          // Fetch each equipment individually
          const equipmentPromises = regNoArray.map(regNo =>
            apiRequest(`${END_POINT}/equipments/get-equipment/${regNo}`, 'GET')
          );

          const responses = await Promise.all(equipmentPromises);
          const equipmentDataArray = await Promise.all(
            responses.map(res => res.json())
          );

          // FIXED: The API returns { data: [equipmentObject] }, so we need to access [0]
          const equipments = equipmentDataArray
            .map(response => {
              // Check if data is an array and get first element, or use data directly
              const equipmentData = Array.isArray(response.data)
                ? response.data[0]
                : response.data;
              return equipmentData;
            })
            .filter(eq => eq !== null && eq !== undefined);

          console.log("equipments", equipments);

          setMultipleEquipmentData(equipments);
          setEquipmentData(equipments[0] || null);
        } else {
          // Single equipment - use the specific endpoint
          const response = await apiRequest(
            `${END_POINT}/equipments/get-equipment/${regNoArray[0]}`,
            'GET'
          );
          const data = await response.json();

          // Handle both cases: data as array or object
          const equipmentData = Array.isArray(data.data) ? data.data[0] : data.data;

          if (equipmentData) {
            setEquipmentData(equipmentData);
          }
        }
      } catch (err) {
        console.error("Could not load equipment data:", err);
      }
    };

    if (regNoArray.length > 0) {
      fetchEquipmentDetails();
    }
  }, [regNoArray]);

  useEffect(() => {
    const processData = async () => {
      let combinedData = [];

      if (activeTab === 'all') {
        const serviceWithType = serviceHistory.map(item => ({
          ...item,
          serviceType: item.serviceType || 'oil',
          regNo: item.regNo || item.equipmentId
        }));
        const maintenanceWithType = maintenanceHistory.map(item => ({
          ...item,
          serviceType: 'maintenance',
          regNo: item.regNo || item.equipmentId
        }));
        const tyreWithType = tyreHistory.map(item => ({
          ...item,
          serviceType: 'tyre',
          regNo: item.equipmentNo || item.equipmentId
        }));
        const batteryWithType = batteryHistory.map(item => ({
          ...item,
          serviceType: 'battery',
          regNo: item.equipmentNo || item.equipmentId
        }));

        combinedData = [...serviceWithType, ...maintenanceWithType, ...tyreWithType, ...batteryWithType];

      } else if (activeTab === 'normal') {
        combinedData = serviceHistory
          .filter(item => item.serviceType === 'normal')
          .map(item => ({
            ...item,
            regNo: item.regNo || item.equipmentId
          }));

      } else if (activeTab === 'oil') {
        combinedData = serviceHistory
          .filter(item => !item.serviceType)
          .map(item => ({
            ...item,
            serviceType: 'oil',
            regNo: item.regNo || item.equipmentId
          }));

      } else if (activeTab === 'maintenance') {
        combinedData = maintenanceHistory.map(item => ({
          ...item,
          serviceType: 'maintenance',
          regNo: item.regNo || item.equipmentId
        }));

      } else if (activeTab === 'tyre') {
        combinedData = tyreHistory.map(item => ({
          ...item,
          serviceType: 'tyre',
          regNo: item.equipmentNo || item.equipmentId
        }));

      } else if (activeTab === 'battery') {
        combinedData = batteryHistory.map(item => ({
          ...item,
          serviceType: 'battery',
          regNo: item.equipmentNo || item.equipmentId
        }));
      }

      // Filter for this specific equipment
      const equipmentData = combinedData.filter(item =>
        regNoArray.includes(item.regNo?.toString().trim())
      );

      // Apply date filter
      let dateFilteredData = equipmentData.filter(item => isDateInRange(item.date));

      // Apply additional filters from modal
      if (filters.serviceTypes.length > 0) {
        dateFilteredData = dateFilteredData.filter(item =>
          filters.serviceTypes.includes(item.serviceType)
        );
      }

      if (filters.serviceHoursRange.min || filters.serviceHoursRange.max) {
        dateFilteredData = dateFilteredData.filter(item => {
          if (!item.serviceHrs && !item.runningHours) return true;
          const hours = item.serviceHrs || item.runningHours || 0;
          const min = filters.serviceHoursRange.min ? parseInt(filters.serviceHoursRange.min) : 0;
          const max = filters.serviceHoursRange.max ? parseInt(filters.serviceHoursRange.max) : Infinity;
          return hours >= min && hours <= max;
        });
      }

      if (filters.hasRemarks) {
        if (filters.hasRemarks === 'yes') {
          dateFilteredData = dateFilteredData.filter(item =>
            item.remarks || item.majorRemarks || item.workRemarks
          );
        } else if (filters.hasRemarks === 'no') {
          dateFilteredData = dateFilteredData.filter(item =>
            !item.remarks && !item.majorRemarks && !item.workRemarks
          );
        }
      }

      // Fetch remarks for ALL items
      const [regularData, majorData] = await Promise.all([
        fetchRemarksAndLocationForServices(dateFilteredData),
        fetchServiceReportforMajor(dateFilteredData)
      ]);

      // Merge the two results
      const mergedData = dateFilteredData.map(item => {
        if (item.serviceType === 'maintenance') {
          const enhanced = majorData.find(d => d._id === item._id);
          return enhanced || item;
        } else {
          const enhanced = regularData.find(d => d._id === item._id);
          return enhanced || item;
        }
      });

      // Sort by date (newest first)
      mergedData.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply search filter
      const results = mergedData.filter(item => {
        if (!searchTerm) return true;
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      setFilteredData(results);
    };

    processData();
  }, [serviceHistory, maintenanceHistory, tyreHistory, batteryHistory, regNoArray, searchTerm, activeTab, dateFilter, lastMonthsCount, customStartDate, customEndDate, filters]);

  // Group data by equipment after filteredData is set
  useEffect(() => {
    if (isMultipleEquipment) {
      setGroupedData(groupByEquipment(filteredData));
    } else {
      setGroupedData({ [regNoArray[0]]: filteredData });
    }
  }, [filteredData, isMultipleEquipment, regNoArray]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm(''); // Clear search when changing tabs
  };

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter === 'custom') {
      setShowCustomDateInputs(true);
    } else {
      setShowCustomDateInputs(false);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const loadImageAsDataURL = (imageSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS if needed
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  const handleExportToPDF = async () => {
    if (!isDocumentSigned) {
      setPendingAction('pdf');
      setShowWarningModal(true);
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape', 'mm', 'a4');

      const tabName = activeTab === 'all' ? 'All Services' :
        activeTab === 'oil' ? 'Oil Service' :
          activeTab === 'maintenance' ? 'Major Works' :
            activeTab === 'tyre' ? 'Tyre Service' : 'Battery Service';

      const equipmentTitle = isMultipleEquipment
        ? `Equipments (${regNoArray.join(', ')})`
        : `${equipmentData ? equipmentData.machine : 'Equipment'} ${regNoArray[0]}`;

      let currentY = 10;

      try {
        const [leftLogoData, rightLogoData] = await Promise.all([
          loadImageAsDataURL(logoImage),
          loadImageAsDataURL(alAnsariText)
        ]);

        doc.addImage(leftLogoData, 'PNG', 10, currentY, 40, 24);
        doc.addImage(rightLogoData, 'PNG', 237, currentY, 50, 24);
      } catch (error) {
        console.error('Error adding logos:', error);
      }

      currentY += 30;

      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`${tabName} History - ${equipmentTitle}`, 148, currentY, { align: 'center' });

      currentY += 7;

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Date Range: ${getDateRangeText()}`, 148, currentY, { align: 'center' });

      currentY += 6;

      if (searchTerm) {
        doc.setFontSize(10);
        doc.text(`Search Term: "${searchTerm}"`, 148, currentY, { align: 'center' });
        currentY += 6;
      }

      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 148, currentY, { align: 'center' });
      currentY += 10;

      const headers = [
        'Date',
        ...(activeTab === 'all' ? ['Service Type'] : []),
        'Work Description',
        ...((activeTab === 'oil' || activeTab === 'all') ? ['Serviced Hrs/Km', 'Next Service', 'Next Full Service'] : []),
        ...((activeTab === 'tyre' || activeTab === 'all') ? ['Location', 'Tyre Model'] : []),
        ...((activeTab === 'battery' || activeTab === 'all') ? ['Battery Model'] : []),
        'Remarks'
      ];

      const tableData = [];
      Object.entries(groupedData).forEach(([regNo, items]) => {
        if (isMultipleEquipment) {
          const equipment = multipleEquipmentData.find(eq => eq.regNo?.toString().trim() === regNo?.toString().trim());
          tableData.push([{
            content: `${equipment?.machine || 'Equipment'} - Reg No: ${regNo}`,
            colSpan: headers.length,
            styles: { fontStyle: 'bold', fillColor: [211, 211, 211], halign: 'left' }
          }]);
        }

        items.forEach(item => {
          const row = [
            formatDate(item.date),
            ...(activeTab === 'all' ? [getServiceTypeBadge(item.serviceType).text] : []),
            getWorkDescriptionForPDF(item),
            ...((activeTab === 'oil' || activeTab === 'normal' || activeTab === 'maintenance' || activeTab === 'all') ? [
              ['oil', 'normal', 'maintenance'].includes(item.serviceType) ? item.serviceHrs : item.serviceType === 'tyre' ? item.runningHours : '-',
              ['oil', 'normal', 'maintenance'].includes(item.serviceType) ? (item.nextServiceHrs === 0 ? '' : item.nextServiceHrs) : '-',
              ...(activeTab === 'oil' || activeTab === 'all' ? [item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-'] : [])
            ] : []),
            ...((activeTab === 'tyre' || activeTab === 'all') ? [
              item.serviceType === 'tyre' && item.location ? item.location : '-',
              item.serviceType === 'tyre' ? item.tyreModel : '-'
            ] : []),
            ...((activeTab === 'battery' || activeTab === 'all') ? [
              item.serviceType === 'battery' ? item.batteryModel : '-'
            ] : []),
            getRemarksText(item)
          ];
          tableData.push(row);
        });
      });

      const getRowColor = (rowIndex) => {
        let dataIndex = rowIndex;
        let currentEquipment = null;

        for (const [regNo, items] of Object.entries(groupedData)) {
          if (isMultipleEquipment) {
            if (dataIndex === 0) return [211, 211, 211];
            dataIndex--;
          }

          if (dataIndex < items.length) {
            const item = items[dataIndex];
            if (item.fullService || item.replaced) {
              return [255, 211, 165];
            }

            switch (item.serviceType) {
              case 'oil':
                return [232, 245, 232];
              case 'maintenance':
                return [255, 243, 205];
              case 'tyre':
                return [209, 236, 241];
              case 'battery':
                return [248, 215, 218];
              default:
                return [255, 255, 255];
            }
          }

          dataIndex -= items.length;
        }

        return [255, 255, 255];
      };

      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          ...(activeTab === 'all' ? { 1: { cellWidth: 20 } } : {}),
        },
        didParseCell: function (data) {
          if (data.row.index >= 0 && data.section === 'body') {
            const color = getRowColor(data.row.index);
            data.cell.styles.fillColor = color;
          }
        },
        margin: { top: 10, left: 10, right: 10 }
      });

      const signatureY = doc.lastAutoTable.finalY + 15;

      doc.setTextColor(0, 0, 0);

      if (supervisorSignUrl) {
        try {
          const signatureData = await loadImageAsDataURL(supervisorSignUrl);
          doc.addImage(signatureData, 'PNG', 10, signatureY, 50, 20);
        } catch (error) {
          console.error('Error adding signature:', error);
          doc.setFontSize(10);
          doc.setFont(undefined, 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('Not Signed', 10, signatureY);
        }
      } else {
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('Not Signed', 10, signatureY);
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const detailsY = signatureY + 25;
      doc.text('Firoz Khan', 10, detailsY);
      doc.text('Workshop Manager', 10, detailsY + 6);
      doc.text('+974 5170 0481', 10, detailsY + 12);

      const dateFilterSuffix = dateFilter === 'all' ? '' :
        dateFilter === 'lastXmonths' ? `_Last_${lastMonthsCount}_Months` :
          dateFilter === 'thismonth' ? '_This_Month' :
            dateFilter === 'custom' && customStartDate && customEndDate ? `_${customStartDate}_to_${customEndDate}` : '';

      const fileName = `${tabName.replace(/\s+/g, '_')}_${isMultipleEquipment ? 'Multiple_Equipment' : regNoArray[0]}${dateFilterSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);

    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };

  // Navigate to add service form based on active tab
  const handleAddService = () => {
    switch (activeTab) {
      case 'normal':
        navigate(`/service-history-form/${regNoArray[0]}`);
        break;
      case 'oil':
        navigate(`/service-history-form/${regNoArray[0]}`);
        break;
      case 'maintenance':
        navigate(`/maintenance-history-form/${regNoArray[0]}`);
        break;
      case 'tyre':
        navigate(`/tyre-history-form/${regNoArray[0]}`);
        break;
      case 'battery':
        navigate(`/battery-history-form/${regNoArray[0]}`);
        break;
      default:
        navigate(`/service-form-nav/${regNoArray[0]}`);
    }
  };

  // Navigate to view all documents based on active tab and date filter
  const handleViewAllDocuments = () => {
    let basePath = '';

    // Determine base path based on active tab
    switch (activeTab) {
      case 'all':
        basePath = `/all/all-histories/${regNoArray[0]}`;
        break;
      case 'oil':
        basePath = `/all/oil-service/${regNoArray[0]}`;
        break;
      case 'maintenance':
        basePath = `/all/maintenance-service/${regNoArray[0]}`;
        break;
      case 'tyre':
        basePath = `/all/tyre-service/${regNoArray[0]}`;
        break;
      case 'battery':
        basePath = `/all/battery-service/${regNoArray[0]}`;
        break;
      default:
        basePath = `/all/all-histories/${regNoArray[0]}`;
    }

    // Add date range parameters if custom date filter is selected
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const formattedStartDate = formatDate(customStartDate).replace(/-/g, '-');
      const formattedEndDate = formatDate(customEndDate).replace(/-/g, '-');
      basePath = `/all/date-range/${regNoArray[0]}/${formattedStartDate}/${formattedEndDate}`;
    } else if (dateFilter === 'lastXmonths') {
      basePath = `/all/last-months/${regNoArray[0]}/${lastMonthsCount}`;
    } else if (dateFilter === 'thismonth') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const formattedStartDate = formatDate(firstDay).replace(/-/g, '-');
      const formattedEndDate = formatDate(lastDay).replace(/-/g, '-');
      basePath = `/all/date-range/${regNoArray[0]}/${formattedStartDate}/${formattedEndDate}`;
    }

    navigate(basePath);
  };

  const handleRowClick = (date, serviceType, historyId) => {
    navigate(`/service-document/${historyId}`, {
      state: {
        regNo: regNoArray[0],
        date: date,
        serviceType: serviceType,
        historyId: historyId,
        docType: serviceType === 'maintenance' ? 'maintenance-doc'
          : serviceType === 'tyre' ? 'tyre-doc'
            : serviceType === 'battery' ? 'battery-doc'
              : 'service-doc'
      }
    });
  };

  const handleDeleteReport = (item) => {
    console.log("itemssssssss" , item);
    
    setDeleteReport(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteReport = async () => {
    let url

    if (deleteReport.serviceType == 'oil') {
      url = `${END_POINT}/service-history/delete-service-history/oil/${deleteReport._id}`
    } else if (deleteReport.serviceType == 'tyre') {
      url = `${END_POINT}/service-history/delete-service-history/tyre/${deleteReport._id}`
    } else if (deleteReport.serviceType == 'battery') {
      url = `${END_POINT}/service-history/delete-service-history/battery/${deleteReport._id}`
    } else if (deleteReport.serviceType == 'normal') {
      url = `${END_POINT}/service-history/delete-service-history/oil/${deleteReport._id}`
    } else {
      url = `${END_POINT}/service-history/delete-service-history/maintenance/${deleteReport._id}`
    }
    const response = await apiRequest(url, 'DELETE')
    const data = await response.json()

    console.log("dataaaaaaaaaaaaaa", data);
    

    if (data.success) {
      window.location.reload()
    }
  };

  // Get date range display text
  const getDateRangeText = () => {
    switch (dateFilter) {
      case 'all':
        return 'All Time';
      case 'lastXmonths':
        return `Last ${lastMonthsCount} Month${lastMonthsCount !== 1 ? 's' : ''}`;
      case 'thismonth':
        return 'This Month';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${formatDate(customStartDate)} to ${formatDate(customEndDate)}`;
        }
        return 'Custom Date Range';
      default:
        return 'All Time';
    }
  };

  const handleExportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Service History');

      const equipmentTitle = isMultipleEquipment
        ? `Equipments (${regNoArray.join(', ')})`
        : `${equipmentData ? equipmentData.machine : 'Equipment'} ${regNoArray[0]}`;

      const tabName = activeTab === 'all' ? 'All Services' :
        activeTab === 'oil' ? 'Oil Service' :
          activeTab === 'maintenance' ? 'Major Works' :
            activeTab === 'tyre' ? 'Tyre Service' : 'Battery Service';

      let currentRow = 1;

      const titleCell = worksheet.getCell('A1');
      titleCell.value = `${tabName} History - ${equipmentTitle}`;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 45;

      currentRow++;
      const subtitleCell = worksheet.getCell(`A${currentRow}`);
      subtitleCell.value = `Date Range: ${getDateRangeText()}`;
      subtitleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 45;

      if (searchTerm) {
        currentRow++;
        const searchCell = worksheet.getCell(`A${currentRow}`);
        searchCell.value = `Search Term: "${searchTerm}"`;
        searchCell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
        searchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
        searchCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(currentRow).height = 45;
      }

      currentRow++;
      worksheet.getRow(currentRow).height = 20;

      currentRow++;
      const timestampCell = worksheet.getCell(`A${currentRow}`);
      timestampCell.value = `Report Generated: ${new Date().toLocaleString()}`;
      timestampCell.font = { italic: true, size: 11, color: { argb: 'FF7F7F7F' } };
      timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 45;

      currentRow++;
      worksheet.getRow(currentRow).height = 20;

      const headers = [
        'Date',
        ...(activeTab === 'all' ? ['Service Type'] : []),
        'Work Description',
        ...((activeTab === 'oil' || activeTab === 'all') ? ['Serviced Hrs/Km', 'Next Service', 'Next Full Service'] : []),
        ...((activeTab === 'tyre' || activeTab === 'all') ? ['Location', 'Tyre Model'] : []),
        ...((activeTab === 'battery' || activeTab === 'all') ? ['Battery Model'] : []),
        'Remarks'
      ];

      currentRow++;
      const headerRow = worksheet.getRow(currentRow);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 45;

      const colWidths = [
        15,
        ...(activeTab === 'all' ? [15] : []),
        40,
        ...((activeTab === 'oil' || activeTab === 'all') ? [15, 15, 18] : []),
        ...((activeTab === 'tyre' || activeTab === 'all') ? [20, 25] : []),
        ...((activeTab === 'battery' || activeTab === 'all') ? [25] : []),
        40
      ];

      colWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });

      // Add grouped data rows
      Object.entries(groupedData).forEach(([regNo, items]) => {
        if (isMultipleEquipment) {
          currentRow++;
          const equipment = multipleEquipmentData.find(eq => eq.regNo?.toString().trim() === regNo?.toString().trim());
          const equipHeaderRow = worksheet.getRow(currentRow);
          equipHeaderRow.getCell(1).value = `${equipment?.machine || 'Equipment'} - Reg No: ${regNo}`;
          worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + headers.length)}${currentRow}`);
          equipHeaderRow.getCell(1).font = { bold: true, size: 12 };
          equipHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
          equipHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
          equipHeaderRow.getCell(1).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          equipHeaderRow.height = 35;
        }

        items.forEach((item) => {
          currentRow++;
          const dataRow = worksheet.getRow(currentRow);

          const rowData = [
            formatDate(item.date),
            ...(activeTab === 'all' ? [getServiceTypeBadge(item.serviceType).text] : []),
            getWorkDescription(item),
            ...((activeTab === 'oil' || activeTab === 'normal' || activeTab === 'maintenance' || activeTab === 'all') ? [
              ['oil', 'normal', 'maintenance'].includes(item.serviceType) ? item.serviceHrs : item.serviceType === 'tyre' ? item.runningHours : '-',
              ['oil', 'normal', 'maintenance'].includes(item.serviceType) ? (item.nextServiceHrs === 0 ? '' : item.nextServiceHrs) : '-',
              ...(activeTab === 'oil' || activeTab === 'all' ? [item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-'] : [])
            ] : []),
            ...((activeTab === 'tyre' || activeTab === 'all') ? [
              item.serviceType === 'tyre' && item.location ? item.location : '-',
              item.serviceType === 'tyre' ? item.tyreModel : '-'
            ] : []),
            ...((activeTab === 'battery' || activeTab === 'all') ? [
              item.serviceType === 'battery' ? item.batteryModel : '-'
            ] : []),
            getRemarksText(item)
          ];

          rowData.forEach((value, colIndex) => {
            dataRow.getCell(colIndex + 1).value = value;
          });

          dataRow.height = 45;

          let bgColor = 'FFFFFFFF';
          switch (item.serviceType) {
            case 'oil':
              bgColor = 'FFE8F5E8';
              break;
            case 'maintenance':
              bgColor = 'FFFFF3CD';
              break;
            case 'tyre':
              bgColor = 'FFD1ECF1';
              break;
            case 'battery':
              bgColor = 'FFF8D7DA';
              break;
          }

          if (item.fullService || item.replaced) {
            bgColor = 'FFFFD3A5';
          }

          dataRow.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.font = { size: 11 };
          });
        });
      });

      worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
      worksheet.mergeCells(`A2:${String.fromCharCode(64 + headers.length)}2`);

      if (searchTerm) {
        worksheet.mergeCells(`A3:${String.fromCharCode(64 + headers.length)}3`);
        worksheet.mergeCells(`A5:${String.fromCharCode(64 + headers.length)}5`);
      } else {
        worksheet.mergeCells(`A4:${String.fromCharCode(64 + headers.length)}4`);
      }

      const dateFilterSuffix = dateFilter === 'all' ? '' :
        dateFilter === 'lastXmonths' ? `_Last_${lastMonthsCount}_Months` :
          dateFilter === 'thismonth' ? '_This_Month' :
            dateFilter === 'custom' && customStartDate && customEndDate ? `_${customStartDate}_to_${customEndDate}` : '';

      const fileName = `${tabName.replace(/\s+/g, '_')}_${isMultipleEquipment ? 'Multiple_Equipment' : regNoArray[0]}${dateFilterSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting service history:', error);
      alert('Failed to export service history. Please try again.');
    }
  };

  // Helper function to get work description text
  const getWorkDescription = (item) => {
    if (item.serviceType === 'oil') {
      return `Filters: Fuel Filter: ${item.fuelFilter}, Water Sep: ${item.waterSeparator}\nAir Filter: ${item.airFilter}${item.acFilter ? `, A/C Filter: ${item.acFilter}` : ''}`;
    }
    return item.workRemarks?.toUpperCase() || '-';
  };

  // Helper function for PDF-friendly work description (no newlines)
  const getWorkDescriptionForPDF = (item) => {
    if (item.serviceType === 'oil' || item.serviceType === 'normal') {
      return `Filters: Fuel Filter: ${item.fuelFilter || '-'}, Water Sep: ${item.waterSeparator || '-'}, Air Filter: ${item.airFilter || '-'}${item.acFilter ? `, A/C Filter: ${item.acFilter}` : ''}`;
    }
    return item.workRemarks?.toUpperCase() || '-';
  };

  const getRemarksText = (item) => {
    if (item.serviceType === 'oil' || item.serviceType === 'normal') {
      return item.remarks?.toUpperCase() || '';
    } else if (item.serviceType === 'maintenance') {
      return item.majorRemarks?.toUpperCase() || item.workRemarks?.toUpperCase() || '';
    } else if (item.serviceType === 'tyre' || item.serviceType === 'battery') {
      return item.remarks?.toUpperCase() || '';
    }
    return '';
  };

  const handlePrint = () => {
    if (!isDocumentSigned) {
      setPendingAction('print');
      setShowWarningModal(true);
      return;
    }

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
        .oil-service { background-color: #e8f5e8 !important; }
        .maintenance-service { background-color: #fff3cd !important; }
        .tyre-service { background-color: #d1ecf1 !important; }
        .battery-service { background-color: #f8d7da !important; }
        .full-service-row { background-color: #ffd3a5 !important; }
        .replacement-row { background-color: #ffd3a5 !important; }
        .document-column { display: none !important; }
        .date-th { min-width: 6rem !important; }
        .logo-header { max-width: 4rem !important}
      </style>
    `;

    const tabName = activeTab === 'all' ? 'All Services' :
      activeTab === 'oil' ? 'Oil Service' :
        activeTab === 'maintenance' ? 'Major Works' :
          activeTab === 'tyre' ? 'Tyre Service' : 'Battery Service';

    const equipmentTitle = isMultipleEquipment
      ? `Equipments (${regNoArray.join(', ')})`
      : `${equipmentData ? equipmentData.machine : 'Equipment'} ${regNoArray[0]}`;

    const content = `
      <html>
        <head>
          <title>${tabName} History</title>
          ${style}
          <style>
            table {
              font-size: 12px !important;
              width: auto !important;
              max-width: 100% !important;
            }
            
            table th, 
            table td {
              padding: 4px 8px !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              white-space: nowrap;
            }
            
            /* Increase width of work description column (3rd column) */
            table th:nth-child(3),
            table td:nth-child(3) {
              max-width: 170px !important;
              width: 170px !important;
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow: hidden !important;
              font-size: 12px !important;
            }
            
            table th:nth-child(4), table td:nth-child(4){
              max-width: 70px !important;
              width: 70px !important;
              font-size: 12px !important;
              padding: 2px 4px !important;
              word-wrap: break-word !important;
              overflow: hidden !important;
              white-space: normal !important;
            }

            table th:nth-child(2), table td:nth-child(2),
            table th:nth-child(5), table td:nth-child(5),
            table th:nth-child(6), table td:nth-child(6),
            table th:nth-child(8), table td:nth-child(8),
            table th:nth-child(9), table td:nth-child(9){
              max-width: 50px !important;
              width: 50px !important;
              font-size: 12px !important;
              padding: 2px 4px !important
              word-wrap: break-word !important;
              overflow: hidden !important;
              white-space: normal !important;
            }

            table th:nth-child(7), table td:nth-child(7) {
              max-width: 90px !important;
              width: 90px !important;
              font-size: 12px !important;
              padding: 2px 4px !important
              word-wrap: break-word !important;
              overflow: hidden !important;
              white-space: normal !important;
            }
            
            table th:nth-child(10), table td:nth-child(10) {
              max-width: 230px !important;
              width: 230px !important;
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow: hidden !important;
              font-size: 12px !important;
              padding: 2px 3px !important;
              text-overflow: ellipsis !important;
            }
            
            table th {
              font-size: 12px !important;
              font-weight: bold;
            }
            
            /* Ensure header doesn't affect table layout */
            .header-container {
              margin-bottom: 20px;
            }
            
            /* Make sure the table container doesn't expand */
            .table-container {
              overflow-x: auto;
              max-width: 100%;
            }

            .view-more-btn {
              display: none
            }
          </style>
        </head>
        <body>
          <div class="header-container" style="display:flex; justify-content: space-between; padding-inline: 1rem; align-items: center;">
            <img style="width: 10rem; max-height: 6rem;" src=${logoImage} alt="Company Logo" />
            <img style="width: 18rem; max-height: 6rem;" src=${alAnsariText} alt="Company Logo" />
          </div>
          <div style="display: flex; width: 100%; gap:1rem; justify-content: center; align-items: center">
            <h2 style="font-weight: 700; text-align: center">${tabName} History -</h2>
            <h3 style="font-weight: 500; text-align: center">${equipmentTitle} -</h3>
            <p>Date Range: ${getDateRangeText()}</p>
          </div>
          ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
          <div class="table-container">
            ${tableRef.current?.outerHTML}
          </div>
          <div style="margin-top: 10px; text-align: center;">
            Showing ${filteredData.length} ${searchTerm ? 'matching entries' : 'entries'}
          </div>
         <div style="display:flex; gap: 0.5rem; justify-content: center; align-items: start; flex-direction: column; margin-top: 1rem;">
            ${supervisorSignUrl ? `<img src="${supervisorSignUrl}" alt="Supervisor Signature" style="max-width: 150px; max-height: 60px;" />` : '<span style="font-style: italic; color: #999;">Not Signed</span>'}
            <p style="font-size: 18px; font-weight: 400; margin: 0;">Firoz Khan</p>
            <p style="font-size: 18px; font-weight: 400; margin: 0;">Workshop Manager</p>
            <p style="font-size: 18px; font-weight: 400; margin: 0;">+974 5170 0481</p>
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

  // Get service type badge
  const getServiceTypeBadge = (serviceType) => {
    const badges = {
      normal: { text: 'Normal', className: 'badge-normal' },
      oil: { text: 'Oil', className: 'badge-oil' },
      maintenance: { text: 'Major Works', className: 'badge-maintenance' },
      tyre: { text: 'Tyre', className: 'badge-tyre' },
      battery: { text: 'Battery', className: 'badge-battery' }
    };
    return badges[serviceType] || { text: 'Unknown', className: 'badge-default' };
  };

  // Count records by type (filtered by date)
  const getFilteredCount = (data) => {
    return data.filter(item => isDateInRange(item.date)).length;
  };

  const recordCounts = {
    all: getFilteredCount([...serviceHistory, ...maintenanceHistory, ...tyreHistory, ...batteryHistory]),
    normal: getFilteredCount(serviceHistory.filter(item => item.serviceType === 'normal')),
    oil: getFilteredCount(serviceHistory.filter(item => !item.serviceType)),
    maintenance: getFilteredCount(maintenanceHistory),
    tyre: getFilteredCount(tyreHistory),
    battery: getFilteredCount(batteryHistory)
  };


  return (
    <div className="service-history-container-cnt">
      {/* Delete Confirmation Modal */}
      <DevModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="error"
        title="Delete Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={confirmDeleteReport}
        onSecondaryClick={() => setShowDeleteModal(false)}
      />

      {/* Filters Modal */}
      <DevModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="Service History Filters"
        message="Customize your view with advanced filtering options"
        filterGroups={[
          {
            name: 'dateFilter',
            label: 'Date Range',
            type: 'select',
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'thismonth', label: 'This Month' },
              { value: 'lastXmonths', label: 'Last X Months' },
              { value: 'custom', label: 'Custom Range' }
            ]
          },
          ...(filters.dateFilter === 'lastXmonths' ? [{
            name: 'lastMonthsCount',
            label: 'Number of Months',
            type: 'select',
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => ({ value: n, label: `${n} Month${n > 1 ? 's' : ''}` }))
          }] : []),
          ...(filters.dateFilter === 'custom' ? [
            {
              name: 'customStartDate',
              label: 'Start Date',
              type: 'date'
            },
            {
              name: 'customEndDate',
              label: 'End Date',
              type: 'date'
            }
          ] : []),
          {
            name: 'serviceTypes',
            label: 'Service Types',
            type: 'checkbox',
            options: [
              { value: 'oil', label: 'Oil Service' },
              { value: 'normal', label: 'Normal Service' },
              { value: 'maintenance', label: 'Major Works' },
              { value: 'tyre', label: 'Tyre Service' },
              { value: 'battery', label: 'Battery Service' }
            ]
          },
          {
            name: 'serviceHoursRange',
            label: 'Service Hours Range',
            type: 'range'
          },
          {
            name: 'hasRemarks',
            label: 'Has Remarks',
            type: 'select',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]
          }
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        buttonText="Apply Filters"
      />

      <div className="controls-bar">
        <div className="action-buttons left">
          <Button
            text="Filters"
            onClick={() => setShowFiltersModal(true)}
            colorScheme="violet-800"
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
            text={dateFilter === 'custom' && customStartDate && customEndDate
              ? 'View Date Range Data'
              : dateFilter === 'lastXmonths'
                ? `View Last ${lastMonthsCount} Months Data`
                : dateFilter === 'thismonth'
                  ? 'View This Month Data'
                  : `View All ${activeTab === 'all' ? 'Documents' :
                    activeTab === 'oil' ? 'Oil Service' :
                      activeTab === 'maintenance' ? 'Major Works' :
                        activeTab === 'tyre' ? 'Tyre Service' : 'Battery Service'}`}
            onClick={handleViewAllDocuments}
            colorScheme="lime-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="fit-content"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
        <div className="action-buttons right">
          <Button
            text={
              activeTab === 'oil'
                ? 'Add Oil Service'
                : activeTab === 'maintenance'
                  ? ' Add Major Work'
                  : activeTab === 'tyre'
                    ? 'Add Tyre Service'
                    : activeTab === 'battery'
                      ? 'Add Battery Service'
                      : 'Add Service'
            }
            onClick={() => handleAddService(true)}
            colorScheme="info-800"
            variant="gradient"
            font="md"
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Export to Excel"
            onClick={handleExportToExcel}
            colorScheme="primary-800"
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
            onClick={handlePrint}
            colorScheme="success-800"
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
            text="Export to PDF"
            onClick={handleExportToPDF}
            colorScheme="fuchsia-800"
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

      {loading ? (
        <div className="loading">Loading service history data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="service-table-container">
          <table className="service-table" ref={tableRef}>
            <thead>
              <tr>
                <th className='date-th'>Date</th>
                {activeTab === 'all' && <th>Service Type</th>}
                <th>Work Description</th>
                {(activeTab === 'oil' || activeTab === 'normal' || activeTab === 'maintenance' || activeTab === 'all') && (
                  <>
                    <th>Serviced Hrs/ Km</th>
                    <th>Next Service</th>
                    {(activeTab === 'oil' || activeTab === 'all') && <th>Next Full Service</th>}
                  </>
                )}
                {(activeTab === 'tyre' || activeTab === 'all') && (
                  <>
                    <th>Location</th>
                    <th>Tyre Model</th>
                  </>
                )}
                {(activeTab === 'battery' || activeTab === 'all') && (
                  <>
                    <th>Battery Model</th>
                  </>
                )}
                <th>Remarks</th>
                <th className="document-column">Document</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedData).length > 0 ? (
                Object.entries(groupedData).map(([regNo, items]) => {
                  const equipment = multipleEquipmentData.find(eq => eq.regNo?.toString().trim() === regNo?.toString().trim());
                  return (
                    <React.Fragment key={regNo}>
                      {isMultipleEquipment && (
                        <tr className="equipment-header-row">
                          <td colSpan="16">
                            {equipment?.machine || 'Equipment'} - Reg No: {regNo}
                          </td>
                        </tr>
                      )}
                      {items.map((item, index) => {
                        const badge = getServiceTypeBadge(item.serviceType);
                        return (
                          <tr key={`${regNo}-${index}`} className={`${item.serviceType}-service ${item.fullService ? 'full-service-row' : ''} ${item.replaced ? 'replacement-row' : ''}`}>
                            <td>{formatDate(item.date)}</td>
                            {activeTab === 'all' && (
                              <td>
                                <span className={`service-badge ${badge.className}`}>
                                  {item.fullService ? 'Full Service' : badge.text}
                                </span>
                              </td>
                            )}
                            <td style={{ textAlign: 'left' }}>
                              {(item.serviceType === 'oil' || item.serviceType === 'normal') && (
                                <div>
                                  <div><strong>Fuel Filter: </strong>{item.fuelFilter}, <strong>Water Sep: </strong>{item.waterSeparator}</div>
                                  <div><strong>Air Filter:</strong> {item.airFilter}, <strong>A/C Filter:</strong> {item.acFilter ? item.acFilter : ''}</div>
                                </div>
                              )}
                            </td>
                            {(activeTab === 'oil' || activeTab === 'normal' || activeTab === 'maintenance' || activeTab === 'all') && (
                              <>
                                <td>{(item.serviceType === 'oil' || item.serviceType === 'normal' || item.serviceType === 'maintenance') ? item.serviceHrs : item.serviceType === 'tyre' ? item.runningHours : '-'}</td>
                                <td>{(item.serviceType === 'oil' || item.serviceType === 'normal' || item.serviceType === 'maintenance') ? (item.nextServiceHrs == 0 ? '' : item.nextServiceHrs) : '-'}</td>
                                {(activeTab === 'oil' || activeTab === 'all') && (
                                  <td>{item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-'}</td>
                                )}
                              </>
                            )}
                            {(activeTab === 'tyre' || activeTab === 'all') && (
                              <>
                                <td>{item.location ? item.location : '-'}</td>
                                <td>{item.serviceType === 'tyre' ? item.tyreModel : '-'}</td>
                              </>
                            )}
                            {(activeTab === 'battery' || activeTab === 'all') && (
                              <>
                                <td>{item.serviceType === 'battery' ? item.batteryModel : '-'}</td>
                              </>
                            )}
                            <td style={{ textAlign: 'left' }} className="remarks-cell">
                              {(item.serviceType === 'oil' || item.serviceType === 'normal') && item.remarks && (
                                <div className="remarks-content">
                                  <div className={expandedRemarks[`${regNo}-${index}`] ? 'remarks-text expanded' : 'remarks-text'}>
                                    {item.remarks?.toUpperCase()}
                                  </div>
                                  {item.remarks.length > 100 && (
                                    <button
                                      className="view-more-btn no-print"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRemarkExpansion(`${regNo}-${index}`);
                                      }}
                                    >
                                      {expandedRemarks[`${regNo}-${index}`] ? 'View Less' : 'View More'}
                                    </button>
                                  )}
                                </div>
                              )}
                              {item.serviceType === 'maintenance' && (item.majorRemarks || item.workRemarks) && (
                                <div className="remarks-content">
                                  <div className={expandedRemarks[`${regNo}-${index}`] ? 'remarks-text expanded' : 'remarks-text'}>
                                    {item.majorRemarks?.toUpperCase() || item.workRemarks?.toUpperCase()}
                                  </div>
                                  {(item.majorRemarks?.length > 100 || item.workRemarks?.length > 100) && (
                                    <button
                                      className="view-more-btn no-print"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRemarkExpansion(`${regNo}-${index}`);
                                      }}
                                    >
                                      {expandedRemarks[`${regNo}-${index}`] ? 'View Less' : 'View More'}
                                    </button>
                                  )}
                                </div>
                              )}
                              {(item.serviceType === 'tyre' || item.serviceType === 'battery') && item.remarks && (
                                <div className="remarks-content">
                                  <div className={expandedRemarks[`${regNo}-${index}`] ? 'remarks-text expanded' : 'remarks-text'}>
                                    {item.remarks?.toUpperCase()}
                                  </div>
                                  {item.remarks.length > 100 && (
                                    <button
                                      className="view-more-btn no-print"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRemarkExpansion(`${regNo}-${index}`);
                                      }}
                                    >
                                      {expandedRemarks[`${regNo}-${index}`] ? 'View Less' : 'View More'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="document-column">
                              <Button
                                text=" View Document"
                                onClick={() => handleRowClick(formatDate(item.date), item.serviceType, item._id)}
                                colorScheme="sky-800"
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
                            </td>
                            <td className="document-column">
                              <Button
                                text=" Delete"
                                onClick={() => handleDeleteReport(item)}
                                colorScheme="red-700"
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
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="no-results">
                    No service records found for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <DevModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSixDigitPassword('');
          setSignError('');
        }}
        type="authentication"
        title="Document Signature Authentication"
        message="Step 1: Enter your 6-digit password"
        showInput={true}
        inputValue={sixDigitPassword}
        onInputChange={(value) => setSixDigitPassword(value.replace(/\D/g, ''))}
        inputPlaceholder="Enter 6-digit password"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? "Verifying..." : "Verify & Send OTP"}
        onButtonClick={handleSixDigitVerification}
        preventClose={signLoading}
      />

      <DevModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setOtpCode('');
          setSignError('');
        }}
        type="otp"
        title="Enter OTP Code"
        message="OTP has been sent to the authorized email"
        showInput={true}
        inputValue={otpCode}
        onInputChange={(value) => setOtpCode(value.replace(/\D/g, ''))}
        inputPlaceholder="Enter 6-digit OTP"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? "Signing..." : "Sign Document"}
        secondaryButtonText="Back"
        onSecondaryClick={() => {
          setShowOtpModal(false);
          setShowPasswordModal(true);
        }}
        onButtonClick={handleOtpVerification}
        preventClose={signLoading}
      />

      <DevModal
        isOpen={showWarningModal}
        onClose={() => {
          setShowWarningModal(false);
          setPendingAction(null);
        }}
        type="warning"
        title="!Document Not Signed"
        message="You must sign the document before printing/exporting! This ensures document authenticity and compliance."
        buttonText="Sign Document Now"
        secondaryButtonText="Cancel"
        onButtonClick={() => {
          setShowWarningModal(false);
          signDocument();
        }}
        onSecondaryClick={() => {
          setShowWarningModal(false);
          setPendingAction(null);
        }}
      />

      <DevModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setPendingAction(null);
        }}
        type="success"
        title="Document Signed Successfully!"
        message={`Your document has been digitally signed! Signature valid for 10 seconds. You can now ${pendingAction === 'pdf' ? 'export to PDF' : 'print'} the document.`}
        buttonText={pendingAction === 'pdf' ? 'Export to PDF Now' : 'Print Now'}
        secondaryButtonText="Close"
        onButtonClick={() => {
          setShowSuccessModal(false);
          if (pendingAction === 'pdf') {
            handleExportToPDF()
          } else {
            handlePrint();
          }
          setPendingAction(null);
        }}
        onSecondaryClick={() => {
          setShowSuccessModal(false);
          setPendingAction(null);
        }}
      />
      <DevModal
        isOpen={showLoadingModal}
        onClose={() => { }}
        type="progress"
        title="Processing..."
        message={loadingMessage}
        progress={100}
        preventClose={true}
      />
    </div>
  );
};

export default ServiceHistory;