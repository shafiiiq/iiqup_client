import {
  buildOriginalHireOrderDocument,
  buildAmendedHireOrderDocument,
} from '../../report/helper/hire.order.report.document.helper';

export const IMPORT_PAGE_SIZE = 20;

export const resolveHasMore = (response, rowCount) => {
  const pagination = response?.pagination;
  if (pagination && typeof pagination.hasNextPage === 'boolean') return pagination.hasNextPage;
  if (pagination?.totalPages) return (pagination.page ?? pagination.currentPage ?? 1) < pagination.totalPages;
  return rowCount >= IMPORT_PAGE_SIZE;
};

export const buildHireOrderPreviewViews = (hireOrder) => {
  const original = buildOriginalHireOrderDocument(hireOrder);
  const amendmentCount = hireOrder.isAmendmented ? hireOrder.amendments?.length || 0 : 0;
  const amended = amendmentCount > 0 ? buildAmendedHireOrderDocument(hireOrder, original, amendmentCount) : null;
  return { original, amended };
};