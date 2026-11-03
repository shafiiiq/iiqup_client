import { apiRequest } from '@/features/core/network/api/api.request';
import { readResponseBody } from '@/features/core/messaging/notification/api/notification.response';

const ATTACHMENT_URL_LIFETIME_MS = 10 * 60 * 1000;
const LOCAL_ATTACHMENT_PREFIX = 'blob:';
const attachmentUrlCache = new Map();

export const uploadNotificationFile = async ({ context, entityId, keyPrefix }, file) => {
  const response = await apiRequest(
    '/upload/direct',
    'POST',
    {
      feature: 'notification',
      context,
      entityId,
      keyPrefix,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    },
    {},
    file
  );
  const body = await readResponseBody(response, 'Failed to upload file');
  return { filePath: body.s3Key };
};

const requestAttachmentUrl = async (filePath) => {
  const body = await readResponseBody(
    await apiRequest(`/s3/pre-signed-url?filePath=${encodeURIComponent(filePath)}`),
    'Failed to load attachment'
  );
  return body.url;
};

export const resolveAttachmentUrl = (filePath) => {
  if (filePath.startsWith(LOCAL_ATTACHMENT_PREFIX)) return Promise.resolve(filePath);
  const cachedEntry = attachmentUrlCache.get(filePath);
  if (cachedEntry && Date.now() - cachedEntry.cachedAt < ATTACHMENT_URL_LIFETIME_MS) return cachedEntry.urlPromise;

  const urlPromise = requestAttachmentUrl(filePath).catch((error) => {
    attachmentUrlCache.delete(filePath);
    throw error;
  });
  attachmentUrlCache.set(filePath, { urlPromise, cachedAt: Date.now() });
  return urlPromise;
};