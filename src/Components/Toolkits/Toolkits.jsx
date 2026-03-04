import React, { useState, useEffect, useRef } from 'react';
import './Toolkits.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import ExcelJS from 'exceljs';
import Barcode from 'react-barcode';
import DevModal from '../../common/DevModal/DevModal';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import Loader from '../../common/Loader/Loader';

const Toolkits = () => {
  const userDropdownRef = useRef(null);
  const predefinedColors = ['White', 'Yellow', 'Grey', 'Blue', 'Navy Blue', 'Kaki', 'Black'];
  const predefinedTypes = ['Head Protection', 'Eye Protection', 'Hand Protection', 'Foot Protection', 'Body Protection', 'Fall Protection', 'Respiratory Protection'];
  const predefinedSizes = ['S', 'M', 'L', 'XL', 'XXL', 'One Size'];

  const [showSizeSearchDropdown, setShowSizeSearchDropdown] = useState(false);
  const [sizeDropdownItems, setSizeDropdownItems] = useState([]);
  const [showColorSearchDropdown, setShowColorSearchDropdown] = useState(false);
  const [colorDropdownItems, setColorDropdownItems] = useState([]);
  const [variantSearchTerm, setVariantSearchTerm] = useState('');
  const [variantFilterSize, setVariantFilterSize] = useState('all');
  const [variantFilterColor, setVariantFilterColor] = useState('all');
  const [variantFilterStatus, setVariantFilterStatus] = useState('all');
  const [toolkits, setToolkits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToolkit, setSelectedToolkit] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [stockHistory, setStockHistory] = useState([]);
  const [formMode, setFormMode] = useState('add');
  const [variantFormMode, setVariantFormMode] = useState('add');
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    variants: []
  });
  const [variantFormData, setVariantFormData] = useState({
    size: '',
    color: '',
    stockCount: 0,
    minStockLevel: 5,
    inuse: false,
    reason: ''
  });
  const [showReduceStockModal, setShowReduceStockModal] = useState(false);
  const [reduceStockData, setReduceStockData] = useState({
    quantity: 1,
    reason: 'Used',
    person: '',
    personId: null,
    assignedDate: new Date()
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFilter: 'all',
    toolkits: [],
    sizes: [],
    colors: [],
    statuses: [],
    lastMonthsCount: 6,
    customStartDate: '',
    customEndDate: ''
  });
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const filteredToolkits = toolkits;
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [showToolkitHistory, setShowToolkitHistory] = useState(false);
  const [toolkitHistory, setToolkitHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState({
    type: 'all', 
    dateFrom: '',
    dateTo: '',
    lastN: 7,
    lastUnit: 'days' 
  });

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const [mechanicsRes, operatorsRes, officeUsersRes] = await Promise.all([
          apiRequest(`${END_POINT}/mechanics/get-all-mechanic`, 'GET'),
          apiRequest(`${END_POINT}/operators/get-all-operators`, 'GET'),
          apiRequest(`${END_POINT}/users/get-all-users`, 'GET')
        ]);

        let mechanics = [];
        if (mechanicsRes.ok) {
          const mechanicsData = await mechanicsRes.json();
          mechanics = (mechanicsData.data || []).map(mechanic => ({
            _id: mechanic._id,
            name: mechanic.name,
            type: 'Mechanic'
          }));
        }

        let operators = [];
        if (operatorsRes.ok) {
          const operatorsData = await operatorsRes.json();
          operators = (operatorsData.data || []).map(operator => ({
            _id: operator._id,
            name: operator.name,
            type: 'Operator'
          }));
        }

        let officeUsers = [];
        if (officeUsersRes.ok) {
          const officeData = await officeUsersRes.json();
          officeUsers = (officeData.data?.office || []).map(user => ({
            _id: user._id,
            name: user.name,
            type: 'Office User'
          }));
        }

        const combinedUsers = [...mechanics, ...operators, ...officeUsers];
        setAllUsers(combinedUsers);
        setFilteredUsers(combinedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchAllUsers();
  }, []);


  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.type.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, allUsers]);

  const handleUserSelect = (user) => {
    setReduceStockData({
      ...reduceStockData,
      person: user.name,
      personId: user._id,
      reason: `Handovered to ${user.name}`
    });
    setUserSearchTerm(user.name);
    setShowUserDropdown(false);
  };

  const fetchAllToolkitsHistory = async () => {
    try {
      const historyPromises = toolkits.map(async (toolkit) => {
        try {
          const response = await apiRequest(`${END_POINT}/toolkits/toolkit-stock-history/${toolkit._id}`);
          if (!response.ok) return [];
          const result = await response.json();

          const variantHistories = [];
          if (result.data.variants && Array.isArray(result.data.variants)) {
            result.data.variants.forEach(variant => {
              if (variant.stockHistory && Array.isArray(variant.stockHistory)) {
                variant.stockHistory.forEach(h => {
                  variantHistories.push({
                    ...h,
                    toolkitName: toolkit.name,
                    toolkitId: toolkit._id,
                    variantSize: variant.size,
                    variantColor: variant.color
                  });
                });
              }
            });
          }

          return variantHistories;
        } catch (err) {
          console.error(`Error fetching history for ${toolkit.name}:`, err);
          return [];
        }
      });

      const allHistories = await Promise.all(historyPromises);
      let combinedHistory = allHistories.flat();

      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.date || a.assignedDate || a.timestamp);
        const dateB = new Date(b.date || b.assignedDate || b.timestamp);
        return dateB - dateA;
      });

      if (historyFilter.type === 'range' && historyFilter.dateFrom && historyFilter.dateTo) {
        const fromDate = new Date(historyFilter.dateFrom);
        const toDate = new Date(historyFilter.dateTo);
        toDate.setHours(23, 59, 59, 999);

        combinedHistory = combinedHistory.filter(h => {
          const histDate = new Date(h.date || h.assignedDate || h.timestamp);
          return histDate >= fromDate && histDate <= toDate;
        });
      } else if (historyFilter.type === 'last') {
        const now = new Date();
        let cutoffDate = new Date();

        switch (historyFilter.lastUnit) {
          case 'days':
            cutoffDate.setDate(now.getDate() - historyFilter.lastN);
            break;
          case 'weeks':
            cutoffDate.setDate(now.getDate() - (historyFilter.lastN * 7));
            break;
          case 'months':
            cutoffDate.setMonth(now.getMonth() - historyFilter.lastN);
            break;
          case 'years':
            cutoffDate.setFullYear(now.getFullYear() - historyFilter.lastN);
            break;
          default:
            return;
        }

        combinedHistory = combinedHistory.filter(h => {
          const histDate = new Date(h.date || h.assignedDate || h.timestamp);
          return histDate >= cutoffDate;
        });
      }

      setToolkitHistory(combinedHistory);
    } catch (err) {
      console.error('Error fetching all toolkits history:', err);
      setToolkitHistory([]);
    }
  };

  const getFilteredAndGroupedVariants = (variants) => {
    if (!variants || variants.length === 0) return {};

    let filtered = variants.filter(variant => {
      const matchesSearch = variantSearchTerm === '' ||
        variant.size.toLowerCase().includes(variantSearchTerm.toLowerCase()) ||
        variant.color.toLowerCase().includes(variantSearchTerm.toLowerCase());

      const matchesSize = variantFilterSize === 'all' || variant.size === variantFilterSize;
      const matchesColor = variantFilterColor === 'all' || variant.color === variantFilterColor;

      const status = calculateStatus(variant.stockCount, variant.minStockLevel);
      const matchesStatus = variantFilterStatus === 'all' || status === variantFilterStatus;

      return matchesSearch && matchesSize && matchesColor && matchesStatus;
    });

    const grouped = {};
    filtered.forEach(variant => {
      if (!grouped[variant.color]) {
        grouped[variant.color] = [];
      }
      grouped[variant.color].push(variant);
    });

    Object.keys(grouped).forEach(color => {
      grouped[color].sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
        const aIndex = sizeOrder.indexOf(a.size);
        const bIndex = sizeOrder.indexOf(b.size);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        return a.size.localeCompare(b.size);
      });
    });

    return grouped;
  };

  const getUniqueValues = (variants, key) => {
    if (!variants || variants.length === 0) return [];
    const values = [...new Set(variants.map(v => v[key]))].sort();
    values.unshift(`All ${key}`);

    return values.map(v => ({
      value: v === `All ${key}` ? 'all' : v,
      label: v
    }));
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchToolkits = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`${END_POINT}/toolkits/get-toolkits`);
        if (!response.ok) throw new Error('Failed to fetch toolkits');
        const result = await response.json();
        setToolkits(Array.isArray(result.data) ? result.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching toolkits:', err);
      }
    };

    fetchToolkits();
  }, []);

  const showDetails = (toolkit) => {
    setSelectedToolkit(toolkit);
    setSelectedVariant(null);
    setShowStockHistory(false);
  };

  const showVariantDetails = async (variant, toolkit) => {
    setSelectedToolkit(toolkit);
    setSelectedVariant(variant);
    setShowStockHistory(false);

    try {
      const response = await apiRequest(`${END_POINT}/toolkits/stock-history/${toolkit._id}/${variant._id}`);
      if (!response.ok) throw new Error('Failed to fetch stock history');
      const result = await response.json();

      setStockHistory(result.data.stockHistory);
    } catch (err) {
      console.error('Error fetching stock history:', err);
      setStockHistory([]);
    }
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      name: '',
      type: '',
      variants: []
    });
    setNameSearchTerm('');
    setTypeSearchTerm('');
    setShowForm(true);
  };

  const openUpdateForm = (toolkit) => {
    setFormMode('update');
    setFormData({
      _id: toolkit._id,
      name: toolkit.name,
      type: toolkit.type,
      variants: toolkit.variants
    });
    setNameSearchTerm(toolkit.name);
    setTypeSearchTerm(toolkit.type);
    setShowForm(true);
  };

  const openAddVariantForm = (toolkit) => {
    setVariantFormMode('add');
    setVariantFormData({
      size: '',
      color: '',
      stockCount: 0,
      minStockLevel: 5,
      inuse: false,
      reason: ''
    });
    setSelectedToolkit(toolkit);
    setShowVariantForm(true);
  };

  const openUpdateVariantForm = (variant, toolkit) => {
    setVariantFormMode('update');
    setVariantFormData({
      _id: variant._id,
      size: variant.size,
      color: variant.color,
      stockCount: variant.stockCount,
      minStockLevel: variant.minStockLevel,
      inuse: variant.inuse,
      reason: ''
    });
    setSelectedToolkit(toolkit);
    setShowVariantForm(true);
  };


  const openReduceStockModal = () => {
    setReduceStockData({
      quantity: 1,
      reason: 'Used',
      person: '',
      personId: null
    });
    setUserSearchTerm('');
    setShowReduceStockModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'add') {
        const response = await apiRequest(`${END_POINT}/toolkits/add-toolkits`,
          'POST',
          formData
        );
        if (!response.ok) throw new Error('Failed to add toolkit');
        const result = await response.json();
        setToolkits([...toolkits, result.data]);
      } else {
        const response = await apiRequest(`${END_POINT}/toolkits/update-toolkit/${formData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to update toolkit');
        const updatedToolkit = await response.json();
        setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
        if (selectedToolkit && selectedToolkit._id === formData._id) {
          setSelectedToolkit(updatedToolkit.data);
        }
      }
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(`Failed to ${formMode} toolkit: ${err.message}`);
    }
  };

  const handleVariantFormSubmit = async (e) => {
    try {
      if (variantFormMode === 'add') {
        const response = await apiRequest(`${END_POINT}/toolkits/update-toolkit/${selectedToolkit._id}`,
          'PUT',
          {
            variants: [...selectedToolkit.variants, variantFormData],
            reason: variantFormData.reason || `Added new variant: ${variantFormData.size} - ${variantFormData.color}`
          }
        );

        if (!response.ok) throw new Error('Failed to add variant');

        const updatedToolkit = await response.json();

        setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
        setSelectedToolkit(updatedToolkit.data);
      } else {
        const response = await apiRequest(`${END_POINT}/toolkits/update-variant/${selectedToolkit._id}/${variantFormData._id}`,
          'PUT',
          {
            ...variantFormData,
            reason: variantFormData.reason || `Updated variant: ${variantFormData.size} - ${variantFormData.color}`
          }
        );

        if (!response.ok) throw new Error('Failed to update variant');

        const updatedToolkit = await response.json();

        setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
        setSelectedToolkit(updatedToolkit.data);
        setSelectedVariant(updatedToolkit.data.variants.find(v => v._id === variantFormData._id));
      }
      setShowVariantForm(false);
    } catch (err) {
      console.error('Error submitting variant form:', err);
      alert(`Failed to ${variantFormMode} variant: ${err.message}`);
    }
  };

  const deleteToolkit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this toolkit?')) return;
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/delete-toolkit/${id}`,
        'DELETE'
      );
      if (!response.ok) throw new Error('Failed to delete toolkit');
      setToolkits(toolkits.filter(item => item._id !== id));
      if (selectedToolkit && selectedToolkit._id === id) {
        setSelectedToolkit(null);
      }
    } catch (err) {
      console.error('Error deleting toolkit:', err);
      alert(`Failed to delete toolkit: ${err.message}`);
    }
  };

  const deleteVariant = async (toolkitId, variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/delete-variant/${toolkitId}/${variantId}`, 'DELETE');
      if (!response.ok) throw new Error('Failed to delete variant');
      const result = await response.json();

      if (result.data === null) {
        setToolkits(toolkits.filter(item => item._id !== toolkitId));
        if (selectedToolkit && selectedToolkit._id === toolkitId) {
          setSelectedToolkit(null);
        }
      } else {
        setToolkits(toolkits.map(t => t._id === toolkitId ? result.data : t));
        if (selectedToolkit && selectedToolkit._id === toolkitId) {
          setSelectedToolkit(result.data);
          if (selectedVariant && selectedVariant._id === variantId) {
            setSelectedVariant(null);
          }
        }
      }
    } catch (err) {
      console.error('Error deleting variant:', err);
      alert(`Failed to delete variant: ${err.message}`);
    }
  };

  const handleReduceStock = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/reduce-stock/${selectedToolkit._id}/${selectedVariant._id}`,
        'PUT',
        {
          quantity: parseInt(reduceStockData.quantity),
          reason: reduceStockData.reason || 'Stock reduced',
          updatedBy: 'User',
          person: reduceStockData.person,
          personId: reduceStockData.personId,
          assignedDate: reduceStockData.assignedDate
        }
      );

      if (!response.ok) throw new Error('Failed to reduce stock');
      const updatedToolkit = await response.json();

      setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
      setSelectedToolkit(updatedToolkit.data);
      setSelectedVariant(updatedToolkit.data.variants.find(v => v._id === selectedVariant._id));

      const historyResponse = await apiRequest(`${END_POINT}/toolkits/stock-history/${selectedToolkit._id}/${selectedVariant._id}`);
      if (!historyResponse.ok) throw new Error('Failed to fetch updated stock history');
      const historyResult = await historyResponse.json();
      setStockHistory(historyResult.data.stockHistory);

      setShowReduceStockModal(false);
    } catch (err) {
      console.error('Error reducing stock:', err);
      alert(`Failed to reduce stock: ${err.message}`);
    }
  };

  const calculateStatus = (stockCount, minStockLevel) => {
    if (stockCount <= 0) return 'out';
    if (stockCount < minStockLevel) return 'low';
    return 'available';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    setFilters({
      dateFilter: 'all',
      toolkits: [],
      sizes: [],
      colors: [],
      statuses: [],
      lastMonthsCount: 6,
      customStartDate: '',
      customEndDate: ''
    });
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);

      let dataToExport = toolkits;

      if (filters.toolkits.length > 0) {
        dataToExport = dataToExport.filter(t => filters.toolkits.includes(t._id));
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Safety Tools Inventory');

      worksheet.columns = [
        { header: 'Toolkit ID', key: 'toolkitId', width: 12 },
        { header: 'Tool Name', key: 'toolName', width: 25 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Variant ID', key: 'variantId', width: 12 },
        { header: 'Size', key: 'size', width: 12 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Current Stock', key: 'currentStock', width: 15 },
        { header: 'Minimum Stock Level', key: 'minStockLevel', width: 22 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'In Use', key: 'inUse', width: 12 },
        { header: 'First Added', key: 'firstAdded', width: 18 },
        { header: 'Last Updated', key: 'lastUpdated', width: 18 },
        { header: 'Total Toolkit Stock', key: 'totalStock', width: 20 },
        { header: 'Overall Toolkit Status', key: 'overallStatus', width: 25 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 40;
      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          size: 14,
          color: { argb: 'FFFFFFFF' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      dataToExport.forEach((toolkit, toolkitIndex) => {
        if (toolkit.variants && toolkit.variants.length > 0) {
          let filteredVariants = toolkit.variants;

          if (filters.sizes.length > 0) {
            filteredVariants = filteredVariants.filter(v => filters.sizes.includes(v.size));
          }
          if (filters.colors.length > 0) {
            filteredVariants = filteredVariants.filter(v => filters.colors.includes(v.color));
          }
          if (filters.statuses.length > 0) {
            filteredVariants = filteredVariants.filter(v => {
              const status = calculateStatus(v.stockCount, v.minStockLevel);
              return filters.statuses.includes(status);
            });
          }

          filteredVariants.forEach((variant, variantIndex) => {
            const status = calculateStatus(variant.stockCount, variant.minStockLevel);
            const statusText = status === 'available' ? 'In Stock' :
              status === 'low' ? 'Low Stock' : 'Out of Stock';
            const overallStatusText = toolkit.overallStatus === 'available' ? 'In Stock' :
              toolkit.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock';

            const rowData = {
              toolkitId: toolkitIndex + 1,
              toolName: toolkit.name,
              type: toolkit.type,
              variantId: variantIndex + 1,
              size: variant.size,
              color: variant.color,
              currentStock: variant.stockCount,
              minStockLevel: variant.minStockLevel,
              status: statusText,
              inUse: variant.inuse ? 'Yes' : 'No',
              firstAdded: new Date(variant.firstAddedDate).toLocaleDateString(),
              lastUpdated: new Date(variant.lastUpdatedDate).toLocaleDateString(),
              totalStock: toolkit.totalStock,
              overallStatus: overallStatusText
            };

            worksheet.addRow(rowData);
          });
        } else {
          const overallStatusText = toolkit.overallStatus === 'available' ? 'In Stock' :
            toolkit.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock';

          const rowData = {
            toolkitId: toolkitIndex + 1,
            toolName: toolkit.name,
            type: toolkit.type,
            variantId: 'N/A',
            size: 'N/A',
            color: 'N/A',
            currentStock: 0,
            minStockLevel: 'N/A',
            status: 'No Variants',
            inUse: 'N/A',
            firstAdded: 'N/A',
            lastUpdated: 'N/A',
            totalStock: toolkit.totalStock || 0,
            overallStatus: overallStatusText
          };

          worksheet.addRow(rowData);
        }
      });

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.height = 40;

        row.eachCell((cell, colNumber) => {
          cell.font = { size: 12 };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          if (i % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          }

          const cellValue = cell.value;
          if (typeof cellValue === 'string') {
            if (cellValue.includes('Out of Stock') || cellValue === 'No Variants') {
              cell.font = {
                size: 12,
                bold: true,
                color: { argb: 'FFC5504B' }
              };
            } else if (cellValue.includes('Low Stock')) {
              cell.font = {
                size: 12,
                bold: true,
                color: { argb: 'FFD99694' }
              };
            } else if (cellValue.includes('In Stock')) {
              cell.font = {
                size: 12,
                bold: true,
                color: { argb: 'FF70AD47' }
              };
            }
          }
        });
      }

      const now = new Date();
      const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0');
      const filename = `Safety_Tools_Inventory_${dateStr}_${timeStr}.xlsx`;

      await new Promise(resolve => setTimeout(resolve, 500));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="toolkits-container">
      <div className="toolkits-actions">
        <Button
          text="Add Toolkit"
          onClick={openAddForm}
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
          text="View History"
          onClick={() => {
            setShowToolkitHistory(true);
            fetchAllToolkitsHistory();
          }}
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
        <Button
          text={exporting ? 'Exporting...' : 'Export to Excel'}
          onClick={exportToExcel}
          colorScheme=""
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
          text="Filters"
          onClick={() => setShowFiltersModal(true)}
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
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="toolkits-table-container">
          <table className="toolkits-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tool Name</th>
                <th>Type</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredToolkits.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.totalStock}</td>
                  <td>
                    <span className={`status-badge ${item.overallStatus}`}>
                      {item.overallStatus === 'available' ? 'In Stock' :
                        item.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="toolkit-action-buttons">
                    <Button
                      text="Details"
                      onClick={() => showDetails(item)}
                      colorScheme="orange-800"
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected toolkit details sidebar */}
      {selectedToolkit && (
        <div className="toolkit-details">
          <div className="details-header">
            <h2>Toolkit Details</h2>
            <button className="close-btn"
              onClick={() => {
                setSelectedToolkit(null)
                setVariantSearchTerm('');
                setVariantFilterSize('all');
                setVariantFilterColor('all');
                setVariantFilterStatus('all');
              }} >
              <span class="material-symbols-rounded">
                close
              </span>
            </button>
          </div>
          <div className="details-content">
            <div className="detail-item detail-item-side-container">
              <span className="label">Tool Name:</span>
              <span className="value">{selectedToolkit.name}</span>
            </div>
            <div className="detail-item detail-item-side-container">
              <span className="label">Type:</span>
              <span className="value">{selectedToolkit.type}</span>
            </div>
            <div className="detail-item detail-item-side-container">
              <span className="label">Total Stock:</span>
              <span className="value">{selectedToolkit.totalStock}</span>
            </div>
            <div className="detail-item detail-item-side-container">
              <span className="label">Overall Status:</span>
              <span className={`value status-badge ${selectedToolkit.overallStatus}`}>
                {selectedToolkit.overallStatus === 'available' ? 'In Stock' :
                  selectedToolkit.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Barcode Section */}
            <div className="barcode-section">
              <h3>Toolkit Barcode</h3>
              <div className="barcode-container">
                <Barcode
                  value={selectedToolkit._id}
                  width={2}
                  height={60}
                  displayValue={true}
                  fontSize={14}
                />
              </div>
              <p className="barcode-info">Scan this code to view toolkit details</p>
            </div>

            <div className="variants-section">
              <div className="variants-header-controls">
                <h3>Variants</h3>

                {/* Search and Filter Controls */}
                <div className="variants-filters">
                  <div className="filter-search">
                    <Input
                      type="search"
                      name="text"
                      value={variantSearchTerm}
                      onChange={(e) => setVariantSearchTerm(e.target.value)}
                      placeholder='Search size or color'
                      iconRight="search"
                      iconMarginRight="sm"
                      iconFontSize='6xl'
                      inputPaddingLeft="xl"
                      fontWeight='400'
                      fontSize='4xl'
                      placeholderColor='black-100'
                      squircle="10xl"
                      width='760px'
                      colorScheme='yellow-300'
                      variant='gradient'
                      height='44px'
                      textColor='black-200'
                    />
                  </div>

                  <div className="filter-dropdowns">
                    <Input
                      type="select"
                      value={variantFilterSize}
                      onChange={(e) => setVariantFilterSize(e.target.value)}
                      options={getUniqueValues(selectedToolkit.variants, 'size')}
                      colorScheme="lime-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="180px"
                      height="38px"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="black-600"
                      animation="none"
                      fontWeight='500'
                      inputPaddingInline="xl"
                    />
                    <Input
                      type="select"
                      value={variantFilterColor}
                      onChange={(e) => setVariantFilterColor(e.target.value)}
                      options={getUniqueValues(selectedToolkit.variants, 'color')}
                      colorScheme="lime-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="150px"
                      height="38px"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="black-600"
                      animation="none"
                      fontWeight='500'
                      inputPaddingInline="xl"
                    />
                    <Input
                      type="select"
                      value={variantFilterStatus}
                      onChange={(e) => setVariantFilterStatus(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'available', label: 'In Stock' },
                        { value: 'low', label: 'Low Stock' },
                        { value: 'out', label: 'Out of Stock' },
                      ]}
                      colorScheme="lime-500"
                      variant="gradient"
                      font="md"
                      squircle="4xl"
                      width="150px"
                      height="38px"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="black-600"
                      animation="none"
                      fontWeight='500'
                      inputPaddingInline="xl"
                    />
                    {(variantSearchTerm || variantFilterSize !== 'all' || variantFilterColor !== 'all' || variantFilterStatus !== 'all') && (
                      <Button
                        text="Clear All"
                        onClick={() => {
                          setVariantSearchTerm('');
                          setVariantFilterSize('all');
                          setVariantFilterColor('all');
                          setVariantFilterStatus('all');
                        }}
                        colorScheme="orange-600"
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
                  </div>
                </div>
              </div>

              {/* Grouped Variants Display */}
              <div className="variants-grouped-container">
                {Object.entries(getFilteredAndGroupedVariants(selectedToolkit.variants)).length > 0 ? (
                  Object.entries(getFilteredAndGroupedVariants(selectedToolkit.variants)).map(([color, variants]) => (
                    <div key={color} className="color-group">
                      <div className="color-group-header">
                        <div className="color-group-title">
                          <span
                            className="color-indicator-large"
                            style={{
                              backgroundColor: color.toLowerCase() === 'clear' ? 'transparent' : color.toLowerCase(),
                              border: color.toLowerCase() === 'clear' ? '2px dashed var(--border-primary)' : '2px solid var(--border-primary)'
                            }}
                          ></span>
                          <span className="color-name">{color}</span>
                          <span className="color-count">({variants.length} variant{variants.length > 1 ? 's' : ''})</span>
                        </div>
                        <div className="color-group-total">
                          Total Stock: {variants.reduce((sum, v) => sum + v.stockCount, 0)}
                        </div>
                      </div>

                      <div className="variants-table-container">
                        <table className="variants-table">
                          <thead>
                            <tr>
                              <th>Size</th>
                              <th>Stock</th>
                              <th>Min Level</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map(variant => (
                              <tr
                                key={variant._id}
                                className={selectedVariant && selectedVariant._id === variant._id ? 'selected-row' : ''}
                                onClick={() => showVariantDetails(variant, selectedToolkit)}
                              >
                                <td><strong>{variant.size}</strong></td>
                                <td>{variant.stockCount}</td>
                                <td>{variant.minStockLevel}</td>
                                <td>
                                  <span className={`status-badge ${calculateStatus(variant.stockCount, variant.minStockLevel)}`}>
                                    {calculateStatus(variant.stockCount, variant.minStockLevel) === 'available' ? 'In Stock' :
                                      calculateStatus(variant.stockCount, variant.minStockLevel) === 'low' ? 'Low Stock' : 'Out of Stock'}
                                  </span>
                                </td>
                                <td className="variant-actions">
                                  <Button
                                    text="Edit"
                                    onClick={() => openUpdateVariantForm(variant, selectedToolkit)}
                                    colorScheme="violet-800"
                                    variant="gradient"
                                    font="md"
                                    animation=""
                                    squircle="4xl"
                                    width="100px"
                                    height="32px"
                                    type="submit"
                                    textColor="white-200"
                                    shadowPosition="to-bottom"
                                    shadowColor="white-600"
                                  />
                                  <Button
                                    text="Delete"
                                    onClick={() => deleteVariant(selectedToolkit._id, variant._id)}
                                    colorScheme="red-800"
                                    variant="gradient"
                                    font="md"
                                    animation=""
                                    squircle="4xl"
                                    width="100px"
                                    height="32px"
                                    type="submit"
                                    textColor="white-200"
                                    shadowPosition="to-bottom"
                                    shadowColor="white-600"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-variants-found">
                    <p>No variants found matching your filters.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="toolkit-actions safety-items-action">
              <h3>Actions</h3>
              <div className="action-btn-group">
                <Button
                  text="Edit Toolkit"
                  onClick={() => openUpdateForm(selectedToolkit)}
                  colorScheme="violet-800"
                  variant="gradient"
                  font="md"
                  animation=""
                  squircle="4xl"
                  width="160px"
                  height="40px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
                <Button
                  text="Add Variant"
                  onClick={() => openAddVariantForm(selectedToolkit)}
                  colorScheme="amber-800"
                  variant="gradient"
                  font="md"
                  animation=""
                  squircle="4xl"
                  width="160px"
                  height="40px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
                <Button
                  text="Print Barcode"
                  onClick={() => window.print()}
                  colorScheme="lime-800"
                  variant="gradient"
                  font="md"
                  animation=""
                  squircle="4xl"
                  width="160px"
                  height="40px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
                <Button
                  text="Delete Toolkit"
                  onClick={() => deleteToolkit(selectedToolkit._id)}
                  colorScheme="red-800"
                  variant="gradient"
                  font="md"
                  animation=""
                  squircle="4xl"
                  width="160px"
                  height="40px"
                  type="submit"
                  textColor="white-200"
                  shadowPosition="to-bottom"
                  shadowColor="white-600"
                />
              </div>
            </div>

            {/* Variant details sidebar */}
            {selectedVariant && (
              <div className="variant-details">
                <div className="details-header">
                  <h2>Variant Details</h2>
                  <button className="close-btn" onClick={() => setSelectedVariant(null)}>
                    <span class="material-symbols-rounded">
                      close
                    </span>
                  </button>
                </div>
                <div className="variant-actions reduce">
                  <Button
                    text="Reduce Stock"
                    onClick={openReduceStockModal}
                    colorScheme="pink-800"
                    variant="gradient"
                    font="md"
                    animation=""
                    squircle="4xl"
                    width="fit-content"
                    height="32px"
                    type="submit"
                    textColor="white-200"
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                  />
                </div>
                <div className="details-content">
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Tool Name:</span>
                    <span className="value">{selectedToolkit.name}</span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Size:</span>
                    <span className="value">{selectedVariant.size}</span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Color:</span>
                    <span className="value">
                      <span className="color-indicator" style={{
                        backgroundColor: selectedVariant.color.toLowerCase() === 'clear' ? 'transparent' : selectedVariant.color.toLowerCase(),
                        border: selectedVariant.color.toLowerCase() === 'clear' ? '1px dashed #ccc' : 'none'
                      }}></span>
                      {selectedVariant.color}
                    </span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Current Stock:</span>
                    <span className="value">{selectedVariant.stockCount}</span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Minimum Level:</span>
                    <span className="value">{selectedVariant.minStockLevel}</span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Status:</span>
                    <span className={`value status-badge ${calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel)}`}>
                      {calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel) === 'available' ? 'In Stock' :
                        calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel) === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">In Use:</span>
                    <span className="value">{selectedVariant.inuse ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">First Added:</span>
                    <span className="value">{formatDate(selectedVariant.firstAddedDate)}</span>
                  </div>
                  <div className="detail-item detail-item-side-container">
                    <span className="label">Last Updated:</span>
                    <span className="value">{formatDate(selectedVariant.lastUpdatedDate)}</span>
                  </div>

                  {/* Variant Barcode Section */}
                  <div className="barcode-section variant-barcode">
                    <h3>Variant Barcode</h3>
                    <div className="barcode-container">
                      <Barcode
                        value={selectedVariant._id}
                        width={1.8}
                        height={50}
                        displayValue={true}
                        fontSize={12}
                      />
                    </div>
                    <p className="barcode-info">
                      {selectedVariant.size} - {selectedVariant.color}
                    </p>
                  </div>

                  <div className="stock-progress">
                    <h3>Stock Level</h3>
                    <div className="progress-container">
                      <div
                        className={`progress-bar ${calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel)}`}
                        style={{
                          width: `${Math.min(100, (selectedVariant.stockCount / (selectedVariant.minStockLevel * 2)) * 100)}%`
                        }}
                      >
                        <span className="progress-text">
                          {selectedVariant.stockCount} / {selectedVariant.minStockLevel} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="variant-actions">
                    <Button
                      text={showStockHistory ? 'Hide History' : 'Show History'}
                      onClick={() => setShowStockHistory(!showStockHistory)}
                      colorScheme={showStockHistory ? 'amber-800' : 'blue-800'}
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="fit-content"
                      height="32px"
                      type="submit"
                      textColor="white-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </div>

                  {showStockHistory && (
                    <div className="stock-history-section">
                      <h3>Stock History</h3>
                      <div className="history-table-container">
                        <table className="history-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Action</th>
                              <th>Previous</th>
                              <th>Change</th>
                              <th>New</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockHistory.length > 0 ? (
                              stockHistory.map((history, index) => (
                                <tr key={index}>
                                  <td>{formatDate(history.assignedDate)}</td>
                                  <td>
                                    <span className={`history-badge ${history.action ? history.action : ''}`}>
                                      {history.action?.charAt(0).toUpperCase() + history.action?.slice(1)}
                                    </span>
                                  </td>
                                  <td>{history.previousStock}</td>
                                  <td className={history.changeAmount > 0 ? 'positive' : 'negative'}>
                                    {history.changeAmount > 0 ? '+' : ''}{history.changeAmount}
                                  </td>
                                  <td>{history.newStock}</td>
                                  <td>{history.reason}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="no-history">No stock history available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reduce Stock Modal using DevModal */}
      <DevModal
        isOpen={showReduceStockModal}
        onClose={() => setShowReduceStockModal(false)}
        type="form"
        title="Reduce Stock"
        message={`Reducing stock for: ${selectedVariant?.size} - ${selectedVariant?.color}`}
        formFields={[
          {
            name: 'quantity',
            label: 'Quantity',
            type: 'number',
            placeholder: '1',
            required: true
          },
          {
            name: 'assignedDate',
            label: 'Assigned Date',
            type: 'date',
            required: true
          },
          {
            name: 'person',
            label: 'Assigned To',
            type: 'searchable-select',
            placeholder: 'Search for a person...',
            required: true,
            allowCustom: true,
            showDropdown: showUserDropdown,
            dropdownItems: filteredUsers.map(u => ({
              value: u.name,
              label: u.name,
              subtitle: u.type
            })),
            onSearchFocus: () => {
              setShowUserDropdown(true);
            },
            onSearch: (value) => {
              setUserSearchTerm(value);
              setShowUserDropdown(value.length > 0);
            },
            onSearchBlur: () => {
              setShowUserDropdown(false);
            },
            onItemSelect: (item) => {
              const selectedUser = allUsers.find(u => u.name === item.value);
              if (selectedUser) {
                handleUserSelect(selectedUser);
              }
              setShowUserDropdown(false);
            }
          },
          {
            name: 'reason',
            label: 'Reason',
            type: 'text',
            placeholder: 'Enter reason',
            required: true
          }
        ]}
        formValues={{
          quantity: reduceStockData.quantity,
          assignedDate: reduceStockData.assignedDate instanceof Date
            ? reduceStockData.assignedDate.toISOString().split('T')[0]
            : reduceStockData.assignedDate,
          person: userSearchTerm,
          reason: reduceStockData.reason
        }}
        onFormChange={(field, value) => {
          if (field === 'person') {
            setUserSearchTerm(value);
            setReduceStockData({
              ...reduceStockData,
              person: value,
              personId: null,
              reason: value ? `Handovered to ${value}` : 'Used'
            });
          } else {
            setReduceStockData({
              ...reduceStockData,
              [field]: field === 'quantity' ? parseInt(value) || 1 : value
            });
          }
        }}
        buttonText="Reduce Stock"
        onButtonClick={(e) => {
          if (e) e.preventDefault();
          handleReduceStock();
        }}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowReduceStockModal(false)}
      />

      {/* Form Modal for Add/Update Toolkit using DevModal */}
      <DevModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        type="form"
        title={formMode === 'add' ? 'Add New Toolkit' : 'Update Toolkit'}
        message="Enter the toolkit details below"
        formFields={[
          {
            name: 'name',
            label: 'Tool Name',
            type: 'text',
            placeholder: 'Search or enter tool name',
            required: true
          },
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            placeholder: 'Select type',
            required: true,
            options: predefinedTypes.map(t => ({ value: t, label: t }))
          }
        ]}
        formValues={{
          name: nameSearchTerm,
          type: typeSearchTerm
        }}
        onFormChange={(field, value) => {
          if (field === 'name') {
            setNameSearchTerm(value);
            setFormData({ ...formData, name: value });
          } else if (field === 'type') {
            setTypeSearchTerm(value);
            setFormData({ ...formData, type: value });
          }
        }}
        buttonText={formMode === 'add' ? 'Add Toolkit' : 'Update Toolkit'}
        onButtonClick={handleFormSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowForm(false)}
      />
      {/* Form Modal for Add/Update Variant using DevModal */}
      <DevModal
        isOpen={showVariantForm}
        onClose={() => setShowVariantForm(false)}
        type="form"
        title={variantFormMode === 'add' ? 'Add New Variant' : 'Update Variant'}
        message={`${variantFormMode === 'add' ? 'Adding' : 'Updating'} variant for: ${selectedToolkit?.name || ''}`}
        formFields={[
          {
            name: 'size',
            label: 'Size',
            type: 'searchable-select',
            placeholder: 'Type to search or add new size...',
            required: true,
            allowCustom: true,
            showDropdown: showSizeSearchDropdown,
            dropdownItems: sizeDropdownItems.map(s => ({ value: s, label: s })),
            onSearchFocus: () => {
              setSizeDropdownItems(predefinedSizes);
              setShowSizeSearchDropdown(true);
            },
            onSearch: (value) => {
              const filtered = predefinedSizes.filter(s =>
                s.toLowerCase().includes(value.toLowerCase())
              );
              setSizeDropdownItems(filtered);
              setShowSizeSearchDropdown(true);
            },
            onSearchBlur: () => {
              setShowSizeSearchDropdown(false);
            },
            onItemSelect: (item) => {
              setShowSizeSearchDropdown(false);
            }
          },
          {
            name: 'color',
            label: 'Color',
            type: 'searchable-select',
            placeholder: 'Type to search or add new color...',
            required: true,
            allowCustom: true,
            showDropdown: showColorSearchDropdown,
            dropdownItems: colorDropdownItems.map(c => ({ value: c, label: c })),
            onSearchFocus: () => {
              setColorDropdownItems(predefinedColors);
              setShowColorSearchDropdown(true);
            },
            onSearch: (value) => {
              const filtered = predefinedColors.filter(c =>
                c.toLowerCase().includes(value.toLowerCase())
              );
              setColorDropdownItems(filtered);
              setShowColorSearchDropdown(true);
            },
            onSearchBlur: () => {
              setShowColorSearchDropdown(false);
            },
            onItemSelect: (item) => {
              setShowColorSearchDropdown(false);
            }
          },
          {
            name: 'stockCount',
            label: 'Stock Count',
            type: 'number',
            placeholder: '0',
            required: true
          },
          {
            name: 'minStockLevel',
            label: 'Minimum Stock Level',
            type: 'number',
            placeholder: '5',
            required: true
          }
        ]}
        formValues={{
          size: variantFormData.size,
          color: variantFormData.color,
          stockCount: variantFormData.stockCount,
          minStockLevel: variantFormData.minStockLevel
        }}
        onFormChange={(field, value) => {
          setVariantFormData({
            ...variantFormData,
            [field]: field === 'stockCount' || field === 'minStockLevel' ? parseInt(value) || 0 : value
          });
        }}
        buttonText={variantFormMode === 'add' ? 'Add Variant' : 'Update Variant'}
        onButtonClick={handleVariantFormSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowVariantForm(false)}
      />

      {/* Global Toolkit History Modal */}
      {showToolkitHistory && (
        <div className="form-modal-overlay">
          <div className="form-modal history-modal">
            <div className="form-header">
              <h2>All Toolkits History</h2>
              <button className="close-btn" onClick={() => setShowToolkitHistory(false)}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>

            <div className="history-filters">
              <div className="history-filter-type">
                <label>
                  <input
                    type="radio"
                    value="all"
                    checked={historyFilter.type === 'all'}
                    onChange={(e) => {
                      setHistoryFilter({ ...historyFilter, type: e.target.value });
                      fetchAllToolkitsHistory();
                    }}
                  />
                  All History
                </label>
                <label>
                  <input
                    type="radio"
                    value="range"
                    checked={historyFilter.type === 'range'}
                    onChange={(e) => setHistoryFilter({ ...historyFilter, type: e.target.value })}
                  />
                  Date Range
                </label>
                <label>
                  <input
                    type="radio"
                    value="last"
                    checked={historyFilter.type === 'last'}
                    onChange={(e) => setHistoryFilter({ ...historyFilter, type: e.target.value })}
                  />
                  Last N Period
                </label>
              </div>

              {historyFilter.type === 'range' && (
                <div className="history-date-range">
                  <div className="form-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={historyFilter.dateFrom}
                      onChange={(e) => setHistoryFilter({ ...historyFilter, dateFrom: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={historyFilter.dateTo}
                      onChange={(e) => setHistoryFilter({ ...historyFilter, dateTo: e.target.value })}
                    />
                  </div>
                  <button
                    className="apply-filter-btn"
                    onClick={() => fetchAllToolkitsHistory()}
                  >
                    Apply Filter
                  </button>
                </div>
              )}

              {historyFilter.type === 'last' && (
                <div className="history-last-n">
                  <div className="form-group">
                    <label>Last</label>
                    <input
                      type="number"
                      min="1"
                      value={historyFilter.lastN}
                      onChange={(e) => setHistoryFilter({ ...historyFilter, lastN: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      value={historyFilter.lastUnit}
                      onChange={(e) => setHistoryFilter({ ...historyFilter, lastUnit: e.target.value })}
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                  <button
                    className="apply-filter-btn"
                    onClick={() => fetchAllToolkitsHistory()}
                  >
                    Apply Filter
                  </button>
                </div>
              )}

              <div className="history-summary">
                <span className="history-count">
                  Total Records: <strong>{toolkitHistory.length}</strong>
                </span>
                {historyFilter.type === 'range' && historyFilter.dateFrom && historyFilter.dateTo && (
                  <span className="history-date-range-display">
                    Showing: {new Date(historyFilter.dateFrom).toLocaleDateString()} - {new Date(historyFilter.dateTo).toLocaleDateString()}
                  </span>
                )}
                {historyFilter.type === 'last' && (
                  <span className="history-date-range-display">
                    Showing: Last {historyFilter.lastN} {historyFilter.lastUnit}
                  </span>
                )}
              </div>
            </div>

            <div className="history-content">
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Toolkit</th>
                      <th>Variant</th>
                      <th>Action</th>
                      <th>Previous</th>
                      <th>Change</th>
                      <th>New</th>
                      <th>Person</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolkitHistory.length > 0 ? (
                      toolkitHistory.map((history, index) => (
                        <tr key={index}>
                          <td>{formatDate(history.date || history.assignedDate || history.timestamp)}</td>
                          <td><strong>{history.toolkitName}</strong></td>
                          <td>{history.variantSize} - {history.variantColor}</td>
                          <td>
                            <span className={`history-badge ${history.action ? history.action : ''}`}>
                              {history.action?.charAt(0).toUpperCase() + history.action?.slice(1)}
                            </span>
                          </td>
                          <td>{history.previousStock}</td>
                          <td className={history.changeAmount > 0 ? 'positive' : 'negative'}>
                            {history.changeAmount > 0 ? '+' : ''}{history.changeAmount}
                          </td>
                          <td>{history.newStock}</td>
                          <td>{history.person || '-'}</td>
                          <td>{history.reason}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="no-history">No history available for selected filter</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Filters Modal */}
      <DevModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="Toolkit Filters"
        message="Customize your export and view with advanced filtering options"
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
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n =>
              ({ value: n, label: `${n} Month${n > 1 ? 's' : ''}` })
            )
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
            name: 'toolkits',
            label: 'Toolkits',
            type: 'checkbox',
            options: toolkits.map(t => ({ value: t._id, label: t.name }))
          },
          {
            name: 'sizes',
            label: 'Sizes',
            type: 'checkbox',
            options: predefinedSizes.map(s => ({ value: s, label: s }))
          },
          {
            name: 'colors',
            label: 'Colors',
            type: 'checkbox',
            options: predefinedColors.map(c => ({ value: c, label: c }))
          },
          {
            name: 'statuses',
            label: 'Stock Status',
            type: 'checkbox',
            options: [
              { value: 'available', label: 'In Stock' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' }
            ]
          }
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        buttonText="Apply Filters"
      />
    </div>
  );
};

export default Toolkits; 