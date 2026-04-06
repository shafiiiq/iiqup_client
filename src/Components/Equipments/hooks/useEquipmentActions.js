// ─────────────────────────────────────────────────────────────────────────────
// useEquipmentActions.js — All CRUD + operational action handlers.
// Owns: add, edit, delete, mobilize, demobilize, replace operator,
//       replace equipment, add outside equipment, fuel sidebar, site search.
// Returns handlers and the modal state they control.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeaderVibration } from '../../../Context/HeaderVibrationContext';
import { apiRequest } from '../../../utils/api';
import { END_POINT } from '../../../constants';
import {
  getOperatorName,
  getOperatorId,
  getCurrentDateTime,
} from '../utils/equipmentHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Initial Form States (defined once, reset to these on modal close)
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_ADD_FORM = {
  machine: '', regNo: '', coc: '', brand: '', year: '',
  istimaraExpiry: '', insuranceExpiry: '', tpcExpiry: '',
  operator: '', operatorId: '', operatorShift: '', company: 'ATE',
  hiredFrom: '', hired: false, status: 'Active', site: '',
  location: '',
  rentRate: { basis: 'daily', rate: '', currency: 'QAR' },
  'rentRate.basis': 'daily',
  'rentRate.rate':  '',
};

const EMPTY_EDIT_FORM = {
  machine: '', regNo: '', coc: '', brand: '', year: '', company: '',
  operator: '', operatorId: '', operatorShift: '', brand: '', hiredFrom: '', site: '', status: '',
  istimaraExpiry: '', insuranceExpiry: '', tpcExpiry: '',
  location: '',
  rentRate: { basis: 'daily', rate: '', currency: 'QAR' },
  'rentRate.basis': 'daily',
  'rentRate.rate':  '',
};

const EMPTY_OUTSIDE_FORM = {
  machine: '', regNo: '', brand: '', operator: '', company: 'OUTSIDE', hired: true,
};

const EMPTY_DEMOBILIZE_FORM = { date: '', time: '', remarks: '' };

const EMPTY_ADD_SHIFT_FORM = {
  operators: [],
  date: '',
  time: '',
  remarks: '',
};

const EMPTY_MOBILIZE_FORM = {
  site: '', operator: '', operatorId: '', operators: [], withOperator: false, withShift: false, moreShifts: false,
  remarks: '', deployType: 'site', clientCompany: '', date: '', time: '', singleOperatorShift: 'Full Shift',
  isOneDayMob: false, demobDate: '', demobTime: '', demobRemarks: '',
  location: '', rentRate: { basis: '', rate: '' }, 'rentRate.basis': '', 'rentRate.rate':  '',
};

const EMPTY_REPLACE_OPERATOR_FORM = {
  currentOperator: '', currentOperatorId: '',
  replacedOperator: '', replacedOperatorId: '',
  targetShiftName: '', shiftName: '', shiftStart: '', shiftEnd: '',
  remarks: '', date: '', time: '',
  allShifts: [],
  selectedShift: '',
  replaceAll: false,  
};
const EMPTY_REPLACE_EQUIPMENT_FORM = {
  replacedEquipmentId: '', replacedEquipmentRegNo: '',
  replacedEquipmentMachine: '', newSiteForReplaced: '', remarks: '', date: '', time: '',
  operator: '', operatorId: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   fetchEquipments:   Function,
 *   fetchSitesForDropdown: Function,
 *   operator:          Array,
 * }} params
 */
export const useEquipmentActions = ({ fetchEquipments, fetchSitesForDropdown, operator }) => {
  const navigate = useNavigate();
  const { triggerVibration } = useHeaderVibration();

  // ── Shared Status / Feedback ───────────────────────────────────────────────
  const [deleteStatus, setDeleteStatus] = useState({ message: '', isError: false });
  const [showStatusModal, setShowStatusModal] = useState(false);

  // ── Selection Mode (multi-select for batch history) ────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  // ── Add Equipment ──────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEquipmentForm, setAddEquipmentForm] = useState(EMPTY_ADD_FORM);

  // ── Edit Equipment ─────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);
  const [editFormData, setEditFormData] = useState(EMPTY_EDIT_FORM);

  // ── Delete Equipment ───────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  // ── Outside / Hired Equipment ──────────────────────────────────────────────
  const [showOutsideEquipmentModal, setShowOutsideEquipmentModal] = useState(false);
  const [outsideEquipmentForm, setOutsideEquipmentForm] = useState(EMPTY_OUTSIDE_FORM);

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState(null);
  const [sidebarTitle, setSidebarTitle] = useState('');
  const [isLoadingFuels, setIsLoadingFuels] = useState(false);
  const [showFuelProgressModal, setShowFuelProgressModal] = useState(false);
  const [fuelProgress, setFuelProgress] = useState(0);

  // ── No Results ─────────────────────────────────────────────────────────────
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);

  // ── Mobilize ───────────────────────────────────────────────────────────────
  const [showMobilizeModal, setShowMobilizeModal] = useState(false);
  const [mobilizeForm, setMobilizeForm] = useState(EMPTY_MOBILIZE_FORM);

  // ── Add Shift ──────────────────────────────────────────────────────────────
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [addShiftForm, setAddShiftForm] = useState(EMPTY_ADD_SHIFT_FORM);

  // ── Demobilize ─────────────────────────────────────────────────────────────
  const [showDemobilizeModal, setShowDemobilizeModal] = useState(false);
  const [demobilizeDatePrompt, setDemobilizeDatePrompt] = useState(false);
  const [demobilizeForm, setDemobilizeForm] = useState(EMPTY_DEMOBILIZE_FORM);

  // ── Replace Operator ───────────────────────────────────────────────────────
  const [showReplaceOperatorModal, setShowReplaceOperatorModal] = useState(false);
  const [replaceOperatorForm, setReplaceOperatorForm] = useState(EMPTY_REPLACE_OPERATOR_FORM);

  // ── Replace Equipment ──────────────────────────────────────────────────────
  const [showReplaceEquipmentModal, setShowReplaceEquipmentModal] = useState(false);
  const [replaceEquipmentForm, setReplaceEquipmentForm] = useState(EMPTY_REPLACE_EQUIPMENT_FORM);
  const [replaceEquipmentResults, setReplaceEquipmentResults] = useState([]);

  // ── Shared selected equipment target (for action modals) ───────────────────
  const [selectedEquipmentForAction, setSelectedEquipmentForAction] = useState(null);

  // ── Export ─────────────────────────────────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    machine: true, regNo: true, brand: true, year: true,
    company: true, operator: true, site: true, status: true,
    istimaraExpiry: false, insuranceExpiry: false, tpcExpiry: false,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Shared Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Sets the status modal content and shows it. */
  const showStatus = (message, isError = false) => {
    setDeleteStatus({ message, isError });
    setShowStatusModal(true);
  };

  /** Handles the common post-action pattern: close modal → show status → refresh. */
  const handleActionResult = (data, successMessage, closeModal) => {
    closeModal();
    if (data.ok) {
      showStatus(successMessage);
      fetchEquipments(1, false);
    } else {
      showStatus(data.message || 'Operation failed.', true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Selection Mode
  // ─────────────────────────────────────────────────────────────────────────

  const toggleEquipmentSelection = (regNo) => {
    setSelectedEquipment(prev =>
      prev.includes(regNo) ? prev.filter(r => r !== regNo) : [...prev, regNo]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  const handleRowClick = (regNo) => navigate(`/service-history/${regNo}`);
  const handleQuickServices = () => navigate('/service-histoy/summary');

  // ─────────────────────────────────────────────────────────────────────────
  // Add Equipment
  // ─────────────────────────────────────────────────────────────────────────

  const handleAdd = () => { triggerVibration(); setShowAddModal(true); };

  const handleAddEquipmentSubmit = async (e) => {
    e?.preventDefault();

  const certificationBody = addEquipmentForm.operator && addEquipmentForm.operatorId
    ? [{ operatorName: addEquipmentForm.operator, operatorId: addEquipmentForm.operatorId, shiftName: addEquipmentForm.operatorShift || '', assignedAt: new Date() }]
    : [];

    const { operator: _op, operatorId: _oid, ...rest } = addEquipmentForm;
    const newEquipment = {
      ...rest,
      year: parseInt(addEquipmentForm.year),
      certificationBody,
      site:     addEquipmentForm.site     ? [addEquipmentForm.site]     : [],
      location: addEquipmentForm.location || null,
      hired:    addEquipmentForm.company === 'HIRED',
      rentRate: (addEquipmentForm.rentRate?.rate || addEquipmentForm.rentRate?.basis)
        ? { basis: addEquipmentForm.rentRate.basis || 'daily', rate: Number(addEquipmentForm.rentRate.rate) || 0, currency: 'QAR' }
        : null,
    };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/add-equipment`, 'POST', newEquipment);
      setShowAddModal(false);
      showStatus(
        response.ok
          ? `Equipment ${addEquipmentForm.regNo} successfully added.`
          : response.message || 'Failed to add equipment.',
        !response.ok
      );
      if (response.ok) { setAddEquipmentForm(EMPTY_ADD_FORM); fetchEquipments(); }
    } catch (err) {
      setShowAddModal(false);
      showStatus('Error adding equipment: ' + err.message, true);
    }
  };

  const closeAddModal = () => { setShowAddModal(false); setAddEquipmentForm(EMPTY_ADD_FORM); };

  // ─────────────────────────────────────────────────────────────────────────
  // Edit Equipment
  // ─────────────────────────────────────────────────────────────────────────

  const handleEdit = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setEditEquipment(equipment);
    setEditFormData({
      machine:  equipment.machine,
      regNo:    equipment.regNo,
      coc:      equipment.coc || '',
      brand:    equipment.brand,
      site:     equipment.site?.at(-1) || '',
      status:   equipment.status,
      year:     equipment.year,
      company:  equipment.company,
      operator:      getOperatorName(equipment.certificationBody),
      operatorId:    getOperatorId(equipment.certificationBody, operator),
      operatorShift: equipment.certificationBody?.at(-1)?.shiftName || '',
      hiredFrom: equipment.hiredFrom || '',
      istimaraExpiry:  equipment.istimaraExpiry  ? new Date(equipment.istimaraExpiry).toISOString().split('T')[0]  : '',
      insuranceExpiry: equipment.insuranceExpiry ? new Date(equipment.insuranceExpiry).toISOString().split('T')[0] : '',
      tpcExpiry:       equipment.tpcExpiry       ? new Date(equipment.tpcExpiry).toISOString().split('T')[0]       : '',
      location: equipment.location || '',
      rentRate: equipment.rentRate || { basis: 'daily', rate: '', currency: 'QAR' },
      'rentRate.basis': equipment.rentRate?.basis || 'daily',
      'rentRate.rate':  equipment.rentRate?.rate  || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateEquipment = async (e) => {
    e?.preventDefault();
    if (!editEquipment) return;

  const updatedEquipment = {
    ...editEquipment,
    machine:  editFormData.machine,
    regNo:    editFormData.regNo,
    coc:      editFormData.coc || '',
    brand:    editFormData.brand,
    year:     editFormData.year,
    company:  editFormData.company,
    site:     editFormData.site,
    status:   editFormData.status,
    hiredFrom: editFormData.hiredFrom,
    istimaraExpiry:  editFormData.istimaraExpiry  || null,
    insuranceExpiry: editFormData.insuranceExpiry || null,
    tpcExpiry:       editFormData.tpcExpiry       || null,
    location: editFormData.location || '',
    rentRate: (editFormData.rentRate?.rate || editFormData.rentRate?.basis)
      ? { basis: editFormData.rentRate.basis || 'daily', rate: Number(editFormData.rentRate.rate) || 0, currency: 'QAR' }
      : null,
  };

    // Only include operator fields if the operator was actually changed
    const currentOpName = editEquipment.certificationBody?.at(-1);
    const currentOp = typeof currentOpName === 'string' ? currentOpName : currentOpName?.operatorName;
    if (editFormData.operator !== currentOp) {
      updatedEquipment.operator = editFormData.operator;
      updatedEquipment.operatorId = editFormData.operatorId;
      updatedEquipment.operatorShift = editFormData.operatorShift || '';
    }

    try {
      const response = await apiRequest(`${END_POINT}/equipments/update-equipment/${editEquipment.regNo}`, 'PUT', updatedEquipment);
      const data = await response.json();
      handleActionResult(data, `Equipment ${editEquipment.regNo} successfully updated.`, closeEditModal);
    } catch (err) {
      closeEditModal();
      showStatus('Error updating equipment: ' + err.message, true);
    }
  };

  const closeEditModal = () => { setShowEditModal(false); setEditEquipment(null); };

  // ─────────────────────────────────────────────────────────────────────────
  // Delete Equipment
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setEquipmentToDelete(equipment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;
    try {
      const response = await apiRequest(`${END_POINT}/equipments/delete-equipment/${equipmentToDelete.regNo}`, 'DELETE');
      const data = await response.json();
      setShowDeleteModal(false);
      showStatus(
        data.ok
          ? `Equipment ${equipmentToDelete.regNo} successfully deleted.`
          : data.message || 'Failed to delete equipment.',
        !data.ok
      );
      if (data.ok) fetchEquipments();
    } catch (err) {
      setShowDeleteModal(false);
      showStatus('Error deleting equipment: ' + err.message, true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Outside Equipment
  // ─────────────────────────────────────────────────────────────────────────

  const handleOutsideEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setOutsideEquipmentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOutsideEquipment = async (e) => {
    e?.preventDefault();
    const { operator: op, ...rest } = outsideEquipmentForm;
    const payload = { ...rest, certificationBody: [op] };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/add-equipment`, 'POST', payload);
      const data = await response.json();
      setShowOutsideEquipmentModal(false);
      showStatus(
        data.ok
          ? `Outside equipment ${outsideEquipmentForm.regNo} successfully added.`
          : data.message || 'Failed to add hired equipment.',
        !data.ok
      );
      if (data.ok) { setOutsideEquipmentForm(EMPTY_OUTSIDE_FORM); fetchEquipments(); }
    } catch (err) {
      setShowOutsideEquipmentModal(false);
      showStatus('Error adding hired equipment: ' + err.message, true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Sidebar / Fuel Consumption
  // ─────────────────────────────────────────────────────────────────────────

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

    const progressInterval = setInterval(() => {
      setFuelProgress(prev => prev >= 90 ? prev : prev + Math.random() * 15);
    }, 150);

    try {
      const response = await apiRequest(`${END_POINT}/fuels/equipment-consumption`);
      const data = await response.json();
      const fuelData = data.data.filter(item => item.regNo === regNo);

      if (data.success) {
        setFuelProgress(100);
        setTimeout(() => {
          setSidebarContent({ type: 'fuels', data: fuelData });
          setSidebarTitle(`Fuel Consumption - ${regNo}`);
          setShowSidebar(true);
        }, 300);
      } else {
        showStatus(data.message || 'Failed to fetch fuel data.', true);
      }
    } catch (err) {
      showStatus('Error fetching fuel data: ' + err.message, true);
    } finally {
      clearInterval(progressInterval);
      setIsLoadingFuels(false);
      setTimeout(() => setShowFuelProgressModal(false), 500);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Mobilize
  // ─────────────────────────────────────────────────────────────────────────

  const handleMobilizeClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setMobilizeForm(EMPTY_MOBILIZE_FORM);
    setShowMobilizeModal(true);
  };

  const handleMobilizeSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const { month, year, time } = mobilizeForm.date
      ? (() => { const d = new Date(mobilizeForm.date); return { month: d.getMonth() + 1, year: d.getFullYear(), time: mobilizeForm.time || getCurrentDateTime().time }; })()
      : { ...getCurrentDateTime(), time: mobilizeForm.time || getCurrentDateTime().time };

    const payload = {
      equipmentId: selectedEquipmentForAction._id,
      regNo: selectedEquipmentForAction.regNo,
      machine: selectedEquipmentForAction.machine,
      site: mobilizeForm.deployType === 'site' ? mobilizeForm.site : '',
      location: mobilizeForm.location || null,
      rentRate: (mobilizeForm['rentRate.rate'] || mobilizeForm['rentRate.basis'])
       ? { basis: mobilizeForm['rentRate.basis'] || 'daily', rate: Number(mobilizeForm['rentRate.rate']) || 0, currency: 'QAR' }
        : null,
      operators: mobilizeForm.withOperator
        ? (mobilizeForm.withShift
            ? mobilizeForm.operators
            : mobilizeForm.operator
              ? [{ operatorName: mobilizeForm.operator, operatorId: mobilizeForm.operatorId, shiftStart: '', shiftEnd: '', shiftName: mobilizeForm.singleOperatorShift || 'Full Shift' }]
              : [])
        : [],
      withOperator: mobilizeForm.withOperator,
      deployType: mobilizeForm.deployType,
      clientCompany: mobilizeForm.deployType === 'company' ? mobilizeForm.clientCompany : '',
      month, year, time,
      selectedDate: mobilizeForm.date || null,
      remarks: mobilizeForm.remarks,
      isOneDayMob:  mobilizeForm.isOneDayMob  || false,
      demobDate:    mobilizeForm.demobDate    || null,
      demobTime:    mobilizeForm.demobTime    || '',
      demobRemarks: mobilizeForm.demobRemarks || '',
    };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/mobilize-equipment`, 'POST', payload);
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
    setMobilizeForm(EMPTY_MOBILIZE_FORM);
  };

  const handleAddShiftClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setAddShiftForm({ ...EMPTY_ADD_SHIFT_FORM, operators: [] });
    setShowAddShiftModal(true);
  };

  const handleAddShiftSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const { month, year, time } = addShiftForm.date
      ? (() => { const d = new Date(addShiftForm.date); return { month: d.getMonth() + 1, year: d.getFullYear(), time: addShiftForm.time || getCurrentDateTime().time }; })()
      : { ...getCurrentDateTime(), time: addShiftForm.time || getCurrentDateTime().time };

    const payload = {
      equipmentId: selectedEquipmentForAction._id,
      regNo: selectedEquipmentForAction.regNo,
      machine: selectedEquipmentForAction.machine,
      operators: addShiftForm.operators,
      month, year, time,
      selectedDate: addShiftForm.date || null,
      remarks: addShiftForm.remarks || '',
    };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/add-shifts`, 'POST', payload);
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
    setAddShiftForm(EMPTY_ADD_SHIFT_FORM);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Demobilize
  // ─────────────────────────────────────────────────────────────────────────

  const handleDemobilizeClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setDemobilizeDatePrompt(false);
    setDemobilizeForm(EMPTY_DEMOBILIZE_FORM);
    setShowDemobilizeModal(true);
  };

  const handleDemobilizeAskDate = () => {
    setDemobilizeDatePrompt(true);
  };

  const handleDemobilizeSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const { month, year, time } = demobilizeForm.date
      ? (() => { const d = new Date(demobilizeForm.date); return { month: d.getMonth() + 1, year: d.getFullYear(), time: demobilizeForm.time || getCurrentDateTime().time }; })()
      : { ...getCurrentDateTime(), time: demobilizeForm.time || getCurrentDateTime().time };
    const payload = {
      equipmentId: selectedEquipmentForAction._id,
      regNo: selectedEquipmentForAction.regNo,
      machine: selectedEquipmentForAction.machine,
      month, year, time,
      selectedDate: demobilizeForm.date || null,
      remarks: demobilizeForm.remarks || '',
    };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/demobilize-equipment`, 'POST', payload);
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
    setDemobilizeForm(EMPTY_DEMOBILIZE_FORM);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Replace Operator
  // ─────────────────────────────────────────────────────────────────────────

  const handleReplaceOperatorClick = (e, equipment, shiftEntry = null) => {
   e.stopPropagation();
   triggerVibration();
    setSelectedEquipmentForAction(equipment);

    const allShifts  = equipment.certificationBody || [];
    const isSingle   = allShifts.length <= 1;
    const entry      = shiftEntry || (isSingle ? allShifts[0] : null);

    setReplaceOperatorForm({
      currentOperator:   entry?.operatorName  || '',
      currentOperatorId: entry?.operatorId    || '',
      targetShiftName:   entry?.shiftName     || '',
      shiftName:         entry?.shiftName     || '',
     shiftStart:        entry?.shiftStart    || '',
      shiftEnd:          entry?.shiftEnd      || '',
      replacedOperator: '', replacedOperatorId: '', remarks: '', date: '', time: '',
      allShifts,
      selectedShift: isSingle ? (entry?.shiftName || entry?.operatorName || '') : '',
   });
   setShowReplaceOperatorModal(true);
  };

  const handleReplaceOperatorSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedEquipmentForAction) return;

    const { month, year, time } = replaceOperatorForm.date
      ? (() => { const d = new Date(replaceOperatorForm.date); return { month: d.getMonth() + 1, year: d.getFullYear(), time: replaceOperatorForm.time || getCurrentDateTime().time }; })()
      : { ...getCurrentDateTime(), time: replaceOperatorForm.time || getCurrentDateTime().time };
      const payload = {
        equipmentId:        selectedEquipmentForAction._id,
        regNo:              selectedEquipmentForAction.regNo,
        machine:            selectedEquipmentForAction.machine,
        currentOperator:    replaceOperatorForm.currentOperator,
        currentOperatorId:  replaceOperatorForm.currentOperatorId,
        replacedOperator:   replaceOperatorForm.replacedOperator,
        replacedOperatorId: replaceOperatorForm.replacedOperatorId,
       targetShiftName:    replaceOperatorForm.targetShiftName || '',
        shiftName:          replaceOperatorForm.shiftName       || '',
       shiftStart:         replaceOperatorForm.shiftStart      || '',
       shiftEnd:           replaceOperatorForm.shiftEnd        || '',
       remarks:            replaceOperatorForm.remarks         || '',
       replaceAll:         replaceOperatorForm.replaceAll      || false, 
       month, year, time,
       selectedDate: replaceOperatorForm.date || null,
      };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/replace-operator`, 'POST', payload);
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
    setReplaceOperatorForm(EMPTY_REPLACE_OPERATOR_FORM);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Replace Equipment
  // ─────────────────────────────────────────────────────────────────────────

  const handleReplaceEquipmentClick = (e, equipment) => {
    e.stopPropagation();
    triggerVibration();
    setSelectedEquipmentForAction(equipment);
    setReplaceEquipmentForm({
      ...EMPTY_REPLACE_EQUIPMENT_FORM,
      operator:   equipment.certificationBody?.at(-1)?.operatorName || '',
      operatorId: equipment.certificationBody?.at(-1)?.operatorId   || '',
    });
    setShowReplaceEquipmentModal(true);
  };

  const handleReplaceEquipmentSearch = useCallback(async (term) => {
    if (!term?.trim()) { setReplaceEquipmentResults([]); return; }
    try {
      const response = await apiRequest(`${END_POINT}/equipments/search-equipments`, 'POST', {
        searchTerm: term.trim(), page: 1, limit: 10, searchField: 'all',
      });
      const data = await response.json();
      if (data.ok) setReplaceEquipmentResults(data.data);
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

    const { month, year, time } = replaceEquipmentForm.date
      ? (() => { const d = new Date(replaceEquipmentForm.date); return { month: d.getMonth() + 1, year: d.getFullYear(), time: replaceEquipmentForm.time || getCurrentDateTime().time }; })()
      : { ...getCurrentDateTime(), time: replaceEquipmentForm.time || getCurrentDateTime().time };
    const payload = {
      equipmentId: selectedEquipmentForAction._id,
      regNo: selectedEquipmentForAction.regNo,
      machine: selectedEquipmentForAction.machine,
      replacedEquipmentId: replaceEquipmentForm.replacedEquipmentId,
      replacedEquipmentRegNo: replaceEquipmentForm.replacedEquipmentRegNo,
      replacedEquipmentMachine: replaceEquipmentForm.replacedEquipmentMachine,
      newSiteForReplaced: replaceEquipmentForm.newSiteForReplaced || null,
      month, year, time,
      selectedDate: replaceEquipmentForm.date || null,
      remarks: replaceEquipmentForm.remarks,
      operator:   replaceEquipmentForm.operator   || '',
      operatorId: replaceEquipmentForm.operatorId || '',
    };

    try {
      const response = await apiRequest(`${END_POINT}/equipments/replace-equipment`, 'POST', payload);
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
    setReplaceEquipmentForm(EMPTY_REPLACE_EQUIPMENT_FORM);
    setReplaceEquipmentResults([]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Exposed API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Status
    deleteStatus, showStatusModal, setShowStatusModal, showStatus,

    // Selection
    isSelectMode, setIsSelectMode,
    selectedEquipment, setSelectedEquipment,
    toggleEquipmentSelection,

    // Navigation
    handleRowClick, handleQuickServices,

    // Add
    showAddModal, closeAddModal, handleAdd,
    addEquipmentForm, setAddEquipmentForm,
    handleAddEquipmentSubmit,

    // Edit
    showEditModal, closeEditModal, handleEdit,
    editFormData, setEditFormData,
    handleUpdateEquipment,

    // Delete
    showDeleteModal, setShowDeleteModal,
    equipmentToDelete, confirmDelete, handleDeleteClick,

    // Outside equipment
    showOutsideEquipmentModal, setShowOutsideEquipmentModal,
    outsideEquipmentForm, setOutsideEquipmentForm,
    handleOutsideEquipmentInputChange, handleAddOutsideEquipment,
    closeOutsideEquipmentModal: () => setShowOutsideEquipmentModal(false),

    // Sidebar / fuels
    showSidebar, closeSidebar, sidebarContent, setSidebarContent,
    sidebarTitle, setSidebarTitle,
    isLoadingFuels, showFuelProgressModal, fuelProgress,
    handleViewDetails, handleViewAllFuels,

    // No results
    showNoResultsModal, setShowNoResultsModal,

    // Mobilize
    showMobilizeModal, closeMobilizeModal, handleMobilizeClick,
    mobilizeForm, setMobilizeForm, handleMobilizeSubmit,

    // Demobilize
    showDemobilizeModal, closeDemobilizeModal, handleDemobilizeClick,
    demobilizeDatePrompt, demobilizeForm, setDemobilizeForm,
    handleDemobilizeAskDate, handleDemobilizeSubmit,
    selectedEquipmentForAction,

    // Replace operator
    showReplaceOperatorModal, closeReplaceOperatorModal, handleReplaceOperatorClick,
    replaceOperatorForm, setReplaceOperatorForm, handleReplaceOperatorSubmit,

    // Replace equipment
    showReplaceEquipmentModal, closeReplaceEquipmentModal, handleReplaceEquipmentClick,
    replaceEquipmentForm, setReplaceEquipmentForm,
    replaceEquipmentResults,
    handleReplaceEquipmentSearch, handleReplaceEquipmentSelect,
    handleReplaceEquipmentSubmit,
    showAddShiftModal, closeAddShiftModal, handleAddShiftClick,
    addShiftForm, setAddShiftForm, handleAddShiftSubmit,

    // Export
    showExportModal, setShowExportModal,
    exportColumns, setExportColumns,

    // Sites
    fetchSitesForDropdown,
  };
};