import { useEffect, useState } from 'react';
import { fetchFeatureDocuments } from '../services/notification.composer.service';

const DOCUMENT_SEARCH_DELAY_MS = 250;

export const useFeatureDocumentSearch = ({ featureKey, isOpen }) => {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen, featureKey]);

  useEffect(() => {
    if (!featureKey || !isOpen) return undefined;
    let isCancelled = false;
    setIsLoading(true);
    const timerId = setTimeout(async () => {
      try {
        const foundDocuments = await fetchFeatureDocuments(featureKey, query.trim());
        if (!isCancelled) setDocuments(foundDocuments);
      } catch (error) {
        console.error('fetchFeatureDocuments:', error);
        if (!isCancelled) setDocuments([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, DOCUMENT_SEARCH_DELAY_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [featureKey, isOpen, query]);

  return { query, setQuery, documents, isLoading };
};