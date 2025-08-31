import { useState, useRef, useEffect } from 'react';
import './Equipments.css';
import { useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

function Equipments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [equipments, setEquipments] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [operatorsData, setOperatorsData] = useState([]);
  const [hoveredOperator, setHoveredOperator] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showOutsideEquipmentModal, setShowOutsideEquipmentModal] = useState(false);
  const [notFoundSearchTerm, setNotFoundSearchTerm] = useState('');
  const [outsideEquipmentForm, setOutsideEquipmentForm] = useState({
    machine: '',
    regNo: '',
    brand: '',
    operator: '',
    company: 'OUTSIDE',
    outside: true
  });

  // Add Equipment Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEquipmentForm, setAddEquipmentForm] = useState({
    machine: '',
    regNo: '',
    coc: '',
    brand: '',
    year: '',
    istimaraExpiry: '',
    insuranceExpiry: '',
    tpcExpiry: '',
    operator: '',
    company: 'ATE',
    outside: false,
    status: 'Active',
    site: ''
  });

  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Get current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format date as DD-MM-YY
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

      // Format time in AM/PM
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
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
      const data = await response.json();
      setEquipments(data.data);
      setFilteredData(data.data);
    } catch (error) {
      console.error('Error fetching equipment records:', error);
    }
  };

  useEffect(() => {
    if (equipments && equipments.length > 0) {
      const results = equipments.filter(item => {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredData(results);
    }
  }, [searchTerm, equipments]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    const foundEquipment = equipments.find(item =>
      item.regNo.toLowerCase() === searchTerm.toLowerCase()
    );

    if (!foundEquipment && searchTerm.trim()) {
      setNotFoundSearchTerm(searchTerm);
      setOutsideEquipmentForm({
        ...outsideEquipmentForm,
        regNo: searchTerm
      });
      setShowOutsideEquipmentModal(true);
    }
  };

  const handleRowClick = (regNo) => {
    navigate(`/service-history/${regNo}`);
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
          <title>Equipment Inventory</title>
          ${style}
        </head>
        <body>
          <h1>Equipment Inventory</h1>
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    machine: '',
    regNo: '',
    brand: '',
    year: '',
    company: '',
    operator: '',
    brand: '',
    site: '',
    status: ''
  });

  const handleEdit = (e, equipment) => {
    e.stopPropagation();
    setEditEquipment(equipment);
    setEditFormData({
      machine: equipment.machine,
      regNo: equipment.regNo,
      brand: equipment.brand,
      site: equipment.site,
      status: equipment.status,
      year: equipment.year,
      company: equipment.company,
      operator: equipment.certificationBody[equipment.certificationBody.length - 1] || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (e, equipment) => {
    e.stopPropagation();
    setSelectedEquipment(equipment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEquipment) return;

    try {
      const response = await apiRequest(
        `${END_POINT}/equipments/delete-equipment/${selectedEquipment.regNo}`,
        'DELETE'
      );

      const data = await response.json();
      setShowDeleteModal(false);

      if (data.ok) {
        setDeleteStatus({
          message: `Equipment ${selectedEquipment.regNo} successfully deleted.`,
          isError: false
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to delete equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowDeleteModal(false);
      setDeleteStatus({
        message: 'Error deleting equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error deleting equipment:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedEquipment(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setDeleteStatus({ message: '', isError: false });
  };

  // Updated handleAdd function to show modal instead of navigate
  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleUpdateEquipment = async (e) => {
    e.preventDefault();

    if (!editEquipment) return;

    const updatedEquipment = {
      ...editEquipment,
      machine: editFormData.machine,
      regNo: editFormData.regNo,
      brand: editFormData.brand,
      year: editFormData.year,
      company: editFormData.company,
      site: editFormData.site,
      status: editFormData.status
    };

    if (editFormData.operator !== editEquipment.certificationBody[editEquipment.certificationBody.length - 1]) {
      updatedEquipment.certificationBody = [...editEquipment.certificationBody, editFormData.operator];
    }

    try {
      const response = await apiRequest(
        `${END_POINT}/equipments/update-equipment/${editEquipment.regNo}`,
        'PUT',
        updatedEquipment
      );

      const data = await response.json();
      setShowEditModal(false);

      if (data.ok) {
        setDeleteStatus({
          message: `Equipment ${editEquipment.regNo} successfully updated.`,
          isError: false
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to update equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowEditModal(false);
      setDeleteStatus({
        message: 'Error updating equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error updating equipment:', error);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditEquipment(null);
  };

  const handleViewAllOperators = (e, operators) => {
    e.stopPropagation();
    setOperatorsData(operators);
    setShowOperatorsModal(true);
  };

  const closeOperatorsModal = () => {
    setShowOperatorsModal(false);
    setOperatorsData([]);
  };

  const handleOperatorMouseEnter = (equipmentId) => {
    setHoveredOperator(equipmentId);
  };

  const handleOperatorMouseLeave = () => {
    setHoveredOperator(null);
  };

  const handleOutsideEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setOutsideEquipmentForm({
      ...outsideEquipmentForm,
      [name]: value
    });
  };

  const handleAddOutsideEquipment = async (e) => {
    e.preventDefault();

    const newOutsideEquipment = {
      ...outsideEquipmentForm,
      certificationBody: [outsideEquipmentForm.operator]
    };

    delete newOutsideEquipment.operator;

    try {
      const response = await apiRequest(
        `${END_POINT}/equipments/add-equipment`,
        'POST',
        newOutsideEquipment
      );

      const data = await response.json();
      setShowOutsideEquipmentModal(false);

      if (data.ok) {
        setDeleteStatus({
          message: `Outside equipment ${outsideEquipmentForm.regNo} successfully added.`,
          isError: false
        });
        setOutsideEquipmentForm({
          machine: '',
          regNo: '',
          brand: '',
          operator: '',
          company: 'OUTSIDE',
          outside: true
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: data.message || 'Failed to add outside equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);

    } catch (error) {
      setShowOutsideEquipmentModal(false);
      setDeleteStatus({
        message: 'Error adding outside equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error adding outside equipment:', error);
    }
  };

  const closeOutsideEquipmentModal = () => {
    setShowOutsideEquipmentModal(false);
    setNotFoundSearchTerm('');
  };

  // Add Equipment Modal Functions
  const handleAddEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setAddEquipmentForm({
      ...addEquipmentForm,
      [name]: value
    });
  };

  const handleAddEquipmentSubmit = async (e) => {
    e.preventDefault();

    const newEquipment = {
      ...addEquipmentForm,
      year: parseInt(addEquipmentForm.year),
      certificationBody: [addEquipmentForm.operator],
      site: [addEquipmentForm.site]
    };

    // Remove operator and site from the object as they're now in arrays
    delete newEquipment.operator;

    try {
      const response = await apiRequest(`${END_POINT}/equipments/add-equipment`, 'POST', newEquipment);

      setShowAddModal(false);

      if (response.ok) {
        setDeleteStatus({
          message: `Equipment ${addEquipmentForm.regNo} successfully added.`,
          isError: false
        });
        // Reset form
        setAddEquipmentForm({
          machine: '',
          regNo: '',
          coc: '',
          brand: '',
          year: '',
          istimaraExpiry: '',
          insuranceExpiry: '',
          tpcExpiry: '',
          operator: '',
          company: 'ATE',
          outside: false,
          status: 'Active',
          site: ''
        });
        fetchEquipments();
      } else {
        setDeleteStatus({
          message: response.message || 'Failed to add equipment.',
          isError: true
        });
      }
      setShowStatusModal(true);
    } catch (error) {
      setShowAddModal(false);
      setDeleteStatus({
        message: 'Error adding equipment: ' + error.message,
        isError: true
      });
      setShowStatusModal(true);
      console.error('Error adding equipment:', error);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    // Reset form when closing
    setAddEquipmentForm({
      machine: '',
      regNo: '',
      coc: '',
      brand: '',
      year: '',
      istimaraExpiry: '',
      insuranceExpiry: '',
      tpcExpiry: '',
      operator: '',
      company: 'ATE',
      outside: false,
      status: 'Active',
      site: ''
    });
  };

  const formatDateWithExpiry = (dateString) => {
    if (!dateString) return { formattedDate: '', isExpired: false };

    // Parse the mm/dd/yyyy date
    const dateParts = dateString.split('/');
    if (dateParts.length !== 3) return { formattedDate: dateString, isExpired: false };

    const [month, day, year] = dateParts;

    // Format to dd-mm-yyyy
    const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;

    // Check if expired (before today)
    const itemDate = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    const isExpired = itemDate < today;

    return {
      formattedDate,
      isExpired
    };
  }

  return (
    <div className="equipment-container">
      <div className="equipment-header">
        <h1 className='equip-title'>Equipment Inventory</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      <div className="controls-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="clear-button">
              ×
            </button>
          )}
          <button onClick={handleSearchSubmit} className="search-button">
            Search
          </button>
        </div>
        <div className="buttons-container">
          <button onClick={handleAdd} className="action-btn add">
            Add Equipment
          </button>
          <button onClick={handlePrint} className="action-btn print">
            Print Table
          </button>
        </div>
      </div>

      <div className="table-info">
        {searchTerm ? (
          `Found ${filteredData?.length || 0} matching ${filteredData?.length === 1 ? 'entry' : 'entries'}`
        ) : (
          `Showing all ${filteredData?.length || 0} entries`
        )}
      </div>

      <div className="equipment-table-container">
        <table className="equipment-table" ref={tableRef}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Machine</th>
              <th>Reg No</th>
              <th>Brand</th>
              <th>Year</th>
              <th>Company</th>
              <th>Istimara Expiry</th>
              <th>Insurance Expiry</th>
              <th>TPC Expiry</th>
              <th>Operator</th>
              <th>Site</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item.regNo)}
                  className="equipment-row"
                >
                  <td>{item.id}</td>
                  <td>{item.machine}</td>
                  <td>{item.regNo}</td>
                  <td>{item.brand}</td>
                  <td>{item.year}</td>
                  <td>{item.company}</td>
                  <td>
                    {(() => {
                      const dateInfo = formatDateWithExpiry(item.istimaraExpiry);
                      return (
                        <span>
                          {dateInfo.formattedDate}
                          {dateInfo.isExpired && (
                            <span className="expired-label">expired</span>
                          )}
                        </span>
                      );
                    })()}
                  </td>
                  <td>{item.insuranceExpiry}</td>
                  <td>{item.tpcExpiry}</td>
                  <td
                    className="operator-cell"
                    onMouseEnter={() => handleOperatorMouseEnter(item.id)}
                    onMouseLeave={handleOperatorMouseLeave}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.certificationBody && item.certificationBody.length > 0
                      ? item.certificationBody[item.certificationBody.length - 1]
                      : ''}
                    {item.certificationBody && item.certificationBody.length >= 1 && hoveredOperator === item.id && (
                      <div className="view-all-overlay">
                        <button
                          className="view-all-button"
                          onClick={(e) => handleViewAllOperators(e, item.certificationBody)}
                        >
                          View All
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{item.site}</td>
                  <td >
                    <span className={`site ${item.status === 'active' ? 'site-active'
                      : item.status === 'idle' ? 'site-idle'
                        : item.status === 'maintenance' ? 'site-maintenance'
                          : item.status === 'going' ? 'site-going'
                            : item.status === 'loading' ? 'site-loading'
                              : ''
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="action-btn edit"
                      onClick={(e) => handleEdit(e, item)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => handleDeleteClick(e, item)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-results">
                  {equipments.length > 0 ? (
                    searchTerm ? (
                      <>
                        No matching records found for <span className='not-found-outside-equip'>{searchTerm}</span>.
                        <button
                          className="action-btn outside"
                          onClick={() => {
                            setOutsideEquipmentForm({
                              ...outsideEquipmentForm,
                              regNo: searchTerm
                            });
                            setShowOutsideEquipmentModal(true);
                          }}
                        >
                          Add as Outside Equipment
                        </button>
                      </>
                    ) : 'No matching records found'
                  ) : 'Loading equipment data...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content add-equipment">
            <div className="modal-header">
              <h2>Add New Equipment</h2>
              <button className="close-btn" onClick={closeAddModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddEquipmentSubmit} className="add-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="machine">Machine *</label>
                    <input
                      type="text"
                      id="machine"
                      name="machine"
                      value={addEquipmentForm.machine}
                      onChange={handleAddEquipmentInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="regNo">Registration No *</label>
                    <input
                      type="text"
                      id="regNo"
                      name="regNo"
                      value={addEquipmentForm.regNo}
                      onChange={handleAddEquipmentInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="coc">COC</label>
                    <input
                      type="text"
                      id="coc"
                      name="coc"
                      value={addEquipmentForm.coc}
                      onChange={handleAddEquipmentInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="brand">Brand *</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={addEquipmentForm.brand}
                      onChange={handleAddEquipmentInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Year *</label>
                    <input
                      type="number"
                      id="year"
                      name="year"
                      value={addEquipmentForm.year}
                      onChange={handleAddEquipmentInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company *</label>
                    <select
                      id="company"
                      name="company"
                      value={addEquipmentForm.company}
                      onChange={handleAddEquipmentInputChange}
                      required
                    >
                      <option value="ATE">ATE</option>
                      <option value="OUTSIDE">OUTSIDE</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="istimaraExpiry">Istimara Expiry</label>
                    <input
                      type="date"
                      id="istimaraExpiry"
                      name="istimaraExpiry"
                      value={addEquipmentForm.istimaraExpiry}
                      onChange={handleAddEquipmentInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="insuranceExpiry">Insurance Expiry</label>
                    <input
                      type="date"
                      id="insuranceExpiry"
                      name="insuranceExpiry"
                      value={addEquipmentForm.insuranceExpiry}
                      onChange={handleAddEquipmentInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tpcExpiry">TPC Expiry</label>
                    <input
                      type="date"
                      id="tpcExpiry"
                      name="tpcExpiry"
                      value={addEquipmentForm.tpcExpiry}
                      onChange={handleAddEquipmentInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={addEquipmentForm.status}
                      onChange={handleAddEquipmentInputChange}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="operator">Operator *</label>
                    <input
                      type="text"
                      id="operator"
                      name="operator"
                      value={addEquipmentForm.operator}
                      onChange={handleAddEquipmentInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="site">Site *</label>
                    <input
                      type="text"
                      id="site"
                      name="site"
                      value={addEquipmentForm.site}
                      onChange={handleAddEquipmentInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="outside"
                      checked={addEquipmentForm.outside}
                      onChange={(e) => setAddEquipmentForm({
                        ...addEquipmentForm,
                        outside: e.target.checked
                      })}
                    />
                    Mark as Outside Equipment
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="action-btn cancel" onClick={closeAddModal}>Cancel</button>
              <button className="action-btn save" onClick={handleAddEquipmentSubmit}>Add Equipment</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the equipment with registration number <strong>{selectedEquipment?.regNo}</strong>?</p>
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

      {/* Edit Equipment Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content edit">
            <div className="modal-header">
              <h2>Update Equipment</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateEquipment} className="edit-form">
                <div className="form-group">
                  <label htmlFor="machine">Machine:</label>
                  <input
                    type="text"
                    id="machine"
                    name="machine"
                    value={editFormData.machine}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="regNo">Registration No:</label>
                  <input
                    type="text"
                    id="regNo"
                    name="regNo"
                    value={editFormData.regNo}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brand">Brand:</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={editFormData.brand}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year">Year:</label>
                  <input
                    type="text"
                    id="year"
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company">Company:</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={editFormData.company}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="operator">Operator:</label>
                  <input
                    type="text"
                    id="operator"
                    name="operator"
                    value={editFormData.operator}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="site">Site:</label>
                  <input
                    type="text"
                    id="site"
                    name="site"
                    value={editFormData.site}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="going">Going</option>
                    <option value="loading">Loading</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="action-btn cancel" onClick={closeEditModal}>Cancel</button>
              <button className="action-btn save" onClick={handleUpdateEquipment}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Operators Modal */}
      {showOperatorsModal && (
        <div className="modal-overlay">
          <div className="modal-content operators">
            <div className="modal-header">
              <h2>All Operators</h2>
              <button className="close-btn" onClick={closeOperatorsModal}>×</button>
            </div>
            <div className="modal-body">
              {operatorsData.length > 0 ? (
                <div className="operators-list">
                  <table className="operators-table">
                    <thead>
                      <tr>
                        <th>SL No</th>
                        <th>Operator Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operatorsData.map((operator, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{operator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No operator data available.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-btn ok" onClick={closeOperatorsModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Outside Equipment Modal */}
      {showOutsideEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content outside">
            <div className="modal-header">
              <h2>Add Outside Equipment</h2>
              <button className="close-btn" onClick={closeOutsideEquipmentModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddOutsideEquipment} className="edit-form">
                <div className="form-group">
                  <label htmlFor="machine">Machine:</label>
                  <input
                    type="text"
                    id="machine"
                    name="machine"
                    value={outsideEquipmentForm.machine}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="regNo">Registration No:</label>
                  <input
                    type="text"
                    id="regNo"
                    name="regNo"
                    value={outsideEquipmentForm.regNo}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="brand">Brand:</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={outsideEquipmentForm.brand}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="operator">Operator:</label>
                  <input
                    type="text"
                    id="operator"
                    name="operator"
                    value={outsideEquipmentForm.operator}
                    onChange={handleOutsideEquipmentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <p className="outside-note">
                    <strong>Note:</strong> This equipment will be marked as an outside equipment with company "OUTSIDE".
                  </p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="action-btn cancel" onClick={closeOutsideEquipmentModal}>Cancel</button>
              <button className="action-btn save" onClick={handleAddOutsideEquipment}>Add Equipment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipments;