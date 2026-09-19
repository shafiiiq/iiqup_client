import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

export const useIdleEquipmentList = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiRequest(`/equipments/export?status=idle&status=maintenance`, 'GET');
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'Failed to fetch idle equipment');
      setEquipmentList(data.data);
    } catch (err) {
      setError('Error loading idle equipment: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { equipmentList, isLoading, error, refetch: fetchList };
};