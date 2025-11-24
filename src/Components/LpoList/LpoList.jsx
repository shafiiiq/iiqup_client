import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import './LpoList.css';
import { apiRequest } from '../../utils/0auth';

function LpoList({ isAll, isEquip, isStock, isForAllEquip }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [lpos, setLpos] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLpo, setSelectedLpo] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const navigate = useNavigate();
  const tableRef = useRef(null);
  const { regNo } = useParams()

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

    try {
      const response = await apiRequest(url, 'GET');
      const data = await response.json()

      setLpos(data.data);
      setFilteredData(data.data);
    } catch (error) {
      console.error(`Error fetching LPO records:`, error);
    }
  };

  useEffect(() => {
    if (lpos && lpos.length > 0) {
      const results = lpos.filter(item => {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredData(results);
    }
  }, [searchTerm, lpos]);

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

  // Dynamic title based on props
  const getTitle = () => {
    if (isEquip) return `LPO Management - Equipment (${regNo})`;
    if (isStock) return 'LPO Management - Stock';
    if (isForAllEquip) return 'LPO Management - All Equipments';
    return 'LPO Management - All LPOs';
  };

  return (
    <div className="lpo-container">
      <div className="lpo-header">
        <h1 className='lpo-title'>{getTitle()}</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

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
          {
            isAll || isStock || isForAllEquip
              ? ''
              : <button onClick={handleAddLpo} className="action-btn add">
                Add LPO
              </button>
          }
          <button onClick={handlePrint} className="action-btn print">
            Print Table
          </button>
        </div>
      </div>

      <div className="date-filter-container">
        <div className="date-filter-group">
          <label>From:</label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateRangeChange}
          />
        </div>
        <div className="date-filter-group">
          <label>To:</label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateRangeChange}
          />
        </div>
        <button onClick={handleFilterByDate} className="action-btn filter">
          Filter
        </button>
        <button onClick={resetDateFilter} className="action-btn reset">
          Reset
        </button>
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
            {filteredData && filteredData.length > 0 ? (
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
                    <button
                      className="action-btn view"
                      onClick={(e) => handleViewLpo(e, lpo)}
                    >
                      View
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => handleDeleteClick(e, lpo)}
                    >
                      Delete
                    </button>
                    <button
                      className="action-btn amendment"
                      onClick={(e) => handleAmendment(e, lpo)}
                    >
                      Amendment
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  {lpos?.length > 0 ? 'No matching records found' : 'Loading LPO data...'}
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
              <button className="close-btn" onClick={cancelDelete}>×</button>
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
              <button className="close-btn" onClick={closeStatusModal}>×</button>
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
    </div>
  );
}

export default LpoList;