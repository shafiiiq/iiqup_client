import { parseDistributionValues } from './notification.distribution.fields';

const hasFilledDistributionValue = (text, distribution) =>
  Object.values(parseDistributionValues(text, distribution.fields)).some((value) => value.trim().length > 0);

export const hasComposerDraftContent = ({
  text,
  distribution,
  categoryLabel,
  attachmentCount,
  mediaFileCount,
  featureLinkCount,
  suspendedText,
}) => {
  if (attachmentCount > 0 || mediaFileCount > 0 || featureLinkCount > 0) return true;
  if (suspendedText.trim().length > 0) return true;
  if (distribution) return hasFilledDistributionValue(text, distribution);
  return text.trim().length > 0 || Boolean(categoryLabel);
};