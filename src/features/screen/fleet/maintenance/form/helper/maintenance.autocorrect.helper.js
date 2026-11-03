import {
  WORD_BOUNDARY_PATTERN,
  TRAILING_WORD_PATTERN,
  MIN_AUTOCORRECT_WORD_LENGTH,
  MAX_SUGGESTION_LENGTH_DIFFERENCE,
} from '../constants/maintenance.autocorrect.constant';

const findCorrection = (spellChecker, typedWord) => {
  const lowerCaseWord = typedWord.toLowerCase();
  if (lowerCaseWord.length < MIN_AUTOCORRECT_WORD_LENGTH || spellChecker.correct(lowerCaseWord)) return null;

  const suggestion = spellChecker
    .suggest(lowerCaseWord)
    .find(
      (candidate) =>
        /^[a-z']+$/.test(candidate) &&
        candidate[0] === lowerCaseWord[0] &&
        Math.abs(candidate.length - lowerCaseWord.length) <= MAX_SUGGESTION_LENGTH_DIFFERENCE
    );

  return suggestion ? suggestion.toUpperCase() : null;
};

export const autocorrectCompletedWord = ({ text, caretPosition, spellChecker }) => {
  if (!spellChecker) return { text, caretPosition };

  const typedCharacter = text[caretPosition - 1];
  if (!typedCharacter || !WORD_BOUNDARY_PATTERN.test(typedCharacter)) return { text, caretPosition };

  const textBeforeBoundary = text.slice(0, caretPosition - 1);
  const trailingWordMatch = TRAILING_WORD_PATTERN.exec(textBeforeBoundary);
  if (!trailingWordMatch) return { text, caretPosition };

  const typedWord = trailingWordMatch[0];
  const correctedWord = findCorrection(spellChecker, typedWord);
  if (!correctedWord) return { text, caretPosition };

  const wordStartPosition = textBeforeBoundary.length - typedWord.length;

  return {
    text: text.slice(0, wordStartPosition) + correctedWord + text.slice(caretPosition - 1),
    caretPosition: caretPosition + correctedWord.length - typedWord.length,
  };
};