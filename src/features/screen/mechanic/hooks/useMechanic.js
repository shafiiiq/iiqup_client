import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePagination } from '@/shared/pagination/usePagination';
import {
    fetchAllMechanics,
    fetchRecentActivity,
    fetchMechanicAttendancePage,
    updateMechanic as requestMechanicUpdate,
    deleteMechanic as requestMechanicDelete,
} from '../api/mechanic.api';
import {
    ATTENDANCE_PAGE_LIMIT,
    DEFAULT_ATTENDANCE_FILTER,
    OVERVIEW_ACTIVITY_LIMIT,
    buildMechanicTreeItems,
} from '../constants/mechanic.constant';
import { buildAttendanceQuery } from '../helper/mechanic.helper';

const DEFAULT_PATH = ['overview'];

export const useMechanic = () => {
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activePath, setActivePath] = useState(DEFAULT_PATH);

    const [recentActivity, setRecentActivity] = useState([]);
    const [recentActivityLoading, setRecentActivityLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', userId: '' });
    const [actionError, setActionError] = useState(null);

    const [attendanceFilter, setAttendanceFilter] = useState(DEFAULT_ATTENDANCE_FILTER);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const isOverview = activePath[0] === 'overview';
    const selectedMechanicId = activePath[0] === 'mechanics' ? activePath[1] : null;
    const activeSection = activePath[0] === 'mechanics' ? activePath[2] : null;

    const mechanic = useMemo(
        () => mechanics.find((m) => m._id === selectedMechanicId) || null,
        [mechanics, selectedMechanicId]
    );

    const loadMechanics = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchAllMechanics();
            setMechanics(result.data || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load mechanics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMechanics();
    }, [loadMechanics]);

    useEffect(() => {
        if (!isOverview) return;

        let cancelled = false;
        const loadRecent = async () => {
            setRecentActivityLoading(true);
            try {
                const result = await fetchRecentActivity(OVERVIEW_ACTIVITY_LIMIT);
                if (!cancelled) setRecentActivity(result.data || []);
            } catch (err) {
                if (!cancelled) setRecentActivity([]);
            } finally {
                if (!cancelled) setRecentActivityLoading(false);
            }
        };
        loadRecent();

        return () => {
            cancelled = true;
        };
    }, [isOverview]);

    const fetchAttendance = useCallback(
        ({ page, limit }) =>
            fetchMechanicAttendancePage(
                mechanic?.zktecoPin,
                buildAttendanceQuery(attendanceFilter, dateRange),
                { page, limit }
            ),
        [mechanic, attendanceFilter, dateRange]
    );

    const attendancePagination = usePagination(fetchAttendance, { limit: ATTENDANCE_PAGE_LIMIT });

    useEffect(() => {
        if (activeSection === 'attendance' && mechanic?.zktecoPin && attendanceFilter !== 'date-range') {
            attendancePagination.fetchPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, mechanic, attendanceFilter]);

    const selectPath = (path) => {
        setActivePath(path);
        setIsEditing(false);
        setActionError(null);
    };

    const startEditing = () => {
        if (!mechanic) return;
        setIsEditing(true);
        setEditForm({ name: mechanic.name, userId: mechanic.userId || '' });
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({ name: '', userId: '' });
    };

    const updateEditField = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const saveEditing = async () => {
        if (!mechanic) return;
        try {
            const updated = await requestMechanicUpdate(mechanic._id, editForm);
            const updatedMechanic = updated.data || updated;
            setMechanics((prev) => prev.map((m) => (m._id === updatedMechanic._id ? updatedMechanic : m)));
            setIsEditing(false);
            setActionError(null);
        } catch (err) {
            setActionError('Failed to update mechanic');
        }
    };

    const removeMechanic = async () => {
        if (!mechanic) return false;
        try {
            await requestMechanicDelete(mechanic._id);
            setMechanics((prev) => prev.filter((m) => m._id !== mechanic._id));
            setActivePath(DEFAULT_PATH);
            setActionError(null);
            return true;
        } catch (err) {
            setActionError('Failed to delete mechanic');
            return false;
        }
    };

    const changeAttendanceFilter = (filterType) => setAttendanceFilter(filterType);
    const applyDateRange = () => attendancePagination.fetchPage(1);

    const treeItems = useMemo(() => buildMechanicTreeItems(mechanics), [mechanics]);

    return {
        loading,
        error,
        mechanics,
        treeItems,

        activePath,
        selectPath,
        isOverview,
        recentActivity,
        recentActivityLoading,

        mechanic,

        isEditing,
        editForm,
        startEditing,
        cancelEditing,
        updateEditField,
        saveEditing,
        removeMechanic,
        actionError,

        attendanceFilter,
        dateRange,
        setDateRange,
        changeAttendanceFilter,
        applyDateRange,

        attendanceRecords: attendancePagination.data,
        attendancePage: attendancePagination.page,
        attendanceTotalPages: attendancePagination.totalPages,
        attendanceLoading: attendancePagination.loading,
        goToAttendancePage: attendancePagination.fetchPage,
    };
};