import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import { fetchToolkits, fetchVariantHistory, addToolkit, updateToolkit, updateVariant, reduceToolkitStock, fetchToolkitHistory } from '../api/stock.toolkit.api';
import { useSearch } from '@/shared/search/useSearch';
import { SidebarSection, SidebarRow, SidebarTable, SidebarActions, SidebarBarcode } from '@/shared/components/widgets/sidebar/Sidebar';
import { PREDEFINED_COLORS, PREDEFINED_SIZES } from '../constants/stock.toolkit.constant';
import { calculateStatus, formatDate } from '../helper/stock.toolkit.helper';

const useToolkits = () => {
  const userDropdownRef = useRef(null);

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
  const personSearch = useSearch({ source: 'mechanics,operators,users', limit: 20 });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUnregisteredPersonWarning, setShowUnregisteredPersonWarning] = useState(false);
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [showToolkitHistory, setShowToolkitHistory] = useState(false);
  const [toolkitHistory, setToolkitHistory] = useState([]);
  const filteredToolkits = toolkits;
  const [historyFilter, setHistoryFilter] = useState({
    type: 'all',
    dateFrom: '',
    dateTo: '',
    lastN: 7,
    lastUnit: 'days'
  });

  useEffect(() => {
    personSearch.search(userSearchTerm);
  }, [userSearchTerm]);

  const fetchAllToolkitsHistory = async () => {
    try {
      const historyPromises = toolkits.map(async (toolkit) => {
        try {
          const result = await fetchToolkitHistory(toolkit._id);

          const variantHistories = [];
          if (Array.isArray(result)) {
            result.forEach(variant => {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        userDropdownRef.current = null;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchToolkitsData = async () => {
      try {
        setLoading(true);
        const result = await fetchToolkits();
        setToolkits(Array.isArray(result) ? result : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching toolkits:', err);
      }
    };

    fetchToolkitsData();
  }, []);

  const showDetails = (toolkit) => {
    setSelectedToolkit(toolkit);
    setSelectedVariant(null);
  };

  const showVariantDetails = async (variant, toolkit, pushScreen) => {
    setSelectedVariant(variant);
    let history = [];
    try {
      history = await fetchVariantHistory(toolkit._id, variant._id);
    } catch (err) {
      history = [];
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
                { label: 'Reduce Stock', onClick: openReduceStockModal, colorScheme: 'warning-700', iconColor: 'white-100', componentIconLeft: 'IconlyPaperFail', componentIconSize: '30', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '48px', width: '32%' },
                { label: 'Edit', onClick: () => openUpdateVariantForm(variant, toolkit), colorScheme: 'info-700', iconColor: 'white-100', componentIconLeft: 'IconlyEdit', componentIconSize: '30', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '48px', width: '32%' },
                { label: 'Delete', onClick: () => deleteVariant(toolkit._id, variant._id), colorScheme: 'error-700',  iconColor: 'white-100', componentIconLeft: 'IconlyDelete', componentIconSize: '30', textColor: 'white-100', squircle: '6xl', font: 'xl', height: '48px', width: '32%' },
              ]}
            />
          </SidebarSection>
          <SidebarSection title="Variant Info" gap="6px" titleFontSize='27px' titleFontWeight='500' titleColor='var(--white-200)'>
            <SidebarRow label="Tool Name" value={String(toolkit.name)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Size" value={String(variant.size)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Color" value={String(variant.color)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Stock" value={String(variant.stockCount)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Min Level" value={String(variant.minStockLevel)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Status" value={statusLabel} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="In Use" value={variant.inuse ? 'Yes' : 'No'} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="First Added" value={formatDate(variant.firstAddedDate)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
            <SidebarRow label="Last Updated" value={formatDate(variant.lastUpdatedDate)} labelFontSize="22px" valueFontSize="24px" colorScheme="primary-700" variant="gradient" squircle={true} radius='130px' />
          </SidebarSection>
          <SidebarSection title="Barcode" gap="6px" titleFontSize='27px' titleFontWeight='500' titleColor='var(--white-200)'>
            <SidebarBarcode value={variant._id} width={1.8} height={50} displayValue={true} fontSize={12} squircle={true} radius="130px" colorScheme="black-200" lineColor="#ffffff" />
          </SidebarSection>
          <SidebarSection title="Stock History" gap="6px" titleFontSize='27px' titleFontWeight='500' titleColor='var(--white-200)'>
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
              rowGrad="primary-600"
              rowGradVariant="gradient"
              rowAltGrad="primary-600"
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
      personId: null,
      assignedDate: new Date()
    });
    setUserSearchTerm('');
    setShowReduceStockModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'add') {
        const { response, result } = await addToolkit(formData);
        if (!response.ok) throw new Error('Failed to add toolkit');
        setToolkits([...toolkits, result.data]);
      } else {
        const { response, result } = await updateToolkit(formData._id, formData);
        if (!response.ok) throw new Error('Failed to update toolkit');
        const updatedToolkit = result;
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
        const { response, result } = await updateToolkit(selectedToolkit._id, {
          variants: [...selectedToolkit.variants, variantFormData],
          reason: variantFormData.reason || `Added new variant: ${variantFormData.size} - ${variantFormData.color}`
        });

        if (!response.ok) throw new Error('Failed to add variant');

        const updatedToolkit = result;

        setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
        setSelectedToolkit(updatedToolkit.data);
      } else {
        const { response, result } = await updateVariant(selectedToolkit._id, variantFormData._id, {
          ...variantFormData,
          reason: variantFormData.reason || `Updated variant: ${variantFormData.size} - ${variantFormData.color}`
        });

        if (!response.ok) throw new Error('Failed to update variant');

        const updatedToolkit = result;

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
      const response = await deleteToolkit(id);
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
      const { response, result } = await deleteVariant(toolkitId, variantId);
      if (!response.ok) throw new Error('Failed to delete variant');

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
      const { response, result: updatedToolkit } = await reduceToolkitStock(selectedToolkit._id, selectedVariant._id, {
        quantity: parseInt(reduceStockData.quantity),
        reason: reduceStockData.reason || 'Stock reduced',
        updatedBy: 'User',
        person: reduceStockData.person,
        personId: reduceStockData.personId,
        assignedDate: reduceStockData.assignedDate
      });

      if (!response.ok) throw new Error('Failed to reduce stock');

      setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
      setSelectedToolkit(updatedToolkit.data);
      setSelectedVariant(updatedToolkit.data.variants.find(v => v._id === selectedVariant._id));

      const historyResponse = await fetchVariantHistory(selectedToolkit._id, selectedVariant._id);
      if (!Array.isArray(historyResponse)) throw new Error('Failed to fetch updated stock history');

      setShowReduceStockModal(false);
    } catch (err) {
      console.error('Error reducing stock:', err);
      alert(`Failed to reduce stock: ${err.message}`);
    }
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

  const handleViewHistoryClick = () => {
    setShowToolkitHistory(true);
    fetchAllToolkitsHistory();
  };

  const handleOpenFiltersModal = () => setShowFiltersModal(true);

  const handleCloseFiltersModal = () => setShowFiltersModal(false);

  const handleSidebarClose = () => {
    setSelectedToolkit(null);
    setVariantSearchTerm('');
    setVariantFilterSize('all');
    setVariantFilterColor('all');
    setVariantFilterStatus('all');
  };

  const handleSidebarMinimize = () => setSidebarMinimized(p => !p);

  const handleSidebarMaximize = () => {
    setSidebarMaximized(p => !p);
    setSidebarMinimized(false);
  };

  const handleClearVariantFilters = () => {
    setVariantSearchTerm('');
    setVariantFilterSize('all');
    setVariantFilterColor('all');
    setVariantFilterStatus('all');
  };

  const handlePrintBarcode = () => window.print();

  const handleCloseToolkitHistory = () => setShowToolkitHistory(false);

  const handleHistoryFilterTypeAllChange = (e) => {
    setHistoryFilter({ ...historyFilter, type: e.target.value });
    fetchAllToolkitsHistory();
  };

  const handleHistoryFilterTypeChange = (e) => {
    setHistoryFilter({ ...historyFilter, type: e.target.value });
  };

  const handleHistoryDateFromChange = (e) => {
    setHistoryFilter({ ...historyFilter, dateFrom: e.target.value });
  };

  const handleHistoryDateToChange = (e) => {
    setHistoryFilter({ ...historyFilter, dateTo: e.target.value });
  };

  const handleHistoryLastNChange = (e) => {
    setHistoryFilter({ ...historyFilter, lastN: parseInt(e.target.value) || 1 });
  };

  const handleHistoryLastUnitChange = (e) => {
    setHistoryFilter({ ...historyFilter, lastUnit: e.target.value });
  };

  const handleVariantSearchChange = (e) => setVariantSearchTerm(e.target.value);

  const handleVariantFilterSizeChange = (e) => setVariantFilterSize(e.target.value);

  const handleVariantFilterColorChange = (e) => setVariantFilterColor(e.target.value);

  const handleVariantFilterStatusChange = (e) => setVariantFilterStatus(e.target.value);

  const handlePersonSearchFocus = () => {
    setUserSearchTerm('');
  };

  const handleReduceStockFormChange = (field, value) => {
    if (field === 'person') {
      const matchedUser = personSearch.results.find(u => u._id === value);
      if (matchedUser) {
        setUserSearchTerm(matchedUser.name);
        setReduceStockData({
          ...reduceStockData,
          person: matchedUser.name,
          personId: matchedUser._id,
          reason: `Handovered to ${matchedUser.name}`
        });
      } else {
        setUserSearchTerm(value);
        setReduceStockData({
          ...reduceStockData,
          person: value,
          personId: null,
          reason: value ? `Handovered to ${value}` : 'Used'
        });
      }
    } else {
      setReduceStockData({
        ...reduceStockData,
        [field]: field === 'quantity' ? parseInt(value) || 1 : value
      });
    }
  };

  const handleReduceStockButtonClick = (e) => {
    if (e) e.preventDefault();
    if (!reduceStockData.personId) {
      setShowUnregisteredPersonWarning(true);
      return;
    }
    handleReduceStock();
  };

  const handleConfirmUnregisteredPerson = () => {
    setShowUnregisteredPersonWarning(false);
    handleReduceStock();
  };

  const handleCancelUnregisteredPersonWarning = () => {
    setShowUnregisteredPersonWarning(false);
  };

  const handleCloseReduceStockModal = () => setShowReduceStockModal(false);

  const handleToolkitFormChange = (field, value) => {
    if (field === 'name') {
      setNameSearchTerm(value);
      setFormData({ ...formData, name: value });
    } else if (field === 'type') {
      setTypeSearchTerm(value);
      setFormData({ ...formData, type: value });
    }
  };

  const handleCloseToolkitForm = () => setShowForm(false);

  const handleSizeSearchFocus = () => {
    setSizeDropdownItems(PREDEFINED_SIZES);
    setShowSizeSearchDropdown(true);
  };

  const handleSizeSearch = (value) => {
    const filtered = PREDEFINED_SIZES.filter(s =>
      s.toLowerCase().includes(value.toLowerCase())
    );
    setSizeDropdownItems(filtered);
    setShowSizeSearchDropdown(true);
  };

  const handleSizeSearchBlur = () => {
    setShowSizeSearchDropdown(false);
  };

  const handleSizeItemSelect = (item) => {
    setShowSizeSearchDropdown(false);
  };

  const handleColorSearchFocus = () => {
    setColorDropdownItems(PREDEFINED_COLORS);
    setShowColorSearchDropdown(true);
  };

  const handleColorSearch = (value) => {
    const filtered = PREDEFINED_COLORS.filter(c =>
      c.toLowerCase().includes(value.toLowerCase())
    );
    setColorDropdownItems(filtered);
    setShowColorSearchDropdown(true);
  };

  const handleColorSearchBlur = () => {
    setShowColorSearchDropdown(false);
  };

  const handleColorItemSelect = (item) => {
    setShowColorSearchDropdown(false);
  };

  const handleVariantFormChange = (field, value) => {
    setVariantFormData({
      ...variantFormData,
      [field]: field === 'stockCount' || field === 'minStockLevel' ? parseInt(value) || 0 : value
    });
  };

  const handleCloseVariantForm = () => setShowVariantForm(false);

  return {
    userDropdownRef,
    showSizeSearchDropdown,
    sizeDropdownItems,
    showColorSearchDropdown,
    colorDropdownItems,
    variantSearchTerm,
    variantFilterSize,
    variantFilterColor,
    variantFilterStatus,
    toolkits,
    loading,
    error,
    selectedToolkit,
    selectedVariant,
    showForm,
    showVariantForm,
    formMode,
    sidebarMinimized,
    sidebarMaximized,
    variantFormMode,
    exporting,
    formData,
    variantFormData,
    showReduceStockModal,
    reduceStockData,
    showFiltersModal,
    filters,
    filteredUsers: personSearch.results,
    userSearchTerm,
    showUnregisteredPersonWarning,
    handleConfirmUnregisteredPerson,
    handleCancelUnregisteredPersonWarning,
    nameSearchTerm,
    typeSearchTerm,
    showToolkitHistory,
    toolkitHistory,
    filteredToolkits,
    historyFilter,
    fetchAllToolkitsHistory,
    getFilteredAndGroupedVariants,
    showDetails,
    showVariantDetails,
    openAddForm,
    openUpdateForm,
    openAddVariantForm,
    openUpdateVariantForm,
    openReduceStockModal,
    handleFormSubmit,
    handleVariantFormSubmit,
    deleteToolkit,
    deleteVariant,
    handleReduceStock,
    handleFilterChange,
    handleApplyFilters,
    handleResetFilters,
    exportToExcel,
    handleViewHistoryClick,
    handleOpenFiltersModal,
    handleCloseFiltersModal,
    handleSidebarClose,
    handleSidebarMinimize,
    handleSidebarMaximize,
    handleClearVariantFilters,
    handlePrintBarcode,
    handleCloseToolkitHistory,
    handleHistoryFilterTypeAllChange,
    handleHistoryFilterTypeChange,
    handleHistoryDateFromChange,
    handleHistoryDateToChange,
    handleHistoryLastNChange,
    handleHistoryLastUnitChange,
    handleVariantSearchChange,
    handleVariantFilterSizeChange,
    handleVariantFilterColorChange,
    handleVariantFilterStatusChange,
    handlePersonSearchFocus,
    handleReduceStockFormChange,
    handleReduceStockButtonClick,
    handleCloseReduceStockModal,
    handleToolkitFormChange,
    handleCloseToolkitForm,
    handleSizeSearchFocus,
    handleSizeSearch,
    handleSizeSearchBlur,
    handleSizeItemSelect,
    handleColorSearchFocus,
    handleColorSearch,
    handleColorSearchBlur,
    handleColorItemSelect,
    handleVariantFormChange,
    handleCloseVariantForm
  };
};

export default useToolkits;