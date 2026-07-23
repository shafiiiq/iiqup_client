import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, User, Calendar, DollarSign, FileText, Users } from 'lucide-react';
import { API_URI } from '../../constants';
import './ApplicationsList.css';
import { Link } from 'react-router';
import { apiRequest } from '../../utils/api';

const ApplicationsList = () => {
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [activeFilter, setActiveFilter] = useState('pending');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusChangeData, setStatusChangeData] = useState({
        status: '',
        rejectedReason: '',
        adminComments: ''
    });
    const [processingStatus, setProcessingStatus] = useState(false);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            setLastUpdated(`Last updated: ${timeString}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeFilter === 'all') {
            setFilteredApplications(applications);
        } else {
            const filtered = applications.filter(app =>
                app.status?.toLowerCase() === activeFilter.toLowerCase()
            );
            setFilteredApplications(filtered);
        }
    }, [applications, activeFilter]);

    const fetchApplications = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            setLoading(!showRefresh);

            const response = await apiRequest(`${API_URI}/applications/get-all-requests`);
            if (!response.ok) throw new Error('Failed to fetch applications');

            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Failed to fetch applications');

            const data = result.data;
            if (!Array.isArray(data)) throw new Error('Invalid data format: expected array');

            const sortedApplications = [...data].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setApplications(sortedApplications);
            setLoading(false);
            setRefreshing(false);
        } catch (err) {
            setError(err.message || 'Failed to fetch applications');
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchApplications();
        const refreshInterval = setInterval(() => {
            fetchApplications(true);
        }, 30000);
        return () => clearInterval(refreshInterval);
    }, []);

    const handleRefresh = () => {
        fetchApplications(true);
    };

    const handleFilterClick = (filter) => {
        setActiveFilter(filter);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'pending': return '#f59e0b';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return <CheckCircle size={16} />;
            case 'rejected': return <XCircle size={16} />;
            case 'pending': return <Clock size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getTypeIcon = (type) => {
        return type === 'leave' ? <Calendar size={16} /> : <DollarSign size={16} />;
    };

    const openStatusModal = (application) => {
        setSelectedApplication(application);
        setStatusChangeData({
            status: application.status,
            rejectedReason: application.rejectedReason || '',
            adminComments: application.adminComments || ''
        });
        setShowStatusModal(true);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setSelectedApplication(null);
        setStatusChangeData({
            status: '',
            rejectedReason: '',
            adminComments: ''
        });
    };

    const handleStatusChange = async () => {
        if (!selectedApplication || !statusChangeData.status) return;

        const userDataString = localStorage.getItem('user');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            if (userData && userData._id) {
                setUserId(userData._id);
            }
        }

        try {
            setProcessingStatus(true);
            const response = await apiRequest(`${API_URI}/applications/change-status/${selectedApplication._id}`,
                'PUT',
                {
                    status: statusChangeData.status,
                    rejectedReason: statusChangeData.rejectedReason,
                    adminComments: statusChangeData.adminComments,
                    approvedBy: userId
                }
            );

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to update status');
            }

            setApplications(prev =>
                prev.map(app =>
                    app._id === selectedApplication._id
                        ? { ...app, ...result.data }
                        : app
                )
            );

            closeStatusModal();
            setUserId(null);
        } catch (err) {
            setError(err.message || 'Failed to update status');
        } finally {
            setProcessingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="app-manager-container">
                <div className="app-loading-state">
                    <div className="app-loading-spinner"></div>
                    <h2>Loading Applications Dashboard...</h2>
                    <p>Fetching application data from all systems</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-manager-container">
                <div className="app-error-state">
                    <AlertTriangle size={48} />
                    <h2>Applications Dashboard Error</h2>
                    <p>{error}</p>
                    <button onClick={() => fetchApplications()} className="app-retry-btn">
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!applications.length) {
        return (
            <div className="app-manager-container">
                <div className="app-empty-state">
                    <div className="app-empty-content">
                        <FileText size={48} />
                        <h2>No Applications Found</h2>
                        <p>There are currently no applications in the system</p>
                        <button onClick={() => fetchApplications()} className="app-refresh-btn">
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-manager-container">
            <div className="app-summary-header">
                <div className="app-summary-content">
                    <Link to="/dashboard">
                        <button className={`app-refresh-btn ${refreshing ? 'is-refreshing' : ''}`}>
                            Return to Dashboard
                        </button>
                    </Link>
                    <div className="app-update-info">
                        <span>{lastUpdated}</span>
                        <span>Showing {filteredApplications.length} of {applications.length} applications</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={`app-refresh-btn ${refreshing ? 'is-refreshing' : ''}`}
                    >
                        <RefreshCw size={16} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="app-main-header">
                <div className="app-header-content">
                    <div>
                        <h1 className="app-title">Applications Management</h1>
                        <p className="app-subtitle">
                            HR Dashboard - Leave & Loan Applications
                            {activeFilter !== 'all' && (
                                <span className="app-filter-tag"> | Filtered by: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</span>
                            )}
                        </p>
                    </div>
                    {activeFilter !== 'all' && (
                        <button
                            onClick={() => handleFilterClick('all')}
                            className="app-clear-filter"
                        >
                            Show All Applications
                        </button>
                    )}
                </div>
            </div>

            <div className="app-stats-container">
                <div
                    className={`app-stat-card ${activeFilter === 'pending' ? 'is-active' : ''}`}
                    onClick={() => handleFilterClick('pending')}
                >
                    <div className="app-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="app-stat-details">
                        <span className="app-stat-value">
                            {applications.filter(a => a.status?.toLowerCase() === 'pending').length}
                        </span>
                        <span className="app-stat-label">Pending</span>
                    </div>
                </div>
                <div
                    className={`app-stat-card ${activeFilter === 'approved' ? 'is-active' : ''}`}
                    onClick={() => handleFilterClick('approved')}
                >
                    <div className="app-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="app-stat-details">
                        <span className="app-stat-value">
                            {applications.filter(a => a.status?.toLowerCase() === 'approved').length}
                        </span>
                        <span className="app-stat-label">Approved</span>
                    </div>
                </div>
                <div
                    className={`app-stat-card ${activeFilter === 'rejected' ? 'is-active' : ''}`}
                    onClick={() => handleFilterClick('rejected')}
                >
                    <div className="app-stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        <XCircle size={24} />
                    </div>
                    <div className="app-stat-details">
                        <span className="app-stat-value">
                            {applications.filter(a => a.status?.toLowerCase() === 'rejected').length}
                        </span>
                        <span className="app-stat-label">Rejected</span>
                    </div>
                </div>
                <div
                    className={`app-stat-card ${activeFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => handleFilterClick('all')}
                >
                    <div className="app-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                        <Users size={24} />
                    </div>
                    <div className="app-stat-details">
                        <span className="app-stat-value">
                            {applications.length}
                        </span>
                        <span className="app-stat-label">Total</span>
                    </div>
                </div>
            </div>

            <div className="app-list-grid">
                {filteredApplications.map((application, applicationIndex) => {
                    const statusColor = getStatusColor(application.status);
                    const statusIcon = getStatusIcon(application.status);
                    const typeIcon = getTypeIcon(application.type);

                    return (
                        <div key={application._id || applicationIndex} className="app-card-wrapper">
                            <div className="app-card">
                                <div className="app-card-head" style={{ borderBottom: `3px solid ${statusColor}` }}>
                                    <div className="app-card-title-area">
                                        <div className="app-type-label">
                                            {typeIcon}
                                            <span>{application.type?.charAt(0).toUpperCase() + application.type?.slice(1)} Application</span>
                                        </div>
                                        <div className="app-status-label" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                                            {statusIcon}
                                            <span>{application.status || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="app-meta-info">
                                        <span className="app-date-info">
                                            Applied on {formatDate(application.createdAt)}
                                        </span>
                                        {application.approvedAt && (
                                            <span className="app-date-info">
                                                Approved: {formatDate(application.approvedAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="app-card-body">
                                    <div className="app-details-section">
                                        <div className="app-user-info">
                                            <div className="app-user-avatar">
                                                <User size={24} />
                                            </div>
                                            <div className="app-user-details">
                                                <h3>{application.userId?.name || 'Unknown User'}</h3>
                                                <p>{application.userId?.email || 'No email'}</p>
                                                {application.userId?.department && (
                                                    <p className="app-user-dept">{application.userId.department}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="app-info-grid">
                                            {application.type === 'leave' ? (
                                                <>
                                                    <div className="app-info-item">
                                                        <strong>Leave Type:</strong>
                                                        <span className={`app-leave-type ${application.leaveType}`}>
                                                            {application.leaveType}
                                                        </span>
                                                    </div>
                                                    {application.leaveSubType && (
                                                        <div className="app-info-item">
                                                            <strong>Sub Type:</strong>
                                                            <span>{application.leaveSubType}</span>
                                                        </div>
                                                    )}
                                                    <div className="app-info-item">
                                                        <strong>Start Date:</strong>
                                                        <span>{formatDateOnly(application.startDate)}</span>
                                                    </div>
                                                    {application.endDate && application.startDate !== application.endDate && (
                                                        <div className="app-info-item">
                                                            <strong>End Date:</strong>
                                                            <span>{formatDateOnly(application.endDate)}</span>
                                                        </div>
                                                    )}
                                                    <div className="app-info-item">
                                                        <strong>Days:</strong>
                                                        <span>{application.leaveDays || 1} day(s)</span>
                                                    </div>
                                                    {application.priority && application.priority !== 'normal' && (
                                                        <div className="app-info-item">
                                                            <strong>Priority:</strong>
                                                            <span className={`app-priority ${application.priority}`}>
                                                                {application.priority}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="app-info-item">
                                                        <strong>Amount:</strong>
                                                        <span className="app-loan-amt">${application.amount?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="app-info-item">
                                                        <strong>Repayment:</strong>
                                                        <span>{application.repaymentMonths} months</span>
                                                    </div>
                                                    <div className="app-info-item">
                                                        <strong>Purpose:</strong>
                                                        <span>{application.purpose}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {(application.reason || application.purpose) && (
                                            <div className="app-description">
                                                <h4>Details</h4>
                                                <p>{application.reason || application.purpose}</p>
                                            </div>
                                        )}

                                        {application.adminComments && (
                                            <div className="app-admin-notes">
                                                <h4>Admin Comments</h4>
                                                <p>{application.adminComments}</p>
                                            </div>
                                        )}

                                        {application.rejectedReason && (
                                            <div className="app-rejection-note">
                                                <h4>Rejection Reason</h4>
                                                <p>{application.rejectedReason}</p>
                                            </div>
                                        )}

                                        {application.approvedBy && (
                                            <div className="app-approver-info">
                                                <h4>Approved By</h4>
                                                <p>{application.approvedBy.name} ({application.approvedBy.email})</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="app-actions-area">
                                        <button
                                            onClick={() => openStatusModal(application)}
                                            className="app-action-btn primary"
                                            disabled={processingStatus}
                                        >
                                            <FileText size={16} />
                                            Manage Status
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredApplications.length === 0 && applications.length > 0 && (
                <div className="app-no-results">
                    <FileText size={48} />
                    <h3>No {activeFilter} applications found</h3>
                    <p>Try selecting a different filter or view all applications</p>
                    <button onClick={() => handleFilterClick('all')} className="app-action-btn primary">
                        Show All Applications
                    </button>
                </div>
            )}

            {showStatusModal && selectedApplication && (
                <div className="app-modal-overlay">
                    <div className="app-status-modal">
                        <div className="app-modal-head">
                            <h3>Manage Application Status</h3>
                            <button onClick={closeStatusModal} className="app-modal-close">×</button>
                        </div>

                        <div className="app-modal-content">
                            <div className="app-modal-summary">
                                <h4>{selectedApplication.userId?.name} - {selectedApplication.type} Application</h4>
                                <p>Applied on {formatDate(selectedApplication.createdAt)}</p>
                            </div>

                            <div className="app-form-group">
                                <label>Status</label>
                                <select
                                    value={statusChangeData.status}
                                    onChange={(e) => setStatusChangeData(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            {statusChangeData.status === 'rejected' && (
                                <div className="app-form-group">
                                    <label>Rejection Reason *</label>
                                    <textarea
                                        value={statusChangeData.rejectedReason}
                                        onChange={(e) => setStatusChangeData(prev => ({ ...prev, rejectedReason: e.target.value }))}
                                        placeholder="Please provide a reason for rejection..."
                                        rows={3}
                                        required
                                    />
                                </div>
                            )}

                            <div className="app-form-group">
                                <label>Admin Comments</label>
                                <textarea
                                    value={statusChangeData.adminComments}
                                    onChange={(e) => setStatusChangeData(prev => ({ ...prev, adminComments: e.target.value }))}
                                    placeholder="Optional comments..."
                                    rows={3}
                                />
                            </div>

                            <div className="app-modal-actions">
                                <button onClick={closeStatusModal} className="app-action-btn secondary">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusChange}
                                    className="app-action-btn primary"
                                    disabled={processingStatus || (statusChangeData.status === 'rejected' && !statusChangeData.rejectedReason)}
                                >
                                    {processingStatus ? 'Processing...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationsList;