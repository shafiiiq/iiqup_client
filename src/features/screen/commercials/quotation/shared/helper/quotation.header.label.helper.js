export const hasMarkup = (label = '') => /<[^>]+>/.test(label);

const HTML_ENTITY_REPLACEMENTS = [
  [/&nbsp;/g, ' '],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&amp;/g, '&'],
];

export const decodeHeaderLabelEntities = (label = '') =>
  HTML_ENTITY_REPLACEMENTS.reduce(
    (decodedLabel, [entityPattern, replacement]) => decodedLabel.replace(entityPattern, replacement),
    label
  );

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