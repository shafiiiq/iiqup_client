import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

export const useEquipmentRecordsComparison = () => {
  const [comparedRegNos, setComparedRegNos] = useState([]);
  const [comparedEquipment, setComparedEquipment] = useState([]);
  const [isLoadingComparedEquipment, setIsLoadingComparedEquipment] = useState(false);

  const addComparedEquipment = useCallback((regNo) => {
    if (!regNo) return;
    setComparedRegNos((prev) => (prev.includes(regNo) ? prev : [...prev, regNo]));
  }, []);

  const removeComparedEquipment = useCallback((regNo) => {
    setComparedRegNos((prev) => prev.filter((r) => r !== regNo));
  }, []);

  const clearComparedEquipment = useCallback(() => {
    setComparedRegNos([]);
  }, []);

  useEffect(() => {
    if (!comparedRegNos.length) {
      setComparedEquipment([]);
      return undefined;
    }

    let isCancelled = false;
    setIsLoadingComparedEquipment(true);

    Promise.all(
      comparedRegNos.map(async (regNo) => {
        try {
          const response = await apiRequest(`/equipments/by-reg/${regNo}`, 'GET');
          const data = await response.json();
          return data.ok ? data.data : null;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (isCancelled) return;
      setComparedEquipment(results.filter(Boolean));
      setIsLoadingComparedEquipment(false);
    });

    return () => { isCancelled = true; };
  }, [comparedRegNos]);

  return {
    comparedRegNos,
    comparedEquipment,
    isLoadingComparedEquipment,
    addComparedEquipment,
    removeComparedEquipment,
    clearComparedEquipment,
  };
};