import { uploadNotificationFile } from './notification.attachment.service';

export const uploadAttachmentsWithProgress = async ({ files, target, onProgress }) => {
  if (files.length === 0) return [];

  const totalBytes = files.reduce((total, file) => total + Math.max(file.size, 1), 0);
  const uploadedAttachments = [];
  let completedBytes = 0;
  onProgress(0);

  for (const file of files) {
    const { filePath } = await uploadNotificationFile(target, file);
    completedBytes += Math.max(file.size, 1);
    onProgress(Math.min(1, completedBytes / totalBytes));
    uploadedAttachments.push({ filePath, fileName: file.name, mimeType: file.type });
  }

  return uploadedAttachments;
};