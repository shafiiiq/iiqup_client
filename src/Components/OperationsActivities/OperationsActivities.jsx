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

                        return { ...item, equipmentImages, operatorProfileUrl };
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
                            replacedEquipmentDetails: item.replacedEquipmentDetails ? { ...item.replacedEquipmentDetails, images: replacedImages } : null,
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
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

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
        if (specificTime) {
            fetchActivitiesWithFilter(selectedPeriod);
        }
    };

    const handleTimeRangeFilter = () => {
        if (timeRange.start && timeRange.end) {
            fetchActivitiesWithFilter(selectedPeriod);
        }
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

    const handlePeriodChange = (e) => {
        setSelectedPeriod(e.target.value);
    };

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
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month}, ${year}`;
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString;
    };

    const getInitials = (name) => {
        if (!name) return 'OP';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const renderStatusChangeCard = (item) => {
        const hasImages = item.equipmentImages && item.equipmentImages.length > 0;
        const currentImageIndex = activeImageIndex[item.regNo] || 0;

        const getStatusColor = (status) => {
            const colors = {
                'idle': '#F59E0B',
                'loading': '#df29c0',
                'going': '#3B82F6',
                'active': '#10B981',
                'maintenance': '#EF4444'
            };
            return colors[status?.toLowerCase()] || '#6B7280';
        };

        return (
            <div className="activity-card status-change-card" key={item._id}>
                {/* Image Section */}
                {hasImages && (
                    <div className="activity-card-image">
                        <div className="slider-images">
                            {item.equipmentImages.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.s3Url || img.url}
                                    alt={`${item.machine} ${index + 1}`}
                                    className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                        {item.equipmentImages.length > 1 && (
                            <div className="slider-dots">
                                {item.equipmentImages.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setActiveImageIndex(prev => ({
                                            ...prev,
                                            [item.regNo]: index
                                        }))}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section */}
                <div className="activity-card-content">
                    <div className="activity-card-header">
                        <div className="activity-type-badge status-change">
                            <span>Status Changed</span>
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>

                    <div className="activity-card-body">
                        <div className="activity-equipment-info">
                            <div className='activity-equipment-item'>
                                <h3 className="equipment-title">{item.equipmentDetails?.machine || item.machine} - {item.equipmentDetails?.regNo || item.regNo}</h3>
                                {item.equipmentDetails?.brand && (
                                    <p className="equipment-brand">{item.equipmentDetails.brand} • {item.equipmentDetails.year}</p>
                                )}
                            </div>
                        </div>

                        <div className="activity-flow status-change-flow">
                            <div className="flow-item from-status">
                                <div
                                    className="status-indicator"
                                    style={{ color: getStatusColor(item.previousStatus) }} >
                                    <span className="material-symbols-rounded"
                                        style={{ color: getStatusColor(item.previousStatus) }} >
                                        {item.previousStatus === 'idle' ? 'key_off' :
                                            item.previousStatus === 'loading' ? 'moving' :
                                                item.previousStatus === 'going' ? 'delivery_truck_speed' :
                                                    item.previousStatus === 'active' ? 'key' :
                                                        'handyman'}
                                    </span>
                                </div>
                                <span className="flow-label">From</span>
                                <span className="flow-value">{item.previousStatus?.toUpperCase()}</span>
                            </div>
                            <div className="flow-arrow">
                                <span className="material-symbols-rounded">arrow_forward</span>
                            </div>
                            <div className="flow-item to-status">
                                <div className="status-indicator" >
                                    <span className="material-symbols-rounded"
                                        style={{ color: getStatusColor(item.newStatus) }}
                                    >
                                        {item.newStatus === 'idle' ? 'key_off' :
                                            item.newStatus === 'loading' ? 'moving' :
                                                item.newStatus === 'going' ? 'delivery_truck_speed' :
                                                    item.newStatus === 'active' ? 'key' :
                                                        'handyman'}
                                    </span>
                                </div>
                                <span className="flow-label">To</span>
                                <span className="flow-value">{item.newStatus?.toUpperCase()}</span>
                            </div>
                        </div>

                        {item.remarks && (
                            <div className="activity-remarks">
                                <span>Remarks: </span>
                                <span>{item.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMobilizationCard = (item) => {
        const hasImages = item.equipmentImages && item.equipmentImages.length > 0;
        const currentImageIndex = activeImageIndex[item.regNo] || 0;

        return (
            <div className="activity-card mobilization-card" key={item._id}>
                {/* Image Section */}
                {hasImages && (
                    <div className="activity-card-image">
                        <div className="slider-images">
                            {item.equipmentImages.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.s3Url || img.url}
                                    alt={`${item.machine} ${index + 1}`}
                                    className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                        {item.equipmentImages.length > 1 && (
                            <div className="slider-dots">
                                {item.equipmentImages.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setActiveImageIndex(prev => ({
                                            ...prev,
                                            [item.regNo]: index
                                        }))}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section */}
                <div className="activity-card-content">
                    <div className="activity-card-header">
                        <div className="activity-type-badge mobilization">
                            <span className="material-symbols-rounded">
                            </span>
                            <span>{item.action === 'mobilized' ? 'Mobilized' : 'Demobilized'}</span>
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>

                    <div className="activity-card-body">
                        <div className="activity-equipment-info">
                            <div className='activity-equipment-item'>
                                <h3 className="equipment-title">{item.equipmentDetails?.machine || item.machine} - {item.equipmentDetails?.regNo || item.regNo} </h3>
                                {item.equipmentDetails?.brand && (
                                    <p className="equipment-brand">{item.equipmentDetails.brand} • {item.equipmentDetails.year}</p>
                                )}
                            </div>
                            <div className="activity-equipment-item">
                                <span className={`status-badge ${item.status}`}>{item.status}</span>
                            </div>
                        </div>

                        {item.action === 'mobilized' ? (
                            <div className="activity-flow mobilization-flow">
                                <div className="flow-item idle-state">
                                    <span className="material-symbols-rounded">key_off</span>
                                    <span className="flow-label">Idle</span>
                                </div>
                                <div className="flow-arrow">
                                    <span className="material-symbols-rounded">arrow_forward</span>
                                </div>
                                <div className="flow-item active-state">
                                    <span className="material-symbols-rounded">key</span>
                                    <span className="flow-label">Active</span>
                                </div>
                            </div>
                        ) : (
                            <div className="activity-flow demobilization-flow">
                                <div className="flow-item active-state">
                                    <span className="material-symbols-rounded">key</span>
                                    <span className="flow-label">Active</span>
                                </div>
                                <div className="flow-arrow">
                                    <span className="material-symbols-rounded">arrow_forward</span>
                                </div>
                                <div className="flow-item idle-state">
                                    <span className="material-symbols-rounded">key_off</span>
                                    <span className="flow-label">Idle</span>
                                </div>
                            </div>
                        )}

                        <div className="activity-details-grid">
                            {(item.withOperator || item.action === 'demobilized') && item.operatorDetails && (
                                <div className="detail-item operator-detail">
                                    <span className="detail-label">Operator</span>
                                    <div className="operator-info-with-profile">
                                        {item.operatorProfileUrl ? (
                                            <img src={item.operatorProfileUrl} alt={item.operatorDetails.name} className="operator-profile-pic-small" />
                                        ) : (
                                            <div className="operator-profile-initials">{getInitials(item.operatorDetails.name)}</div>
                                        )}
                                        <div className="operator-text-info">
                                            <span className="detail-value">{item.operatorDetails.name}</span>
                                            {item.operatorDetails.contactNo && (
                                                <span className="operator-contact">{item.operatorDetails.contactNo}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {item.site && (
                                <div className="detail-item">
                                    <span className="detail-label">Site</span>
                                    <span className="detail-value">{item.site}</span>
                                </div>
                            )}
                            {item.deployType === 'company' && item.clientCompany && (
                                <div className="detail-item">
                                    <span className="detail-label">Leased To</span>
                                    <span className="detail-value">{item.clientCompany}</span>
                                </div>
                            )}
                            {item.equipmentDetails?.rentRate && (
                                <div className="detail-item">
                                    <span className="detail-label">{item.equipmentDetails?.hired ? 'Hire Rate' : 'Working Rate'}</span>
                                    <span className="detail-value">
                                        {item.equipmentDetails.rentRate.basis?.charAt(0).toUpperCase() + item.equipmentDetails.rentRate.basis?.slice(1)}
                                        {item.equipmentDetails.rentRate.rate ? ` — ${item.equipmentDetails.rentRate.rate} ${item.equipmentDetails.rentRate.currency || 'QAR'}` : ''}
                                    </span>
                                </div>
                            )}
                            {item.equipmentDetails?.location && (
                                <div className="detail-item">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value">{item.equipmentDetails.location}</span>
                                </div>
                            )}
                        </div>

                        {item.remarks && (
                            <div className="activity-remarks">
                                <span>Remarks: </span>
                                <span>{item.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderReplacementCard = (item) => {
        const hasCurrentImages = item.currentEquipmentDetails?.images && item.currentEquipmentDetails.images.length > 0;
        const hasReplacedImages = item.replacedEquipmentDetails?.images && item.replacedEquipmentDetails.images.length > 0;
        const currentImageIndex = activeImageIndex[`current-${item.regNo}`] || 0;
        const replacedImageIndex = activeImageIndex[`replaced-${item.replacedEquipmentDetails?.regNo}`] || 0;

        return (
            <div className={`activity-card replacement-card ${item.type === 'operator' ? 'mobilization-card' : ''}`} key={item._id}>
                {/* Image Section for Operator Replacement */}
                {item.type === 'operator' && hasCurrentImages && (
                    <div className="activity-card-image">
                        <div className="slider-images">
                            {item.currentEquipmentDetails.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.s3Url || img.url}
                                    alt={`${item.machine} ${index + 1}`}
                                    className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                        {item.currentEquipmentDetails.images.length > 1 && (
                            <div className="slider-dots">
                                {item.currentEquipmentDetails.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setActiveImageIndex(prev => ({
                                            ...prev,
                                            [`current-${item.regNo}`]: index
                                        }))}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Header for non-operator replacements */}
                {item.type !== 'operator' && (
                    <div className="activity-card-header">
                        <div className={`activity-type-badge replacement ${item.type}`}>
                            <span>{item.type} Replacement</span>
                        </div>
                        <div className="activity-date">
                            <span>{formatDate(item.date)}</span>
                            <span className="activity-time">{formatTime(item.time)}</span>
                        </div>
                    </div>
                )}

                <div className="activity-card-body">
                    {/* Equipment Replacement */}
                    {item.type === 'equipment' && (
                        <div className="equipment-replacement-container">
                            <div className="replacement-equipment-section">
                                <h4 className="section-title">Equipment</h4>
                                {hasCurrentImages && (
                                    <div className="equipment-image-slider">
                                        <div className="slider-images">
                                            {item.currentEquipmentDetails.images.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img.s3Url || img.url}
                                                    alt={`${item.currentEquipmentDetails.machine} ${index + 1}`}
                                                    className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                                    loading="lazy"
                                                />
                                            ))}
                                        </div>
                                        {item.currentEquipmentDetails.images.length > 1 && (
                                            <div className="slider-dots">
                                                {item.currentEquipmentDetails.images.map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                                        onClick={() => setActiveImageIndex(prev => ({
                                                            ...prev,
                                                            [`current-${item.regNo}`]: index
                                                        }))}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="equipment-info">
                                    <h3>{item.currentEquipmentDetails?.machine || item.machine} - {item.currentEquipmentDetails?.regNo || item.regNo}</h3>
                                    {item.currentEquipmentDetails?.brand && (
                                        <p className="brand-year">{item.currentEquipmentDetails.brand} • {item.currentEquipmentDetails.year}</p>
                                    )}
                                    {item.currentEquipmentDetails?.site && (
                                        <p className="brand-year">Site: {item.currentEquipmentDetails.site}</p>
                                    )}
                                    {item.currentOperator && (
                                        <p className="brand-year">Operator: {item.currentOperator}</p>
                                    )}
                                    {item.currentEquipmentDetails?.rentRate && (
                                        <p className="brand-year">
                                            Rate: {item.currentEquipmentDetails.rentRate.basis?.charAt(0).toUpperCase() + item.currentEquipmentDetails.rentRate.basis?.slice(1)}
                                            {item.currentEquipmentDetails.rentRate.rate ? ` — ${item.currentEquipmentDetails.rentRate.rate} ${item.currentEquipmentDetails.rentRate.currency || 'QAR'}` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="replacement-arrow">
                                <span className="material-symbols-rounded">sync_alt</span>
                            </div>
                            <div className="replacement-equipment-section">
                                <h4 className="section-title">Replaced With</h4>
                                {hasReplacedImages && (
                                    <div className="equipment-image-slider">
                                        <div className="slider-images">
                                            {item.replacedEquipmentDetails.images.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img.s3Url || img.url}
                                                    alt={`${item.replacedEquipmentDetails.machine} ${index + 1}`}
                                                    className={`slider-image ${index === replacedImageIndex ? 'active' : ''}`}
                                                    loading="lazy"
                                                />
                                            ))}
                                        </div>
                                        {item.replacedEquipmentDetails.images.length > 1 && (
                                            <div className="slider-dots">
                                                {item.replacedEquipmentDetails.images.map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`slider-dot ${index === replacedImageIndex ? 'active' : ''}`}
                                                        onClick={() => setActiveImageIndex(prev => ({
                                                            ...prev,
                                                            [`replaced-${item.replacedEquipmentDetails.regNo}`]: index
                                                        }))}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="equipment-info">
                                    <h3>{item.replacedEquipmentDetails?.machine} - {item.replacedEquipmentDetails?.regNo}</h3>
                                    {item.replacedEquipmentDetails?.brand && (
                                        <p className="brand-year">{item.replacedEquipmentDetails.brand} • {item.replacedEquipmentDetails.year}</p>
                                    )}
                                    {item.replacedEquipmentDetails?.site && (
                                        <p className="brand-year">Site: {item.replacedEquipmentDetails.site}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Operator Replacement */}
                    {item.type === 'operator' && (
                        <>
                            <div className="activity-card-header">
                                <div className="activity-type-badge replacement operator">
                                    <span>Operator Replacement</span>
                                </div>
                                <div className="activity-date">
                                    <span>{formatDate(item.date)}</span>
                                    <span className="activity-time">{formatTime(item.time)}</span>
                                </div>
                            </div>

                            <div className="activity-card-body">
                                <div className="activity-equipment-info">
                                    <div className='activity-equipment-item'>
                                        <h3 className="equipment-title">{item.currentEquipmentDetails?.machine || item.machine} - {item.currentEquipmentDetails?.regNo || item.regNo}</h3>
                                        {item.currentEquipmentDetails?.brand && (
                                            <p className="equipment-brand">{item.currentEquipmentDetails.brand} • {item.currentEquipmentDetails.year}</p>
                                        )}
                                    </div>
                                    <div className="activity-equipment-item">
                                        <span className={`status-badge ${item.status}`}>{item.status}</span>
                                    </div>
                                </div>

                                <div className="activity-flow replacement-flow">
                                    <div className="flow-item from-item">
                                        {item.currentOperatorProfileUrl ? (
                                            <img src={item.currentOperatorProfileUrl} alt={item.currentOperator} className="operator-profile-pic-flow" />
                                        ) : (
                                            <div className="operator-profile-initials-flow">{getInitials(item.currentOperator)}</div>
                                        )}
                                        <span className="flow-label">From</span>
                                        <span className="flow-value">{item.currentOperator}</span>
                                        {item.currentOperatorDetails?.contactNo && (
                                            <span className="flow-contact">Phone : {item.currentOperatorDetails.contactNo}</span>
                                        )}
                                    </div>
                                    <div className="flow-arrow">
                                        <span className="material-symbols-rounded">arrow_forward</span>
                                    </div>
                                    <div className="flow-item to-item">
                                        {item.replacedOperatorProfileUrl ? (
                                            <img src={item.replacedOperatorProfileUrl} alt={item.replacedOperator} className="operator-profile-pic-flow" />
                                        ) : (
                                            <div className="operator-profile-initials-flow">{getInitials(item.replacedOperator)}</div>
                                        )}
                                        <span className="flow-label">To</span>
                                        <span className="flow-value">{item.replacedOperator}</span>
                                        {item.replacedOperatorDetails?.contactNo && (
                                            <span className="flow-contact">Phone : {item.replacedOperatorDetails.contactNo}</span>
                                        )}
                                    </div>
                                </div>

                                {item.remarks && (
                                    <div className="activity-remarks">
                                        <span>Remarks: </span>
                                        <span>{item.remarks}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Site Replacement */}
                    {item.type === 'site' && (
                        <>
                            {hasCurrentImages && (
                                <div className="activity-card-image">
                                    <div className="slider-images">
                                        {item.currentEquipmentDetails.images.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img.s3Url || img.url}
                                                alt={`${item.machine} ${index + 1}`}
                                                className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                                loading="lazy"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="activity-equipment-info">
                                <div className='activity-equipment-item'>
                                    <h3 className="equipment-title">{item.currentEquipmentDetails?.machine || item.machine}</h3>
                                    <p className="equipment-regno">Reg No: {item.currentEquipmentDetails?.regNo || item.regNo}</p>
                                </div>
                                <div className="activity-equipment-item">
                                    <span className={`status-badge ${item.status}`}>{item.status}</span>
                                </div>
                            </div>
                            <div className="activity-flow replacement-flow">
                                <div className="flow-item from-item">
                                    <span className="flow-label">From</span>
                                    <span className="flow-value">{item.currentSite}</span>
                                </div>
                                <div className="flow-arrow replacement-arrow">
                                    <span className="material-symbols-rounded">swap_horiz</span>
                                </div>
                                <div className="flow-item to-item">
                                    <span className="material-symbols-rounded">add_location</span>
                                    <span className="flow-label">To</span>
                                    <span className="flow-value">{item.replacedSite}</span>
                                </div>
                            </div>
                            {item.remarks && (
                                <div className="activity-remarks">
                                    <span>Remarks: </span>
                                    <span>{item.remarks}</span>
                                </div>
                            )}
                        </>
                    )}

                    {item.type !== 'operator' && item.remarks && (
                        <div className="activity-remarks">
                            <span>Remarks: </span>
                            <span>{item.remarks}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderRecentActivity = (item) => {
        if (item.activityType === 'mobilization') {
            if (item.action === 'status_changed') {
                return renderStatusChangeCard(item);
            }
            return renderMobilizationCard(item);
        } else {
            return renderReplacementCard(item);
        }
    };

    return (
        <div className="operations-activities-container">
            {/* Filter Controls Bar */}
            <div className="controls-bar">
                {/* Row 1: Main Filters */}
                <div className="controls-row controls-row-main">
                    <Input
                        type="select"
                        value={selectedPeriod}
                        onChange={(e) => handlePeriodChange(e)}
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
                        fontWeight='500'
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
                        fontWeight='500'
                    />

                    <div className="filter-group">
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
                            height="38px"
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
                            height="38px"
                            textColor="black-200"
                            placeholderColor="black-300"
                            inputPaddingInline="xl"
                            fontWeight='500'
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
                            placeholder="Select Date"
                            colorScheme="purple-400"
                            variant="gradient"
                            squircle="4xl"
                            width="220px"
                            height="38px"
                            textColor="black-100"
                            placeholderColor="black-300"
                            fontWeight='500'
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

                {/* Row 2: Time Filters */}
                <div className="controls-row controls-row-time">
                    <div className="filter-group">
                        <span className="filter-label">Specific Time:</span>
                        <Input
                            type="time"
                            name="specificTime"
                            value={specificTime}
                            onChange={(e) => setSpecificTime(e.target.value)}
                            placeholder="Time"
                            colorScheme="cyan-700"
                            variant="gradient"
                            squircle="4xl"
                            width="240px"
                            height="38px"
                            textColor="white-100"
                            fontWeight='500'
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
                            placeholder="Start"
                            colorScheme="teal-400"
                            variant="gradient"
                            squircle="4xl"
                            width="250px"
                            height="38px"
                            textColor="black-100"
                            placeholderColor='black-100'
                            fontWeight='500'
                            inputPaddingInline="xl"
                        />
                        <span className="filter-separator">to</span>
                        <Input
                            type="time"
                            name="endTime"
                            value={timeRange.end}
                            onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                            placeholder="End"
                            colorScheme="teal-400"
                            variant="gradient"
                            squircle="4xl"
                            width="250px"
                            height="38px"
                            textColor="black-100"
                            placeholderColor='black-100'
                            fontWeight='500'
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

            <div className="activities-tabs">
                <Button
                    text="Recent Activities"
                    onClick={() => setActiveTab('recent')}
                    colorScheme={activeTab === 'recent' ? 'amber-500' : 'amber-900'}
                    variant="gradient"
                    font="md"
                    squircle="4xl"
                    width="25%"
                    height="48px"
                    textColor={activeTab === 'recent' ? 'white-200' : 'gray-300'}
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
                <Button
                    text="Mobilizations"
                    onClick={() => setActiveTab('mobilizations')}
                    colorScheme={activeTab === 'mobilizations' ? 'amber-500' : 'amber-900'}
                    variant="gradient"
                    font="md"
                    squircle="4xl"
                    width="25%"
                    height="48px"
                    textColor={activeTab === 'mobilizations' ? 'white-200' : 'gray-300'}
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
                <Button
                    text="Replacements"
                    onClick={() => setActiveTab('replacements')}
                    colorScheme={activeTab === 'replacements' ? 'amber-500' : 'amber-900'}
                    variant="gradient"
                    font="md"
                    squircle="4xl"
                    width="25%"
                    height="48px"
                    textColor={activeTab === 'replacements' ? 'white-200' : 'gray-300'}
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
                <Button
                    text="Status Changes"
                    onClick={() => setActiveTab('statusChanges')}
                    colorScheme={activeTab === 'statusChanges' ? 'amber-500' : 'amber-900'}
                    variant="gradient"
                    font="md"
                    squircle="4xl"
                    width="25%"
                    height="48px"
                    textColor={activeTab === 'statusChanges' ? 'white-200' : 'gray-300'}
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
            </div>

            {isLoading ? (
                <Loader />
            ) : (
                <div className="activities-content">
                    {activeTab === 'recent' && (
                        <div className="activities-grid">
                            {recentActivities.length > 0 ? (
                                recentActivities.map(renderRecentActivity)
                            ) : (
                                <div className="no-activities">
                                    <p>No recent activities found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'mobilizations' && (
                        <div className="activities-grid">
                            {mobilizations.length > 0 ? (
                                mobilizations
                                    .filter(item => item.action !== 'status_changed')
                                    .map(renderMobilizationCard)
                            ) : (
                                <div className="no-activities">
                                    <p>No mobilization activities found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'replacements' && (
                        <div className="activities-grid">
                            {replacements.length > 0 ? (
                                replacements.map(renderReplacementCard)
                            ) : (
                                <div className="no-activities">
                                    <p>No replacement activities found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'statusChanges' && (
                        <div className="activities-grid">
                            {mobilizations.filter(item => item.action === 'status_changed').length > 0 ? (
                                mobilizations
                                    .filter(item => item.action === 'status_changed')
                                    .map(renderStatusChangeCard)
                            ) : (
                                <div className="no-activities">
                                    <p>No status change activities found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default OperationsActivities;