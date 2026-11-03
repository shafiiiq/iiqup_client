import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchFieldSuggestions } from '../services/notification.composer.service';
import {
  appendNewlyActiveFieldLines,
  findChangedFieldKey,
  parseDistributionValues,
  replaceFieldValues,
} from '../utils/notification.distribution.fields';

const SUGGESTION_DELAY_MS = 250;

export const useDistributionFieldSuggestions = ({ distribution, text }) => {
  const [activeFieldKey, setActiveFieldKey] = useState(null);
  const [remoteSuggestions, setRemoteSuggestions] = useState([]);
  const previousTextRef = useRef('');

  useEffect(() => {
    if (!distribution) {
      previousTextRef.current = '';
      setActiveFieldKey(null);
      return;
    }
    setActiveFieldKey(findChangedFieldKey(previousTextRef.current, text, distribution.fields));
    previousTextRef.current = text;
  }, [text, distribution]);

  const activeField = useMemo(
    () => distribution?.fields.find((field) => field.key === activeFieldKey) ?? null,
    [distribution, activeFieldKey]
  );

  const activeQuery = useMemo(
    () =>
      distribution && activeField
        ? (parseDistributionValues(text, distribution.fields)[activeField.key] ?? '').trim()
        : '',
    [distribution, activeField, text]
  );

  useEffect(() => {
    if (!distribution || !activeField?.hasRemoteSuggestions || !activeQuery) {
      setRemoteSuggestions([]);
      return undefined;
    }
    let isCancelled = false;
    const timerId = setTimeout(async () => {
      try {
        const foundSuggestions = await fetchFieldSuggestions(distribution.key, activeField.key, activeQuery);
        if (!isCancelled) setRemoteSuggestions(foundSuggestions);
      } catch {
        if (!isCancelled) setRemoteSuggestions([]);
      }
    }, SUGGESTION_DELAY_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [distribution?.key, activeField?.key, activeField?.hasRemoteSuggestions, activeQuery]);

  const suggestions = useMemo(() => {
    if (!activeField) return [];
    const loweredQuery = activeQuery.toLowerCase();
    if (activeField.options) {
      return activeField.options
        .filter((option) => option.toLowerCase().includes(loweredQuery) && option.toLowerCase() !== loweredQuery)
        .map((option) => ({ value: option, label: option }));
    }
    return remoteSuggestions.filter((suggestion) => suggestion.value.toLowerCase() !== loweredQuery);
  }, [activeField, activeQuery, remoteSuggestions]);

  const apply = useCallback(
    (suggestion) => {
      if (!distribution || !activeField) return text;
      const replacedText = replaceFieldValues(text, distribution.fields, {
        [activeField.key]: suggestion.value,
        ...suggestion.fills,
      });
      const nextText = appendNewlyActiveFieldLines(text, replacedText, distribution.fields);
      previousTextRef.current = nextText;
      setActiveFieldKey(null);
      setRemoteSuggestions([]);
      return nextText;
    },
    [distribution, activeField, text]
  );

  return { suggestions, apply };
};