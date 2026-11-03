import { useState, useEffect } from 'react';
import { loadSpellChecker } from '../helper/maintenance.spellchecker.loader';

export const useSpellChecker = () => {
  const [spellChecker, setSpellChecker] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    loadSpellChecker()
      .then((loadedSpellChecker) => {
        if (!isCancelled) setSpellChecker(loadedSpellChecker);
      })
      .catch((error) => console.error('[useSpellChecker] loadSpellChecker:', error));

    return () => {
      isCancelled = true;
    };
  }, []);

  return spellChecker;
};