import nspell from 'nspell';
import {
  MAINTENANCE_DOMAIN_WORDS,
  SPELLCHECK_AFFIX_URL,
  SPELLCHECK_DICTIONARY_URL,
} from '../constants/maintenance.autocorrect.constant';

let spellCheckerPromise = null;

const fetchDictionaryText = async (url) => {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || contentType.includes('text/html')) {
    throw new Error(`Dictionary file not served at ${url}`);
  }
  return response.text();
};

export const loadSpellChecker = () => {
  if (!spellCheckerPromise) {
    spellCheckerPromise = Promise.all([
      fetchDictionaryText(SPELLCHECK_AFFIX_URL),
      fetchDictionaryText(SPELLCHECK_DICTIONARY_URL),
    ]).then(([affixData, dictionaryData]) => {
      const spellChecker = nspell(affixData, dictionaryData);
      MAINTENANCE_DOMAIN_WORDS.forEach((word) => spellChecker.add(word));
      return spellChecker;
    });
    spellCheckerPromise.catch(() => {
      spellCheckerPromise = null;
    });
  }
  return spellCheckerPromise;
};