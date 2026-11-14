import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useAlert } from '@/shared/context/AlertContext';
import { useHeaderVibration } from '@/shared/context/VibrationContext';

import { fetchMaintenanceById } from '../../report/api/maintenance.api';
import { fetchEquipmentByRegNo, createMaintenance, updateMaintenance } from '../api/maintenance.form.api';
import { FORM_SECTIONS, FORM_SECTION_ORDER, DEFAULT_TOAST } from '../constants/maintenance.form.constant';
import { isOilOrNormalService } from '../../helper/maintenance.helper';
import {
  buildEmptyHistory,
  buildDefaultFormData,
  buildChecklistForServiceType,
  applyOilChecklistDescriptions,
  applyHistoryChange,
  recalculateHistoryForServiceType,
  resolveEquipmentAutofill,
  mapMaintenanceToFormData,
  mapMaintenanceToHistory,
  getMissingFieldsBySection,
  buildCreatePayload,
  buildUpdatePayload,
} from '../helper/maintenance.form.helper';
import { useMaintenanceAttachments } from './useMaintenanceAttachments';
import { useEquipmentSearch } from './useEquipmentSearch';
import { useEquipmentAutofill } from './useEquipmentAutofill';

const HEADER_TITLE_BY_MODE = {
  create: 'New Maintenance Record',
  edit: 'Edit Maintenance Record',
};

export function useMaintenanceForm() {
  const navigate = useNavigate();
  const { regNo: regNoParam, complaintId, maintenanceId } = useParams();

  const mode = maintenanceId ? 'edit' : 'create';
  const isEquipmentLocked = mode === 'edit' || Boolean(regNoParam);

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();
  const { triggerVibration } = useHeaderVibration();
  const attachmentState = useMaintenanceAttachments();
  const equipmentSearch = useEquipmentSearch();

  const [formData, setFormData] = useState(() => buildDefaultFormData(regNoParam));
  const [history, setHistory] = useState(() => buildEmptyHistory());
  const [activeSection, setActiveSection] = useState(FORM_SECTIONS.TYPE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(mode === 'edit');
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);

  const { loadExistingAttachments } = attachmentState;

  const { scheduleAutofill } = useEquipmentAutofill((regNo, autofill) => {
    setFormData((previous) =>
      previous.regNo.trim() === regNo
        ? { ...previous, equipment: autofill.equipment || previous.equipment, operator: autofill.operator }
        : previous
    );
  });

  useEffect(() => {
    setHeaderTitle(HEADER_TITLE_BY_MODE[mode]);
    setHeaderSubtitle(formData.regNo || '');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [mode, formData.regNo, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (mode !== 'create' || !regNoParam) return undefined;
    let isCancelled = false;

    (async () => {
      try {
        const equipment = await fetchEquipmentByRegNo(regNoParam);
        if (isCancelled || !equipment) return;
        const autofill = resolveEquipmentAutofill(equipment);
        setFormData((previous) => ({
          ...previous,
          equipment: autofill.equipment || previous.equipment,
          operator: autofill.operator || previous.operator,
        }));
      } catch (error) {
        console.error('[useMaintenanceForm] fetchEquipment:', error);
      }
    })();

    return () => { isCancelled = true; };
  }, [mode, regNoParam]);

  useEffect(() => {
    if (mode !== 'edit') return;

    (async () => {
      try {
        const record = await fetchMaintenanceById(maintenanceId);
        setFormData(mapMaintenanceToFormData(record));
        setHistory(mapMaintenanceToHistory(record));
        loadExistingAttachments(record.attachments || []);
        setActiveSection(FORM_SECTIONS.HISTORY);
      } catch (error) {
        console.error('[useMaintenanceForm] fetchMaintenance:', error);
        showAlert('Failed to load maintenance record', 'error', '--color-error-500');
        triggerVibration();
      } finally {
        setIsPrefetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, maintenanceId]);

  useEffect(() => {
    if (isPrefetching || !isOilOrNormalService(formData.serviceType)) return;
    setFormData((previous) => ({
      ...previous,
      checklistItems: applyOilChecklistDescriptions(previous.checklistItems, previous),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPrefetching,
    formData.oil,
    formData.oilFilter,
    formData.fuelFilter,
    formData.airFilter,
    formData.acFilter,
    formData.waterSeparator,
  ]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleTypeSelect = useCallback(
    (serviceType) => {
      setFormData((previous) => ({
        ...previous,
        serviceType,
        checklistItems: buildChecklistForServiceType(serviceType, previous),
      }));
      setHistory((previous) => recalculateHistoryForServiceType(previous, serviceType));
    },
    []
  );

  const handleEquipmentSelect = useCallback((equipment) => {
    const autofill = resolveEquipmentAutofill(equipment);
    setFormData((previous) => ({
      ...previous,
      regNo: String(equipment.regNo),
      equipment: autofill.equipment,
      operator: autofill.operator || previous.operator,
    }));
  }, []);

  const handleRegNoInput = useCallback(
    (value) => {
      setFormData((previous) => ({ ...previous, regNo: value }));
      equipmentSearch.searchEquipments(value);
      scheduleAutofill(value);
    },
    [equipmentSearch, scheduleAutofill]
  );

  const handleHistoryChange = useCallback(
    (field, value) => {
      setHistory((previous) => applyHistoryChange(previous, field, value, formData.serviceType));
    },
    [formData.serviceType]
  );

  const handleStatusChange = useCallback((itemId, status) => {
    setFormData((previous) => ({
      ...previous,
      checklistItems: previous.checklistItems.map((item) => (item.id === itemId ? { ...item, status } : item)),
    }));
  }, []);

  const handleRangeStatusChange = useCallback((rangeStart, rangeEnd, status) => {
    setFormData((previous) => ({
      ...previous,
      checklistItems: previous.checklistItems.map((item) =>
        item.id >= rangeStart && item.id <= rangeEnd ? { ...item, status } : item
      ),
    }));
  }, []);

  const activeSectionIndex = FORM_SECTION_ORDER.indexOf(activeSection);
  const isLastSection = activeSectionIndex === FORM_SECTION_ORDER.length - 1;

  const handleNextSection = useCallback(() => {
    setActiveSection(FORM_SECTION_ORDER[activeSectionIndex + 1]);
  }, [activeSectionIndex]);

  const missingBySection = useMemo(() => getMissingFieldsBySection(formData, history), [formData, history]);
  const sectionHasWarning = useCallback((section) => missingBySection[section].length > 0, [missingBySection]);

  const closeToast = useCallback(() => setToastConfig(DEFAULT_TOAST), []);

  const showErrorToast = (message) => setToastConfig({ isOpen: true, type: 'error', message, textColor: '#ffffff' });

  const handleSubmit = useCallback(async () => {
    const firstIncompleteSection = FORM_SECTION_ORDER.find((section) => missingBySection[section].length > 0);
    if (firstIncompleteSection) {
      showErrorToast('Please fill all required fields before submitting');
      setActiveSection(firstIncompleteSection);
      return;
    }
    if (attachmentState.hasUploadingAttachment) {
      showErrorToast('Please wait for attachment uploads to finish');
      setActiveSection(FORM_SECTIONS.ATTACHMENTS);
      return;
    }
    if (attachmentState.hasFailedAttachment) {
      showErrorToast('Remove failed attachment uploads before submitting');
      setActiveSection(FORM_SECTIONS.ATTACHMENTS);
      return;
    }

    setIsSubmitting(true);

    try {
      const attachmentSessionIds = attachmentState.completedSessionIds;
      const { response, result } =
        mode === 'edit'
          ? await updateMaintenance(maintenanceId, buildUpdatePayload({ formData, history, attachmentSessionIds }))
          : await createMaintenance(buildCreatePayload({ formData, history, attachmentSessionIds, complaintId }));

      if (response.status === 409) {
        showAlert(result.message || 'A record for this date already exists', 'warning', '#000000');
        return;
      }
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to save maintenance record');

      showAlert(
        mode === 'edit' ? 'Maintenance record updated successfully!' : 'Maintenance record saved successfully!',
        'done_all',
        '--color-primary'
      );
      triggerVibration();

      const savedRecords = Array.isArray(result.data) ? result.data : [result.data];
      const destination =
        savedRecords.length === 1 ? `/maintenance/report/${savedRecords[0]._id}` : `/maintenance/list/${formData.regNo}`;

      setTimeout(() => navigate(destination), 1200);
    } catch (error) {
      console.error('[useMaintenanceForm] handleSubmit:', error);
      showAlert(`Error: ${error.message}`, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode,
    maintenanceId,
    complaintId,
    formData,
    history,
    missingBySection,
    attachmentState,
    navigate,
    showAlert,
    triggerVibration,
  ]);

  return {
    mode,
    isEquipmentLocked,
    formData,
    history,
    activeSection,
    setActiveSection,
    isSubmitting,
    isPrefetching,
    toastConfig,
    closeToast,
    equipmentSearch,
    attachmentState,
    handleChange,
    handleTypeSelect,
    handleEquipmentSelect,
    handleRegNoInput,
    handleHistoryChange,
    handleStatusChange,
    handleRangeStatusChange,
    sectionHasWarning,
    isLastSection,
    handleNextSection,
    handleSubmit,
  };
}

export default useMaintenanceForm;