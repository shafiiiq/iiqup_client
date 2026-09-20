import { useCallback } from 'react';
import { useSearch } from '@/shared/context/SearchContext';

import { useImageCache } from './useImageCache';
import { useEquipmentData } from './useEquipmentData';
import { useEquipmentSearch } from './useEquipmentSearch';
import { useEquipmentActions } from './useEquipmentActions';
import { useOperatorSearch } from './useOperatorSearch';

import { buildAndDownloadExcel, printEquipmentTable } from '../helper/equipment.export.helper';
import {
  patchEquipmentFormField,
  patchAddShiftFormField,
  patchMobilizeFormField,
  patchReplaceOperatorFormField,
  patchReplaceEquipmentFormField,
  createEmptyShiftEntry,
} from '../helper/equipment.form.helper';
import { isOperatorNameField } from '../helper/equipment.helper';
import { EQUIPMENT_GRID_TABS, EQUIPMENT_TABS, EQUIPMENT_ALL_SITES_FILTER, EQUIPMENT_DEFAULT_EXPORT_COLUMNS } from '../constants/equipment.constant';

export const useEquipmentPage = () => {
  const { searchTerm, setSearchTerm } = useSearch();
  const imageCache = useImageCache();
  const equipment = useEquipmentData({ getMediaUrlWithCache: imageCache.getMediaUrlWithCache });
  const operatorSearch = useOperatorSearch(equipment.operatorOptions);

  const actions = useEquipmentActions({
    fetchEquipments: equipment.fetchEquipmentList,
    fetchSitesForDropdown: equipment.fetchSiteOptionsForDropdown,
    operator: operatorSearch.operators,
  });

  useEquipmentSearch({
    activeTab: equipment.activeTab,
    fetchEquipments: equipment.fetchEquipmentList,
    setFilteredData: equipment.setEquipmentList,
    hydrateWithImages: equipment.hydrateEquipmentListWithImages,
    setIsSearchActive: equipment.setIsSearchActive,
  });

  const isEquipmentGridTab = EQUIPMENT_GRID_TABS.includes(equipment.activeTab)
    || (equipment.activeTab === EQUIPMENT_TABS.SITE_BASED && equipment.siteFilter !== EQUIPMENT_ALL_SITES_FILTER);

  const toggleSelectMode = useCallback(() => {
    actions.setIsSelectMode(prev => !prev);
    actions.setSelectedEquipment([]);
  }, [actions]);

  const closeCompletedWorkAlert = useCallback(() => {
    equipment.setIsCompletedWorkAlertVisible(false);
  }, [equipment]);

  const closeDeleteModal = useCallback(() => actions.setShowDeleteModal(false), [actions]);
  const closeStatusModal = useCallback(() => actions.setShowStatusModal(false), [actions]);
  const closeExportModal = useCallback(() => actions.setShowExportModal(false), [actions]);

  const resetExportColumns = useCallback(() => {
    actions.setExportColumns(EQUIPMENT_DEFAULT_EXPORT_COLUMNS);
  }, [actions]);

  const requestExport = useCallback(() => {
    actions.setShowExportModal(true);
  }, [actions]);

  const confirmExport = useCallback(async () => {
    try {
      const fullList = await equipment.fetchEquipmentsForExport();
      if (!fullList.length) {
        actions.setShowExportModal(false);
        actions.showStatus('No data available to export.', true);
        return;
      }
      const result = buildAndDownloadExcel(fullList, actions.exportColumns);
      actions.setShowExportModal(false);
      actions.showStatus(result.message, !result.success);
    } catch (err) {
      actions.setShowExportModal(false);
      actions.showStatus('Error exporting equipment: ' + err.message, true);
    }
  }, [equipment, actions]);

  const printVisibleEquipment = useCallback(async () => {
    try {
      const fullList = await equipment.fetchEquipmentsForExport();
      printEquipmentTable(fullList, searchTerm);
    } catch (err) {
      actions.showStatus('Error printing equipment: ' + err.message, true);
    }
  }, [equipment, searchTerm, actions]);

  const clearImageCache = useCallback(() => {
    imageCache.clearAllCache();
    actions.showStatus('Image cache cleared. Reload to fetch fresh images.');
  }, [imageCache, actions]);

  const onAddFormChange = useCallback((field, value) => {
    if (isOperatorNameField(field)) operatorSearch.searchOperators(value);
    actions.setAddEquipmentForm(prev => patchEquipmentFormField(prev, field, value, operatorSearch.operators));
  }, [actions, operatorSearch]);

  const onEditFormChange = useCallback((field, value) => {
    if (isOperatorNameField(field)) operatorSearch.searchOperators(value);
    actions.setEditFormData(prev => patchEquipmentFormField(prev, field, value, operatorSearch.operators));
  }, [actions, operatorSearch]);

  const onAddShiftFormChange = useCallback((field, value) => {
    if (isOperatorNameField(field)) operatorSearch.searchOperators(value);
    actions.setAddShiftForm(prev => patchAddShiftFormField(prev, field, value, operatorSearch.operators));
  }, [actions, operatorSearch]);

  const onAddShiftOperatorAdd = useCallback(() => {
    actions.setAddShiftForm(prev => ({ ...prev, operators: [...prev.operators, createEmptyShiftEntry()] }));
  }, [actions]);

  const onAddShiftOperatorRemove = useCallback((index) => {
    actions.setAddShiftForm(prev => ({ ...prev, operators: prev.operators.filter((_, i) => i !== index) }));
  }, [actions]);

  const onMobilizeFormChange = useCallback((field, value) => {
    if (isOperatorNameField(field)) operatorSearch.searchOperators(value);
    actions.setMobilizeForm(prev => patchMobilizeFormField(prev, field, value, operatorSearch.operators));
  }, [actions, operatorSearch]);

  const onMobilizeOperatorAdd = useCallback(() => {
    actions.setMobilizeForm(prev => ({ ...prev, operators: [...prev.operators, createEmptyShiftEntry()] }));
  }, [actions]);

  const onMobilizeOperatorChange = useCallback((index, field, value) => {
    if (field === 'operatorName') operatorSearch.searchOperators(value);
    actions.setMobilizeForm(prev => {
      const updatedOperators = [...prev.operators];
      if (field === 'operatorName') {
        const matchedOperator = operatorSearch.operators.find(o => o.name === value);
        updatedOperators[index] = {
          ...updatedOperators[index],
          operatorName: value,
          operatorId: matchedOperator?._id || matchedOperator?.id || '',
          shiftName: value,
        };
      } else {
        updatedOperators[index] = { ...updatedOperators[index], [field]: value };
      }
      return { ...prev, operators: updatedOperators };
    });
  }, [actions, operatorSearch]);

  const onMobilizeOperatorRemove = useCallback((index) => {
    actions.setMobilizeForm(prev => ({ ...prev, operators: prev.operators.filter((_, i) => i !== index) }));
  }, [actions]);

  const onDemobilizeFormChange = useCallback((field, value) => {
    actions.setDemobilizeForm(prev => ({ ...prev, [field]: value }));
  }, [actions]);

  const onReplaceOperatorFormChange = useCallback((field, value) => {
    if (isOperatorNameField(field)) operatorSearch.searchOperators(value);
    actions.setReplaceOperatorForm(prev => patchReplaceOperatorFormField(prev, field, value, operatorSearch.operators));
  }, [actions, operatorSearch]);

  const onReplaceEquipmentFormChange = useCallback((field, value) => {
    if (field === 'replacedEquipmentRegNo') {
      actions.handleReplaceEquipmentSearch(value);
      const selected = actions.replaceEquipmentResults.find(eq => eq.regNo === value);
      if (selected) {
        actions.handleReplaceEquipmentSelect(selected);
        return;
      }
    }
    if (isOperatorNameField(field)) operatorSearch.searchOperators(value);
    actions.setReplaceEquipmentForm(prev => patchReplaceEquipmentFormField(prev, field, value, operatorSearch.operators));
  }, [actions, operatorSearch]);

  const onAddAsOutside = useCallback(() => {
    actions.setOutsideEquipmentForm(prev => ({ ...prev, regNo: searchTerm }));
    actions.setShowOutsideEquipmentModal(true);
  }, [actions, searchTerm]);

  const closeAddModal = useCallback(() => { operatorSearch.clear(); actions.closeAddModal(); }, [actions, operatorSearch]);
  const closeEditModal = useCallback(() => { operatorSearch.clear(); actions.closeEditModal(); }, [actions, operatorSearch]);
  const closeMobilizeModal = useCallback(() => { operatorSearch.clear(); actions.closeMobilizeModal(); }, [actions, operatorSearch]);
  const closeAddShiftModal = useCallback(() => { operatorSearch.clear(); actions.closeAddShiftModal(); }, [actions, operatorSearch]);
  const closeReplaceOperatorModal = useCallback(() => { operatorSearch.clear(); actions.closeReplaceOperatorModal(); }, [actions, operatorSearch]);
  const closeReplaceEquipmentModal = useCallback(() => { operatorSearch.clear(); actions.closeReplaceEquipmentModal(); }, [actions, operatorSearch]);

  return {
    searchTerm,
    isEquipmentGridTab,
    equipment: { ...equipment, operatorOptions: operatorSearch.operators },
    actions: {
      ...actions,
      toggleSelectMode,
      closeCompletedWorkAlert,
      closeDeleteModal,
      closeStatusModal,
      closeExportModal,
      resetExportColumns,
      requestExport,
      confirmExport,
      printVisibleEquipment,
      clearImageCache,
      onAddFormChange,
      onEditFormChange,
      onAddShiftFormChange,
      onAddShiftOperatorAdd,
      onAddShiftOperatorRemove,
      onMobilizeFormChange,
      onMobilizeOperatorAdd,
      onMobilizeOperatorChange,
      onMobilizeOperatorRemove,
      onDemobilizeFormChange,
      onReplaceOperatorFormChange,
      onReplaceEquipmentFormChange,
      onAddAsOutside,
      closeAddModal,
      closeEditModal,
      closeMobilizeModal,
      closeAddShiftModal,
      closeReplaceOperatorModal,
      closeReplaceEquipmentModal,
    },
  };
};