import React, { useState, useRef, useEffect } from 'react';
import './ServiceHistory.css';
import { useParams, useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import ExcelJS from 'exceljs';
import logoImage from '../../assets/images/al-ansari.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import { apiRequest } from '../../utils/0auth';

const ServiceHistory = () => {
  // Get the regNo from URL parameters and setup navigation
  const { regNo } = useParams();
  const navigate = useNavigate();

  // State for active tab
  const [activeTab, setActiveTab] = useState('all');

  // State for search functionality and data
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [equipmentData, setEquipmentData] = useState(null);

  // Date filtering states
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'lastXmonths', 'thismonth', 'custom'
  const [lastMonthsCount, setLastMonthsCount] = useState(6); // Default to 6 months
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);

  // Separate state for each service type
  const [serviceHistory, setServiceHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [tyreHistory, setTyreHistory] = useState([]);
  const [batteryHistory, setBatteryHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Create a ref for the table to print
  const tableRef = useRef(null);

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

  // Function to fetch remarks and location for oil services, and remarks for tyre and battery services
  const fetchRemarksAndLocationForServices = async (combinedData) => {
    const dataWithRemarksAndLocation = [...combinedData];

    // Create promises for fetching remarks and location for oil, tyre, and battery services
    const remarksPromises = dataWithRemarksAndLocation.map(async (item, index) => {
      if (['oil', 'tyre', 'battery'].includes(item.serviceType) && item.date) {
        try {
          const formattedDate = formatDate(item.date);
          const response = await apiRequest(`${END_POINT}/service-report/${regNo}/${formattedDate}`);

          if (response.ok) {
            const remarksData = await response.json();
            if (remarksData?.data?.[0]) {
              const updatedItem = { ...dataWithRemarksAndLocation[index] };

              // Add remarks for all service types
              if (remarksData.data[0].remarks) {
                updatedItem.remarks = remarksData.data[0].remarks;
              }

              // Add location only for oil services
              if (item.serviceType === 'oil' && remarksData.data[0].location) {
                updatedItem.location = remarksData.data[0].location;
              }

              dataWithRemarksAndLocation[index] = updatedItem;
            }
          }
        } catch (error) {
          console.error(`Error fetching remarks and location for ${item.serviceType} service on ${item.date}:`, error);
        }
      }
    });

    // Wait for all remarks and location data to be fetched
    await Promise.all(remarksPromises);
    return dataWithRemarksAndLocation;
  };

  // Fetch all service histories
  useEffect(() => {
    setLoading(true);

    const fetchAllHistories = async () => {
      try {
        // Fetch all service types in parallel
        const [serviceRes, maintenanceRes, tyreRes, batteryRes] = await Promise.all([
          apiRequest(`${END_POINT}/service-history/get-service-history/${regNo}`),
          apiRequest(`${END_POINT}/service-history/get-maintanance-history/${regNo}`),
          apiRequest(`${END_POINT}/service-history/get-tyre-history/${regNo}`),
          apiRequest(`${END_POINT}/service-history/get-battery-history/${regNo}`)
        ]);

        // Parse all responses
        const [serviceData, maintenanceData, tyreData, batteryData] = await Promise.all([
          serviceRes.json(),
          maintenanceRes.json(),
          tyreRes.json(),
          batteryRes.json()
        ]);

        // Set individual histories
        setServiceHistory(serviceData.data || []);
        setMaintenanceHistory(maintenanceData.data || []);
        setTyreHistory(tyreData.data || []);
        setBatteryHistory(batteryData.data || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching service histories:', error);
        setError('Failed to fetch service records. Please try again.');
        setLoading(false);
      }
    };

    fetchAllHistories();

    // Try to find equipment details
    if (regNo) {
      import('../../equipments').then(module => {
        const equipment = module.default.find(eq => eq.regNo.toString().trim() === regNo.toString().trim());
        setEquipmentData(equipment);
      }).catch(err => {
        console.error("Could not load equipment data:", err);
      });
    }
  }, [regNo]);

  // Filter and combine data based on active tab and date filter
  useEffect(() => {
    const processData = async () => {
      let combinedData = [];

      if (activeTab === 'all') {
        // Combine all service types with type identifier
        const serviceWithType = serviceHistory.map(item => ({ ...item, serviceType: 'oil', regNo: item.regNo || item.equipmentId }));
        const maintenanceWithType = maintenanceHistory.map(item => ({ ...item, serviceType: 'maintenance', regNo: item.regNo || item.equipmentId }));
        const tyreWithType = tyreHistory.map(item => ({ ...item, serviceType: 'tyre', regNo: item.equipmentNo || item.equipmentId }));
        const batteryWithType = batteryHistory.map(item => ({ ...item, serviceType: 'battery', regNo: item.equipmentNo || item.equipmentId }));

        combinedData = [...serviceWithType, ...maintenanceWithType, ...tyreWithType, ...batteryWithType];
      } else if (activeTab === 'oil') {
        combinedData = serviceHistory.map(item => ({ ...item, serviceType: 'oil', regNo: item.regNo || item.equipmentId }));
      } else if (activeTab === 'maintenance') {
        combinedData = maintenanceHistory.map(item => ({ ...item, serviceType: 'maintenance', regNo: item.regNo || item.equipmentId }));
      } else if (activeTab === 'tyre') {
        combinedData = tyreHistory.map(item => ({ ...item, serviceType: 'tyre', regNo: item.equipmentNo || item.equipmentId }));
      } else if (activeTab === 'battery') {
        combinedData = batteryHistory.map(item => ({ ...item, serviceType: 'battery', regNo: item.equipmentNo || item.equipmentId }));
      }

      // Filter for this specific equipment
      const equipmentData = combinedData.filter(item =>
        item.regNo?.toString().trim() === regNo?.toString().trim()
      );

      // Apply date filter
      const dateFilteredData = equipmentData.filter(item => isDateInRange(item.date));

      // Fetch remarks and location for oil, tyre, and battery services
      const dataWithRemarksAndLocation = await fetchRemarksAndLocationForServices(dateFilteredData);

      // Sort by date (newest first)
      dataWithRemarksAndLocation.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply search term filter
      const results = dataWithRemarksAndLocation.filter(item => {
        if (!searchTerm) return true;
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      setFilteredData(results);
    };

    processData();
  }, [serviceHistory, maintenanceHistory, tyreHistory, batteryHistory, regNo, searchTerm, activeTab, dateFilter, lastMonthsCount, customStartDate, customEndDate]);

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

  // Navigate to add service form based on active tab
  const handleAddService = () => {
    switch (activeTab) {
      case 'oil':
        navigate(`/service-history-form/${regNo}`);
        break;
      case 'maintenance':
        navigate(`/maintenance-history-form/${regNo}`);
        break;
      case 'tyre':
        navigate(`/tyre-history-form/${regNo}`);
        break;
      case 'battery':
        navigate(`/battery-history-form/${regNo}`);
        break;
      default:
        navigate(`/service-form-nav/${regNo}`);
    }
  };

  // Navigate to view all documents based on active tab and date filter
  const handleViewAllDocuments = () => {
    let basePath = '';

    // Determine base path based on active tab
    switch (activeTab) {
      case 'all':
        basePath = `/all/all-histories/${regNo}`;
        break;
      case 'oil':
        basePath = `/all/oil-service/${regNo}`;
        break;
      case 'maintenance':
        basePath = `/all/maintenance-service/${regNo}`;
        break;
      case 'tyre':
        basePath = `/all/tyre-service/${regNo}`;
        break;
      case 'battery':
        basePath = `/all/battery-service/${regNo}`;
        break;
      default:
        basePath = `/all/all-histories/${regNo}`;
    }

    // Add date range parameters if custom date filter is selected
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const formattedStartDate = formatDate(customStartDate).replace(/-/g, '-');
      const formattedEndDate = formatDate(customEndDate).replace(/-/g, '-');
      basePath = `/all/date-range/${regNo}/${formattedStartDate}/${formattedEndDate}`;
    } else if (dateFilter === 'lastXmonths') {
      basePath = `/all/last-months/${regNo}/${lastMonthsCount}`;
    } else if (dateFilter === 'thismonth') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const formattedStartDate = formatDate(firstDay).replace(/-/g, '-');
      const formattedEndDate = formatDate(lastDay).replace(/-/g, '-');
      basePath = `/all/date-range/${regNo}/${formattedStartDate}/${formattedEndDate}`;
    }

    navigate(basePath);
  };

  const handleRowClick = (date, serviceType) => {
    let path;
    switch (serviceType) {
      case 'oil':
        path = `/service-doc/${regNo}/${date}`;
        break;
      case 'maintenance':
        path = `/maintenance-doc/${regNo}/${date}`;
        break;
      case 'tyre':
        path = `/tyre-doc/${regNo}/${date}`;
        break;
      case 'battery':
        path = `/battery-doc/${regNo}/${date}`;
        break;
      default:
        path = `/service-doc/${regNo}/${date}`;
    }
    navigate(path);
  };

  const handleDetete = async (item) => {
    let url

    alert('Are you sure')

    if (item.serviceType == 'oil') {
      url = `${END_POINT}/service-history/delete-service-history/oil/${item._id}`
    } else if (item.serviceType == 'tyre') {
      url = `${END_POINT}/service-history/delete-service-history/tyre/${item._id}`
    } else if (item.serviceType == 'battery') {
      url = `${END_POINT}/service-history/delete-service-history/battery/${item._id}`
    } else {
      url = `${END_POINT}/service-history/delete-service-history/maintanance/${item._id}`
    }
    const response = await apiRequest(url, 'DELETE')
    const data = await response.json()

    if (data.success) {
      alert('Deleted Successfully')
      window.location.reload()
    }
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
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
      // Create a workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Service History');

      const tabName = activeTab === 'all' ? 'All Services' :
        activeTab === 'oil' ? 'Oil Service' :
          activeTab === 'maintenance' ? 'Major Works' :
            activeTab === 'tyre' ? 'Tyre Service' : 'Battery Service';

      let currentRow = 1;

      // Add title rows with styling
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `${tabName} History - ${equipmentData ? equipmentData.machine : 'Equipment'} ${regNo}`;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 45;

      // Add subtitle
      currentRow++;
      const subtitleCell = worksheet.getCell(`A${currentRow}`);
      subtitleCell.value = `Date Range: ${getDateRangeText()}`;
      subtitleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 45;

      // Add search term if applicable
      if (searchTerm) {
        currentRow++;
        const searchCell = worksheet.getCell(`A${currentRow}`);
        searchCell.value = `Search Term: "${searchTerm}"`;
        searchCell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
        searchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
        searchCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(currentRow).height = 45;
      }

      // Empty row
      currentRow++;
      worksheet.getRow(currentRow).height = 20;

      // Add timestamp
      currentRow++;
      const timestampCell = worksheet.getCell(`A${currentRow}`);
      timestampCell.value = `Report Generated: ${new Date().toLocaleString()}`;
      timestampCell.font = { italic: true, size: 11, color: { argb: 'FF7F7F7F' } };
      timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 45;

      // Empty row
      currentRow++;
      worksheet.getRow(currentRow).height = 20;

      // Define headers
      const headers = [
        'Date',
        ...(activeTab === 'all' ? ['Service Type'] : []),
        'Work Description',
        ...((activeTab === 'oil' || activeTab === 'all') ? ['Serviced Hrs/Km', 'Next Service', 'Next Full Service'] : []),
        ...((activeTab === 'tyre' || activeTab === 'all') ? ['Location', 'Tyre Model'] : []),
        ...((activeTab === 'battery' || activeTab === 'all') ? ['Battery Model'] : []),
        'Remarks'
      ];

      // Add headers
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

      // Set column widths
      const colWidths = [
        15,  // Date
        ...(activeTab === 'all' ? [15] : []), // Service Type
        40,  // Work Description
        ...((activeTab === 'oil' || activeTab === 'all') ? [15, 15, 18] : []), // Oil columns
        ...((activeTab === 'tyre' || activeTab === 'all') ? [20, 25] : []), // Tyre columns
        ...((activeTab === 'battery' || activeTab === 'all') ? [25] : []), // Battery column
        40   // Remarks
      ];

      colWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });

      // Add data rows
      filteredData.forEach((item, index) => {
        currentRow++;
        const dataRow = worksheet.getRow(currentRow);

        const rowData = [
          formatDate(item.date),
          ...(activeTab === 'all' ? [getServiceTypeBadge(item.serviceType).text] : []),
          getWorkDescription(item),
          ...((activeTab === 'oil' || activeTab === 'all') ? [
            item.serviceType === 'oil' ? item.serviceHrs : item.serviceType === 'tyre' ? item.runningHours : '-',
            item.serviceType === 'oil' ? (item.nextServiceHrs === 0 ? '' : item.nextServiceHrs) : '-',
            item.serviceType === 'oil' && item.fullService ? item.serviceHrs + 3000 : '-'
          ] : []),
          ...((activeTab === 'tyre' || activeTab === 'all') ? [
            item.location ? item.location : '-',
            item.serviceType === 'tyre' ? item.tyreModel : '-'
          ] : []),
          ...((activeTab === 'battery' || activeTab === 'all') ? [
            item.serviceType === 'battery' ? item.batteryModel : '-'
          ] : []),
          getRemarksText(item)
        ];

        // Set row data
        rowData.forEach((value, colIndex) => {
          dataRow.getCell(colIndex + 1).value = value;
        });

        // Set row height
        dataRow.height = 45;

        // Determine background color based on service type
        let bgColor = 'FFFFFFFF'; // White default
        switch (item.serviceType) {
          case 'oil':
            bgColor = 'FFE8F5E8'; // Light green
            break;
          case 'maintenance':
            bgColor = 'FFFFF3CD'; // Light yellow
            break;
          case 'tyre':
            bgColor = 'FFD1ECF1'; // Light blue
            break;
          case 'battery':
            bgColor = 'FFF8D7DA'; // Light red
            break;
        }

        if (item.fullService || item.replaced) {
          bgColor = 'FFFFD3A5'; // Orange for full service/replacement
        }

        // Style each cell in the row
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

      // Merge title cells
      worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`); // Main title
      worksheet.mergeCells(`A2:${String.fromCharCode(64 + headers.length)}2`); // Date range

      if (searchTerm) {
        worksheet.mergeCells(`A3:${String.fromCharCode(64 + headers.length)}3`); // Search term
        worksheet.mergeCells(`A5:${String.fromCharCode(64 + headers.length)}5`); // Timestamp
      } else {
        worksheet.mergeCells(`A4:${String.fromCharCode(64 + headers.length)}4`); // Timestamp
      }

      // Generate filename
      const fileName = `${tabName.replace(/\s+/g, '_')}_${regNo}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // Generate buffer and create blob for download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);

      console.log('Service history exported successfully with full styling!');

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
    return item.workRemarks || '-';
  };

  const getRemarksText = (item) => {
    if (item.serviceType === 'oil') {
      return item.remarks || '';
    } else if (item.serviceType === 'maintenance') {
      return item.workRemarks || '';
    } else if (item.serviceType === 'tyre' || item.serviceType === 'battery') {
      return item.remarks || '';
    }
    return '';
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
              font-size: 11px !important;
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
              font-size: 10px !important;
            }
            
            table th:nth-child(4), table td:nth-child(4){
              max-width: 70px !important;
              width: 70px !important;
              font-size: 9px !important;
              padding: 2px 4px !important;
              word-wrap: break-word !important;
              overflow: hidden !important;
              white-space: normal !important;
            }

            table th:nth-child(2), table td:nth-child(2),
            table th:nth-child(5), table td:nth-child(5),
            table th:nth-child(6), table td:nth-child(6),
            table th:nth-child(7), table td:nth-child(7),
            table th:nth-child(8), table td:nth-child(8),
            table th:nth-child(9), table td:nth-child(9){
              max-width: 50px !important;
              width: 50px !important;
              font-size: 9px !important;
              padding: 2px 4px !important
              word-wrap: break-word !important;
              overflow: hidden !important;
              white-space: normal !important;
            }
            
            table th:nth-child(10), table td:nth-child(10) {
              max-width: 190px !important;
              width: 190px !important;
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow: hidden !important;
              font-size: 9px !important;
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
          </style>
        </head>
        <body>
          <div class="header-container" style="display:flex; justify-content: space-between; padding-inline: 2rem; align-items: center;">
            <img style="width: 15rem; max-height: 6rem;" src=${logoImage} alt="Company Logo" />
            <img style="width: 24rem; max-height: 3rem;" src=${alAnsariText} alt="Company Logo" />
          </div>
          <h1>${tabName} History</h1>
          <h2>${equipmentData ? `${equipmentData.machine} - ${regNo}` : `Equipment: ${regNo}`}</h2>
          <p>Date Range: ${getDateRangeText()}</p>
          ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
          <div class="table-container">
            ${tableRef.current?.outerHTML}
          </div>
          <div style="margin-top: 10px; text-align: center;">
            Showing ${filteredData.length} ${searchTerm ? 'matching entries' : 'entries'}
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
    oil: getFilteredCount(serviceHistory),
    maintenance: getFilteredCount(maintenanceHistory),
    tyre: getFilteredCount(tyreHistory),
    battery: getFilteredCount(batteryHistory)
  };


  return (
    <div className="service-history-container">
      <div className="service-header">
        <h1 className="service-title">Service History</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      <div className="equipment-info">
        {equipmentData ? (
          <h2>{equipmentData.machine} - {regNo}</h2>
        ) : (
          <h2>Equipment: {regNo}</h2>
        )}
      </div>

      {/* Date Filter Section */}
      <div className="date-filter-section">
        <div className="date-filter-buttons">
          <button
            className={`date-filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleDateFilterChange('all')}
          >
            All Time
          </button>

          <button
            className={`date-filter-btn ${dateFilter === 'thismonth' ? 'active' : ''}`}
            onClick={() => handleDateFilterChange('thismonth')}
          >
            This Month
          </button>

          <div className="last-months-filter">
            <button
              className={`date-filter-btn ${dateFilter === 'lastXmonths' ? 'active' : ''}`}
              onClick={() => handleDateFilterChange('lastXmonths')}
            >
              Last
            </button>
            <select
              value={lastMonthsCount}
              onChange={(e) => setLastMonthsCount(parseInt(e.target.value))}
              className="months-dropdown"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                <option key={num} value={num}>{num} Month{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <button
            className={`date-filter-btn ${dateFilter === 'custom' ? 'active' : ''}`}
            onClick={() => handleDateFilterChange('custom')}
          >
            Custom Range
          </button>
        </div>

        {showCustomDateInputs && (
          <div className="custom-date-inputs">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        )}

        <div className="date-range-display">
          <strong>Showing data for: {getDateRangeText()}</strong>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All ({recordCounts.all})
        </button>
        <button
          className={`tab-btn ${activeTab === 'oil' ? 'active' : ''}`}
          onClick={() => handleTabChange('oil')}
        >
          Oil Service ({recordCounts.oil})
        </button>
        <button
          className={`tab-btn ${activeTab === 'battery' ? 'active' : ''}`}
          onClick={() => handleTabChange('battery')}
        >
          Battery Service ({recordCounts.battery})
        </button>
        <button
          className={`tab-btn ${activeTab === 'tyre' ? 'active' : ''}`}
          onClick={() => handleTabChange('tyre')}
        >
          Tyre Service ({recordCounts.tyre})
        </button>
        <button
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => handleTabChange('maintenance')}
        >
          Major Works ({recordCounts.maintenance})
        </button>
      </div>

      <div className="controls-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search service history..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="clear-btn">×</button>
          )}
        </div>
        <div className="action-buttons">
          <button onClick={handleAddService} className="action-btn add">
            Add {activeTab === 'oil' ? 'Oil Service' :
              activeTab === 'maintenance' ? 'Major Work' :
                activeTab === 'tyre' ? 'Tyre Service' :
                  activeTab === 'battery' ? 'Battery Service' : 'Service'}
          </button>
          <button onClick={handleExportToExcel} className="action-btn excel">
            Export to Excel
          </button>
          <button onClick={handleViewAllDocuments} className="action-btn view-all">
            {dateFilter === 'custom' && customStartDate && customEndDate
              ? 'View Date Range Data'
              : dateFilter === 'lastXmonths'
                ? `View Last ${lastMonthsCount} Months Data`
                : dateFilter === 'thismonth'
                  ? 'View This Month Data'
                  : `View All ${activeTab === 'all' ? 'Documents' :
                    activeTab === 'oil' ? 'Oil Service' :
                      activeTab === 'maintenance' ? 'Major Works' :
                        activeTab === 'tyre' ? 'Tyre Service' : 'Battery Service'}`}
          </button>
          <button onClick={handlePrint} className="action-btn print">
            Print
          </button>
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
                {(activeTab === 'oil' || activeTab === 'all') && (
                  <>
                    <th>Serviced Hrs/ Km</th>
                    <th>Next Service</th>
                    <th>Next Full Service</th>
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
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const badge = getServiceTypeBadge(item.serviceType);
                  return (
                    <tr
                      key={index}
                      className={`${item.serviceType}-service ${item.fullService ? 'full-service-row' : ''} ${item.replaced ? 'replacement-row' : ''}`}
                    >
                      <td>{formatDate(item.date)}</td>
                      {activeTab === 'all' && (
                        <td>
                          <span className={`service-badge ${badge.className}`}>
                            {badge.text}
                          </span>
                        </td>
                      )}
                      <td style={{ textAlign: 'left' }}>
                        {item.serviceType === 'oil' && (
                          <div>
                            <div><strong>Filters:</strong> Fuel Filter: {item.fuelFilter}, Water Sep: {item.waterSeparator}</div>
                            <div><strong>Air Filter:</strong> {item.airFilter}, <strong>A/C Filter:</strong> {item.acFilter ? item.acFilter : ''}</div>
                          </div>
                        )}
                      </td>
                      {(activeTab === 'oil' || activeTab === 'all') && (
                        <>
                          <td>{item.serviceType === 'oil' ? item.serviceHrs : item.serviceType === 'tyre' ? item.runningHours : '-'}</td>
                          <td>{item.serviceType === 'oil' ? (item.nextServiceHrs == 0 ? '' : item.nextServiceHrs) : '-'}</td>
                          <td>{item.serviceType === 'oil' && item.fullService ? item.serviceHrs + 3000 : '-'}</td>
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
                      <td style={{ textAlign: 'left' }}>
                        {item.serviceType === 'oil' && (
                          <div>
                            {item.remarks && <div>{item.remarks}</div>}
                          </div>
                        )}
                        {item.serviceType === 'maintenance' && (
                          <div>
                            {item.workRemarks && <div>{item.workRemarks}</div>}
                          </div>
                        )}
                        {item.serviceType === 'tyre' && (
                          <div>
                            {item.remarks && <div>{item.remarks}</div>}
                          </div>
                        )}
                        {item.serviceType === 'battery' && (
                          <div>
                            {item.remarks && <div>{item.remarks}</div>}
                          </div>
                        )}
                      </td>
                      <td className="document-column">
                        <button className="action-btn details" onClick={() => handleRowClick(formatDate(item.date), item.serviceType)}>
                          View Document
                        </button>
                      </td>
                      <td className="document-column">
                        <button className="action-btn delete-h" onClick={() => handleDetete(item)}>
                          Delete
                        </button>
                      </td>
                    </tr>
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
    </div>
  );
};

export default ServiceHistory;