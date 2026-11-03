import { useEffect, useMemo, useState } from 'react';
import { fetchExpiryTracking } from '../api/document.api';
import { groupByExpiryBucket } from '../helper/documentExpiry.helper';

export const useDocumentExpiry = ({ isActive, showToast }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isActive) return undefined;
    let isCancelled = false;
    setIsLoading(true);
    fetchExpiryTracking()
      .then((data) => {
        if (!isCancelled) setDocuments(data);
      })
      .catch((error) => {
        if (!isCancelled) showToast(`Error: ${error.message}`, 'error');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [isActive, showToast]);

  const groups = useMemo(() => groupByExpiryBucket(documents), [documents]);

  return { groups, isLoading };
};