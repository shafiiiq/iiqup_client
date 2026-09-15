import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useHeaderTitle }        from '@/shared/context/TitleContext';
import { fetchEquipmentByRegNo } from '../../../history/api/maintenance.history.api';
import { saveBatchServiceHistory } from '../api/maintenance.record.form.api';
import { useAlert }              from '@/shared/context/AlertContext';
import { useHeaderVibration }    from '@/shared/context/VibrationContext';

import { DEFAULT_TOAST, INITIAL_CARDS_COUNT } from '../constants/maintenance.record.form.constant';
import { buildCard, groupCardsByRegAndType, buildBatchPayload, markCardsStatus } from '../helper/maintenance.record.form.helper';
import { validateRecordCards } from '../validation/maintenance.record.form.validation';

const buildInitialCards = (regNo) => Array.from({ length: INITIAL_CARDS_COUNT }, () => buildCard(regNo || ''));

export function useMaintenanceRecordForm() {
  const { regNo: urlRegNo } = useParams();
  const hasUrlRegNo = Boolean(urlRegNo);

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert }        = useAlert();
  const { triggerVibration } = useHeaderVibration();

  const [cards,       setCards]       = useState(() => buildInitialCards(urlRegNo));
  // Which record the single shared Tabs bar currently has selected.
  const [activeCardId, setActiveCardId] = useState(() => cards[0]?.id);
  const [isLoading,   setIsLoading]   = useState(false);
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);

  useEffect(() => {
    setHeaderTitle('Multi Record Entry');
    setHeaderSubtitle(urlRegNo || 'Multiple Equipment');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [urlRegNo, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (!hasUrlRegNo) return;

    const fetchEquipment = async () => {
      try {
        const found = await fetchEquipmentByRegNo(urlRegNo);
        if (!found) return;

        const lastCert = found.certificationBody?.[found.certificationBody.length - 1];
        const operator = lastCert?.operatorName || '';

        setCards((prev) => prev.map((card) => ({
          ...card,
          regNo:    String(found.regNo),
          machine:  found.machine || '',
          operator,
        })));
      } catch (err) {
        console.error('[useMaintenanceRecordForm] fetchEquipment:', err);
      }
    };

    fetchEquipment();
  }, [hasUrlRegNo, urlRegNo]);

  const handleCardChange = useCallback((id, field, val) => {
    if (field === '__bulk') {
      setCards((prev) => prev.map((card) => (card.id === id ? { ...card, ...val } : card)));
    } else {
      setCards((prev) => prev.map((card) => (card.id === id ? { ...card, [field]: val } : card)));
    }
  }, []);

  const addCard = () => {
    const reference = cards[0];
    const newCard = buildCard(reference?.regNo || urlRegNo || '', reference?.machine || '', reference?.operator || '');
    setCards((prev) => [...prev, newCard]);
    // Jump straight to the new record so the person can start filling it in.
    setActiveCardId(newCard.id);
  };

  const removeCard = (id) => {
    setCards((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((card) => card.id !== id);
      if (id === activeCardId) setActiveCardId(next[0]?.id);
      return next;
    });
  };

  const resetAll = () => {
    const next = buildInitialCards(urlRegNo);
    setCards(next);
    setActiveCardId(next[0]?.id);
  };

  const closeToast = () => setToastConfig(DEFAULT_TOAST);

  const showToast = (message, type = 'error', textColor = '#ffffff') =>
    setToastConfig({ isOpen: true, type, message, textColor });

  const handleSubmit = async () => {
    const validationError = validateRecordCards(cards);
    if (validationError) {
      showToast(validationError.message, validationError.type, validationError.textColor);
      return;
    }

    setIsLoading(true);
    setCards((prev) => prev.map((card) => ({ ...card, _status: 'idle', _error: '' })));

    const groups = groupCardsByRegAndType(cards);

    let allOk    = true;
    let errorMsg = '';
    let nextCards = cards.map((card) => ({ ...card, _status: 'idle', _error: '' }));

    for (const groupCards of Object.values(groups)) {
      const ids     = groupCards.map((card) => card.id);
      const payload = buildBatchPayload(groupCards);

      try {
        const { response, result } = await saveBatchServiceHistory(payload);

        if (response.ok && result.ok) {
          nextCards = markCardsStatus(nextCards, ids, 'success');
        } else {
          allOk    = false;
          errorMsg = result.message || 'Server rejected this batch — fix issues and resubmit';

          const serverErrors = Array.isArray(result.errors) ? result.errors : [];
          const errorsById   = {};
          groupCards.forEach((card, localIdx) => {
            errorsById[card.id] = serverErrors[localIdx] || result.message || 'Rejected by server';
          });

          nextCards = markCardsStatus(nextCards, ids, 'failed', errorsById);
        }
      } catch (err) {
        allOk    = false;
        errorMsg = err.message || 'Network error';

        const errorsById = {};
        groupCards.forEach((card) => { errorsById[card.id] = err.message; });

        nextCards = markCardsStatus(nextCards, ids, 'failed', errorsById);
      }
    }

    setCards(nextCards);
    setIsLoading(false);

    if (allOk) {
      showAlert(`All ${cards.length} records saved!`, 'done_all', '--color-primary');
      triggerVibration();
    } else {
      showAlert(errorMsg || 'Submission failed — fix the highlighted records and resubmit', 'error', '--color-error-500');
      triggerVibration();
    }
  };

  return {
    cards,
    activeCardId,
    setActiveCardId,
    isLoading,
    toastConfig,
    hasUrlRegNo,
    handleCardChange,
    addCard,
    removeCard,
    resetAll,
    handleSubmit,
    closeToast,
  };
}