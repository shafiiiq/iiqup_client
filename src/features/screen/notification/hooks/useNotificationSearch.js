import { useEffect, useState } from 'react';
import { searchNotifications } from '../services/notification.list.service';

const SEARCH_DEBOUNCE_MS = 400;

export const useNotificationSearch = (query) => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return undefined;
    }
    let isCancelled = false;
    const timerId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const foundItems = await searchNotifications(term);
        if (!isCancelled) setResults(foundItems);
      } catch (error) {
        console.error('searchNotifications:', error);
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [query]);

  return { results, isSearching };
};