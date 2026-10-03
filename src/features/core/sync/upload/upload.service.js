import {
  initiateUploadSession,
  requestPartUrls,
  completeUploadSession,
  abortUploadSession,
} from './upload.api';
import {
  PART_UPLOAD_CONCURRENCY,
  PART_URL_BATCH_SIZE,
  MAXIMUM_PART_ATTEMPTS,
  PART_RETRY_DELAY_MILLISECONDS,
} from './upload.constant';
import { splitIntoChunks, waitForMilliseconds, runWithConcurrency, putBlobWithProgress } from './upload.helper';

export const uploadFile = async ({ file, feature, context, entityId, keyPrefix, onProgress }) => {
  if (!file || file.size === 0) throw new Error('Cannot upload an empty file');

  const session = await initiateUploadSession({
    feature,
    context,
    entityId,
    keyPrefix,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
  });

  const uploadedBytesByPartNumber = new Map();

  const reportProgress = () => {
    if (!onProgress) return;
    let uploadedBytes = 0;
    uploadedBytesByPartNumber.forEach((bytes) => {
      uploadedBytes += bytes;
    });
    onProgress(Math.min(100, Math.round((uploadedBytes / file.size) * 100)));
  };

  const uploadPart = async ({ partNumber, url }) => {
    const startByte = (partNumber - 1) * session.partSize;
    const partBlob = file.slice(startByte, Math.min(startByte + session.partSize, file.size));

    for (let attempt = 1; attempt <= MAXIMUM_PART_ATTEMPTS; attempt += 1) {
      try {
        uploadedBytesByPartNumber.set(partNumber, 0);
        const entityTag = await putBlobWithProgress({
          url,
          blob: partBlob,
          onProgress: (loadedBytes) => {
            uploadedBytesByPartNumber.set(partNumber, loadedBytes);
            reportProgress();
          },
        });
        uploadedBytesByPartNumber.set(partNumber, partBlob.size);
        reportProgress();
        return { partNumber, etag: entityTag, size: partBlob.size };
      } catch (error) {
        if (attempt === MAXIMUM_PART_ATTEMPTS) throw error;
        await waitForMilliseconds(PART_RETRY_DELAY_MILLISECONDS * attempt);
      }
    }
    return null;
  };

  try {
    const allPartNumbers = Array.from({ length: session.totalParts }, (_, index) => index + 1);
    const uploadedParts = [];

    for (const partNumberBatch of splitIntoChunks(allPartNumbers, PART_URL_BATCH_SIZE)) {
      const { urls } = await requestPartUrls({ sessionId: session.sessionId, partNumbers: partNumberBatch });
      await runWithConcurrency(urls, PART_UPLOAD_CONCURRENCY, async (partUrl) => {
        uploadedParts.push(await uploadPart(partUrl));
      });
    }

    await completeUploadSession({ sessionId: session.sessionId, parts: uploadedParts });
    return { sessionId: session.sessionId, s3Key: session.s3Key };
  } catch (error) {
    await abortUploadSession(session.sessionId).catch(() => null);
    throw error;
  }
};