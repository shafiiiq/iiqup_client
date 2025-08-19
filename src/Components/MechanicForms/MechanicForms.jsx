import React, { useState, useEffect } from 'react';
import './MechanicForms.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

const MechanicForms = () => {
  // State for mechanics list
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [activeTab, setActiveTab] = useState('toolkit'); // 'toolkit' or 'overtime'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // State for toolkit form
  const [toolkit, setToolkit] = useState({
    name: '',
    type: 'Head Protection',
    size: '',
    color: '',
    stockCount: 1,
    minStockLevel: 1
  });

  // State for overtime form - Fixed workDetails to be an array of strings
  const [overtime, setOvertime] = useState({
    date: new Date().toISOString().split('T')[0],
    regNo: [],
    times: [
      {
        in: '',
        out: ''
      }
    ],
    workDetails: [''] // Changed to array of strings to match schema
  });

  // State for reg number input
  const [regNoInput, setRegNoInput] = useState('');

  // Equipment types for dropdown
  const equipmentTypes = [
    'Head Protection',
    'Eye Protection',
    'Hand Protection',
    'Foot Protection',
    'Body Protection',
    'Fall Protection',
    'Respiratory Protection'
  ];

  // Fetch mechanics on component mount
  useEffect(() => {
    fetchMechanics();
  }, []);

  // Fetch mechanics from API
  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`${END_POINT}/mechanics/get-all-mechanic`);
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setMechanics(result.data);
        if (result.data.length > 0) {
          setSelectedMechanic(result.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      showMessage('Failed to load mechanics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle toolkit form changes
  const handleToolkitChange = (e) => {
    const { name, value } = e.target;
    setToolkit({
      ...toolkit,
      [name]: name === 'stockCount' || name === 'minStockLevel' ? parseInt(value) : value
    });
  };

  // Handle overtime form changes
  const handleOvertimeChange = (e) => {
    const { name, value } = e.target;
    setOvertime({
      ...overtime,
      [name]: value
    });
  };

  // Handle overtime time entries
  const handleTimeChange = (index, field, value) => {
    const updatedTimes = [...overtime.times];
    updatedTimes[index] = {
      ...updatedTimes[index],
      [field]: value
    };

    setOvertime({
      ...overtime,
      times: updatedTimes
    });
  };

  // Handle work details entries - Updated to store strings directly
  const handleWorkDetailsChange = (index, value) => {
    const updatedWorkDetails = [...overtime.workDetails];
    updatedWorkDetails[index] = value; // Store string directly

    setOvertime({
      ...overtime,
      workDetails: updatedWorkDetails
    });
  };

  // Add a new time entry to overtime
  const addTimeEntry = () => {
    setOvertime({
      ...overtime,
      times: [
        ...overtime.times,
        { in: '', out: '' }
      ]
    });
  };

  // Remove a time entry from overtime
  const removeTimeEntry = (index) => {
    if (overtime.times.length > 1) {
      const updatedTimes = overtime.times.filter((_, i) => i !== index);
      setOvertime({
        ...overtime,
        times: updatedTimes
      });
    }
  };

  // Add a new work detail entry
  const addWorkDetailEntry = () => {
    setOvertime({
      ...overtime,
      workDetails: [
        ...overtime.workDetails,
        '' // Add empty string instead of object
      ]
    });
  };

  // Remove a work detail entry
  const removeWorkDetailEntry = (index) => {
    if (overtime.workDetails.length > 1) {
      const updatedWorkDetails = overtime.workDetails.filter((_, i) => i !== index);
      setOvertime({
        ...overtime,
        workDetails: updatedWorkDetails
      });
    }
  };

  // Handle registration number input
  const handleRegNoChange = (e) => {
    setRegNoInput(e.target.value);
  };

  // Add registration number to array
  const addRegNo = () => {
    if (regNoInput.trim() === '') {
      showMessage('Please enter a registration number', 'error');
      return;
    }

    const regNumber = parseInt(regNoInput);
    if (isNaN(regNumber)) {
      showMessage('Registration number must be a valid number', 'error');
      return;
    }

    if (overtime.regNo.includes(regNumber)) {
      showMessage('This registration number is already added', 'error');
      return;
    }

    setOvertime({
      ...overtime,
      regNo: [...overtime.regNo, regNumber]
    });
    setRegNoInput('');
  };

  // Remove a registration number
  const removeRegNo = (regNoToRemove) => {
    setOvertime({
      ...overtime,
      regNo: overtime.regNo.filter(regNo => regNo !== regNoToRemove)
    });
  };

  // Handle toolkit submission
  const handleToolkitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMechanic) {
      showMessage('Please select a mechanic', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`${END_POINT}/mechanics/${selectedMechanic}/toolkit`,
        'POST',
        toolkit
      );

      const result = await response.json();

      if (response.ok) {
        showMessage('Toolkit added successfully', 'success');
        // Reset form
        setToolkit({
          name: '',
          type: 'Head Protection',
          size: '',
          color: '',
          stockCount: 1,
          minStockLevel: 1
        });
      } else {
        showMessage(result.error || 'Failed to add toolkit', 'error');
      }
    } catch (error) {
      console.error('Error adding toolkit:', error);
      showMessage('Error adding toolkit', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle overtime submission
  const handleOvertimeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMechanic) {
      showMessage('Please select a mechanic', 'error');
      return;
    }

    if (overtime.regNo.length === 0) {
      showMessage('Please add at least one registration number', 'error');
      return;
    }

    // Validate times
    for (const time of overtime.times) {
      if (!time.in || !time.out) {
        showMessage('Please fill in all time entries', 'error');
        return;
      }
    }

    // Validate work details
    for (const workDetail of overtime.workDetails) {
      if (!workDetail.trim()) {
        showMessage('Please fill in all work details', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      // Create a deep copy of the overtime object to avoid modifying the original
      const overtimeData = JSON.parse(JSON.stringify(overtime));

      // Format times properly for API
      overtimeData.times.forEach(time => {
        time.in = new Date(time.in).toISOString();
        time.out = new Date(time.out).toISOString();
      });

      // Format date for API
      overtimeData.date = new Date(overtimeData.date).toISOString();

      // Send the request
      const response = await apiRequest(`${END_POINT}/mechanics/${selectedMechanic}/overtime`,
        'POST',
        overtimeData
      );

      const result = await response.json();

      if (response.ok) {
        showMessage('Overtime added successfully', 'success');
        // Reset form
        setOvertime({
          date: new Date().toISOString().split('T')[0],
          regNo: [],
          times: [
            {
              in: '',
              out: ''
            }
          ],
          workDetails: [''] // Reset to a single empty string
        });
      } else {
        showMessage(result.error || 'Failed to add overtime', 'error');
      }
    } catch (error) {
      console.error('Error adding overtime:', error);
      showMessage('Error adding overtime', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show message with auto-hide
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  return (
    <div className="mechanic-forms-container">
      <h1>Mechanic Management</h1>

      {/* Message display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Mechanic selector */}
      <div className="form-group">
        <label>Select Mechanic:</label>
        <select
          value={selectedMechanic}
          onChange={(e) => setSelectedMechanic(e.target.value)}
          disabled={loading || mechanics.length === 0}
        >
          {mechanics.length === 0 && <option value="">No mechanics available</option>}
          {mechanics.map((mechanic) => (
            <option key={mechanic._id} value={mechanic._id}>
              {mechanic.name} (ID: {mechanic.userId})
            </option>
          ))}
        </select>
      </div>

      {/* Tab navigation */}
      <div className="tabs">
        <button
          className={activeTab === 'toolkit' ? 'active' : ''}
          onClick={() => setActiveTab('toolkit')}
        >
          Add Toolkit
        </button>
        <button
          className={activeTab === 'overtime' ? 'active' : ''}
          onClick={() => setActiveTab('overtime')}
        >
          Add Overtime
        </button>
      </div>

      {/* Toolkit Form */}
      {activeTab === 'toolkit' && (
        <div className="form-panel">
          <h2>Add Toolkit</h2>
          <form onSubmit={handleToolkitSubmit}>
            <div className="form-group">
              <label>Toolkit Name:</label>
              <input
                type="text"
                name="name"
                value={toolkit.name}
                onChange={handleToolkitChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Type:</label>
              <select
                name="type"
                value={toolkit.type}
                onChange={handleToolkitChange}
                required
              >
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Size:</label>
              <input
                type="text"
                name="size"
                value={toolkit.size}
                onChange={handleToolkitChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Color:</label>
              <input
                type="text"
                name="color"
                value={toolkit.color}
                onChange={handleToolkitChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Stock Count:</label>
                <input
                  type="number"
                  name="stockCount"
                  value={toolkit.stockCount}
                  onChange={handleToolkitChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group half">
                <label>Min Stock Level:</label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={toolkit.minStockLevel}
                  onChange={handleToolkitChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Toolkit'}
            </button>
          </form>
        </div>
      )}

      {/* Overtime Form */}
      {activeTab === 'overtime' && (
        <div className="form-panel">
          <h2>Add Overtime</h2>
          <form onSubmit={handleOvertimeSubmit}>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                name="date"
                value={overtime.date}
                onChange={handleOvertimeChange}
                required
              />
            </div>

            {/* Registration Numbers Section */}
            <h3>Registration Numbers</h3>
            <div className="reg-no-input">
              <div className="form-row">
                <div className="form-group" style={{ flex: 3 }}>
                  <input
                    type="number"
                    placeholder="Enter registration number"
                    value={regNoInput}
                    onChange={handleRegNoChange}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <button
                    type="button"
                    className="add-btn"
                    onClick={addRegNo}
                    style={{ margin: '0', width: '100%' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {overtime.regNo.length > 0 && (
              <div className="reg-no-list">
                <h4>Added Registration Numbers:</h4>
                <div className="reg-no-tags">
                  {overtime.regNo.map((regNo, index) => (
                    <span key={index} className="reg-no-tag">
                      {regNo}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeRegNo(regNo)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <h3>Time Entries</h3>

            {overtime.times.map((time, index) => (
              <div key={index} className="time-entry">
                <div className="form-row">
                  <div className="form-group half">
                    <label>Clock In:</label>
                    <input
                      type="datetime-local"
                      value={time.in}
                      onChange={(e) => handleTimeChange(index, 'in', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group half">
                    <label>Clock Out:</label>
                    <input
                      type="datetime-local"
                      value={time.out}
                      onChange={(e) => handleTimeChange(index, 'out', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {overtime.times.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeTimeEntry(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="add-btn"
              onClick={addTimeEntry}
            >
              Add Another Time Entry
            </button>

            {/* Work Details Section - Updated to handle strings directly */}
            <h3>Work Details</h3>

            {overtime.workDetails.map((workDetail, index) => (
              <div key={index} className="work-detail-entry">
                <div className="form-group">
                  <label>Work Description {index + 1}:</label>
                  <textarea
                    value={workDetail}
                    onChange={(e) => handleWorkDetailsChange(index, e.target.value)}
                    placeholder="Enter work details"
                    rows="3"
                    required
                  ></textarea>
                </div>

                {overtime.workDetails.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeWorkDetailEntry(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="add-btn"
              onClick={addWorkDetailEntry}
            >
              Add Another Work Detail
            </button>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Overtime'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MechanicForms;