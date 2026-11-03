import { DEFAULT_CHECKLIST } from '../../constants/maintenance.constant';
import { formatDate, getServiceTypeLabel } from '../../helper/maintenance.helper';
import { CHECKLIST_LEFT_COLUMN_SIZE, CHECKLIST_TOTAL_SIZE } from '../constants/maintenance.report.constant';

export const getChecklistLayout = (report) => {
  const items = report.checklistItems?.length ? report.checklistItems : DEFAULT_CHECKLIST;
  const statusMap = {};
  items.forEach((item) => { statusMap[item.id] = item.status; });

  return {
    leftItems: items.slice(0, CHECKLIST_LEFT_COLUMN_SIZE),
    rightItems: items.slice(CHECKLIST_LEFT_COLUMN_SIZE, CHECKLIST_TOTAL_SIZE),
    statusMap,
  };
};

export const getNextServiceDisplay = (report) => {
  if (report.nextServiceHrs === '0') return '';
  if (report.fullService) return `${report.nextServiceHrs} - ${Number(report.serviceHrs) + 3000}`;
  return report.nextServiceHrs;
};

export const getReportHeadingTitle = (report) =>
  `PERIODIC SERVICE REPORT - ${getServiceTypeLabel(report.serviceType)}${report.date ? ` - ${formatDate(report.date)}` : ''}`;