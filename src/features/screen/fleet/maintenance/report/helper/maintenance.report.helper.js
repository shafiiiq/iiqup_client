import { SERVICE_TYPE_FROM_PATH } from '../constants/maintenance.report.constant';

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
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] !== 'all') return { url: null, isMultiple: false };

  const pathSegment = segments[1];

  if (segments.includes('range')) {
    return { url: `/maintenance/report/histories/${regNo}/${pathSegment}/date-range/${startDate}/${endDate}${typeQuery}`, isMultiple: true };
  }
  if (segments.includes('months')) {
    return { url: `/maintenance/report/histories/${regNo}/${pathSegment}/last-months/${monthsCount}${typeQuery}`, isMultiple: true };
  }

  const plainType = SERVICE_TYPE_FROM_PATH[pathSegment] || pathSegment;
  return { url: `/maintenance/report/histories/${regNo}/${plainType}${typeQuery}`, isMultiple: true };
};

export const getChecklistLayout = (reportData) => {
  const statusMap = {};
  reportData.checklistItems?.forEach((item) => { statusMap[item.id] = item.status; });

  const items = reportData.checklistItems || [];
  const leftItems = items.slice(0, 18);
  const rightItems = items.slice(18, 35);

  return { leftItems, rightItems, statusMap };
};

export const getNextServiceDisplay = (reportData) => {
  if (reportData.nextServiceHrs === 0 || reportData.nextServiceHrs === '0') return '';
  if (reportData.fullService) return `${reportData.nextServiceHrs} - ${Number(reportData.serviceHrs) + 3000}`;
  return reportData.nextServiceHrs;
};

export const getReportHeadingTitle = (report) =>
  `PERIODIC SERVICE REPORT - ${getServiceTypeName(report.serviceType)}${report.date ? ` - ${formatDate(report.date)}` : ''}`;