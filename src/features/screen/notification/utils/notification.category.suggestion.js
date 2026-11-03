export const withNewCategoryEntry = (foundSuggestions, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return foundSuggestions;
  const hasExactMatch = foundSuggestions.some(
    (suggestion) =>
      suggestion.key.toLowerCase() === normalizedQuery || suggestion.label.toLowerCase() === normalizedQuery
  );
  return hasExactMatch ? foundSuggestions : [...foundSuggestions, { key: '', label: query.trim(), isNew: true }];
};