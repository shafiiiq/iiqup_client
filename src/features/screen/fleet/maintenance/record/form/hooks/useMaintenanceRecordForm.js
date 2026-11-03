import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useAlert } from '@/shared/context/AlertContext';
import { useHeaderVibration } from '@/shared/context/VibrationContext';

import { fetchEquipmentByRegNo, createMaintenance } from '../../../form/api/maintenance.form.api';
import { DEFAULT_TOAST } from '../../../form/constants/maintenance.form.constant';
import { buildCreatePayload, resolveEquipmentAutofill } from '../../../form/helper/maintenance.form.helper';
import { useEquipmentSearch } from '../../../form/hooks/useEquipmentSearch';
import { useEquipmentAutofill } from '../../../form/hooks/useEquipmentAutofill';
import {
  RECORD_FORM_SECTIONS,
  RECORD_FORM_SECTION_ORDER,
  RECORD_SUBMIT_STATUS,
} from '../constants/maintenance.record.form.constant';
import {
  buildRecordCard,
  buildInitialRecordCards,
  applyFormFieldChange,
  applyServiceTypeSelection,
  applyEquipmentAutofill,
  setChecklistItemStatus,
  setChecklistRangeStatus,
  getCompletedSessionIds,
} from '../helper/maintenance.record.form.helper';
import { applyHistoryChange } from '../../../form/helper/maintenance.form.helper';
import { validateRecordCards } from '../validation/maintenance.record.form.validation';
import { useMaintenanceRecordAttachments } from './useMaintenanceRecordAttachments';

export function useMaintenanceRecordForm() {
  const { regNo: regNoParam } = useParams();
  const hasUrlRegNo = Boolean(regNoParam);

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();
  const { triggerVibration } = useHeaderVibration();

  const [cards, setCards] = useState(() => buildInitialRecordCards(regNoParam));
  const [activeCardId, setActiveCardId] = useState(() => cards[0]?.id);
  const [activeSection, setActiveSection] = useState(RECORD_FORM_SECTIONS.EQUIPMENT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);

  const equipmentSearch = useEquipmentSearch();
  const attachmentActions = useMaintenanceRecordAttachments({ cards, setCards });

  const activeCardIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeCardId)
  );
  const activeCard = cards[activeCardIndex];

  const updateCard = useCallback((cardId, updater) => {
    setCards((previous) => previous.map((card) => (card.id === cardId ? updater(card) : card)));
  }, []);

  const { scheduleAutofill } = useEquipmentAutofill((regNo, autofill) => {
    updateCard(activeCard.id, (card) =>
      card.formData.regNo.trim() === regNo
        ? { ...card, formData: applyEquipmentAutofill(card.formData, autofill) }
        : card
    );
  });

  useEffect(() => {
    setHeaderTitle('Multi Record Entry');
    setHeaderSubtitle(regNoParam || 'Multiple Equipment');
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [regNoParam, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (!hasUrlRegNo) return undefined;
    let isCancelled = false;

    (async () => {
      try {
        const equipment = await fetchEquipmentByRegNo(regNoParam);
        if (isCancelled || !equipment) return;
        const autofill = resolveEquipmentAutofill(equipment);
        setCards((previous) =>
          previous.map((card) => ({
            ...card,
            formData: { ...applyEquipmentAutofill(card.formData, autofill), regNo: String(equipment.regNo) },
          }))
        );
      } catch (error) {
        console.error('[useMaintenanceRecordForm] fetchEquipment:', error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [hasUrlRegNo, regNoParam]);

  const handleFieldChange = useCallback(
    (cardId, event) => {
      const { name, value } = event.target;
      updateCard(cardId, (card) => ({ ...card, formData: applyFormFieldChange(card.formData, name, value) }));
    },
    [updateCard]
  );

  const handleTypeSelect = useCallback(
    (cardId, serviceType) => updateCard(cardId, (card) => applyServiceTypeSelection(card, serviceType)),
    [updateCard]
  );

  const handleEquipmentSelect = useCallback(
    (cardId, equipment) => {
      const autofill = resolveEquipmentAutofill(equipment);
      updateCard(cardId, (card) => ({
        ...card,
        formData: { ...applyEquipmentAutofill(card.formData, autofill), regNo: String(equipment.regNo) },
      }));
    },
    [updateCard]
  );

  const handleRegNoInput = useCallback(
    (cardId, value) => {
      updateCard(cardId, (card) => ({ ...card, formData: { ...card.formData, regNo: value } }));
      equipmentSearch.searchEquipments(value);
      scheduleAutofill(value);
    },
    [updateCard, equipmentSearch, scheduleAutofill]
  );

  const handleHistoryChange = useCallback(
    (cardId, field, value) => {
      updateCard(cardId, (card) => ({
        ...card,
        history: applyHistoryChange(card.history, field, value, card.formData.serviceType),
      }));
    },
    [updateCard]
  );

  const handleStatusChange = useCallback(
    (cardId, itemId, status) =>
      updateCard(cardId, (card) => ({ ...card, formData: setChecklistItemStatus(card.formData, itemId, status) })),
    [updateCard]
  );

  const handleRangeStatusChange = useCallback(
    (cardId, rangeStart, rangeEnd, status) =>
      updateCard(cardId, (card) => ({
        ...card,
        formData: setChecklistRangeStatus(card.formData, rangeStart, rangeEnd, status),
      })),
    [updateCard]
  );

  const handleAddRecord = () => {
    const referenceFormData = cards[0].formData;
    const newCard = buildRecordCard({
      regNo: referenceFormData.regNo || regNoParam || '',
      equipment: referenceFormData.equipment,
      operator: referenceFormData.operator,
    });
    setCards((previous) => [...previous, newCard]);
    setActiveCardId(newCard.id);
    setActiveSection(RECORD_FORM_SECTIONS.EQUIPMENT);
  };

  const handleRemoveRecord = (cardId) => {
    if (cards.length <= 1) return;
    const removedCard = cards.find((card) => card.id === cardId);
    const remainingCards = cards.filter((card) => card.id !== cardId);
    attachmentActions.releasePreviews([removedCard]);
    setCards(remainingCards);
    if (cardId === activeCardId) setActiveCardId(remainingCards[0].id);
  };

  const handleResetAll = () => {
    attachmentActions.releasePreviews(cards);
    const freshCards = buildInitialRecordCards(regNoParam);
    setCards(freshCards);
    setActiveCardId(freshCards[0].id);
    setActiveSection(RECORD_FORM_SECTIONS.EQUIPMENT);
  };

  const handleTabSelect = ([cardId, sectionKey]) => {
    setActiveCardId(cardId);
    setActiveSection(sectionKey || RECORD_FORM_SECTIONS.EQUIPMENT);
  };

  const activeSectionIndex = RECORD_FORM_SECTION_ORDER.indexOf(activeSection);
  const isLastSection = activeSectionIndex === RECORD_FORM_SECTION_ORDER.length - 1;

  const handleNextSection = () => setActiveSection(RECORD_FORM_SECTION_ORDER[activeSectionIndex + 1]);

  const closeToast = useCallback(() => setToastConfig(DEFAULT_TOAST), []);

  const showErrorToast = (message) => setToastConfig({ isOpen: true, type: 'error', message, textColor: '#ffffff' });

  const handleSubmit = async () => {
    const pendingCards = cards.filter((card) => card.submitStatus !== RECORD_SUBMIT_STATUS.SUCCESS);
    if (pendingCards.length === 0) return;

    const validationIssue = validateRecordCards(cards);
    if (validationIssue) {
      showErrorToast(validationIssue.message);
      setActiveCardId(validationIssue.cardId);
      setActiveSection(validationIssue.section);
      return;
    }

    setIsSubmitting(true);
    let failedCount = 0;

    for (const card of pendingCards) {
      try {
        const { response, result } = await createMaintenance(
          buildCreatePayload({
            formData: card.formData,
            history: card.history,
            attachmentSessionIds: getCompletedSessionIds(card),
          })
        );

        if (response.ok && result.ok) {
          updateCard(card.id, (current) => ({
            ...current,
            submitStatus: RECORD_SUBMIT_STATUS.SUCCESS,
            submitError: '',
          }));
        } else {
          failedCount++;
          updateCard(card.id, (current) => ({
            ...current,
            submitStatus: RECORD_SUBMIT_STATUS.FAILED,
            submitError: result.message || result.error || 'Failed to save maintenance record',
          }));
        }
      } catch (error) {
        failedCount++;
        updateCard(card.id, (current) => ({
          ...current,
          submitStatus: RECORD_SUBMIT_STATUS.FAILED,
          submitError: error.message || 'Network error',
        }));
      }
    }

    setIsSubmitting(false);

    if (failedCount === 0) {
      showAlert(`${pendingCards.length} records saved!`, 'done_all', '--color-primary');
    } else {
      showAlert(`${failedCount} record(s) failed — fix the highlighted records and resubmit`, 'error', '--color-error-500');
    }
    triggerVibration();
  };

  return {
    cards,
    activeCard,
    activeCardIndex,
    activeCardId,
    activeSection,
    isLastSection,
    isSubmitting,
    toastConfig,
    closeToast,
    hasUrlRegNo,
    equipmentSearch,
    attachmentActions,
    handleFieldChange,
    handleTypeSelect,
    handleEquipmentSelect,
    handleRegNoInput,
    handleHistoryChange,
    handleStatusChange,
    handleRangeStatusChange,
    handleAddRecord,
    handleRemoveRecord,
    handleResetAll,
    handleTabSelect,
    handleNextSection,
    handleSubmit,
  };
}