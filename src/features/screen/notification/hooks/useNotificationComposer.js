import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORY_COMPLETION_PATTERN,
  CATEGORY_SEARCH_DELAY_MS,
  CATEGORY_TRIGGER_PATTERN,
  DISTRIBUTION_TRIGGER_PATTERN,
  FEATURE_TRIGGER_PATTERN,
  MESSAGE_RECORDING_KEY,
} from '../constants/notification.composer';
import {
  fetchAttachmentFeatures,
  fetchCategorySuggestions,
  fetchDistributions,
} from '../services/notification.composer.service';
import { assertDistributionInput } from '../services/notification.distribution.validate';
import { withNewCategoryEntry } from '../utils/notification.category.suggestion';
import { hasComposerDraftContent } from '../utils/notification.composer.draft';
import { removeTrailingTrigger } from '../utils/notification.composer.triggers';
import {
  appendNewlyActiveFieldLines,
  buildDistributionGhostLines,
  buildDistributionTemplate,
  hasIntactFieldLabels,
} from '../utils/notification.distribution.fields';
import { buildFileKey, pickFiles } from '../utils/notification.file.picker';
import { extractMentionedCodes, replaceTrailingMention } from '../utils/notification.mention.utils';
import { useDistributionFieldSuggestions } from './useDistributionFieldSuggestions';
import { useDistributionSelectionLock } from './useDistributionSelectionLock';
import { useMentionSearch } from './useMentionSearch';
import { useVoiceRecorder } from './useVoiceRecorder';

export const useNotificationComposer = ({ onQueueMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [suspendedText, setSuspendedText] = useState('');
  const [distributions, setDistributions] = useState([]);
  const [activeDistribution, setActiveDistribution] = useState(null);
  const [categoryLabel, setCategoryLabel] = useState(null);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [pickerFeature, setPickerFeature] = useState(null);
  const [featureLinks, setFeatureLinks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [mediaFiles, setMediaFiles] = useState({});
  const [mentions, setMentions] = useState([]);
  const [recordingFieldKey, setRecordingFieldKey] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const voice = useVoiceRecorder();
  const {
    suggestions: rawMentionSuggestions,
    search: searchMentions,
    cancel: cancelMentionSearch,
  } = useMentionSearch();
  const distributionFieldSuggestions = useDistributionFieldSuggestions({ distribution: activeDistribution, text });
  const latestTextRef = useRef(text);
  const { selection, changeSelection, setSelection } = useDistributionSelectionLock({
    distribution: activeDistribution,
    latestTextRef,
  });

  useEffect(() => {
    latestTextRef.current = text;
  }, [text]);

  const selectFieldSuggestion = useCallback(
    (suggestion) => setText(distributionFieldSuggestions.apply(suggestion)),
    [distributionFieldSuggestions.apply]
  );

  const clearSelection = useCallback(() => setSelection(null), [setSelection]);

  const distributionSuggestions = useMemo(() => {
    if (activeDistribution) return [];
    const match = DISTRIBUTION_TRIGGER_PATTERN.exec(text);
    if (!match) return [];
    const query = match[2].toLowerCase();
    return distributions.filter(
      (distribution) =>
        distribution.key.toLowerCase().includes(query) || distribution.label.toLowerCase().includes(query)
    );
  }, [text, activeDistribution, distributions]);

  const categoryQuery = useMemo(() => {
    if (activeDistribution || categoryLabel) return null;
    const match = CATEGORY_TRIGGER_PATTERN.exec(text);
    return match ? match[2] : null;
  }, [text, activeDistribution, categoryLabel]);

  useEffect(() => {
    if (categoryQuery === null) {
      setCategorySuggestions([]);
      return undefined;
    }
    let isCancelled = false;
    const timerId = setTimeout(async () => {
      try {
        const foundSuggestions = await fetchCategorySuggestions(categoryQuery);
        if (!isCancelled) setCategorySuggestions(withNewCategoryEntry(foundSuggestions, categoryQuery));
      } catch {
        if (!isCancelled) setCategorySuggestions(withNewCategoryEntry([], categoryQuery));
      }
    }, CATEGORY_SEARCH_DELAY_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [categoryQuery]);

  const featureSuggestions = useMemo(() => {
    if (activeDistribution || pickerFeature) return [];
    const match = FEATURE_TRIGGER_PATTERN.exec(text);
    if (!match) return [];
    const query = match[1].toLowerCase();
    return features.filter(
      (feature) =>
        !query ||
        feature.key.toLowerCase().includes(query) ||
        feature.label.toLowerCase().includes(query) ||
        feature.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  }, [text, activeDistribution, pickerFeature, features]);

  const hasDraft = hasComposerDraftContent({
    text,
    distribution: activeDistribution,
    categoryLabel,
    attachmentCount: attachments.length,
    mediaFileCount: Object.keys(mediaFiles).length,
    featureLinkCount: featureLinks.length,
    suspendedText,
  });

  const reset = useCallback(() => {
    setText('');
    setSuspendedText('');
    setActiveDistribution(null);
    setCategoryLabel(null);
    setCategorySuggestions([]);
    setPickerFeature(null);
    setFeatureLinks([]);
    setAttachments([]);
    setMediaFiles({});
    setMentions([]);
    cancelMentionSearch();
    setSelection(null);
    setRecordingFieldKey(null);
    setIsSubmitting(false);
    setErrorMessage(null);
  }, [cancelMentionSearch, setSelection]);

  const open = useCallback(async () => {
    setIsOpen(true);
    const [distributionResult, featureResult] = await Promise.allSettled([
      fetchDistributions(),
      fetchAttachmentFeatures(),
    ]);
    if (distributionResult.status === 'fulfilled') setDistributions(distributionResult.value);
    else console.error('fetchDistributions:', distributionResult.reason);
    if (featureResult.status === 'fulfilled') setFeatures(featureResult.value);
    else console.error('fetchAttachmentFeatures:', featureResult.reason);
  }, []);

  const close = useCallback(async () => {
    if (recordingFieldKey) {
      await voice.cancelRecording().catch(console.error);
      setRecordingFieldKey(null);
    }
    cancelMentionSearch();
    if (!hasDraft) reset();
    setSelection(null);
    setIsOpen(false);
  }, [recordingFieldKey, voice, hasDraft, reset, cancelMentionSearch, setSelection]);

  const changeText = useCallback(
    (nextText) => {
      setErrorMessage(null);
      if (activeDistribution) {
        const currentText = latestTextRef.current;
        if (!hasIntactFieldLabels(currentText, nextText, activeDistribution.fields)) return;
        const transformedText = appendNewlyActiveFieldLines(currentText, nextText, activeDistribution.fields);
        latestTextRef.current = transformedText;
        setSelection(null);
        setText(transformedText);
        return;
      }
      const categoryMatch = !categoryLabel ? CATEGORY_COMPLETION_PATTERN.exec(nextText) : null;
      if (categoryMatch) {
        const remainingText = nextText.replace(CATEGORY_COMPLETION_PATTERN, '$1');
        setCategoryLabel(categoryMatch[2]);
        setText(remainingText);
        setCategorySuggestions([]);
        searchMentions(remainingText);
        return;
      }
      setText(nextText);
      searchMentions(nextText);
    },
    [activeDistribution, categoryLabel, searchMentions, setSelection]
  );

  const selectCategory = useCallback((suggestion) => {
    setCategoryLabel(suggestion.label);
    setText((previousText) => removeTrailingTrigger(previousText, CATEGORY_TRIGGER_PATTERN));
    setCategorySuggestions([]);
  }, []);

  const clearCategory = useCallback(() => setCategoryLabel(null), []);

  const selectMention = useCallback(
    (candidate) => {
      setText((previousText) => replaceTrailingMention(previousText, candidate.name));
      setMentions((previousMentions) =>
        previousMentions.some((mention) => mention.uniqueCode === candidate.uniqueCode)
          ? previousMentions
          : [...previousMentions, candidate]
      );
      cancelMentionSearch();
    },
    [cancelMentionSearch]
  );

  const selectDistribution = useCallback(
    (distribution) => {
      const template = buildDistributionTemplate(distribution.fields);
      setSuspendedText(removeTrailingTrigger(latestTextRef.current, DISTRIBUTION_TRIGGER_PATTERN));
      setActiveDistribution(distribution);
      setCategorySuggestions([]);
      setText(template.text);
      setMediaFiles({});
      cancelMentionSearch();
      setSelection({ start: template.cursor, end: template.cursor });
    },
    [cancelMentionSearch, setSelection]
  );

  const clearDistribution = useCallback(() => {
    setActiveDistribution(null);
    setText(suspendedText);
    setSuspendedText('');
    setMediaFiles({});
    setSelection(null);
  }, [suspendedText, setSelection]);

  const selectFeature = useCallback((feature) => {
    setText((previousText) => previousText.replace(/(^|\s)#[^\s#]*$/, '$1'));
    setPickerFeature(feature);
  }, []);

  const attachFeatureLink = useCallback((attachedLink) => {
    setFeatureLinks((previousLinks) =>
      previousLinks.some(
        (link) => link.featureKey === attachedLink.featureKey && link.reference === attachedLink.reference
      )
        ? previousLinks
        : [...previousLinks, attachedLink]
    );
    setPickerFeature(null);
  }, []);

  const closeFeaturePicker = useCallback(() => setPickerFeature(null), []);

  const removeFeatureLink = useCallback((index) => {
    setFeatureLinks((previousLinks) => previousLinks.filter((_, position) => position !== index));
  }, []);

  const pickMedia = useCallback(async (field) => {
    const [file] = await pickFiles({ accept: field.type === 'video' ? 'video/*' : 'image/*' });
    if (file) setMediaFiles((previousFiles) => ({ ...previousFiles, [field.key]: file }));
  }, []);

  const recordInto = useCallback(
    async (recordingKey, onRecorded) => {
      try {
        if (recordingFieldKey === recordingKey) {
          const recordedFile = await voice.stopRecording();
          setRecordingFieldKey(null);
          if (recordedFile) onRecorded(recordedFile);
          return;
        }
        if (recordingFieldKey) return;
        if (await voice.startRecording()) setRecordingFieldKey(recordingKey);
      } catch (error) {
        console.error('recordInto:', error);
        setRecordingFieldKey(null);
      }
    },
    [recordingFieldKey, voice]
  );

  const toggleAudioRecording = useCallback(
    (field) =>
      recordInto(field.key, (file) => setMediaFiles((previousFiles) => ({ ...previousFiles, [field.key]: file }))),
    [recordInto]
  );

  const toggleMessageRecording = useCallback(
    () => recordInto(MESSAGE_RECORDING_KEY, (file) => setAttachments((previousFiles) => [...previousFiles, file])),
    [recordInto]
  );

  const removeMedia = useCallback((fieldKey) => {
    setMediaFiles((previousFiles) => {
      const { [fieldKey]: removedFile, ...remainingFiles } = previousFiles;
      return remainingFiles;
    });
  }, []);

  const pickMessageMedia = useCallback(async () => {
    const files = await pickFiles({ accept: 'image/*,video/*', multiple: true });
    if (files.length > 0) setAttachments((previousFiles) => [...previousFiles, ...files]);
  }, []);

  const pickMessageDocument = useCallback(async () => {
    const files = await pickFiles({ multiple: true });
    if (files.length > 0) setAttachments((previousFiles) => [...previousFiles, ...files]);
  }, []);

  const removeAttachment = useCallback((fileKey) => {
    setAttachments((previousFiles) => previousFiles.filter((file) => buildFileKey(file) !== fileKey));
  }, []);

  const queueFreeMessage = () => {
    const message = text.trim();
    if (!message && attachments.length === 0 && featureLinks.length === 0) {
      throw new Error('Type a message or attach a file');
    }
    const mentionedCodes = extractMentionedCodes(message, mentions);
    if (mentionedCodes.length === 0 && !categoryLabel) throw new Error('Mention someone with @ to send a message');

    onQueueMessage({
      text: message,
      mentionCodes: mentionedCodes,
      categoryLabel,
      files: attachments,
      featureLinks,
    });
  };

  const queueDistribution = (distribution) => {
    assertDistributionInput({ distribution, text, mediaFiles });
    const distributionAttachments = distribution.allowsAttachments ? attachments : [];
    onQueueMessage({
      text: '',
      mentionCodes: [],
      categoryLabel: null,
      files: [...Object.values(mediaFiles), ...distributionAttachments],
      featureLinks: [],
      distribution: { definition: distribution, text, mediaFiles, attachments: distributionAttachments },
    });
  };

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (activeDistribution) {
        queueDistribution(activeDistribution);
        setActiveDistribution(null);
        setText(suspendedText);
        setSuspendedText('');
        setMediaFiles({});
        setSelection(null);
        if (activeDistribution.allowsAttachments) setAttachments([]);
        setIsSubmitting(false);
        setIsOpen(false);
        return;
      }
      queueFreeMessage();
      reset();
      setIsOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return {
    isOpen,
    text,
    selection,
    activeDistribution,
    categoryLabel,
    distributionSuggestions,
    fieldSuggestions: distributionFieldSuggestions.suggestions,
    distributionGhostLines: activeDistribution ? buildDistributionGhostLines(activeDistribution.fields, text) : [],
    selectFieldSuggestion,
    categorySuggestions,
    featureSuggestions,
    pickerFeature,
    featureLinks,
    mentionSuggestions: pickerFeature ? [] : rawMentionSuggestions,
    attachments,
    mediaFiles,
    recordingFieldKey,
    recordingDurationMillis: voice.durationMillis,
    isSubmitting,
    errorMessage,
    hasDraft,
    open,
    close,
    changeText,
    changeSelection,
    clearSelection,
    selectMention,
    selectCategory,
    clearCategory,
    selectDistribution,
    clearDistribution,
    selectFeature,
    attachFeatureLink,
    closeFeaturePicker,
    removeFeatureLink,
    pickMedia,
    toggleAudioRecording,
    toggleMessageRecording,
    pickMessageMedia,
    pickMessageDocument,
    removeAttachment,
    removeMedia,
    submit,
  };
};