import { DEFAULT_CHECKLIST, NEXT_SERVICE_INCREMENT } from '../constants/maintenance.record.form.constant';

let uidCounter = 0;

export const createUid = () => `c${++uidCounter}_${Date.now()}`;

export const calcNextServiceValue = (val, increment = NEXT_SERVICE_INCREMENT) => {
  if (!val) return '';
  const upper = String(val).toUpperCase();

  if (upper.endsWith('KM'))  { const n = parseInt(upper); return isNaN(n) ? '' : `${n + increment}KM`;  }
  if (upper.endsWith('HRS')) { const n = parseInt(upper); return isNaN(n) ? '' : `${n + increment}HRS`; }

  const n = parseInt(upper);
  return isNaN(n) ? '' : `${n + increment}`;
};

export const checklistDefaultsForType = (serviceType) =>
  DEFAULT_CHECKLIST.map((item) => ({
    ...item,
    status: (serviceType === 'oil' || serviceType === 'normal') && item.id <= 24 ? '✓' : '',
  }));

export const buildCard = (regNo = '', machine = '', operator = '') => ({
  id: createUid(),
  regNo, machine, operator,
  serviceType:    'oil',
  date:           new Date().toISOString().split('T')[0],
  serviceHrs:     '',
  nextServiceHrs: '',
  fullService:    false,
  tyreModel:      '',
  tyreNumber:     '',
  batteryModel:   '',
  mechanics:      '',
  location:       '',
  remarks:        '',
  oil:            'Check',
  oilFilter:      'Check',
  fuelFilter:     'Check',
  acFilter:       'Clean',
  airFilter:      'Clean',
  waterSeparator: 'Check',
  checklistItems: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
  _status: 'idle',
  _error:  '',
});

export const groupCardsByRegAndType = (cards) => {
  const groups = {};
  cards.forEach((card) => {
    const key = `${card.regNo}__${card.serviceType}`;
    (groups[key] = groups[key] || []).push(card);
  });
  return groups;
};

export const buildBatchPayload = (groupCards) => {
  const first = groupCards[0];

  return {
    type: first.serviceType,
    sharedData: {
      regNo:          first.regNo,
      machine:        first.machine,
      location:       first.location,
      mechanics:      first.mechanics,
      operator:       first.operator,
      operatorName:   first.operator,
      remarks:        first.remarks,
      checklistItems: first.checklistItems,
      oil:            first.oil,
      oilFilter:      first.oilFilter,
      fuelFilter:     first.fuelFilter,
      acFilter:       first.acFilter,
      airFilter:      first.airFilter,
      waterSeparator: first.waterSeparator,
      tyreModel:      first.tyreModel,
      tyreNumber:     first.tyreNumber,
      batteryModel:   first.batteryModel,
    },
    records: groupCards.map((card) => ({
      date:           card.date,
      serviceHrs:     card.serviceHrs     || null,
      nextServiceHrs: card.nextServiceHrs || null,
      workRemarks:    card.remarks        || null,
      remarks:        card.remarks        || null,
      fullService:    card.fullService,
    })),
  };
};

export const markCardsStatus = (cards, ids, status, errorsById = {}) =>
  cards.map((card) =>
    ids.includes(card.id) ? { ...card, _status: status, _error: errorsById[card.id] || '' } : card
  );

// Returns, per section key, the list of missing required field names for this
// card. Used to color that card's item in the single shared Tabs bar with
// var(--warning-color-400) when something in that section is still empty.
export const getCardMissingFields = (card) => {
  const missing = { equipment: [], type: [], history: [], report: [] };

  if (!card.regNo && card.regNo !== 0) missing.equipment.push('regNo');
  if (!card.machine) missing.equipment.push('machine');

  if (card.serviceType === 'tyre') {
    if (!card.tyreModel) missing.type.push('tyreModel');
    if (!card.tyreNumber) missing.type.push('tyreNumber');
  }
  if (card.serviceType === 'battery' && !card.batteryModel) missing.type.push('batteryModel');

  if (!card.date) missing.history.push('date');
  if (!card.location) missing.history.push('location');
  if (!card.mechanics) missing.history.push('mechanics');

  return missing;
};

export const cardHasAnyMissingField = (card) => {
  const missing = getCardMissingFields(card);
  return missing.equipment.length + missing.type.length + missing.history.length + missing.report.length > 0;
};