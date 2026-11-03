import { useCallback, useEffect, useState } from 'react';
import { useAlert } from '@/shared/context/AlertContext';
import {
  addCategoryMembers,
  fetchCategoryMembers,
  removeCategoryMember,
} from '../services/notification.category.service';
import { searchMentionableActors } from '../services/notification.reply.service';

const SEARCH_DELAY_MS = 250;

export const useCategoryMembers = (categoryKey) => {
  const { showAlert } = useAlert();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const run = useCallback(
    async (task) => {
      try {
        setMembers(await task());
      } catch (error) {
        showAlert(error?.message || 'Something went wrong', 'error', '--color-primary');
      }
    },
    [showAlert]
  );

  useEffect(() => {
    setMembers([]);
    setQuery('');
    setSuggestions([]);
    if (!categoryKey) return;
    setIsLoading(true);
    run(() => fetchCategoryMembers(categoryKey)).finally(() => setIsLoading(false));
  }, [categoryKey, run]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setSuggestions([]);
      return undefined;
    }
    let isCancelled = false;
    const timerId = setTimeout(async () => {
      try {
        const foundCandidates = await searchMentionableActors(term);
        if (!isCancelled) {
          setSuggestions(
            foundCandidates.filter((candidate) => !members.some((member) => member.uniqueCode === candidate.uniqueCode))
          );
        }
      } catch {
        if (!isCancelled) setSuggestions([]);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [query, members]);

  const add = useCallback(
    async (candidate) => {
      if (!categoryKey) return;
      await run(() => addCategoryMembers(categoryKey, [candidate.uniqueCode]));
      setQuery('');
    },
    [categoryKey, run]
  );

  const confirmRemove = useCallback(
    (member) => {
      if (!categoryKey) return;
      if (window.confirm(`Remove ${member.name} from this category?`)) {
        run(() => removeCategoryMember(categoryKey, member.uniqueCode));
      }
    },
    [categoryKey, run]
  );

  return { members, isLoading, query, setQuery, suggestions, add, confirmRemove };
};