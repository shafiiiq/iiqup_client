import { MEDIA_FIELD_TYPES } from '../constants/notification.composer';

export const isMediaField = (field) => MEDIA_FIELD_TYPES.includes(field.type);

export const parseDistributionValues = (text, fields) => {
  const textFields = fields.filter((field) => !isMediaField(field));
  const values = {};
  let currentKey = null;

  text.split('\n').forEach((line) => {
    const matchedField = textFields.find((field) => line.startsWith(`${field.label}:`));
    if (matchedField) {
      currentKey = matchedField.key;
      values[matchedField.key] = line.slice(matchedField.label.length + 1).trim();
      return;
    }
    if (currentKey) values[currentKey] = `${values[currentKey]}\n${line}`.trim();
  });

  return values;
};

export const isFieldActive = (field, values) =>
  !field.showWhen || (values[field.showWhen.field] ?? '').trim().toLowerCase() === field.showWhen.equals;

export const buildDistributionGhostLines = (fields, text) => {
  const textFields = fields.filter((field) => !isMediaField(field));
  return text.split('\n').map((line) => {
    const matchedField = textFields.find((field) => line.trim() === `${field.label}:`);
    const separator = line.endsWith(' ') ? '' : ' ';
    return { typed: line, example: matchedField?.example ? `${separator}${matchedField.example}` : '' };
  });
};

export const findChangedFieldKey = (previousText, nextText, fields) => {
  const previousLines = previousText.split('\n');
  const nextLines = nextText.split('\n');
  const changedIndex = nextLines.findIndex((line, index) => line !== previousLines[index]);
  if (changedIndex === -1) return null;
  const matchedField = fields.find(
    (field) => !isMediaField(field) && nextLines[changedIndex].startsWith(`${field.label}:`)
  );
  return matchedField?.key ?? null;
};

export const replaceFieldValues = (text, fields, valuesByKey) => {
  const lines = text.split('\n');
  Object.entries(valuesByKey).forEach(([key, value]) => {
    const field = fields.find((candidate) => candidate.key === key);
    if (!field) return;
    const lineText = `${field.label}: ${value}`;
    const lineIndex = lines.findIndex((line) => line.startsWith(`${field.label}:`));
    if (lineIndex === -1) lines.push(lineText);
    else lines[lineIndex] = lineText;
  });
  return lines.join('\n');
};

export const buildDistributionTemplate = (fields) => {
  const templateFields = fields.filter((field) => !isMediaField(field) && isFieldActive(field, {}));
  return {
    text: templateFields.map((field) => `${field.label}: `).join('\n'),
    cursor: templateFields.length > 0 ? `${templateFields[0].label}: `.length : 0,
  };
};

export const appendNewlyActiveFieldLines = (previousText, nextText, fields) => {
  const textFields = fields.filter((field) => !isMediaField(field));
  const previousValues = parseDistributionValues(previousText, textFields);
  const nextValues = parseDistributionValues(nextText, textFields);
  const nextLines = nextText.split('\n');
  const addedLines = textFields
    .filter((field) => isFieldActive(field, nextValues) && !isFieldActive(field, previousValues))
    .filter((field) => !nextLines.some((line) => line.startsWith(`${field.label}:`)))
    .map((field) => `${field.label}: `);

  if (addedLines.length === 0) return nextText;
  return `${nextText}${nextText.endsWith('\n') ? '' : '\n'}${addedLines.join('\n')}`;
};

export const buildDistributionText = (fields, values) =>
  fields
    .filter((field) => !isMediaField(field) && isFieldActive(field, values))
    .map((field) => `${field.label}: ${values[field.key] ?? ''}`)
    .join('\n');

export const buildFilledDistributionText = (fields, text) => {
  const values = parseDistributionValues(text, fields);
  return fields
    .filter((field) => !isMediaField(field) && isFieldActive(field, values) && (values[field.key] ?? '').trim())
    .map((field) => `${field.label}: ${values[field.key].trim()}`)
    .join('\n');
};

export const hasIntactFieldLabels = (previousText, nextText, fields) => {
  const previousLines = previousText.split('\n');
  const nextLines = nextText.split('\n');
  return fields
    .filter((field) => !isMediaField(field))
    .every((field) => {
      const labelPrefix = `${field.label}:`;
      const hadLabel = previousLines.some((line) => line.startsWith(labelPrefix));
      return !hadLabel || nextLines.some((line) => line.startsWith(labelPrefix));
    });
};

export const resolveEditableSelection = (text, selection, fields) => {
  const labelPrefixes = fields.filter((field) => !isMediaField(field)).map((field) => `${field.label}:`);
  const lines = text.split('\n');
  const lineStarts = [];
  let offset = 0;
  lines.forEach((line) => {
    lineStarts.push(offset);
    offset += line.length + 1;
  });

  const clampPosition = (position) => {
    let lineIndex = 0;
    lineStarts.forEach((lineStart, index) => {
      if (position >= lineStart) lineIndex = index;
    });
    const line = lines[lineIndex];
    const labelPrefix = labelPrefixes.find((candidate) => line.startsWith(candidate));
    if (!labelPrefix) return position;
    const valueStart = lineStarts[lineIndex] + labelPrefix.length + (line[labelPrefix.length] === ' ' ? 1 : 0);
    return Math.max(position, valueStart);
  };

  const start = clampPosition(selection.start);
  const end = Math.max(start, clampPosition(selection.end));
  return start === selection.start && end === selection.end ? null : { start, end };
};