import { DEFAULT_CHECKLIST, CHECKLIST_STATUS } from '../../constants/maintenance.constant';
import { isOilOrNormalService, getTodayIsoDate } from '../../helper/maintenance.helper';
import {
  FORM_SECTIONS,
  NEXT_SERVICE_INCREMENT,
  UNASSIGNED_OPERATOR_NAMES,
  OIL_SERVICE_CHECKED_ITEM_IDS,
  TYRE_SERVICE_CHECKED_ITEM_IDS,
  BATTERY_SERVICE_CHECKED_ITEM_IDS,
} from '../constants/maintenance.form.constant';

export const createLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const buildEmptyRow = () => ({
  id: createLocalId(),
  date: getTodayIsoDate(),
  serviceHrs: '',
  nextServiceHrs: '',
  fullService: false,
  isNextServiceEdited: false,
});

const SERVICE_HOURS_PATTERN = /^\s*([\d,]*\.?\d+)\s*([A-Za-z]*)\s*$/;

export const calculateNextService = (value, increment = NEXT_SERVICE_INCREMENT) => {
  if (!value) return '';
  const match = SERVICE_HOURS_PATTERN.exec(String(value).toUpperCase());
  if (!match) return '';
  const parsedNumber = Number.parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(parsedNumber)) return '';
  return `${parsedNumber + increment}${match[2]}`;
};

export const applyRowChange = (row, field, value, serviceType) => {
  if (field === 'nextServiceHrs') {
    const upperValue = value.toUpperCase();
    return { ...row, nextServiceHrs: upperValue, isNextServiceEdited: upperValue !== '' };
  }
  if (field === 'serviceHrs') {
    const upperValue = value.toUpperCase();
    const updatedRow = { ...row, serviceHrs: upperValue };
    if (row.isNextServiceEdited || !isOilOrNormalService(serviceType)) return updatedRow;
    return { ...updatedRow, nextServiceHrs: calculateNextService(upperValue) };
  }
  return { ...row, [field]: value };
};

export const recalculateRowsForServiceType = (rows, serviceType) =>
  rows.map((row) =>
    row.isNextServiceEdited
      ? row
      : {
          ...row,
          nextServiceHrs: isOilOrNormalService(serviceType) ? calculateNextService(row.serviceHrs) : '',
        }
  );

export const resolveEquipmentAutofill = (equipment) => {
  const assignedOperatorNames = (equipment.certificationBody || [])
    .map((entry) => String(entry.operatorName || '').trim())
    .filter((operatorName) => !UNASSIGNED_OPERATOR_NAMES.includes(operatorName.toLowerCase()));

  return {
    equipment: equipment.machine || '',
    operator: assignedOperatorNames[assignedOperatorNames.length - 1] || '',
  };
};

const getEngineOilDescription = (oil, oilFilter) => {
  if (oilFilter === 'Check' && oil === 'Check') return 'Check Engine oil & Filter';
  if (oilFilter === 'Check' && oil === 'Change') return 'Checked Filter & Changed Engine oil';
  if (oilFilter === 'Change' && oil === 'Check') return 'Checked Engine oil & Changed Filter';
  return 'Change Engine oil & Filter';
};

export const applyOilChecklistDescriptions = (items, source) => {
  const { oil, oilFilter, fuelFilter, airFilter, acFilter, waterSeparator } = source;

  return items.map((item) => {
    switch (item.id) {
      case 1:
        return { ...item, description: getEngineOilDescription(oil, oilFilter) };
      case 2:
        return { ...item, description: fuelFilter === 'Check' ? 'Check Fuel Filter' : 'Change Fuel Filter' };
      case 3:
        return { ...item, description: airFilter === 'Change' ? 'Check/Change Air Filter' : 'Check/Clean Air Filter' };
      case 34:
        return { ...item, description: acFilter === 'Check' ? 'Check A/C Filter' : 'Clean A/C Filter' };
      case 35:
        return { ...item, description: waterSeparator === 'Check' ? 'Check Water Separator' : 'Change Water Separator' };
      default:
        return item;
    }
  });
};

const markCheckedItems = (items, checkedItemIds) =>
  items.map((item) => ({
    ...item,
    status: checkedItemIds.includes(item.id) ? CHECKLIST_STATUS.YES : CHECKLIST_STATUS.EMPTY,
  }));

export const buildChecklistForServiceType = (serviceType, source) => {
  const freshItems = DEFAULT_CHECKLIST.map((item) => ({ ...item }));

  switch (serviceType) {
    case 'tyre':
      return markCheckedItems(freshItems, TYRE_SERVICE_CHECKED_ITEM_IDS);
    case 'battery':
      return markCheckedItems(freshItems, BATTERY_SERVICE_CHECKED_ITEM_IDS);
    case 'oil':
    case 'normal':
      return applyOilChecklistDescriptions(markCheckedItems(freshItems, OIL_SERVICE_CHECKED_ITEM_IDS), source);
    default:
      return markCheckedItems(freshItems, []);
  }
};

export const buildDefaultFormData = (regNo = '', serviceType = 'oil') => {
  const formData = {
    serviceType,
    regNo,
    equipment: '',
    location: '',
    mechanics: '',
    operator: '',
    oil: 'Check',
    oilFilter: 'Check',
    fuelFilter: 'Check',
    acFilter: 'Clean',
    airFilter: 'Clean',
    waterSeparator: 'Check',
    tyreModel: '',
    tyreNumber: '',
    batteryModel: '',
    remarks: '',
    checklistItems: [],
  };

  return { ...formData, checklistItems: buildChecklistForServiceType(serviceType, formData) };
};

export const mapMaintenanceToFormData = (record) => {
  const defaults = buildDefaultFormData(record.regNo, record.serviceType);

  return {
    ...defaults,
    equipment: record.equipment || '',
    location: record.location || '',
    mechanics: record.mechanics || '',
    operator: record.operator || '',
    remarks: record.remarks || '',
    oil: record.oil || defaults.oil,
    oilFilter: record.oilFilter || defaults.oilFilter,
    fuelFilter: record.fuelFilter || defaults.fuelFilter,
    acFilter: record.acFilter || defaults.acFilter,
    airFilter: record.airFilter || defaults.airFilter,
    waterSeparator: record.waterSeparator || defaults.waterSeparator,
    tyreModel: record.tyreModel || '',
    tyreNumber: record.tyreNumber || '',
    batteryModel: record.batteryModel || '',
    checklistItems: record.checklistItems?.length
      ? record.checklistItems
      : DEFAULT_CHECKLIST.map((item) => ({ ...item })),
  };
};

export const mapMaintenanceToRow = (record) => ({
  id: createLocalId(),
  date: record.date?.slice(0, 10) || getTodayIsoDate(),
  serviceHrs: record.serviceHrs || '',
  nextServiceHrs: record.nextServiceHrs || '',
  fullService: Boolean(record.fullService),
  isNextServiceEdited: Boolean(record.nextServiceHrs),
});

export const getMissingFieldsBySection = (formData, rows) => {
  const missing = Object.fromEntries(Object.values(FORM_SECTIONS).map((section) => [section, []]));

  if (formData.serviceType === 'tyre') {
    if (!formData.tyreModel) missing[FORM_SECTIONS.TYPE].push('tyreModel');
    if (!formData.tyreNumber) missing[FORM_SECTIONS.TYPE].push('tyreNumber');
  }
  if (formData.serviceType === 'battery' && !formData.batteryModel) {
    missing[FORM_SECTIONS.TYPE].push('batteryModel');
  }

  ['regNo', 'equipment', 'location', 'mechanics', 'operator'].forEach((fieldName) => {
    if (!formData[fieldName]) missing[FORM_SECTIONS.DETAILS].push(fieldName);
  });

  const isNextServiceRequired = isOilOrNormalService(formData.serviceType);
  if (rows.some((row) => !row.date || !row.serviceHrs || (isNextServiceRequired && !row.nextServiceHrs))) {
    missing[FORM_SECTIONS.ROWS].push('rows');
  }

  if (formData.serviceType === 'major' && !formData.remarks) missing[FORM_SECTIONS.REPORT].push('remarks');

  return missing;
};

const buildSharedPayload = ({ formData, attachmentSessionIds }) => ({
  serviceType: formData.serviceType,
  regNo: formData.regNo,
  equipment: formData.equipment,
  location: formData.location,
  mechanics: formData.mechanics,
  operator: formData.operator,
  remarks: formData.remarks,
  checklistItems: formData.checklistItems,
  attachmentSessionIds,
  ...(isOilOrNormalService(formData.serviceType) && {
    oil: formData.oil,
    oilFilter: formData.oilFilter,
    fuelFilter: formData.fuelFilter,
    acFilter: formData.acFilter,
    airFilter: formData.airFilter,
    waterSeparator: formData.waterSeparator,
  }),
  ...(formData.serviceType === 'tyre' && { tyreModel: formData.tyreModel, tyreNumber: formData.tyreNumber }),
  ...(formData.serviceType === 'battery' && { batteryModel: formData.batteryModel }),
});

const pickRowFields = ({ date, serviceHrs, nextServiceHrs, fullService }) => ({
  date,
  serviceHrs,
  nextServiceHrs,
  fullService,
});

export const buildCreatePayload = ({ formData, rows, attachmentSessionIds, complaintId }) => ({
  ...buildSharedPayload({ formData, attachmentSessionIds }),
  ...(complaintId && { complaintId }),
  rows: rows.map(pickRowFields),
});

export const buildUpdatePayload = ({ formData, row, attachmentSessionIds }) => ({
  ...buildSharedPayload({ formData, attachmentSessionIds }),
  ...pickRowFields(row),
});