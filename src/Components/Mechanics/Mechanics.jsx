import React, { useState, useEffect } from 'react';
import './Mechanics.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

const Mechanics = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [showToolkitPopup, setShowToolkitPopup] = useState(false);
  const [showAttendanceFilter, setShowAttendanceFilter] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMechanic, setNewMechanic] = useState({
    name: '',
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

  // Fetch mechanics data
  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setLoading(true);
        // In a real implementation:
        const response = await apiRequest(`${END_POINT}/mechanics/get-all-mechanic`);
        if (!response.ok) throw new Error('Failed to fetch mechanics');
        const data = await response.json();
        setMechanics(data.data);
        setLoading(false)
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching mechanics:', err);
      }
    };

    fetchMechanics();
  }, []);

  // Filter mechanics based on search term
  const filteredMechanics = mechanics.filter(mechanic =>
    mechanic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mechanic.userId.toString().includes(searchTerm)
  );

  // Format time to AM/PM
  const formatTime = (date) => {
    if (!date) return 'N/A';
    const time = new Date(date);
    let hours = time.getHours();
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Format total time (minutes to hours)
  const formatTotalTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle add mechanic
  const handleAddMechanic = async () => {
    try {
      // In a real implementation:
      const response = await apiRequest(`${END_POINT}/mechanics/add-mechanic`,
        'POST',
        newMechanic
      );
      const data = await response.json();

      setMechanics([...mechanics, data]);

      // For demo
      const newId = Math.max(...mechanics.map(m => parseInt(m._id))) + 1;
      const mechanicToAdd = {
        ...newMechanic,
        _id: newId.toString(),
        toolkits: [],
        attendance: [],
        overtime: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setMechanics([...mechanics, mechanicToAdd]);
      setShowAddForm(false);
      setNewMechanic({ name: '' });
    } catch (err) {
      console.error('Error adding mechanic:', err);
      alert('Failed to add mechanic');
    }
  };

  // Handle delete mechanic
  const handleDeleteMechanic = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mechanic?')) return;

    try {
      // In a real implementation:
      await apiRequest(`${END_POINT}/mechanics/${id}`, 'DELETE');
      setMechanics(mechanics.filter(m => m._id !== id));
    } catch (err) {
      console.error('Error deleting mechanic:', err);
      alert('Failed to delete mechanic');
    }
  };

  // Handle edit mechanic
  const handleEditMechanic = async (updatedMechanic) => {
    try {
      // In a real implementation:
      const response = await apiRequest(`${END_POINT}/mechanics/update-mechanic/${updatedMechanic._id}`,
        'PUT',
        updatedMechanic
      );
      const data = await response.json();
      setMechanics(mechanics.map(m => m._id === data._id ? data : m));
      setSelectedMechanic(null);
    } catch (err) {
      console.error('Error updating mechanic:', err);
      alert('Failed to update mechanic');
    }
  };

  return (
    <div className="mechanics-container">
      <div className="mechanics-header">
        <h1 className='mechanics-title'>Mechanics Management</h1>
        <div className="date-time">{currentDateTime}</div>
      </div>

      <div className="search-add-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn">Search</button>
        </div>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>Add Mechanic</button>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Mechanics Details
        </button>
        <button
          className={`tab-btn ${activeTab === 'toolkits' ? 'active' : ''}`}
          onClick={() => setActiveTab('toolkits')}
        >
          Toolkits
        </button>
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button
          className={`tab-btn ${activeTab === 'overtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('overtime')}
        >
          Overtime
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading mechanics data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="mechanics-content">
          {activeTab === 'details' && (
            <div className="mechanics-table-container">
              <table className="mechanics-table">
                <thead>
                  <tr>
                    <th>SL No</th>
                    <th>Name</th>
                    <th>User ID</th>
                    <th>Toolkits</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMechanics.map((mechanic, index) => (
                    <tr key={mechanic._id}>
                      <td>{index + 1}</td>
                      <td>{mechanic.name}</td>
                      <td>{mechanic.userId}</td>
                      <td>{mechanic.toolkits.length}</td>
                      <td className='action-btns'>
                        <button
                          className="action-btn edit"
                          onClick={() => setSelectedMechanic(mechanic)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteMechanic(mechanic._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'toolkits' && (
            <div className="toolkits-table-container">
              <table className="toolkits-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mechanic Name</th>
                    <th>Toolkit Name</th>
                    <th>Type</th>
                    <th>Assigned On</th>
                    <th>Toolkits</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMechanics.map(mechanic => {
                    const latestToolkit = mechanic.toolkits.length > 0
                      ? mechanic.toolkits[mechanic.toolkits.length - 1]
                      : null;

                    return (
                      <tr key={mechanic._id}>
                        <td>{mechanic._id}</td>
                        <td>{mechanic.name}</td>
                        <td>{latestToolkit ? latestToolkit.name : 'N/A'}</td>
                        <td>{latestToolkit ? latestToolkit.type : 'N/A'}</td>
                        <td>{latestToolkit ? new Date(latestToolkit.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="toolkits-cell">
                          {mechanic.toolkits.length > 0 ? (
                            <div className="toolkits-hover-container">
                              <span>{mechanic.toolkits.length} items</span>
                              <button
                                className="view-all-btn"
                                onClick={() => {
                                  setSelectedMechanic(mechanic);
                                  setShowToolkitPopup(true);
                                }}
                              >
                                View All
                              </button>
                            </div>
                          ) : 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="attendance-container">
              <div className="attendance-filters">
                <div className="filter-dropdown">
                  <button
                    className="filter-toggle"
                    onClick={() => setShowAttendanceFilter(!showAttendanceFilter)}
                  >
                    {attendanceFilter === 'weekly' ? 'Weekly' : 'Monthly'} ▼
                  </button>
                  {showAttendanceFilter && (
                    <div className="filter-options">
                      <button onClick={() => {
                        setAttendanceFilter('weekly');
                        setShowAttendanceFilter(false);
                      }}>Weekly</button>
                      <button onClick={() => {
                        setAttendanceFilter('monthly');
                        setShowAttendanceFilter(false);
                      }}>Monthly</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="attendance-tabs">
                {filteredMechanics.map(mechanic => (
                  <div
                    key={mechanic._id}
                    className={`attendance-tab ${selectedMechanic?._id === mechanic._id ? 'active' : ''}`}
                    onClick={() => setSelectedMechanic(mechanic)}
                  >
                    {mechanic.name.split(' ')[0]}
                  </div>
                ))}
              </div>

              <div className="attendance-table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>In</th>
                      <th>Break Out</th>
                      <th>Break In</th>
                      <th>Out</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMechanic ? (
                      selectedMechanic.attendance.map(record => (
                        <tr key={record._id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{formatTime(record.in)}</td>
                          <td>{formatTime(record.breakOut)}</td>
                          <td>{formatTime(record.breakIn)}</td>
                          <td>{formatTime(record.out)}</td>
                          <td>{formatTotalTime(record.totalTime)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-data">Select a mechanic to view attendance</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'overtime' && (
            <div className="overtime-container">
              <div className="overtime-tabs">
                {filteredMechanics.map(mechanic => (
                  <div
                    key={mechanic._id}
                    className={`overtime-tab ${selectedMechanic?._id === mechanic._id ? 'active' : ''}`}
                    onClick={() => setSelectedMechanic(mechanic)}
                  >
                    {mechanic.name.split(' ')[0]}
                  </div>
                ))}
              </div>

              <div className="overtime-table-container">
                <table className="overtime-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Equipment</th>
                      <th>Time</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMechanic ? (
                      selectedMechanic.monthlyOvertime && selectedMechanic.monthlyOvertime.length > 0 ? (
                        // Display entries grouped by month with month headers
                        selectedMechanic.monthlyOvertime.flatMap(monthData => {
                          const monthRows = [];

                          // Add month header row
                          monthRows.push(
                            <tr key={`month-${monthData._id}`} className="month-header">
                              <td colSpan="4" className="month-title">
                                {monthData.month} - Total: {monthData.formattedMonthTime}
                              </td>
                            </tr>
                          );

                          // Add entries for this month
                          if (monthData.entries && monthData.entries.length > 0) {
                            monthData.entries.forEach(record => {
                              const latestTime = record.times && record.times.length > 0
                                ? record.times[record.times.length - 1]
                                : null;

                              monthRows.push(
                                <tr key={record._id}>
                                  <td>{record.formattedDate || new Date(record.date).toLocaleDateString()}</td>
                                  <td>
                                    {record.regNo && record.regNo.length > 0 ? (
                                      <div className="equipment-cell">
                                        <span>{record.regNo.length} items</span>
                                        <button
                                          className="view-all-btn"
                                          onClick={() => {
                                            alert(`Equipment Reg Numbers: ${record.regNo.join(', ')}`);
                                          }}
                                        >
                                          View All
                                        </button>
                                      </div>
                                    ) : 'None'}
                                  </td>
                                  <td>
                                    {latestTime ? (
                                      `${formatTime(latestTime.in)} - ${formatTime(latestTime.out)}`
                                    ) : 'N/A'}
                                  </td>
                                  <td>{record.formattedTime || formatTotalTime(record.totalTime)}</td>
                                </tr>
                              );
                            });
                          }

                          return monthRows;
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="no-data">No overtime records found</td>
                        </tr>
                      )
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-data">Select a mechanic to view overtime</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Mechanic Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Mechanic</h2>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={newMechanic.name}
                  onChange={(e) => setNewMechanic({ ...newMechanic, name: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddMechanic}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mechanic Form */}
      {selectedMechanic && activeTab === 'details' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Mechanic</h2>
              <button className="close-btn" onClick={() => setSelectedMechanic(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ID:</label>
                <input type="text" value={selectedMechanic._id} disabled />
              </div>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedMechanic.name}
                  onChange={(e) => setSelectedMechanic({
                    ...selectedMechanic,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>User ID:</label>
                <input
                  type="text"
                  value={selectedMechanic.userId}
                  onChange={(e) => setSelectedMechanic({
                    ...selectedMechanic,
                    userId: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedMechanic(null)}>Cancel</button>
              <button className="save-btn" onClick={() => handleEditMechanic(selectedMechanic)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Toolkits Popup */}
      {showToolkitPopup && selectedMechanic && (
        <div className="modal-overlay">
          <div className="modal-content wide-modal">
            <div className="modal-header">
              <h2>Toolkits for {selectedMechanic.name}</h2>
              <button className="close-btn" onClick={() => setShowToolkitPopup(false)}>×</button>
            </div>
            <div className="modal-body">
              <table className="toolkits-popup-table">
                <thead>
                  <tr>
                    <th>Toolkit Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Status</th>
                    <th>Assigned On</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMechanic.toolkits.map(toolkit => (
                    <tr key={toolkit._id}>
                      <td>{toolkit.name}</td>
                      <td>{toolkit.type}</td>
                      <td>{toolkit.size}</td>
                      <td>{toolkit.color}</td>
                      <td>
                        <span className={`status-badge ${toolkit.status}`}>
                          {toolkit.status}
                        </span>
                      </td>
                      <td>{new Date(toolkit.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowToolkitPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mechanics;