import React, { useState, useEffect } from 'react';
import './Mechanics.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import Loader from '../../common/Loader/Loader';

const Mechanics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [attendanceFilter, setAttendanceFilter] = useState('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [overtimeView, setOvertimeView] = useState('monthly'); 
  const [attendanceData, setAttendanceData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`${END_POINT}/mechanics/get-all-mechanic`);
        if (!response.ok) throw new Error('Failed to fetch mechanics');
        const data = await response.json();
        setMechanics(data.data);
        if (data.data.length > 0) {

          setSelectedMechanic(data.data[0]);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching mechanics:', err);
      }
    };

    fetchMechanics();
  }, []);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!selectedMechanic?.zktecoPin) return;
      try {
        const today = new Date().toISOString().split('T')[0];

        const response = await apiRequest(`${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/daily/${today}`);
        const data = await response.json();

        if (data.status === 200) {
          setRecentActivity(data.data.records || []);
        } else {
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setRecentActivity([]);
      } finally {
        return;
      }
    };

    fetchRecentActivity()
  }, [recentActivity, selectedMechanic])

  const generateAvatar = (name) => {
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');

    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];
    const colorIndex = name.length % colors.length;

    return (
      <div
        className="avatar"
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {initials}
      </div>
    );
  };

  const filteredMechanics = mechanics.filter(mechanic =>
    mechanic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mechanic.userId?.toString().includes(searchTerm)
  );

  const formatTime = (date) => {
    if (!date) return 'N/A';

    const time = new Date(date);

    const qatarTime = new Date(time.getTime() - (3 * 60 * 60 * 1000));

    let hours = qatarTime.getHours();
    const minutes = String(qatarTime.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatTotalTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const calculateMonthTotalTime = (monthData) => {
    if (!monthData.entries || monthData.entries.length === 0) return 0;
    return monthData.entries.reduce((total, entry) => total + (entry.totalTime || 0), 0);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: selectedMechanic.name,
      userId: selectedMechanic.userId || ''
    });
  };

  const fetchAttendanceData = async (filterType, startDate = null, endDate = null) => {
    if (!selectedMechanic?.zktecoPin) return;

    setAttendanceLoading(true);
    try {
      let url;

      if (filterType === 'date-range' && startDate && endDate) {
        url = `${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/date-range?startDate=${startDate}&endDate=${endDate}`;
      } else if (filterType === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        url = `${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/daily/${today}`;
      } else if (filterType === 'weekly') {
        const now = new Date();
        const year = now.getFullYear();
        const week = Math.ceil((now - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        url = `${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/weekly/${year}/${week}`;
      } else if (filterType === 'monthly') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        url = `${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/monthly/${year}/${month}`;
      } else if (filterType === 'yearly') {
        const year = new Date().getFullYear();
        url = `${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/yearly/${year}`;
      } else if (filterType === 'all') {
        url = `${END_POINT}/mechanics/attendance/${selectedMechanic.zktecoPin}/all`;
      }

      const response = await apiRequest(url);
      const data = await response.json();

      if (data.status === 200) {
        setAttendanceData(data.data.records || []);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await apiRequest(
        `${END_POINT}/mechanics/update-mechanic/${selectedMechanic._id}`,
        'PUT',
        editForm
      );
      const data = await response.json();

      setMechanics(mechanics.map(m => m._id === data._id ? data : m));
      setSelectedMechanic(data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating mechanic:', err);
      alert('Failed to update mechanic');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this mechanic?')) return;

    try {
      await apiRequest(`${END_POINT}/mechanics/${selectedMechanic._id}`, 'DELETE');
      const updatedMechanics = mechanics.filter(m => m._id !== selectedMechanic._id);
      setMechanics(updatedMechanics);
      setSelectedMechanic(updatedMechanics.length > 0 ? updatedMechanics[0] : null);
    } catch (err) {
      console.error('Error deleting mechanic:', err);
      alert('Failed to delete mechanic');
    }
  };

  const handleMonthSelect = (monthData) => {
    setSelectedMonth(monthData.month);
    setOvertimeView('daily');
  };

  const handleBackToMonthly = () => {
    setSelectedMonth(null);
    setOvertimeView('monthly');
  };

  if (loading) {
    return (
      <div className="mechanics-container">
        <div className="loading-state">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mechanics-container">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mechanics-container">
      <div className="mechanics-layout">
        {/* Left Sidebar - Mechanics List */}
        <div className="mechanics-sidebar">
          <div className="sidebar-header">
            <h3>Mechanics ({filteredMechanics.length})</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search mechanics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="mechanics-list">
            {filteredMechanics.map((mechanic) => (
              <div
                key={mechanic._id}
                className={`mechanic-card ${selectedMechanic?._id === mechanic._id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedMechanic(mechanic);
                  setActiveTab('overview');
                  setIsEditing(false);
                  setSelectedMonth(null);
                  setOvertimeView('monthly');
                }}
              >
                <div className="mechanic-avatar">
                  {generateAvatar(mechanic.name)}
                </div>
                <div className="mechanic-info">
                  <h4>{mechanic.name}</h4>
                  <p className="mechanic-id">ID: {mechanic.userId || mechanic._id}</p>
                  <div className="mechanic-stats">
                    <span className="stat">
                      {mechanic.toolkits?.length || 0} Tools
                    </span>
                  </div>
                </div>
                <div className="mechanic-status">
                  <div className="status-indicator active"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mechanics-main">
          {selectedMechanic ? (
            <>
              {/* Mechanic Header */}
              <div className="mechanic-header">
                <div className="mechanic-profile">
                  <div className="profile-avatar">
                    {generateAvatar(selectedMechanic.name)}
                  </div>
                  <div className="profile-info">
                    {isEditing ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="edit-input"
                        />
                        <input
                          type="text"
                          value={editForm.userId}
                          onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
                          className="edit-input"
                          placeholder="User ID"
                        />
                      </div>
                    ) : (
                      <>
                        <h2>{selectedMechanic.name}</h2>
                        <p className="profile-id">ID: {selectedMechanic.userId || selectedMechanic._id}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="profile-actions">
                  {isEditing ? (
                    <div className="edit-actions">
                      <Button
                        text="Save"
                        onClick={handleSaveEdit}
                        colorScheme="lime-600"
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
                        text="Cancel"
                        onClick={handleCancelEdit}
                        colorScheme="amber-600"
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
                  ) : (
                    <div className="profile-buttons">
                      <Button
                        text="Edit"
                        onClick={handleEdit}
                        colorScheme="blue-600"
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
                        onClick={handleDelete}
                        colorScheme="red-600"
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
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="detail-tabs">
                <button
                  className={`detail-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`detail-tab ${activeTab === 'toolkits' ? 'active' : ''}`}
                  onClick={() => setActiveTab('toolkits')}
                >
                  Toolkits ({selectedMechanic.toolkits?.length || 0})
                </button>
                <button
                  className={`detail-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  Attendance
                </button>
                <button
                  className={`detail-tab ${activeTab === 'overtime' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overtime')}
                >
                  Overtime
                </button>
                <button
                  className={`detail-tab ${activeTab === 'documents' ? 'active' : ''}`}
                  onClick={() => setActiveTab('documents')}
                >
                  Documents
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-content">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-info">
                          <h3>{selectedMechanic.toolkits?.length || 0}</h3>
                          <p>Total Toolkits</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-info">
                          <h3>{selectedMechanic.attendance?.length || 0}</h3>
                          <p>Attendance Records</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-info">
                          <h3>{selectedMechanic.monthlyOvertime?.length || 0}</h3>
                          <p>Overtime Records</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-info">
                          <h3>Active</h3>
                          <p>Status</p>
                        </div>
                      </div>
                    </div>

                    <div className="recent-activity">
                      <h3>Recent Activity</h3>
                      <div className="activity-list">
                        {
                          recentActivity?.map((record, index) => (
                            <div key={index} className="activity-item">
                              <div className="activity-content">
                                <p>Checked {record.punchType} at {record.punchTime}</p>
                                <span className="activity-date">
                                  {new Date(record.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        {(!recentActivity || recentActivity.length === 0) && (
                          <p className="no-activity">No recent activity</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'toolkits' && (
                  <div className="toolkits-content">
                    <div className="content-header">
                      <h3>Assigned Toolkits</h3>
                    </div>
                    <div className="toolkits-table-wrapper">
                      <table className="toolkits-table">
                        <thead>
                          <tr>
                            <th>SL NO</th>
                            <th>Handover Date</th>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Color</th>
                            <th>Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMechanic.toolkits?.length > 0 ? (
                            selectedMechanic.toolkits.map((toolkit, index) => (
                              <tr key={toolkit._id}>
                                <td>{selectedMechanic.toolkits.length - index}</td>
                                <td>{new Date(toolkit.assignedDate).toLocaleDateString()}</td>
                                <td className="toolkit-name">{toolkit.name}</td>
                                <td>{toolkit.size}</td>
                                <td>
                                  {toolkit.color}
                                </td>
                                <td>{toolkit.quantity}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="40" className="no-data">No toolkits assigned</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="attendance-content">
                    <div className="content-header">
                      <h3>Attendance Records</h3>
                      {attendanceFilter === 'date-range' && (
                        <div className='range-selector' style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <Input
                            type="date"
                            name="startDate"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            placeholder="Start Date"
                            colorScheme="yellow-300"
                            variant="gradient"
                            squircle="4xl"
                            width="220px"
                            height="44px"
                            textColor="black-100"
                            placeholderColor="black-300"
                            fontWeight='500'
                            inputPaddingInline="xl"
                          />
                          <Input
                            type="date"
                            name="endDate"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            placeholder="End Date"
                            colorScheme="yellow-300"
                            variant="gradient"
                            squircle="4xl"
                            width="220px"
                            height="44px"
                            textColor="black-100"
                            placeholderColor="black-300"
                            inputPaddingInline="xl"
                            fontWeight='500'
                          />
                          <Button
                            text="Apply"
                            onClick={() => fetchAttendanceData('date-range', dateRange.start, dateRange.end)}
                            colorScheme="lime-500"
                            variant="gradient"
                            font="md"
                            squircle="xl"
                            width="100px"
                            height="44px"
                            textColor="black-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                          />
                        </div>
                      )}
                      <Input
                        type="select"
                        value={attendanceFilter}
                        onChange={(e) => {
                          setAttendanceFilter(e.target.value);
                          if (e.target.value !== 'date-range') {
                            fetchAttendanceData(e.target.value);
                          }
                        }}
                        options={[
                          { value: 'daily', label: 'Today' },
                          { value: 'yesterday', label: 'Yesterday' },
                          { value: 'weekly', label: 'This Week' },
                          { value: 'monthly', label: 'This Month' },
                          { value: 'yearly', label: 'This Year' },
                          { value: 'date-range', label: 'Date Range' },
                          { value: 'all', label: 'All Records' }
                        ]}
                        colorScheme="lime-500"
                        variant="gradient"
                        font="md"
                        squircle="4xl"
                        width="130px"
                        height="44px"
                        textColor="black-200"
                        shadowPosition="to-bottom"
                        shadowColor="black-600"
                        animation="none"
                        fontWeight='500'
                        inputPaddingInline="xl"
                      />
                    </div>
                    <div className="attendance-table-wrapper">
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Break Out</th>
                            <th>Break In</th>
                            <th>Check Out</th>
                            <th>Total Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceLoading ? (
                            <tr>
                              <td colSpan="6" className="no-data">Loading attendance data...</td>
                            </tr>
                          ) : attendanceData.length > 0 ? (
                            (() => {
                              const groupedByDate = attendanceData.reduce((acc, record) => {
                                const date = record.dateOnly;
                                if (!acc[date]) {
                                  acc[date] = [];
                                }
                                acc[date].push(record);
                                return acc;
                              }, {});

                              return Object.entries(groupedByDate).map(([date, records]) => {
                                const sortedRecords = records.sort((a, b) =>
                                  new Date(a.punchDateTime) - new Date(b.punchDateTime)
                                );

                                const checkIn = sortedRecords[0];
                                const checkOut = sortedRecords[sortedRecords.length - 1]; 
                                const breakOut = sortedRecords[1];
                                const breakIn = sortedRecords[2];

                                let totalMinutes = 0;
                                if (checkIn && checkOut) {
                                  const start = new Date(checkIn.punchDateTime);
                                  const end = new Date(checkOut.punchDateTime);
                                  totalMinutes = Math.floor((end - start) / (1000 * 60));

                                  if (breakOut && breakIn) {
                                    const breakStart = new Date(breakOut.punchDateTime);
                                    const breakEnd = new Date(breakIn.punchDateTime);
                                    const breakMinutes = Math.floor((breakEnd - breakStart) / (1000 * 60));
                                    totalMinutes -= breakMinutes;
                                  }
                                }

                                return (
                                  <tr key={date}>
                                    <td>{date}</td>
                                    <td>{checkIn ? formatTime(checkIn.punchDateTime) : '-'}</td>
                                    <td>{breakOut ? formatTime(breakOut.punchDateTime) : '-'}</td>
                                    <td>{breakIn ? formatTime(breakIn.punchDateTime) : '-'}</td>
                                    <td>{checkOut && sortedRecords.length > 1 ? formatTime(checkOut.punchDateTime) : '-'}</td>
                                    <td>{formatTotalTime(totalMinutes)}</td>
                                  </tr>
                                );
                              });
                            })()
                          ) : (
                            <tr>
                              <td colSpan="6" className="no-data">No attendance records found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'overtime' && (
                  <div className="overtime-content">
                    <div className="content-header">
                      <h3>
                        {overtimeView === 'monthly' ? 'Overtime Records - Monthly View' :
                          `${selectedMonth} - Daily Records`
                        }
                      </h3>
                      {overtimeView === 'daily' && (
                        <button onClick={handleBackToMonthly} className="back-btn">
                          ← Back to Monthly View
                        </button>
                      )}
                    </div>

                    {overtimeView === 'monthly' ? (
                      <div className="overtime-monthly-table-wrapper">
                        <table className="overtime-table">
                          <thead>
                            <tr>
                              <th>Month/Year</th>
                              <th>Total Days</th>
                              <th>Total Hours</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedMechanic.monthlyOvertime?.length > 0 ? (
                              selectedMechanic.monthlyOvertime.map((monthData, index) => (
                                <tr key={index}>
                                  <td className="month-cell">{monthData.month}</td>
                                  <td>{monthData.entries?.length || 0}</td>
                                  <td className="total-time">
                                    {formatTotalTime(calculateMonthTotalTime(monthData))}
                                  </td>
                                  <td>
                                    <button
                                      className="view-details-btn"
                                      onClick={() => handleMonthSelect(monthData)}
                                      disabled={!monthData.entries || monthData.entries.length === 0}
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="40" className="no-data">No overtime records available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="overtime-daily-table-wrapper">
                        <table className="overtime-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Equipment</th>
                              <th>Time Slot</th>
                              <th>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedMonth?.entries?.length > 0 ? (
                              selectedMonth.entries.map((record) => {
                                const latestTime = record.times && record.times.length > 0
                                  ? record.times[record.times.length - 1]
                                  : null;
                                return (
                                  <tr key={record._id}>
                                    <td>{record.formattedDate || new Date(record.date).toLocaleDateString()}</td>
                                    <td>
                                      {record.regNo?.length > 0 ? (
                                        <div className="equipment-list">
                                          {record.regNo.map((equipment, idx) => (
                                            <span key={idx} className="equipment-tag">
                                              {equipment}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="no-equipment">No equipment</span>
                                      )}
                                    </td>
                                    <td>
                                      {latestTime ? (
                                        `${formatTime(latestTime.in)} - ${formatTime(latestTime.out)}`
                                      ) : 'N/A'}
                                    </td>
                                    <td className="duration-cell">
                                      {record.formattedTime || formatTotalTime(record.totalTime)}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="40" className="no-data">No daily records found for this month</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">👤</div>
              <h3>Select a Mechanic</h3>
              <p>Choose a mechanic from the sidebar to view their details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mechanics;