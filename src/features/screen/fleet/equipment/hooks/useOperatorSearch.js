import { useSearch as useGlobalSearch } from '@/shared/search/useSearch';
import { SEARCH_SOURCES } from '@/shared/search/search.constant';

export const useOperatorSearch = (initialOperators = []) => {
  const globalSearch = useGlobalSearch({ source: SEARCH_SOURCES.OPERATORS });

  const searchOperators = (query) => {
    if (!query || !query.trim()) {
      globalSearch.clear();
      return;
    }
    globalSearch.search(query.trim());
  };

  const operators = globalSearch.query ? globalSearch.results : initialOperators;

  return { operators, searchOperators, clear: globalSearch.clear };
};