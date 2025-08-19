import React, { useState, useEffect, useRef } from 'react';
import './Toolkits.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

const Toolkits = () => {
  // Predefined tool names and colors
  const predefinedToolNames = ['Coveralls', 'Safety Shoes', 'Helmet', 'Safety Glasses', 'Safety Jacket', 'Hand Gloves'];
  const predefinedColors = ['White', 'Yellow', 'Grey', 'Blue', 'Navy Blue', 'Kaki', 'Black'];
  const predefinedTypes = ['Head Protection', 'Eye Protection', 'Hand Protection', 'Foot Protection', 'Body Protection', 'Fall Protection', 'Respiratory Protection'];
  const predefinedSizes = ['S', 'M', 'L', 'XL', 'XXL', 'One Size'];

  const [toolkits, setToolkits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToolkit, setSelectedToolkit] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [stockHistory, setStockHistory] = useState([]);
  const [formMode, setFormMode] = useState('add');
  const [variantFormMode, setVariantFormMode] = useState('add');
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
    person: ''
  });

  const filteredToolkits = toolkits;

  // Search states for dropdowns
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [sizeSearchTerm, setSizeSearchTerm] = useState('');
  const [colorSearchTerm, setColorSearchTerm] = useState('');

  // States for dropdown visibility
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // Refs for dropdown components to handle clicks outside
  const nameDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const sizeDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  // Filtered lists based on search term
  const filteredToolNames = predefinedToolNames.filter(name =>
    name.toLowerCase().includes(nameSearchTerm.toLowerCase())
  );

  const filteredTypes = predefinedTypes.filter(type =>
    type.toLowerCase().includes(typeSearchTerm.toLowerCase())
  );

  const filteredSizes = predefinedSizes.filter(size =>
    size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
  );

  const filteredColors = predefinedColors.filter(color =>
    color.toLowerCase().includes(colorSearchTerm.toLowerCase())
  );

  // Update current date and time
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

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target)) {
        setShowNameDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target)) {
        setShowSizeDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch toolkits data
  useEffect(() => {
    const fetchToolkits = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`${END_POINT}/toolkits/get-toolkits`);
        if (!response.ok) throw new Error('Failed to fetch toolkits');
        const result = await response.json();
        setToolkits(Array.isArray(result.data) ? result.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching toolkits:', err);
      }
    };

    fetchToolkits();
  }, []);

  const groupVariantsBySize = (variants) => {
    const grouped = {};
    variants.forEach(variant => {
      if (!grouped[variant.size]) {
        grouped[variant.size] = [];
      }
      grouped[variant.size].push(variant);
    });
    return grouped;
  };

  // Show toolkit details
  const showDetails = (toolkit) => {
    setSelectedToolkit(toolkit);
    setSelectedVariant(null);
    setShowStockHistory(false);
  };

  // Show variant details
  const showVariantDetails = async (variant, toolkit) => {
    setSelectedToolkit(toolkit);
    setSelectedVariant(variant);
    setShowStockHistory(false);

    // Fetch stock history when variant is selected
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/stock-history/${toolkit._id}/${variant._id}`);
      if (!response.ok) throw new Error('Failed to fetch stock history');
      const result = await response.json();

      setStockHistory(result.data.stockHistory);
    } catch (err) {
      console.error('Error fetching stock history:', err);
      setStockHistory([]);
    }
  };

  // Open add form for toolkit
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

  // Open update form for toolkit
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

  // Open add form for variant
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
    setSizeSearchTerm('');
    setColorSearchTerm('');
    setSelectedToolkit(toolkit);
    setShowVariantForm(true);
  };

  // Open update form for variant
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
    setSizeSearchTerm(variant.size);
    setColorSearchTerm(variant.color);
    setSelectedToolkit(toolkit);
    setShowVariantForm(true);
  };

  // Handle standard form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const openReduceStockModal = () => {
    setReduceStockData({
      quantity: 1,
      reason: 'Used',
      person: ''
    });
    setShowReduceStockModal(true);
  };

  // Handle variant form input changes
  const handleVariantInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'stockCount' || name === 'minStockLevel') {
      processedValue = parseInt(value, 10) || 0;
    } else if (name === 'inuse') {
      processedValue = e.target.checked;
    }

    setVariantFormData({
      ...variantFormData,
      [name]: processedValue
    });
  };

  // Handle dropdown selections
  const handleNameSelect = (selectedName) => {
    setFormData({
      ...formData,
      name: selectedName
    });
    setNameSearchTerm(selectedName);
    setShowNameDropdown(false);
  };

  const handleTypeSelect = (selectedType) => {
    setFormData({
      ...formData,
      type: selectedType
    });
    setTypeSearchTerm(selectedType);
    setShowTypeDropdown(false);
  };

  const handleSizeSelect = (selectedSize) => {
    setVariantFormData({
      ...variantFormData,
      size: selectedSize
    });
    setSizeSearchTerm(selectedSize);
    setShowSizeDropdown(false);
  };

  const handleColorSelect = (selectedColor) => {
    setVariantFormData({
      ...variantFormData,
      color: selectedColor
    });
    setColorSearchTerm(selectedColor);
    setShowColorDropdown(false);
  };

  // Handle search input changes
  const handleNameSearchChange = (e) => {
    setNameSearchTerm(e.target.value);
    setShowNameDropdown(true);
  };

  const handleTypeSearchChange = (e) => {
    setTypeSearchTerm(e.target.value);
    setShowTypeDropdown(true);
  };

  const handleSizeSearchChange = (e) => {
    setSizeSearchTerm(e.target.value);
    setShowSizeDropdown(true);
  };

  const handleColorSearchChange = (e) => {
    setColorSearchTerm(e.target.value);
    setShowColorDropdown(true);
  };

  // Toggle dropdowns
  const toggleNameDropdown = () => {
    setShowNameDropdown(!showNameDropdown);
    setShowTypeDropdown(false);
  };

  const toggleTypeDropdown = () => {
    setShowTypeDropdown(!showTypeDropdown);
    setShowNameDropdown(false);
  };

  const toggleSizeDropdown = () => {
    setShowSizeDropdown(!showSizeDropdown);
    setShowColorDropdown(false);
  };

  const toggleColorDropdown = () => {
    setShowColorDropdown(!showColorDropdown);
    setShowSizeDropdown(false);
  };

  // Form submit handler for toolkit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'add') {
        const response = await apiRequest(`${END_POINT}/toolkits/add-toolkits`,
          'POST',
          formData
        );
        if (!response.ok) throw new Error('Failed to add toolkit');
        const result = await response.json();
        setToolkits([...toolkits, result.data]);
      } else {
        const response = await apiRequest(`${END_POINT}/toolkits/update-toolkit/${formData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to update toolkit');
        const updatedToolkit = await response.json();
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

  // Form submit handler for variant
  const handleVariantFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (variantFormMode === 'add') {
        const response = await apiRequest(`${END_POINT}/toolkits/update-toolkit/${selectedToolkit._id}`,
          'PUT',
          {
            variants: [...selectedToolkit.variants, variantFormData],
            reason: variantFormData.reason || `Added new variant: ${variantFormData.size} - ${variantFormData.color}`
          }
        );

        if (!response.ok) throw new Error('Failed to add variant');

        const updatedToolkit = await response.json();

        setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
        setSelectedToolkit(updatedToolkit.data);
      } else {
        const response = await apiRequest(`${END_POINT}/toolkits/update-variant/${selectedToolkit._id}/${variantFormData._id}`,
          'PUT',
          {
            ...variantFormData,
            reason: variantFormData.reason || `Updated variant: ${variantFormData.size} - ${variantFormData.color}`
          }
        );

        if (!response.ok) throw new Error('Failed to update variant');

        const updatedToolkit = await response.json();

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

  // Delete toolkit
  const deleteToolkit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this toolkit?')) return;
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/delete-toolkit/${id}`,
        'DELETE'
      );
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

  // Delete variant
  const deleteVariant = async (toolkitId, variantId) => {
   if (!window.confirm('Are you sure you want to delete this variant?')) return;
   try {
     const response = await apiRequest(`${END_POINT}/toolkits/delete-variant/${toolkitId}/${variantId}`, 'DELETE');
     if (!response.ok) throw new Error('Failed to delete variant');
     const result = await response.json();

     if (result.data === null) {
       // Toolkit was deleted because no variants left
       setToolkits(toolkits.filter(item => item._id !== toolkitId));
       if (selectedToolkit && selectedToolkit._id === toolkitId) {
         setSelectedToolkit(null);
       }
     } else {
       // Variant was deleted
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

  // Reduce stock for a variant
  const handleReduceStock = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/toolkits/reduce-stock/${selectedToolkit._id}/${selectedVariant._id}`,
        'PUT',
        {
          quantity: parseInt(reduceStockData.quantity),
          reason: reduceStockData.reason || 'Stock reduced',
          updatedBy: 'User',
          person: reduceStockData.person
        }
      );

      if (!response.ok) throw new Error('Failed to reduce stock');
      const updatedToolkit = await response.json();

      setToolkits(toolkits.map(t => t._id === updatedToolkit.data._id ? updatedToolkit.data : t));
      setSelectedToolkit(updatedToolkit.data);
      setSelectedVariant(updatedToolkit.data.variants.find(v => v._id === selectedVariant._id));

      // Refresh stock history
      const historyResponse = await apiRequest(`${END_POINT}/toolkits/stock-history/${selectedToolkit._id}/${selectedVariant._id}`);
      if (!historyResponse.ok) throw new Error('Failed to fetch updated stock history');
      const historyResult = await historyResponse.json();
      setStockHistory(historyResult.data.stockHistory);

      setShowReduceStockModal(false);
    } catch (err) {
      console.error('Error reducing stock:', err);
      alert(`Failed to reduce stock: ${err.message}`);
    }
  };

  // Calculate status based on stock count and min stock level
  const calculateStatus = (stockCount, minStockLevel) => {
    if (stockCount <= 0) return 'out';
    if (stockCount < minStockLevel) return 'low';
    return 'available';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="toolkits-container">
      <div className="toolkits-header">
        <h1 className="toolkits-title">Safety Tools Inventory</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      <div className="toolkits-actions">
        <button className="add-toolkit-btn" onClick={openAddForm}>
          + Add Toolkit
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading safety tools inventory...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="toolkits-table-container">
          <table className="toolkits-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tool Name</th>
                <th>Type</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredToolkits.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.totalStock}</td>
                  <td>
                    <span className={`status-badge ${item.overallStatus}`}>
                      {item.overallStatus === 'available' ? 'In Stock' :
                        item.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="action-btn details" onClick={() => showDetails(item)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected toolkit details sidebar */}
      {selectedToolkit && (
        <div className="toolkit-details">
          <div className="details-header">
            <h2>Toolkit Details</h2>
            <button className="close-btn" onClick={() => setSelectedToolkit(null)}>×</button>
          </div>
          <div className="details-content">
            <div className="detail-item">
              <span className="label">Tool Name:</span>
              <span className="value">{selectedToolkit.name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Type:</span>
              <span className="value">{selectedToolkit.type}</span>
            </div>
            <div className="detail-item">
              <span className="label">Total Stock:</span>
              <span className="value">{selectedToolkit.totalStock}</span>
            </div>
            <div className="detail-item">
              <span className="label">Overall Status:</span>
              <span className={`value status-badge ${selectedToolkit.overallStatus}`}>
                {selectedToolkit.overallStatus === 'available' ? 'In Stock' :
                  selectedToolkit.overallStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="variants-section">
              <h3>Variants</h3>
              <table className="variants-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Stock</th>
                    <th>Min Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedToolkit.variants.map(variant => (
                    <tr
                      key={variant._id}
                      className={selectedVariant && selectedVariant._id === variant._id ? 'selected' : ''}
                      onClick={() => showVariantDetails(variant, selectedToolkit)}
                    >
                      <td>{variant.size}</td>
                      <td>
                        <span className="color-indicator" style={{
                          backgroundColor: variant.color?.toLowerCase() === 'clear' ? 'transparent' : variant.color?.toLowerCase(),
                          border: variant.color.toLowerCase() === 'clear' ? '1px dashed #ccc' : 'none'
                        }}></span>
                        {variant.color}
                      </td>
                      <td>{variant.stockCount}</td>
                      <td>{variant.minStockLevel}</td>
                      <td>
                        <span className={`status-badge ${calculateStatus(variant.stockCount, variant.minStockLevel)}`}>
                          {calculateStatus(variant.stockCount, variant.minStockLevel) === 'available' ? 'In Stock' :
                            calculateStatus(variant.stockCount, variant.minStockLevel) === 'low' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="variant-actions">
                        <button
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUpdateVariantForm(variant, selectedToolkit);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVariant(selectedToolkit._id, variant._id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="toolkit-actions">
              <h3>Actions</h3>
              <div className="action-btn-group">
                <button className="action-btn edit" onClick={() => openUpdateForm(selectedToolkit)}>
                  Edit Toolkit
                </button>
                <button className="action-btn add-variant" onClick={() => openAddVariantForm(selectedToolkit)}>
                  + Add Variant
                </button>
                <button className="action-btn delete" onClick={() => deleteToolkit(selectedToolkit._id)}>
                  Delete Toolkit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variant details sidebar */}
      {selectedVariant && (
        <div className="variant-details">
          <div className="details-header">
            <h2>Variant Details</h2>
            <button className="close-btn" onClick={() => setSelectedVariant(null)}>×</button>
          </div>
          <div className="details-content">
            <div className="detail-item">
              <span className="label">Tool Name:</span>
              <span className="value">{selectedToolkit.name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Size:</span>
              <span className="value">{selectedVariant.size}</span>
            </div>
            <div className="detail-item">
              <span className="label">Color:</span>
              <span className="value">
                <span className="color-indicator" style={{
                  backgroundColor: selectedVariant.color.toLowerCase() === 'clear' ? 'transparent' : selectedVariant.color.toLowerCase(),
                  border: selectedVariant.color.toLowerCase() === 'clear' ? '1px dashed #ccc' : 'none'
                }}></span>
                {selectedVariant.color}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Current Stock:</span>
              <span className="value">{selectedVariant.stockCount}</span>
            </div>
            <div className="detail-item">
              <span className="label">Minimum Level:</span>
              <span className="value">{selectedVariant.minStockLevel}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className={`value status-badge ${calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel)}`}>
                {calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel) === 'available' ? 'In Stock' :
                  calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel) === 'low' ? 'Low Stock' : 'Out of Stock'}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">In Use:</span>
              <span className="value">{selectedVariant.inuse ? 'Yes' : 'No'}</span>
            </div>
            <div className="detail-item">
              <span className="label">First Added:</span>
              <span className="value">{formatDate(selectedVariant.firstAddedDate)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Last Updated:</span>
              <span className="value">{formatDate(selectedVariant.lastUpdatedDate)}</span>
            </div>

            <div className="stock-progress">
              <h3>Stock Level</h3>
              <div className="progress-container">
                <div
                  className={`progress-bar ${calculateStatus(selectedVariant.stockCount, selectedVariant.minStockLevel)}`}
                  style={{
                    width: `${Math.min(100, (selectedVariant.stockCount / (selectedVariant.minStockLevel * 2)) * 100)}%`
                  }}
                >
                  <span className="progress-text">
                    {selectedVariant.stockCount} / {selectedVariant.minStockLevel} min
                  </span>
                </div>
              </div>
            </div>

            <div className="variant-actions">
              <button className="action-btn reduce" onClick={openReduceStockModal}>
                Reduce Stock
              </button>
              <button
                className="action-btn history"
                onClick={() => setShowStockHistory(!showStockHistory)}
              >
                {showStockHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>

            {showStockHistory && (
              <div className="stock-history-section">
                <h3>Stock History</h3>
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Previous</th>
                        <th>Change</th>
                        <th>New</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockHistory.length > 0 ? (
                        stockHistory.map((history, index) => (
                          <tr key={index}>
                            <td>{formatDate(history.timestamp)}</td>
                            <td>
                              <span className={`history-badge ${history.action}`}>
                                {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
                              </span>
                            </td>
                            <td>{history.previousStock}</td>
                            <td className={history.changeAmount > 0 ? 'positive' : 'negative'}>
                              {history.changeAmount > 0 ? '+' : ''}{history.changeAmount}
                            </td>
                            <td>{history.newStock}</td>
                            <td>{history.reason}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="no-history">No stock history available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reduce Stock Modal */}
      {showReduceStockModal && (
        <div className="form-modal-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>Reduce Stock</h2>
              <button className="close-btn" onClick={() => setShowReduceStockModal(false)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleReduceStock();
            }}>
              <div className="form-group">
                <label htmlFor="reduceQuantity">Quantity</label>
                <input
                  type="number"
                  id="reduceQuantity"
                  name="quantity"
                  value={reduceStockData.quantity}
                  onChange={(e) => setReduceStockData({
                    ...reduceStockData,
                    quantity: e.target.value
                  })}
                  min="1"
                  max={selectedVariant?.stockCount}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reduceReason">Reason</label>
                <input
                  type="text"
                  id="reduceReason"
                  name="reason"
                  value={reduceStockData.reason}
                  onChange={(e) => setReduceStockData({
                    ...reduceStockData,
                    reason: e.target.value
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reducePerson">Assigned To</label>
                <input
                  type="text"
                  id="reducePerson"
                  name="person"
                  value={reduceStockData.person}
                  onChange={(e) => setReduceStockData({
                    ...reduceStockData,
                    person: e.target.value
                  })}
                  required
                  placeholder="Enter person name"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowReduceStockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Reduce Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Modal for Add/Update Toolkit */}
      {showForm && (
        <div className="form-modal-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>{formMode === 'add' ? 'Add New Toolkit' : 'Update Toolkit'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              {/* Custom Searchable Dropdown for Name */}
              <div className="form-group">
                <label htmlFor="name">Tool Name</label>
                <div className="custom-dropdown" ref={nameDropdownRef}>
                  <div className="dropdown-input-container">
                    <input
                      type="text"
                      id="name"
                      value={nameSearchTerm}
                      onChange={handleNameSearchChange}
                      onClick={toggleNameDropdown}
                      placeholder="Search or enter tool name"
                      autoComplete="off"
                      required
                    />
                    <button type="button" className="dropdown-toggle" onClick={toggleNameDropdown}>
                      ▼
                    </button>
                  </div>
                  {showNameDropdown && (
                    <div className="dropdown-menu">
                      {filteredToolNames.length > 0 ? (
                        filteredToolNames.map((name, index) => (
                          <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => handleNameSelect(name)}
                          >
                            {name}
                          </div>
                        ))
                      ) : nameSearchTerm.trim() !== '' ? (
                        <div className="dropdown-item new-item" onClick={() => handleNameSelect(nameSearchTerm)}>
                          Add "{nameSearchTerm}"
                        </div>
                      ) : (
                        <div className="no-results">No tool names found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Searchable Dropdown for Type */}
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <div className="custom-dropdown" ref={typeDropdownRef}>
                  <div className="dropdown-input-container">
                    <input
                      type="text"
                      id="type"
                      value={typeSearchTerm}
                      onChange={handleTypeSearchChange}
                      onClick={toggleTypeDropdown}
                      placeholder="Search or enter type"
                      autoComplete="off"
                      required
                    />
                    <button type="button" className="dropdown-toggle" onClick={toggleTypeDropdown}>
                      ▼
                    </button>
                  </div>
                  {showTypeDropdown && (
                    <div className="dropdown-menu">
                      {filteredTypes.length > 0 ? (
                        filteredTypes.map((type, index) => (
                          <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => handleTypeSelect(type)}
                          >
                            {type}
                          </div>
                        ))
                      ) : typeSearchTerm.trim() !== '' ? (
                        <div className="dropdown-item new-item" onClick={() => handleTypeSelect(typeSearchTerm)}>
                          Add "{typeSearchTerm}"
                        </div>
                      ) : (
                        <div className="no-results">No types found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {formMode === 'add' ? 'Add Toolkit' : 'Update Toolkit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Modal for Add/Update Variant */}
      {showVariantForm && (
        <div className="form-modal-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>{variantFormMode === 'add' ? 'Add New Variant' : 'Update Variant'}</h2>
              <button className="close-btn" onClick={() => setShowVariantForm(false)}>×</button>
            </div>
            <form onSubmit={handleVariantFormSubmit}>
              <div className="form-group">
                <label>Toolkit: {selectedToolkit.name}</label>
              </div>

              {/* Custom Searchable Dropdown for Size */}
              <div className="form-group">
                <label htmlFor="size">Size</label>
                <div className="custom-dropdown" ref={sizeDropdownRef}>
                  <div className="dropdown-input-container">
                    <input
                      type="text"
                      id="size"
                      value={sizeSearchTerm}
                      onChange={handleSizeSearchChange}
                      onClick={toggleSizeDropdown}
                      placeholder="Search or enter size"
                      autoComplete="off"
                      required
                    />
                    <button type="button" className="dropdown-toggle" onClick={toggleSizeDropdown}>
                      ▼
                    </button>
                  </div>
                  {showSizeDropdown && (
                    <div className="dropdown-menu">
                      {filteredSizes.length > 0 ? (
                        filteredSizes.map((size, index) => (
                          <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => handleSizeSelect(size)}
                          >
                            {size}
                          </div>
                        ))
                      ) : sizeSearchTerm.trim() !== '' ? (
                        <div className="dropdown-item new-item" onClick={() => handleSizeSelect(sizeSearchTerm)}>
                          Add "{sizeSearchTerm}"
                        </div>
                      ) : (
                        <div className="no-results">No sizes found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Searchable Dropdown for Color */}
              <div className="form-group">
                <label htmlFor="color">Color</label>
                <div className="custom-dropdown" ref={colorDropdownRef}>
                  <div className="dropdown-input-container">
                    <input
                      type="text"
                      id="color"
                      value={colorSearchTerm}
                      onChange={handleColorSearchChange}
                      onClick={toggleColorDropdown}
                      placeholder="Search or enter color"
                      autoComplete="off"
                      required
                    />
                    <button type="button" className="dropdown-toggle" onClick={toggleColorDropdown}>
                      ▼
                    </button>
                  </div>
                  {showColorDropdown && (
                    <div className="dropdown-menu">
                      {filteredColors.length > 0 ? (
                        filteredColors.map((color, index) => (
                          <div
                            key={index}
                            className="dropdown-item color-item"
                            onClick={() => handleColorSelect(color)}
                          >
                            <span
                              className="color-preview"
                              style={{
                                backgroundColor: color.toLowerCase() === 'clear' ? 'transparent' : color.toLowerCase(),
                                border: color.toLowerCase() === 'clear' ? '1px dashed #ccc' : 'none'
                              }}
                            ></span>
                            {color}
                          </div>
                        ))
                      ) : colorSearchTerm.trim() !== '' ? (
                        <div className="dropdown-item new-item" onClick={() => handleColorSelect(colorSearchTerm)}>
                          Add "{colorSearchTerm}"
                        </div>
                      ) : (
                        <div className="no-results">No colors found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="stockCount">Stock Count</label>
                  <input
                    type="number"
                    id="stockCount"
                    name="stockCount"
                    value={variantFormData.stockCount}
                    onChange={handleVariantInputChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="minStockLevel">Minimum Stock Level</label>
                  <input
                    type="number"
                    id="minStockLevel"
                    name="minStockLevel"
                    value={variantFormData.minStockLevel}
                    onChange={handleVariantInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inuse">
                  <input
                    type="checkbox"
                    id="inuse"
                    name="inuse"
                    checked={variantFormData.inuse}
                    onChange={handleVariantInputChange}
                  />
                  Currently In Use
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowVariantForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {variantFormMode === 'add' ? 'Add Variant' : 'Update Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolkits; 