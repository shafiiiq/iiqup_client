import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DISTRIBUTION_TRIGGER_PATTERN } from '../constants/notification.composer';
import { fetchDistributions } from '../services/notification.composer.service';
import { submitDistributionFromText } from '../services/notification.distribution.submit';
import { removeTrailingTrigger } from '../utils/notification.composer.triggers';
import {
  appendNewlyActiveFieldLines,
  buildDistributionGhostLines,
  buildDistributionTemplate,
  hasIntactFieldLabels,
} from '../utils/notification.distribution.fields';
import { buildFileKey, pickFiles } from '../utils/notification.file.picker';
import { useDistributionFieldSuggestions } from './useDistributionFieldSuggestions';
import { useDistributionSelectionLock } from './useDistributionSelectionLock';

export const useReplyDistribution = ({ text, setText, notificationId }) => {
  const [distributions, setDistributions] = useState([]);
  const [active, setActive] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const latestTextRef = useRef(text);
  const suspendedTextRef = useRef('');
  const { selection, changeSelection, setSelection } = useDistributionSelectionLock({
    distribution: active,
    latestTextRef,
  });

  useEffect(() => {
    latestTextRef.current = text;
  }, [text]);

  const takeSuspendedText = useCallback(() => {
    const suspendedText = suspendedTextRef.current;
    suspendedTextRef.current = '';
    return suspendedText;
  }, []);

  const fieldSuggestions = useDistributionFieldSuggestions({ distribution: active, text });

  const selectFieldSuggestion = useCallback(
    (suggestion) => setText(fieldSuggestions.apply(suggestion)),
    [fieldSuggestions.apply, setText]
  );

  const isTriggered = DISTRIBUTION_TRIGGER_PATTERN.test(text);

  useEffect(() => {
    if (!isTriggered || distributions.length > 0) return;
    fetchDistributions().then(setDistributions).catch(console.error);
  }, [isTriggered, distributions.length]);

  const suggestions = useMemo(() => {
    if (active) return [];
    const match = DISTRIBUTION_TRIGGER_PATTERN.exec(text);
    if (!match) return [];
    const query = match[2].toLowerCase();
    return distributions.filter(
      (distribution) =>
        distribution.key.toLowerCase().includes(query) || distribution.label.toLowerCase().includes(query)
    );
  }, [text, active, distributions]);

  const reset = useCallback(() => {
    setActive(null);
    setAttachments([]);
    setIsSubmitting(false);
    setErrorMessage(null);
    setSelection(null);
  }, [setSelection]);

  const select = useCallback(
    (distribution) => {
      const template = buildDistributionTemplate(distribution.fields);
      suspendedTextRef.current = removeTrailingTrigger(latestTextRef.current, DISTRIBUTION_TRIGGER_PATTERN);
      setActive(distribution);
      setAttachments([]);
      setErrorMessage(null);
      setText(template.text);
      setSelection({ start: template.cursor, end: template.cursor });
    },
    [setText, setSelection]
  );

  const discard = useCallback(() => {
    if (!active) return;
    reset();
    setText(takeSuspendedText());
  }, [active, reset, setText, takeSuspendedText]);

  const transformText = useCallback(
    (nextText) => {
      if (!active) return nextText;
      const currentText = latestTextRef.current;
      if (!hasIntactFieldLabels(currentText, nextText, active.fields)) return currentText;
      const transformedText = appendNewlyActiveFieldLines(currentText, nextText, active.fields);
      latestTextRef.current = transformedText;
      setSelection(null);
      return transformedText;
    },
    [active, setSelection]
  );

  const pickGallery = useCallback(async () => {
    const files = await pickFiles({ accept: 'image/*,video/*', multiple: true });
    if (files.length > 0) setAttachments((previousFiles) => [...previousFiles, ...files]);
  }, []);

  const pickDocument = useCallback(async () => {
    const files = await pickFiles({ multiple: true });
    if (files.length > 0) setAttachments((previousFiles) => [...previousFiles, ...files]);
  }, []);

  const removeAttachment = useCallback((fileKey) => {
    setAttachments((previousFiles) => previousFiles.filter((file) => buildFileKey(file) !== fileKey));
  }, []);

  const clearSelection = useCallback(() => setSelection(null), [setSelection]);

  const submit = useCallback(async () => {
    if (!active || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitDistributionFromText({ distribution: active, text, mediaFiles: {}, attachments, notificationId });
      reset();
      setText(takeSuspendedText());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }, [active, isSubmitting, text, attachments, notificationId, reset, setText, takeSuspendedText]);

  return {
    suggestions,
    active,
    attachments,
    isSubmitting,
    errorMessage,
    ghostLines: active ? buildDistributionGhostLines(active.fields, text) : [],
    selection,
    changeSelection,
    clearSelection,
    fieldSuggestions: fieldSuggestions.suggestions,
    selectFieldSuggestion,
    select,
    discard,
    reset,
    transformText,
    pickGallery,
    pickDocument,
    removeAttachment,
    submit,
  };
};