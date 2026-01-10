import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import './LpoList.css';
import { apiRequest } from '../../utils/0auth';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import DevModal from '../../common/DevModal';
import Button from '../../common/Button/Button';

function LpoList({ isAll, isEquip, isStock, isForAllEquip }) {
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const { regNo } = useParams()

  const [searchTerm, setSearchTerm] = useState('');
  const [lpos, setLpos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLpo, setSelectedLpo] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFilter: 'all',
    vendors: [],
    equipmentTypes: [],
    amountRange: { min: '', max: '' },
    lastMonthsCount: 6,
    customStartDate: '',
    customEndDate: ''
  });

  useEffect(() => {
    if (isAll) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of All');
    } else if (isEquip) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of Equipment');
    } else if (isStock) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of Stock');
    } else if (isForAllEquip) {
      setHeaderTitle('LPO List');
      setHeaderSubtitle('Of All Equipments');
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }
    // Cleanup - reset when component unmounts
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [isAll, isEquip, isStock, isForAllEquip]);


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
    fetchLpos();
  }, [isAll, isEquip, isStock, isForAllEquip, regNo]);

  const fetchLpos = async () => {
    let url = `${END_POINT}/lpo/get-all-lpo`; // default for isAll

    if (isEquip && regNo) {
      url = `${END_POINT}/lpo/get-lpo-by-regno/${regNo}`;
    } else if (isStock) {
      url = `${END_POINT}/lpo/get-lpo-of-stock`;
    } else if (isForAllEquip) {
      url = `${END_POINT}/lpo/get-lpo-of-all-equipments`;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(url, 'GET');
      const data = await response.json()

      setLpos(data.data);
      setFilteredData(data.data);
    } catch (error) {
      console.error(`Error fetching LPO records:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    applyAllFilters();
  }, [lpos, searchTerm, filters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleRowClick = (lpoRef) => {
    navigate(`/lpo-details/${lpoRef}`);
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
      </style>
    `;

    const content = `
      <html>
        <head>
          <title>LPO List</title>
          ${style}
        </head>
        <body>
          <h1>LPO List</h1>
          ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
          ${tableRef.current?.outerHTML || ''}
          <div style="margin-top: 10px; text-align: center;">
            Showing ${filteredData?.length || 0} ${searchTerm ? 'matching entries' : 'entries'}
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

  const handleDeleteClick = (e, lpo) => {
    e.stopPropagation();
    setSelectedLpo(lpo);
    setShowDeleteModal(true);
  };

  const handleAmendment = (e, lpo) => {
    e.stopPropagation();
    navigate(`/lpo-form/amendment/${encodeURIComponent(lpo.lpoRef)}`);
  };

  const confirmDelete = async () => {
    if (!selectedLpo) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/lpo/delete-lpo/${selectedLpo.lpoRef}`,
        'DELETE'
      );

      // Check if response is successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete LPO');
      }

      setShowDeleteModal(false);
      setDeleteStatus({
        message: `LPO ${selectedLpo.lpoRef} successfully deleted.`,
        isError: false
      });
      fetchLpos();
    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({
        message: 'Error deleting LPO: ' + error.message,
        isError: true
      });
      console.error('Error deleting LPO:', error);
    } finally {
      setShowStatusModal(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedLpo(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setDeleteStatus({ message: '', isError: false });
  };

  const handleViewLpo = (e, lpo) => {
    e.stopPropagation();
    navigate(`/lpo-doc/${encodeURIComponent(lpo.lpoRef)}`);
  };

  const handleAddLpo = () => {
    navigate(`/lpo-form/${regNo}`);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterByDate = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setDeleteStatus({
        message: 'Please select both start and end dates',
        isError: true
      });
      setShowStatusModal(true);
      return;
    }

    // Use the same URL logic for date filtering based on the active mode
    let baseUrl = `${END_POINT}/lpo/get-lpos-by-date`;

    if (isEquip && regNo) {
      baseUrl = `${END_POINT}/lpo/get-lpo-by-regno-date/${regNo}`;
    } else if (isStock) {
      baseUrl = `${END_POINT}/lpo/get-lpo-of-stock-date`;
    } else if (isForAllEquip) {
      baseUrl = `${END_POINT}/lpo/get-lpo-of-all-equipments-date`;
    }

    const url = `${baseUrl}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

    try {
      const response = await apiRequest(url, 'GET');

      if (response.success) {
        setFilteredData(response.data);
      } else {
        setDeleteStatus({
          message: response.message || 'Error filtering LPOs',
          isError: true
        });
        setShowStatusModal(true);
      }
    } catch (error) {
      setDeleteStatus({
        message: 'Error filtering LPOs: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
    }
  };

  const resetDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setFilteredData(lpos);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Update the main filter states from the modal filters
    setDateRange({
      startDate: filters.customStartDate,
      endDate: filters.customEndDate
    });
    setShowFiltersModal(false);

    // Apply filters to data
    applyAllFilters();
  };

  const handleResetFilters = () => {
    setFilters({
      dateFilter: 'all',
      vendors: [],
      equipmentTypes: [],
      amountRange: { min: '', max: '' },
      lastMonthsCount: 6,
      customStartDate: '',
      customEndDate: ''
    });
    setDateRange({ startDate: '', endDate: '' });
    setFilteredData(lpos);
  };

  const applyAllFilters = () => {
    let filtered = [...lpos];

    // Apply date filter
    if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
      filtered = filtered.filter(lpo => {
        const lpoDate = new Date(lpo.date);
        const startDate = new Date(filters.customStartDate);
        const endDate = new Date(filters.customEndDate);
        return lpoDate >= startDate && lpoDate <= endDate;
      });
    } else if (filters.dateFilter === 'lastXmonths') {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - filters.lastMonthsCount);
      filtered = filtered.filter(lpo => new Date(lpo.date) >= monthsAgo);
    } else if (filters.dateFilter === 'thismonth') {
      const now = new Date();
      filtered = filtered.filter(lpo => {
        const lpoDate = new Date(lpo.date);
        return lpoDate.getMonth() === now.getMonth() &&
          lpoDate.getFullYear() === now.getFullYear();
      });
    }

    // Apply vendor filter
    if (filters.vendors.length > 0) {
      filtered = filtered.filter(lpo =>
        filters.vendors.includes(lpo.company?.vendor)
      );
    }

    // Apply equipment filter
    if (filters.equipmentTypes.length > 0) {
      filtered = filtered.filter(lpo =>
        filters.equipmentTypes.includes(lpo.equipment)
      );
    }

    // Apply amount range filter
    if (filters.amountRange.min || filters.amountRange.max) {
      filtered = filtered.filter(lpo => {
        const amount = lpo.totalAmount;
        const min = filters.amountRange.min ? parseFloat(filters.amountRange.min) : 0;
        const max = filters.amountRange.max ? parseFloat(filters.amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lpo => {
        return Object.values(lpo).some(value => {
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v =>
              String(v).toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    setFilteredData(filtered);
  };

  return (
    <div className="lpo-container">
      <div className="controls-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search LPOs..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="clear-button">
              ×
            </button>
          )}
        </div>
        <div className="buttons-container">
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
          {
            isAll || isStock || isForAllEquip
              ? ''
              : <Button
                text="Add LPO"
                onClick={handleAddLpo}
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
          }
          <Button
            text="Print"
            onClick={handlePrint}
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
        </div>
      </div>

      <div className="table-info">
        {searchTerm ? (
          `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
        ) : (
          `Showing ${filteredData?.length || 0} entries`
        )}
      </div>

      <div className="lpo-table-container">
        <table className="lpo-table" ref={tableRef}>
          <thead>
            <tr>
              <th>LPO Ref</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Equipment</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="no-results">
                  Loading LPO data...
                </td>
              </tr>
            ) : filteredData && filteredData.length > 0 ? (
              filteredData.map((lpo) => (
                <tr
                  key={lpo._id}
                  onClick={() => handleRowClick(lpo.lpoRef)}
                  className="lpo-row"
                >
                  <td>{lpo.lpoRef}</td>
                  <td>{formatDate(lpo.date)}</td>
                  <td>{lpo.company.vendor}</td>
                  <td>{lpo.equipment}</td>
                  <td>SAR {lpo.totalAmount.toFixed(2)}</td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <Button
                      text="View"
                      onClick={(e) => handleViewLpo(e, lpo)}
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
                      text="Delete"
                      onClick={(e) => handleDeleteClick(e, lpo)}
                      colorScheme="error-700"
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
                      text="Amendment"
                      onClick={(e) => handleAmendment(e, lpo)}
                      colorScheme="yellow-500"
                      variant="gradient"
                      font="md"
                      animation=""
                      squircle="4xl"
                      width="160px"
                      height="38px"
                      type="submit"
                      textColor="black-200"
                      shadowPosition="to-bottom"
                      shadowColor="white-600"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No LPO data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={cancelDelete}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete LPO <strong>{selectedLpo?.lpoRef}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="action-btn cancel" onClick={cancelDelete}>Cancel</button>
              <button className="action-btn confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className={`modal-content ${deleteStatus.isError ? 'error' : 'success'}`}>
            <div className="modal-header">
              <h2>{deleteStatus.isError ? 'Error' : 'Success'}</h2>
              <button className="close-btn" onClick={closeStatusModal}>
                <span class="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>
            <div className="modal-body">
              <p>{deleteStatus.message}</p>
            </div>
            <div className="modal-footer">
              <button className="action-btn ok" onClick={closeStatusModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      <DevModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        type="filters"
        title="LPO Filters"
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
            options: [
              { value: 1, label: '1 Month' },
              { value: 2, label: '2 Months' },
              { value: 3, label: '3 Months' },
              { value: 4, label: '4 Months' },
              { value: 5, label: '5 Months' },
              { value: 6, label: '6 Months' },
              { value: 7, label: '7 Months' },
              { value: 8, label: '8 Months' },
              { value: 9, label: '9 Months' },
              { value: 10, label: '10 Months' },
              { value: 11, label: '11 Months' },
              { value: 12, label: '12 Months' }
            ]
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
            name: 'vendors',
            label: 'Vendors',
            type: 'checkbox',
            options: [...new Set(lpos.map(lpo => lpo.company?.vendor).filter(Boolean))].map(v =>
              ({ value: v, label: v })
            )
          },
          {
            name: 'equipmentTypes',
            label: 'Equipment Types',
            type: 'checkbox',
            options: [...new Set(lpos.map(lpo => lpo.equipment).filter(Boolean))].map(e =>
              ({ value: e, label: e })
            )
          },
          {
            name: 'amountRange',
            label: 'Amount Range (SAR)',
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

export default LpoList;