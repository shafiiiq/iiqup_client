import React, { useState, useEffect } from 'react';
import './StockManage.css';
import { END_POINT } from '../../constants';
import Select from 'react-select';
import { apiRequest } from '../../utils/0auth';
import ExcelJS from 'exceljs';

function StockManage() {
  const [stocks, setStocks] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [showReduceForm, setShowReduceForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [mechanicSearchTerm, setMechanicSearchTerm] = useState('');
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [showMechanicDropdown, setShowMechanicDropdown] = useState(false);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [filteredMechanics, setFilteredMechanics] = useState([]);

  const [reduceFormData, setReduceFormData] = useState({
    stockCount: '',
    equipmentName: '',
    equipmentNumber: '',
    mechanicName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [addFormData, setAddFormData] = useState({
    stockCount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [formData, setFormData] = useState({
    type: 'stock',
    equipments: [],
    product: '',
    serialNumber: '',
    date: new Date().toISOString().split('T')[0],
    rate: '',
    stockCount: ''
  });


  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/mechanics/get-all-mechanic`, 'GET');
        if (!response.ok) throw new Error('Failed to fetch mechanics');
        const data = await response.json();
        setMechanics(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error('Error fetching mechanics:', err);
      }
    };

    fetchMechanics();
  }, []);

  // Filter equipments based on search term
  useEffect(() => {
    if (equipmentSearchTerm.trim() === '') {
      setFilteredEquipments(equipments);
    } else {
      const filtered = equipments.filter(equipment =>
        equipment.machine.toLowerCase().includes(equipmentSearchTerm.toLowerCase()) ||
        equipment.regNo.toLowerCase().includes(equipmentSearchTerm.toLowerCase())
      );
      setFilteredEquipments(filtered);
    }
  }, [equipmentSearchTerm, equipments]);

  // Filter mechanics based on search term
  useEffect(() => {
    if (mechanicSearchTerm.trim() === '') {
      setFilteredMechanics(mechanics);
    } else {
      const filtered = mechanics.filter(mechanic =>
        mechanic.name.toLowerCase().includes(mechanicSearchTerm.toLowerCase())
      );
      setFilteredMechanics(filtered);
    }
  }, [mechanicSearchTerm, mechanics]);

  // Handle equipment selection
  const handleEquipmentSelect = (equipment) => {
    setReduceFormData({
      ...reduceFormData,
      equipmentName: equipment.machine,
      equipmentNumber: equipment.regNo
    });
    setEquipmentSearchTerm(equipment.machine);
    setShowEquipmentDropdown(false);
  };

  // Handle mechanic selection
  const handleMechanicSelect = (mechanic) => {
    setReduceFormData({
      ...reduceFormData,
      mechanicName: mechanic.name
    });
    setMechanicSearchTerm(mechanic.name);
    setShowMechanicDropdown(false);
  };

  // Handle custom equipment name input
  const handleEquipmentNameChange = (e) => {
    const value = e.target.value;
    setReduceFormData({
      ...reduceFormData,
      equipmentName: value,
      equipmentNumber: '' // Clear equipment number when manually typing
    });
    setEquipmentSearchTerm(value);
    setShowEquipmentDropdown(value.length > 0);
  };

  // Handle custom mechanic name input
  const handleMechanicNameChange = (e) => {
    const value = e.target.value;
    setReduceFormData({
      ...reduceFormData,
      mechanicName: value
    });
    setMechanicSearchTerm(value);
    setShowMechanicDropdown(value.length > 0);
  };

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        if (!response.ok) throw new Error('Failed to fetch equipments');
        const result = await response.json();

        setEquipments(Array.isArray(result.data) ? result.data : []);

        const uniqueCombinations = new Set();
        result.data.forEach(equip => {
          const combo = `${equip.machine} - ${equip.brand}`;
          uniqueCombinations.add(combo);
        });

        const options = Array.from(uniqueCombinations).map(combo => ({
          value: combo,
          label: combo
        }));

        setEquipmentOptions(options);
      } catch (err) {
        console.error('Error fetching equipments:', err);
      }
    };

    fetchEquipments();
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

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
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`${END_POINT}/stocks/get-all-stocks`, 'GET');
        if (!response.ok) throw new Error('Failed to fetch stocks');
        const result = await response.json();
        setStocks(Array.isArray(result.data) ? result.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching stocks:', err);
      }
    };

    fetchStocks();
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Stock_Inventory_Report_${new Date().toISOString().split('T')[0]}`;
    window.print();
    document.title = originalTitle;
  };

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

      const response = await apiRequest(`${END_POINT}/stocks/update-quantity/${selectedStock._id}`, 'PUT', updateData);

      const result = await response.json();

      setStocks(stocks.map(s => s._id === selectedStock._id ? result.data : s));
      setSelectedStock(result.data);

      setMessage({ text: 'Stock reduced successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      setShowAddForm(false);
      setAddFormData({
        stockCount: '',
        equipmentName: '',
        equipmentNumber: '',
        mechanicName: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
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
        equipmentName: reduceFormData.equipmentName,
        equipmentNumber: reduceFormData.equipmentNumber,
        mechanicName: reduceFormData.mechanicName
      };

      const response = await apiRequest(
        `${END_POINT}/stocks/update-quantity/${selectedStock._id}`,
        'PUT',
        updateData
      );

      const result = await response.json();

      setStocks(stocks.map(s => s._id === selectedStock._id ? result.data : s));
      setSelectedStock(result.data);

      setMessage({ text: 'Stock reduced successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      setShowReduceForm(false);
      setReduceFormData({
        stockCount: '',
        equipmentName: '',
        equipmentNumber: '',
        mechanicName: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error('Error reducing stock:', err);
      setMessage({ text: `Failed to reduce stock: ${err.message}`, type: 'error' });
    }
  };

  const showDetails = (stock) => {
    setSelectedStock(stock);
    setShowStockHistory(false);
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      type: 'stock',
      equipments: [],
      product: '',
      serialNumber: '',
      date: new Date().toISOString().split('T')[0],
      rate: '',
      stockCount: ''
    });
    setSelectedEquipments([]);
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
      stockCount: stock.stockCount
    });
    setSelectedEquipments(stock.equipments || []);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        equipments: selectedEquipments
      };

      let url, method;
      if (formMode === 'add') {
        url = `${END_POINT}/stocks/add-stocks`;
        method = 'POST';
      } else {
        url = `${END_POINT}/stocks/update-stock/${formData._id}`;
        method = 'PUT';
      }

      const response = await apiRequest(
        url,
        method,
        submitData
      );

      if (!response.ok) throw new Error(`Failed to ${formMode} stock`);

      const result = await response.json();

      if (formMode === 'add') {
        setStocks([...stocks, result.data]);
      } else {
        setStocks(stocks.map(s => s._id === result.data._id ? result.data : s));
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

  const deleteStock = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    try {
      const response = await apiRequest(
        `${END_POINT}/stocks/delete-stock/${id}`,
        'DELETE',
      );

      if (!response.ok) throw new Error('Failed to delete stock');
      setStocks(stocks.filter(item => item._id !== id));
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

  const calculateStatus = (stockCount) => {
    if (stockCount <= 0) return 'out';
    if (stockCount < 10) return 'low';
    return 'available';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredStocks = stocks.filter(stock => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      stock.product.toLowerCase().includes(term) ||
      stock.serialNumber.toLowerCase().includes(term) ||
      (stock.equipments && stock.equipments.some(e => e.toLowerCase().includes(term))) ||
      stock.type.toLowerCase().includes(term)
    );
  });

  const exportToExcel = async () => {
    try {
      setLoading(true);

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();

      // Create main inventory worksheet
      const inventorySheet = workbook.addWorksheet('Stock Inventory');

      // Create movement history worksheet (organized by stock)
      const movementSheet = workbook.addWorksheet('Movement History by Stock');

      // Create consolidated movement history worksheet
      const consolidatedMovementSheet = workbook.addWorksheet('All Movements Timeline');

      // Add report header and summary to inventory sheet
      const reportTitle = 'STOCK INVENTORY REPORT';
      const generatedDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

      // Calculate summary data
      const totalItems = stocks.length;
      const inStockItems = stocks.filter(s => calculateStatus(s.stockCount) === 'available').length;
      const lowStockItems = stocks.filter(s => calculateStatus(s.stockCount) === 'low').length;
      const outOfStockItems = stocks.filter(s => calculateStatus(s.stockCount) === 'out').length;
      const totalStockCount = stocks.reduce((sum, s) => sum + s.stockCount, 0);

      // === INVENTORY SHEET SETUP (same as before) ===
      // Row 1: Report Title
      inventorySheet.getCell('A1').value = reportTitle;
      inventorySheet.mergeCells('A1:M1');
      const titleCell = inventorySheet.getCell('A1');
      titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, italic: true };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      inventorySheet.getRow(1).height = 45;

      // Row 2: Generation Date
      inventorySheet.getCell('A2').value = `Generated: ${generatedDate}`;
      inventorySheet.mergeCells('A2:M2');
      const dateCell = inventorySheet.getCell('A2');
      dateCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, italic: true };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dateCell.border = {
        top: { style: 'thin' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      inventorySheet.getRow(2).height = 25;

      // Row 3: Empty row for spacing
      inventorySheet.getRow(3).height = 10;

      // Row 4: Summary Header
      inventorySheet.getCell('A4').value = 'SUMMARY STATISTICS';
      inventorySheet.mergeCells('A4:M4');
      const summaryHeaderCell = inventorySheet.getCell('A4');
      summaryHeaderCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8E44AD' } };
      summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeaderCell.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      inventorySheet.getRow(4).height = 35;

      // Row 5: Summary Data
      const summaryRow = inventorySheet.getRow(5);
      summaryRow.getCell(1).value = `Total Items: ${totalItems}`;
      summaryRow.getCell(4).value = `In Stock: ${inStockItems}`;
      summaryRow.getCell(7).value = `Low Stock: ${lowStockItems}`;
      summaryRow.getCell(10).value = `Out of Stock: ${outOfStockItems}`;
      summaryRow.getCell(13).value = `Total Stock Count: ${totalStockCount}`;

      // Merge cells for summary data
      inventorySheet.mergeCells('A5:C5');
      inventorySheet.mergeCells('D5:F5');
      inventorySheet.mergeCells('G5:I5');
      inventorySheet.mergeCells('J5:K5');
      inventorySheet.mergeCells('M5:M5');

      // Style summary data cells
      [1, 4, 7, 10, 13].forEach(colNum => {
        const cell = summaryRow.getCell(colNum);
        cell.font = { bold: true, size: 11, color: { argb: 'FF2C3E50' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
      summaryRow.height = 30;

      // Row 6: Empty row for spacing
      inventorySheet.getRow(6).height = 15;

      // Row 7: Data Table Header
      const dataHeaderRow = 7;
      const headers = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Product Name', key: 'product', width: 30 },
        { header: 'Part Number', key: 'serialNumber', width: 20 },
        { header: 'Associated Equipment', key: 'equipments', width: 35 },
        { header: 'Current Stock', key: 'stockCount', width: 15 },
        { header: 'Rate', key: 'rate', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date Added', key: 'date', width: 18 },
        { header: 'Total Movements', key: 'totalMovements', width: 18 },
        { header: 'Last Activity', key: 'lastActivity', width: 18 },
        { header: 'Last Action By', key: 'lastActionBy', width: 25 },
        { header: 'Total Added', key: 'totalAdded', width: 15 }
      ];

      // Set column widths
      headers.forEach((header, index) => {
        inventorySheet.getColumn(index + 1).width = header.width;
      });

      // Add headers to row 7
      headers.forEach((header, index) => {
        inventorySheet.getCell(dataHeaderRow, index + 1).value = header.header;
      });

      // Style the data table header row
      const headerRow = inventorySheet.getRow(dataHeaderRow);
      headerRow.height = 40;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3498DB' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // Add inventory data starting from row 8
      let currentRow = dataHeaderRow + 1;
      filteredStocks.forEach((stock, index) => {
        const status = calculateStatus(stock.stockCount);
        const statusText = status === 'available' ? 'In Stock' :
          status === 'low' ? 'Low Stock' : 'Out of Stock';

        // Calculate movement statistics
        const movements = stock.movements || [];
        const totalMovements = movements.length;
        const totalAdded = movements.filter(m => m.type === 'add').reduce((sum, m) => sum + (m.quantity || 0), 0);

        let lastActivity = 'N/A';
        let lastActionBy = 'N/A';

        if (movements.length > 0) {
          const lastMove = movements[movements.length - 1];
          lastActivity = new Date(lastMove.date).toLocaleDateString() + ' ' +
            (lastMove.time || new Date(lastMove.date).toLocaleTimeString());

          if (lastMove.type === 'deduct') {
            lastActionBy = lastMove.mechanicName || 'Unknown';
          } else if (lastMove.type === 'add') {
            lastActionBy = `System (${lastMove.reason || 'Stock Added'})`;
          }
        }

        const rowData = [
          index + 1,
          stock.type,
          stock.product,
          stock.serialNumber,
          stock.equipments && stock.equipments.length > 0
            ? stock.equipments.join(', ')
            : 'N/A',
          stock.stockCount,
          stock.rate,
          statusText,
          new Date(stock.date).toLocaleDateString(),
          totalMovements,
          lastActivity,
          lastActionBy,
          totalAdded
        ];

        // Add row data
        rowData.forEach((value, colIndex) => {
          inventorySheet.getCell(currentRow, colIndex + 1).value = value;
        });

        currentRow++;
      });

      // Style inventory data rows
      for (let i = dataHeaderRow + 1; i < currentRow; i++) {
        const row = inventorySheet.getRow(i);
        row.height = 35;

        row.eachCell((cell, colNumber) => {
          cell.font = { size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };

          if (i % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
          }

          // Status-based coloring for status column
          const cellValue = cell.value;
          if (typeof cellValue === 'string') {
            if (cellValue.includes('Out of Stock')) {
              cell.font = { size: 10, bold: true, color: { argb: 'FFDC3545' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAEA' } };
            } else if (cellValue.includes('Low Stock')) {
              cell.font = { size: 10, bold: true, color: { argb: 'FFFD7E14' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
            } else if (cellValue.includes('In Stock')) {
              cell.font = { size: 10, bold: true, color: { argb: 'FF28A745' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
            }
          }
        });
      }

      // === MOVEMENT HISTORY BY STOCK SHEET (NEW ORGANIZED APPROACH) ===

      // Movement sheet title
      movementSheet.getCell('A1').value = 'STOCK MOVEMENT HISTORY (ORGANIZED BY STOCK ITEM)';
      movementSheet.mergeCells('A1:J1');
      const movTitleCell = movementSheet.getCell('A1');
      movTitleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, italic: true };
      movTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B4513' } };
      movTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      movTitleCell.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      movementSheet.getRow(1).height = 45;

      // Movement sheet date
      movementSheet.getCell('A2').value = `Generated: ${generatedDate}`;
      movementSheet.mergeCells('A2:J2');
      const movDateCell = movementSheet.getCell('A2');
      movDateCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, italic: true };
      movDateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA0522D' } };
      movDateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      movDateCell.border = {
        top: { style: 'thin' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      movementSheet.getRow(2).height = 25;

      // Set movement sheet column widths
      const movementHeaders = [
        { header: 'Movement Date', width: 18 },
        { header: 'Movement Time', width: 15 },
        { header: 'Action Type', width: 15 },
        { header: 'Quantity Changed', width: 18 },
        { header: 'Stock Before', width: 15 },
        { header: 'Stock After', width: 15 },
        { header: 'Person/Reason', width: 25 },
        { header: 'Equipment Name', width: 25 },
        { header: 'Equipment No.', width: 20 },
        { header: 'Notes', width: 30 }
      ];

      movementHeaders.forEach((header, index) => {
        movementSheet.getColumn(index + 1).width = header.width;
      });

      let movementRowIndex = 4;

      // Process each stock item separately
      filteredStocks.forEach((stock, stockIndex) => {
        // Stock item header
        movementSheet.getCell(`A${movementRowIndex}`).value = `STOCK ITEM #${stockIndex + 1}: ${stock.product} (${stock.serialNumber})`;
        movementSheet.mergeCells(`A${movementRowIndex}:J${movementRowIndex}`);
        const stockHeaderCell = movementSheet.getCell(`A${movementRowIndex}`);
        stockHeaderCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        stockHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90E2' } };
        stockHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        stockHeaderCell.border = {
          top: { style: 'thick' }, left: { style: 'thick' },
          bottom: { style: 'thick' }, right: { style: 'thick' }
        };
        movementSheet.getRow(movementRowIndex).height = 35;
        movementRowIndex++;

        // Stock details row
        const stockDetails = `Current Stock: ${stock.stockCount} | Type: ${stock.type} | Equipment(s): ${stock.equipments && stock.equipments.length > 0 ? stock.equipments.join(', ') : 'N/A'}`;
        movementSheet.getCell(`A${movementRowIndex}`).value = stockDetails;
        movementSheet.mergeCells(`A${movementRowIndex}:J${movementRowIndex}`);
        const stockDetailCell = movementSheet.getCell(`A${movementRowIndex}`);
        stockDetailCell.font = { bold: true, size: 11, color: { argb: 'FF2C3E50' }, italic: true };
        stockDetailCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
        stockDetailCell.alignment = { horizontal: 'center', vertical: 'middle' };
        stockDetailCell.border = {
          top: { style: 'thin' }, left: { style: 'thick' },
          bottom: { style: 'thin' }, right: { style: 'thick' }
        };
        movementSheet.getRow(movementRowIndex).height = 25;
        movementRowIndex++;

        // Movement headers for this stock
        movementHeaders.forEach((header, index) => {
          movementSheet.getCell(movementRowIndex, index + 1).value = header.header;
        });

        // Style movement headers
        const movHeaderRow = movementSheet.getRow(movementRowIndex);
        movHeaderRow.height = 30;
        movHeaderRow.eachCell((cell) => {
          cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E8B57' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
        movementRowIndex++;

        // Add movements for this stock
        if (stock.movements && Array.isArray(stock.movements) && stock.movements.length > 0) {
          // Sort movements by date (most recent first)
          const sortedMovements = [...stock.movements].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });

          sortedMovements.forEach((movement, index) => {
            const movementDate = new Date(movement.date).toLocaleDateString();
            const movementTime = movement.time || new Date(movement.date).toLocaleTimeString();
            const actionType = movement.type.charAt(0).toUpperCase() + movement.type.slice(1);
            const quantityChange = movement.type === 'add' ? `+${movement.quantity}` : `-${movement.quantity}`;

            let personReason = 'N/A';
            let equipmentName = 'N/A';
            let equipmentNumber = 'N/A';
            let notes = '';

            if (movement.type === 'deduct') {
              personReason = movement.mechanicName || 'Unknown Mechanic';
              equipmentName = movement.equipmentName || 'Unknown Equipment';
              equipmentNumber = movement.equipmentNumber || 'No Reg No';
              notes = `Stock taken for ${equipmentName} by ${personReason}`;
            } else if (movement.type === 'add') {
              personReason = `System: ${movement.reason || 'Stock Addition'}`;
              equipmentName = 'System Operation';
              equipmentNumber = 'N/A';
              notes = movement.reason || 'Stock added to inventory';
            }

            const movementRowData = [
              movementDate,
              movementTime,
              actionType,
              quantityChange,
              movement.previousQuantity || 0,
              movement.newQuantity || 0,
              personReason,
              equipmentName,
              equipmentNumber,
              notes
            ];

            // Add movement row data
            movementRowData.forEach((value, colIndex) => {
              movementSheet.getCell(movementRowIndex, colIndex + 1).value = value;
            });

            // Style movement row
            const row = movementSheet.getRow(movementRowIndex);
            row.height = 25;
            row.eachCell((cell, colNumber) => {
              cell.font = { size: 10 };
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
              };

              // Alternate row colors within each stock section
              if (index % 2 === 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF0' } };
              }

              // Color code action types
              const cellValue = cell.value;
              if (typeof cellValue === 'string') {
                if (cellValue === 'Add' || cellValue.startsWith('+')) {
                  cell.font = { size: 10, bold: true, color: { argb: 'FF008000' } };
                } else if (cellValue === 'Deduct' || cellValue.startsWith('-')) {
                  cell.font = { size: 10, bold: true, color: { argb: 'FFDC143C' } };
                }
              }
            });

            movementRowIndex++;
          });
        } else {
          // No movements found
          movementSheet.getCell(`A${movementRowIndex}`).value = 'No movement history available for this stock item';
          movementSheet.mergeCells(`A${movementRowIndex}:J${movementRowIndex}`);
          const noMovCell = movementSheet.getCell(`A${movementRowIndex}`);
          noMovCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
          noMovCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          noMovCell.alignment = { horizontal: 'center', vertical: 'middle' };
          noMovCell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          movementSheet.getRow(movementRowIndex).height = 25;
          movementRowIndex++;
        }

        // Add spacing between stock items
        movementRowIndex += 2;
      });

      // === CONSOLIDATED MOVEMENT TIMELINE SHEET ===

      // Consolidated timeline title
      consolidatedMovementSheet.getCell('A1').value = 'ALL STOCK MOVEMENTS - CHRONOLOGICAL TIMELINE';
      consolidatedMovementSheet.mergeCells('A1:K1');
      const consTitle = consolidatedMovementSheet.getCell('A1');
      consTitle.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, italic: true };
      consTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A0DAD' } };
      consTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      consTitle.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      consolidatedMovementSheet.getRow(1).height = 45;

      // Date
      consolidatedMovementSheet.getCell('A2').value = `Generated: ${generatedDate}`;
      consolidatedMovementSheet.mergeCells('A2:K2');
      const consDate = consolidatedMovementSheet.getCell('A2');
      consDate.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, italic: true };
      consDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A2BE2' } };
      consDate.alignment = { horizontal: 'center', vertical: 'middle' };
      consDate.border = {
        top: { style: 'thin' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      consolidatedMovementSheet.getRow(2).height = 25;

      // Consolidated headers
      const consolidatedHeaders = [
        { header: 'Date & Time', width: 20 },
        { header: 'Product Name', width: 30 },
        { header: 'Part Number', width: 20 },
        { header: 'Action', width: 15 },
        { header: 'Qty Change', width: 15 },
        { header: 'Before', width: 12 },
        { header: 'After', width: 12 },
        { header: 'Person/Reason', width: 25 },
        { header: 'Equipment Name', width: 25 },
        { header: 'Equipment No.', width: 20 },
        { header: 'Stock Item ID', width: 15 }
      ];

      // Set consolidated sheet column widths and headers
      consolidatedHeaders.forEach((header, index) => {
        consolidatedMovementSheet.getColumn(index + 1).width = header.width;
        consolidatedMovementSheet.getCell(4, index + 1).value = header.header;
      });

      // Style consolidated headers
      const consHeaderRow = consolidatedMovementSheet.getRow(4);
      consHeaderRow.height = 40;
      consHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF FF6347' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // Create consolidated movements array
      const allMovements = [];
      filteredStocks.forEach((stock, stockIndex) => {
        if (stock.movements && Array.isArray(stock.movements) && stock.movements.length > 0) {
          stock.movements.forEach((movement, movIndex) => {
            allMovements.push({
              stockId: `ITEM-${stockIndex + 1}`,
              productName: stock.product,
              partNumber: stock.serialNumber,
              date: movement.date,
              time: movement.time,
              type: movement.type,
              quantity: movement.quantity || 0,
              previousQuantity: movement.previousQuantity || 0,
              newQuantity: movement.newQuantity || 0,
              mechanicName: movement.mechanicName || 'N/A',
              reason: movement.reason || 'N/A',
              equipmentName: movement.equipmentName || 'N/A',
              equipmentNumber: movement.equipmentNumber || 'N/A'
            });
          });
        }
      });

      // Sort all movements by date (most recent first)
      allMovements.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      // Add consolidated movement data
      let consRowIndex = 5;
      allMovements.forEach((movement, index) => {
        const dateTime = `${new Date(movement.date).toLocaleDateString()} ${movement.time || new Date(movement.date).toLocaleTimeString()}`;
        const actionType = movement.type.charAt(0).toUpperCase() + movement.type.slice(1);
        const quantityChange = movement.type === 'add' ? `+${movement.quantity}` : `-${movement.quantity}`;

        let personReason = 'N/A';
        let equipmentName = 'N/A';
        let equipmentNumber = 'N/A';

        if (movement.type === 'deduct') {
          personReason = movement.mechanicName || 'Unknown';
          equipmentName = movement.equipmentName || 'Unknown';
          equipmentNumber = movement.equipmentNumber || 'N/A';
        } else if (movement.type === 'add') {
          personReason = `System: ${movement.reason}`;
          equipmentName = 'System Operation';
          equipmentNumber = 'N/A';
        }

        const consRowData = [
          dateTime,
          movement.productName,
          movement.partNumber,
          actionType,
          quantityChange,
          movement.previousQuantity,
          movement.newQuantity,
          personReason,
          equipmentName,
          equipmentNumber,
          movement.stockId
        ];

        // Add consolidated row data
        consRowData.forEach((value, colIndex) => {
          consolidatedMovementSheet.getCell(consRowIndex, colIndex + 1).value = value;
        });

        // Style consolidated row
        const row = consolidatedMovementSheet.getRow(consRowIndex);
        row.height = 25;
        row.eachCell((cell, colNumber) => {
          cell.font = { size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };

          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF0E6' } };
          }

          // Color code by action type
          const cellValue = cell.value;
          if (typeof cellValue === 'string') {
            if (cellValue === 'Add' || cellValue.startsWith('+')) {
              cell.font = { size: 10, bold: true, color: { argb: 'FF228B22' } };
            } else if (cellValue === 'Deduct' || cellValue.startsWith('-')) {
              cell.font = { size: 10, bold: true, color: { argb: 'FFDC143C' } };
            }
          }
        });

        consRowIndex++;
      });

      // Add summary statistics to consolidated sheet
      if (allMovements.length > 0) {
        consRowIndex += 2;

        // Summary header
        consolidatedMovementSheet.getCell(`A${consRowIndex}`).value = 'CONSOLIDATED MOVEMENT SUMMARY';
        consolidatedMovementSheet.mergeCells(`A${consRowIndex}:K${consRowIndex}`);
        const consSummCell = consolidatedMovementSheet.getCell(`A${consRowIndex}`);
        consSummCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        consSummCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4682B4' } };
        consSummCell.alignment = { horizontal: 'center', vertical: 'middle' };
        consSummCell.border = {
          top: { style: 'thick' }, left: { style: 'thick' },
          bottom: { style: 'thick' }, right: { style: 'thick' }
        };
        consolidatedMovementSheet.getRow(consRowIndex).height = 35;
        consRowIndex++;

        // Summary statistics
        const totalAdditions = allMovements.filter(m => m.type === 'add').length;
        const totalDeductions = allMovements.filter(m => m.type === 'deduct').length;
        const totalQuantityAdded = allMovements.filter(m => m.type === 'add').reduce((sum, m) => sum + (m.quantity || 0), 0);
        const totalQuantityDeducted = allMovements.filter(m => m.type === 'deduct').reduce((sum, m) => sum + (m.quantity || 0), 0);
        const uniqueStockItems = new Set(allMovements.map(m => m.stockId)).size;

        const summaryStats = [
          `Total Movements: ${allMovements.length}`,
          `Stock Items with Activity: ${uniqueStockItems}`,
          `Total Additions: ${totalAdditions}`,
          `Total Deductions: ${totalDeductions}`,
          `Quantity Added: ${totalQuantityAdded}`,
          `Quantity Deducted: ${totalQuantityDeducted}`,
          `Net Stock Change: ${totalQuantityAdded - totalQuantityDeducted}`
        ];

        // Add summary data in a grid format
        let summaryStartCol = 1;
        summaryStats.forEach((stat, index) => {
          if (index % 4 === 0 && index > 0) {
            consRowIndex++;
            summaryStartCol = 1;
          }

          const colSpan = index < 4 ? 3 : 2; // First row spans 3 cols, second row spans 2 cols
          const startCol = summaryStartCol;
          const endCol = summaryStartCol + colSpan - 1;

          consolidatedMovementSheet.getCell(consRowIndex, startCol).value = stat;
          consolidatedMovementSheet.mergeCells(`${String.fromCharCode(64 + startCol)}${consRowIndex}:${String.fromCharCode(64 + endCol)}${consRowIndex}`);

          const summaryCell = consolidatedMovementSheet.getCell(consRowIndex, startCol);
          summaryCell.font = { bold: true, size: 11, color: { argb: 'FF2C3E50' } };
          summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } };
          summaryCell.alignment = { horizontal: 'center', vertical: 'middle' };
          summaryCell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };

          summaryStartCol = endCol + 1;
        });

        consolidatedMovementSheet.getRow(consRowIndex).height = 30;
      }

      // Generate filename with current date and time
      const now = new Date();
      const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0');
      const filename = `All_Stock_Report_${dateStr}_${timeStr}.xlsx`;

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate buffer and create blob
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);

      setMessage({
        text: 'Enhanced stock report with organized movement history exported successfully! Check the "Movement History by Stock" sheet for organized data.',
        type: 'success'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setMessage({
        text: 'Failed to export data to Excel. Please try again.',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-manage-container">
      <div className="stock-manage-header">
        <h1 className="stock-manage-title">Stock Management</h1>
        <div className="stock-manage-datetime">{currentDateTime}</div>
      </div>

      <div className="stock-manage-actions">
        <div className="toolkits-actions">
          <button className="stock-manage-add-btn" onClick={openAddForm}>
            Add Stock
          </button>
          <button className="export-excel-btn" onClick={exportToExcel}>
            Export to Excel
          </button>
        </div>
        <div className="stock-search-container">
          <div className="stock-search-input-container">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="stock-search-input"
            />
            {searchTerm && (
              <button
                className="stock-search-clear"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
          <button
            className="stock-print-btn"
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`stock-manage-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="stock-manage-loading">Loading stock inventory...</div>
      ) : error ? (
        <div className="stock-manage-error">{error}</div>
      ) : (
        <div className="stock-manage-table-container">
          {/* Print-only elements */}
          <div className="print-header" style={{ display: 'none' }}>
            Stock Inventory Report
          </div>
          <div className="print-date" style={{ display: 'none' }}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>

          <table className="stock-manage-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>For</th>
                <th>Product Name</th>
                <th>Part Number</th>
                <th>Equipment(s)</th>
                <th>Stock Count</th>
                <th>Status</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.type}</td>
                  <td>{item.product}</td>
                  <td>{item.serialNumber}</td>
                  <td>
                    {item.equipments && item.equipments.length > 0 ? (
                      <div className="stock-equipment-list">
                        {item.equipments.slice(0, 1).map((equip, i) => (
                          <div key={i} className="stock-equipment-item">
                            {equip}
                          </div>
                        ))}
                        {item.equipments.length > 2 && (
                          <div className="stock-equipment-more">
                            +{item.equipments.length - 1} more
                          </div>
                        )}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td>{item.stockCount}</td>
                  <td>
                    <span className={`stock-manage-status-badge ${calculateStatus(item.stockCount)}`}>
                      {calculateStatus(item.stockCount) === 'available' ? 'In Stock' :
                        calculateStatus(item.stockCount) === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="stock-manage-action-buttons no-print">
                    <button className="stock-manage-action-btn details" onClick={() => showDetails(item)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected stock details sidebar */}
      {selectedStock && (
        <div className="stock-manage-details no-print">
          <div className="stock-manage-details-header">
            <h2>Stock Details</h2>
            <button className="stock-manage-close-btn" onClick={() => setSelectedStock(null)}>×</button>
          </div>
          <div className="stock-manage-details-content">
            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Type:</span>
              <span className="stock-manage-value">{selectedStock.type}</span>
            </div>

            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Product:</span>
              <span className="stock-manage-value">{selectedStock.product}</span>
            </div>
            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Serial Number:</span>
              <span className="stock-manage-value">{selectedStock.serialNumber}</span>
            </div>

            {selectedStock.equipments && selectedStock.equipments.length > 0 && (
              <div className="stock-manage-equipment-section">
                <h3>Associated Equipment(s)</h3>
                <div className="stock-equipment-details">
                  {selectedStock.equipments.map((equipment, index) => (
                    <div key={index} className="equipment-detail-card">
                      {equipment}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Date:</span>
              <span className="stock-manage-value">{formatDate(selectedStock.date)}</span>
            </div>
            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Rate:</span>
              <span className="stock-manage-value">{selectedStock.rate}</span>
            </div>
            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Stock Count:</span>
              <span className="stock-manage-value">{selectedStock.stockCount}</span>
            </div>
            <div className="stock-manage-detail-item">
              <span className="stock-manage-label">Status:</span>
              <span className={`stock-manage-value stock-manage-status-badge ${calculateStatus(selectedStock.stockCount)}`}>
                {calculateStatus(selectedStock.stockCount) === 'available' ? 'In Stock' :
                  calculateStatus(selectedStock.stockCount) === 'low' ? 'Low Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="stock-manage-stock-progress">
              <h3>Stock Level</h3>
              <div className="stock-manage-progress-container">
                <div
                  className={`stock-manage-progress-bar ${calculateStatus(selectedStock.stockCount)}`}
                  style={{
                    width: `${Math.min(100, (selectedStock.stockCount / 20) * 100)}%`
                  }}
                >
                  <span className="stock-manage-progress-text">
                    {selectedStock.stockCount} / 20
                  </span>
                </div>
              </div>
            </div>

            <div className="stock-manage-actions-section">
              <h3>Actions</h3>
              <div className="stock-manage-action-btn-group">
                <button className="stock-manage-action-btn edit" onClick={() => openUpdateForm(selectedStock)}>
                  Edit Stock
                </button>
                <button
                  className="stock-manage-action-btn reduce"
                  onClick={() => setShowAddForm(true)}
                  style={{ backgroundColor: '#1221f3b2' }}
                >
                  Add Stock
                </button>
                <button
                  className="stock-manage-action-btn reduce"
                  onClick={() => setShowReduceForm(true)}
                  style={{ backgroundColor: '#8417a5ff' }}
                >
                  Reduce Stock
                </button>
                <button className="stock-manage-action-btn delete" onClick={() => deleteStock(selectedStock._id)}>
                  Delete Stock
                </button>
              </div>
            </div>

            <div className="stock-manage-history-section">
              <h3>Stock Movement History</h3>
              <button
                className="stock-manage-action-btn history"
                onClick={() => setShowStockHistory(!showStockHistory)}
              >
                {showStockHistory ? 'Hide History' : 'Show History'}
              </button>

              {showStockHistory && (
                <div className="stock-manage-history-table-container">
                  <table className="stock-manage-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Previous</th>
                        <th>Change</th>
                        <th>New</th>
                        <th>
                          Who Take it / Reason
                        </th>
                        <th>
                          Reg No
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStock.movements && selectedStock.movements.length > 0 ? (
                        selectedStock.movements
                          .slice()
                          .reverse()
                          .map((movement, index) => (
                            <tr key={index}>
                              <td>{formatDate(movement.date)}</td>
                              <td>
                                <span className={`stock-manage-history-badge ${movement.type}`}>
                                  {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                                </span>
                              </td>
                              <td>{movement.previousQuantity}</td>
                              <td className={movement.type === 'add' ? 'stock-manage-positive' : 'stock-manage-negative'}>
                                {movement.type === 'add' ? '+' : '-'}{movement.quantity}
                              </td>
                              <td>{movement.newQuantity}</td>
                              <td>{movement.mechanicName || movement.reason || 'Not found'}</td>
                              <td>{movement.equipmentNumber || movement.equipmentNumber || 'Not found'}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="stock-manage-no-history">
                            No stock movement history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddForm && selectedStock && (
        <div className="stock-form-modal-overlay no-print">
          <div className="stock-form-modal">
            <div className="stock-form-header">
              <h2>Add Stock: {selectedStock.product}</h2>
              <button className="stock-form-close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddStock} className="stock-form">
              <div className="stock-form-group">
                <label htmlFor="reduce-stockCount">Quantity to Add</label>
                <input
                  type="number"
                  id="add-stockCount"
                  name="stockCount"
                  value={addFormData.stockCount}
                  onChange={(e) => setAddFormData({ ...addFormData, stockCount: e.target.value })}
                  placeholder="Enter quantity to Add"
                  min="1"
                  required
                />
                <small>Current stock: {selectedStock.stockCount}</small>
              </div>

              <div className="stock-form-group">
                <label htmlFor="reason">Reason</label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={addFormData.reason}
                  onChange={(e) => setAddFormData({ ...addFormData, reason: e.target.value })}
                  placeholder="Enter reason"
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="reduce-date">Date</label>
                <input
                  type="date"
                  id="reduce-date"
                  name="date"
                  value={addFormData.date}
                  onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                  required
                />
              </div>

              <div className="stock-form-actions">
                <button
                  type="button"
                  className="stock-form-action-btn cancel"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stock-form-action-btn submit"
                >
                  Confirm Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reduce Stock Form Modal */}
      {showReduceForm && selectedStock && (
        <div className="stock-form-modal-overlay no-print">
          <div className="stock-form-modal">
            <div className="stock-form-header">
              <h2>Reduce Stock: {selectedStock.product}</h2>
              <button className="stock-form-close-btn" onClick={() => setShowReduceForm(false)}>×</button>
            </div>
            <form onSubmit={handleReduceStock} className="stock-form">
              <div className="stock-form-group">
                <label htmlFor="reduce-stockCount">Quantity to Reduce</label>
                <input
                  type="number"
                  id="reduce-stockCount"
                  name="stockCount"
                  value={reduceFormData.stockCount}
                  onChange={(e) => setReduceFormData({ ...reduceFormData, stockCount: e.target.value })}
                  placeholder="Enter quantity to reduce"
                  min="1"
                  max={selectedStock.stockCount}
                  required
                />
                <small>Current stock: {selectedStock.stockCount}</small>
              </div>

              <div className="stock-form-group">
                <label htmlFor="equipmentName">Equipment Name</label>
                <div className="dropdown-container">
                  <input
                    type="text"
                    id="equipmentName"
                    name="equipmentName"
                    value={reduceFormData.equipmentName}
                    onChange={handleEquipmentNameChange}
                    onFocus={() => {
                      setEquipmentSearchTerm(reduceFormData.equipmentName);
                      setShowEquipmentDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowEquipmentDropdown(false), 200)}
                    placeholder="Search or enter equipment name"
                    required
                  />
                  {showEquipmentDropdown && filteredEquipments.length > 0 && (
                    <div className="search-dropdown">
                      {filteredEquipments.slice(0, 10).map((equipment) => (
                        <div
                          key={equipment._id}
                          className="dropdown-item"
                          onClick={() => handleEquipmentSelect(equipment)}
                        >
                          <div className="dropdown-item-main">{equipment.machine}</div>
                          <div className="dropdown-item-sub">Reg No: {equipment.regNo}</div>
                        </div>
                      ))}
                      {filteredEquipments.length > 10 && (
                        <div className="dropdown-more">
                          +{filteredEquipments.length - 10} more results...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="stock-form-group">
                <label htmlFor="equipmentNumber">Equipment Number</label>
                <input
                  type="text"
                  id="equipmentNumber"
                  name="equipmentNumber"
                  value={reduceFormData.equipmentNumber}
                  onChange={(e) => setReduceFormData({ ...reduceFormData, equipmentNumber: e.target.value })}
                  placeholder="Auto-filled or enter manually"
                  required
                />
                <small style={{ color: 'var(--stock-disabled-text)', fontSize: '12px' }}>
                  Auto-filled when selecting from equipment dropdown
                </small>
              </div>

              <div className="stock-form-group">
                <label htmlFor="mechanicName">Mechanic Name</label>
                <div className="dropdown-container">
                  <input
                    type="text"
                    id="mechanicName"
                    name="mechanicName"
                    value={reduceFormData.mechanicName}
                    onChange={handleMechanicNameChange}
                    onFocus={() => {
                      setMechanicSearchTerm(reduceFormData.mechanicName);
                      setShowMechanicDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowMechanicDropdown(false), 200)}
                    placeholder="Search or enter mechanic name"
                    required
                  />
                  {showMechanicDropdown && filteredMechanics.length > 0 && (
                    <div className="search-dropdown">
                      {filteredMechanics.slice(0, 10).map((mechanic) => (
                        <div
                          key={mechanic._id}
                          className="dropdown-item"
                          onClick={() => handleMechanicSelect(mechanic)}
                        >
                          <div className="dropdown-item-main">{mechanic.name}</div>
                        </div>
                      ))}
                      {filteredMechanics.length > 10 && (
                        <div className="dropdown-more">
                          +{filteredMechanics.length - 10} more results...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="stock-form-group">
                <label htmlFor="reduce-date">Date</label>
                <input
                  type="date"
                  id="reduce-date"
                  name="date"
                  value={reduceFormData.date}
                  onChange={(e) => setReduceFormData({ ...reduceFormData, date: e.target.value })}
                  required
                />
              </div>

              <div className="stock-form-actions">
                <button
                  type="button"
                  className="stock-form-action-btn cancel"
                  onClick={() => setShowReduceForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stock-form-action-btn submit"
                >
                  Confirm Reduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Modal for Add/Update Stock */}
      {showForm && (
        <div className="stock-form-modal-overlay no-print">
          <div className="stock-form-modal">
            <div className="stock-form-header">
              <h2>{formMode === 'add' ? 'Add New Stock' : 'Update Stock'}</h2>
              <button className="stock-form-close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit} className="stock-form">
              <div className="stock-form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="stock">For Stock</option>
                  <option value="equipment">For Equipment</option>
                  <option value="all">For All Machines</option>
                </select>
              </div>

              {formData.type === 'equipment' && (
                <div className="stock-form-group">
                  <label>Select Equipment(s)</label>
                  <div className="stock-equipment-selector">
                    <div className="selected-equipments">
                      {selectedEquipments.map((equip, index) => (
                        <span key={index} className="selected-equipment-tag">
                          {equip}
                          <button
                            type="button"
                            className="remove-equipment-btn"
                            onClick={() => setSelectedEquipments(prev => prev.filter(e => e !== equip))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <Select
                      options={equipmentOptions}
                      isMulti
                      value={selectedEquipments.map(equip => ({
                        value: equip,
                        label: equip
                      }))}
                      onChange={(selected) => {
                        setSelectedEquipments(selected ? selected.map(item => item.value) : []);
                      }}
                      placeholder="Search equipment..."
                      className="equipment-select"
                      noOptionsMessage={() => "No matching equipment found"}
                    />
                  </div>
                </div>
              )}

              <div className="stock-form-group">
                <label htmlFor="product">Product</label>
                <input
                  type="text"
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="serialNumber">Serial Number</label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="Enter serial number"
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="rate">Rate</label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  placeholder="Enter rate"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="stockCount">Stock Count</label>
                <input
                  type="number"
                  id="stockCount"
                  name="stockCount"
                  value={formData.stockCount}
                  onChange={handleInputChange}
                  placeholder="Enter stock count"
                  min="0"
                  required
                />
              </div>

              <div className="stock-form-actions">
                <button
                  type="button"
                  className="stock-form-action-btn cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stock-form-action-btn submit"
                >
                  {formMode === 'add' ? 'Add Stock' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManage;