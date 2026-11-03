import { useCallback, useEffect, useRef, useState } from 'react';
import { MENTION_SEARCH_DELAY_MS, TRAILING_MENTION_PATTERN } from '../constants/notification.composer';
import { searchMentionableActors } from '../services/notification.reply.service';

export const useMentionSearch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    clearTimer();
    requestIdRef.current += 1;
    setSuggestions([]);
  }, [clearTimer]);

  const search = useCallback(
    (text) => {
      clearTimer();
      requestIdRef.current += 1;
      const match = TRAILING_MENTION_PATTERN.exec(text);
      if (!match) {
        setSuggestions([]);
        return;
      }
      const requestId = requestIdRef.current;
      timerRef.current = setTimeout(async () => {
        try {
          const foundSuggestions = await searchMentionableActors(match[1]);
          if (requestId === requestIdRef.current) setSuggestions(foundSuggestions);
        } catch {
          if (requestId === requestIdRef.current) setSuggestions([]);
        }
      }, MENTION_SEARCH_DELAY_MS);
    },
    [clearTimer]
  );

  useEffect(
    () => () => {
      clearTimer();
      requestIdRef.current += 1;
    },
    [clearTimer]
  );

  return { suggestions, search, cancel };
};