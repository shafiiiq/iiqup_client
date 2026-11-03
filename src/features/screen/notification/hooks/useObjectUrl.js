import { useEffect, useState } from 'react';

export const useObjectUrl = (file) => {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return undefined;
    }
    const createdUrl = URL.createObjectURL(file);
    setObjectUrl(createdUrl);
    return () => URL.revokeObjectURL(createdUrl);
  }, [file]);

  return objectUrl;
};