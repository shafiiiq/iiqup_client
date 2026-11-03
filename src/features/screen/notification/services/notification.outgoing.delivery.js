import { sendComposedMessage } from './notification.composer.service';
import { submitDistributionFromText } from './notification.distribution.submit';
import { uploadAttachmentsWithProgress } from './notification.upload.service';

export const deliverOutgoingPayload = async (payload, onProgress) => {
  if (payload.distribution) {
    await submitDistributionFromText({
      distribution: payload.distribution.definition,
      text: payload.distribution.text,
      mediaFiles: payload.distribution.mediaFiles,
      attachments: payload.distribution.attachments,
      onProgress,
    });
    return;
  }

  const attachments = await uploadAttachmentsWithProgress({
    files: payload.files,
    target: { context: 'message', keyPrefix: 'notifications/messages' },
    onProgress,
  });
  await sendComposedMessage({
    text: payload.text,
    mentions: payload.mentionCodes,
    categoryLabel: payload.categoryLabel,
    attachments,
    featureLinks: payload.featureLinks.map((link) => ({ featureKey: link.featureKey, identifier: link.identifier })),
  });
};