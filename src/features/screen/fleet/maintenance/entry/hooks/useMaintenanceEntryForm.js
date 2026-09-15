import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useAlert } from '@/shared/context/AlertContext';
import { useHeaderVibration } from '@/shared/context/VibrationContext';

import {
  fetchEquipmentByRegNo,
  createServiceHistory,
  fetchHistoryById,
  fetchReportById,
} from '../../history/api/maintenance.history.api';
import { saveServiceReport, updateServiceReport } from '../../report/form/api/maintenance.report.form.api';

import { ENTRY_TABS, DEFAULT_TOAST } from '../constants/maintenance.entry.constant';
import {
  buildDefaultEntryData,
  normaliseDate,
  calcNextService,
  applyOilServiceChecklist,
  applyServiceTypeChecklist,
  getMissingFieldsByTab,
} from '../helper/maintenance.entry.helper';

const HEADER_TITLE_BY_MODE = {
  create: 'New Service Record',
  addReport: 'Add Service Report',
  updateReport: 'Update Service Report',
};

export function useMaintenanceEntryForm() {
  const navigate = useNavigate();
  const {
    regNo: regNoParam,
    complaintId,
    serviceType: serviceTypeParam,
    historyId,
    reportId,
  } = useParams();

  const mode = reportId ? 'updateReport' : historyId ? 'addReport' : 'create';
  const isTypeLocked = mode !== 'create';

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert } = useAlert();
  const { triggerVibration } = useHeaderVibration();

  const [formData, setFormData] = useState(() => buildDefaultEntryData(regNoParam, serviceTypeParam));
  const [activeTab, setActiveTab] = useState(ENTRY_TABS.TYPE);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(mode !== 'create');
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);
  const [originalReportDate, setOriginalReportDate] = useState('');
  const [linkedHistoryId, setLinkedHistoryId] = useState(historyId || '');

  useEffect(() => {
    setHeaderTitle(HEADER_TITLE_BY_MODE[mode]);
    setHeaderSubtitle(formData.regNo || regNoParam || '');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, formData.regNo, regNoParam]);

  // Create mode: auto-fill equipment/operator from regNo
  useEffect(() => {
    if (mode !== 'create' || !formData.regNo) return;
    let cancelled = false;

    (async () => {
      try {
        const equipment = await fetchEquipmentByRegNo(formData.regNo);
        if (cancelled || !equipment) return;
        const lastCert = equipment.certificationBody?.[equipment.certificationBody.length - 1];
        setFormData((prev) => ({
          ...prev,
          equipment: equipment.machine || prev.equipment,
          operator: lastCert?.operatorName || prev.operator,
        }));
      } catch (err) {
        console.error('[useMaintenanceEntryForm] fetchEquipment:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [mode, formData.regNo]);

  // Add-report mode: prefill from the existing history record
  useEffect(() => {
    if (mode !== 'addReport') return;

    (async () => {
      try {
        const history = await fetchHistoryById(serviceTypeParam, historyId);
        setFormData((prev) => ({
          ...prev,
          serviceType: serviceTypeParam || prev.serviceType,
          regNo: history.regNo || prev.regNo,
          date: normaliseDate(history.date),
          equipment: history.equipment || prev.equipment,
          serviceHrs: history.serviceHrs || '',
          nextServiceHrs: history.nextServiceHrs || '',
          location: history.location || '',
          mechanics: history.mechanics || '',
          operator: history.operator || '',
          tyreModel: history.tyreModel || '',
          tyreNumber: history.tyreNumber || '',
          batteryModel: history.batteryModel || '',
          checklistItems: applyServiceTypeChecklist(serviceTypeParam, prev.checklistItems, history),
        }));
        setLinkedHistoryId(historyId);
        setActiveTab(ENTRY_TABS.REPORT);
      } catch (err) {
        console.error('[useMaintenanceEntryForm] fetchHistory:', err);
        showAlert('Failed to load service history data', 'error', '--color-error-500');
        triggerVibration();
      } finally {
        setIsPrefetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, serviceTypeParam, historyId]);

  // Update-report mode: prefill from the existing report record
  useEffect(() => {
    if (mode !== 'updateReport') return;

    (async () => {
      try {
        const report = await fetchReportById(reportId);
        const formattedDate = normaliseDate(report.date);
        setOriginalReportDate(formattedDate);
        setLinkedHistoryId(report.historyId || '');

        setFormData((prev) => ({
          ...prev,
          serviceType: serviceTypeParam || report.serviceType || prev.serviceType,
          regNo: report.regNo || '',
          date: formattedDate,
          equipment: report.machine || '',
          serviceHrs: report.serviceHrs || '',
          nextServiceHrs: report.nextServiceHrs || '',
          mechanics: report.mechanics || '',
          location: report.location || '',
          operator: report.operatorName || '',
          remarks: report.remarks || '',
          checklistItems: report.checklistItems?.length ? report.checklistItems : prev.checklistItems,
        }));
        setActiveTab(ENTRY_TABS.REPORT);
      } catch (err) {
        console.error('[useMaintenanceEntryForm] fetchReport:', err);
        showAlert('Failed to load service report data', 'error', '--color-error-500');
        triggerVibration();
      } finally {
        setIsPrefetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reportId, serviceTypeParam]);

  // Auto-calc next service hrs
  useEffect(() => {
    if (!formData.serviceHrs || formData.nextServiceHrs) return;
    setFormData((prev) => ({ ...prev, nextServiceHrs: calcNextService(prev.serviceHrs) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.serviceHrs]);

  // Keep oil checklist descriptions in sync with Check/Change selections
  useEffect(() => {
    if (formData.serviceType !== 'oil' && formData.serviceType !== 'normal') return;
    setFormData((prev) =>
      prev.serviceType === 'oil' || prev.serviceType === 'normal'
        ? { ...prev, checklistItems: applyOilServiceChecklist(prev.checklistItems, prev) }
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.oil, formData.oilFilter, formData.fuelFilter, formData.airFilter, formData.acFilter, formData.waterSeparator]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === 'fullService') {
      setFormData((prev) => ({ ...prev, fullService: value === 'true' || value === true }));
      return;
    }
    if (name === 'serviceHrs' || name === 'nextServiceHrs') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleTypeSelect = useCallback((type) => {
    setFormData((prev) => {
      if (mode !== 'create') return prev;
      return { ...prev, serviceType: type, checklistItems: applyServiceTypeChecklist(type, prev.checklistItems, prev) };
    });
  }, [mode]);

  const handleStatusChange = useCallback((id, status) => {
    setFormData((prev) => ({ ...prev, checklistItems: prev.checklistItems.map((item) => (item.id === id ? { ...item, status } : item)) }));
  }, []);

  const handleRangeStatusChange = useCallback((start, end, status) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) => (item.id >= start && item.id <= end ? { ...item, status } : item)),
    }));
  }, []);

  const missingByTab = useMemo(() => getMissingFieldsByTab(formData), [formData]);
  const tabHasWarning = useCallback((tabKey) => missingByTab[tabKey].length > 0, [missingByTab]);

  const closeToast = useCallback(() => setToastConfig(DEFAULT_TOAST), []);

  const handleSubmit = useCallback(async () => {
    const allMissing = [...missingByTab.type, ...missingByTab.history, ...missingByTab.report];
    if (allMissing.length > 0) {
      setToastConfig({ isOpen: true, type: 'error', message: 'Please fill all required fields before submitting', textColor: '#ffffff' });
      if (missingByTab.type.length) setActiveTab(ENTRY_TABS.TYPE);
      else if (missingByTab.history.length) setActiveTab(ENTRY_TABS.HISTORY);
      else setActiveTab(ENTRY_TABS.REPORT);
      return;
    }

    setIsLoading(true);

    try {
      let targetHistoryId = linkedHistoryId;

      if (mode === 'create') {
        const historyPayload = {
          serviceType: formData.serviceType,
          regNo: formData.regNo,
          date: formData.date,
          equipment: formData.equipment,
          serviceHrs: formData.serviceHrs,
          nextServiceHrs: formData.nextServiceHrs,
          location: formData.location,
          mechanics: formData.mechanics,
          operator: formData.operator,
          ...((formData.serviceType === 'oil' || formData.serviceType === 'normal') && {
            oil: formData.oil,
            oilFilter: formData.oilFilter,
            fuelFilter: formData.fuelFilter,
            acFilter: formData.acFilter,
            waterSeparator: formData.waterSeparator,
            airFilter: formData.airFilter,
            fullService: formData.fullService,
          }),
          ...(formData.serviceType === 'tyre' && { tyreModel: formData.tyreModel, tyreNumber: formData.tyreNumber }),
          ...(formData.serviceType === 'battery' && { batteryModel: formData.batteryModel }),
          ...(formData.serviceType === 'major' && { remarks: formData.remarks }),
        };

        const { response: historyResponse, result: historyResult } = await createServiceHistory(historyPayload);

        if (historyResponse.status === 409) {
          showAlert(historyResult.message || 'A record for this date already exists', 'warning', '#000000');
          setIsLoading(false);
          return;
        }
        if (!historyResponse.ok) throw new Error(historyResult.message || historyResult.error || 'Failed to save history record');

        targetHistoryId = historyResult.data?._id;
        setLinkedHistoryId(targetHistoryId);
      }

      const reportPayload = {
        serviceType: formData.serviceType,
        regNo: formData.regNo,
        machine: formData.equipment,
        serviceHrs: formData.serviceHrs,
        nextServiceHrs: formData.nextServiceHrs,
        mechanics: formData.mechanics,
        location: formData.location,
        date: formData.date,
        operatorName: formData.operator,
        remarks: formData.remarks,
        checklistItems: formData.checklistItems,
        ...(complaintId && { complaintId }),
        ...(targetHistoryId && { historyId: targetHistoryId }),
        ...(mode === 'updateReport' && originalReportDate && { previousDate: originalReportDate }),
      };

      const { response, result } =
        mode === 'updateReport'
          ? await updateServiceReport(reportId, reportPayload)
          : await saveServiceReport(reportPayload);

      if (!response.ok) throw new Error(result.message || result.error || 'Failed to save report');

      showAlert(
        mode === 'updateReport' ? 'Service report updated successfully!' : 'Service record saved successfully!',
        'done_all',
        '--color-primary'
      );
      triggerVibration();

      const finalHistoryId = targetHistoryId || linkedHistoryId || historyId;

      setTimeout(() => {
        navigate(`/service-document/${finalHistoryId}`, {
          state: {
            regNo: formData.regNo,
            date: formData.date,
            serviceType: formData.serviceType,
            historyId: finalHistoryId,
            docType: formData.serviceType,
          },
        });
      }, 1200);
    } catch (err) {
      console.error('[useMaintenanceEntryForm] handleSubmit:', err);
      showAlert(`Error: ${err.message}`, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  }, [mode, formData, missingByTab, linkedHistoryId, historyId, reportId, complaintId, originalReportDate, navigate, showAlert, triggerVibration]);

  return {
    mode,
    isTypeLocked,
    formData,
    activeTab,
    setActiveTab,
    isLoading,
    isPrefetching,
    toastConfig,
    closeToast,
    handleChange,
    handleTypeSelect,
    handleStatusChange,
    handleRangeStatusChange,
    missingByTab,
    tabHasWarning,
    handleSubmit,
  };
}

export default useMaintenanceEntryForm;