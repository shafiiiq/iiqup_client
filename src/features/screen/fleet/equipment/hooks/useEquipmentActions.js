import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderVibration } from '@/shared/context/VibrationContext';
import { apiRequest } from '@/features/core/network/api/api.request';
import { getOperatorName, getOperatorId } from '../helper/equipment.helper';
import { buildSearchUrl, extractSearchResult } from '@/shared/search/search.util';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';
import {
  buildAddEquipmentPayload,
  buildUpdateEquipmentPayload,
  buildOutsideEquipmentPayload,
  buildMobilizePayload,
  buildAddShiftPayload,
  buildDemobilizePayload,
  buildReplaceOperatorPayload,
  buildReplaceEquipmentPayload,
  buildEditFormFromEquipment,
  buildReplaceOperatorFormFromEquipment,
} from '../helper/equipment.form.helper';
import {
  EQUIPMENT_ADD_FORM_DEFAULTS,
  EQUIPMENT_EDIT_FORM_DEFAULTS,
  EQUIPMENT_OUTSIDE_FORM_DEFAULTS,
  EQUIPMENT_DEMOBILIZE_FORM_DEFAULTS,
  EQUIPMENT_ADD_SHIFT_FORM_DEFAULTS,
  EQUIPMENT_MOBILIZE_FORM_DEFAULTS,
  EQUIPMENT_REPLACE_OPERATOR_FORM_DEFAULTS,
  EQUIPMENT_REPLACE_EQUIPMENT_FORM_DEFAULTS,
  EQUIPMENT_DEFAULT_EXPORT_COLUMNS,
  EQUIPMENT_FUEL_PROGRESS_TICK_MS,
  EQUIPMENT_FUEL_PROGRESS_HOLD_MS,
  EQUIPMENT_FUEL_SIDEBAR_OPEN_DELAY_MS,
} from '../constants/equipment.constant';

const IDLE_LOCATION_FORM_DEFAULTS = { idleAt: 'garage', idleSite: '' };
const REMARKS_FORM_DEFAULTS = { remarks: '' };

export const useEquipmentActions = ({ fetchEquipments, fetchSitesForDropdown, operator }) => {
  const navigate = useNavigate();
  const { triggerVibration } = useHeaderVibration();

  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addEquipmentForm, setAddEquipmentForm] = useState(EQUIPMENT_ADD_FORM_DEFAULTS);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);
  const [editFormData, setEditFormData] = useState(EQUIPMENT_EDIT_FORM_DEFAULTS);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  const [showOutsideEquipmentModal, setShowOutsideEquipmentModal] = useState(false);
  const [outsideEquipmentForm, setOutsideEquipmentForm] = useState(EQUIPMENT_OUTSIDE_FORM_DEFAULTS);

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState(null);
  const [sidebarTitle, setSidebarTitle] = useState('');
  const [isLoadingFuels, setIsLoadingFuels] = useState(false);
  const [showFuelProgressModal, setShowFuelProgressModal] = useState(false);
  const [fuelProgress, setFuelProgress] = useState(0);

  const [showNoResultsModal, setShowNoResultsModal] = useState(false);

  const [showMobilizeModal, setShowMobilizeModal] = useState(false);
  const [mobilizeForm, setMobilizeForm] = useState(EQUIPMENT_MOBILIZE_FORM_DEFAULTS);

  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [addShiftForm, setAddShiftForm] = useState(EQUIPMENT_ADD_SHIFT_FORM_DEFAULTS);

  const [showDemobilizeModal, setShowDemobilizeModal] = useState(false);
  const [demobilizeDatePrompt, setDemobilizeDatePrompt] = useState(false);
  const [demobilizeForm, setDemobilizeForm] = useState(EQUIPMENT_DEMOBILIZE_FORM_DEFAULTS);

  const [showReplaceOperatorModal, setShowReplaceOperatorModal] = useState(false);
  const [replaceOperatorForm, setReplaceOperatorForm] = useState(EQUIPMENT_REPLACE_OPERATOR_FORM_DEFAULTS);

  const [showReplaceEquipmentModal, setShowReplaceEquipmentModal] = useState(false);
  const [replaceEquipmentForm, setReplaceEquipmentForm] = useState(EQUIPMENT_REPLACE_EQUIPMENT_FORM_DEFAULTS);
  const [replaceEquipmentResults, setReplaceEquipmentResults] = useState([]);

  const [selectedEquipmentForAction, setSelectedEquipmentForAction] = useState(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState(EQUIPMENT_DEFAULT_EXPORT_COLUMNS);

  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [equipmentToMarkSold, setEquipmentToMarkSold] = useState(null);

  const [showIdleLocationModal, setShowIdleLocationModal] = useState(false);
  const [idleLocationForm, setIdleLocationForm] = useState(IDLE_LOCATION_FORM_DEFAULTS);

  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksForm, setRemarksForm] = useState(REMARKS_FORM_DEFAULTS);

  const showStatus = (message, isError = false) => {
    setDeleteStatus({ message, isError });
    setShowStatusModal(true);
  };

  const handleActionResult = (data, successMessage, closeModal) => {
    closeModal();
    if (data.ok) {
      showStatus(successMessage);
      fetchEquipments(1, false);
    } else {
      showStatus(data.message || 'Operation failed.', true);
    }
  };

  const toggleEquipmentSelection = (regNo) => {
    setSelectedEquipment(prev => (prev.includes(regNo) ? prev.filter(r => r !== regNo) : [...prev, regNo]));
  };

  const handleRowClick = (regNo) => navigate(`/maintenance/history/${regNo}`);
  const handleQuickServices = () => navigate('/maintenance/record');

  const handleAdd = () => { triggerVibration(); setShowAddModal(true); };

  const handleAddEquipmentSubmit = async (e) => {
    e?.preventDefault();
    const payload = buildAddEquipmentPayload(addEquipmentForm);

    try {
      const response = await apiRequest(`/equipments`, 'POST', payload);
      setShowAddModal(false);
      showStatus(
        response.ok ? `Equipment ${addEquipmentForm.regNo} successfully added.` : response.message || 'Failed to add equipment.',
        !response.ok
      );
      if (response.ok) { setAddEquipmentForm(EQUIPMENT_ADD_FORM_DEFAULTS); fetchEquipments(); }
    } catch (err) {
      setShowAddModal(false);
      showStatus('Error adding equipment: ' + err.message, true);
    }
  };

  const closeAddModal = () => { setShowAddModal(false); setAddEquipmentForm(EQUIPMENT_ADD_FORM_DEFAULTS); };

  const handleEdit = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setEditEquipment(equipment);
    setEditFormData(buildEditFormFromEquipment(equipment, operator, getOperatorName, getOperatorId));
    setShowEditModal(true);
  };

  const handleUpdateEquipment = async (e) => {
    e?.preventDefault();
    if (!editEquipment) return;

    const payload = buildUpdateEquipmentPayload(editEquipment, editFormData);

    try {
      const response = await apiRequest(`/equipments/by-reg/${editEquipment.regNo}`, 'PUT', payload);
      const data = await response.json();
      handleActionResult(data, `Equipment ${editEquipment.regNo} successfully updated.`, closeEditModal);
    } catch (err) {
      closeEditModal();
      showStatus('Error updating equipment: ' + err.message, true);
    }
  };

  const closeEditModal = () => { setShowEditModal(false); setEditEquipment(null); };

  const handleDeleteClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setEquipmentToDelete(equipment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;
    try {
      const response = await apiRequest(`/equipments/${equipmentToDelete.regNo}`, 'DELETE');
      const data = await response.json();
      setShowDeleteModal(false);
      showStatus(
        data.ok ? `Equipment ${equipmentToDelete.regNo} successfully deleted.` : data.message || 'Failed to delete equipment.',
        !data.ok
      );
      if (data.ok) fetchEquipments();
    } catch (err) {
      setShowDeleteModal(false);
      showStatus('Error deleting equipment: ' + err.message, true);
    }
  };

  const handleOutsideEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setOutsideEquipmentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOutsideEquipment = async (e) => {
    e?.preventDefault();
    const payload = buildOutsideEquipmentPayload(outsideEquipmentForm);

    try {
      const response = await apiRequest(`/equipments`, 'POST', payload);
      const data = await response.json();
      setShowOutsideEquipmentModal(false);
      showStatus(
        data.ok ? `Outside equipment ${outsideEquipmentForm.regNo} successfully added.` : data.message || 'Failed to add hired equipment.',
        !data.ok
      );
      if (data.ok) { setOutsideEquipmentForm(EQUIPMENT_OUTSIDE_FORM_DEFAULTS); fetchEquipments(); }
    } catch (err) {
      setShowOutsideEquipmentModal(false);
      showStatus('Error adding hired equipment: ' + err.message, true);
    }
  };

  const handleViewDetails = (equipment) => {
    setSidebarContent({ type: 'details', data: equipment });
    setSidebarTitle(`${equipment.machine} - ${equipment.regNo}`);
    setShowSidebar(true);
  };

  const closeSidebar = () => { setShowSidebar(false); setSidebarContent(null); setSidebarTitle(''); };

  const handleViewAllFuels = async (e, regNo) => {
    e.stopPropagation();
    setIsLoadingFuels(true);
    setShowFuelProgressModal(true);
    setFuelProgress(0);

    const progressTicker = setInterval(() => {
      setFuelProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, EQUIPMENT_FUEL_PROGRESS_TICK_MS);

    try {
      const response = await apiRequest(`/fuels/equipment-consumption`);
      const data = await response.json();
      const fuelData = data.data.filter(item => item.regNo === regNo);

      if (data.success) {
        setFuelProgress(100);
        setTimeout(() => {
          setSidebarContent({ type: 'fuels', data: fuelData });
          setSidebarTitle(`Fuel Consumption - ${regNo}`);
          setShowSidebar(true);
        }, EQUIPMENT_FUEL_SIDEBAR_OPEN_DELAY_MS);
      } else {
        showStatus(data.message || 'Failed to fetch fuel data.', true);
      }
    } catch (err) {
      showStatus('Error fetching fuel data: ' + err.message, true);
    } finally {
      clearInterval(progressTicker);
      setIsLoadingFuels(false);
      setTimeout(() => setShowFuelProgressModal(false), EQUIPMENT_FUEL_PROGRESS_HOLD_MS);
    }
  };

  const handleMobilizeClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setMobilizeForm(EQUIPMENT_MOBILIZE_FORM_DEFAULTS);
    setShowMobilizeModal(true);
  };

  const handleMobilizeSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const payload = buildMobilizePayload(selectedEquipmentForAction, mobilizeForm);

    try {
      const response = await apiRequest(`/equipments/mobilize-equipment`, 'POST', payload);
      const data = await response.json();
      handleActionResult(data, `Equipment ${selectedEquipmentForAction.regNo} mobilized to ${mobilizeForm.site}.`, closeMobilizeModal);
    } catch (err) {
      closeMobilizeModal();
      showStatus('Error mobilizing equipment: ' + err.message, true);
    }
  };

  const closeMobilizeModal = () => {
    setShowMobilizeModal(false);
    setSelectedEquipmentForAction(null);
    setMobilizeForm(EQUIPMENT_MOBILIZE_FORM_DEFAULTS);
  };

  const handleAddShiftClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setAddShiftForm({ ...EQUIPMENT_ADD_SHIFT_FORM_DEFAULTS, operators: [] });
    setShowAddShiftModal(true);
  };

  const handleAddShiftSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const payload = buildAddShiftPayload(selectedEquipmentForAction, addShiftForm);

    try {
      const response = await apiRequest(`/equipments/add-shifts`, 'POST', payload);
      const data = await response.json();
      handleActionResult(data, `Shifts added to ${selectedEquipmentForAction.regNo}.`, closeAddShiftModal);
    } catch (err) {
      closeAddShiftModal();
      showStatus('Error adding shifts: ' + err.message, true);
    }
  };

  const closeAddShiftModal = () => {
    setShowAddShiftModal(false);
    setSelectedEquipmentForAction(null);
    setAddShiftForm(EQUIPMENT_ADD_SHIFT_FORM_DEFAULTS);
  };

  const handleDemobilizeClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setDemobilizeDatePrompt(false);
    setDemobilizeForm(EQUIPMENT_DEMOBILIZE_FORM_DEFAULTS);
    setShowDemobilizeModal(true);
  };

  const handleDemobilizeAskDate = () => setDemobilizeDatePrompt(true);

  const handleDemobilizeSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const payload = buildDemobilizePayload(selectedEquipmentForAction, demobilizeForm);

    try {
      const response = await apiRequest(`/equipments/demobilize-equipment`, 'POST', payload);
      const data = await response.json();
      handleActionResult(data, `Equipment ${selectedEquipmentForAction.regNo} successfully demobilized.`, closeDemobilizeModal);
    } catch (err) {
      closeDemobilizeModal();
      showStatus('Error demobilizing equipment: ' + err.message, true);
    }
  };

  const closeDemobilizeModal = () => {
    setShowDemobilizeModal(false);
    setSelectedEquipmentForAction(null);
    setDemobilizeDatePrompt(false);
    setDemobilizeForm(EQUIPMENT_DEMOBILIZE_FORM_DEFAULTS);
  };

  const handleReplaceOperatorClick = (e, equipment, shiftEntry = null) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setReplaceOperatorForm(buildReplaceOperatorFormFromEquipment(equipment, shiftEntry));
    setShowReplaceOperatorModal(true);
  };

  const handleReplaceOperatorSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const payload = buildReplaceOperatorPayload(selectedEquipmentForAction, replaceOperatorForm);

    try {
      const response = await apiRequest(`/equipments/replace-operator`, 'POST', payload);
      const data = await response.json();
      if (data.ok) closeSidebar();
      handleActionResult(data, `Operator replaced. New: ${replaceOperatorForm.replacedOperator}`, closeReplaceOperatorModal);
    } catch (err) {
      closeReplaceOperatorModal();
      showStatus('Error replacing operator: ' + err.message, true);
    }
  };

  const closeReplaceOperatorModal = () => {
    setShowReplaceOperatorModal(false);
    setSelectedEquipmentForAction(null);
    setReplaceOperatorForm(EQUIPMENT_REPLACE_OPERATOR_FORM_DEFAULTS);
  };

  const handleReplaceEquipmentClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setReplaceEquipmentForm({
      ...EQUIPMENT_REPLACE_EQUIPMENT_FORM_DEFAULTS,
      operator: equipment.certificationBody?.at(-1)?.operatorName || '',
      operatorId: equipment.certificationBody?.at(-1)?.operatorId || '',
    });
    setShowReplaceEquipmentModal(true);
  };

  const handleReplaceEquipmentSearch = useCallback(async (term) => {
    if (!term?.trim()) { setReplaceEquipmentResults([]); return; }
    try {
      const url = buildSearchUrl({ source: SEARCH_SOURCES.EQUIPMENT, q: term.trim(), page: 1, limit: 10 });
      const response = await apiRequest(url, 'GET');
      const data = await response.json();
      const result = extractSearchResult(data, SEARCH_SOURCES.EQUIPMENT);
      setReplaceEquipmentResults(result.results);
    } catch (err) {
      console.error('Equipment search error:', err);
    }
  }, []);

  const handleReplaceEquipmentSelect = (equipment) => {
    setReplaceEquipmentForm(prev => ({
      ...prev,
      replacedEquipmentId: equipment._id,
      replacedEquipmentRegNo: equipment.regNo,
      replacedEquipmentMachine: equipment.machine,
    }));
  };

  const handleReplaceEquipmentSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const payload = buildReplaceEquipmentPayload(selectedEquipmentForAction, replaceEquipmentForm);

    try {
      const response = await apiRequest(`/equipments/replace-equipment`, 'POST', payload);
      const data = await response.json();
      handleActionResult(
        data,
        `Equipment replaced. ${replaceEquipmentForm.replacedEquipmentRegNo} now at site.`,
        closeReplaceEquipmentModal
      );
    } catch (err) {
      closeReplaceEquipmentModal();
      showStatus('Error replacing equipment: ' + err.message, true);
    }
  };

  const closeReplaceEquipmentModal = () => {
    setShowReplaceEquipmentModal(false);
    setSelectedEquipmentForAction(null);
    setReplaceEquipmentForm(EQUIPMENT_REPLACE_EQUIPMENT_FORM_DEFAULTS);
    setReplaceEquipmentResults([]);
  };

  const handleMarkAsSoldClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setEquipmentToMarkSold(equipment);
    setShowMarkSoldModal(true);
  };

  const closeMarkSoldModal = () => {
    setShowMarkSoldModal(false);
    setEquipmentToMarkSold(null);
  };

  const confirmMarkAsSold = async () => {
    if (!equipmentToMarkSold) return;
    try {
      const response = await apiRequest(`/equipments/mark-sold`, 'POST', { regNo: equipmentToMarkSold.regNo });
      const data = await response.json();
      const regNo = equipmentToMarkSold.regNo;
      closeMarkSoldModal();
      showStatus(
        data.ok ? `Equipment ${regNo} marked as sold.` : data.message || 'Failed to mark equipment as sold.',
        !data.ok
      );
      if (data.ok) fetchEquipments();
    } catch (err) {
      closeMarkSoldModal();
      showStatus('Error marking equipment as sold: ' + err.message, true);
    }
  };

  const handleSetIdleLocationClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setIdleLocationForm({
      idleAt: equipment.idleAt === 'site' ? 'site' : 'garage',
      idleSite: equipment.idleSite || '',
    });
    setShowIdleLocationModal(true);
  };

  const onIdleLocationFormChange = (field, value) => {
    setIdleLocationForm(prev => {
      if (field === 'idleAt') return { ...prev, idleAt: value, idleSite: value === 'site' ? prev.idleSite : '' };
      return { ...prev, [field]: value };
    });
  };

  const closeIdleLocationModal = () => {
    setShowIdleLocationModal(false);
    setSelectedEquipmentForAction(null);
    setIdleLocationForm(IDLE_LOCATION_FORM_DEFAULTS);
  };

  const handleIdleLocationSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    try {
      const response = await apiRequest(`/equipments/${selectedEquipmentForAction.regNo}/idle-location`, 'PUT', idleLocationForm);
      const data = await response.json();
      handleActionResult(data, `Idle location updated for ${selectedEquipmentForAction.regNo}.`, closeIdleLocationModal);
    } catch (err) {
      closeIdleLocationModal();
      showStatus('Error updating idle location: ' + err.message, true);
    }
  };

  const handleOpenRemarksModal = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setRemarksForm({ remarks: equipment.remarks || '' });
    setShowRemarksModal(true);
  };

  const onRemarksFormChange = (field, value) => {
    setRemarksForm(prev => ({ ...prev, [field]: value }));
  };

  const closeRemarksModal = () => {
    setShowRemarksModal(false);
    setSelectedEquipmentForAction(null);
    setRemarksForm(REMARKS_FORM_DEFAULTS);
  };

  const handleRemarksSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    try {
      const response = await apiRequest(`/equipments/${selectedEquipmentForAction.regNo}/remarks`, 'PUT', { remarks: remarksForm.remarks });
      const data = await response.json();
      handleActionResult(data, `Remarks updated for ${selectedEquipmentForAction.regNo}.`, closeRemarksModal);
    } catch (err) {
      closeRemarksModal();
      showStatus('Error updating remarks: ' + err.message, true);
    }
  };

  return {
    deleteStatus, showStatusModal, setShowStatusModal, showStatus,

    isSelectMode, setIsSelectMode,
    selectedEquipment, setSelectedEquipment,
    toggleEquipmentSelection,

    handleRowClick, handleQuickServices,

    showAddModal, closeAddModal, handleAdd,
    addEquipmentForm, setAddEquipmentForm,
    handleAddEquipmentSubmit,

    showEditModal, closeEditModal, handleEdit,
    editFormData, setEditFormData,
    handleUpdateEquipment,

    showDeleteModal, setShowDeleteModal,
    equipmentToDelete, confirmDelete, handleDeleteClick,

    showOutsideEquipmentModal, setShowOutsideEquipmentModal,
    outsideEquipmentForm, setOutsideEquipmentForm,
    handleOutsideEquipmentInputChange, handleAddOutsideEquipment,
    closeOutsideEquipmentModal: () => setShowOutsideEquipmentModal(false),

    showSidebar, closeSidebar, sidebarContent, setSidebarContent,
    sidebarTitle, setSidebarTitle,
    isLoadingFuels, showFuelProgressModal, fuelProgress,
    handleViewDetails, handleViewAllFuels,

    showNoResultsModal, setShowNoResultsModal,

    showMobilizeModal, closeMobilizeModal, handleMobilizeClick,
    mobilizeForm, setMobilizeForm, handleMobilizeSubmit,

    showDemobilizeModal, closeDemobilizeModal, handleDemobilizeClick,
    demobilizeDatePrompt, demobilizeForm, setDemobilizeForm,
    handleDemobilizeAskDate, handleDemobilizeSubmit,
    selectedEquipmentForAction,

    showReplaceOperatorModal, closeReplaceOperatorModal, handleReplaceOperatorClick,
    replaceOperatorForm, setReplaceOperatorForm, handleReplaceOperatorSubmit,

    showReplaceEquipmentModal, closeReplaceEquipmentModal, handleReplaceEquipmentClick,
    replaceEquipmentForm, setReplaceEquipmentForm,
    replaceEquipmentResults,
    handleReplaceEquipmentSearch, handleReplaceEquipmentSelect,
    handleReplaceEquipmentSubmit,
    showAddShiftModal, closeAddShiftModal, handleAddShiftClick,
    addShiftForm, setAddShiftForm, handleAddShiftSubmit,

    showExportModal, setShowExportModal,
    exportColumns, setExportColumns,

    showMarkSoldModal, equipmentToMarkSold, handleMarkAsSoldClick, closeMarkSoldModal, confirmMarkAsSold,

    showIdleLocationModal, idleLocationForm, handleSetIdleLocationClick,
    onIdleLocationFormChange, closeIdleLocationModal, handleIdleLocationSubmit,

    showRemarksModal, remarksForm, handleOpenRemarksModal,
    onRemarksFormChange, closeRemarksModal, handleRemarksSubmit,

    fetchSitesForDropdown,
  };
};