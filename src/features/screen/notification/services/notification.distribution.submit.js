import { isFieldActive, isMediaField, parseDistributionValues } from '../utils/notification.distribution.fields';
import { submitDistribution } from './notification.composer.service';
import { uploadAttachmentsWithProgress } from './notification.upload.service';

const IGNORE_PROGRESS = () => undefined;

export const submitDistributionFromText = async ({
  distribution,
  text,
  mediaFiles,
  attachments,
  notificationId,
  onProgress = IGNORE_PROGRESS,
}) => {
  const values = parseDistributionValues(text, distribution.fields);
  const payload = {};
  const mediaFieldKeys = distribution.fields
    .filter((field) => isFieldActive(field, values) && isMediaField(field) && mediaFiles[field.key])
    .map((field) => field.key);
  const attachmentFiles = distribution.allowsAttachments ? attachments : [];
  const uploadedAttachments = await uploadAttachmentsWithProgress({
    files: [...mediaFieldKeys.map((fieldKey) => mediaFiles[fieldKey]), ...attachmentFiles],
    target: {
      context: 'distribution',
      entityId: distribution.key,
      keyPrefix: `notifications/distributions/${distribution.key}`,
    },
    onProgress,
  });

  for (const field of distribution.fields) {
    if (!isFieldActive(field, values)) continue;

    if (isMediaField(field)) {
      const mediaIndex = mediaFieldKeys.indexOf(field.key);
      if (mediaIndex === -1) {
        if (field.required) throw new Error(`${field.label} is required`);
        continue;
      }
      payload[field.key] = uploadedAttachments[mediaIndex];
      continue;
    }

    const value = values[field.key]?.trim() ?? '';
    if (!value) {
      if (field.required) throw new Error(`${field.label} is required`);
      continue;
    }
    if (field.type === 'number') {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) throw new Error(`${field.label} must be a number`);
      payload[field.key] = numericValue;
      continue;
    }
    payload[field.key] = value;
  }

  if (attachmentFiles.length > 0) {
    payload.attachments = uploadedAttachments.slice(mediaFieldKeys.length).map((attachment, index) => ({
      ...attachment,
      fileSize: attachmentFiles[index].size,
    }));
  }

  await submitDistribution(distribution.key, payload, notificationId);
};