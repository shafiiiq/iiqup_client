import { isFieldActive, isMediaField, parseDistributionValues } from '../utils/notification.distribution.fields';

export const assertDistributionInput = ({ distribution, text, mediaFiles }) => {
  const values = parseDistributionValues(text, distribution.fields);
  distribution.fields.forEach((field) => {
    if (!isFieldActive(field, values)) return;
    const value = values[field.key]?.trim() ?? '';
    const isFilled = isMediaField(field) ? Boolean(mediaFiles[field.key]) : value.length > 0;
    if (field.required && !isFilled) throw new Error(`${field.label} is required`);
    if (field.type === 'number' && value && Number.isNaN(Number(value))) {
      throw new Error(`${field.label} must be a number`);
    }
  });
};