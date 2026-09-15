import { DEFAULT_CHECKLIST, NEXT_SERVICE_INCREMENT } from '../constants/maintenance.entry.constant';

export const buildDefaultEntryData = (regNo = '', serviceType = 'oil') => ({
  serviceType: serviceType || 'oil',
  date: new Date().toISOString().split('T')[0],
  regNo: regNo || '',
  equipment: '',
  serviceHrs: '',
  nextServiceHrs: '',
  location: '',
  mechanics: '',
  operator: '',
  oil: 'Check',
  oilFilter: 'Check',
  fuelFilter: 'Check',
  acFilter: 'Clean',
  airFilter: 'Clean',
  waterSeparator: 'Check',
  fullService: false,
  tyreModel: '',
  tyreNumber: '',
  batteryModel: '',
  remarks: '',
  checklistItems: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
});

export const normaliseDate = (raw) => {
  if (!raw) return new Date().toISOString().split('T')[0];
  if (raw.includes('T')) return raw.split('T')[0];

  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('-');
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  return isNaN(parsed) ? new Date().toISOString().split('T')[0] : parsed.toISOString().split('T')[0];
};

export const calcNextService = (value, increment = NEXT_SERVICE_INCREMENT) => {
  if (!value) return '';
  const upper = String(value).toUpperCase();

  if (upper.endsWith('KM')) {
    const n = parseInt(upper, 10);
    return isNaN(n) ? '' : `${n + increment}KM`;
  }
  if (upper.endsWith('HRS')) {
    const n = parseInt(upper, 10);
    return isNaN(n) ? '' : `${n + increment}HRS`;
  }

  const n = parseInt(upper, 10);
  return isNaN(n) ? '' : `${n + increment}`;
};

export const applyOilServiceChecklist = (items, source) => {
  const { oil = '', oilFilter = '', fuelFilter = '', airFilter = '', acFilter = '', waterSeparator = '' } = source;

  return items.map((item) => {
    switch (item.id) {
      case 1: {
        const description =
          oilFilter === 'Check' && oil === 'Check' ? 'Check Engine oil & Filter' :
          oilFilter === 'Check' && oil === 'Change' ? 'Checked Filter & Changed Engine oil' :
          oilFilter === 'Change' && oil === 'Check' ? 'Checked Engine oil & Changed Filter' :
          'Change Engine oil & Filter';
        return { ...item, description, status: '✓' };
      }
      case 2:
        return { ...item, description: fuelFilter === 'Check' ? 'Check Fuel Filter' : 'Change Fuel Filter', status: '✓' };
      case 3:
        return { ...item, description: airFilter === 'Change' ? 'Check/Change Air Filter' : 'Check/Clean Air Filter', status: '✓' };
      case 34:
        return { ...item, description: acFilter === 'Check' ? 'Check A/C filter' : 'Clean A/C filter' };
      case 35:
        return { ...item, description: waterSeparator === 'Check' ? 'Check Water Seperator' : 'Change Water Seperator' };
      default:
        return item.id >= 4 && item.id <= 24 ? { ...item, status: '✓' } : item;
    }
  });
};

export const applyServiceTypeChecklist = (serviceType, items, source = {}) => {
  switch (serviceType) {
    case 'tyre':
      return items.map((item) => ({ ...item, status: item.id === 8 || item.id === 24 ? '✓' : '' }));
    case 'battery':
      return items.map((item) => ({ ...item, status: item.id === 10 ? '✓' : '' }));
    case 'oil':
    case 'normal':
      return applyOilServiceChecklist(items, source);
    case 'major':
      return items.map((item) => ({ ...item, status: '' }));
    default:
      return items;
  }
};

export const getMissingFieldsByTab = (formData) => {
  const missing = { type: [], history: [], report: [] };

  if (formData.serviceType === 'tyre') {
    if (!formData.tyreModel) missing.type.push('tyreModel');
    if (!formData.tyreNumber) missing.type.push('tyreNumber');
  }
  if (formData.serviceType === 'battery' && !formData.batteryModel) missing.type.push('batteryModel');

  if (!formData.date) missing.history.push('date');
  if (!formData.regNo) missing.history.push('regNo');
  if (!formData.equipment) missing.history.push('equipment');
  if (!formData.serviceHrs) missing.history.push('serviceHrs');
  if (!formData.nextServiceHrs) missing.history.push('nextServiceHrs');
  if (!formData.location) missing.history.push('location');
  if (!formData.mechanics) missing.history.push('mechanics');
  if (!formData.operator) missing.history.push('operator');

  if (formData.serviceType === 'major' && !formData.remarks) missing.report.push('remarks');

  return missing;
};