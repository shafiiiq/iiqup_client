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
    const [selectedItem, setSelectedItem] = useState(null);
    const [readItems, setReadItems] = useState(new Set());

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
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;
    };

    const formatDateFull = (dateString) => {
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
            idle: '#F59E0B', loading: '#df29c0', going: '#3B82F6',
            active: '#10B981', maintenance: '#EF4444', leased: '#6366f1'
        };
        return colors[status?.toLowerCase()] || '#6B7280';
    };

    // ─── Gmail row helpers ─────────────────────────────────────────
    const getActivityMeta = (item) => {
        if (item.activityType === 'mobilization') {
            const eq = item.equipmentDetails || {};
            if (item.action === 'status_changed') {
                return {
                    badge: 'STATUS',
                    badgeClass: 'badge-status',
                    title: `${eq.machine || item.machine} — ${eq.regNo || item.regNo}`,
                    subtitle: `${item.previousStatus?.toUpperCase() || '?'} → ${item.newStatus?.toUpperCase() || '?'}`,
                    body: item.remarks || (item.site ? `Site: ${item.site}` : `${item.month} / ${item.year}`),
                };
            }
            const isDemob = item.action === 'demobilized';
            const isOneDayMob = item.isOneDayMob;
            return {
                badge: isDemob ? 'DEMOB' : isOneDayMob ? '1-DAY' : 'MOB',
                badgeClass: isDemob ? 'badge-demob' : isOneDayMob ? 'badge-oneday' : 'badge-mob',
                title: `${eq.machine || item.machine} — ${eq.regNo || item.regNo}`,
                subtitle: item.deployType === 'company' ? `Leased to: ${item.clientCompany || '—'}` : `Site: ${item.site || '—'}`,
                body: item.remarks || (item.operatorsWithProfiles?.length > 0 ? `Operator: ${item.operatorsWithProfiles[0].operatorName}` : `${item.month} / ${item.year}`),
            };
        }
        // replacement
        if (item.type === 'operator') {
            const eq = item.currentEquipmentDetails || {};
            return {
                badge: 'OP REP',
                badgeClass: 'badge-oprep',
                title: `${eq.machine || item.machine} — ${eq.regNo || item.regNo}`,
                subtitle: `${item.currentOperator || '—'} → ${item.replacedOperator || '—'}`,
                body: item.remarks || `Shift: ${item.shiftName || '—'} · ${item.month} / ${item.year}`,
            };
        }
        if (item.type === 'equipment') {
            const cur = item.currentEquipmentDetails || {};
            const rep = item.replacedEquipmentDetails || {};
            return {
                badge: 'EQ REP',
                badgeClass: 'badge-eqrep',
                title: `${cur.machine || item.machine} — ${cur.regNo || item.regNo}`,
                subtitle: `Replaced by: ${rep.machine || '—'} (${rep.regNo || '—'})`,
                body: item.remarks || `${item.month} / ${item.year}`,
            };
        }
        if (item.type === 'site') {
            const eq = item.currentEquipmentDetails || {};
            return {
                badge: 'SITE',
                badgeClass: 'badge-site',
                title: `${eq.machine || item.machine} — ${eq.regNo || item.regNo}`,
                subtitle: `${item.currentSite || '—'} → ${item.replacedSite || '—'}`,
                body: item.remarks || `${item.month} / ${item.year}`,
            };
        }
        return { badge: '—', badgeClass: '', title: '—', subtitle: '—', body: '—' };
    };

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setReadItems(prev => new Set([...prev, item._id]));
    };

    const closeDetail = () => setSelectedItem(null);

    // ─── Gmail-style row ──────────────────────────────────────────
    const renderRow = (item) => {
        const meta = getActivityMeta(item);
        const isRead = readItems.has(item._id);
        const isSelected = selectedItem?._id === item._id;

        return (
            <div
                key={item._id}
                className={`mail-row ${isRead ? 'mail-row-read' : 'mail-row-unread'} ${isSelected ? 'mail-row-active' : ''}`}
                onClick={() => handleRowClick(item)}
            >
                <span className={`mail-badge ${meta.badgeClass}`}>{meta.badge}</span>
                <div className="mail-row-content">
                    <span className="mail-title">{meta.title}</span>
                    <span className="mail-sep"> — </span>
                    <span className="mail-subtitle">{meta.subtitle}</span>
                    <span className="mail-body-preview">{meta.body}</span>
                </div>
                <span className="mail-date">{formatDate(item.date)}</span>
            </div>
        );
    };

    // ─── Detail Panel ─────────────────────────────────────────────
    const renderImageSlider = (images, key) => {
        if (!images || images.length === 0) return null;
        const currentIndex = activeImageIndex[key] || 0;
        return (
            <div className="detail-img-slider">
                {images.map((img, index) => (
                    <img
                        key={index}
                        src={img.s3Url || img.url}
                        alt={`img-${index + 1}`}
                        className={`detail-slider-img ${index === currentIndex ? 'active' : ''}`}
                        loading="lazy"
                    />
                ))}
                {images.length > 1 && (
                    <div className="detail-slider-dots">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`detail-slider-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setActiveImageIndex(prev => ({ ...prev, [key]: index }))}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderOperatorAvatar = (profileUrl, name) => {
        return profileUrl ? (
            <img src={profileUrl} alt={name} className="detail-op-avatar" />
        ) : (
            <div className="detail-op-initials">{getInitials(name)}</div>
        );
    };

    const renderDetailContent = (item) => {
        if (!item) return null;

        if (item.activityType === 'mobilization') {
            if (item.action === 'status_changed') return renderDetailStatusChange(item);
            return renderDetailMobilization(item);
        }
        return renderDetailReplacement(item);
    };

    const renderDetailStatusChange = (item) => {
        const eq = item.equipmentDetails || {};
        return (
            <>
                <div className="detail-hero">
                    <div className="detail-badge badge-status">STATUS CHANGE</div>
                    <h2 className="detail-title">{eq.machine || item.machine}</h2>
                    <p className="detail-reg">{eq.regNo || item.regNo}</p>
                </div>

                {item.equipmentImages?.length > 0 && renderImageSlider(item.equipmentImages, item.regNo)}

                <table className="detail-table">
                    <tbody>
                        <tr><th>Date</th><td>{formatDateFull(item.date)}</td></tr>
                        <tr><th>Time</th><td>{formatTime(item.time)}</td></tr>
                        <tr><th>Previous Status</th><td><span className="status-chip" style={{ background: getStatusColor(item.previousStatus) }}>{item.previousStatus?.toUpperCase()}</span></td></tr>
                        <tr><th>New Status</th><td><span className="status-chip" style={{ background: getStatusColor(item.newStatus) }}>{item.newStatus?.toUpperCase()}</span></td></tr>
                        {item.site && <tr><th>Site</th><td>{item.site}</td></tr>}
                        <tr><th>Month / Year</th><td>{item.month} / {item.year}</td></tr>
                        {eq.brand && <tr><th>Brand</th><td>{eq.brand} · {eq.year}</td></tr>}
                        {eq.company && <tr><th>Company</th><td>{eq.company}</td></tr>}
                        {eq.hired && eq.hiredFrom && <tr><th>Hired From</th><td>{eq.hiredFrom}</td></tr>}
                        {eq.rentRate && <tr><th>{eq.hired ? 'Hire Rate' : 'Working Rate'}</th><td>{eq.rentRate.basis} — {eq.rentRate.rate} {eq.rentRate.currency || 'QAR'}</td></tr>}
                        {eq.location && <tr><th>Location</th><td>{eq.location}</td></tr>}
                        {item.remarks && <tr><th>Remarks</th><td>{item.remarks}</td></tr>}
                    </tbody>
                </table>
            </>
        );
    };

    const renderDetailMobilization = (item) => {
        const eq = item.equipmentDetails || {};
        const isDemob = item.action === 'demobilized';
        const isOneDayMob = item.isOneDayMob;
        const operators = (item.operatorsWithProfiles || item.operators || []).filter(o => o.operatorName);

        return (
            <>
                <div className="detail-hero">
                    <div className={`detail-badge ${isDemob ? 'badge-demob' : isOneDayMob ? 'badge-oneday' : 'badge-mob'}`}>
                        {isDemob ? 'DEMOBILIZATION' : isOneDayMob ? 'ONE-DAY MOB' : 'MOBILIZATION'}
                    </div>
                    <h2 className="detail-title">{eq.machine || item.machine}</h2>
                    <p className="detail-reg">{eq.regNo || item.regNo}</p>
                </div>

                {item.equipmentImages?.length > 0 && renderImageSlider(item.equipmentImages, item.regNo)}

                <table className="detail-table">
                    <tbody>
                        <tr><th>Date</th><td>{formatDateFull(item.date)}</td></tr>
                        <tr><th>Time</th><td>{formatTime(item.time)}</td></tr>
                        <tr><th>Status</th><td><span className="status-chip" style={{ background: getStatusColor(item.status) }}>{item.status}</span></td></tr>
                        <tr><th>Action</th><td>{isDemob ? 'Demobilized' : 'Mobilized'}</td></tr>
                        {item.deployType === 'company' && item.clientCompany
                            ? <tr><th>Leased To</th><td>{item.clientCompany}</td></tr>
                            : item.site && <tr><th>{isDemob ? 'Removed From' : 'Deployed To'}</th><td>{item.site}</td></tr>}
                        <tr><th>Deploy Type</th><td>{item.deployType === 'company' ? 'Company (Lease)' : 'Site'}</td></tr>
                        <tr><th>Month / Year</th><td>{item.month} / {item.year}</td></tr>
                        {eq.brand && <tr><th>Brand</th><td>{eq.brand} · {eq.year}</td></tr>}
                        {eq.company && <tr><th>Company</th><td>{eq.company}</td></tr>}
                        {eq.hired && eq.hiredFrom && <tr><th>Hired From</th><td>{eq.hiredFrom}</td></tr>}
                        {eq.rentRate && <tr><th>{eq.hired ? 'Hire Rate' : 'Working Rate'}</th><td>{eq.rentRate.basis} — {eq.rentRate.rate} {eq.rentRate.currency || 'QAR'}</td></tr>}
                        {eq.location && <tr><th>Location</th><td>{eq.location}</td></tr>}
                        {isOneDayMob && item.demobDate && <tr><th>Demob Date</th><td>{formatDateFull(item.demobDate)}</td></tr>}
                        {isOneDayMob && item.demobTime && <tr><th>Demob Time</th><td>{formatTime(item.demobTime)}</td></tr>}
                        {item.demobRemarks && <tr><th>Demob Remarks</th><td>{item.demobRemarks}</td></tr>}
                        {item.remarks && <tr><th>Remarks</th><td>{item.remarks}</td></tr>}
                    </tbody>
                </table>

                {operators.length > 0 && (
                    <>
                        <h3 className="detail-section-title">Operators ({operators.length})</h3>
                        <table className="detail-table">
                            <thead>
                                <tr><th>Operator</th><th>Shift</th><th>Hours</th></tr>
                            </thead>
                            <tbody>
                                {operators.map((op, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="op-cell">
                                                {renderOperatorAvatar(op.profileUrl, op.operatorName)}
                                                <span>{op.operatorName}</span>
                                            </div>
                                        </td>
                                        <td>{op.shiftName || '—'}</td>
                                        <td>{op.shiftStart ? `${op.shiftStart}${op.shiftEnd ? ' – ' + op.shiftEnd : ''}` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {operators.length === 0 && item.operatorDetails && (
                    <>
                        <h3 className="detail-section-title">{isDemob ? 'Previous Operator' : 'Operator'}</h3>
                        <table className="detail-table">
                            <tbody>
                                <tr><th>Name</th><td>
                                    <div className="op-cell">
                                        {renderOperatorAvatar(item.operatorProfileUrl, item.operatorDetails.name)}
                                        <span>{item.operatorDetails.name}</span>
                                    </div>
                                </td></tr>
                                {item.operatorDetails.contactNo && <tr><th>Contact</th><td>{item.operatorDetails.contactNo}</td></tr>}
                                {item.operatorDetails.nationality && <tr><th>Nationality</th><td>{item.operatorDetails.nationality}</td></tr>}
                            </tbody>
                        </table>
                    </>
                )}
            </>
        );
    };

    const renderDetailReplacement = (item) => {
        if (item.type === 'operator') return renderDetailOperatorReplacement(item);
        if (item.type === 'equipment') return renderDetailEquipmentReplacement(item);
        if (item.type === 'site') return renderDetailSiteReplacement(item);
        return null;
    };

    const renderDetailOperatorReplacement = (item) => {
        const eq = item.currentEquipmentDetails || {};
        const prevOps = item.previousOperators || [];
        return (
            <>
                <div className="detail-hero">
                    <div className="detail-badge badge-oprep">{item.replaceAll ? 'ALL OPERATORS REPLACED' : 'OPERATOR REPLACEMENT'}</div>
                    <h2 className="detail-title">{eq.machine || item.machine}</h2>
                    <p className="detail-reg">{eq.regNo || item.regNo}</p>
                </div>

                {eq.images?.length > 0 && renderImageSlider(eq.images, `cur-${item.regNo}`)}

                <table className="detail-table">
                    <tbody>
                        <tr><th>Date</th><td>{formatDateFull(item.date)}</td></tr>
                        <tr><th>Time</th><td>{formatTime(item.time)}</td></tr>
                        <tr><th>Status</th><td><span className="status-chip" style={{ background: getStatusColor(item.status) }}>{item.status}</span></td></tr>
                        {eq.brand && <tr><th>Brand</th><td>{eq.brand} · {eq.year}</td></tr>}
                        {eq.company && <tr><th>Company</th><td>{eq.company}</td></tr>}
                        {eq.site && <tr><th>Site</th><td>{Array.isArray(eq.site) ? eq.site.at(-1) : eq.site}</td></tr>}
                        {eq.location && <tr><th>Location</th><td>{eq.location}</td></tr>}
                        {eq.rentRate && <tr><th>{eq.hired ? 'Hire Rate' : 'Working Rate'}</th><td>{eq.rentRate.basis} — {eq.rentRate.rate} {eq.rentRate.currency || 'QAR'}</td></tr>}
                        <tr><th>Month / Year</th><td>{item.month} / {item.year}</td></tr>
                        <tr><th>Replace Type</th><td>{item.replaceAll ? 'All Operators' : 'Single Shift'}</td></tr>
                        {item.remarks && <tr><th>Remarks</th><td>{item.remarks}</td></tr>}
                    </tbody>
                </table>

                <h3 className="detail-section-title">Operator Change</h3>
                <table className="detail-table">
                    <thead><tr><th></th><th>From</th><th>To</th></tr></thead>
                    <tbody>
                        <tr>
                            <th>Operator</th>
                            <td>
                                <div className="op-cell">
                                    {renderOperatorAvatar(item.currentOperatorProfileUrl, item.currentOperator)}
                                    <span>{item.replaceAll ? 'All operators' : (item.currentOperator || '—')}</span>
                                </div>
                            </td>
                            <td>
                                <div className="op-cell">
                                    {renderOperatorAvatar(item.replacedOperatorProfileUrl, item.replacedOperator)}
                                    <span>{item.replacedOperator || '—'}</span>
                                </div>
                            </td>
                        </tr>
                        {item.currentOperatorDetails?.contactNo && <tr><th>Contact</th><td>{item.currentOperatorDetails.contactNo}</td><td>{item.replacedOperatorDetails?.contactNo || '—'}</td></tr>}
                        {item.shiftName && <tr><th>Shift</th><td>{item.targetShiftName || '—'}</td><td>{item.shiftName}{item.shiftStart ? ` · ${item.shiftStart}${item.shiftEnd ? ' – ' + item.shiftEnd : ''}` : ''}</td></tr>}
                    </tbody>
                </table>

                {item.replaceAll && prevOps.length > 0 && (
                    <>
                        <h3 className="detail-section-title">Previous Operators (All Replaced)</h3>
                        <table className="detail-table">
                            <thead><tr><th>Name</th><th>Shift</th><th>Hours</th></tr></thead>
                            <tbody>
                                {prevOps.map((op, i) => (
                                    <tr key={i}>
                                        <td><div className="op-cell"><div className="detail-op-initials xs">{getInitials(op.operatorName)}</div><span>{op.operatorName || '—'}</span></div></td>
                                        <td>{op.shiftName || '—'}</td>
                                        <td>{op.shiftStart ? `${op.shiftStart}${op.shiftEnd ? ' – ' + op.shiftEnd : ''}` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </>
        );
    };

    const renderDetailEquipmentReplacement = (item) => {
        const cur = item.currentEquipmentDetails || {};
        const rep = item.replacedEquipmentDetails || {};
        return (
            <>
                <div className="detail-hero">
                    <div className="detail-badge badge-eqrep">EQUIPMENT REPLACEMENT</div>
                    <h2 className="detail-title">{cur.machine || item.machine}</h2>
                    <p className="detail-reg">{cur.regNo || item.regNo}</p>
                </div>

                <h3 className="detail-section-title">Outgoing Equipment</h3>
                {cur.images?.length > 0 && renderImageSlider(cur.images, `cur-${item.regNo}`)}
                <table className="detail-table">
                    <tbody>
                        <tr><th>Date</th><td>{formatDateFull(item.date)}</td></tr>
                        <tr><th>Time</th><td>{formatTime(item.time)}</td></tr>
                        <tr><th>Machine</th><td>{cur.machine} — {cur.regNo}</td></tr>
                        {cur.brand && <tr><th>Brand</th><td>{cur.brand} · {cur.year}</td></tr>}
                        {cur.company && <tr><th>Company</th><td>{cur.company}</td></tr>}
                        {cur.hired && cur.hiredFrom && <tr><th>Hired From</th><td>{cur.hiredFrom}</td></tr>}
                        {cur.site && <tr><th>Was At</th><td>{Array.isArray(cur.site) ? cur.site.at(-1) : cur.site}</td></tr>}
                        {cur.rentRate && <tr><th>Rate</th><td>{cur.rentRate.basis} — {cur.rentRate.rate} {cur.rentRate.currency || 'QAR'}</td></tr>}
                        {cur.location && <tr><th>Location</th><td>{cur.location}</td></tr>}
                        {item.currentOperator && <tr><th>Operator</th><td>{item.currentOperator}</td></tr>}
                        <tr><th>Goes To</th><td>{item.newSiteForReplaced || 'Idle'}</td></tr>
                    </tbody>
                </table>

                <h3 className="detail-section-title">Incoming Equipment</h3>
                {rep.images?.length > 0 && renderImageSlider(rep.images, `rep-${rep.regNo}`)}
                <table className="detail-table">
                    <tbody>
                        <tr><th>Machine</th><td>{rep.machine} — {rep.regNo}</td></tr>
                        {rep.brand && <tr><th>Brand</th><td>{rep.brand} · {rep.year}</td></tr>}
                        {rep.company && <tr><th>Company</th><td>{rep.company}</td></tr>}
                        {rep.hired && rep.hiredFrom && <tr><th>Hired From</th><td>{rep.hiredFrom}</td></tr>}
                        {rep.site && <tr><th>Was At</th><td>{Array.isArray(rep.site) ? rep.site.at(-1) : rep.site}</td></tr>}
                        {cur.site && <tr><th>Now At</th><td>{Array.isArray(cur.site) ? cur.site.at(-1) : cur.site}</td></tr>}
                        {rep.rentRate && <tr><th>Rate</th><td>{rep.rentRate.basis} — {rep.rentRate.rate} {rep.rentRate.currency || 'QAR'}</td></tr>}
                        {rep.location && <tr><th>Location</th><td>{rep.location}</td></tr>}
                    </tbody>
                </table>

                <table className="detail-table" style={{ marginTop: '8px' }}>
                    <tbody>
                        <tr><th>Month / Year</th><td>{item.month} / {item.year}</td></tr>
                        {item.remarks && <tr><th>Remarks</th><td>{item.remarks}</td></tr>}
                    </tbody>
                </table>
            </>
        );
    };

    const renderDetailSiteReplacement = (item) => {
        const eq = item.currentEquipmentDetails || {};
        return (
            <>
                <div className="detail-hero">
                    <div className="detail-badge badge-site">SITE REPLACEMENT</div>
                    <h2 className="detail-title">{eq.machine || item.machine}</h2>
                    <p className="detail-reg">{eq.regNo || item.regNo}</p>
                </div>

                {eq.images?.length > 0 && renderImageSlider(eq.images, `site-${item.regNo}`)}

                <table className="detail-table">
                    <tbody>
                        <tr><th>Date</th><td>{formatDateFull(item.date)}</td></tr>
                        <tr><th>Time</th><td>{formatTime(item.time)}</td></tr>
                        <tr><th>Status</th><td><span className="status-chip" style={{ background: getStatusColor(item.status) }}>{item.status}</span></td></tr>
                        <tr><th>From Site</th><td>{item.currentSite || '—'}</td></tr>
                        <tr><th>To Site</th><td>{item.replacedSite || '—'}</td></tr>
                        {eq.brand && <tr><th>Brand</th><td>{eq.brand} · {eq.year}</td></tr>}
                        {eq.company && <tr><th>Company</th><td>{eq.company}</td></tr>}
                        {eq.hired && eq.hiredFrom && <tr><th>Hired From</th><td>{eq.hiredFrom}</td></tr>}
                        {eq.rentRate && <tr><th>{eq.hired ? 'Hire Rate' : 'Working Rate'}</th><td>{eq.rentRate.basis} — {eq.rentRate.rate} {eq.rentRate.currency || 'QAR'}</td></tr>}
                        {eq.location && <tr><th>Location</th><td>{eq.location}</td></tr>}
                        <tr><th>Month / Year</th><td>{item.month} / {item.year}</td></tr>
                        {item.remarks && <tr><th>Remarks</th><td>{item.remarks}</td></tr>}
                    </tbody>
                </table>
            </>
        );
    };

    // ─── Current list items ───────────────────────────────────────
    const getCurrentItems = () => {
        if (activeTab === 'recent') return recentActivities;
        if (activeTab === 'mobilizations') return mobilizations.filter(i => i.action !== 'status_changed').map(i => ({ ...i, activityType: 'mobilization' }));
        if (activeTab === 'replacements') return replacements.map(i => ({ ...i, activityType: 'replacement' }));
        if (activeTab === 'statusChanges') return mobilizations.filter(i => i.action === 'status_changed').map(i => ({ ...i, activityType: 'mobilization' }));
        return [];
    };

    const items = getCurrentItems();

    return (
        <div className="operations-activities-container">
            {/* Filter Controls Bar */}
            <div className="controls-bar">
                <div className="controls-row controls-row-main">
                    <Input type="select" value={selectedPeriod} onChange={handlePeriodChange}
                        options={[
                            { value: 'daily', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' },
                            { value: 'weekly', label: 'Last Week' }, { value: 'monthly', label: 'Last Month' },
                            { value: 'yearly', label: 'Last Year' }
                        ]}
                        colorScheme="violet-800" variant="gradient" font="md" squircle="4xl"
                        width="140px" height="38px" textColor="white-200" shadowPosition="to-bottom"
                        shadowColor="white-600" animation="none" fontWeight="500" inputPaddingInline="xl"
                    />
                    <Input type="select" value={selectedMonthRange} onChange={(e) => handleMonthsFilter(e.target.value)}
                        options={[
                            { value: '1', label: '1 Month' }, { value: '2', label: '2 Months' },
                            { value: '3', label: '3 Months' }, { value: '6', label: '6 Months' },
                            { value: '12', label: '12 Months' }
                        ]}
                        colorScheme="red-600" variant="gradient" font="md" squircle="4xl"
                        width="130px" height="38px" textColor="white-100" shadowPosition="to-bottom"
                        shadowColor="white-600" animation="none" inputPaddingInline="xl" fontWeight="500"
                    />
                    <div className="filter-group">
                        <Input type="date" name="startDate" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} colorScheme="yellow-300" variant="gradient" squircle="4xl" width="200px" height="38px" textColor="black-100" fontWeight="500" inputPaddingInline="xl" />
                        <Input type="date" name="endDate" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} colorScheme="yellow-300" variant="gradient" squircle="4xl" width="200px" height="38px" textColor="black-200" inputPaddingInline="xl" fontWeight="500" />
                        <Button text="Apply" onClick={handleDateRangeFilter} colorScheme="lime-500" variant="gradient" font="md" squircle="xl" width="90px" height="38px" textColor="black-200" shadowPosition="to-bottom" shadowColor="white-600" />
                    </div>
                    <div className="filter-group">
                        <Input type="date" name="singleDate" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} colorScheme="purple-400" variant="gradient" squircle="4xl" width="200px" height="38px" textColor="black-100" fontWeight="500" inputPaddingInline="xl" />
                        <Button text="Go" onClick={handleSingleDateFilter} colorScheme="purple-600" variant="gradient" font="md" squircle="xl" width="70px" height="38px" textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600" />
                    </div>
                </div>

                <div className="controls-row controls-row-time">
                    <div className="filter-group">
                        <span className="filter-label">Specific Time:</span>
                        <Input type="time" name="specificTime" value={specificTime} onChange={(e) => setSpecificTime(e.target.value)} colorScheme="cyan-700" variant="gradient" squircle="4xl" width="200px" height="38px" textColor="white-100" fontWeight="500" inputPaddingInline="xl" />
                        <Button text="Filter" onClick={handleSpecificTimeFilter} colorScheme="cyan-600" variant="gradient" font="sm" squircle="xl" width="80px" height="38px" textColor="white-200" />
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Time Range:</span>
                        <Input type="time" name="startTime" value={timeRange.start} onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })} colorScheme="teal-400" variant="gradient" squircle="4xl" width="200px" height="38px" textColor="black-100" fontWeight="500" inputPaddingInline="xl" />
                        <span className="filter-separator">to</span>
                        <Input type="time" name="endTime" value={timeRange.end} onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })} colorScheme="teal-400" variant="gradient" squircle="4xl" width="200px" height="38px" textColor="black-100" fontWeight="500" inputPaddingInline="xl" />
                        <Button text="Apply" onClick={handleTimeRangeFilter} colorScheme="teal-600" variant="gradient" font="sm" squircle="xl" width="80px" height="38px" textColor="white-200" />
                    </div>
                    {(specificTime || timeRange.start || timeRange.end) && (
                        <Button text="Clear Filters" onClick={clearTimeFilters} colorScheme="red-500" variant="gradient" font="sm" squircle="xl" width="120px" height="38px" textColor="white-200" />
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="activities-tabs">
                {['recent', 'mobilizations', 'replacements', 'statusChanges'].map((tab) => {
                    const labels = { recent: 'Recent Activities', mobilizations: 'Mobilizations', replacements: 'Replacements', statusChanges: 'Status Changes' };
                    return (
                        <Button key={tab} text={labels[tab]} onClick={() => { setActiveTab(tab); setSelectedItem(null); }}
                            colorScheme={activeTab === tab ? 'amber-500' : 'amber-900'} variant="gradient" font="md"
                            squircle="4xl" width="25%" height="48px"
                            textColor={activeTab === tab ? 'white-200' : 'gray-300'}
                            shadowPosition="to-bottom" shadowColor="white-600"
                        />
                    );
                })}
            </div>

            {isLoading ? (
                <Loader />
            ) : (
                <div className={`mail-layout ${selectedItem ? 'mail-layout-split' : ''}`}>
                    {/* Mail List */}
                    <div className="mail-list">
                        {items.length > 0
                            ? items.map(renderRow)
                            : <div className="no-activities"><p>No activities found</p></div>
                        }
                    </div>

                    {/* Detail Panel */}
                    {selectedItem && (
                        <div className="mail-detail">
                            <div className="mail-detail-header">
                                <button className="detail-close-btn" onClick={closeDetail}>&#x2715; Close</button>
                            </div>
                            <div className="mail-detail-body">
                                {renderDetailContent(selectedItem)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default OperationsActivities;