import { API_URI } from '@shared/constants';

export const SIGNATURE_EXPIRY_MS = 10_000;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const MAX_AUTH_ATTEMPTS = 3;

export const getServiceTypeName = (type) => {
  const map = {
    oil: 'Oil Service',
    normal: 'Normal Service',
    major: 'Major Works',
    maintenance: 'Major Works',
    tyre: 'Tyre Service',
    battery: 'Battery Service',
  };
  return map[type] || 'Service';
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateString;
};

export const formatTimeRemaining = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const resolveReportUrl = (pathname, serviceTypes, { regNo, startDate, endDate, monthsCount }) => {
  const typeQuery = serviceTypes.length ? `?serviceTypes=${serviceTypes.join(',')}` : '';

  if (pathname.includes('/all/all-histories/')) {
    return { url: `${API_URI}/service-report/histories/${regNo}/all${typeQuery}`, isMultiple: true };
  }
  if (pathname.includes('/all/date-range/')) {
    const serviceType = pathname.split('/')[3];
    return { url: `${API_URI}/service-report/histories/${regNo}/${serviceType}/date-range/${startDate}/${endDate}${typeQuery}`, isMultiple: true };
  }
  if (pathname.includes('/all/last-months/')) {
    const serviceType = pathname.split('/')[3];
    return { url: `${API_URI}/service-report/histories/${regNo}/${serviceType}/last-months/${monthsCount}${typeQuery}`, isMultiple: true };
  }

  return { url: null, isMultiple: false };
};
