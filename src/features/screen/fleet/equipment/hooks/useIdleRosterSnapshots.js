import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

export const useIdleRosterSnapshots = () => {
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const response = await apiRequest(`/equipments/idle-roster/history?page=1&limit=20`, 'GET');
      const data = await response.json();
      if (data.ok) setHistory(data.data);
    } catch (err) {
      console.error('Failed to fetch idle roster history:', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const viewSnapshot = async (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedSnapshot(null);
      return;
    }
    try {
      const response = await apiRequest(`/equipments/idle-roster/${id}`, 'GET');
      const data = await response.json();
      if (data.ok) {
        setSelectedId(id);
        setSelectedSnapshot(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch idle roster snapshot:', err);
    }
  };

  const viewLatest = () => {
    setSelectedId(null);
    setSelectedSnapshot(null);
  };

  const saveSnapshot = async (equipmentList) => {
    setIsSaving(true);
    setError('');
    try {
      const entries = equipmentList.map((eq) => ({
        equipmentId: eq._id,
        regNo: eq.regNo,
        machine: eq.machine,
        brand: eq.brand,
        year: eq.year,
        status: eq.status,
        site: Array.isArray(eq.site) ? eq.site.at(-1) || '' : eq.site || '',
        idleAt: eq.idleAt || '',
        idleSite: eq.idleSite || '',
        operatorName: eq.certificationBody?.at(-1)?.operatorName || '',
        remarks: eq.remarks || '',
        mobDate: eq.mobDate || null,
        demobDate: eq.demobDate || null,
      }));

      const response = await apiRequest(`/equipments/idle-roster/save`, 'POST', { entries });
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'Failed to save idle list');
      await fetchHistory();
    } catch (err) {
      setError('Error saving idle list: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return { history, selectedId, selectedSnapshot, viewSnapshot, viewLatest, saveSnapshot, isSaving, error };
};