import React, { useState, useEffect, useRef } from 'react';
import './Toolkits.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import ExcelJS from 'exceljs';
import DevModal from '../../Common/DevModal/DevModal';
import Button from '../../Common/Button/Button';
import Loader from '../../Common/Loader/Loader';
import Sidebar, { SidebarSection, SidebarRow, SidebarTable, SidebarActions, SidebarInput, SidebarBarcode } from '../../Common/Sidebar/Sidebar';

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
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);
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

  const showVariantDetails = async (variant, toolkit, pushScreen) => {
    setSelectedVariant(variant);
    let history = [];
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/stock-history/${toolkit._id}/${variant._id}`);
      if (!response.ok) throw new Error('Failed to fetch stock history');
      const result = await response.json();
      history = result.data.stockHistory;
      setStockHistory(history);
    } catch (err) {
      setStockHistory([]);
    }
    const status = calculateStatus(variant.stockCount, variant.minStockLevel);
    const statusLabel = status === 'available' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock';
    pushScreen({
      title: `${variant.size} — ${variant.color}`,
      content: (
        <>
          <SidebarSection title="Actions" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
            <SidebarActions
              position="left"
              gap="8px"
              buttons={[
                { label: 'Reduce Stock', onClick: openReduceStockModal, colorScheme: 'pink-700', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '48px', width: '32%' },
                { label: 'Edit', onClick: () => openUpdateVariantForm(variant, toolkit), colorScheme: 'violet-700', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '48px', width: '32%' },
                { label: 'Delete', onClick: () => deleteVariant(toolkit._id, variant._id), colorScheme: 'red-700', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '48px', width: '32%' },
              ]}
            />
          </SidebarSection>
          <SidebarSection title="Variant Info" gap="6px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
            <SidebarRow label="Tool Name" value={String(toolkit.name)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Size" value={String(variant.size)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Color" value={String(variant.color)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Stock" value={String(variant.stockCount)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Min Level" value={String(variant.minStockLevel)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Status" value={statusLabel} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="In Use" value={variant.inuse ? 'Yes' : 'No'} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="First Added" value={formatDate(variant.firstAddedDate)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Last Updated" value={formatDate(variant.lastUpdatedDate)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
          </SidebarSection>
          <SidebarSection title="Barcode" gap="6px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
            <SidebarBarcode value={variant._id} width={1.8} height={50} displayValue={true} fontSize={12} squircle={true} radius="130px" colorScheme="black-200" lineColor="#ffffff"/>
          </SidebarSection>
          <SidebarSection title="Stock History" gap="6px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
            <SidebarTable
              rowGap="5px"
              headFontSize="20px"
              headFontWeight='500'
              gap="10px"
              headRadius='130px'
              rowRadius='130px'
              rowFontSize='14px'
              squircle={true}
              headColor="var(--white-200)"
              rowColor="var(--black-200)"
              headGrad="red-600"
              headGradVariant="gradient"
              rowGrad="amber-600"
              rowGradVariant="gradient"
              rowAltGrad="amber-500"
              rowAltGradVariant="gradient"
              columns={[
                { key: 'date', label: 'Date', flex: 2 },
                { key: 'action', label: 'Action', flex: 1 },
                { key: 'prev', label: 'Prev', flex: 1, align: 'center' },
                { key: 'change', label: 'Change', flex: 1, align: 'center' },
                { key: 'newStock', label: 'New', flex: 1, align: 'center' },
                { key: 'reason', label: 'Reason', flex: 2 },
              ]}
              rows={history.map(h => ({
                date: formatDate(h.assignedDate),
                action: h.action,
                prev: String(h.previousStock),
                change: (h.changeAmount > 0 ? '+' : '') + h.changeAmount,
                newStock: String(h.newStock),
                reason: h.reason,
              }))}
            />
          </SidebarSection>
        </>
      )
    });
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
          squircle="6xl"
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
          squircle="6xl"
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
          squircle="6xl"
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
          squircle="6xl"
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
                      squircle="6xl"
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
      <Sidebar
        show={!!selectedToolkit}
        title={selectedToolkit ? `${selectedToolkit.name}` : ''}
        onClose={() => {
          setSelectedToolkit(null);
          setVariantSearchTerm('');
          setVariantFilterSize('all');
          setVariantFilterColor('all');
          setVariantFilterStatus('all');
        }}
        onMinimize={() => setSidebarMinimized(p => !p)}
        onMaximize={() => { setSidebarMaximized(p => !p); setSidebarMinimized(false); }}
        isMinimized={sidebarMinimized}
        isMaximized={sidebarMaximized}
        trafficLightSize='30px'
        backButtonSize= '40px'
        colorScheme="amber-900"
        variant="gradient"
        width="800px"
        squircle="6xl"
        titleSize="15xl"
        titleFontWeight="500"
      >
        {({ pushScreen }) => selectedToolkit && (
          <>
            <SidebarSection title="Toolkit Info" gap="6px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
              <SidebarRow   label="Tool Name"    value={selectedToolkit.name}               labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
              <SidebarRow   label="Type"         value={selectedToolkit.type}               labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
              <SidebarRow   label="Total Stock"  value={String(selectedToolkit.totalStock)} labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px' />
              <SidebarRow   label="Status"                                                  labelFontSize="22px"   valueFontSize="24px"           colorScheme="amber-700" variant="gradient" squircle={true} radius='130px'  value={
                  selectedToolkit.overallStatus === 'available' ? 'In Stock' :
                  selectedToolkit.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock'
                }
              />
            </SidebarSection>

            <SidebarSection title="Barcode" gap="6px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
              <SidebarBarcode value={selectedToolkit._id} width={2.53} height={60} displayValue={true} fontSize={14} squircle={true} radius="130px" colorScheme="black-200" lineColor="#ffffff" />
            </SidebarSection>

            <SidebarSection title="Variants" gap="8px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
              <SidebarInput
                type="search"
                value={variantSearchTerm}
                onChange={(e) => setVariantSearchTerm(e.target.value)}
                placeholder="Search size or color"
                iconRight="search"
                colorScheme="amber-400"
                variant="gradient"
                textColor="white-100"
                squircle="6xl"
                height="48px"
                width="100%"
                paddingInline="24px"
                placeholderColor="black-200"
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <SidebarInput
                  type="select"
                  value={variantFilterSize}
                  onChange={(e) => setVariantFilterSize(e.target.value)}
                  options={getUniqueValues(selectedToolkit.variants, 'size')}
                  colorScheme="amber-400"
                  variant="gradient"
                  textColor="black-100"
                  paddingInline="24px"
                  squircle="6xl"
                  height="48px"
                  width="208px"
                />
                <SidebarInput
                  type="select"
                  value={variantFilterColor}
                  onChange={(e) => setVariantFilterColor(e.target.value)}
                  options={getUniqueValues(selectedToolkit.variants, 'color')}
                  colorScheme="amber-400"
                  variant="gradient"
                  textColor="black-100"
                  squircle="6xl"
                  height="48px"
                  width="208px"
                />
                <SidebarInput
                  type="select"
                  value={variantFilterStatus}
                  onChange={(e) => setVariantFilterStatus(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'In Stock' },
                    { value: 'low', label: 'Low Stock' },
                    { value: 'out', label: 'Out of Stock' },
                  ]}
                  colorScheme="amber-400"
                  variant="gradient"
                  textColor="black-100"
                  squircle="6xl"
                  height="48px"
                  width="208px"
                />
                {(variantSearchTerm || variantFilterSize !== 'all' || variantFilterColor !== 'all' || variantFilterStatus !== 'all') && (
                  <Button
                    text="Clear"
                    onClick={() => { setVariantSearchTerm(''); setVariantFilterSize('all'); setVariantFilterColor('all'); setVariantFilterStatus('all'); }}
                    colorScheme="orange-700"
                    variant="gradient"
                    textColor="white-100"
                    squircle="6xl"
                    font="lg"
                    height="48px"
                    width="auto"
                    padding="0 24px"
                    animation=""
                  />
                )}
              </div>

              {Object.entries(getFilteredAndGroupedVariants(selectedToolkit.variants)).length > 0
                ? Object.entries(getFilteredAndGroupedVariants(selectedToolkit.variants)).map(([color, variants]) => (
                  <SidebarSection key={color} title={color} gap="5px" titleFontSize='27px'             titleFontWeight='500'  titleColor='var(--white-200)'>
                    <SidebarTable
                      rowGap="5px"
                      headFontSize="20px"
                      headFontWeight='500'
                      gap="10px"
                      headRadius='130px'
                      rowRadius='130px'
                      rowFontSize='18px'
                      squircle={true}
                      headColor="var(--white-200)"
                      rowColor="var(--black-200)"
                      headGrad="red-600"
                      headGradVariant="gradient"
                      rowGrad="amber-600"
                      rowGradVariant="gradient"
                      rowAltGrad="amber-500"
                      rowAltGradVariant="gradient"
                      columns={[
                        { key: 'size', label: 'Size', flex: 1 },
                        { key: 'stock', label: 'Stock', flex: 1, align: 'center' },
                        { key: 'min', label: 'Min', flex: 1, align: 'center' },
                        { key: 'status', label: 'Status', flex: 1 },
                      ]}
                      actionPosition="right"
                      onRowClick={(row) => showVariantDetails(row._variant, selectedToolkit, pushScreen)}
                      rows={variants.map(variant => ({
                        _variant: variant,
                        size: variant.size,
                        stock: String(variant.stockCount),
                        min: String(variant.minStockLevel),
                        status: calculateStatus(variant.stockCount, variant.minStockLevel) === 'available' ? 'In Stock' :
                                calculateStatus(variant.stockCount, variant.minStockLevel) === 'low' ? 'Low Stock' : 'Out of Stock',
                        _actions: [
                          { label: 'Edit', onClick: () => openUpdateVariantForm(variant, selectedToolkit), colorScheme: 'violet-800', textColor: 'white-100', squircle: '6xl', font: 'lg', height: '35px' },
                          { label: 'Delete', onClick: () => deleteVariant(selectedToolkit._id, variant._id), colorScheme: 'red-800', textColor: 'white-100', squircle: '6xl', font: 'lg', height: '35px' },
                        ]
                      }))}
                    />
                  </SidebarSection>
                ))
                : <div style={{ color: 'var(--amber-400)', fontSize: '20px', padding: '12px 0' }}>No variants found.</div>
              }
            </SidebarSection>

            <SidebarSection title="Actions" gap="6px" titleFontSize="27px" titleFontWeight="500" titleColor="var(--white-200)">
              <SidebarActions
                position="left"
                gap="8px"
                buttons={[
                  { label: 'Edit Toolkit', onClick: () => openUpdateForm(selectedToolkit), colorScheme: 'violet-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                  { label: 'Add Variant', onClick: () => openAddVariantForm(selectedToolkit), colorScheme: 'amber-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                  { label: 'Print Barcode', onClick: () => window.print(), colorScheme: 'lime-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                  { label: 'Delete Toolkit', onClick: () => deleteToolkit(selectedToolkit._id), colorScheme: 'red-800', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '45px', width: '24%' },
                ]}
              />
            </SidebarSection>
          </>
        )}
      </Sidebar>

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
            type: 'search-select',
            placeholder: 'Search for a person...',
            required: true,
            options: [
              ...filteredUsers.map(u => ({ label: `${u.name} (${u.type})`, value: u.name })),
              ...(userSearchTerm && !filteredUsers.some(u => u.name.toLowerCase() === userSearchTerm.toLowerCase())
                ? [{ label: `Add "${userSearchTerm}" as new`, value: userSearchTerm }]
                : [])
            ],
            onSearchFocus: () => {
              setShowUserDropdown(true);
              setUserSearchTerm('');
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
          } else if (field === 'person') {
            setUserSearchTerm(value);
            const filtered = allUsers.filter(u =>
              u.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredUsers(filtered);
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