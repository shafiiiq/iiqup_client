export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const isDateWithinFilterRange = (dateString, dateRangeFilter) => {
  if (!dateString) return false;

  const { dateFilterMode, lastMonthsCount, customStartDate, customEndDate } = dateRangeFilter;
  const itemDate = new Date(dateString);
  const now = new Date();

  switch (dateFilterMode) {
    case 'all':
      return true;

    case 'lastXmonths': {
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - lastMonthsCount + 1, 1);
      rangeStart.setHours(0, 0, 0, 0);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      return itemDateOnly >= rangeStart;
    }

    case 'thisMonth':
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();

    case 'custom': {
      if (!customStartDate || !customEndDate) return true;
      const rangeStart = new Date(customStartDate);
      const rangeEnd = new Date(customEndDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
      return itemDate >= rangeStart && itemDate <= rangeEnd;
    }

    default:
      return true;
  }
};

export const getDateRangeLabel = ({ dateFilterMode, lastMonthsCount, customStartDate, customEndDate }) => {
  switch (dateFilterMode) {
    case 'all':
      return 'All Time';
    case 'lastXmonths':
      return `Last ${lastMonthsCount} Month${lastMonthsCount !== 1 ? 's' : ''}`;
    case 'thisMonth':
      return 'This Month';
    case 'custom':
      return customStartDate && customEndDate
        ? `${formatDate(customStartDate)} to ${formatDate(customEndDate)}`
        : 'Custom Date Range';
    default:
      return 'All Time';
  }
};

export const getDateRangeFileNameSuffix = ({ dateFilterMode, lastMonthsCount, customStartDate, customEndDate }) => {
  switch (dateFilterMode) {
    case 'lastXmonths':
      return `_Last_${lastMonthsCount}_Months`;
    case 'thisMonth':
      return '_This_Month';
    case 'custom':
      return customStartDate && customEndDate ? `_${customStartDate}_to_${customEndDate}` : '';
    default:
      return '';
  }
};

const SERVICE_TYPE_BADGE_BY_TYPE = {
  normal: { label: 'Normal', className: 'badge-normal' },
  oil: { label: 'Oil', className: 'badge-oil' },
  major: { label: 'Major Works', className: 'badge-major' },
  tyre: { label: 'Tyre', className: 'badge-tyre' },
  battery: { label: 'Battery', className: 'badge-battery' },
};

export const getServiceTypeBadge = (serviceType) =>
  SERVICE_TYPE_BADGE_BY_TYPE[serviceType] || { label: 'Unknown', className: 'badge-default' };

const SERVICE_TAB_LABEL_BY_TAB = {
  all: 'All Services',
  oil: 'Oil Service',
  normal: 'Normal Service',
  major: 'Major Works',
  tyre: 'Tyre Service',
  battery: 'Battery Service',
};

export const getServiceTabLabel = (activeTab) => SERVICE_TAB_LABEL_BY_TAB[activeTab] || 'All Services';

export const getServiceWorkDescription = (item, fallback = '-') => {
  if (item.serviceType === 'oil' || item.serviceType === 'normal') {
    return [
      `Filters: Fuel Filter: ${item.fuelFilter || '-'}`,
      `Water Sep: ${item.waterSeparator || '-'}`,
      `Air Filter: ${item.airFilter || '-'}`,
      item.acFilter ? `A/C Filter: ${item.acFilter}` : null,
    ].filter(Boolean).join(', ');
  }
  return item.remarks?.toUpperCase() || fallback;
};

const SERVICE_TYPES_WITH_REMARKS = new Set(['oil', 'normal', 'major', 'tyre', 'battery']);

export const getServiceRemarksText = (item) =>
  SERVICE_TYPES_WITH_REMARKS.has(item.serviceType) ? item.remarks?.toUpperCase() || '-' : '';

export const getServiceRowBackgroundHex = (item) => {
  if (item.fullService || item.replaced) return 'FFFFD3A5';
  const hexByType = {
    oil: 'FFE8F5E8',
    normal: 'FFF8D7DA',
    major: 'FFFFF3CD',
    tyre: 'FFD1ECF1',
    battery: 'FFF8D7DA',
  };
  return hexByType[item.serviceType] || 'FFFFFFFF';
};

export const getServiceRowBackgroundRgb = (item) => {
  if (item.fullService || item.replaced) return [255, 211, 165];
  const rgbByType = {
    oil: [232, 245, 232],
    normal: [248, 215, 218],
    major: [255, 243, 205],
    tyre: [209, 236, 241],
    battery: [248, 215, 218],
  };
  return rgbByType[item.serviceType] || [255, 255, 255];
};

export const loadImageAsDataUrl = (imageSrc) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext('2d').drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = imageSrc;
  });

export const setNestedFormValue = (formValues, dotPath, value) => {
  const [firstKey, ...remainingKeys] = dotPath.split('.');
  if (remainingKeys.length === 0) return { ...formValues, [firstKey]: value };
  return {
    ...formValues,
    [firstKey]: setNestedFormValue(formValues[firstKey] ?? {}, remainingKeys.join('.'), value),
  };
};