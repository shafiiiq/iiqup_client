export const getOperatorName = (certificationBody) => {
  if (!Array.isArray(certificationBody) || certificationBody.length === 0) return 'N/A';

  const lastItem = certificationBody[certificationBody.length - 1];

  if (typeof lastItem === 'string') return lastItem.toUpperCase();
  if (lastItem?.operatorName) return lastItem.operatorName.toUpperCase();
  return 'N/A';
};

export const getOperatorId = (certificationBody, operatorList) => {
  if (!Array.isArray(certificationBody) || certificationBody.length === 0) return '';

  const lastItem = certificationBody[certificationBody.length - 1];
  const operatorName = typeof lastItem === 'string' ? lastItem : lastItem?.operatorName;

  if (!operatorName) return '';

  const found = operatorList.find(op => op.name === operatorName);
  return found?._id || found?.id || '';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return `${date.getDate()}, ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatDateWithExpiry = (dateString) => {
  if (!dateString) return { formattedDate: '', isExpired: false };

  const dateParts = dateString.split('/');
  if (dateParts.length !== 3) return { formattedDate: dateString, isExpired: false };

  const [month, day, year] = dateParts;
  const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  const itemDate = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return { formattedDate, isExpired: itemDate < today };
};

export const getCurrentDateTime = () => {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { month: now.getMonth() + 1, year: now.getFullYear(), time };
};

export const findEquipmentWithImages = (data, startIndex, direction) => {
  let idx = startIndex;
  while (idx >= 0 && idx < data.length) {
    const eq = data[idx];
    if (eq?.equipmentImage?.length > 0) return eq;
    idx += direction;
  }
  return null;
};

export const groupEquipmentBySite = (equipmentList) => {
  if (!equipmentList || equipmentList.length === 0) return {};

  return equipmentList.reduce((acc, equipment) => {
    let site = equipment.site;

    if (Array.isArray(site)) {
      site = site[site.length - 1] || 'Unassigned';
    } else {
      site = site || 'Unassigned';
    }

    if (!acc[site]) acc[site] = [];
    acc[site].push(equipment);
    return acc;
  }, {});
};

export const resolveActionDateTime = (dateString, timeString) => {
  const fallback = getCurrentDateTime();
  if (!dateString) return { ...fallback, time: timeString || fallback.time };

  const date = new Date(dateString);
  return { month: date.getMonth() + 1, year: date.getFullYear(), time: timeString || fallback.time };
};

const OPERATOR_NAME_FIELDS = new Set(['operator', 'replacedOperator']);
const OPERATOR_ARRAY_FIELD_PATTERN = /^(?:operators|addShift_operators)\[\d+\]\.operatorName$/;

export const isOperatorNameField = (field) =>
  OPERATOR_NAME_FIELDS.has(field) || OPERATOR_ARRAY_FIELD_PATTERN.test(field);