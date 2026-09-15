import { useState, useEffect, useCallback } from 'react';
import { fetchFilteredActivities, fetchRecentActivities } from '../api/operation.api';
import { formatDateForAPI } from '../helper/operation.helper';

const RECENT_LIMIT = 50;

const useOperations = () => {
    const [activePath, setActivePath] = useState(['recent']);
    const activeTab = activePath[activePath.length - 1];

    const [mobilizations, setMobilizations] = useState([]);
    const [replacements, setReplacements] = useState([]);
    const [isFilteredLoading, setIsFilteredLoading] = useState(true);

    const [recentActivities, setRecentActivities] = useState([]);
    const [isRecentLoading, setIsRecentLoading] = useState(true);

    const [specificTime, setSpecificTime] = useState('');
    const [timeRange, setTimeRange] = useState({ start: '', end: '' });
    const [singleDate, setSingleDate] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedMonthRange, setSelectedMonthRange] = useState('1');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const loadRecent = useCallback(async () => {
        setIsRecentLoading(true);
        try {
            const { mobilizations: fetchedMobilizations, replacements: fetchedReplacements } = await fetchRecentActivities();

            const combined = [
                ...fetchedMobilizations.map((item) => ({ ...item, activityType: 'mobilization' })),
                ...fetchedReplacements.map((item) => ({ ...item, activityType: 'replacement' })),
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, RECENT_LIMIT);

            setRecentActivities(combined);
        } catch (error) {
            console.error('Error fetching recent activities:', error);
        } finally {
            setIsRecentLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecent();
    }, [loadRecent]);

    const fetchActivitiesWithFilter = async (filterType = selectedPeriod, startDate = null, endDate = null, months = null) => {
        setIsFilteredLoading(true);
        try {
            const { mobilizations: fetchedMobilizations, replacements: fetchedReplacements } = await fetchFilteredActivities({
                filterType,
                specificTime,
                timeRange,
                startDate,
                endDate,
                months,
            });

            setMobilizations(fetchedMobilizations);
            setReplacements(fetchedReplacements);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsFilteredLoading(false);
        }
    };

    useEffect(() => {
        fetchActivitiesWithFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPeriod, selectedMonthRange]);

    const handleSingleDateFilter = () => {
        if (singleDate) fetchActivitiesWithFilter('single', formatDateForAPI(singleDate));
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

    const getCurrentItems = () => {
        if (activeTab === 'recent') return recentActivities;
        if (activeTab === 'mobilization') return mobilizations.filter((i) => i.action === 'mobilized').map((i) => ({ ...i, activityType: 'mobilization' }));
        if (activeTab === 'demobilization') return mobilizations.filter((i) => i.action === 'demobilized').map((i) => ({ ...i, activityType: 'mobilization' }));
        if (activeTab === 'statusChanges') return mobilizations.filter((i) => i.action === 'status_changed').map((i) => ({ ...i, activityType: 'mobilization' }));
        if (activeTab === 'operatorReplacements') return replacements.filter((i) => i.type === 'operator').map((i) => ({ ...i, activityType: 'replacement' }));
        if (activeTab === 'equipmentReplacements') return replacements.filter((i) => i.type === 'equipment').map((i) => ({ ...i, activityType: 'replacement' }));
        return [];
    };

    const items = getCurrentItems();
    const isLoading = activeTab === 'recent' ? isRecentLoading : isFilteredLoading;

    return {
        activePath,
        setActivePath,
        activeTab,
        isLoading,
        specificTime,
        setSpecificTime,
        timeRange,
        setTimeRange,
        singleDate,
        setSingleDate,
        selectedPeriod,
        selectedMonthRange,
        dateRange,
        setDateRange,
        items,
        handleSingleDateFilter,
        handleSpecificTimeFilter,
        handleTimeRangeFilter,
        clearTimeFilters,
        handlePeriodChange,
        handleMonthsFilter,
        handleDateRangeFilter,
    };
};

export default useOperations;