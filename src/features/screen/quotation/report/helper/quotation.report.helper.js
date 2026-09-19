export const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const isTermHeading = (term) => typeof term === 'string' && term.startsWith('## ');

export const getTermText = (term) => (isTermHeading(term) ? term.slice(3) : term);

export const buildTermNumbers = (terms) => {
  let count = 0;
  return terms.map((term) => (isTermHeading(term) ? null : ++count));
};