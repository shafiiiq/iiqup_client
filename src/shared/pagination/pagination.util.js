import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from './pagination.constant';

export const normalizePagination = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const safePage = Number(page) > 0 ? Number(page) : DEFAULT_PAGE;
  let safeLimit = Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;
  if (safeLimit > MAX_LIMIT) safeLimit = MAX_LIMIT;
  return { page: safePage, limit: safeLimit };
};

export const appendPaginationToUrl = (url, pagination) => {
  const { page, limit } = normalizePagination(pagination);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}page=${page}&limit=${limit}`;
};

export const mergePaginationIntoBody = (body, pagination) => {
  const { page, limit } = normalizePagination(pagination);
  const baseBody = body && typeof body === 'object' && !(body instanceof FormData) ? body : {};
  return { ...baseBody, page, limit };
};

export const extractPaginationResult = (responseJson) => ({
  data: responseJson?.data ?? [],
  currentPage: responseJson?.pagination?.currentPage ?? DEFAULT_PAGE,
  totalPages: responseJson?.pagination?.totalPages ?? 1,
  totalCount: responseJson?.pagination?.totalCount ?? 0,
  hasMore: responseJson?.pagination?.hasMore ?? false,
});