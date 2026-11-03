import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FEATURE_TRIGGER_PATTERN } from '../constants/notification.composer';
import { fetchAttachmentFeatures } from '../services/notification.composer.service';

export const stripFeatureTrigger = (text) => text.replace(/(^|\s)#[^\s#]*$/, '$1');

export const useFeatureAttachment = (text) => {
  const [features, setFeatures] = useState([]);
  const isLoadingFeaturesRef = useRef(false);
  const [pickerFeature, setPickerFeature] = useState(null);
  const [links, setLinks] = useState([]);

  const isTriggered = FEATURE_TRIGGER_PATTERN.test(text);

  useEffect(() => {
    if (!isTriggered || features.length > 0 || isLoadingFeaturesRef.current) return;
    isLoadingFeaturesRef.current = true;
    fetchAttachmentFeatures()
      .then(setFeatures)
      .catch(console.error)
      .finally(() => {
        isLoadingFeaturesRef.current = false;
      });
  }, [isTriggered, features.length]);

  const suggestions = useMemo(() => {
    if (pickerFeature) return [];
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
  }, [text, pickerFeature, features]);

  const select = useCallback((feature) => {
    setPickerFeature(feature);
  }, []);

  const attachLink = useCallback((attachedLink) => {
    setLinks((currentLinks) =>
      currentLinks.some(
        (link) => link.featureKey === attachedLink.featureKey && link.reference === attachedLink.reference
      )
        ? currentLinks
        : [...currentLinks, attachedLink]
    );
    setPickerFeature(null);
  }, []);

  const closePicker = useCallback(() => setPickerFeature(null), []);

  const removeLink = useCallback((index) => {
    setLinks((previousLinks) => previousLinks.filter((_, position) => position !== index));
  }, []);

  const reset = useCallback(() => {
    setPickerFeature(null);
    setLinks([]);
  }, []);

  return { suggestions, pickerFeature, links, select, attachLink, closePicker, removeLink, reset };
};