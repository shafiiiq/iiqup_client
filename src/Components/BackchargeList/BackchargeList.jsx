import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import './BackchargeList.css';
import { apiRequest } from '../../utils/0auth';
import { useSearch } from '../../context/SearchContext';
import Button from '../../common/Button/Button';
import DevModal from '../../common/DevModal';

function BackchargeList() {
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [backcharges, setBackcharges] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackcharge, setSelectedBackcharge] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFilter: 'all',
    suppliers: [],
    equipmentTypes: [],
    costRange: { min: '', max: '' },
    lastMonthsCount: 6,
    customStartDate: '',
    customEndDate: ''
  });

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

      } else {
        console.error('Failed to fetch backcharge reports:', response.message);
      }
    } catch (error) {
      console.error('Error fetching backcharge reports:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyAllFilters = () => {
    let results = [...backcharges];

    // Apply date filter
    if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
      const startDate = new Date(filters.customStartDate);
      const endDate = new Date(filters.customEndDate);
      results = results.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    } else if (filters.dateFilter === 'lastXmonths') {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - filters.lastMonthsCount);
      results = results.filter(item => new Date(item.date) >= monthsAgo);
    } else if (filters.dateFilter === 'thismonth') {
      const now = new Date();
      results = results.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear();
      });
    }

    // Apply supplier filter
    if (filters.suppliers.length > 0) {
      results = results.filter(item =>
        filters.suppliers.includes(item.supplierName)
      );
    }

    // Apply equipment filter
    if (filters.equipmentTypes.length > 0) {
      results = results.filter(item =>
        filters.equipmentTypes.includes(item.equipmentType)
      );
    }

    // Apply cost range filter
    if (filters.costRange.min || filters.costRange.max) {
      results = results.filter(item => {
        const cost = item.costSummary?.totalCost || 0;
        const min = filters.costRange.min ? parseFloat(filters.costRange.min) : 0;
        const max = filters.costRange.max ? parseFloat(filters.costRange.max) : Infinity;
        return cost >= min && cost <= max;
      });
    }

    // Apply search filter
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

    setFilteredData(results);
  };

  useEffect(() => {
    applyAllFilters();
  }, [backcharges, searchTerm, filters]);

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
    applyAllFilters();
  };

  const handleResetFilters = () => {
    setFilters({
      dateFilter: 'all',
      suppliers: [],
      equipmentTypes: [],
      costRange: { min: '', max: '' },
      lastMonthsCount: 6,
      customStartDate: '',
      customEndDate: ''
    });
    setFilteredData(backcharges);
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
             Showing ${filteredData?.length || 0} ${searchTerm ? 'matching entries' : 'entries'}          </div>
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

  const handleViewBackcharge = (backcharge) => {
    navigate(`/backcharge-doc/${encodeURIComponent(backcharge.refNo)}`);
  };

  const handleAddBackcharge = () => {
    navigate('/backcharge-form');
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
        <div className="bcl-actions-wrapper">
          <Button
            text="Filters"
            onClick={() => setShowFiltersModal(true)}
            colorScheme="amber-600"
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
            text="Add Backcharge"
            onClick={handleAddBackcharge}
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
            text="Print Backcharge"
            onClick={handlePrint}
            colorScheme="violet-800"
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

      <div className="bcl-table-summary">
        {searchTerm || filters.suppliers.length > 0 || filters.dateFilter !== 'all' ? (
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
                    <Button
                      text="View Doc"
                      onClick={() => handleViewBackcharge(backcharge)}
                      colorScheme="blue-800"
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
                      text="Delete"
                      onClick={() => handleDeleteClick(backcharge)}
                      colorScheme="red-800"
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

      {/* Filter modal  */}
      <DevModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="Backcharge Filters"
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
            name: 'suppliers',
            label: 'Suppliers',
            type: 'checkbox',
            options: [...new Set(backcharges.map(item => item.supplierName).filter(Boolean))].map(s =>
              ({ value: s, label: s })
            )
          },
          {
            name: 'equipmentTypes',
            label: 'Equipment Types',
            type: 'checkbox',
            options: [...new Set(backcharges.map(item => item.equipmentType).filter(Boolean))].map(e =>
              ({ value: e, label: e })
            )
          },
          {
            name: 'costRange',
            label: 'Total Cost Range (QR)',
            type: 'range'
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
}

export default BackchargeList;