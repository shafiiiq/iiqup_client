import { useRef, useCallback, useEffect } from 'react';
import { fetchEquipmentByRegNo } from '../api/maintenance.form.api';
import { resolveEquipmentAutofill } from '../helper/maintenance.form.helper';
import { EQUIPMENT_AUTOFILL_DEBOUNCE_MS } from '../constants/maintenance.form.constant';

export function useEquipmentAutofill(onAutofill) {
  const timerRef = useRef(null);
  const onAutofillRef = useRef(onAutofill);
  onAutofillRef.current = onAutofill;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const scheduleAutofill = useCallback((regNo) => {
    clearTimeout(timerRef.current);
    const trimmedRegNo = String(regNo || '').trim();
    if (!trimmedRegNo) return;

    timerRef.current = setTimeout(async () => {
      try {
        const equipment = await fetchEquipmentByRegNo(trimmedRegNo);
        if (equipment) onAutofillRef.current(trimmedRegNo, resolveEquipmentAutofill(equipment));
      } catch {
        return;
      }
    }, EQUIPMENT_AUTOFILL_DEBOUNCE_MS);
  }, []);

  return { scheduleAutofill };
}