import React, { useState, useEffect } from 'react';
import './OperationsActivities.css';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import Button from '../../Common/Button/Button';
import Input from '../../Common/Input/Input';
import Loader from '../../Common/Loader/Loader';

function OperationsActivities() {
    const [activeTab, setActiveTab] = useState('recent');
    const [mobilizations, setMobilizations] = useState([]);
    const [replacements, setReplacements] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState({});
    const [specificTime, setSpecificTime] = useState('');
    const [timeRange, setTimeRange] = useState({ start: '', end: '' });
    const [singleDate, setSingleDate] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedMonthRange, setSelectedMonthRange] = useState('1');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchActivitiesWithFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPeriod, selectedMonthRange]);

    const fetchActivitiesWithFilter = async (filterType = selectedPeriod, startDate = null, endDate = null, months = null) => {
        setIsLoading(true);
        try {
            let mobUrl = `${END_POINT}/equipments/filtered-mobilizations?filterType=${filterType}`;
            let repUrl = `${END_POINT}/equipments/filtered-replacements?filterType=${filterType}`;

            if (specificTime) {
                mobUrl += `&specificTime=${specificTime}`;
                repUrl += `&specificTime=${specificTime}`;
            } else if (timeRange.start && timeRange.end) {
                mobUrl += `&startTime=${timeRange.start}&endTime=${timeRange.end}`;
                repUrl += `&startTime=${timeRange.start}&endTime=${timeRange.end}`;
            }

            if (filterType === 'custom' && startDate && endDate) {
                const formatForAPI = (date) => {
                    const [year, month, day] = date.split('-');
                    return `${day}-${month}-${year}`;
                };
                mobUrl += `&startDate=${formatForAPI(startDate)}&endDate=${formatForAPI(endDate)}`;
                repUrl += `&startDate=${formatForAPI(startDate)}&endDate=${formatForAPI(endDate)}`;
            } else if (filterType === 'months' && months) {
                mobUrl += `&months=${months}`;
                repUrl += `&months=${months}`;
            }

            const [mobResponse, repResponse] = await Promise.all([
                apiRequest(mobUrl, 'GET'),
                apiRequest(repUrl, 'GET')
            ]);

            const mobData = await mobResponse.json();
            const repData = await repResponse.json();

            let processedMobilizations = [];
            let processedReplacements = [];

            if (mobData.ok && mobData.data) {
                processedMobilizations = await Promise.all(
                    mobData.data.map(async (item) => {
                        let equipmentImages = [];
                        if (item.equipmentImages && item.equipmentImages.length > 0) {
                            equipmentImages = await Promise.all(
                                item.equipmentImages.map(async (img) => {
                                    const s3Url = await getMediaUrl(img.path);
                                    return { ...img, s3Url: s3Url || `${END_POINT}/${img.path}`, url: img.path };
                                })
                            );
                        }

                        let operatorProfileUrl = null;
                        if (item.operatorDetails?.profilePic?.filePath) {
                            operatorProfileUrl = await getOperatorProfileUrl(item.operatorDetails.profilePic.filePath);
                        }

                        // resolve operator profile pics for multi-operator records
                        let operatorsWithProfiles = [];
                        if (item.operators && item.operators.length > 0) {
                            operatorsWithProfiles = await Promise.all(
                                item.operators.map(async (op) => {
                                    let profileUrl = null;
                                    if (op.profilePic?.filePath) {
                                        profileUrl = await getOperatorProfileUrl(op.profilePic.filePath);
                                    }
                                    return { ...op, profileUrl };
                                })
                            );
                        }

                        return { ...item, equipmentImages, operatorProfileUrl, operatorsWithProfiles };
                    })
                );
                setMobilizations(processedMobilizations);
            }

            if (repData.ok && repData.data) {
                processedReplacements = await Promise.all(
                    repData.data.map(async (item) => {
                        let currentImages = [];
                        let replacedImages = [];

                        if (item.currentEquipmentDetails?.images?.length > 0) {
                            currentImages = await Promise.all(
                                item.currentEquipmentDetails.images.map(async (img) => {
                                    const s3Url = await getMediaUrl(img.path);
                                    return { ...img, s3Url: s3Url || `${END_POINT}/${img.path}`, url: img.path };
                                })
                            );
                        }

                        if (item.replacedEquipmentDetails?.images?.length > 0) {
                            replacedImages = await Promise.all(
                                item.replacedEquipmentDetails.images.map(async (img) => {
                                    const s3Url = await getMediaUrl(img.path);
                                    return { ...img, s3Url: s3Url || `${END_POINT}/${img.path}`, url: img.path };
                                })
                            );
                        }

                        let currentOperatorProfileUrl = null;
                        let replacedOperatorProfileUrl = null;
                        if (item.currentOperatorDetails?.profilePic?.filePath) {
                            currentOperatorProfileUrl = await getOperatorProfileUrl(item.currentOperatorDetails.profilePic.filePath);
                        }
                        if (item.replacedOperatorDetails?.profilePic?.filePath) {
                            replacedOperatorProfileUrl = await getOperatorProfileUrl(item.replacedOperatorDetails.profilePic.filePath);
                        }

                        return {
                            ...item,
                            currentEquipmentDetails: { ...item.currentEquipmentDetails, images: currentImages },
                            replacedEquipmentDetails: item.replacedEquipmentDetails
                                ? { ...item.replacedEquipmentDetails, images: replacedImages }
                                : null,
                            currentOperatorProfileUrl,
                            replacedOperatorProfileUrl
                        };
                    })
                );
                setReplacements(processedReplacements);
            }

            const combined = [
                ...processedMobilizations.map(item => ({ ...item, activityType: 'mobilization' })),
                ...processedReplacements.map(item => ({ ...item, activityType: 'replacement' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);

            setRecentActivities(combined);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSingleDateFilter = () => {
        if (singleDate) {
            const formatForAPI = (date) => {
                const [year, month, day] = date.split('-');
                return `${day}-${month}-${year}`;
            };
            fetchActivitiesWithFilter('single', formatForAPI(singleDate));
        }
    };

    const handleSpecificTimeFilter = () => {
        if (specificTime) fetchActivitiesWithFilter(selectedPeriod);
    };

    const handleTimeRangeFilter = () => {
        if (timeRange.start && timeRange.end) fetchActivitiesWithFilter(selectedPeriod);
    };

    const clearTimeFilters = () => {
        setSpecificTime('');
        setTimeRange({ start: '', end: '' });
        fetchActivitiesWithFilter(selectedPeriod);
    };

    const getMediaUrl = async (filePath) => {
        if (!filePath) return '';
        try {
            const body = { key: filePath, isLong: true };
            const s3response = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', body);
            const s3URL = await s3response.json();
            return s3URL.dataUrl;
        } catch (error) {
            console.error('Error getting media URL:', error);
            return '';
        }
    };

    const getOperatorProfileUrl = async (filePath) => {
        if (!filePath) return null;
        try {
            const body = { key: filePath, isLong: false };
            const s3response = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', body);
            const s3URL = await s3response.json();
            return s3URL.dataUrl;
        } catch (error) {
            console.error('Error getting operator profile URL:', error);
            return null;
        }
    };

    const handlePeriodChange = (e) => setSelectedPeriod(e.target.value);

    const handleMonthsFilter = (months) => {
        setSelectedMonthRange(months);
        fetchActivitiesWithFilter('months', null, null, months);
    };

    const handleDateRangeFilter = () => {
        if (dateRange.start && dateRange.end) {
            fetchActivitiesWithFilter('custom', dateRange.start, dateRange.end);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;
    };

    const formatTime = (timeString) => timeString || 'N/A';

    const getInitials = (name) => {
        if (!name) return 'OP';
        const names = name.split(' ');
        return names.length === 1
            ? names[0].charAt(0).toUpperCase()
            : (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const getStatusColor = (status) => {
        const colors = {
            idle: '#F59E0B',
            loading: '#df29c0',
            going: '#3B82F6',
            active: '#10B981',
            maintenance: '#EF4444',
            leased: '#6366f1'
        };
        return colors[status?.toLowerCase()] || '#6B7280';
    };

    const getStatusIcon = (status) => {
        const icons = {
            idle: 'key_off',
            loading: 'moving',
            going: 'delivery_truck_speed',
            active: 'key',
            maintenance: 'handyman',
            leased: 'handshake'
        };
        return icons[status?.toLowerCase()] || 'help';
    };

    const renderImageSlider = (images, key, className = '') => {
        if (!images || images.length === 0) return null;
        const currentIndex = activeImageIndex[key] || 0;
        return (
            <div className={`img-slider ${className}`}>
                <div className="slider-images">
                    {images.map((img, index) => (
                        <img
                            key={index}
                            src={img.s3Url || img.url}
                            alt={`img-${index + 1}`}
                            className={`slider-image ${index === currentIndex ? 'active' : ''}`}
                            loading="lazy"
                        />
                    ))}
                </div>
                {images.length > 1 && (
                    <div className="slider-dots">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setActiveImageIndex(prev => ({ ...prev, [key]: index }))}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderOperatorAvatar = (profileUrl, name, size = 'sm') => {
        return profileUrl ? (
            <img
                src={profileUrl}
                alt={name}
                className={`op-avatar op-avatar-${size}`}
            />
        ) : (
            <div className={`op-initials op-initials-${size}`}>{getInitials(name)}</div>
        );
    };

    // ─────────────────────────────────────────────────────────────
    // STATUS CHANGE CARD
    // ─────────────────────────────────────────────────────────────
    const renderStatusChangeCard = (item) => {
        const eq = item.equipmentDetails || {};
        const hasImages = item.equipmentImages && item.equipmentImages.length > 0;

        return (
            <div className="activity-card status-change-card" key={item._id}>
                {/* Left: Image */}
                {hasImages && (
                    <div className="card-image-side">
                        {renderImageSlider(item.equipmentImages, item.regNo, 'side-slider')}
                    </div>
                )}

                {/* Right: Content */}
                <div className="activity-card-content">
                    <div className="activity-card-header">
                        <div className="activity-type-badge status-change">
                            <span className="material-symbols-rounded">sync</span>
                            <span>Status Changed</span>
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>

                    <div className="activity-card-body">
                        {/* Equipment Info */}
                        <div className="eq-info-row">
                            <h3 className="equipment-title">
                                {eq.machine || item.machine}
                                <span className="eq-reg"> — {eq.regNo || item.regNo}</span>
                            </h3>
                            {eq.brand && <p className="equipment-brand">{eq.brand} · {eq.year}{eq.company ? ` · ${eq.company}` : ''}</p>}
                            {eq.hired && eq.hiredFrom && <p className="hired-tag">Hired from: {eq.hiredFrom}</p>}
                        </div>

                        {/* Status Flow */}
                        <div className="activity-flow status-change-flow">
                            <div className="flow-item from-status">
                                <div className="status-indicator" style={{ borderColor: getStatusColor(item.previousStatus) }}>
                                    <span className="material-symbols-rounded" style={{ color: getStatusColor(item.previousStatus) }}>
                                        {getStatusIcon(item.previousStatus)}
                                    </span>
                                </div>
                                <span className="flow-label">From</span>
                                <span className="flow-value" style={{ color: getStatusColor(item.previousStatus) }}>
                                    {item.previousStatus?.toUpperCase() || 'N/A'}
                                </span>
                            </div>
                            <div className="flow-arrow">
                                <span className="material-symbols-rounded">arrow_forward</span>
                            </div>
                            <div className="flow-item to-status">
                                <div className="status-indicator" style={{ borderColor: getStatusColor(item.newStatus) }}>
                                    <span className="material-symbols-rounded" style={{ color: getStatusColor(item.newStatus) }}>
                                        {getStatusIcon(item.newStatus)}
                                    </span>
                                </div>
                                <span className="flow-label">To</span>
                                <span className="flow-value" style={{ color: getStatusColor(item.newStatus) }}>
                                    {item.newStatus?.toUpperCase() || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Extra Details */}
                        <div className="details-grid">
                            {item.site && (
                                <div className="detail-row">
                                    <span className="detail-label">Site</span>
                                    <span className="detail-value">{item.site}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="detail-label">Month / Year</span>
                                <span className="detail-value">{item.month} / {item.year}</span>
                            </div>
                            {eq.rentRate && (
                                <div className="detail-row">
                                    <span className="detail-label">{eq.hired ? 'Hire Rate' : 'Working Rate'}</span>
                                    <span className="detail-value">
                                        {eq.rentRate.basis?.charAt(0).toUpperCase() + eq.rentRate.basis?.slice(1)}
                                        {eq.rentRate.rate ? ` — ${eq.rentRate.rate} ${eq.rentRate.currency || 'QAR'}` : ''}
                                    </span>
                                </div>
                            )}
                            {eq.location && (
                                <div className="detail-row">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value">{eq.location}</span>
                                </div>
                            )}
                        </div>

                        {item.remarks && (
                            <div className="remarks-box">
                                <span className="material-symbols-rounded">comment</span>
                                <span>{item.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────
    // MOBILIZATION CARD
    // ─────────────────────────────────────────────────────────────
    const renderMobilizationCard = (item) => {
        const eq = item.equipmentDetails || {};
        const isDemob = item.action === 'demobilized';
        const isOneDayMob = item.isOneDayMob;
        const hasImages = item.equipmentImages && item.equipmentImages.length > 0;
        const operators = (item.operatorsWithProfiles || item.operators || []).filter(o => o.operatorName);

        return (
            <div className={`activity-card mobilization-card ${isDemob ? 'demob-card' : ''} ${isOneDayMob ? 'oneday-card' : ''}`} key={item._id}>
                {/* Left: Image */}
                {hasImages && (
                    <div className="card-image-side">
                        {renderImageSlider(item.equipmentImages, item.regNo, 'side-slider')}
                    </div>
                )}

                {/* Right: Content */}
                <div className="activity-card-content">
                    <div className="activity-card-header">
                        <div className="header-badges">
                            <div className={`activity-type-badge ${isDemob ? 'demobilization' : 'mobilization'}`}>
                                <span className="material-symbols-rounded">{isDemob ? 'location_off' : 'location_on'}</span>
                                <span>{isDemob ? 'Demobilized' : isOneDayMob ? 'One-Day Mob' : 'Mobilized'}</span>
                            </div>
                            {isOneDayMob && !isDemob && (
                                <div className="activity-type-badge oneday">
                                    <span className="material-symbols-rounded">schedule</span>
                                    <span>1 Day</span>
                                </div>
                            )}
                            {item.deployType === 'company' && !isDemob && (
                                <div className="activity-type-badge leased">
                                    <span className="material-symbols-rounded">handshake</span>
                                    <span>Leased</span>
                                </div>
                            )}
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>

                    <div className="activity-card-body">
                        {/* Equipment Info */}
                        <div className="eq-info-row">
                            <div className="eq-info-left">
                                <h3 className="equipment-title">
                                    {eq.machine || item.machine}
                                    <span className="eq-reg"> — {eq.regNo || item.regNo}</span>
                                </h3>
                                {eq.brand && <p className="equipment-brand">{eq.brand} · {eq.year}{eq.company ? ` · ${eq.company}` : ''}</p>}
                                {eq.hired && eq.hiredFrom && <p className="hired-tag">Hired from: {eq.hiredFrom}</p>}
                            </div>
                            <span className={`status-badge status-${item.status?.toLowerCase()}`}>{item.status}</span>
                        </div>

                        {/* Mob/Demob Flow */}
                        <div className="activity-flow mobilization-flow">
                            <div className={`flow-item ${isDemob ? 'active-state' : 'idle-state'}`}>
                                <span className="material-symbols-rounded">{isDemob ? 'key' : 'key_off'}</span>
                                <span className="flow-label">{isDemob ? 'Active' : 'Idle'}</span>
                            </div>
                            <div className="flow-arrow">
                                <span className="material-symbols-rounded">arrow_forward</span>
                            </div>
                            <div className={`flow-item ${isDemob ? 'idle-state' : 'active-state'}`}>
                                <span className="material-symbols-rounded">{isDemob ? 'key_off' : 'key'}</span>
                                <span className="flow-label">{isDemob ? 'Idle' : 'Active'}</span>
                            </div>
                        </div>

                        {/* Deployment Details */}
                        <div className="section-block">
                            <p className="section-label">Deployment</p>
                            <div className="details-grid">
                                {item.deployType === 'company' && item.clientCompany ? (
                                    <div className="detail-row full">
                                        <span className="detail-label">Leased To (Company)</span>
                                        <span className="detail-value highlight">{item.clientCompany}</span>
                                    </div>
                                ) : item.site ? (
                                    <div className="detail-row full">
                                        <span className="detail-label">{isDemob ? 'Removed From Site' : 'Deployed To Site'}</span>
                                        <span className="detail-value highlight">{item.site}</span>
                                    </div>
                                ) : null}
                                {eq.location && (
                                    <div className="detail-row">
                                        <span className="detail-label">Location</span>
                                        <span className="detail-value">{eq.location}</span>
                                    </div>
                                )}
                                {eq.rentRate && (
                                    <div className="detail-row">
                                        <span className="detail-label">{eq.hired ? 'Hire Rate' : 'Working Rate'}</span>
                                        <span className="detail-value">
                                            {eq.rentRate.basis?.charAt(0).toUpperCase() + eq.rentRate.basis?.slice(1)}
                                            {eq.rentRate.rate ? ` — ${eq.rentRate.rate} ${eq.rentRate.currency || 'QAR'}` : ''}
                                        </span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Month / Year</span>
                                    <span className="detail-value">{item.month} / {item.year}</span>
                                </div>
                                {item.deployType && (
                                    <div className="detail-row">
                                        <span className="detail-label">Deploy Type</span>
                                        <span className="detail-value">{item.deployType === 'company' ? 'Company (Lease)' : 'Site'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Multi-Operator Section */}
                        {operators.length > 0 && (
                            <div className="section-block">
                                <p className="section-label">Operators ({operators.length})</p>
                                <div className="operators-list">
                                    {operators.map((op, i) => (
                                        <div className="operator-row" key={i}>
                                            {renderOperatorAvatar(op.profileUrl, op.operatorName, 'sm')}
                                            <div className="operator-info">
                                                <span className="op-name">{op.operatorName}</span>
                                                {op.shiftName && (
                                                    <span className="op-shift">
                                                        {op.shiftName}
                                                        {op.shiftStart ? ` · ${op.shiftStart}${op.shiftEnd ? ' – ' + op.shiftEnd : ''}` : ''}
                                                    </span>
                                                )}
                                                {!op.shiftName && op.shiftStart && (
                                                    <span className="op-shift">{op.shiftStart}{op.shiftEnd ? ' – ' + op.shiftEnd : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Single operator fallback (legacy) */}
                        {operators.length === 0 && (item.withOperator || isDemob) && item.operatorDetails && (
                            <div className="section-block">
                                <p className="section-label">{isDemob ? 'Previous Operator' : 'Operator'}</p>
                                <div className="operator-row">
                                    {renderOperatorAvatar(item.operatorProfileUrl, item.operatorDetails.name, 'sm')}
                                    <div className="operator-info">
                                        <span className="op-name">{item.operatorDetails.name}</span>
                                        {item.operatorDetails.contactNo && (
                                            <span className="op-phone">{item.operatorDetails.contactNo}</span>
                                        )}
                                        {item.operatorDetails.nationality && (
                                            <span className="op-shift">Nationality: {item.operatorDetails.nationality}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* One-Day Mob Demob Details */}
                        {isOneDayMob && item.demobDate && (
                            <div className="section-block oneday-demob-block">
                                <p className="section-label">Scheduled Demobilization</p>
                                <div className="details-grid">
                                    <div className="detail-row">
                                        <span className="detail-label">Demob Date</span>
                                        <span className="detail-value">{formatDate(item.demobDate)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Demob Time</span>
                                        <span className="detail-value">{formatTime(item.demobTime)}</span>
                                    </div>
                                    {item.demobRemarks && (
                                        <div className="detail-row full">
                                            <span className="detail-label">Demob Remarks</span>
                                            <span className="detail-value">{item.demobRemarks}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {item.remarks && (
                            <div className="remarks-box">
                                <span className="material-symbols-rounded">comment</span>
                                <span>{item.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────
    // REPLACEMENT CARD
    // ─────────────────────────────────────────────────────────────
    const renderReplacementCard = (item) => {
        if (item.type === 'operator') return renderOperatorReplacementCard(item);
        if (item.type === 'equipment') return renderEquipmentReplacementCard(item);
        if (item.type === 'site') return renderSiteReplacementCard(item);
        return null;
    };

    // ─── Operator Replacement ─────────────────────────────────────
    const renderOperatorReplacementCard = (item) => {
        const eq = item.currentEquipmentDetails || {};
        const hasImages = eq.images && eq.images.length > 0;
        const prevOps = item.previousOperators || [];

        return (
            <div className="activity-card mobilization-card operator-rep-card" key={item._id}>
                {/* Left: Image */}
                {hasImages && (
                    <div className="card-image-side">
                        {renderImageSlider(eq.images, `cur-${item.regNo}`, 'side-slider')}
                    </div>
                )}

                <div className="activity-card-content">
                    <div className="activity-card-header">
                        <div className="activity-type-badge replacement operator">
                            <span className="material-symbols-rounded">person_swap</span>
                            <span>{item.replaceAll ? 'All Operators Replaced' : 'Operator Replaced'}</span>
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>

                    <div className="activity-card-body">
                        {/* Equipment Info */}
                        <div className="eq-info-row">
                            <div className="eq-info-left">
                                <h3 className="equipment-title">
                                    {eq.machine || item.machine}
                                    <span className="eq-reg"> — {eq.regNo || item.regNo}</span>
                                </h3>
                                {eq.brand && <p className="equipment-brand">{eq.brand} · {eq.year}{eq.company ? ` · ${eq.company}` : ''}</p>}
                                {eq.hired && eq.hiredFrom && <p className="hired-tag">Hired from: {eq.hiredFrom}</p>}
                            </div>
                            <div className="eq-right-col">
                                <span className={`status-badge status-${item.status?.toLowerCase()}`}>{item.status}</span>
                                {eq.site && <span className="site-tag">{Array.isArray(eq.site) ? eq.site.at(-1) : eq.site}</span>}
                            </div>
                        </div>

                        {/* If replaceAll — show all previous operators */}
                        {item.replaceAll && prevOps.length > 0 && (
                            <div className="section-block">
                                <p className="section-label">Previous Operators (All Replaced)</p>
                                <div className="prev-ops-list">
                                    {prevOps.map((op, i) => (
                                        <div className="prev-op-row" key={i}>
                                            <div className="op-initials op-initials-xs">{getInitials(op.operatorName)}</div>
                                            <span className="prev-op-name">{op.operatorName || '—'}</span>
                                            {op.shiftName && <span className="prev-op-shift">{op.shiftName}</span>}
                                            {op.shiftStart && <span className="prev-op-shift">{op.shiftStart}{op.shiftEnd ? ' – ' + op.shiftEnd : ''}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Operator Flow */}
                        <div className="section-block">
                            <p className="section-label">Operator Change</p>
                            <div className="op-flow">
                                {/* From */}
                                <div className="op-flow-side from-side">
                                    <span className="op-dir-tag from-tag">From</span>
                                    {renderOperatorAvatar(item.currentOperatorProfileUrl, item.currentOperator, 'md')}
                                    <span className="op-flow-name">{item.replaceAll ? 'All operators' : (item.currentOperator || '—')}</span>
                                    {item.currentOperatorDetails?.contactNo && (
                                        <span className="op-flow-phone">{item.currentOperatorDetails.contactNo}</span>
                                    )}
                                    {item.currentOperatorDetails?.nationality && (
                                        <span className="op-flow-extra">Nationality: {item.currentOperatorDetails.nationality}</span>
                                    )}
                                    {!item.replaceAll && item.targetShiftName && item.targetShiftName !== 'ALL' && (
                                        <span className="op-flow-shift">Shift: {item.targetShiftName}</span>
                                    )}
                                </div>

                                <div className="flow-arrow-lg">
                                    <span className="material-symbols-rounded">arrow_forward</span>
                                </div>

                                {/* To */}
                                <div className="op-flow-side to-side">
                                    <span className="op-dir-tag to-tag">To</span>
                                    {renderOperatorAvatar(item.replacedOperatorProfileUrl, item.replacedOperator, 'md')}
                                    <span className="op-flow-name">{item.replacedOperator || '—'}</span>
                                    {item.replacedOperatorDetails?.contactNo && (
                                        <span className="op-flow-phone">{item.replacedOperatorDetails.contactNo}</span>
                                    )}
                                    {item.replacedOperatorDetails?.nationality && (
                                        <span className="op-flow-extra">Nationality: {item.replacedOperatorDetails.nationality}</span>
                                    )}
                                    {item.shiftName && (
                                        <span className="op-flow-shift">
                                            {item.shiftName}
                                            {item.shiftStart ? ` · ${item.shiftStart}${item.shiftEnd ? ' – ' + item.shiftEnd : ''}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Equipment Details */}
                        <div className="section-block">
                            <p className="section-label">Equipment Details</p>
                            <div className="details-grid">
                                {eq.company && (
                                    <div className="detail-row">
                                        <span className="detail-label">Company</span>
                                        <span className="detail-value">{eq.company}</span>
                                    </div>
                                )}
                                {eq.location && (
                                    <div className="detail-row">
                                        <span className="detail-label">Location</span>
                                        <span className="detail-value">{eq.location}</span>
                                    </div>
                                )}
                                {eq.rentRate && (
                                    <div className="detail-row">
                                        <span className="detail-label">{eq.hired ? 'Hire Rate' : 'Working Rate'}</span>
                                        <span className="detail-value">
                                            {eq.rentRate.basis?.charAt(0).toUpperCase() + eq.rentRate.basis?.slice(1)}
                                            {eq.rentRate.rate ? ` — ${eq.rentRate.rate} ${eq.rentRate.currency || 'QAR'}` : ''}
                                        </span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Month / Year</span>
                                    <span className="detail-value">{item.month} / {item.year}</span>
                                </div>
                                {item.replaceAll !== undefined && (
                                    <div className="detail-row">
                                        <span className="detail-label">Replace Type</span>
                                        <span className="detail-value">{item.replaceAll ? 'All operators' : 'Single shift'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {item.remarks && (
                            <div className="remarks-box">
                                <span className="material-symbols-rounded">comment</span>
                                <span>{item.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Equipment Replacement ────────────────────────────────────
    const renderEquipmentReplacementCard = (item) => {
        const cur = item.currentEquipmentDetails || {};
        const rep = item.replacedEquipmentDetails || {};
        const curImages = cur.images || [];
        const repImages = rep.images || [];

        return (
            <div className="activity-card equipment-rep-card" key={item._id}>
                <div className="activity-card-header">
                    <div className="activity-type-badge replacement equipment">
                        <span className="material-symbols-rounded">sync_alt</span>
                        <span>Equipment Replaced</span>
                    </div>
                    <div className="activity-date">
                        <span>{formatDate(item.date)}</span>
                        <span className="activity-time">{formatTime(item.time)}</span>
                    </div>
                </div>

                <div className="activity-card-body">
                    <div className="equipment-replacement-container">
                        {/* Outgoing Equipment */}
                        <div className="replacement-equipment-section">
                            <h4 className="section-title outgoing-title">
                                <span className="material-symbols-rounded">output</span>
                                Outgoing
                            </h4>
                            {curImages.length > 0 && (
                                <div className="equipment-image-slider">
                                    {renderImageSlider(curImages, `cur-${item.regNo}`)}
                                </div>
                            )}
                            <div className="equipment-info">
                                <h3>{cur.machine || item.machine} <span className="eq-reg-sm">— {cur.regNo || item.regNo}</span></h3>
                                {cur.brand && <p className="brand-year">{cur.brand} · {cur.year}</p>}
                                {cur.company && <p className="brand-year">Company: {cur.company}</p>}
                                {cur.hired && cur.hiredFrom && <p className="brand-year hired-tag-sm">Hired from: {cur.hiredFrom}</p>}
                                {cur.site && <p className="brand-year">Was at: {Array.isArray(cur.site) ? cur.site.at(-1) : cur.site}</p>}
                                {item.currentOperator && <p className="brand-year">Operator: {item.currentOperator}</p>}
                                {cur.rentRate && (
                                    <p className="brand-year">
                                        Rate: {cur.rentRate.basis?.charAt(0).toUpperCase() + cur.rentRate.basis?.slice(1)}
                                        {cur.rentRate.rate ? ` — ${cur.rentRate.rate} ${cur.rentRate.currency || 'QAR'}` : ''}
                                    </p>
                                )}
                                {cur.location && <p className="brand-year">Location: {cur.location}</p>}
                                <p className="brand-year going-to">
                                    {item.newSiteForReplaced ? `Goes to: ${item.newSiteForReplaced}` : 'Goes idle'}
                                </p>
                            </div>
                        </div>

                        <div className="replacement-arrow">
                            <span className="material-symbols-rounded">sync_alt</span>
                        </div>

                        {/* Incoming Equipment */}
                        <div className="replacement-equipment-section">
                            <h4 className="section-title incoming-title">
                                <span className="material-symbols-rounded">input</span>
                                Incoming
                            </h4>
                            {repImages.length > 0 && (
                                <div className="equipment-image-slider">
                                    {renderImageSlider(repImages, `rep-${rep.regNo}`)}
                                </div>
                            )}
                            <div className="equipment-info">
                                <h3>{rep.machine || '—'} <span className="eq-reg-sm">— {rep.regNo || '—'}</span></h3>
                                {rep.brand && <p className="brand-year">{rep.brand} · {rep.year}</p>}
                                {rep.company && <p className="brand-year">Company: {rep.company}</p>}
                                {rep.hired && rep.hiredFrom && <p className="brand-year hired-tag-sm">Hired from: {rep.hiredFrom}</p>}
                                {rep.site && <p className="brand-year">Was at: {Array.isArray(rep.site) ? rep.site.at(-1) : rep.site}</p>}
                                {cur.site && <p className="brand-year going-to">Now at: {Array.isArray(cur.site) ? cur.site.at(-1) : cur.site}</p>}
                                {rep.rentRate && (
                                    <p className="brand-year">
                                        Rate: {rep.rentRate.basis?.charAt(0).toUpperCase() + rep.rentRate.basis?.slice(1)}
                                        {rep.rentRate.rate ? ` — ${rep.rentRate.rate} ${rep.rentRate.currency || 'QAR'}` : ''}
                                    </p>
                                )}
                                {rep.location && <p className="brand-year">Location: {rep.location}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Extra details row */}
                    <div className="details-grid" style={{ marginTop: '12px' }}>
                        <div className="detail-row">
                            <span className="detail-label">Month / Year</span>
                            <span className="detail-value">{item.month} / {item.year}</span>
                        </div>
                        {item.currentOperator && (
                            <div className="detail-row">
                                <span className="detail-label">Operator</span>
                                <span className="detail-value">{item.currentOperator}</span>
                            </div>
                        )}
                        {item.newSiteForReplaced && (
                            <div className="detail-row">
                                <span className="detail-label">Outgoing Goes To</span>
                                <span className="detail-value">{item.newSiteForReplaced}</span>
                            </div>
                        )}
                    </div>

                    {item.remarks && (
                        <div className="remarks-box">
                            <span className="material-symbols-rounded">comment</span>
                            <span>{item.remarks}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─── Site Replacement ─────────────────────────────────────────
    const renderSiteReplacementCard = (item) => {
        const eq = item.currentEquipmentDetails || {};
        const hasImages = eq.images && eq.images.length > 0;

        return (
            <div className="activity-card mobilization-card site-rep-card" key={item._id}>
                {hasImages && (
                    <div className="card-image-side">
                        {renderImageSlider(eq.images, `site-${item.regNo}`, 'side-slider')}
                    </div>
                )}

                <div className="activity-card-content">
                    <div className="activity-card-header">
                        <div className="activity-type-badge replacement site">
                            <span className="material-symbols-rounded">swap_horiz</span>
                            <span>Site Replacement</span>
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>

                    <div className="activity-card-body">
                        <div className="eq-info-row">
                            <div className="eq-info-left">
                                <h3 className="equipment-title">
                                    {eq.machine || item.machine}
                                    <span className="eq-reg"> — {eq.regNo || item.regNo}</span>
                                </h3>
                                {eq.brand && <p className="equipment-brand">{eq.brand} · {eq.year}{eq.company ? ` · ${eq.company}` : ''}</p>}
                                {eq.hired && eq.hiredFrom && <p className="hired-tag">Hired from: {eq.hiredFrom}</p>}
                            </div>
                            <span className={`status-badge status-${item.status?.toLowerCase()}`}>{item.status}</span>
                        </div>

                        <div className="activity-flow replacement-flow">
                            <div className="flow-item from-item">
                                <span className="material-symbols-rounded">location_on</span>
                                <span className="flow-label">From Site</span>
                                <span className="flow-value">{item.currentSite || '—'}</span>
                            </div>
                            <div className="flow-arrow">
                                <span className="material-symbols-rounded">arrow_forward</span>
                            </div>
                            <div className="flow-item to-item">
                                <span className="material-symbols-rounded">add_location</span>
                                <span className="flow-label">To Site</span>
                                <span className="flow-value">{item.replacedSite || '—'}</span>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div className="detail-row">
                                <span className="detail-label">Month / Year</span>
                                <span className="detail-value">{item.month} / {item.year}</span>
                            </div>
                            {eq.rentRate && (
                                <div className="detail-row">
                                    <span className="detail-label">{eq.hired ? 'Hire Rate' : 'Working Rate'}</span>
                                    <span className="detail-value">
                                        {eq.rentRate.basis?.charAt(0).toUpperCase() + eq.rentRate.basis?.slice(1)}
                                        {eq.rentRate.rate ? ` — ${eq.rentRate.rate} ${eq.rentRate.currency || 'QAR'}` : ''}
                                    </span>
                                </div>
                            )}
                            {eq.location && (
                                <div className="detail-row">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value">{eq.location}</span>
                                </div>
                            )}
                        </div>

                        {item.remarks && (
                            <div className="remarks-box">
                                <span className="material-symbols-rounded">comment</span>
                                <span>{item.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderRecentActivity = (item) => {
        if (item.activityType === 'mobilization') {
            if (item.action === 'status_changed') return renderStatusChangeCard(item);
            return renderMobilizationCard(item);
        }
        return renderReplacementCard(item);
    };

    return (
        <div className="operations-activities-container">
            {/* Filter Controls Bar */}
            <div className="controls-bar">
                <div className="controls-row controls-row-main">
                    <Input
                        type="select"
                        value={selectedPeriod}
                        onChange={handlePeriodChange}
                        options={[
                            { value: 'daily', label: 'Today' },
                            { value: 'yesterday', label: 'Yesterday' },
                            { value: 'weekly', label: 'Last Week' },
                            { value: 'monthly', label: 'Last Month' },
                            { value: 'yearly', label: 'Last Year' }
                        ]}
                        colorScheme="violet-800"
                        variant="gradient"
                        font="md"
                        squircle="4xl"
                        width="140px"
                        height="38px"
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                        animation="none"
                        fontWeight="500"
                        inputPaddingInline="xl"
                    />
                    <Input
                        type="select"
                        value={selectedMonthRange}
                        onChange={(e) => handleMonthsFilter(e.target.value)}
                        options={[
                            { value: '1', label: '1 Month' },
                            { value: '2', label: '2 Months' },
                            { value: '3', label: '3 Months' },
                            { value: '6', label: '6 Months' },
                            { value: '12', label: '12 Months' }
                        ]}
                        colorScheme="red-600"
                        variant="gradient"
                        font="md"
                        squircle="4xl"
                        width="130px"
                        height="38px"
                        textColor="white-100"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                        animation="none"
                        inputPaddingInline="xl"
                        fontWeight="500"
                    />
                    <div className="filter-group">
                        <Input
                            type="date"
                            name="startDate"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            colorScheme="yellow-300"
                            variant="gradient"
                            squircle="4xl"
                            width="200px"
                            height="38px"
                            textColor="black-100"
                            fontWeight="500"
                            inputPaddingInline="xl"
                        />
                        <Input
                            type="date"
                            name="endDate"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            colorScheme="yellow-300"
                            variant="gradient"
                            squircle="4xl"
                            width="200px"
                            height="38px"
                            textColor="black-200"
                            inputPaddingInline="xl"
                            fontWeight="500"
                        />
                        <Button
                            text="Apply"
                            onClick={handleDateRangeFilter}
                            colorScheme="lime-500"
                            variant="gradient"
                            font="md"
                            squircle="xl"
                            width="90px"
                            height="38px"
                            textColor="black-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                        />
                    </div>
                    <div className="filter-group">
                        <Input
                            type="date"
                            name="singleDate"
                            value={singleDate}
                            onChange={(e) => setSingleDate(e.target.value)}
                            colorScheme="purple-400"
                            variant="gradient"
                            squircle="4xl"
                            width="200px"
                            height="38px"
                            textColor="black-100"
                            fontWeight="500"
                            inputPaddingInline="xl"
                        />
                        <Button
                            text="Go"
                            onClick={handleSingleDateFilter}
                            colorScheme="purple-600"
                            variant="gradient"
                            font="md"
                            squircle="xl"
                            width="70px"
                            height="38px"
                            textColor="white-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                        />
                    </div>
                </div>

                <div className="controls-row controls-row-time">
                    <div className="filter-group">
                        <span className="filter-label">Specific Time:</span>
                        <Input
                            type="time"
                            name="specificTime"
                            value={specificTime}
                            onChange={(e) => setSpecificTime(e.target.value)}
                            colorScheme="cyan-700"
                            variant="gradient"
                            squircle="4xl"
                            width="200px"
                            height="38px"
                            textColor="white-100"
                            fontWeight="500"
                            inputPaddingInline="xl"
                        />
                        <Button
                            text="Filter"
                            onClick={handleSpecificTimeFilter}
                            colorScheme="cyan-600"
                            variant="gradient"
                            font="sm"
                            squircle="xl"
                            width="80px"
                            height="38px"
                            textColor="white-200"
                        />
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Time Range:</span>
                        <Input
                            type="time"
                            name="startTime"
                            value={timeRange.start}
                            onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                            colorScheme="teal-400"
                            variant="gradient"
                            squircle="4xl"
                            width="200px"
                            height="38px"
                            textColor="black-100"
                            fontWeight="500"
                            inputPaddingInline="xl"
                        />
                        <span className="filter-separator">to</span>
                        <Input
                            type="time"
                            name="endTime"
                            value={timeRange.end}
                            onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                            colorScheme="teal-400"
                            variant="gradient"
                            squircle="4xl"
                            width="200px"
                            height="38px"
                            textColor="black-100"
                            fontWeight="500"
                            inputPaddingInline="xl"
                        />
                        <Button
                            text="Apply"
                            onClick={handleTimeRangeFilter}
                            colorScheme="teal-600"
                            variant="gradient"
                            font="sm"
                            squircle="xl"
                            width="80px"
                            height="38px"
                            textColor="white-200"
                        />
                    </div>
                    {(specificTime || timeRange.start || timeRange.end) && (
                        <Button
                            text="Clear Filters"
                            onClick={clearTimeFilters}
                            colorScheme="red-500"
                            variant="gradient"
                            font="sm"
                            squircle="xl"
                            width="120px"
                            height="38px"
                            textColor="white-200"
                        />
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="activities-tabs">
                <Button text="Recent Activities" onClick={() => setActiveTab('recent')} colorScheme={activeTab === 'recent' ? 'amber-500' : 'amber-900'} variant="gradient" font="md" squircle="4xl" width="25%" height="48px" textColor={activeTab === 'recent' ? 'white-200' : 'gray-300'} shadowPosition="to-bottom" shadowColor="white-600" />
                <Button text="Mobilizations" onClick={() => setActiveTab('mobilizations')} colorScheme={activeTab === 'mobilizations' ? 'amber-500' : 'amber-900'} variant="gradient" font="md" squircle="4xl" width="25%" height="48px" textColor={activeTab === 'mobilizations' ? 'white-200' : 'gray-300'} shadowPosition="to-bottom" shadowColor="white-600" />
                <Button text="Replacements" onClick={() => setActiveTab('replacements')} colorScheme={activeTab === 'replacements' ? 'amber-500' : 'amber-900'} variant="gradient" font="md" squircle="4xl" width="25%" height="48px" textColor={activeTab === 'replacements' ? 'white-200' : 'gray-300'} shadowPosition="to-bottom" shadowColor="white-600" />
                <Button text="Status Changes" onClick={() => setActiveTab('statusChanges')} colorScheme={activeTab === 'statusChanges' ? 'amber-500' : 'amber-900'} variant="gradient" font="md" squircle="4xl" width="25%" height="48px" textColor={activeTab === 'statusChanges' ? 'white-200' : 'gray-300'} shadowPosition="to-bottom" shadowColor="white-600" />
            </div>

            {isLoading ? (
                <Loader />
            ) : (
                <div className="activities-content">
                    {activeTab === 'recent' && (
                        <div className="activities-grid">
                            {recentActivities.length > 0
                                ? recentActivities.map(renderRecentActivity)
                                : <div className="no-activities"><p>No recent activities found</p></div>}
                        </div>
                    )}
                    {activeTab === 'mobilizations' && (
                        <div className="activities-grid">
                            {mobilizations.filter(i => i.action !== 'status_changed').length > 0
                                ? mobilizations.filter(i => i.action !== 'status_changed').map(renderMobilizationCard)
                                : <div className="no-activities"><p>No mobilization activities found</p></div>}
                        </div>
                    )}
                    {activeTab === 'replacements' && (
                        <div className="activities-grid">
                            {replacements.length > 0
                                ? replacements.map(renderReplacementCard)
                                : <div className="no-activities"><p>No replacement activities found</p></div>}
                        </div>
                    )}
                    {activeTab === 'statusChanges' && (
                        <div className="activities-grid">
                            {mobilizations.filter(i => i.action === 'status_changed').length > 0
                                ? mobilizations.filter(i => i.action === 'status_changed').map(renderStatusChangeCard)
                                : <div className="no-activities"><p>No status change activities found</p></div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default OperationsActivities;