import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import './BackchargeList.css';
import { apiRequest } from '../../utils/0auth';
import { useSearch } from '../../context/SearchContext';

function BackchargeList() {
  const { searchTerm, setSearchTerm } = useSearch();
  const [backcharges, setBackcharges] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackcharge, setSelectedBackcharge] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [supplierFilter, setSupplierFilter] = useState('');
  const [uniqueSuppliers, setUniqueSuppliers] = useState([]);

  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Get current date and time
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
    fetchBackcharges();
  }, []);

  const fetchBackcharges = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/backcharge/get-backcharge-reports`, 'GET');

      if (response.ok) {
        const data = await response.json()
        setBackcharges(data.data);
        setFilteredData(data.data);

        // Extract unique suppliers for filter dropdown
        const suppliers = [...new Set(data.data.map(item => item.supplierName))].sort();
        setUniqueSuppliers(suppliers);
      } else {
        console.error('Failed to fetch backcharge reports:', response.message);
      }
    } catch (error) {
      console.error('Error fetching backcharge reports:', error);
    }
  };

  useEffect(() => {
    if (backcharges && backcharges.length > 0) {
      let results = backcharges;

      // Filter by search term
      if (searchTerm) {
        results = results.filter(item => {
          const searchableFields = [
            item.reportNo,
            item.refNo,
            item.supplierName,
            item.equipmentType,
            item.plateNo,
            item.model,
            item.contactPerson,
            item.siteLocation,
            item.scopeOfWork?.combinedText || '',
            item.workshopComments?.combinedText || ''
          ];

          return searchableFields.some(field =>
            String(field).toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }

      // Filter by supplier
      if (supplierFilter) {
        results = results.filter(item => item.supplierName === supplierFilter);
      }

      setFilteredData(results);
    }
  }, [searchTerm, backcharges, supplierFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleSupplierFilterChange = (e) => {
    setSupplierFilter(e.target.value);
  };

  const handleRowClick = (reportNo) => {
    navigate(`/backcharge-details/${reportNo}`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1, p { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
        .no-results { text-align: center; font-style: italic; }
        .print-money { font-weight: bold; }
      </style>
    `;

    const content = `
      <html>
        <head>
          <title>Backcharge Reports List</title>
          ${style}
        </head>
        <body>
          <h1>Backcharge Reports List</h1>
          ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
          ${supplierFilter ? `<p>Filtered by supplier: "<strong>${supplierFilter}</strong>"</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref No</th>
                <th>Report No</th>
                <th>Supplier</th>
                <th>Equipment</th>
                <th>Plate No</th>
                <th>Contact</th>
                <th>Scope of Work</th>
                <th>Spare Parts</th>
                <th>Labour</th>
                <th>Total Cost</th>
                <th>Deduction</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>${item.refNo}</td>
                  <td>${item.reportNo}</td>
                  <td>${item.supplierName}</td>
                  <td>${item.equipmentType}</td>
                  <td>${item.plateNo}</td>
                  <td>${item.contactPerson}</td>
                  <td>${(item.scopeOfWork?.combinedText || '').substring(0, 50)}...</td>
                  <td class="print-money">QR ${item.costSummary?.sparePartsCost || 0}</td>
                  <td class="print-money">QR ${item.costSummary?.labourCharges || 0}</td>
                  <td class="print-money">QR ${item.costSummary?.totalCost || 0}</td>
                  <td class="print-money">QR ${item.costSummary?.approvedDeduction || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 10px; text-align: center;">
            Showing ${filteredData?.length || 0} ${searchTerm || supplierFilter ? 'matching entries' : 'entries'}
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

  const handleDeleteClick = (e, backcharge) => {
    e.stopPropagation();
    setSelectedBackcharge(backcharge);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBackcharge) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/backcharge/delete-backcharge/${selectedBackcharge._id}`,
        'DELETE'
      );

      if (response.success) {
        setShowDeleteModal(false);
        setDeleteStatus({
          message: `Backcharge report ${selectedBackcharge.reportNo} successfully deleted.`,
          isError: false
        });
        fetchBackcharges();
      } else {
        throw new Error(response.message || 'Failed to delete backcharge report');
      }
    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({
        message: 'Error deleting backcharge report: ' + error.message,
        isError: true
      });
      console.error('Error deleting backcharge report:', error);
    } finally {
      setShowStatusModal(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBackcharge(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setDeleteStatus({ message: '', isError: false });
  };

  const handleViewBackcharge = (e, backcharge) => {
    e.stopPropagation();
    navigate(`/backcharge-doc/${encodeURIComponent(backcharge.refNo)}`);
  };

  const handleAddBackcharge = () => {
    navigate('/backcharge-form');
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterByDate = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setDeleteStatus({
        message: 'Please select both start and end dates',
        isError: true
      });
      setShowStatusModal(true);
      return;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    const filtered = backcharges.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    setFilteredData(filtered);
  };

  const resetFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSupplierFilter('');
    setSearchTerm('');
    setFilteredData(backcharges);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount) => {
    return `QR ${(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="bcl-main-container">
      <div className="bcl-controls-wrapper">
        <div className="bcl-search-wrapper">
          <input
            type="text"
            placeholder="Search backcharge reports..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="bcl-search-field"
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="bcl-clear-btn">
              ×
            </button>
          )}
        </div>
        <div className="bcl-actions-wrapper">
          <button onClick={handleAddBackcharge} className="bcl-btn bcl-btn-add">
            Add Backcharge
          </button>
          <button onClick={handlePrint} className="bcl-btn bcl-btn-print">
            Print Table
          </button>
        </div>
      </div>

      <div className="bcl-filters-container">
        <div className="bcl-filter-group">
          <label>Supplier:</label>
          <select
            value={supplierFilter}
            onChange={handleSupplierFilterChange}
            className="bcl-filter-select"
          >
            <option value="">All Suppliers</option>
            {uniqueSuppliers.map(supplier => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </div>
        <div className="bcl-filter-group">
          <label>From:</label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateRangeChange}
            className="bcl-date-input"
          />
        </div>
        <div className="bcl-filter-group">
          <label>To:</label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateRangeChange}
            className="bcl-date-input"
          />
        </div>
        <button onClick={handleFilterByDate} className="bcl-btn bcl-btn-filter">
          Filter by Date
        </button>
        <button onClick={resetFilters} className="bcl-btn bcl-btn-reset">
          Reset All
        </button>
      </div>

      <div className="bcl-table-summary">
        {(searchTerm || supplierFilter || dateRange.startDate) ? (
          `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
        ) : (
          `Showing ${filteredData?.length || 0} entries`
        )}
      </div>

      <div className="bcl-table-wrapper">
        <table className="bcl-data-table" ref={tableRef}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref No</th>
              <th>Report No</th>
              <th>Supplier</th>
              <th>Equipment</th>
              <th>Plate No</th>
              <th>Contact</th>
              <th>Scope of Work</th>
              <th>Work Summary</th>
              <th>Spare Parts</th>
              <th>Labour</th>
              <th>Total Cost</th>
              <th>Deduction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((backcharge) => (
                <tr
                  key={backcharge._id}
                  onClick={() => handleRowClick(backcharge.reportNo)}
                  className="bcl-table-row"
                >
                  <td>{formatDate(backcharge.date)}</td>
                  <td>{backcharge.refNo}</td>
                  <td>{backcharge.reportNo}</td>
                  <td>{backcharge.supplierName}</td>
                  <td>{backcharge.equipmentType}</td>
                  <td>{backcharge.plateNo}</td>
                  <td>{backcharge.contactPerson}</td>
                  <td className="bcl-text-cell">
                    {(backcharge.scopeOfWork?.combinedText || '').substring(0, 50)}
                    {(backcharge.scopeOfWork?.combinedText || '').length > 50 ? '...' : ''}
                  </td>
                  <td className="bcl-text-cell">
                    {(backcharge.workshopComments?.combinedText || '').substring(0, 50)}
                    {(backcharge.workshopComments?.combinedText || '').length > 50 ? '...' : ''}
                  </td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.sparePartsCost)}</td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.labourCharges)}</td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.totalCost)}</td>
                  <td className="bcl-currency-cell">{formatCurrency(backcharge.costSummary?.approvedDeduction)}</td>
                  <td className="bcl-actions-cell" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="bcl-btn bcl-btn-view"
                      onClick={(e) => handleViewBackcharge(e, backcharge)}
                    >
                      View
                    </button>
                    <button
                      className="bcl-btn bcl-btn-delete"
                      onClick={(e) => handleDeleteClick(e, backcharge)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" className="bcl-no-data">
                  {backcharges?.length > 0 ? 'No matching records found' : 'Loading backcharge data...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="bcl-modal-backdrop">
          <div className="bcl-modal-container">
            <div className="bcl-modal-header">
              <h2>Confirm Deletion</h2>
              <button className="bcl-modal-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="bcl-modal-body">
              <p>Are you sure you want to delete backcharge report <strong>{selectedBackcharge?.reportNo}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="bcl-modal-footer">
              <button className="bcl-btn bcl-btn-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="bcl-btn bcl-btn-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="bcl-modal-backdrop">
          <div className={`bcl-modal-container ${deleteStatus.isError ? 'bcl-modal-error' : 'bcl-modal-success'}`}>
            <div className="bcl-modal-header">
              <h2>{deleteStatus.isError ? 'Error' : 'Success'}</h2>
              <button className="bcl-modal-close" onClick={closeStatusModal}>×</button>
            </div>
            <div className="bcl-modal-body">
              <p>{deleteStatus.message}</p>
            </div>
            <div className="bcl-modal-footer">
              <button className="bcl-btn bcl-btn-ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BackchargeList;