import React, { useState, useEffect } from 'react';
import { END_POINT } from '../../constants';
import './Applications.css';
import { apiRequest } from '../../utils/0auth';

const Applications = () => {
  const [userId, setUserId] = useState(null);
  const [applicationType, setApplicationType] = useState('leave');
  const [leaveData, setLeaveData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'paid',
    leaveSubType: 'annual'
  });
  const [loanData, setLoanData] = useState({
    amount: '',
    repaymentMonths: 1,
    purpose: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Get user ID from localStorage on component mount
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData && userData._id) {
            setUserId(userData._id);
          } else {
            console.error('User ID not found in stored user data');
          }
        } else {
          console.error('No user data found in localStorage');
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    };

    getUserFromStorage();
  }, []);

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

  useEffect(() => {
    if (userId) {
      fetchLeaveBalance();
      const interval = setInterval(() => {
        fetchLeaveBalance();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    if (applicationType === 'leave' && userId) {
      fetchLeaveBalance();
    }
  }, [applicationType, userId]);

  const fetchLeaveBalance = async () => {
    if (!userId) return;

    try {
      const response = await apiRequest(`${END_POINT}/applications/leave-balance/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setLeaveBalance(data.data);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const checkLeaveAvailability = async () => {
    if (!userId || !leaveData.startDate || (leaveData.leaveSubType === 'annual' && !leaveData.endDate)) {
      setAvailabilityInfo(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await apiRequest(`${END_POINT}/applications/check-leave-availability`,
        'POST', {
        userId,
        leaveType: leaveData.leaveType,
        leaveSubType: leaveData.leaveSubType,
        startDate: leaveData.startDate,
        endDate: leaveData.leaveSubType === 'annual' ? leaveData.endDate : leaveData.startDate
      }
      );

      const data = await response.json();
      if (response.ok) {
        setAvailabilityInfo(data.data);
      } else {
        setAvailabilityInfo({ available: false, message: data.message });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityInfo({ available: false, message: 'Error checking availability' });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (leaveData.startDate && (leaveData.leaveSubType === 'monthly' ||
      (leaveData.leaveSubType === 'annual' && leaveData.endDate))) {
      const timer = setTimeout(() => {
        checkLeaveAvailability();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAvailabilityInfo(null);
    }
  }, [leaveData.startDate, leaveData.endDate, leaveData.leaveType, leaveData.leaveSubType, userId]);

  const handleLeaveChange = (e) => {
    const { name, value } = e.target;
    setLeaveData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-set end date for annual leave
    if (name === 'startDate' && leaveData.leaveSubType === 'annual' && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 29); // 30 days total (including start date)
      setLeaveData(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleLoanChange = (e) => {
    const { name, value } = e.target;
    setLoanData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setErrorMessage('User not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const url = `${END_POINT}/applications/request-service`;
      const payload = {
        userId,
        type: applicationType,
        ...(applicationType === 'leave' ? {
          ...leaveData,
          endDate: leaveData.leaveSubType === 'monthly' ? leaveData.startDate : leaveData.endDate
        } : loanData)
      };

      const response = await apiRequest(url, 'POST', payload)

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccessMessage('Application submitted successfully!');

      // Reset form
      if (applicationType === 'leave') {
        setLeaveData({
          startDate: '',
          endDate: '',
          reason: '',
          leaveType: 'paid',
          leaveSubType: 'annual'
        });
        setAvailabilityInfo(null);
        fetchLeaveBalance();
      } else {
        setLoanData({
          amount: '',
          repaymentMonths: 1,
          purpose: ''
        });
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while userId is being retrieved
  if (!userId) {
    return (
      <div className="applications-dashboard">
        <div className="applications-loading">
          <div className="applications-spinner"></div>
          <span>Loading user data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-dashboard">
      <div className="applications-header">
        <h1 className="applications-title">Employee Applications</h1>
        <div className="applications-datetime">{currentDateTime}</div>
      </div>

      <div className="applications-container">
        {/* Left Section - Balance and Status */}
        <div className="applications-left-section">
          {leaveBalance && applicationType === 'leave' && (
            <div className="applications-balance-card">
              <div className="applications-balance-header">
                <h3>Your Leave Balance</h3>
              </div>
              <div className="applications-balance-grid">
                <div className={`applications-balance-item ${leaveBalance.annual.available <= 5 ? 'low-balance' : ''}`}>
                  <div className="applications-balance-label">
                    <h4>Annual Leave</h4>
                    <span className="applications-balance-stats">
                      Available: <strong>{leaveBalance.annual.available}</strong> / {leaveBalance.annual.total} days
                    </span>
                  </div>
                  <div className="applications-progress-container">
                    <div
                      className="applications-progress-bar"
                      style={{ width: `${(leaveBalance.annual.used / leaveBalance.annual.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="applications-balance-footer">
                    <span>Used: {leaveBalance.annual.used} days</span>
                    {leaveBalance.annual.pending > 0 && (
                      <span className="applications-pending">Pending: {leaveBalance.annual.pending} days</span>
                    )}
                  </div>
                </div>

                <div className={`applications-balance-item ${leaveBalance.monthly.available <= 0 ? 'no-balance' : ''}`}>
                  <div className="applications-balance-label">
                    <h4>Monthly Leave</h4>
                    <span className="applications-balance-stats">
                      Available: <strong>{leaveBalance.monthly.available}</strong> / {leaveBalance.monthly.total} days
                    </span>
                  </div>
                  <div className="applications-progress-container">
                    <div
                      className="applications-progress-bar"
                      style={{ width: `${(leaveBalance.monthly.used / leaveBalance.monthly.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="applications-balance-footer">
                    <span>Used: {leaveBalance.monthly.used} days</span>
                    {leaveBalance.monthly.pending > 0 && (
                      <span className="applications-pending">Pending: {leaveBalance.monthly.pending} days</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="applications-status-indicators">
                <div className="applications-status-header">
                  <h4>Availabilty</h4>
                </div>
                <div className="applications-status-items">
                  <div className={`applications-status ${leaveBalance.annual.available > 0 ? 'available' : 'unavailable'}`}>
                    <span className="applications-status-dot"></span>
                    Annual Leave: {leaveBalance.annual.available > 0 ? 'Available' : 'Exhausted'}
                  </div>
                  <div className={`applications-status ${leaveBalance.monthly.available > 0 ? 'available' : 'unavailable'}`}>
                    <span className="applications-status-dot"></span>
                    Monthly Leave: {leaveBalance.monthly.available > 0 ? 'Available' : 'Used'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Form */}
        <div className="applications-right-section">
          <div className="applications-tabs">
            <button
              className={`applications-tab ${applicationType === 'leave' ? 'active' : ''}`}
              onClick={() => setApplicationType('leave')}
            >
              Leave Application
            </button>
            <button
              className={`applications-tab ${applicationType === 'loan' ? 'active' : ''}`}
              onClick={() => setApplicationType('loan')}
            >
              Loan Application
            </button>
          </div>

          {successMessage && (
            <div className="applications-alert success">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="applications-alert error">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="applications-form">
            {applicationType === 'leave' ? (
              <div className="applications-form-section">
                <div className="applications-form-group">
                  <label>Leave Type</label>
                  <select
                    name="leaveType"
                    value={leaveData.leaveType}
                    onChange={handleLeaveChange}
                    required
                  >
                    <option value="paid">Paid Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                </div>

                {leaveData.leaveType === 'paid' && (
                  <div className="applications-form-group">
                    <label>Leave Sub Type</label>
                    <div className="applications-radio-group">
                      <label className={`applications-radio-option ${leaveData.leaveSubType === 'annual' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="leaveSubType"
                          value="annual"
                          checked={leaveData.leaveSubType === 'annual'}
                          onChange={handleLeaveChange}
                        />
                        <span className="applications-radio-label">Annual Leave (30 days/year)</span>
                      </label>
                      <label className={`applications-radio-option ${leaveData.leaveSubType === 'monthly' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="leaveSubType"
                          value="monthly"
                          checked={leaveData.leaveSubType === 'monthly'}
                          onChange={handleLeaveChange}
                        />
                        <span className="applications-radio-label">Monthly Leave (1 day/month)</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="applications-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={leaveData.startDate}
                    onChange={handleLeaveChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {leaveData.leaveType === 'paid' && leaveData.leaveSubType === 'annual' && (
                  <div className="applications-form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={leaveData.endDate}
                      onChange={handleLeaveChange}
                      min={leaveData.startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                    <span className="applications-form-hint">
                      Automatically calculated as 30 days from start date
                    </span>
                  </div>
                )}

                {leaveData.leaveType === 'paid' && (leaveData.startDate &&
                  (leaveData.leaveSubType === 'monthly' || leaveData.endDate)) && (
                    <div className="applications-availability">
                      <div className="applications-availability-header">
                        <h4>Availability Check</h4>
                      </div>
                      {isChecking ? (
                        <div className="applications-loading">
                          <div className="applications-spinner"></div>
                          <span>Checking availability...</span>
                        </div>
                      ) : availabilityInfo && (
                        <div className={`applications-availability-result ${availabilityInfo.available ? 'success' : 'error'}`}>
                          <div className="applications-availability-status">
                            <span className="applications-availability-icon">
                              {availabilityInfo.available ? '✅' : '❌'}
                            </span>
                            <strong>{availabilityInfo.message}</strong>
                          </div>

                          {availabilityInfo.details && (
                            <div className="applications-availability-details">
                              <div className="applications-availability-row">
                                <span className="applications-availability-label">Requested Days:</span>
                                <span className="applications-availability-value">{availabilityInfo.leaveDays} days</span>
                              </div>

                              {availabilityInfo.details.annual && (
                                <div className="applications-availability-section">
                                  <h5>Annual Leave Check</h5>
                                  <div className="applications-availability-row">
                                    <span className="applications-availability-label">Available:</span>
                                    <span className={`applications-availability-value ${availabilityInfo.details.annual.available >= availabilityInfo.leaveDays ? 'positive' : 'negative'}`}>
                                      {availabilityInfo.details.annual.available} / {availabilityInfo.details.annual.total} days
                                    </span>
                                  </div>
                                </div>
                              )}

                              {availabilityInfo.details.monthly && (
                                <div className="applications-availability-section">
                                  <h5>Monthly Leave Check</h5>
                                  <div className="applications-availability-row">
                                    <span className="applications-availability-label">Available:</span>
                                    <span className={`applications-availability-value ${availabilityInfo.details.monthly.available >= availabilityInfo.leaveDays ? 'positive' : 'negative'}`}>
                                      {availabilityInfo.details.monthly.available} / {availabilityInfo.details.monthly.total} days
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                <div className="applications-form-group">
                  <label>Reason</label>
                  <textarea
                    name="reason"
                    value={leaveData.reason}
                    onChange={handleLeaveChange}
                    placeholder="Please provide the reason for your leave..."
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="applications-form-section">
                <div className="applications-form-group">
                  <label>Loan Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={loanData.amount}
                    onChange={handleLoanChange}
                    min="1"
                    placeholder="Enter loan amount"
                    required
                  />
                </div>

                <div className="applications-form-group">
                  <label>Repayment Months</label>
                  <input
                    type="number"
                    name="repaymentMonths"
                    value={loanData.repaymentMonths}
                    onChange={handleLoanChange}
                    min="1"
                    max="24"
                    required
                  />
                </div>

                <div className="applications-form-group">
                  <label>Purpose</label>
                  <textarea
                    name="purpose"
                    value={loanData.purpose}
                    onChange={handleLoanChange}
                    placeholder="Please provide the purpose of the loan..."
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (availabilityInfo && !availabilityInfo.available)}
              className="applications-submit"
            >
              {isSubmitting ? (
                <>
                  <span className="applications-spinner"></span>
                  Submitting...
                </>
              ) : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Applications;