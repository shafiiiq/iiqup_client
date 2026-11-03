import { formatDate } from '../../helper/maintenance.helper';
import { DATE_RANGE_LABELS, DATE_RANGE_FILE_NAME_SUFFIXES } from '../constants/maintenance.list.constant';

export const getDateRangeLabel = ({ dateFilterMode, lastMonthsCount, customStartDate, customEndDate }) => {
  if (DATE_RANGE_LABELS[dateFilterMode]) return DATE_RANGE_LABELS[dateFilterMode];
  if (dateFilterMode === 'lastXmonths') return `Last ${lastMonthsCount} Month${lastMonthsCount !== 1 ? 's' : ''}`;
  if (dateFilterMode === 'custom') {
    return customStartDate && customEndDate
      ? `${formatDate(customStartDate)} to ${formatDate(customEndDate)}`
      : 'Custom Date Range';
  }
  return DATE_RANGE_LABELS.all;
};

export const getDateRangeFileNameSuffix = ({ dateFilterMode, lastMonthsCount, customStartDate, customEndDate }) => {
  if (DATE_RANGE_FILE_NAME_SUFFIXES[dateFilterMode]) return DATE_RANGE_FILE_NAME_SUFFIXES[dateFilterMode];
  if (dateFilterMode === 'lastXmonths') return `_Last_${lastMonthsCount}_Months`;
  if (dateFilterMode === 'custom' && customStartDate && customEndDate) {
    return `_${customStartDate}_to_${customEndDate}`;
  }
  return '';
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

export const getServiceRemarksText = (item) => item.remarks?.toUpperCase() || '-';

const ROW_BACKGROUND_HEX_BY_TYPE = {
  oil: 'FFE8F5E8',
  normal: 'FFF8D7DA',
  major: 'FFFFF3CD',
  tyre: 'FFD1ECF1',
  battery: 'FFF8D7DA',
};

const ROW_BACKGROUND_RGB_BY_TYPE = {
  oil: [232, 245, 232],
  normal: [248, 215, 218],
  major: [255, 243, 205],
  tyre: [209, 236, 241],
  battery: [248, 215, 218],
};

export const getServiceRowBackgroundHex = (item) => {
  if (item.fullService) return 'FFFFD3A5';
  return ROW_BACKGROUND_HEX_BY_TYPE[item.serviceType] || 'FFFFFFFF';
};

export const getServiceRowBackgroundRgb = (item) => {
  if (item.fullService) return [255, 211, 165];
  return ROW_BACKGROUND_RGB_BY_TYPE[item.serviceType] || [255, 255, 255];
};

export const loadImageAsDataUrl = (imageSource) =>
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
    image.src = imageSource;
  });