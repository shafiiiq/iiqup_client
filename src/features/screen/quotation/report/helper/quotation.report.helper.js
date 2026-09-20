export const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const isTermHeading = (term) => typeof term === 'string' && term.startsWith('## ');

export const getTermText = (term) => (isTermHeading(term) ? term.slice(3) : term);

export const buildTermNumbers = (terms) => {
  let count = 0;
  return terms.map((term) => (isTermHeading(term) ? null : ++count));
};

export const splitHeaderLabel = (label = '') => {
  if (!label) return [label];
  const slashIndex = label.indexOf('/');
  if (slashIndex !== -1 && slashIndex < label.length - 1) {
    return [label.slice(0, slashIndex + 1), label.slice(slashIndex + 1).trim()];
  }
  if (label.length > 18) {
    const mid = Math.floor(label.length / 2);
    let breakAt = label.lastIndexOf(' ', mid);
    if (breakAt === -1) breakAt = label.indexOf(' ', mid);
    if (breakAt !== -1) return [label.slice(0, breakAt).trim(), label.slice(breakAt).trim()];
  }
  return [label];
};