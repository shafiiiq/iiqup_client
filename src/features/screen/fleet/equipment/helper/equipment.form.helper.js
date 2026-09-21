import { getOperatorName, resolveActionDateTime } from './equipment.helper';
import { EQUIPMENT_MOBILIZE_DEFAULT_SHIFTS, EQUIPMENT_EMPTY_SHIFT_ENTRY } from '../constants/equipment.constant';

const matchOperatorId = (operatorOptions, name) => {
  const matched = operatorOptions.find(o => o.name === name);
  return matched?._id || matched?.id || '';
};

const formatDateForInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

export const patchEquipmentFormField = (prevForm, field, value, operatorOptions) => {
  if (field === 'operator') {
    return { ...prevForm, operator: value, operatorId: matchOperatorId(operatorOptions, value) };
  }
  if (field === 'site') {
    return { ...prevForm, site: typeof value === 'string' ? value : value?.value || value };
  }
  if (field.startsWith('rentRate.')) {
    const key = field.split('.')[1];
    return { ...prevForm, rentRate: { ...prevForm.rentRate, [key]: value } };
  }
  return { ...prevForm, [field]: value };
};

export const patchAddShiftFormField = (prevForm, field, value, operatorOptions) => {
  const operatorFieldMatch = field.match(/^addShift_operators\[(\d+)\]\.(.+)$/);

  if (operatorFieldMatch) {
    const index = Number(operatorFieldMatch[1]);
    const subField = operatorFieldMatch[2];
    const updatedOperators = [...prevForm.operators];

    updatedOperators[index] = subField === 'operatorName'
      ? { ...updatedOperators[index], operatorName: value, operatorId: matchOperatorId(operatorOptions, value) }
      : { ...updatedOperators[index], [subField]: value };

    return { ...prevForm, operators: updatedOperators };
  }

  const key = field.replace('addShift_', '');
  return { ...prevForm, [key]: value };
};

export const patchMobilizeFormField = (prevForm, field, value, operatorOptions) => {
  const operatorFieldMatch = field.match(/^operators\[(\d+)\]\.(.+)$/);

  if (operatorFieldMatch) {
    const index = Number(operatorFieldMatch[1]);
    const subField = operatorFieldMatch[2];
    const updatedOperators = [...prevForm.operators];

    updatedOperators[index] = subField === 'operatorName'
      ? { ...updatedOperators[index], operatorName: value, operatorId: matchOperatorId(operatorOptions, value) }
      : { ...updatedOperators[index], [subField]: value };

    return { ...prevForm, operators: updatedOperators };
  }

  if (field === 'withShift') {
    return {
      ...prevForm,
      withShift: value,
      moreShifts: false,
      operators: value ? EQUIPMENT_MOBILIZE_DEFAULT_SHIFTS.map(shift => ({ ...shift })) : [],
    };
  }

  if (field === 'moreShifts') {
    return {
      ...prevForm,
      moreShifts: value,
      operators: value ? prevForm.operators : EQUIPMENT_MOBILIZE_DEFAULT_SHIFTS.map(shift => ({ ...shift })),
    };
  }

  if (field === 'operator') {
    return { ...prevForm, operator: value, operatorId: matchOperatorId(operatorOptions, value) };
  }

  if (field === 'deployType') {
    return {
      ...prevForm,
      deployType: value,
      site: value === 'company' ? '' : prevForm.site,
      clientCompany: value === 'site' ? '' : prevForm.clientCompany,
    };
  }

  return { ...prevForm, [field]: value };
};

export const patchDemobilizeFormField = (prevForm, field, value) => {
  if (field === 'selectedShift') {
    const shift = prevForm.allShifts.find(s => (s.shiftName || s.operatorName) === value);
    return { ...prevForm, selectedShift: value, targetShiftName: shift?.shiftName || '' };
  }
  if (field === 'demobAll') {
    return { ...prevForm, demobAll: value, selectedShift: value ? '' : prevForm.selectedShift };
  }
  return { ...prevForm, [field]: value };
};

export const patchReplaceOperatorFormField = (prevForm, field, value, operatorOptions) => {
  if (field === 'selectedShift') {
    const shift = prevForm.allShifts.find(s => (s.shiftName || s.operatorName) === value);
    return {
      ...prevForm,
      selectedShift: value,
      currentOperator: shift?.operatorName || '',
      currentOperatorId: shift?.operatorId || '',
      targetShiftName: shift?.shiftName || '',
      shiftName: shift?.shiftName || '',
      shiftStart: shift?.shiftStart || '',
      shiftEnd: shift?.shiftEnd || '',
    };
  }

  if (field === 'replacedOperator') {
    return { ...prevForm, replacedOperator: value, replacedOperatorId: matchOperatorId(operatorOptions, value) };
  }

  if (field === 'replaceAll') {
    return {
      ...prevForm,
      replaceAll: value,
      selectedShift: '',
      currentOperator: '',
      currentOperatorId: '',
      targetShiftName: '',
    };
  }

  return { ...prevForm, [field]: value };
};

export const patchReplaceEquipmentFormField = (prevForm, field, value, operatorOptions) => {
  if (field === 'replacedEquipmentRegNo') {
    return { ...prevForm, replacedEquipmentRegNo: value, replacedEquipmentMachine: '', replacedEquipmentId: '' };
  }
  if (field === 'operator') {
    return { ...prevForm, operator: value, operatorId: matchOperatorId(operatorOptions, value) };
  }
  return { ...prevForm, [field]: value };
};

export const createEmptyShiftEntry = () => ({ ...EQUIPMENT_EMPTY_SHIFT_ENTRY });


export const buildAddEquipmentPayload = (form) => {
  const certificationBody = form.operator && form.operatorId
    ? [{ operatorName: form.operator, operatorId: form.operatorId, shiftName: form.operatorShift || '', assignedAt: new Date() }]
    : [];

  const { operator, operatorId, ...rest } = form;

  return {
    ...rest,
    year: parseInt(form.year),
    certificationBody,
    site: form.site ? [form.site] : [],
    location: form.location || null,
    hired: form.company === 'HIRED',
    rentRate: (form.rentRate?.rate || form.rentRate?.basis)
      ? { basis: form.rentRate.basis || 'daily', rate: Number(form.rentRate.rate) || 0, currency: 'QAR' }
      : null,
  };
};

export const buildUpdateEquipmentPayload = (editEquipment, form) => {
  const payload = {
    ...editEquipment,
    machine: form.machine,
    regNo: form.regNo,
    coc: form.coc || '',
    brand: form.brand,
    year: form.year,
    company: form.company,
    site: form.site,
    status: form.status,
    hiredFrom: form.hiredFrom,
    istimaraExpiry: form.istimaraExpiry || null,
    insuranceExpiry: form.insuranceExpiry || null,
    tpcExpiry: form.tpcExpiry || null,
    location: form.location || '',
    rentRate: (form.rentRate?.rate || form.rentRate?.basis)
      ? { basis: form.rentRate.basis || 'daily', rate: Number(form.rentRate.rate) || 0, currency: 'QAR' }
      : null,
  };

  const previousOperatorEntry = editEquipment.certificationBody?.at(-1);
  const previousOperatorName = typeof previousOperatorEntry === 'string' ? previousOperatorEntry : previousOperatorEntry?.operatorName;

  if (form.operator !== previousOperatorName) {
    payload.operator = form.operator;
    payload.operatorId = form.operatorId;
    payload.operatorShift = form.operatorShift || '';
  }

  return payload;
};

export const buildOutsideEquipmentPayload = (form) => {
  const { operator, ...rest } = form;
  return { ...rest, certificationBody: [operator] };
};

export const buildMobilizePayload = (equipment, form) => {
  const { month, year, time } = resolveActionDateTime(form.date, form.time);

  const operators = form.withOperator
    ? (form.withShift
      ? form.operators
      : form.operator
        ? [{ operatorName: form.operator, operatorId: form.operatorId, shiftStart: '', shiftEnd: '', shiftName: form.singleOperatorShift || 'Full Shift' }]
        : [])
    : [];

  return {
    equipmentId: equipment._id,
    regNo: equipment.regNo,
    machine: equipment.machine,
    site: form.deployType === 'site' ? form.site : '',
    location: form.location || null,
    rentRate: (form['rentRate.rate'] || form['rentRate.basis'])
      ? { basis: form['rentRate.basis'] || 'daily', rate: Number(form['rentRate.rate']) || 0, currency: 'QAR' }
      : null,
    operators,
    withOperator: form.withOperator,
    deployType: form.deployType,
    clientCompany: form.deployType === 'company' ? form.clientCompany : '',
    month, year, time,
    selectedDate: form.date || null,
    remarks: form.remarks,
    isOneDayMob: form.isOneDayMob || false,
    demobDate: form.demobDate || null,
    demobTime: form.demobTime || '',
    demobRemarks: form.demobRemarks || '',
  };
};

export const buildAddShiftPayload = (equipment, form) => {
  const { month, year, time } = resolveActionDateTime(form.date, form.time);

  return {
    equipmentId: equipment._id,
    regNo: equipment.regNo,
    machine: equipment.machine,
    operators: form.operators,
    month, year, time,
    selectedDate: form.date || null,
    remarks: form.remarks || '',
  };
};

export const buildDemobilizePayload = (equipment, form) => {
  const { month, year, time } = resolveActionDateTime(form.date, form.time);
  const targetShift = form.allShifts?.find(s => (s.shiftName || s.operatorName) === form.selectedShift);

  return {
    equipmentId: equipment._id,
    regNo: equipment.regNo,
    machine: equipment.machine,
    month, year, time,
    selectedDate: form.date || null,
    remarks: form.remarks || '',
    demobAll: form.demobAll !== false,
    targetShiftName: targetShift?.shiftName || '',
    targetOperatorName: targetShift?.operatorName || '',
    targetOperatorId: targetShift?.operatorId || '',
  };
};

export const buildReplaceOperatorPayload = (equipment, form) => {
  const { month, year, time } = resolveActionDateTime(form.date, form.time);

  return {
    equipmentId: equipment._id,
    regNo: equipment.regNo,
    machine: equipment.machine,
    currentOperator: form.currentOperator,
    currentOperatorId: form.currentOperatorId,
    replacedOperator: form.replacedOperator,
    replacedOperatorId: form.replacedOperatorId,
    targetShiftName: form.targetShiftName || '',
    shiftName: form.shiftName || '',
    shiftStart: form.shiftStart || '',
    shiftEnd: form.shiftEnd || '',
    remarks: form.remarks || '',
    replaceAll: form.replaceAll || false,
    month, year, time,
    selectedDate: form.date || null,
  };
};

export const buildReplaceEquipmentPayload = (equipment, form) => {
  const { month, year, time } = resolveActionDateTime(form.date, form.time);

  return {
    equipmentId: equipment._id,
    regNo: equipment.regNo,
    machine: equipment.machine,
    replacedEquipmentId: form.replacedEquipmentId,
    replacedEquipmentRegNo: form.replacedEquipmentRegNo,
    replacedEquipmentMachine: form.replacedEquipmentMachine,
    newSiteForReplaced: form.newSiteForReplaced || null,
    month, year, time,
    selectedDate: form.date || null,
    remarks: form.remarks,
    operator: form.operator || '',
    operatorId: form.operatorId || '',
  };
};

export const buildEditFormFromEquipment = (equipment, operatorOptions, getOperatorNameFn, getOperatorIdFn) => ({
  machine: equipment.machine,
  regNo: equipment.regNo,
  coc: equipment.coc || '',
  brand: equipment.brand,
  site: equipment.site?.at(-1) || '',
  status: equipment.status,
  year: equipment.year,
  company: equipment.company,
  operator: getOperatorNameFn(equipment.certificationBody),
  operatorId: getOperatorIdFn(equipment.certificationBody, operatorOptions),
  operatorShift: equipment.certificationBody?.at(-1)?.shiftName || '',
  hiredFrom: equipment.hiredFrom || '',
  istimaraExpiry: formatDateForInput(equipment.istimaraExpiry),
  insuranceExpiry: formatDateForInput(equipment.insuranceExpiry),
  tpcExpiry: formatDateForInput(equipment.tpcExpiry),
  location: equipment.location || '',
  rentRate: equipment.rentRate || { basis: 'daily', rate: '', currency: 'QAR' },
  'rentRate.basis': equipment.rentRate?.basis || 'daily',
  'rentRate.rate': equipment.rentRate?.rate || '',
});

export const buildReplaceOperatorFormFromEquipment = (equipment, shiftEntry) => {
  const allShifts = equipment.certificationBody || [];
  const isSingleShift = allShifts.length <= 1;
  const entry = shiftEntry || (isSingleShift ? allShifts[0] : null);

  return {
    currentOperator: entry?.operatorName || '',
    currentOperatorId: entry?.operatorId || '',
    targetShiftName: entry?.shiftName || '',
    shiftName: entry?.shiftName || '',
    shiftStart: entry?.shiftStart || '',
    shiftEnd: entry?.shiftEnd || '',
    replacedOperator: '', replacedOperatorId: '', remarks: '', date: '', time: '',
    allShifts,
    selectedShift: isSingleShift ? (entry?.shiftName || entry?.operatorName || '') : '',
    replaceAll: false,
  };
};