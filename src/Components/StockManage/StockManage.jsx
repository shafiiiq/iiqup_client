import React, { useState, useEffect } from 'react';
import './StockManage.css';
import { END_POINT } from '../../constants';
import Select from 'react-select';
import { apiRequest } from '../../utils/0auth';

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

  return (
    <div className="stock-manage-container">
      <div className="stock-manage-header">
        <h1 className="stock-manage-title">Stock Management</h1>
        <div className="stock-manage-datetime">{currentDateTime}</div>
      </div>

      <div className="stock-manage-actions">
        <button className="stock-manage-add-btn" onClick={openAddForm}>
          + Add Stock
        </button>
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
                <input
                  type="text"
                  id="equipmentName"
                  name="equipmentName"
                  value={reduceFormData.equipmentName}
                  onChange={(e) => setReduceFormData({ ...reduceFormData, equipmentName: e.target.value })}
                  placeholder="Enter equipment name"
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="equipmentNumber">Equipment Number</label>
                <input
                  type="text"
                  id="equipmentNumber"
                  name="equipmentNumber"
                  value={reduceFormData.equipmentNumber}
                  onChange={(e) => setReduceFormData({ ...reduceFormData, equipmentNumber: e.target.value })}
                  placeholder="Enter equipment number"
                  required
                />
              </div>

              <div className="stock-form-group">
                <label htmlFor="mechanicName">Mechanic Name</label>
                <input
                  type="text"
                  id="mechanicName"
                  name="mechanicName"
                  value={reduceFormData.mechanicName}
                  onChange={(e) => setReduceFormData({ ...reduceFormData, mechanicName: e.target.value })}
                  placeholder="Enter mechanic name"
                  required
                />
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