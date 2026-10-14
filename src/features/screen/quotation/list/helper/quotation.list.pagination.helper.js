export const PAGE_SIZE = 20;

export const resolveHasMore = (response, rowCount) => {
  const pagination = response?.pagination;
  if (pagination && typeof pagination.hasNextPage === 'boolean') return pagination.hasNextPage;
  if (pagination?.totalPages) return (pagination.page ?? pagination.currentPage ?? 1) < pagination.totalPages;
  return rowCount >= PAGE_SIZE;
};