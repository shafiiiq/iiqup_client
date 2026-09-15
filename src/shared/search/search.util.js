export const buildSearchUrl = ({ source, field, q, page = 1, limit = 20 }) => {
  const params = new URLSearchParams();
  if (source) params.set('source', source);
  if (field) params.set('field', field);
  if (q) params.set('q', q);
  params.set('page', page);
  params.set('limit', limit);
  return `/search?${params.toString()}`;
};

const SOURCE_TYPE_LABEL = {
  mechanics: 'Mechanic',
  operators: 'Operator',
  users: 'Staff User',
};

export const extractSearchResult = (responseJson, source) => {
  const sourceList = Array.isArray(source) ? source : String(source).split(',');
  const merged = sourceList.flatMap((s) =>
    (responseJson?.results?.[s]?.data ?? []).map((item) => ({
      ...item,
      type: SOURCE_TYPE_LABEL[s] || s,
    }))
  );
  const firstResult = responseJson?.results?.[sourceList[0]] ?? {};
  return {
    results: merged,
    source: source ?? null,
    query: responseJson?.query ?? '',
    currentPage: firstResult.pagination?.currentPage ?? 1,
    totalPages: firstResult.pagination?.totalPages ?? 1,
    totalCount: firstResult.pagination?.totalCount ?? 0,
    hasMore: firstResult.pagination?.hasMore ?? false,
  };
};