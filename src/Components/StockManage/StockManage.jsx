import React, { useState, useEffect } from 'react';
import './StockManage.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import ExcelJS from 'exceljs';
import Barcode from 'react-barcode';
import DevModal from '../../Common/DevModal/DevModal';
import { useSearch } from '../../context/SearchContext';
import Button from '../../Common/Button/Button';
import Loader from '../../Common/Loader/Loader';

function StockManage() {
  const { searchTerm } = useSearch();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentCategoryOptions, setEquipmentCategoryOptions] = useState([]);
  const [showReduceForm, setShowReduceForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [filteredEquipmentOptions, setFilteredEquipmentOptions] = useState([]);

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
    if (equipmentSearchTerm.trim() === '') {
      setFilteredEquipmentOptions(formData.type === 'specific-equipment' ? equipmentOptions : equipmentCategoryOptions);
    } else {
      const optionsToFilter = formData.type === 'specific-equipment' ? equipmentOptions : equipmentCategoryOptions;
      const filtered = optionsToFilter.filter(opt =>
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
        equipments: newEquipments
      });
    }
    setEquipmentSearchTerm('');
    setShowEquipmentDropdown(false);
  };

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        if (!response.ok) throw new Error('Failed to fetch equipments');
        const result = await response.json();

        const individualOptions = result.data.map(equip => ({
          value: `${equip.machine} - ${equip.regNo}`,
          label: `${equip.machine} - ${equip.regNo}`,
          equipment: equip
        }));

        const uniqueCombinations = new Set();
        result.data.forEach(equip => {
          const combo = `${equip.machine} - ${equip.brand}`;
          uniqueCombinations.add(combo);
        });

        const categoryOptions = Array.from(uniqueCombinations).map(combo => ({
          value: combo,
          label: combo
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
    const originalBodyClass = document.body.className;

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      document.title = `Stock_Inventory_Report_${dateStr}`;

      document.body.className = (originalBodyClass + ' stock-manage-print-mode').trim();

      const headerElement = document.querySelector('.stock-manage-header');
      if (headerElement) {
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        headerElement.setAttribute('data-sm-print-timestamp', `${currentDate} at ${currentTime}`);
      }

      const conflictingElements = document.querySelectorAll(
        '.sm-temp-print-header, .sm-temp-print-date, .print-header, .print-date'
      );
      conflictingElements.forEach(element => {
        if (element) {
          element.style.display = 'none';
        }
      });

      setTimeout(() => {
        window.print();

        setTimeout(() => {
          document.title = originalTitle;
          document.body.className = originalBodyClass;

          if (headerElement) {
            headerElement.removeAttribute('data-sm-print-timestamp');
          }

          conflictingElements.forEach(element => {
            if (element) {
              element.style.display = '';
            }
          });
        }, 500);
      }, 100);

    } catch (error) {
      console.error('Print error:', error);
      document.title = originalTitle;
      document.body.className = originalBodyClass;

      const headerElement = document.querySelector('.stock-manage-header');
      if (headerElement) {
        headerElement.removeAttribute('data-sm-print-timestamp');
      }
    }
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
      stockCount: stock.stockCount
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    try {
      const submitData = {
        ...formData,
        equipments: formData.equipments || []
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

      const workbook = new ExcelJS.Workbook();

      const inventorySheet = workbook.addWorksheet('Stock Inventory');

      const movementSheet = workbook.addWorksheet('Movement History by Stock');

      const consolidatedMovementSheet = workbook.addWorksheet('All Movements Timeline');

      const reportTitle = 'STOCK INVENTORY REPORT';
      const generatedDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

      const totalItems = stocks.length;
      const inStockItems = stocks.filter(s => calculateStatus(s.stockCount) === 'available').length;
      const lowStockItems = stocks.filter(s => calculateStatus(s.stockCount) === 'low').length;
      const outOfStockItems = stocks.filter(s => calculateStatus(s.stockCount) === 'out').length;
      const totalStockCount = stocks.reduce((sum, s) => sum + s.stockCount, 0);

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

      inventorySheet.getRow(3).height = 10;

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

      const summaryRow = inventorySheet.getRow(5);
      summaryRow.getCell(1).value = `Total Items: ${totalItems}`;
      summaryRow.getCell(4).value = `In Stock: ${inStockItems}`;
      summaryRow.getCell(7).value = `Low Stock: ${lowStockItems}`;
      summaryRow.getCell(10).value = `Out of Stock: ${outOfStockItems}`;
      summaryRow.getCell(13).value = `Total Stock Count: ${totalStockCount}`;

      inventorySheet.mergeCells('A5:C5');
      inventorySheet.mergeCells('D5:F5');
      inventorySheet.mergeCells('G5:I5');
      inventorySheet.mergeCells('J5:K5');
      inventorySheet.mergeCells('M5:M5');

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

      inventorySheet.getRow(6).height = 15;

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

      headers.forEach((header, index) => {
        inventorySheet.getColumn(index + 1).width = header.width;
      });

      headers.forEach((header, index) => {
        inventorySheet.getCell(dataHeaderRow, index + 1).value = header.header;
      });

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

      let currentRow = dataHeaderRow + 1;
      filteredStocks.forEach((stock, index) => {
        const status = calculateStatus(stock.stockCount);
        const statusText = status === 'available' ? 'In Stock' :
          status === 'low' ? 'Low Stock' : 'Out of Stock';

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

        rowData.forEach((value, colIndex) => {
          inventorySheet.getCell(currentRow, colIndex + 1).value = value;
        });

        currentRow++;
      });

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

      filteredStocks.forEach((stock, stockIndex) => {
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

        movementHeaders.forEach((header, index) => {
          movementSheet.getCell(movementRowIndex, index + 1).value = header.header;
        });

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

        if (stock.movements && Array.isArray(stock.movements) && stock.movements.length > 0) {
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

            movementRowData.forEach((value, colIndex) => {
              movementSheet.getCell(movementRowIndex, colIndex + 1).value = value;
            });

            const row = movementSheet.getRow(movementRowIndex);
            row.height = 25;
            row.eachCell((cell, colNumber) => {
              cell.font = { size: 10 };
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
              };

              if (index % 2 === 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF0' } };
              }

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

        movementRowIndex += 2;
      });


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

      consolidatedHeaders.forEach((header, index) => {
        consolidatedMovementSheet.getColumn(index + 1).width = header.width;
        consolidatedMovementSheet.getCell(4, index + 1).value = header.header;
      });

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

      allMovements.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

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

        consRowData.forEach((value, colIndex) => {
          consolidatedMovementSheet.getCell(consRowIndex, colIndex + 1).value = value;
        });

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

      if (allMovements.length > 0) {
        consRowIndex += 2;

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

        let summaryStartCol = 1;
        summaryStats.forEach((stat, index) => {
          if (index % 4 === 0 && index > 0) {
            consRowIndex++;
            summaryStartCol = 1;
          }

          const colSpan = index < 4 ? 3 : 2; 
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

      const now = new Date();
      const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0');
      const filename = `All_Stock_Report_${dateStr}_${timeStr}.xlsx`;

      await new Promise(resolve => setTimeout(resolve, 500));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

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
    <div className="stock-manage-container no-conflict-stocks">
      <div className="stock-manage-actions">
        <div className="toolkits-actions">
          <Button
            text="Add Stock"
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
            text="Export to Excel"
            onClick={exportToExcel}
            colorScheme="slate-600"
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
        </div>
      </div>

      {message.text && (
        <div className={`stock-manage-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
       <Loader/>
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

      {/* Selected stock details sidebar */}
      {selectedStock && (
        <div className="stock-manage-details no-print">
          <div className="stock-manage-details-header">
            <h2>Stock Details</h2>
            <button className="close-btn" onClick={() => setSelectedStock(null)}>
              <span class="material-symbols-rounded">
                close
              </span>
            </button>
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
                    width: `${Math.min(100, (selectedStock.stockCount / 10) * 100)}%`
                  }}
                >
                  <span className="stock-manage-progress-text">
                    {selectedStock.stockCount} / 20
                  </span>
                </div>
              </div>
              <div className="stock-manage-barcode-section">
                <h3>Toolkit Barcode</h3>
                <div className="stock-barcode-container">
                  <Barcode
                    value={selectedStock._id}
                    width={2}
                    height={60}
                    displayValue={true}
                    fontSize={14}
                  />
                </div>
                <p className="barcode-info">Scan this code to view toolkit details</p>
              </div>
            </div>

            <div className="stock-manage-actions-section">
              <h3>Actions</h3>
              <div className="stock-manage-action-btn-group">
                <Button
                  text="Edit Stock"
                  onClick={() => openUpdateForm(selectedStock)}
                  colorScheme="blue-800"
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
                  text="Add Stock"
                  onClick={() => setShowAddForm(true)}
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
                  text="Reduce Stock"
                  onClick={() => setShowReduceForm(true)}
                  colorScheme="amber-800"
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
                  text="Delete Stock"
                  onClick={() => deleteStock(selectedStock._id)}
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
              </div>
            </div>

            <div className="stock-manage-history-section">
              <h3>Stock Movement History</h3>
              <Button
                text={showStockHistory ? 'Hide History' : 'Show History'}
                onClick={() => setShowStockHistory(!showStockHistory)}
                colorScheme={showStockHistory ? 'indigo-900' : 'lime-700'}
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
                          <td colSpan="8" className="stock-manage-no-history">
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

      {/* Add Stock Modal using DevModal */}
      <DevModal
        isOpen={showAddForm && selectedStock}
        onClose={() => setShowAddForm(false)}
        type="form"
        title={`Add Stock: ${selectedStock?.product || ''}`}
        message={`Current stock: ${selectedStock?.stockCount || 0}`}
        formFields={[
          {
            name: 'stockCount',
            label: 'Quantity to Add',
            type: 'number',
            placeholder: 'Enter quantity to add',
            required: true
          },
          {
            name: 'reason',
            label: 'Reason',
            type: 'text',
            placeholder: 'Enter reason',
            required: true
          },
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true
          }
        ]}
        formValues={addFormData}
        onFormChange={(field, value) => {
          if (field === 'equipments') {
            setFormData({
              ...formData,
              equipments: value
            });
          } else {
            setFormData({
              ...formData,
              [field]: (field === 'rate' || field === 'stockCount') ? parseFloat(value) || 0 : value
            });
          }
        }}
        buttonText="Confirm Add"
        onButtonClick={handleAddStock}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowAddForm(false)}
      />

      {/* Reduce Stock Modal using DevModal */}
      <DevModal
        isOpen={showReduceForm && selectedStock}
        onClose={() => setShowReduceForm(false)}
        type="form"
        title={`Reduce Stock: ${selectedStock?.product || ''}`}
        message={`Current stock: ${selectedStock?.stockCount || 0}`}
        formFields={[
          {
            name: 'stockCount',
            label: 'Quantity to Reduce',
            type: 'number',
            placeholder: 'Enter quantity to reduce',
            required: true
          },
          {
            name: 'equipmentName',
            label: 'Equipment Name',
            type: 'text',
            placeholder: 'Search or enter equipment name',
            required: true
          },
          {
            name: 'equipmentNumber',
            label: 'Equipment Number',
            type: 'text',
            placeholder: 'Auto-filled or enter manually',
            required: true
          },
          {
            name: 'mechanicName',
            label: 'Mechanic Name',
            type: 'text',
            placeholder: 'Search or enter mechanic name',
            required: true
          },
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true
          }
        ]}
        formValues={reduceFormData}
        onFormChange={(field, value) => {
          if (field === 'stockCount') {
            setReduceFormData({
              ...reduceFormData,
              stockCount: parseInt(value) || 0
            });
          } else if (field === 'equipmentName') {
            setEquipmentSearchTerm(value);
            setReduceFormData({
              ...reduceFormData,
              equipmentName: value,
              equipmentNumber: ''
            });
          } else if (field === 'mechanicName') {
            setReduceFormData({
              ...reduceFormData,
              mechanicName: value
            });
          } else {
            setReduceFormData({
              ...reduceFormData,
              [field]: value
            });
          }
        }}
        buttonText="Confirm Reduction"
        onButtonClick={handleReduceStock}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowReduceForm(false)}
      />

      {/* Add/Update Stock Modal using DevModal */}
      <DevModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        type="form"
        title={formMode === 'add' ? 'Add New Stock' : 'Update Stock'}
        message="Fill in the stock details below"
        formFields={[
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            required: true,
            options: [
              { value: 'stock', label: 'For Stock' },
              { value: 'specific-equipment', label: 'For Specific Equipment' },
              { value: 'equipment', label: 'For Equipment' },
              { value: 'all', label: 'For All Machines' }
            ]
          },
          ...(formData.type === 'specific-equipment' ? [{
            name: 'equipments',
            label: 'Select Specific Equipment(s)',
            type: 'searchable-multi-select',
            required: true,
            placeholder: 'Search by equipment name or registration number...',
            showDropdown: showEquipmentDropdown,
            dropdownItems: filteredEquipmentOptions.map(opt => ({
              value: opt.value,
              label: opt.label.split(' - ')[0],
              subtitle: `Reg No: ${opt.label.split(' - ')[1] || 'N/A'}`
            })),
            onSearchFocus: () => {
              setShowEquipmentDropdown(true);
              setEquipmentSearchTerm('');
            },
            onSearch: (value) => {
              setEquipmentSearchTerm(value);
              setShowEquipmentDropdown(value.length > 0);
            },
            onSearchBlur: () => {
              setShowEquipmentDropdown(false);
            },
            onItemSelect: (item) => {
              handleEquipmentSelection(item);
            }
          }] : []),
          ...(formData.type === 'equipment' ? [{
            name: 'equipments',
            label: 'Select Equipment Categories',
            type: 'searchable-multi-select',
            required: true,
            placeholder: 'Search by equipment type and brand...',
            showDropdown: showEquipmentDropdown,
            dropdownItems: filteredEquipmentOptions.map(opt => ({
              value: opt.value,
              label: opt.label
            })),
            onSearchFocus: () => {
              setShowEquipmentDropdown(true);
              setEquipmentSearchTerm('');
            },
            onSearch: (value) => {
              setEquipmentSearchTerm(value);
              setShowEquipmentDropdown(value.length > 0);
            },
            onSearchBlur: () => {
              setShowEquipmentDropdown(false);
            },
            onItemSelect: (item) => {
              handleEquipmentSelection(item);
            }
          }] : []),
          {
            name: 'product',
            label: 'Product',
            type: 'text',
            placeholder: 'Enter product name',
            required: true
          },
          {
            name: 'serialNumber',
            label: 'Serial Number',
            type: 'text',
            placeholder: 'Enter serial number',
            required: true
          },
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true
          },
          {
            name: 'rate',
            label: 'Rate',
            type: 'number',
            placeholder: 'Enter rate',
            required: true
          },
          {
            name: 'stockCount',
            label: 'Stock Count',
            type: 'number',
            placeholder: 'Enter stock count',
            required: true
          }
        ]}
        formValues={formData}
        onFormChange={(field, value) => {
          setFormData({
            ...formData,
            [field]: (field === 'rate' || field === 'stockCount') ? parseFloat(value) || 0 : value
          });
        }}
        buttonText={formMode === 'add' ? 'Add Stock' : 'Update Stock'}
        onButtonClick={(e) => handleFormSubmit(e)}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowForm(false)}
      />
    </div>
  );
}

export default StockManage;