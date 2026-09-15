import { useState, useEffect } from 'react';
import {
  fetchStockEquipments,
  fetchAllUsers,
  fetchStocks,
  updateStockQuantity,
  addStock,
  updateStock,
  deleteStock,
} from '../api/stock.part.api';
import { useSearch } from '@/shared/context/SearchContext';
import {
  calculateStatus,
  formatDate,
  printStockReport,
  buildStockReportWorkbook,
  generateStockReportFilename,
  exportWorkbookAsExcelFile,
} from '../helper/stock.part.helper';
import {
  DEFAULT_REDUCE_FORM_DATA,
  DEFAULT_ADD_FORM_DATA,
  DEFAULT_STOCK_FORM_DATA,
} from '../constants/stock.part.constant';

export const useSpareParts = () => {
  const { searchTerm } = useSearch();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentCategoryOptions, setEquipmentCategoryOptions] = useState([]);
  const [showReduceForm, setShowReduceForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [filteredEquipmentOptions, setFilteredEquipmentOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [filteredUserOptions, setFilteredUserOptions] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarMaximized, setSidebarMaximized] = useState(false);

  const [reduceFormData, setReduceFormData] = useState(DEFAULT_REDUCE_FORM_DATA);
  const [addFormData, setAddFormData] = useState(DEFAULT_ADD_FORM_DATA);
  const [formData, setFormData] = useState(DEFAULT_STOCK_FORM_DATA);

  useEffect(() => {
    if (equipmentSearchTerm.trim() === '') {
      setFilteredEquipmentOptions(formData.type === 'specific-equipment' ? equipmentOptions : equipmentCategoryOptions);
    } else {
      const optionsToFilter = formData.type === 'specific-equipment' ? equipmentOptions : equipmentCategoryOptions;
      const filtered = optionsToFilter.filter((opt) =>
        opt.label.toLowerCase().includes(equipmentSearchTerm.toLowerCase())
      );
      setFilteredEquipmentOptions(filtered);
    }
  }, [equipmentSearchTerm, equipmentOptions, equipmentCategoryOptions, formData.type]);

  const handleEquipmentSelection = (item) => {
    const currentValues = formData.equipments || [];
    if (!currentValues.includes(item.value)) {
      const newEquipments = [...currentValues, item.value];
      setFormData({
        ...formData,
        equipments: newEquipments,
      });
    }
    setEquipmentSearchTerm('');
    setShowEquipmentDropdown(false);
  };

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const result = await fetchStockEquipments();

        const individualOptions = result.data.map((equip) => ({
          value: `${equip.machine} - ${equip.regNo}`,
          label: `${equip.machine} - ${equip.regNo}`,
          equipment: equip,
        }));

        const uniqueCombinations = new Set();
        result.data.forEach((equip) => {
          const combo = `${equip.machine} - ${equip.brand}`;
          uniqueCombinations.add(combo);
        });

        const categoryOptions = Array.from(uniqueCombinations).map((combo) => ({
          value: combo,
          label: combo,
        }));

        setEquipmentOptions(individualOptions);
        setEquipmentCategoryOptions(categoryOptions);
      } catch (err) {
        console.error('Error fetching equipments:', err);
      }
    };

    fetchEquipments();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await fetchAllUsers();

        const allUsers = [
          ...result.data.staff.map((u) => ({
            value: u.name || u.username || u.email,
            label: `${u.name || u.username} (Staff)`,
          })),
          ...result.data.mechanic.map((u) => ({
            value: u.name || u.username || u.email,
            label: `${u.name || u.username} (Mechanic)`,
          })),
          ...result.data.operator.map((u) => ({
            value: u.name || u.username || u.email,
            label: `${u.name || u.username} (Operator)`,
          })),
        ];

        setUserOptions(allUsers);
        setFilteredUserOptions(allUsers);
      } catch (err) {
        console.error('[SpareParts] fetchUsers error:', err);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        setLoading(true);
        const result = await fetchStocks();
        setStocks(Array.isArray(result.data) ? result.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching stocks:', err);
      }
    };

    loadStocks();
  }, []);

  const handlePrint = () => printStockReport();

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        stockCount: parseInt(addFormData.stockCount),
        date: addFormData.date,
        time: addFormData.time,
        reason: addFormData.reason,
        type: 'add',
      };

      const { result } = await updateStockQuantity(selectedStock._id, updateData);

      setStocks(stocks.map((s) => (s._id === selectedStock._id ? result.data : s)));
      setSelectedStock(result.data);

      setMessage({ text: 'Stock reduced successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      setShowAddForm(false);
      setAddFormData(DEFAULT_ADD_FORM_DATA);
    } catch (err) {
      console.error('Error reducing stock:', err);
      setMessage({ text: `Failed to reduce stock: ${err.message}`, type: 'error' });
    }
  };

  const handleReduceStock = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        stockCount: parseInt(reduceFormData.stockCount),
        date: reduceFormData.date,
        time: reduceFormData.time,
        type: 'deduct',
        reduceType: reduceFormData.reduceType,
        equipmentName: reduceFormData.equipmentName,
        equipmentNumber: reduceFormData.equipmentNumber,
        mechanicName: reduceFormData.mechanicName,
      };

      const { result } = await updateStockQuantity(selectedStock._id, updateData);

      setStocks(stocks.map((s) => (s._id === selectedStock._id ? result.data : s)));
      setSelectedStock(result.data);

      setMessage({ text: 'Stock reduced successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      setShowReduceForm(false);
      setReduceFormData(DEFAULT_REDUCE_FORM_DATA);
    } catch (err) {
      console.error('Error reducing stock:', err);
      setMessage({ text: `Failed to reduce stock: ${err.message}`, type: 'error' });
    }
  };

  const showDetails = (stock) => {
    setSelectedStock(stock);
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData(DEFAULT_STOCK_FORM_DATA);
    setEquipmentSearchTerm('');
    setShowEquipmentDropdown(false);
    setShowForm(true);
  };

  const openUpdateForm = (stock) => {
    setFormMode('update');
    setFormData({
      _id: stock._id,
      type: stock.type,
      equipments: stock.equipments || [],
      product: stock.product,
      serialNumber: stock.serialNumber,
      date: stock.date ? new Date(stock.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rate: stock.rate,
      stockCount: stock.stockCount,
      hasSubUnits: stock.hasSubUnits || false,
      subUnitName: stock.subUnitName || '',
      subUnitCapacity: stock.subUnitCapacity || '',
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    try {
      const submitData = {
        ...formData,
        equipments: formData.equipments || [],
        hasSubUnits: formData.hasSubUnits,
        subUnitName: formData.hasSubUnits ? formData.subUnitName : '',
        subUnitCapacity: formData.hasSubUnits ? parseFloat(formData.subUnitCapacity) || 0 : 0,
        subUnitRemaining: formData.hasSubUnits ? parseFloat(formData.subUnitCapacity) || 0 : 0,
      };

      const { result } = formMode === 'add' ? await addStock(submitData) : await updateStock(formData._id, submitData);

      if (formMode === 'add') {
        setStocks([...stocks, result.data]);
      } else {
        setStocks(stocks.map((s) => (s._id === result.data._id ? result.data : s)));
        if (selectedStock && selectedStock._id === formData._id) {
          setSelectedStock(result.data);
        }
      }

      setMessage({ text: `Stock ${formMode === 'add' ? 'added' : 'updated'} successfully!`, type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      setMessage({ text: `Failed to ${formMode} stock: ${err.message}`, type: 'error' });
    }
  };

  const deleteStockEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    try {
      const response = await deleteStock(id);

      if (!response.ok) throw new Error('Failed to delete stock');
      setStocks(stocks.filter((item) => item._id !== id));
      if (selectedStock && selectedStock._id === id) {
        setSelectedStock(null);
      }
      setMessage({ text: 'Stock deleted successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error deleting stock:', err);
      setMessage({ text: `Failed to delete stock: ${err.message}`, type: 'error' });
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      stock.product.toLowerCase().includes(term) ||
      stock.serialNumber.toLowerCase().includes(term) ||
      (stock.equipments && stock.equipments.some((e) => e.toLowerCase().includes(term))) ||
      stock.type.toLowerCase().includes(term)
    );
  });

  const exportToExcel = async () => {
    try {
      setLoading(true);
      const workbook = buildStockReportWorkbook(stocks, filteredStocks);
      const filename = generateStockReportFilename();
      await exportWorkbookAsExcelFile(workbook, filename);

      setMessage({
        text: 'Enhanced stock report with organized movement history exported successfully! Check the "Movement History by Stock" sheet for organized data.',
        type: 'success',
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setMessage({
        text: 'Failed to export data to Excel. Please try again.',
        type: 'error',
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarClose = () => setSelectedStock(null);
  const handleSidebarMinimizeToggle = () => setSidebarMinimized((p) => !p);
  const handleSidebarMaximizeToggle = () => {
    setSidebarMaximized((p) => !p);
    setSidebarMinimized(false);
  };

  const handleShowAddFormOpen = () => setShowAddForm(true);
  const handleShowReduceFormOpen = () => setShowReduceForm(true);
  const handleEditSelectedStock = () => openUpdateForm(selectedStock);
  const handleDeleteSelectedStock = () => deleteStockEntry(selectedStock._id);

  const handleCloseAddForm = () => setShowAddForm(false);
  const handleCloseReduceForm = () => setShowReduceForm(false);
  const handleCloseStockForm = () => setShowForm(false);

  const handleStockFormSubmit = (e) => handleFormSubmit(e);

  const handleAddFormChange = (field, value) => {
    if (field === 'equipments') {
      setFormData({
        ...formData,
        equipments: value,
      });
    } else {
      setFormData({
        ...formData,
        [field]: (field === 'rate' || field === 'stockCount') ? parseFloat(value) || 0 : value,
      });
    }
  };

  const handleMechanicSearchFocus = () => setUserSearchTerm('');

  const handleReduceFormChange = (field, value) => {
    if (field === 'stockCount') {
      setReduceFormData({
        ...reduceFormData,
        stockCount: parseInt(value) || 0,
      });
    } else if (field === 'equipmentName') {
      setEquipmentSearchTerm(value);
      setReduceFormData({
        ...reduceFormData,
        equipmentName: value,
        equipmentNumber: '',
      });
    } else if (field === 'mechanicName') {
      setUserSearchTerm(value);
      const filtered = userOptions.filter((u) =>
        u.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUserOptions(filtered);
      setReduceFormData({
        ...reduceFormData,
        mechanicName: value,
      });
    } else {
      setReduceFormData({
        ...reduceFormData,
        [field]: value,
      });
    }
  };

  const handleEquipmentSearchFocus = () => {
    setShowEquipmentDropdown(true);
    setEquipmentSearchTerm('');
  };

  const handleEquipmentSearch = (value) => {
    setEquipmentSearchTerm(value);
    setShowEquipmentDropdown(value.length > 0);
  };

  const handleEquipmentSearchBlur = () => {
    setShowEquipmentDropdown(false);
  };

  const handleEquipmentItemSelect = (item) => {
    handleEquipmentSelection(item);
  };

  const handleStockFormChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: (field === 'rate' || field === 'stockCount' || field === 'subUnitCapacity')
        ? parseFloat(value) || 0
        : field === 'hasSubUnits'
          ? value === 'true' || value === true
          : value,
    });
  };

  const reduceStockFormFields = [
    {
      name: 'stockCount',
      label: selectedStock?.hasSubUnits && reduceFormData.reduceType === 'subunit'
        ? `Amount in ${selectedStock.subUnitName || 'sub-units'} to deduct`
        : 'Quantity to Reduce',
      type: 'number',
      placeholder: 'Enter quantity to reduce',
      required: true,
    },
    {
      name: 'equipmentName',
      label: 'Equipment Name',
      type: 'text',
      placeholder: 'Search or enter equipment name',
      required: true,
    },
    {
      name: 'equipmentNumber',
      label: 'Equipment Number',
      type: 'text',
      placeholder: 'Auto-filled or enter manually',
      required: true,
    },
    {
      name: 'mechanicName',
      label: 'Mechanic Name',
      type: 'search-select',
      required: true,
      placeholder: 'Search or type to add new...',
      options: [
        ...filteredUserOptions,
        ...(userSearchTerm && !filteredUserOptions.some((u) => u.value === userSearchTerm || u.label.includes(userSearchTerm))
          ? [{ label: `Add "${userSearchTerm}" as new`, value: userSearchTerm }]
          : []),
      ],
      onSearchFocus: handleMechanicSearchFocus,
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
    },
    ...(selectedStock?.hasSubUnits ? [
      {
        name: 'reduceType',
        label: 'What are you reducing?',
        type: 'select',
        required: true,
        options: [
          { value: 'subunit', label: `${selectedStock.subUnitName || 'Sub-Units'} (e.g. litres)` },
          { value: 'stock', label: 'Full Container(s)' },
        ],
      },
    ] : []),
  ];

  const stockFormFields = [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'stock', label: 'For Stock' },
        { value: 'specific-equipment', label: 'For Specific Equipment' },
        { value: 'equipment', label: 'For Equipment' },
        { value: 'all', label: 'For All Machines' },
      ],
    },
    ...(formData.type === 'specific-equipment' ? [{
      name: 'equipments',
      label: 'Select Specific Equipment(s)',
      type: 'searchable-multi-select',
      required: true,
      placeholder: 'Search by equipment name or registration number...',
      showDropdown: showEquipmentDropdown,
      dropdownItems: filteredEquipmentOptions.map((opt) => ({
        value: opt.value,
        label: opt.label.split(' - ')[0],
        subtitle: `Reg No: ${opt.label.split(' - ')[1] || 'N/A'}`,
      })),
      onSearchFocus: handleEquipmentSearchFocus,
      onSearch: handleEquipmentSearch,
      onSearchBlur: handleEquipmentSearchBlur,
      onItemSelect: handleEquipmentItemSelect,
    }] : []),
    ...(formData.type === 'equipment' ? [{
      name: 'equipments',
      label: 'Select Equipment Categories',
      type: 'searchable-multi-select',
      required: true,
      placeholder: 'Search by equipment type and brand...',
      showDropdown: showEquipmentDropdown,
      dropdownItems: filteredEquipmentOptions.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
      onSearchFocus: handleEquipmentSearchFocus,
      onSearch: handleEquipmentSearch,
      onSearchBlur: handleEquipmentSearchBlur,
      onItemSelect: handleEquipmentItemSelect,
    }] : []),
    {
      name: 'product',
      label: 'Product',
      type: 'text',
      placeholder: 'Enter product name',
      required: true,
    },
    {
      name: 'serialNumber',
      label: 'Serial Number',
      type: 'text',
      placeholder: 'Enter serial number',
      required: true,
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
    },
    {
      name: 'rate',
      label: 'Rate',
      type: 'number',
      placeholder: 'Enter rate',
      required: true,
    },
    {
      name: 'stockCount',
      label: 'Stock Count',
      type: 'number',
      placeholder: 'Enter stock count',
      required: true,
    },
    {
      name: 'hasSubUnits',
      label: 'Has Sub-Units?',
      type: 'select',
      required: false,
      options: [
        { value: false, label: 'No' },
        { value: true, label: 'Yes' },
      ],
    },
    ...(formData.hasSubUnits ? [
      {
        name: 'subUnitName',
        label: 'Sub-Unit Name (e.g. litre, kg, ml)',
        type: 'text',
        placeholder: 'e.g. litre',
        required: false,
      },
      {
        name: 'subUnitCapacity',
        label: 'Capacity per Item (e.g. 100)',
        type: 'number',
        placeholder: 'e.g. 100',
        required: false,
      },
    ] : []),
  ];

  return {
    stocks,
    loading,
    error,
    selectedStock,
    showForm,
    formMode,
    message,
    showReduceForm,
    showAddForm,
    filteredEquipmentOptions,
    filteredUserOptions,
    sidebarMinimized,
    sidebarMaximized,
    reduceFormData,
    addFormData,
    formData,
    filteredStocks,
    reduceStockFormFields,
    stockFormFields,
    calculateStatus,
    formatDate,
    handlePrint,
    handleAddStock,
    handleReduceStock,
    showDetails,
    openAddForm,
    openUpdateForm,
    deleteStockEntry,
    exportToExcel,
    handleSidebarClose,
    handleSidebarMinimizeToggle,
    handleSidebarMaximizeToggle,
    handleShowAddFormOpen,
    handleShowReduceFormOpen,
    handleEditSelectedStock,
    handleDeleteSelectedStock,
    handleCloseAddForm,
    handleCloseReduceForm,
    handleCloseStockForm,
    handleStockFormSubmit,
    handleAddFormChange,
    handleReduceFormChange,
    handleStockFormChange,
  };
};

export default useSpareParts;